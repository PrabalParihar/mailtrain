'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { MEDIA_LIMITS, AssetMetadataSchema, type AssetMetadata, type AssetVariantRef } from '../domain/assets';
import { api } from './api';
import { assetAnchorEqual, assetFileHash, clearAssetTransfer, recoverAssetTransfer, saveAssetTransfer, uploadAssetBytes, verifiedAssetPreview, clearAssetFallback, recoverAssetFallback, saveAssetFallback, requestAssetFallback, type AssetAnchor, type AssetTransfer, type AssetFallbackCommand } from './asset-command';

export type AssetPickerAnchor = AssetAnchor;
export type AssetPickerProps = AssetPickerAnchor & { canEdit: boolean; blocked: boolean; onApply: (ref: AssetVariantRef, anchor: AssetPickerAnchor) => Promise<void> };
type IntentReceipt = { upload: { id: string; token: string; expires_at: string }; operation: { id: string; state: string } };
export function AssetPicker(props: AssetPickerProps) {
  if (!props.actor) return <section aria-label="Uploaded media"><p role="status">Verified account context is unavailable. Reload before accessing uploaded media.</p></section>;
  return <AssetPickerController key={JSON.stringify([props.workspace, props.actor, props.email, props.nodeId, props.docVersion, props.sourceRef])} {...props} />;
}
function AssetPickerController(props: AssetPickerProps) {
  const { workspace, actor, email, nodeId, docVersion, sourceRef, canEdit, blocked, onApply } = props;
  const anchor: AssetAnchor = { workspace, actor, email, nodeId, docVersion, sourceRef };
  const identity = JSON.stringify([workspace, actor, email, nodeId, docVersion, sourceRef]);
  const live = useRef({ anchor, canEdit, blocked }); useLayoutEffect(() => { live.current = { anchor, canEdit, blocked }; });
  const scope = useRef<AbortController | null>(null), locked = useRef(false), inputId = useId();
  const libraryCursor = useRef(''), libraryHistory = useRef<string[]>([]); const [nextCursor, setNextCursor] = useState<string | null>(null), [hasPrevious, setHasPrevious] = useState(false);
  const [assets, setAssets] = useState<AssetMetadata[]>([]), [selected, setSelected] = useState(''), [variantId, setVariantId] = useState('');
  const [libraryAvailable, setLibraryAvailable] = useState(false);
  const [file, setFile] = useState<File | null>(null), [alt, setAlt] = useState(''), [decorative, setDecorative] = useState(false), [rights, setRights] = useState(false);
  const [pending, setPending] = useState<AssetTransfer | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [status, setStatus] = useState('Loading private media library…');
  const [preview, setPreview] = useState<{ variant: string; sha: string; url: string } | null>(null), [playing, setPlaying] = useState(false), [reduced, setReduced] = useState(false), [frame, setFrame] = useState('0');
  const fallbackCommand = useRef<AssetFallbackCommand | null>(null); const [fallbackPending, setFallbackPending] = useState<AssetFallbackCommand | null>(null), [fallbackStatus, setFallbackStatus] = useState('');
  const current = (a: AssetAnchor) => !scope.current?.signal.aborted && assetAnchorEqual(live.current.anchor, a);
  const writable = (a: AssetAnchor) => current(a) && live.current.canEdit && !live.current.blocked;
  async function refresh(a: AssetAnchor, signal?: AbortSignal) {
    const cursor = libraryCursor.current;
    try {
      const r = await api<{ data: AssetMetadata[]; has_more: boolean; next_cursor: string | null }>(a.workspace, 'assets' + (cursor ? '?after=' + encodeURIComponent(cursor) : ''), 'GET', undefined, undefined, undefined, signal, a.actor);
      const data = AssetMetadataSchema.array().max(100).parse(r.data);
      if (typeof r.has_more !== 'boolean' || (r.has_more && (typeof r.next_cursor !== 'string' || !r.next_cursor))) throw Error('The private media library response is incomplete.');
      if (current(a) && libraryCursor.current === cursor) { setAssets(data); setNextCursor(r.has_more ? r.next_cursor : null); setLibraryAvailable(true); setStatus(data.length ? 'Private media library loaded.' : 'No uploaded media in this workspace.'); }
      return data;
    } catch (e) { if (current(a) && libraryCursor.current === cursor) { setLibraryAvailable(false); setPreview(null); setStatus('Private media library unavailable.'); } throw e; }
  }
  useEffect(() => {
    const controller = new AbortController(); scope.current = controller;
    void Promise.resolve().then(() => { if (!current(anchor)) return; const recovered = recoverAssetTransfer(anchor); setPending(recovered); const recoveredFallback = recoverAssetFallback(anchor); fallbackCommand.current = recoveredFallback; setFallbackPending(recoveredFallback); if (recovered) setStatus('Upload command recovered. File bytes were not retained; reselect the same file to resume transfer.'); });
    void Promise.resolve().then(() => refresh(anchor, controller.signal)).catch(e => { if (current(anchor)) { setError(e instanceof Error ? e.message : String(e)); setStatus('Private media library unavailable.'); } });
    return () => controller.abort();
    // The opaque source fingerprint belongs to the parent editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);
  useEffect(() => { const m = matchMedia('(prefers-reduced-motion: reduce)'), change = () => { setReduced(m.matches); if (m.matches) setPlaying(false); }; queueMicrotask(change); m.addEventListener('change', change); return () => m.removeEventListener('change', change); }, []);
  const asset = assets.find(a => a.id === selected), variant = asset?.variants.find(v => v.variant_id === variantId);
  const staticVariant = variant?.role === 'animation' ? asset?.variants.find(v => v.variant_id === variant.fallback?.variant_id) : variant;
  const previewVariant = playing && !reduced ? variant : staticVariant;
  useEffect(() => {
    const controller = new AbortController(); let object = '';
    if (libraryAvailable && asset && (asset.state === 'ready_private' || asset.state === 'published') && previewVariant) { const a = { ...anchor }; void verifiedAssetPreview(a, previewVariant, controller.signal).then(blob => { if (!controller.signal.aborted && current(a)) { object = URL.createObjectURL(blob); setPreview({ variant: previewVariant.variant_id, sha: previewVariant.sha256, url: object }); } }).catch(e => { if (!controller.signal.aborted && current(a)) setError(e instanceof Error ? e.message : String(e)); }); }
    return () => { controller.abort(); if (object) URL.revokeObjectURL(object); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, libraryAvailable, asset?.state, previewVariant?.variant_id, previewVariant?.sha256]);
  const needsStatus = assets.some(a => a.state === 'quarantined' || a.state === 'processing') || pending?.phase === 'processing' || fallbackPending?.phase === 'processing';
  useEffect(() => {
if (!needsStatus) return; const controller = new AbortController(), a = { ...anchor }; const timer = setInterval(() => { void refresh(a, controller.signal).catch(e => { if (current(a) && !controller.signal.aborted) setError(e instanceof Error ? e.message : String(e)); }); }, 3000); return () => { clearInterval(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, needsStatus]);
  useEffect(() => {
if (fallbackPending?.phase !== 'processing' || !fallbackPending.operation_id) return; const a = { ...anchor }, controller = new AbortController(); async function read() { try { const result = await api<{ operation: { state: string; error?: { message: string } } }>(a.workspace, 'operations/' + fallbackPending!.operation_id, 'GET', undefined, undefined, undefined, controller.signal, a.actor); if (current(a) && !controller.signal.aborted) setFallbackStatus(result.operation.state + (result.operation.error ? ' · ' + result.operation.error.message : '')); } catch (e) { if (current(a) && !controller.signal.aborted) setError(e instanceof Error ? e.message : String(e)); } } void read(); const timer = setInterval(() => void read(), 3000); return () => { clearInterval(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, fallbackPending?.operation_id, fallbackPending?.phase]);
  const disabled = !canEdit || blocked || busy;
  async function perform(action: (a: AssetAnchor, signal: AbortSignal) => Promise<void>, write = true) { if (locked.current || live.current.blocked || (write && !live.current.canEdit) || !scope.current) return; const a = { ...live.current.anchor }, controller = scope.current; locked.current = true; setBusy(true); setError(''); try { await action(a, controller.signal); } catch (e) { if (current(a)) setError(e instanceof Error ? e.message : String(e)); } finally { if (current(a)) { locked.current = false; setBusy(false); } } }
  function retain(t: AssetTransfer) { saveAssetTransfer(t); if (current(t.anchor)) setPending(t); }
  async function submitFallback(a: AssetAnchor, signal: AbortSignal, command: AssetFallbackCommand) { const result = await requestAssetFallback(command, signal); if (!current(a)) return; const t: AssetFallbackCommand = { ...command, phase: 'processing', operation_id: result.operation.id }; saveAssetFallback(t); fallbackCommand.current = t; setFallbackPending(t); setFallbackStatus(result.operation.state); setStatus('Fallback processing requested. Apply the resulting immutable variant explicitly when ready.'); await refresh(a, signal); }
  async function transfer(a: AssetAnchor, signal: AbortSignal, t: AssetTransfer, f: File) {
    if (await assetFileHash(f) !== t.intent.sha256 || f.size !== t.intent.byte_size) throw Error('Reselect the same file content to recover this upload.'); if (!writable(a)) return;
    const receipt = await api<IntentReceipt>(a.workspace, 'assets/uploads', 'POST', t.intent, undefined, t.key, signal, a.actor); if (!current(a)) return;
    if (typeof receipt.upload?.id !== 'string' || !receipt.upload.id || typeof receipt.upload.token !== 'string' || !receipt.upload.token || typeof receipt.operation?.id !== 'string' || !receipt.operation.id || (t.upload_id && receipt.upload.id !== t.upload_id) || (t.operation_id && receipt.operation.id !== t.operation_id)) throw Error('The original upload intent receipt is incomplete. Keep the command and retry.');
    t = { ...t, upload_id: receipt.upload.id, operation_id: receipt.operation.id, phase: 'transfer' }; retain(t); if (!writable(a)) return; setStatus('Transferring bytes into quarantine…');
    const result = await uploadAssetBytes(t, f, signal, receipt.upload.token); if (!current(a)) return;
    t = { ...t, asset_id: result.asset_id, operation_id: result.operation.id, phase: 'processing' }; retain(t); setFile(null); setRights(false); setStatus('Upload quarantined. Scanning and decoding must finish before selection.'); await refresh(a, signal);
  }
  async function upload() {
await perform(async (a, signal) => {
if (!file) throw Error('Choose a PNG, JPEG or GIF file.'); if (!rights) throw Error('Confirm the local upload rights attestation.'); if (!decorative && !alt.trim()) throw Error('Describe the image or mark it decorative.'); if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) throw Error('Choose a PNG, JPEG or GIF file.');
      const t: AssetTransfer = { version: 1, anchor: a, key: crypto.randomUUID(), phase: 'intent', intent: { filename: file.name, declared_mime: file.type as 'image/png' | 'image/jpeg' | 'image/gif', byte_size: file.size, sha256: await assetFileHash(file), rights: { attested: true, terms_version: MEDIA_LIMITS.rights }, alt: decorative ? '' : alt, decorative } };
      if (!writable(a)) return; retain(t); await transfer(a, signal, t, file);
    });
}
  async function fallback() {
await perform(async (a, signal) => {
if (!asset || !variant || !Number.isSafeInteger(Number(frame)) || Number(frame) < 0 || Number(frame) >= variant.frames) throw Error('Select an integer frame within the measured frame count.');
      const command: AssetFallbackCommand = { version: 1, anchor: a, asset_id: asset.id, asset_version: asset.version, selected_frame: Number(frame), key: crypto.randomUUID() }; if (fallbackCommand.current) throw Error('Retry the original fallback command before creating another.'); saveAssetFallback(command); fallbackCommand.current = command; setFallbackPending(command);
      await submitFallback(a, signal, command);
    });
}
  function choose(id: string) { setSelected(id); setPlaying(false); setPreview(null); setError(''); setFrame('0'); const next = assets.find(a => a.id === id), v = next?.variants.find(v => v.role === 'animation') ?? next?.variants.find(v => v.role === 'static') ?? next?.variants[0]; setVariantId(v?.variant_id ?? ''); }
  const previewUrl = libraryAvailable && preview?.variant === previewVariant?.variant_id && preview?.sha === previewVariant?.sha256 ? preview?.url : '';
  const ready = libraryAvailable && (asset?.state === 'ready_private' || asset?.state === 'published');
  const frameValid = !!variant && /^(0|[1-9][0-9]*)$/.test(frame) && Number.isSafeInteger(Number(frame)) && Number(frame) < variant.frames;
  return <section aria-label="Uploaded media" style={{ minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere' }}>
    <h3>Uploaded media</h3><p>Private preview and local bundle export. Public CDN, AI images and Outlook verification are unconfigured.</p>
    <p role="status" aria-live="polite">{status}{busy ? ' Working…' : ''}</p>{error && <p role="alert">{error}</p>}
    <label htmlFor={inputId}>PNG, JPEG or GIF file (20 MiB maximum)</label><input id={inputId} type="file" accept="image/png,image/jpeg,image/gif" disabled={disabled} style={{ maxWidth: '100%' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
    <label>Upload image description<input value={pending ? pending.intent.alt : alt} maxLength={1000} disabled={disabled || decorative || !!pending} onChange={e => setAlt(e.target.value)} /></label>
    <label className="checkbox-label"><input type="checkbox" checked={pending ? pending.intent.decorative : decorative} disabled={disabled || !!pending} onChange={e => setDecorative(e.target.checked)} />This upload is decorative</label>
    <label className="checkbox-label"><input type="checkbox" checked={pending ? pending.intent.rights.attested : rights} disabled={disabled || !!pending} onChange={e => setRights(e.target.checked)} />I confirm I have the rights to upload and use this image under the proposed local development attestation ({MEDIA_LIMITS.rights}).</label>
    <button type="button" disabled={disabled || !!pending || !file || !rights || (!decorative && !alt.trim())} onClick={() => void upload()}>Upload to quarantine</button>
    {pending && <div><p>Recovered upload: {pending.intent.filename} · {pending.phase}. Bytes and upload capabilities are not retained in browser storage.</p>
      {pending.phase !== 'processing' && <button type="button" disabled={disabled || !file} onClick={() => void perform((a, signal) => transfer(a, signal, pending, file!))}>Resume original upload</button>}
      {pending.operation_id && <button type="button" disabled={disabled} onClick={() => void perform(async (a, signal) => { await api(a.workspace, 'operations/' + pending.operation_id + '/cancel', 'POST', {}, undefined, pending.key + ':cancel', signal, a.actor); if (current(a)) { clearAssetTransfer(a); setPending(null); setStatus('Upload cancellation acknowledged. Previous image preserved.'); await refresh(a, signal); } })}>Cancel upload operation</button>}
      {pending.phase === 'processing' && assets.find(a => a.id === pending.asset_id && (a.state === 'ready_private' || !!a.failure_code)) && <button type="button" disabled={disabled} onClick={() => { clearAssetTransfer(anchor); setPending(null); setStatus('Upload status acknowledged. Choose and apply a ready variant explicitly.'); }}>Acknowledge upload status</button>}
      <button type="button" disabled={disabled} onClick={() => { clearAssetTransfer(anchor); setPending(null); setStatus('Local upload recovery forgotten. Any existing server operation continues; its status remains in the library.'); }}>Forget local upload recovery</button>
    </div>}
    {fallbackPending && <div><p>{fallbackPending.phase === 'processing' ? 'Fallback operation ' + (fallbackStatus || 'status loading') : 'Unacknowledged fallback command'}: frame {fallbackPending.selected_frame}. Retry preserves its original body, key and asset version.</p>
      {!fallbackPending.phase && <button type="button" disabled={disabled} onClick={() => void perform((a, signal) => submitFallback(a, signal, fallbackPending))}>Retry original fallback</button>}
      {fallbackPending.operation_id && <button type="button" disabled={disabled || /^(succeeded|failed|cancelled)/.test(fallbackStatus)} onClick={() => void perform(async (a, signal) => { await api(a.workspace, 'operations/' + fallbackPending.operation_id + '/cancel', 'POST', {}, undefined, fallbackPending.key + ':cancel', signal, a.actor); if (current(a)) { setFallbackStatus('cancel_requested'); setStatus('Fallback cancellation requested. Previous image preserved.'); } })}>Cancel fallback operation</button>}
      {fallbackPending.phase === 'processing' && /^(succeeded|failed|cancelled)/.test(fallbackStatus) && <button type="button" disabled={disabled} onClick={() => { clearAssetFallback(anchor); fallbackCommand.current = null; setFallbackPending(null); setFallbackStatus(''); setStatus('Fallback operation status acknowledged. Apply a ready immutable variant explicitly.'); }}>Acknowledge fallback status</button>}
      <button type="button" disabled={disabled} onClick={() => { clearAssetFallback(anchor); fallbackCommand.current = null; setFallbackPending(null); setFallbackStatus(''); setStatus('Local fallback recovery forgotten. The previous image remains selected.'); }}>Forget local fallback recovery</button></div>}
    <label>Private media library<select aria-label="Private media library" value={selected} disabled={busy || blocked} style={{ maxWidth: '100%' }} onChange={e => choose(e.target.value)}><option value="">Choose an uploaded asset</option>{assets.map(a => <option key={a.id} value={a.id}>{a.alt || 'Decorative image'} · {a.state}{a.failure_code ? ' · ' + a.failure_code : ''}</option>)}</select></label>
    <button type="button" disabled={busy || blocked || !hasPrevious} onClick={() => void perform(async (a, signal) => { libraryCursor.current = libraryHistory.current.pop() ?? ''; setHasPrevious(libraryHistory.current.length > 0); choose(''); await refresh(a, signal); }, false)}>Previous media page</button>
    <button type="button" disabled={busy || blocked || !nextCursor} onClick={() => void perform(async (a, signal) => { if (!nextCursor) return; libraryHistory.current.push(libraryCursor.current); libraryCursor.current = nextCursor; setHasPrevious(true); choose(''); await refresh(a, signal); }, false)}>Next media page</button>
    <button type="button" disabled={busy || blocked} onClick={() => void perform(async (a, signal) => { await refresh(a, signal); }, false)}>Refresh media status</button>
    {asset && <div><p>State: {asset.state}{asset.failure_code ? ' · ' + asset.failure_code : ''}. Measured MIME: {asset.mime ?? 'unavailable'}; bytes: {asset.bytes ?? 'unavailable'}.</p>
      {ready ? <><label>Immutable variant<select aria-label="Immutable variant" value={variantId} disabled={busy || blocked} onChange={e => { setPlaying(false); setVariantId(e.target.value); }}><option value="">Choose a ready immutable variant</option>{asset.variants.map(v => <option key={v.variant_id} value={v.variant_id}>{v.role} · {v.width}×{v.height} · {v.frames} frames{v.selected_frame !== undefined ? ' · frame ' + v.selected_frame : ''}</option>)}</select></label>
        {variant && <p>{variant.mime} · {variant.bytes} bytes · {variant.width}×{variant.height} · {variant.frames} frames.{variant.bytes > 200 * 1024 ? ' Above the proposed 200 KiB image-size advisory.' : ''}</p>}
        {/* Authenticated, hash-verified blob bytes must bypass remote image optimization. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {previewUrl && <img src={previewUrl} alt={asset.decorative ? '' : asset.alt} style={{ maxWidth: '100%', height: 'auto' }} />}
        {variant?.role === 'animation' && <><button type="button" disabled={busy || blocked || reduced || !staticVariant} onClick={() => setPlaying(!playing)}>{playing ? 'Pause private animation' : 'Play private animation'}</button><p>{reduced ? 'Reduced motion: static fallback preview.' : 'Static fallback is the default preview.'}</p>
          <label>Static fallback frame<input type="number" min="0" max={variant.frames - 1} step="1" value={frame} disabled={disabled || !!fallbackPending} onChange={e => setFrame(e.target.value)} /></label><button type="button" disabled={disabled || !frameValid || !!fallbackPending} onClick={() => void fallback()}>Create immutable fallback</button></>}
        <button type="button" disabled={disabled || !variant || !previewUrl || (!asset.decorative && !asset.alt.trim())} onClick={() => void perform(async (a) => { if (!variant || !current(a)) return; await onApply({ asset_id: variant.asset_id, variant_id: variant.variant_id }, a); if (current(a)) setStatus('Ready private variant applied.'); })}>Apply ready private variant</button>
      </> : <p>{!libraryAvailable ? 'Current private media availability is unknown. Refresh before previewing or applying.' : 'Quarantined and processing sources cannot be previewed or applied.'} {asset.failure_code ? 'Processing failed; the previous image remains selected.' : 'A completed clean scan and bounded decode are required.'}</p>}
    </div>}
  </section>;
}
