import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assetAnchorEqual, recoverAssetTransfer, saveAssetTransfer, uploadAssetBytes, verifiedAssetPreview, recoverAssetFallback, saveAssetFallback, requestAssetFallback, type AssetAnchor, type AssetTransfer, type AssetFallbackCommand } from '../src/ui/asset-command';
import { createHash } from 'node:crypto';
const anchor: AssetAnchor = { workspace: 'w', actor: 'a', email: 'e', nodeId: 'n', docVersion: 2, sourceRef: 'previous' };
const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const sha = createHash('sha256').update(bytes).digest('hex');
const pending: AssetTransfer = { version: 1, anchor, key: 'intent-key', intent: { filename: 'a.png', declared_mime: 'image/png', byte_size: bytes.length, sha256: sha, rights: { attested: true, terms_version: 'local-upload-attestation-v1' }, alt: 'A', decorative: false }, phase: 'intent' };
function storage() { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); }, m }; }
test('recovery stores only bounded metadata and never replays a different actor, node or source', () => {
  const s = storage(); saveAssetTransfer(pending, s); assert.deepEqual(recoverAssetTransfer(anchor, s), pending);
  for (const changed of [{ actor: 'b' }, { workspace: 'x' }, { email: 'x' }, { nodeId: 'x' }, { docVersion: 3 }, { sourceRef: 'changed' }]) { assert.equal(recoverAssetTransfer({ ...anchor, ...changed }, s), null); assert.equal(assetAnchorEqual(anchor, { ...anchor, ...changed }), false); }
  const bad = { ...pending, intent: { ...pending.intent, filename: 'x'.repeat(201) } }; s.m.set([...s.m.keys()][0], JSON.stringify(bad)); assert.equal(recoverAssetTransfer(anchor, s), null);
});
test('binary retry requires identical actual file hash and actor headers; no JSON or bytes retained', async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async (_url, init) => { calls++; assert.equal(init?.method, 'PUT'); assert.ok(init?.body instanceof Blob); assert.equal((init?.headers as Record<string, string>)['X-Actor-Id'], 'a'); return new Response(JSON.stringify({ asset_id: 'asset', operation: { id: 'operation', state: 'queued' } }), { status: 200 }); };
  try { await assert.rejects(uploadAssetBytes({ ...pending, upload_id: 'u' }, new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }), undefined, 'token'), /same file content/i); assert.equal(calls, 0); await uploadAssetBytes({ ...pending, upload_id: 'u' }, new File([bytes], 'a.png', { type: 'image/png' }), undefined, 'token'); assert.equal(calls, 1); } finally { globalThis.fetch = original; }
});
test('missing transfer acknowledgment is recoverable and denied storage does not discard metadata', async () => {
  assert.throws(() => saveAssetTransfer(pending, { getItem: () => null, setItem: () => { throw Error('Storage quota'); }, removeItem: () => { } }), /Storage quota/);
  const original = globalThis.fetch; globalThis.fetch = async () => new Response('{}');
  try { await assert.rejects(uploadAssetBytes({ ...pending, upload_id: 'u' }, new File([bytes], 'a.png', { type: 'image/png' }), undefined, 'token'), /receipt is incomplete/); } finally { globalThis.fetch = original; }
});
test('private derivative preview rejects absent metadata, oversized actual bytes and digest mismatch before blob creation', async () => {
  const original = globalThis.fetch;
  const variant = { asset_id: 'a0000000-0000-4000-8000-000000000000', variant_id: 'a0000000-0000-4000-8000-000000000001', sha256: sha, mime: 'image/png' as const, bytes: bytes.length, width: 1, height: 1, frames: 1, role: 'static' as const, source_sha256: sha, processing_profile: 'local-private-v1', storage_profile: 'local-private-v1', visibility: 'private' as const, rights_evidence_id: 'a0000000-0000-4000-8000-000000000002', scan_evidence_ids: ['a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004'] };
  globalThis.fetch = async () => new Response(bytes, { headers: { 'Content-Type': 'image/png' } });
  try { assert.deepEqual(new Uint8Array(await (await verifiedAssetPreview(anchor, variant)).arrayBuffer()), bytes); await assert.rejects(verifiedAssetPreview(anchor, { ...variant, sha256: '0'.repeat(64) }), /digest/i); await assert.rejects(verifiedAssetPreview(anchor, { ...variant, bytes: 1 }), /size/i); await assert.rejects(verifiedAssetPreview(anchor, { ...variant, scan_evidence_ids: [] }), /metadata/i); } finally { globalThis.fetch = original; }
});
test('fallback reload retries its original body, key and asset CAS without crossing an actor', async () => {
  const s = storage(), t: AssetFallbackCommand = { version: 1, anchor, asset_id: 'asset', asset_version: 7, selected_frame: 2, key: 'fallback-key' }; saveAssetFallback(t, s); assert.equal(recoverAssetFallback({ ...anchor, actor: 'other' }, s), null);
  const original = globalThis.fetch, requests: RequestInit[] = []; globalThis.fetch = async (_url, init) => { requests.push(init!); if (requests.length === 1) throw Error('Lost accepted acknowledgment'); return new Response(JSON.stringify({ operation: { id: 'operation', state: 'queued' } })); };
  try { await assert.rejects(requestAssetFallback(t), /Lost accepted/); await requestAssetFallback(recoverAssetFallback(anchor, s)!); assert.deepEqual(requests[1], requests[0]); assert.equal((requests[0].headers as Record<string, string>)['If-Match'], '"asset-7"'); assert.equal(requests[0].body, JSON.stringify({ selected_frame: 2 })); } finally { globalThis.fetch = original; }
});
