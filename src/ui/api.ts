export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = Record<string, unknown>>(
  workspace: string,
  path: string,
  method = 'GET',
  body?: unknown,
  version?: number,
  key?: string,
): Promise<T> {
  const serialized = body === undefined ? undefined : JSON.stringify(body);
  let pendingSlot: string | undefined,
    commandKey = key;
  if (method !== 'GET' && !key) {
    const identity = JSON.stringify([workspace, path, method, version ?? null, serialized ?? null]);
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity))),
    )
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
    pendingSlot = 'lettercape.command.' + hash;
    try {
      commandKey = sessionStorage.getItem(pendingSlot) ?? undefined;
    } catch {}
    commandKey ??= crypto.randomUUID();
    try {
      sessionStorage.setItem(pendingSlot, commandKey);
    } catch {}
  }
  const res = await fetch('/v1/' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Workspace-Id': workspace,
      ...(method !== 'GET' ? { 'Idempotency-Key': commandKey ?? crypto.randomUUID() } : {}),
      ...(version ? { 'If-Match': `"draft-${version}"` } : {}),
    },
    body: serialized,
  });
  const json = await res.json();
  // Keep command identity on lost/malformed/5xx responses. No secret or payload is stored.
  if (pendingSlot && (res.ok || res.status < 500)) {
    try {
      sessionStorage.removeItem(pendingSlot);
    } catch {}
  }
  if (!res.ok)
    throw new ApiError(
      json.error?.code ?? 'REQUEST_FAILED',
      json.error?.message ?? 'Request failed',
      res.status,
    );

  return json as T;
}
export async function poll<T>(workspace: string, id: string, signal?: AbortSignal): Promise<T> {
  let wait = 1000;
  for (;;) {
    if (signal?.aborted) throw new Error('View interrupted. Your operation remains available.');
    const r = await api<{ operation: { state: string; result: T; error?: { message: string } } }>(
      workspace,
      'operations/' + id,
    );
    if (r.operation.state === 'succeeded') return r.operation.result;
    if (r.operation.state === 'failed' || r.operation.state === 'cancelled')
      throw new Error(r.operation.error?.message ?? 'Operation cancelled');
    await new Promise((resolve) => setTimeout(resolve, wait));
    wait = Math.min(5000, Math.round(wait * 1.4));
  }
}
