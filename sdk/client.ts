import type { operations } from './schema';
import { operationRegistry } from './operations';
export type OperationId = keyof operations;
type Op<I extends OperationId> = operations[I];
type Params<I extends OperationId> = Op<I> extends { parameters: infer P } ? P : never;
type Path<I extends OperationId> = Params<I> extends { path: infer P } ? P : never;
type Query<I extends OperationId> = Params<I> extends { query?: infer Q } ? NonNullable<Q> : never;
type Body<I extends OperationId> =
  Op<I> extends { requestBody: { content: { 'application/octet-stream': unknown } } }
    ? Uint8Array | ArrayBuffer | Blob
    : Op<I> extends { requestBody: { content: { 'application/json': infer B } } } ? B : never;
type SuccessResponse<I extends OperationId> =
  Op<I> extends { responses: infer R }
    ? R extends { 200: infer S }
      ? S
      : R extends { 201: infer S }
        ? S
        : R extends { 202: infer S }
          ? S
          : never
    : never;
export type ResultData<I extends OperationId> =
  SuccessResponse<I> extends { content: { 'application/json': infer D } } ? D : Uint8Array;
export type CallOptions<I extends OperationId> = {
  query?: Query<I>;
  signal?: AbortSignal;
  idempotencyKey?: string;
  ifMatch?: string;
} & ([Path<I>] extends [never] ? { path?: never } : { path: Path<I> }) &
  ([Body<I>] extends [never] ? { body?: never } : { body: Body<I> }) &
  ((typeof operationRegistry)[I]['binaryBody'] extends true ? {uploadToken:string} : {uploadToken?:never});
type RequiredFields<T> = { [K in keyof T]-?: object extends Pick<T, K> ? never : K }[keyof T];
type Args<I extends OperationId> = [RequiredFields<CallOptions<I>>] extends [never]
  ? [input?: CallOptions<I>]
  : [input: CallOptions<I>];
export type PageOperation = {
  [I in OperationId]: (typeof operationRegistry)[I]['paged'] extends true ? I : never;
}[OperationId];
export type SdkResult<T> = {
  data: T;
  requestId: string;
  status: number;
  headers: Headers;
  idempotencyKey?: string;
};
export class LettercapeError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public requestId: string | null,
    public details?: unknown,
    public idempotencyKey?: string,
  ) {
    super(message);
    this.name = 'LettercapeError';
  }
}
type TransportOptions = {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
  idempotencyKey?: string;
  ifMatch?: string;
  uploadToken?: string;
};
export type ClientConfig = {
  baseUrl: string;
  workspace?: string;
  apiKey?: string | (() => string | Promise<string>);
  fetch?: (request: Request) => Promise<Response>;
  credentials?: RequestCredentials;
  maxRetries?: number;
  maxRetryDelayMs?: number;
  maxPages?: number;
  maxResponseBytes?: number;
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
};
async function pause(ms: number, signal?: AbortSignal) {
  signal?.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const done = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const timer = setTimeout(done, ms);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(signal?.reason ?? new DOMException('Interrupted', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
  });
}
export class LettercapeClient {
  private origin: string;
  private fetcher: (request: Request) => Promise<Response>;
  private wait: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  private retries: number;
  constructor(private config: ClientConfig) {
    const url = new URL(config.baseUrl);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/' ||
      !(
        url.protocol === 'https:' ||
        (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
      )
    )
      throw new Error(
        'Use an HTTPS origin or explicit loopback development origin without credentials/path/query.',
      );
    this.origin = url.origin;
    this.fetcher = config.fetch ?? ((request) => fetch(request));
    this.wait = config.wait ?? pause;
    this.retries = config.maxRetries ?? 2;
    if (!Number.isInteger(this.retries) || this.retries < 0 || this.retries > 5)
      throw new Error('maxRetries must be0..5');
  }
  call<I extends OperationId>(operation: I, ...args: Args<I>): Promise<SdkResult<ResultData<I>>> {
    return this.perform(operation, (args[0] ?? {}) as TransportOptions);
  }
  private async perform<I extends OperationId>(
    operation: I,
    input: TransportOptions,
  ): Promise<SdkResult<ResultData<I>>> {
    input.signal?.throwIfAborted();
    const contract = operationRegistry[operation];
    if (!contract) throw new Error('Unknown documented operation');
    const path = contract.path.replace(/\{([^}]+)\}/g, (_, name: string) => {
      const value = input.path?.[name];
      if (typeof value !== 'string' || !value)
        throw new Error('Required resource path parameter is missing');
      return encodeURIComponent(value);
    });
    const url = new URL(path, this.origin);
    for (const [key, value] of Object.entries(input.query ?? {}))
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    const headers = new Headers({ Accept: contract.binary ? '*/*' : 'application/json' });
    const apiKey =
      typeof this.config.apiKey === 'function' ? await this.config.apiKey() : this.config.apiKey;
    input.signal?.throwIfAborted();
    if (apiKey) headers.set('Authorization', 'Bearer ' + apiKey);
    if (this.config.workspace) headers.set('X-Workspace-Id', this.config.workspace);
    const key = contract.keyed ? (input.idempotencyKey ?? crypto.randomUUID()) : undefined;
    if (key) headers.set('Idempotency-Key', key);
    if (input.ifMatch) headers.set('If-Match', input.ifMatch);
    let body: BodyInit | undefined;
    if (contract.binaryBody) {
      if (!input.uploadToken || !/^[a-f0-9]{64}$/.test(input.uploadToken))
        throw new Error('Supply the acknowledged upload token.');
      const source = input.body;
      if (!(source instanceof Uint8Array || source instanceof ArrayBuffer || source instanceof Blob))
        throw new Error('Upload raw Uint8Array, ArrayBuffer or Blob bytes.');
      const length = source instanceof Blob ? source.size : source.byteLength;
      if (length < 1 || length > 20 * 1024 * 1024)
        throw new Error('Upload bytes must be nonempty and at most 20 MiB.');
      body = source instanceof Blob ? source : new Uint8Array(source instanceof ArrayBuffer ? new Uint8Array(source) : source);
      headers.set('Content-Type', 'application/octet-stream');
      headers.set('X-Upload-Token', input.uploadToken);
    } else {
      body = input.body === undefined ? undefined : JSON.stringify(input.body);
      if (body !== undefined) headers.set('Content-Type', 'application/json');
    }
    const safe = contract.method === 'GET' || (contract.keyed && !!key);
    try {
      for (let attempt = 0; ; attempt++) {
        input.signal?.throwIfAborted();
        let response: Response;
        try {
          response = await this.fetcher(
            new Request(url, {
              method: contract.method,
              headers,
              body,
              signal: input.signal,
              redirect: 'error',
              credentials: this.config.credentials ?? 'same-origin',
            }),
          );
        } catch (error) {
          input.signal?.throwIfAborted();
          if (!safe || attempt >= this.retries || !(error instanceof TypeError)) throw error;
          await this.delay(attempt, null, input.signal);
          continue;
        }
        const requestId = response.headers.get('X-Request-Id');
        let bytes: Uint8Array;
        try {
          bytes = await this.read(response, input.signal);
        } catch (error) {
          input.signal?.throwIfAborted();
          if (safe && attempt < this.retries && error instanceof TypeError) {
            await this.delay(attempt, null, input.signal);
            continue;
          }
          throw error;
        }
        if (response.ok && contract.binary)
          return {
            data: bytes as ResultData<I>,
            requestId: requestId ?? '',
            idempotencyKey: key,
            status: response.status,
            headers: response.headers,
          };
        let data: Record<string, unknown>;
        try {
          const decoded: unknown = JSON.parse(new TextDecoder().decode(bytes));
          if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) throw new Error();
          data = decoded as Record<string, unknown>;
        } catch {
          if (safe && attempt < this.retries && response.status >= 500) {
            await this.delay(attempt, response.headers.get('Retry-After'), input.signal);
            continue;
          }
          throw new LettercapeError(
            'INVALID_RESPONSE',
            'The API response was malformed; preserve this command key when recovering.',
            response.status,
            requestId,
          );
        }
        const acknowledged = typeof data.request_id === 'string' ? data.request_id : requestId;
        if (response.ok) {
          if (!acknowledged)
            throw new LettercapeError(
              'INVALID_RESPONSE',
              'The API acknowledgment has no request ID.',
              response.status,
              null,
            );
          return {
            data: data as ResultData<I>,
            requestId: acknowledged,
            idempotencyKey: key,
            status: response.status,
            headers: response.headers,
          };
        }
        const error =
          data.error && typeof data.error === 'object'
            ? (data.error as Record<string, unknown>)
            : {};
        if (
          safe &&
          attempt < this.retries &&
          (response.status === 429 || (response.status === 503 && error.retryable === true))
        ) {
          await this.delay(attempt, response.headers.get('Retry-After'), input.signal);
          continue;
        }
        throw new LettercapeError(
          typeof error.code === 'string' ? error.code : 'REQUEST_FAILED',
          typeof error.message === 'string' ? error.message : 'The API request failed.',
          response.status,
          acknowledged,
          error.details,
        );
      }
    } catch (error) {
      if (!key) throw error;
      if (error instanceof LettercapeError) {
        error.idempotencyKey = key;
        throw error;
      }
      const failure = new LettercapeError(
        input.signal?.aborted ? 'REQUEST_INTERRUPTED' : 'TRANSPORT_UNCERTAIN',
        'The command acknowledgment is uncertain. Recover with this same idempotency key and exact payload.',
        0,
        null,
        undefined,
        key,
      );
      if (input.signal?.aborted) failure.name = 'AbortError';
      throw failure;
    }
  }

  private async read(response: Response, signal?: AbortSignal) {
    const max = this.config.maxResponseBytes ?? 16 * 1024 * 1024;
    if (!Number.isSafeInteger(max) || max < 1 || max > 64 * 1024 * 1024)
      throw new Error('maxResponseBytes must be1..64MiB');
    if (Number(response.headers.get('Content-Length') ?? 0) > max) {
      await response.body?.cancel();
      throw new LettercapeError(
        'RESPONSE_LIMIT',
        'The API response exceeded the configured byte limit.',
        response.status,
        response.headers.get('X-Request-Id'),
      );
    }
    const reader = response.body?.getReader();
    if (!reader) return new Uint8Array();
    const cancel = () => {
      void reader.cancel(signal?.reason).catch(() => {});
    };
    signal?.addEventListener('abort', cancel, { once: true });
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        signal?.throwIfAborted();
        const next = await reader.read();
        if (next.done) break;
        length += next.value.length;
        if (length > max) {
          await reader.cancel();
          throw new LettercapeError(
            'RESPONSE_LIMIT',
            'The API response exceeded the configured byte limit.',
            response.status,
            response.headers.get('X-Request-Id'),
          );
        }
        chunks.push(next.value);
      }
      signal?.throwIfAborted();
    } finally {
      signal?.removeEventListener('abort', cancel);
      reader.releaseLock();
    }
    const output = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }
  private async delay(attempt: number, header: string | null, signal?: AbortSignal) {
    let minimum = 0;
    if (header) {
      const seconds = Number(header);
      minimum = Number.isFinite(seconds)
        ? Math.max(0, seconds * 1000)
        : Math.max(0, Date.parse(header) - Date.now());
    }
    const delay =
      Math.max(Number.isFinite(minimum) ? minimum : 0, Math.min(5000, 250 * 2 ** attempt)) +
      Math.floor(Math.random() * 100);
    if (delay > (this.config.maxRetryDelayMs ?? 30000))
      throw new LettercapeError(
        'RETRY_DEFERRED',
        'Retry later with the same command key; the server delay exceeds this client waiting budget.',
        429,
        null,
      );
    await this.wait(delay, signal);
    signal?.throwIfAborted();
  }
  async *pages<I extends PageOperation>(
    operation: I,
    input: CallOptions<I>,
  ): AsyncGenerator<SdkResult<ResultData<I>>> {
    const seen = new Set<string>(),
      options = input as TransportOptions;
    let after = options.query?.after;
    const maximum = this.config.maxPages ?? 1000;
    if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 10000)
      throw new Error('maxPages must be1..10000');
    for (let n = 0; n < maximum; n++) {
      const result = await this.perform(operation, {
        ...options,
        query: { ...options.query, ...(after ? { after } : {}) },
      });
      const page = result.data as unknown as {
        data?: unknown;
        has_more?: unknown;
        next_cursor?: unknown;
      };
      if (!Array.isArray(page.data) || typeof page.has_more !== 'boolean')
        throw new LettercapeError(
          'INVALID_RESPONSE',
          'The cursor page shape is invalid.',
          result.status,
          result.requestId,
        );
      yield result;
      if (!page.has_more) return;
      if (typeof page.next_cursor !== 'string' || !page.next_cursor || seen.has(page.next_cursor))
        throw new LettercapeError(
          'INVALID_CURSOR',
          'The API returned a missing or repeated page cursor.',
          result.status,
          result.requestId,
        );
      seen.add(page.next_cursor);
      after = page.next_cursor;
    }
    throw new LettercapeError(
      'PAGE_LIMIT',
      'The configured page limit was reached; resume explicitly with the last acknowledged cursor.',
      200,
      null,
    );
  }
}
