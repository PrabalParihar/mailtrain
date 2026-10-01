export const RENDERER_VERSION: string;
export const MAX_RENDER_INPUT: number;
export const MAX_RENDER_OUTPUT: number;
export type RenderInput = {
  schema_version: 1;
  workspace_id: string;
  revision_id: string;
  artifact_hash: string;
  renderer_version: string;
  format: 'png' | 'pdf';
  html: string;
};
export class RenderProtocolError extends Error {
  code: string;
  status: number;
}
export function bytesDigest(bytes: Uint8Array): string;
export function validateRenderInput(value: unknown): RenderInput;
export function renderRequestHeaders(
  raw: Uint8Array,
  secret: string,
  id: string,
  now?: number,
): Record<string, string>;
export function verifyRenderRequest(
  raw: Uint8Array,
  headers: Headers | Record<string, string | string[] | undefined>,
  secret: string,
  now?: number,
): string;
export function renderResponseHeaders(
  bytes: Uint8Array,
  input: RenderInput,
  secret: string,
  id: string,
  now?: number,
): Record<string, string>;
export function verifyRenderResponse(
  bytes: Uint8Array,
  headers: Headers | Record<string, string | string[] | undefined>,
  input: RenderInput,
  secret: string,
  id: string,
  now?: number,
): string;
