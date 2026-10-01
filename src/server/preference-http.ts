import { AppError, fail } from './errors';
export function assertPreferenceOrigin(req: Request) {
  const expected = process.env.APP_ORIGIN ?? new URL(req.url).origin;
  if (req.headers.get('origin') !== new URL(expected).origin)
    fail(403, 'ORIGIN_DENIED', 'This preference action must originate from this page.');
}
export async function readPreferenceForm(req: Request) {
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader)
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) {
          await reader.cancel();
          fail(413, 'PAYLOAD_TOO_LARGE', 'Preference form is too large.');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}
export function preferenceError(error: unknown, json = false) {
  const message =
    error instanceof AppError
      ? error.message
      : 'Preference action could not be completed. Reload the page and try again.';
  const status = error instanceof AppError ? error.status : 422;
  return json
    ? Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
    : new Response(message, { status, headers: { 'Cache-Control': 'no-store' } });
}
