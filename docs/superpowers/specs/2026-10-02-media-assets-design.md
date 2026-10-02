# Uploaded media foundation design

Authoritative PRDv2 BaselineA, all65/all13binding; no GA downgrade or fullacceptance. Base3918fe48ea7763c8f3fdcf83551e4377cf2fa1b9. Root adopts this bounded local implementation sequence under user explicit completePRD/autonomous/parallel authorization. Technical choices are versioned development limits, not approved commercial/legal defaults. No routine artifact reapproval; actual production region/retention/rights/provider/economics choices remain pending and must not be operationalized.

Root rulings: scanner/decoder process isolation and actual signatures are mandatory; unknown/missing/stale/error is non-clean. Local OSS container downloads/builds are authorized implementation without paidcommitment; no host software install/globalDockerconfiguration/account changes. Default public/CDN/AI/provider/send capability stays unavailable. Private ready variants and exactlocalZIP are genuine deliverables, not emulatedhosting. Approved onlydevelopmentallowance256MiB,2admissions/process,1active globalprocessingchain,1/workspace; productionallowance absent failsclosed. Missing scan cannot unlock editorselection/export. Preserve existing preview/renderer noegress; known bytes injected by bounded authenticatedimmutablemanifesttransport only.

Parent exclusively owns the index/compiler/renderer and shared editor integration and evidence; workers A/B/C exact ownership follows proposal. Reserve db/031-media-assets.sql. Final ONEimmutable whole-slice review and ONE native Important/Critical pass; deferMinors; retain every substantive ruling/cost and fullreport. Existing raw-source server sanitization/ack limitation remains declared and requires its separate source-truth continuation before fullREQ016/GA; do not silently broaden persistence claims while addingmedia.

## Complete discovery/design proposal (all decisions/costs)

# Next implementation slice: uploaded assets and deterministic GIF fallback

Prepared 2026-10-02 for the parent implementing full PRDv2 Baseline A. This is a proposed technical design and sequence, not an implementation, acceptance record, procurement decision or approved policy. Discovery made no repository, index or canonical-checkout changes. The working repository is `/Users/prabalpratapsingh/Documents/Codex/2026-10-01/task/mailcraft`; `/Users/prabalpratapsingh/Desktop/mail` remains preserved.

## 1. Recommendation and truthful completion boundary

Implement a real local vertical slice: select/upload JPEG, PNG or GIF → durably quarantine the actual bytes under a tenant-scoped immutable key → run a real scanner and a bounded, network-isolated native decoder → record complete measured metadata and deterministic static derivatives → select an authorized immutable variant in the editor → freeze its asset manifest with the revision → preview verified derivatives without fetching any remote URL → download a deterministic HTML/assets ZIP with a selected static fallback.

The independent implementation path can proceed now: contracts, migrations, durable commands/jobs, local immutable storage, native processor, editor, compiler, negative tests and genuine decoder/browser evidence. A missing scanner, inaccessible container runtime or missing signature database is reported as unavailable and prevents readiness. Neither a successful decode nor an ordinary source fixture implies a clean malware scan. Production public publication, AI generation/editing, actual Outlook results, provider uploads and hosted-image lifetime remain gated by genuine configuration/procurement/legal evidence. Do not call a private localhost URL a public email URL.

This advances REQ-020's asset, alt-text, provenance, measured-size and prior-asset-preservation foundation and REQ-021's uploaded animation/static-fallback foundation. It does not fully accept either requirement. All 65 requirements and all 13 gates remain binding; none becomes fully accepted through this slice. Preserve existing security, release, consent, spend and send gates. No marketing sends, remote push, paid commitment, account changes or provider simulation belong here.

## 2. Authority and observed starting point

Read the ignored authoritative `docs/Mailcraft-Development-PRD-v2.0.md`, especially REQ-011/013/020/021; architecture §§3.1–3.3; schema/assets §4.1; TECH-030–034, asset states, TECH-040, TECH-070/071, image ownership §4.8; TECH-090–093; TECH-100/101; TST-02/03/05/06/08/12/13/15/16/17; motion/accessibility §§6.5–6.7/JRN-01; economics §8; gates §9.2. Relevant explicit contracts:

- Every asset, variant, reference, object key, operation and cache is tenant bound; force RLS and use composite tenant foreign keys.
- Assets have immutable published bytes, content hashes, MIME/dimensions/bytes, visibility, scan status, object key, alt text and retention metadata. Duplicate content deduplicates only within a workspace.
- Asset lifecycle is `quarantined → processing → ready_private → published → deleting → deleted`; only ready/published assets are renderable and only published assets get public delivery URLs.
- Image uploads are proposed at 20 MiB with pixel/decompression bounds; processor has no network. Rendering must never refetch mutable remote imagery.
- Artifact inputs include the asset manifest. Material asset mutations invalidate dependent approval/preflight evidence.
- Static fallback is first or selected frame, deterministic, with reduced-motion review. Actual Outlook behavior requires actual preflight evidence.
- Proposed lifetimes: quarantine/failed temporary objects 7 days; private originals active subscription plus 30-day cancellation recovery; public delivery derivatives at least 12 months after latest send/export reference, with explicit erasure/takedown override. The public-lifetime exception requires product/privacy approval; these are not approved legal defaults.

Only the repo-root `AGENTS.md` was found. It requires reading installed Next guides before edits. For this design, read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`: dedicated App Router handlers can consume Web Request bodies; existing catch-all behavior must not consume binary uploads as JSON. No `.agents` skill directory or local cloudskills entry was found at the working root, task root, home `.agents` or canonical `.agents`. No skill-based approval requirement was invented.

Concrete current code findings:

- No `assets`, `asset_variants`, `asset_references` tables in the migrations; no asset upload routes, scan workflow or media queue/worker.
- `src/domain/email-schema.ts` stores `image.src` directly, with `alt`/`decorative`. Its shared URL schema admits HTTPS/mailto/tel; image-specific validation should narrow new image sources to HTTPS. Schema is `1.0` only.
- `src/domain/email.ts:253` compiles from the spec alone. Manifest has renderer/sanitizer/schema/brand/locale/mapping/spec; no resolved immutable asset registry. Images currently render from `src` at a hard-coded 600px width.
- `src/server/emails.ts` checks brand authority but does not validate assets on create/save/checkpoint/restore. Immutable revisions are named `revisions`, not the illustrative PRD `email_revisions`.
- `src/domain/preflight.ts` always warns `ASSET_NOT_SNAPSHOTTED` and reports `IMAGE_WEIGHT_UNAVAILABLE`; it does not fetch remote images. Preserve that honest legacy behavior.
- `src/ui/editor.tsx` exposes only “Public image URL,” placeholder image blocks, and local preview/export warnings. Its save/freeze/download anchoring and abort rules are valuable and should be retained.
- `src/ui/api.ts` serializes JSON; binary uploads need a separate typed client helper, not base64 inside this generic function.
- `src/app/v1/[...path]/route.ts` calls `assertRouteMethod`, `checkOrigin` and `readJson` before dispatch. Do not silently raise the global 2 MiB JSON bound to accommodate images.
- `src/server/current-authority.ts` rereads workspace/membership/key/session in the resource transaction. `commands.ts:keyed` supplies durable idempotency and changed-payload rejection. Existing creation workers show durable SQL claims/leases, cancellation and final authority settlement; media should use separate jobs/roles, not reuse a paid text-generation operation type.
- `renderer/browser.mjs`, `src/server/render-download.ts` and isolated renderer fixtures abort all network routes. Adding an image feature must not change this to permissive HTTPS fetching.
- `release-gates.json` has all 13 pending/partial/blocked and no acceptance evidence. Existing browser screenshots are simulations, not Litmus/Outlook proof.

## 3. Dependency and tool practicality

Observed Node is `v24.12.0`. The repo transitively has Sharp `0.35.5` through Next's image dependency, with libvips `8.18.7`, working GIF input/output, cgif `0.5.4` and PNG/JPEG support. Make Sharp an explicit exact dependency in a separate `media/package.json` + lockfile; do not depend on Next continuing to include it and do not load it in the browser or decode untrusted images inside the Next process. Pin Node `24.12.0` consistently with the existing renderer initially, and record Linux image digest, architecture and complete `sharp.versions` in evidence.

A tiny, trusted, in-memory readonly probe genuinely encoded/decoded a two-frame 2×1 GIF: 91 encoded bytes, frame delays 100/200ms, first frame opaque red, selected second frame opaque blue. This verifies local API availability only. It does not qualify disposal, transparency, malformed inputs, sandboxing, scanner readiness or Linux output stability.

The Docker executable exists, but a readonly daemon version query was denied access to `/Users/prabalpratapsingh/.docker/run/docker.sock` by the execution sandbox. No `magick`, `convert`, `ffmpeg` or `clamscan` executable was found. A permitted runtime query/container run or an already authorized isolated worker is needed for sandbox acceptance; don't install host software or weaken isolation to make a check green. This was a sandbox permissions error, not an automatic-review rejection of a proposed escalation; no escalation was attempted by this discovery agent.

Use actual offline ClamAV alongside decoding. Official releases currently list `1.4.6` LTS and `1.5.4` stable; recommend exact `1.4.6` LTS for the first pinned scanner image, subject to build compatibility verification. A real, signed, dated database snapshot is mandatory. Its refresh process is separate from the no-network job. Do not use an always-clean scanner, “fixture clean” provider, or classify exit-code zero as clean if database initialization/scan-limit completion is unproven. Record engine and database digests; set `--alert-exceeds-max` or equivalent and treat limits/errors as non-clean.

Concrete local scanner setup to implement, without a host install:

1. Resolve the official `clamav/clamav:1.4.6_base` image for the actual host architecture; record its immutable repository digest and use that digest thereafter. The official non-base patch image can refresh its bundled DB, so an unrecorded tag is not sufficient evidence. A local `media/scan.Dockerfile` derives from the recorded base digest, creates non-root permissions/configuration and directly launches the bounded scan wrapper, not the default daemons. Pin/retest a patched image if the current underlying image has a security problem.
2. Create a task-local ignored scanner preparation directory and dedicated signature snapshot directory. A separate one-shot FreshClam updater container gets only those directories, no source images/application credentials, and only the official signature update network route. The user authorizes local OSS container downloads; no paid account/provider setup is involved. Update official main/daily/bytecode databases, validate their signatures through the real tools and record engine output, database identifiers/build times/SHA256 and completed-at. This is setup/refresh, outside the no-network processor. Do not expose port3310 or mount the host Docker socket into any job.
3. Mount the completed snapshot read-only into each scanner job. Initial local readiness requires a completed verified official snapshot whose daily build time is no more than 48 hours old; record this as a development freshness profile, and fail `SCAN_DATABASE_STALE` when exceeded. Production freshness/update SLA remains operational policy/evidence. A snapshot swap is atomic and receipts pin the exact snapshot digest, avoiding in-flight mixed databases.
4. The bounded runtime shape is `docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges --pids-limit 64 --memory 3g --cpus 2 --user clamav --entrypoint clamscan`, with only source/output-files mounted read-only and the fixed database mounted at `/var/lib/clamav` read-only, plus a small private tmpfs. Pass arguments as an argv array, never concatenate a user filename into a shell command. Set explicit `--database=/var/lib/clamav --official-db-only=yes --max-filesize=20M --max-scansize=80M --max-recursion=4 --max-files=16 --alert-exceeds-max=yes`; verify supported options with the pinned `clamscan --help`. The supervisor enforces the wall deadline/output cap and reaps on abort. Do not add a timeout command/daemon that can hide the real exit code.
5. Require real engine version, source digest, scanned-file count and completed scan status, not just exit code 0. Exit 1/infected, 2/error, a skipped file, over-limit alert, stale/missing signatures, timeout, killed container, malformed receipt or mismatched hash are non-clean. Run EICAR through the scanner stage alone and assert infected/quarantine refusal; generate a supported harmless raster and scan+decode+rescan its derivatives to prove an actual ready-private path. Never upload an infected fixture to a public endpoint. A fixture-only custom signature DB can test wrapper parsing but cannot qualify asset readiness.
6. Original scan precedes decode; reencoded derivative scan follows decode. The scanner's 90-second budget is the aggregate for both stages, not 90 seconds per file/container. Decoder 60 seconds plus scan 90 seconds and bounded storage/settlement fit the 180-second overall deadline. If startup/DB loading cannot meet this profile, record measured failure and adjust the versioned engineering budget before claiming readiness; never skip the second scan or convert timeout into success.

For local ZIP export, recommend exact `fflate@0.8.3` only after ordinary package/lockfile resolution validates that release. Its authoritative package currently says 0.8.3/MIT. Server-created ZIP entries are bounded, sorted, fixed-time, generated names; never unpack user archives. Compression level 0 is adequate for already compressed images and reduces CPU variance. No handwritten archive parser is needed.

Primary references checked:

- [Sharp constructor](https://sharp.pixelplumbing.com/api-constructor/): warning-strict decode, input-pixel limits, page selection and animated stacked-frame representation. Metadata bounds alone are not proof of safe decompression.
- [Sharp metadata](https://sharp.pixelplumbing.com/api-input/): metadata inspection does not fully decode compressed pixels; it includes pages/pageHeight/delays.
- [Sharp output](https://sharp.pixelplumbing.com/api-output/): default output strips source metadata; explicit deterministic settings and runtime pinning are still required.
- [Pinned libvips GIF loader source](https://raw.githubusercontent.com/libvips/libvips/v8.18.7/libvips/foreign/nsgifload.c) and [libnsgif public API](https://raw.githubusercontent.com/netsurf-browser/libnsgif/master/include/nsgif.h): native GIF frame decoding is available. This supports choosing a maintained native decoder; qualification must prove actual composited frame semantics.
- [ClamAV releases](https://www.clamav.net/downloads), [official scanning instructions](https://docs.clamav.net/manual/Usage/Scanning.html), [official Docker instructions](https://docs.clamav.net/manual/Installing/Docker.html): engine plus current signature database are separate operational requirements.
- [fflate authoritative package](https://raw.githubusercontent.com/101arrowz/fflate/master/package.json).

## 4. Routine implementation rulings and explicit bounds

These are versioned engineering limits for the local foundation, not a reduced GA promise or approved commercial allowances. Expose actionable limit messages and keep the original draft/asset on every rejection.

| Concern | First increment ruling |
|---|---|
| Inputs | JPEG, PNG, GIF87a/GIF89a, selected by byte signature and decoder agreement. Reject SVG, PDF, TIFF, AVIF, WebP, HTML, scripts, ZIP and unknown/polyglot formats in this increment; later format support needs qualification. Reject animated PNG explicitly rather than silently discarding frames. |
| Upload bound | Exactly 20×1024×1024 raw body bytes maximum. Enforce streamed actual count, even with absent/false Content-Length. Reject compressed Content-Encoding; no JSON/base64/formData buffering. ≤2 upload admissions per app process plus durable per-workspace byte reservation. |
| Static geometry | Positive axes ≤8192; width×height ≤16,777,216 pixels; ≤4 decoded output channels; expanded RGBA ≤64 MiB. Orientation is applied before recording output dimensions. |
| GIF geometry/work | Positive canvas axes ≤4096; canvas ≤4,194,304 pixels; ≤200 frames; canvas pixels×frames ≤16,777,216; expanded full RGBA representation ≤64 MiB; metadata/extension data ≤256 KiB. Bound selected-frame replay work by all preceding frames, not only final output. |
| Decode validation | Checked arithmetic throughout. Strict warning/error/truncation rejection, `unlimited:false`, explicit pixel/channel limits. Full actual decode within sandbox; reject invalid palettes/rectangles/LZW chains/truncated streams/unsupported critical metadata. Header parsing is a bounded gate, not a replacement decoder. |
| Source fidelity | Original bytes stay private and immutable. Public/exportable animation is a metadata-stripped decoded/reencoded GIF derivative; never publish original bytes or preserve active/unknown metadata blindly. Record changed derivative digest and encoder profile. |
| Fallback | Native fully composited first frame by default; explicit integer selected frame supported. PNG RGBA derivative preserving transparency, no undocumented flattening. Subsequent optional flattening requires an explicit recorded background transform. |
| Output limits | Each derivative ≤20 MiB; total derivatives per operation ≤40 MiB; full job output ≤48 MiB incl. manifest. No source filename controls a filesystem path. Reject overflow rather than truncate output. |
| Processor runtime | One-shot non-root decoder container; network none; read-only root; fresh ≤128 MiB tmpfs; one input read-only and one fresh output mount; 1 GiB memory; 1 CPU; 64 PIDs; no extra caps, `no-new-privileges`, default seccomp; hard 60s wall deadline and kill/reap on cancellation. `sharp.concurrency(1)` and bounded/disabled cache. |
| Scanner runtime | Separate actual scanner stage with read-only source and signed DB mounts; network none; no app credentials; bounded 3 GiB memory/2 CPUs/64 PIDs/90s initially. Measure its real working set; insufficient memory yields non-clean failure, never fallback-to-clean. |
| Job budget | 180s overall operation budget, at most 2 safe transient processing attempts. Policy/refusal/limit/infected errors terminal. Preserve deterministic input/transform profile across retries. |
| Storage quota | Local development-only finite configured allowance; proposed 256 MiB/workspace for original+derivative objects, reserved atomically before upload/work. Production allowance must be explicitly configured under approved economics, not inherit this value. Existing references remain readable when quota is full. |
| Network | Browser uploads actual local file only. No remote image import/proxy, no safe-fetch extension in this slice; source URLs aren't fetched. Processor and scanner perform no DNS/network. |
| Rights | Required explicit uploader attestation: authorized use for this workspace and intended email/export purpose; record actor/time/terms version and source type. It is evidence of attestation, not a legal determination. Generated-media provider terms/provenance remain unconfigured. |
| Accessibility | Alt required unless deliberately decorative; live-text alternative when essential text exists in an image. Preview animation paused by default; visible Play/Pause; reduced motion uses fallback and never autoplays. Flash-safety is human-review-required unless genuinely measured. |
| Retention | Store retention class, proposed policy version, dates/reference anchors and legal-hold/takedown state. Local quarantine sweep at 7 days can run under a plainly development policy. Do not operationalize production 30-day/12-month legal policies as approved. |

GIF qualification must cover disposal 0/1 (unspecified/keep), 2 (restore background), 3 (restore prior), local/global palettes, transparent pixels, partial frame rectangles, interlacing, nonzero selected frames and malformed boundaries. The selected frame is the canvas as displayed at that frame, not the raw patch. Use native page decode and compare to independent expected RGBA fixtures. If the pinned loader fails any supported disposal fixture, explicitly reject that construct and record its continuation requirement; do not replace it with a hand-built LZW parser or silently wrong fallback. For animation output, fully decode/reencode all supported frames, preserve explicit timing/loop metadata, and record GIF centisecond quantization and normalization if any. Default zero-delay behavior must be recorded, not browser-dependent.

## 5. Durable model, authority, storage and state machine

Add the next available migration (likely `db/031-media-assets.sql`; parent reserves its number after Monaco integration). Use separate tables and roles; avoid proliferating global bypass powers.

- `asset_objects`: workspace/id, sha256, byte_size, object_key, MIME, storage_profile, created_at; unique `(workspace_id,sha256,storage_profile)`; local keys include workspace and kind. Immutable object metadata and bytes. Same content in two tenants gets separate objects/keys and no cross-tenant existence response.
- `assets`: workspace/id, source_object_id, source_kind=`upload`, upload operation, state, mutable metadata version, default alt/decorative, source/provenance/rights evidence, quarantined_at/ready_at/deleted_at, retention class/policy/proposed-until, takedown. Content/rights provenance never rewritten in place; annotations/version may change. Multiple upload receipts may point to a same-tenant object so dedupe never erases separate rights/actor histories.
- `asset_scans`: append-only source/derivative object ID/hash, stage, engine/version, signatures hash/version/time, state=`pending|clean|infected|error|unavailable|limit_exceeded`, bounded failure code and completed_at. No raw scanner output/secret leakage in UI or general audit.
- `asset_variants`: workspace/id, asset/source object IDs, output object ID, role=`static|animation|fallback`, MIME/bytes/dimensions/hash, frame count/delays/loop, selected frame, transform/decoder/encoder profile, transparency/colourspace, immutable provenance. Unique immutable transformation identity includes source digest, processing profile, variant role and selected frame.
- `asset_references`: workspace/id, asset/variant ID, draft/revision/export IDs as applicable, reference kind, created_at, effective retention anchor. Composite same-tenant FKs to all resources. Draft references update transactionally; revision/export references are immutable and pin the actual variant. Do not add sent-reference rows when no send occurred.
- `media_jobs`: workspace/operation ID, source IDs, requested transform, phase, attempt/lease token+expiry, next_at/deadline, cancellation and bounded diagnostic metadata. PostgreSQL owns durable work; Redis hinting can be rebuildable and added later without changing truth.
- `media_uploads`: workspace/upload ID, operation ID, expected max/count/hash, staged object, actor/key provenance, reservation, expiry/state/version. The upload-intent idempotency row and metadata are atomic; a deterministic transfer token is tenant/actor bound and never appears in email URLs.

All tenant tables use composite PK/unique keys and FKs, ENABLE+FORCE RLS, current transaction-local context and non-owner runtime roles. Do not grant runtime UPDATE/DELETE on object/variant/scan/revision-reference records. Use narrow fixed-search-path claim/settle functions for a separate scheduler/media worker and a restricted erasure service. Runtime readiness transition must be impossible without all required clean scan records, valid decoder outputs, current source hash and successful conditional storage writes.

`quarantined`: durable source, no preview or selection. `processing`: scan/decode job active; previous editor asset remains usable. If scan is missing/error/over limit, retain non-renderable state plus explicit reason (the operation can settle failed/unavailable); never enter ready. `ready_private`: verified original scan and scan of every derivative are clean, processor receipt validates, storage digest matches, rights attestation present. Only sanitized/reencoded variants are served, never original bytes. `published`: later publication separately authorized and configured, with immutable public keys and approved terms. `deleting/deleted`: no new references or cached derivative admission; takedown invalidates dependent delivery evidence and prevents future output even if an old private cache exists.

Local file storage is a real implementation, not a provider emulator. `FileAssetStore` is explicitly `local-private-v1`, configured only under existing local development mode, outside Next `public/`. A future `S3AssetStore` can implement the same interface after account/region/legal provisioning. Its absence returns `ASSET_PUBLICATION_NOT_CONFIGURED`. Canonical bytes never come from a remote user URL. Writes are conditional/create-only (temp private file + fsync/atomic install) and validate existing-byte hash on dedupe; reject symlinks/path traversal and map only generated keys. Orphans after a DB rollback are recoverable by a logged age-bound sweep; never delete referenced objects blindly.

Do not hold a DB transaction throughout upload, scanner or decoder execution. Authorize+reserve short transaction → stream to isolated private spool → finalize intent/source and enqueue in another current-authority transaction. Worker claims obtain source hash/profile/cancellation state; renew/recheck authority before stages and settlement. Final settlement rechecks workspace/member/API key/entitlement/resource state and exact lease/hash. If authority is lost, no ready asset is attached, no bytes are exposed and quota settles safely. Already completed local decode is an internal orphan, not permission to return it.

## 6. API and shared interfaces to agree before parallel work

JSON command endpoints should retain `keyed()` semantics; raw transfer is a separate concrete App Router handler so it cannot be consumed by `readJson()`.

1. `POST /v1/assets/uploads`: JSON `{filename,declared_mime,byte_size,sha256,rights:{attested:true,terms_version},alt,decorative}`; current `edit` authority, `assets:write`, finite quota, Idempotency-Key. Returns same upload/operation on replay; changed payload is 409; filename display-only/bounded. Body digest lets the second-stage transfer prove replay identity.
2. `PUT /v1/assets/uploads/:upload_id/content`: streamed `application/octet-stream` body; actor/workspace headers, upload token, actual SHA256/length comparison, no redirects/compressed encoding. Auth before reading and again before commit. A retry of already finalized matching bytes returns same operation without new quota/object/job; mismatch rejects. Client cancellation clears only incomplete stage, not previously committed source.
3. `GET /v1/assets` and `GET /v1/assets/:id`: current `read`, `assets:read`; paginated metadata/status with no private object paths/token/source bytes. Missing/cross-tenant IDs look the same.
4. `GET /v1/assets/:id/variants/:variant_id/content`: current `read`, `assets:read`; only ready private sanitized derivative; bytes checked against stored digest; explicit MIME, `nosniff`, no-store/private cache, bounded response; no public credentialless endpoint.
5. `POST /v1/assets/:id/fallback`: current `edit`, `assets:write`, If-Match metadata version and idempotency; exact selected frame; creates a new immutable variant/job without modifying referenced prior bytes. Previous fallback remains until explicit draft choice.
6. `POST /v1/assets/:id/remove`: current `edit`, `assets:write`, idempotency; detach/soft hide private library entry; referenced immutable revision variants remain subject to retention. Takedown/erasure is a distinct restricted action, not this ordinary editor command.
7. Existing operations read/cancel gains explicit media type/scopes; no text-generation scope fallback. Publication route may be represented with an honest unconfigured error, but do not implement an arbitrary local-public substitute.

Before implementation, parent agrees browser-safe `src/domain/assets.ts` contracts:

```ts
type AssetState = 'quarantined'|'processing'|'ready_private'|'published'|'deleting'|'deleted';
type AssetVariantRef = {asset_id:string;variant_id:string};
type AssetManifestEntry = AssetVariantRef & {
  source_sha256:string; sha256:string; mime:'image/png'|'image/jpeg'|'image/gif';
  bytes:number;width:number;height:number;role:'static'|'animation'|'fallback';
  frames:number;fallback?:AssetVariantRef;selected_frame?:number;
  processing_profile:string;storage_profile:string;visibility:'private'|'public';
  public_url?:string; rights_evidence_id:string; scan_evidence_ids:string[];
};
type AssetManifest = {version:'asset-manifest-1';entries:AssetManifestEntry[]};
```

Internal only, separate from browser metadata:

```ts
interface AssetStore {
  putImmutable(key:string,bytes:Uint8Array,sha256:string):Promise<{key:string;bytes:number;sha256:string}>;
  readVerified(key:string,sha256:string,maxBytes:number):Promise<Uint8Array>;
  removeAuthorized(key:string):Promise<void>;
  profile:string; visibility:'private'|'public';
}
type MediaProcessInput = {version:1;source_sha256:string;source_path:string;
  output_directory:string; selected_frame:number; processing_profile:string};
type MediaProcessReceipt = {version:1;source_sha256:string;profile:string;
  runtime:{node:string;sharp:string;vips:string;image_digest:string;architecture:string};
  source_metadata:{mime:string;bytes:number;width:number;height:number;
    frames:number;delays_ms:number[];loop:number|null;has_alpha:boolean};
  outputs:Array<{role:'static'|'animation'|'fallback';filename:string;mime:string;
    bytes:number;sha256:string;width:number;height:number;selected_frame?:number}>};
```

The processor accepts generated local paths only inside fixed mount roots; users cannot supply a path/URL in the protocol. Validate exact receipt shape, IDs/profile/hash and every output file signature/byte count/hash independently before settlement. A scanner receipt is separate: decode receipt has no `scan_clean:true` shortcut. Local one-shot trusted supervisor is sufficient; future remote supervisor requires authenticated signed transport and the same profile/hash binding before use.

## 7. Compiler, editor and export integration

Version the expanded schema as `1.1`, keeping legacy `1.0` roundtrips and saved specs intact. The image shape accepts exactly one of `src` or `{asset_id,variant_id}`, plus alt/decorative/width/display policy; an asset-backed new draft uses `1.1`. New HTTPS-only external `src` is legacy/unsnapshotted and is never resolved by the compiler. Keep explicit older-source behavior rather than inventing a background remote-import job.

The compiler takes an explicit verified resolved manifest/options argument; it stays deterministic and does not query storage or fetch URLs. Server resolution walks nested image nodes and registered raw/custom-HTML bindings, verifies each same-tenant resource and selected fallback, and sorts manifest entries by stable IDs. Manifest and asset digest enter artifact/preflight/export hashes. No compile timestamp, mutable URL, blob URL or private presigned token enters an immutable revision.

For a private preview/checkpoint, use an explicit non-deliverable marker URL under a reserved `.invalid` origin derived from immutable IDs, and attach corresponding server-validated bindings; it is never claimed as a working public image. This permits current HTTPS sanitizer behavior and stable raw-fork provenance. Private marker URLs make ordinary delivery/hosted HTML output ineligible. No string that merely resembles this marker is trusted: resolve exact IDs to same-tenant approved variants. Alternatively parent can choose explicit inert node placeholders, but must preserve raw-fork asset mapping and freeze the same manifest; do not silently bake private authenticated URLs into revisions.

Raw/opaque HTML handling must preserve existing sanitizer/byte-fidelity work. Register only exact canonical asset marker/public URLs the server resolves; never infer ownership from hostname alone. Preserve external references unchanged with the existing unavailable warning. A raw fork retains frozen registered bindings. Conversion-to-blocks maps a registered immutable image to asset references; external `<img>` remains explicit remote `src`. Remix/localize/restore reauthorize all assets and preserve source-revision/reference identity; source removal/takedown produces an actionable conflict. No processor/network invocation occurs inside conversion or compilation.

Browser editor image inspector adds upload/status/library selection, measured MIME/bytes/dimensions/frame count and 200 KB optimization advisory, alt/decorative, GIF fallback frame number and preview. Client-generated thumbnails must not be treated as server-verified assets. Maintain selection anchor `{workspace,actor,email,node_id,ack_doc_version,source_asset_ref}`: no delayed upload/fallback/preview result may replace a changed/deleted node, newer asset, switched workspace, logged-out actor or unmounted editor. Explicit apply changes the existing CAS draft and invalidates frozen revision/preflight/download anchor. Processing failure leaves the previous asset intact. Failed rights/scan/limit state has recovery, not a misleading green thumbnail. Phone image edits work via accessible sheet; keyboard selects/pause controls; reduced motion serves fallback immediately.

For editor previews, the app resolves and inserts verified sanitized derivative bytes into a transient preview transport (bounded data URLs or blob URLs); these never enter saved specs/hashes. The isolated browser export receives only a bounded verified static-image bundle binding exact immutable URL → MIME/hash/bytes. Its routes fulfill only those known byte buffers and continue aborting every other image/font/script/frame request. Do not permit a generic assets-host network exception. Extend protocol version/renderer profile, verify limits including base64 expansion, and sign bundle bytes as part of the request. Use static fallback in PNG/PDF snapshots and document that this does not prove Outlook.

The current isolated renderer request cap is 2 MiB. Add an explicitly versioned image-bundle request profile with HTML ≤2 MiB, total decoded static-image bytes ≤4 MiB, at most 200 entries, and complete signed JSON transport ≤8 MiB including base64 expansion; legacy requests retain their current bound. This is a renderer-specific cap, not an increase to the app's generic JSON parser. Oversized image evidence returns an actionable render limit while local ZIP export remains independently available. A later deterministic preview-resize variant can improve this limit without overwriting the frozen source/fallback; do not silently resize delivered images.

First usable download is a ZIP local bundle: `index.html`, `email.txt`, `asset-manifest.json`, rights/provenance receipt (no prompts/tokens/PII), and generated `assets/<sha256>.<ext>` files. Sort filenames, fixed valid ZIP timestamp, deterministic compression settings. Build one explicitly labeled animation bundle and one static-fallback bundle; minimum increment may default to static and expose animation choice after review. Exact transform policy/manifest binds output hash. Read only clean authorized referenced variants with byte limits; files contain no private URLs or original source metadata. Relative links make it portable locally; disclose that final hosted/send destination needs valid public asset publishing/provider upload. Existing plain HTML export with private assets must refuse with an actionable bundle choice rather than quietly ship broken markers. Legacy remote-only drafts keep their disclosed prior behavior; no claim of immutable-hosted correctness.

Bound a bundle to 200 distinct variants, 40 MiB total image bytes, 2 MiB HTML and 48 MiB complete archive, with bounded manifest/receipt sizes and an admission slot. Refuse excess; do not truncate entries. No uploaded ZIP is ever extracted. Check current readiness/takedown/authority before admitting any cached bytes and before responding, even when a historical immutable revision references the variant.

200 KB advisory uses measured derivative bytes (define local threshold as 200×1024 until product resolves KB convention); known uploaded assets no longer receive blanket “unmeasured” warnings. External raw/custom assets retain unmeasured findings. Animation/reduced-motion/fallback review and missing actual Outlook evidence stay visible and cannot be erased by local browser screenshots. Asset change creates a new artifact digest and old approval/preflight remains ineligible.

## 8. Parallel ownership and sequencing

Worker C owns only new `src/ui/asset-picker.tsx`, `src/ui/asset-command.ts`, `tests/asset-client-recovery.test.ts`, `scripts/assets-browser.ts`; root mounts and performs final scope/source/version/authority CAS. Exact picker anchor is workspace, actor, email, nodeId, docVersion and opaque `JSON.stringify(full image block)` sourceRef. Worker D owns existing scope/HTTP-method/API-generator contracts and generated outputs; root retains the catch-all dispatch and binary output integration. Neither owns Git index or a commit slot. No upload completion applies an image automatically.


Three implementation workers and a separate API contract implementer work in bounded, disjoint files. Parent owns integration seams and shared existing files, preventing competing editor/route/compiler/package edits.

### Worker A: durable tenant asset service

Own new files `db/031-media-assets.sql` (or reserved next number), `src/domain/assets.ts`, `src/server/asset-store.ts`, `src/server/assets.ts`, `src/server/asset-upload.ts`, `src/server/asset-route.ts`, `src/server/media-jobs.ts`, `src/server/media-worker.ts`, `src/server/media-supervisor.ts`, `src/app/v1/assets/uploads/[uploadId]/content/route.ts`, `tests/assets-db.test.ts`, `tests/asset-store.test.ts`, `tests/asset-upload.test.ts`, `tests/media-jobs-db.test.ts`, `tests/media-authority-db.test.ts`, and `scripts/smoke-assets.ts`.

Deliver actual bounded binary upload, private immutable byte storage, forced RLS/composite FKs, current-authority/idempotency/CAS checks, rights records, append-only scan/variant/reference evidence, quota and durable job claims/recovery/cancel/settlement. Supervisor executes worker B's scanner/decoder profile without network or credentials, validates actual receipts, and leaves assets quarantined when unavailable. Provide `resolveAssetManifest(tx,principal,spec,target)`, `readAssetVariantsVerified(...)`, `syncDraftAssetReferences(...)`, `pinRevisionAssetReferences(...)` and `runMediaJob(...)` as explicit interfaces. Do not edit generic catch-all HTTP, shared scope catalog, compiler or editor.

### Worker B: actual decoder and scanner runtime

Own `media/package.json`, `media/package-lock.json`, `media/Dockerfile`, `media/scan.Dockerfile`, `media/protocol.mjs`, `media/protocol.d.mts`, `media/process.mjs`, `media/bounds.mjs`, `media/scan.mjs`, `media/README.md`, `media/LICENSES/`, `tests/media-protocol.test.ts`, `tests/media-decoder.test.ts`, `tests/fixtures/media/` and `scripts/smoke-media.mjs`.

Deliver exact Sharp pin and native signatures/metadata/full decode/static/transparency/disposal qualification, real ClamAV receipt logic, one-shot sandbox CLI, output manifest/hash verification, bounded strict input/output, genuine malformed/decompression/nonexecution evidence. No Next UI/route/backend edits or invented scan result. Include known expected-RGBA disposal fixtures with provenance/licenses. A tiny test-only signature DB may validate adapter classification but is expressly not sufficient for readiness/security acceptance; full signed production-signature snapshot and real harmless/malware-negative probes are separately required.

### Parent: integration and final validation

Own existing `package.json`/lockfile (fflate only if needed), `src/domain/email-schema.ts`, `src/domain/email.ts`, `src/domain/preflight.ts`, `src/domain/api-keys.ts`, `src/domain/email-conversion.ts`, `src/server/emails.ts`, `src/server/derivation.ts`, `src/server/email-conversion.ts`, `src/server/render-client.ts`, `src/server/render-cache.ts`, `src/server/render-download.ts`, `src/server/http.ts`, `src/app/v1/[...path]/route.ts`, `src/ui/editor.tsx`, `src/ui/api.ts`, `renderer/protocol.mjs`/types/browser/Docker/profile docs; add `src/server/asset-bundle.ts`, `src/ui/asset-picker.tsx`, `src/ui/asset-command.ts`, `tests/asset-compiler.test.ts`, `tests/asset-bundle.test.ts`, `tests/asset-client-recovery.test.ts`, `scripts/assets-browser.ts` and corresponding contract/OpenAPI generation sources and capability evidence.

Parent integration retains actual storage/provider/scanner errors and does not fabricate worker success to unblock UI development. Workers can develop independent pure contract tests/fixtures while a runtime setup is unresolved. Parent determines sandbox permission escalation only after preparing an exact bounded container command; current task authorization covers routine local implementation, not paid provisioning.

Sequence:

1. Parent reserves migration number and shared contract/interface profile. Publish profile version and limits to both workers; no broad review reopening.
2. A adds DB/storage/upload/current-authority foundation; B adds genuine pinned decoder/scanner and supported fixture qualification in parallel. Unconfigured services fail closed throughout.
3. A joins B through supervisor/profile receipts; execute actual clean and denial flows, lease crash/recovery, cancellation and quota settlement before exposing ready assets.
4. Parent integrates schema1.1, resolve/pin references at create/save/freeze/restore/remix/raw fork/conversion, deterministic compiler and private/hosted/bundle eligibility.
5. Parent wires functional editor/status/fallback/client recovery and immutable image bundles in preview/renderer without new egress.
6. Parent runs bounded real browser and isolated runtime qualification; archives code/build/container/dependency/dataset hashes and outputs; preserves “partial / production blocked” capability status.
7. Only then move to full REQ-020 provider work and REQ-021 real-client/public-delivery continuation; legal/procurement/configuration decisions stay explicit.

## 9. Meaningful validation and retained evidence

- Actual bytes: browser uploads a real GIF/PNG/JPEG and receives durable operation/status; source and derivatives hashes match stored bytes. Repeat same key/body produces one object/operation/ledger effect; changed key payload rejects. Connection loss midstream cannot create ready assets or orphan quota indefinitely.
- Actual decoder: independently expected RGBA for disposal 0/1/2/3, transparency, palette/interlacing/partial rectangles, selected fallback; metadata/output signatures; same Linux profile/input/selection produces identical derivative/manifest bytes over retries. Changing frame/profile changes immutable ID/digest and cannot rewrite an old revision.
- Structural/decompression attacks: fake MIME, SVG/HTML/script/polyglot, APNG, malformed/truncated GIF, invalid LZW, huge logical canvas/frame count, compressed PNG bomb, pathological metadata, axis/arithmetic overflow and output explosion reject inside bounded sandbox. Observe wall/CPU/RSS and child reap; no forbidden cloud/local filesystem/network access. Zero-hit HTTP/DNS tripwire and scripts/non-image fixtures do not execute.
- Actual scanner: real engine+signed DB; harmless supported raster completes clean; EICAR scanner-stage denial (not decoded as an image); infected/scan limit/timeout/error/absent/stale database never enters ready. Both original and reencoded outputs have bound evidence; scanner byte-hash change rejects receipt. A tiny fixture DB does not pass this acceptance.
- Tenant/authority: actual non-owner RLS role with no context, wrong workspace IDs/FKs/object keys/manifest variant, guessed receipts, library reads, derivative reads, dedupe existence, revision joins and worker claims deny. Viewer reads only authorized ready derivatives; Billing cannot read assets; Editor cannot publish/send/approve; revoked session/key/member or locked/deleting workspace fails at transfer commit, worker start and final settlement.
- Source references: remix/locale/raw fork/conversion preserve same-tenant frozen asset references and provenance; revoked/taken-down source never causes cross-tenant reuse or stale cached bytes; restoring old revision creates a new head and cannot mutate prior bytes. Duplicate content has separate upload rights receipts.
- Compiler/export: missing asset/variant/fallback, unknown scan/rights, private public-URL substitution and hash mismatch block affected outputs. Canonical manifests deterministically include both animation and fallback hashes and processing profiles. ZIP entries are safe/bounded/deterministic; rewritten local paths resolve to exact files; static bundle uses selected frame and contains no blob/auth/signed URL. Neither bundle creates a send/provider operation.
- Renderer nonexecution: actual PNG/PDF embeds known private static derivative via in-memory bundle; all unbound images/fonts/scripts/frames remain zero-hit. Authenticated protocol rejects changed bundle digest/replay/excess bytes and cancellation prevents cache commit. Existing cache changes profile/fingerprint with asset evidence.
- Browser recovery: verify ready upload applied to correct node, upload/fallback failure preserves previous asset, stale response after node deletion/new selection/workspace switch/logout/unmount cannot apply, post-upload CAS conflict preserves unsaved work. Page reload shows durable status and same ready asset; client receives availability errors rather than fake thumbnails.
- Browser accessibility: keyboard upload/picker/fallback/apply/play/pause, 390px sheet behavior, alt/decorative, explicit pending/failed/ready statuses, `prefers-reduced-motion` fallback and no animation autoplay. Actual screenshot confirms expected fallback pixels; this is a local browser artifact only.
- Dependent gates: new asset/fallback/display-policy/rights change invalidates frozen artifact/preflight/campaign approval; local scanner/image outputs never make actual Outlook pass or turn production release gates green. Existing no-real-send guard remains enforced.
- Lifecycle/quota: simultaneous admission cannot exceed finite allowance; retry consumes once; cleanup cancels/releases failed reservations; reference-pinned originals/derivatives aren't deleted on ordinary library removal. Quarantine purge deletes bytes/metadata with an audit receipt; erasure/takedown removes cached derivative availability and records unsatisfied backend stages honestly.

Run targeted unit/actual DB tests first, then repo typecheck/lint/test/API generation/build and the bounded browser/runtime suite. Repeat only when changes/failures warrant it. Evidence names environment, build/dependency/container digest, runtime sandbox options, fixture bytes/hash, time, owner, result and retained actual PNG/ZIP/log outputs. Do not mark all TST rows or gates complete from this subset.

## 10. Material setup decisions, costs and ignored alternatives

### Truly material decisions/setup still needed

- Production storage account, backend/region/residency, private-original/public-derivative separation, CDN domain/cache invalidation/takedown, encryption/key ownership, backup/restore and operational retention contract. Do not choose/create these accounts in this slice.
- Legal/product acceptance of upload rights wording and versioned policies, provider AI image rights/data handling, public derivatives' minimum-12-month lifetime versus cancellation/erasure/takedown, data regions/subprocessors. Store proposed metadata now; approval is genuinely material before real customer/production activation.
- AI production provider/model/API contract, editing/upload support, terms/rights, credentials, billing/reservations, funding/spend caps, accounting event and ambiguity reconciliation. Foundation interface is reusable; no model/provider success is simulated.
- Container runtime access in this environment and scanner image/signed signature snapshot availability. These are actual local technical setup dependencies, not reasons to stop all independent implementation work. Scanner freshness policy/update ownership and runtime resource working set need operational evidence.
- Exact vendor Outlook/client manifest, API usage/retention rights and actual capture evidence. The browser slice supplies none of that procurement acceptance.
- Commercial storage/egress/media limits, pricing/credits, forecasted annual heavy-use and abuse cases, economics signoff. Local limits are disclosed development bounds.

### Cost record

No paid costs were incurred by discovery. No priced vendor commitment is proposed. Sharp/libvips and fflate are open-source dependencies (retain proper licenses/SBOM); ClamAV is open-source but has image/distribution/license obligations and real signature update bandwidth/operations cost. The first implementation must measure CPU seconds, peak memory, scanner database/image size, original+derivative bytes, processing retries, storage reservations and local egress rather than treating free software as zero service cost.

Worst local per-operation allocation is up to 20 MiB original + 40 MiB immutable derivatives plus bounded 48 MiB output staging and 128 MiB decoder scratch; scanner database storage is additional and measured. Decoder up to 1 GiB × 60s and scanner up to 3 GiB × 90s are resource ceilings, not normal consumption estimates. Concurrent jobs amplify those limits, so initially one global active processor/scan chain and one active job/workspace are sufficient; later distributed fairness/load needs its own evidence. ZIP/read/preview buffers and base64 inflate memory/transport and must be bounded explicitly. Production costs additionally include object requests, long-lived public storage, CDN bandwidth/cache invalidation, signature updates, monitoring, support/abuse and deletion/backup exceptions; no invented dollar estimate.

AI/GIF generated units stay separate from text credits. No automatic paid generation/optimization occurs merely from selecting an image slot. Existing budget reservation contracts remain binding; a local upload doesn't consume AI-provider credits. Future provider retries/uncertain charges cannot inherit the deterministic local decoder retry policy.

### Alternatives deliberately not selected

- URL-only image picker/UI mockup: cannot establish immutable measured tenant assets or actual GIF fallback.
- Inline base64 in saved EmailSpec or raising the global JSON limit: bloats canonical docs, bypasses streaming limits and leaks private bytes into artifacts.
- Public localhost/static `public/` directory or private signed URL in email: misrepresents durability/visibility and breaks tenant/retention contracts.
- Direct object-cloud/CDN provisioning now: material legal/account/region/economics setup is not present.
- Handwritten GIF LZW/disposal implementation, or naive raw-patch extraction: maintained native decoder plus independent compositor fixtures is safer and less work. Handwritten bounded signature/header validation is acceptable only as an outer gate.
- Browser canvas fallback/decode as authority: client memory limits/fidelity/status are insufficient; native server evidence owns readiness.
- Sharp decode in API process or unsandboxed hostile host probe: couples hostile native parsing to application credentials/resource availability.
- ImageMagick/FFmpeg rollout: neither is locally available; adds a larger native surface and delegate/network/configuration problem without necessity for these raster inputs.
- Native decoder success as `scan_status=clean`, canned scanner/provider success, always-clean test adapter or tiny signature DB promoted to security evidence: fabricates a gate.
- Network-enabled processor/scanner or permissive renderer image-host allowlist: violates no-network isolation and immutable-bytes rendering.
- Cross-workspace hash dedupe/CDN common cache: risks existence disclosure and unauthorized reference reuse.
- Rewriting published files or selecting a new fallback in an old revision: breaks deterministic artifact/approval provenance.
- Automatically importing arbitrary remote URLs while building assets: expands SSRF/fetch/decompression scope; maintain explicit legacy unavailable status and sequence remote ingestion later through the safe gateway.
- All formats, crop UI, provider AI controls or full production deployment in the first increment: separate qualified continuation work; no GA deferral is approved by sequencing.
- Opportunistic reopening of prior Monaco/conversion/authority/provider reviews: parent is completing the active canonical Monaco qualification; this design integrates with those contracts and identifies only new media seams.

## 11. Continuation to full REQ-020/021

After the first increment, sequence public immutable publication/retention/erasure + real object/CDN account evidence, then generation/edit provider adapters with actual provider terms and bounded paid accounting, then additional image transforms/crop/optimization and animation generation. Connect resulting assets through exactly the same quarantine/scan/variant/provenance flow; failure retains the preceding node asset. Complete selected-frame/reduced-motion review across editor and all exports, qualified actual Outlook/client preflight, provider asset-upload/hosted-retention contracts, load/economics/takedown/disaster/accessibility/security evidence. Keep capability rows partial until each authoritative requirement and dependent gate has genuinely retained evidence.

## Integration rulings made before qualification

- Image nodes use exactly one `src` or `asset_ref:{asset_id,variant_id}`; `fallback_ref` is explicit and belongs to the same asset. Only schema1.1 accepts refs or raw `asset_registry:AssetVariantRef[]`; existing1.0 documents retain their behavior. New schema1.1 is a manual managed-image application, never upload completion.
- Every upload attestation owns a separate asset/rights/variant identity. Only verified source object bytes may deduplicate within the workspace. Internal binding includes asset UUID, variant UUID and SHA256; content hash alone never conveys rights or ownership. Equal source uploads receive distinct private references and rights receipts.
- Root application checks exact workspace/actor/email/node/version/opaque full-block source fingerprint, role, conflict, pending action and current metadata; it flushes first and uses acknowledged draft CAS. Selected current inspector alt/decorative values are preserved deliberately; users can edit them explicitly. Every supplied X-Actor-ID is checked centrally for session and bearer principals, including binary reads/PUT.
- A tracked planned-object ledger accounts source/derivative writes under the existing reservation. Failed authority/settlement writes cannot release quota while their physical bytes remain unreferenced. Exact owned cleanup rechecks references; failed deletion retains accounting until the scheduler janitor proves removal. This is required for bounded storage, not a cosmetic cleanup step.
- The existing pinned lock entries are preserved; only MIT `fflate@0.8.3` is added for deterministic ZIP creation. Files have generated asset/variant/hash names, sorted entries, fixed1980 timestamps and stored compression. The application never unpacks uploads or includes original/quarantined bytes.
- Private preview transport is bounded at4MiB verified derivative bytes, with static fallbacks and sandboxed data-image display. The authoritative compiled source retains only immutable bindings. ZIP defaults to static `email.html` and provides explicitly animated `email-animated.html`; ordinary private-image HTML refuses until publication exists. ZIP raw derivatives40MiB/output48MiB limits are development transport limits.
- Renderer profile2 carries signed exact byte bindings: at most200 entries,1MiB aggregate decoded static PNG/JPEG bytes and2MiB total JSON including base64. Protocol1 remains accepted for legacy documents. Every unbound request remains aborted; no assets-host network exception exists. Larger images give an actionable bundle/smaller-variant refusal rather than omission. Local and isolatedLinux red-pixel/PDF proofs cannot certify Outlook.
- Actual DockerDesktop denied a Documents bind mount. The exact public renderer fixture is copied to an owned `/tmp` path for the same sandbox qualification. No global sharing/security setting changes.
- The scanner is actual officialClamAV1.4.6 AMD64 under emulation on the nativeARM64Docker host, with a verified signed112791054byte snapshot. Resource measurements and image/dependency notices are retained. Public redistribution/corresponding-source/SBOM/legal gates remain open.
