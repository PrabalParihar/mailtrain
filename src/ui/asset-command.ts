import { MEDIA_LIMITS, UploadIntentInput, AssetManifestEntrySchema, type AssetManifestEntry, type UploadIntent } from '../domain/assets';
import { ApiError } from './api';

export type AssetAnchor = { workspace: string; actor: string; email: string; nodeId: string; docVersion: number; sourceRef: string };
export type AssetTransfer = { version: 1; anchor: AssetAnchor; key: string; intent: UploadIntent; phase: 'intent' | 'transfer' | 'processing'; upload_id?: string; asset_id?: string; operation_id?: string };
export type AssetFallbackCommand = { version: 1; anchor: AssetAnchor; asset_id: string; asset_version: number; selected_frame: number; key: string; phase?: 'processing'; operation_id?: string };
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function assetAnchorEqual(a: AssetAnchor, b: AssetAnchor) { return a.workspace === b.workspace && a.actor === b.actor && a.email === b.email && a.nodeId === b.nodeId && a.docVersion === b.docVersion && a.sourceRef === b.sourceRef; }
function slot(a: AssetAnchor) { return 'lettercape.asset-transfer.' + JSON.stringify([a.workspace, a.actor, a.email, a.nodeId]); }
function browserStorage() { try { return typeof sessionStorage === 'undefined' ? undefined : sessionStorage; } catch { return undefined; } }
export function saveAssetTransfer(t: AssetTransfer, s: StoragePort | undefined = browserStorage()) { if (!s) throw Error('Browser storage is unavailable. Keep this view open to retain the upload command.'); s.setItem(slot(t.anchor), JSON.stringify(t)); }
export function clearAssetTransfer(a: AssetAnchor, s: StoragePort | undefined = browserStorage()) { s?.removeItem(slot(a)); }
function fallbackSlot(a: AssetAnchor) { return slot(a) + '.fallback'; }
export function saveAssetFallback(t: AssetFallbackCommand, s: StoragePort | undefined = browserStorage()) { if (!s) throw Error('Browser storage is unavailable. Keep this view open to retain the fallback command.'); s.setItem(fallbackSlot(t.anchor), JSON.stringify(t)); }
export function clearAssetFallback(a: AssetAnchor, s: StoragePort | undefined = browserStorage()) { s?.removeItem(fallbackSlot(a)); }
export function recoverAssetFallback(a: AssetAnchor, s: StoragePort | undefined = browserStorage()): AssetFallbackCommand | null { try { const raw = s?.getItem(fallbackSlot(a)); if (!raw || raw.length > 16384) return null; const t = JSON.parse(raw) as AssetFallbackCommand; if (t.version !== 1 || !t.anchor || !assetAnchorEqual(a, t.anchor) || typeof t.asset_id !== 'string' || !t.asset_id || !Number.isSafeInteger(t.asset_version) || t.asset_version < 1 || !Number.isSafeInteger(t.selected_frame) || t.selected_frame < 0 || t.selected_frame > 199 || typeof t.key !== 'string' || !t.key || (t.phase !== undefined && t.phase !== 'processing') || (t.phase === 'processing' && (typeof t.operation_id !== 'string' || !t.operation_id))) return null; return { version: 1, anchor: { ...a }, asset_id: t.asset_id, asset_version: t.asset_version, selected_frame: t.selected_frame, key: t.key, ...(t.phase ? { phase: t.phase, operation_id: t.operation_id } : {}) }; } catch { return null; } }
export async function requestAssetFallback(t: AssetFallbackCommand, signal?: AbortSignal) { const r = await fetch('/v1/assets/' + encodeURIComponent(t.asset_id) + '/fallback', { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'X-Workspace-Id': t.anchor.workspace, 'X-Actor-Id': t.anchor.actor, 'Idempotency-Key': t.key, 'If-Match': '"asset-' + t.asset_version + '"' }, body: JSON.stringify({ selected_frame: t.selected_frame }) }); const json = await r.json(); if (!r.ok) throw new ApiError(json.error?.code ?? 'ASSET_FALLBACK_FAILED', json.error?.message ?? 'Fallback processing request failed', r.status); if (typeof json.operation?.id !== 'string' || !json.operation.id) throw Error('The fallback operation receipt is incomplete. Retry the original command.'); return json as { operation: { id: string; state: string } }; }
export function recoverAssetTransfer(a: AssetAnchor, s: StoragePort | undefined = browserStorage()): AssetTransfer | null {
  try {
const raw = s?.getItem(slot(a)); if (!raw || raw.length > 16384) return null; const t = JSON.parse(raw) as AssetTransfer;
    if (t.version !== 1 || !t.anchor || !assetAnchorEqual(a, t.anchor) || typeof t.key !== 'string' || !t.key || !['intent', 'transfer', 'processing'].includes(t.phase)) return null;
    const intent = UploadIntentInput.safeParse(t.intent); if (!intent.success) return null;
    if (t.upload_id !== undefined && (typeof t.upload_id !== 'string' || !t.upload_id)) return null; if (t.asset_id !== undefined && (typeof t.asset_id !== 'string' || !t.asset_id)) return null;
    if (t.operation_id !== undefined && (typeof t.operation_id !== 'string' || !t.operation_id)) return null;
    return { version: 1, anchor: { ...a }, key: t.key, intent: intent.data, phase: t.phase, ...(t.upload_id ? { upload_id: t.upload_id } : {}), ...(t.asset_id ? { asset_id: t.asset_id } : {}), ...(t.operation_id ? { operation_id: t.operation_id } : {}) };
} catch { return null; }
}
export async function assetFileHash(file: File) { if (file.size < 1 || file.size > MEDIA_LIMITS.upload) throw Error('Choose a file between 1 byte and 20 MiB.'); const bytes = await file.arrayBuffer(); return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join(''); }
export async function uploadAssetBytes(t: AssetTransfer, file: File, signal?: AbortSignal, uploadToken?: string) {
  if (signal?.aborted) throw new DOMException('Upload interrupted', 'AbortError');
  if (!t.upload_id) throw Error('The durable upload intent is unavailable.');
  if (file.size !== t.intent.byte_size || await assetFileHash(file) !== t.intent.sha256) throw Error('Reselect the same file content to recover this upload.');
  if (signal?.aborted) throw new DOMException('Upload interrupted', 'AbortError');
  if (!uploadToken) throw Error('The upload capability is unavailable. Retry the original intent first.');
  const r = await fetch('/v1/assets/uploads/' + encodeURIComponent(t.upload_id) + '/content', { method: 'PUT', signal, headers: { 'Content-Type': 'application/octet-stream', 'X-Workspace-Id': t.anchor.workspace, 'X-Actor-Id': t.anchor.actor, 'Idempotency-Key': t.key, 'X-Upload-Token': uploadToken }, body: file });
  const json = await r.json(); if (!r.ok) throw new ApiError(json.error?.code ?? 'ASSET_UPLOAD_FAILED', json.error?.message ?? 'Upload transfer failed', r.status); if (typeof json.asset_id !== 'string' || !json.asset_id || typeof json.operation?.id !== 'string' || !json.operation.id || (t.operation_id && json.operation.id !== t.operation_id)) throw Error('The upload receipt is incomplete. Retry the original transfer to recover its status.'); return json as { asset_id: string; operation: { id: string; state: string } };
}
export async function verifiedAssetPreview(a: AssetAnchor, v: AssetManifestEntry, signal?: AbortSignal): Promise<Blob> {
  if (!AssetManifestEntrySchema.safeParse(v).success || !v.processing_profile || !v.storage_profile) throw Error('Verified private derivative metadata is unavailable.');
  const r = await fetch('/v1/assets/' + encodeURIComponent(v.asset_id) + '/variants/' + encodeURIComponent(v.variant_id) + '/content', { signal, headers: { 'X-Workspace-Id': a.workspace, 'X-Actor-Id': a.actor } });
  if (!r.ok) throw new ApiError('ASSET_PREVIEW_UNAVAILABLE', 'Private preview unavailable', r.status);
  if (r.headers.get('Content-Type')?.split(';')[0] !== v.mime) { await r.body?.cancel(); throw Error('Private preview MIME mismatch.'); }
  const declared = r.headers.get('Content-Length'); if (declared && Number(declared) !== v.bytes) { await r.body?.cancel(); throw Error('Private preview size mismatch.'); }
  if (!r.body) throw Error('Private preview bytes are unavailable.'); const reader = r.body.getReader(), chunks: Uint8Array<ArrayBuffer>[] = []; let size = 0;
  try { for (; ;) { if (signal?.aborted) throw new DOMException('Preview interrupted', 'AbortError'); const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > v.bytes) throw Error('Private preview size exceeds measured metadata.'); chunks.push(new Uint8Array(value)); } } catch (e) { await reader.cancel().catch(() => { }); throw e; } finally { reader.releaseLock(); }
  if (size !== v.bytes) throw Error('Private preview size mismatch.'); const blob = new Blob(chunks, { type: v.mime }); const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())), n => n.toString(16).padStart(2, '0')).join(''); if (sha !== v.sha256) throw Error('Private preview digest mismatch.'); if (signal?.aborted) throw new DOMException('Preview interrupted', 'AbortError'); return blob;
}
