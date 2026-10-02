# Exact source preservation development checkpoint — 2026-10-02

This slice preserves the accepted inert UTF-8 source across create/import/save/reload/checkpoint/restore/remix. Separate bounded browser and email projections retain unsupported source while clearly blocking rendered delivery. Saved requires the original strict receipt, source/spec digests, current actor/document/lifecycle and a current server-head check. This remains local development evidence. All 65 requirements and all 13 Baseline A gates remain binding; no entire requirement or GA gate is accepted.

Candidate isolation: `codex/source-truth`, base `092e978`, `/tmp/lettercape-source-truth-native`. Main/canonical media remains clean at `092e978`; migration033 has not been applied there. An untracked generator toolchain symlink is setup only and is excluded from commits. The existing installed toolchain was copied into this isolated Next root after its outside-root symlink failed; no dependency version, lockfile or download changed.

## Final behavior and costs

- `emails.spec.raw_html` and each `custom_html.html` remain exact accepted text. Source admission validates strict Unicode/UTF-8, document structure, 2 MiB actual raw bytes and 1 MiB metadata; it does not sanitize, normalize EOL/BOM/composition, decorate UTM or replace unsupported source. Typed link validation stays strict. Empty raw source is saveable but blocks delivery.
- Additive `db/033-email-source-contract.sql` owns legacy/exact raw profiles and append-only tenant provenance. Original available legacy source/artifacts/hashes are retained. New accepted writes bind actual database octets/hash, current actor, request/command/origin and optional revision/key. Runtime direct provenance/profile mutation is refused. No original pre-sanitized legacy source is invented.
- Source bodies have a separate 13 MiB + 64 KiB escaped JSON transport bound, two concurrent readers and 30-second deadline. Authentication occurs before and after streaming outside transactions. Original CAS/key/body replay returns its own durable fact through compact receipt storage and immutable captures, never a newer mutable head.
- `raw-browser-1` disables destinations and remote/resource execution; registered managed-image placeholders receive only verified real static bytes at the server preview boundary. `raw-email-2` preserves validated email links and registered bindings. Source evidence and projection evidence have different hashes/profiles. Conditional/VML, external/unregistered resources and parser fidelity diagnostics block delivery. Unavailable projections never silently substitute old/raw HTML.
- Structured custom HTML uses `custom-html-source-1`, with per-node exact UTF-8 source hashes/bytes and located diagnostics. A shared 20,000 authored-node budget, 64-level depth bound, bounded aggregate derived bytes and 100 diagnostics constrain all fragments. Original source remains intact on limit. Eligible derived fragment links may receive UTM; authored fragments do not. Documents without fragments keep the prior deterministic baseline hash.
- New source-profile rendered HTML/TXT/ZIP/PNG/PDF are refused when projection is blocked or unavailable. Raw revision `format=source` returns an exact inert text/plain attachment with SHA/profile, nosniff, no-store and restrictive CSP. Historical legacy artifacts retain their disclosed prior behavior. Static preflight uses `static-source-5` for source projections and skips expensive detailed opaque lint when unavailable while retaining the blocking bounded diagnostics. Real-client evidence remains unavailable.
- Browser recovery uses one actual draft and one original serialized command in an actor/workspace/document IndexedDB slot. Transaction completion precedes dispatch; real abort rolls back. Twenty slots deny additional admission rather than evicting work. Original failed commands pause automatic retry and require explicit replay. Old actor-unbound localStorage backups remain untouched and are not adopted. Storage may be cleared/evicted; physical quota exhaustion is unqualified, and large snapshots/commands have a material browser storage/memory cost.
- Save receipts bind full canonical spec hash, exact raw hash/byte/profile, original key/base and exactly one version advance. Later typing remains dirty. Wrong200, current-head changes and Owner-to-Viewer switches cannot mark Saved. Fork captures server-frozen artifact/registry and preserves original action/key/payload after lost acknowledgment. Manual image replacement rechecks current head/actor and replays its original desired spec after reload without adding a version; later differing local work remains protected.
- Conversion carries exact original source and its source/browser profiles separately from an inert original preview. Profiles bind proposal/source hashes. Unsupported VML conversion remains explicitly unsupported. Monaco/basic adapters, pinned vendor and local generated bundles were not changed by this source slice.

## Native validation

The final aggregate is 418/418 pass, zero failures/skips, against a generated restricted fixture database with actual Chromium IndexedDB and the pinned native decoder. Lint, TypeScript and 114 generated API/SDK contracts pass. The native production build and complete original baseline HTTP/Chromium run also pass; no remote CI is inferred.

Actual source browser checks passed strict wrong200 refusal, real commit with lost reply/reload/original replay, held receipt/later typing, exact inert source attachment, blocked rendered export/preflight, server-frozen fork, empty source, repeated lost-fork replay with one checkpoint/version, Owner-held reply then Viewer current-head refusal, read-only Viewer recovery isolation, 390px navigation/no overflow/no source execution/no external requests. Fragment HTTP/browser checks passed exact source save/checkpoint, hash provenance, inert browser output, located blocking VML preflight/rendered refusal and aggregate unavailable source preservation.

Actual source/media export checks passed official source/derivative GIF scans, native decode/fallback, actual static fallback pixel, canonical source without transient data URL, deterministic ZIP/PNG/PDF, immutable manifest/remix/fork/restore/CAS/takedown. A real Chromium output held during committed takedown refused settlement with zero cache attachment. A separate complete mobile picker check passed actual upload/fallback lost-response original-command recovery, selected-frame blue pixel, manual image replacement commit/lost reply/reload/repeated original key/body receipt replay with one version, keyboard apply, Viewer read/PlayPause/write denial, delayed node selection and availability error. Owned fixture databases/apps/workers/stores were cleaned up.

Original editor/Monaco/conversion API/browser/keyboard/mobile regressions were qualified in retained separate logs. The full original Monaco smoke retained two 404 diagnostics of unknown provenance; no blanket console-clean claim is made. UTM HTTP/browser full workflow and fresh preflight HTTP/browser checks also pass.

## Retained failures and limits

Initial raw restoration failed because the strict saved-email transport was given database-only fields; root now shapes/validates the exact transport and binds returned document ID. Initial compilation exposed Node imports in browser components, an unsupported default loader interop and an outside-root toolchain symlink; root corrected browser-safe imports and isolated compiler setup. A legacy conversion limit fixture was corrected from 2,000,001 characters to 2,097,153 actual ASCII bytes for the admitted new bound. A later UTM offline recovery failure revealed the dependent form mounted before async IndexedDB adoption; root now reads recovery before installing the initial document. Pending same-policy recovery now resumes only after explicit reload/reset. These actual REDs are retained.

New fragment fixture initially asserted 201 on the existing ordinary create/checkpoint 200 contract; only its expected status was corrected. New profile conversion test initially passed its profile as the asset-manifest argument; its call signature was corrected. Old preflight UI assertions hardcoded Rules static-3; they now verify the declared source rule version. No readiness or actual provider responses were seeded. Physical quota probing produced retained failures and was stopped; transaction abort/complete is the proven storage boundary.

Legacy rows beyond the new source admission bound, production retention/operator reconciliation, browser eviction/memory/load, provider AI/spend/billing/ESP consent, real Outlook/20-profile captures, independent security/legal/privacy/support/economics, public asset CDN and deployment all remain unqualified. All inherited six media Minors remain disclosed in MEDIA-ASSETS-CHECKPOINT.md; they were not reopened or silently accepted. Whole-source review, current-head Linux/canonical qualification, publication approval and exact-head remote CI are pending until their real evidence is appended. Automatic approval review previously rejected an ordinary main push as private project source to an unverified external GitHub remote under the original no-push instruction; no retry/workaround was made and the direct native permission request remains unanswered.

## Implementer handoffs, preserved verbatim

The handoffs below describe each worker's frozen owned files and earlier inspected base. Root integrated them onto final base092e978 and owns subsequent route/compiler/UI/fixture changes. Worker hashes qualify their handoff time, not later root modifications. Planned migration032 became033 because media owns031/032; planned source module paths map to the delivered `email-source-*`, `raw-html-projection.ts`, `html-fragment-projection.ts`, `source-save-command.ts` and `source-recovery-store.ts`.


---

Original handoff SHA256: `dde9a286a8df5bef22e83ac5f14fad5593e4d38b8f3b60d87255b8de85ebd977`.

# Source truth Task A handoff — 2026-10-02

Implemented only the agreed pure domain ownership in `/tmp/lettercape-source-truth-native` (`codex/source-truth`, base `e6de762`). Task A made no main-tree, git index, commit, push, migration, account, credential, environment, dependency installation, or provider changes. The shared worktree also contains independent root/Task B edits; they are not Task A ownership.

## Deliverables and frozen interfaces

- `src/domain/email-source-values.ts` is browser-safe and exports `SourceValueError`, `rawSourceBytes(source: string): Uint8Array`, `decodeRawSource(bytes: Uint8Array): string`, `canonicalSpecString(value: unknown): string`, and `validateSourceMetadata(spec: unknown): {bytes: number}`.
- `src/domain/email-source-digest.ts` is server-only and exports `validateRawSource(source: string): {sha256: string; bytes: number}` and `canonicalSpecHash(spec: unknown): string`. Digests use lowercase SHA256 over exact UTF8 or canonical own JSON UTF8, respectively.
- `src/domain/email-source-contracts.ts` is browser-safe and exports `SourceProfileSchema/SourceProfile`, `RawDiagnosticCodeSchema`, `RawDiagnosticSchema/RawDiagnostic`, `RawProjectionSchema/RawProjection`, `SaveReceiptSchema/SaveReceipt`, and `SavedEmailResponseSchema/SavedEmailResponse`.
- `src/domain/raw-html-projection.ts` exports the pure, synchronous, server-only `projectRawHtml(source: string, context: {assets?: AssetManifest} = {}): RawProjection`.
- Tests: `tests/raw-source-contract.test.ts`, `tests/raw-html-projection.test.ts`; exact bytes fixture: `tests/fixtures/raw-source/exact-utf8.html.txt`.

Constants exported by values:

| Constant | Value |
| --- | ---: |
| `MAX_RAW_SOURCE_BYTES` | 2097152 (2 MiB) |
| `MAX_SOURCE_METADATA_BYTES` | 1048576 (1 MiB) |
| `MAX_SOURCE_COMMAND_JSON_BYTES` | 13697024 (13 MiB + 64 KiB) |
| `MAX_RAW_PROJECTION_BYTES` | 4194304 per output |
| `MAX_RAW_PROJECTION_NODES` | 20000 |
| `MAX_RAW_PROJECTION_DEPTH` | 64 authored elements |
| `MAX_RAW_DIAGNOSTICS` | 100 including truncation summary |

`SourceValueError.code` is one of `RAW_SOURCE_INVALID`, `RAW_SOURCE_TOO_LARGE`, `RAW_SOURCE_ENCODING_INVALID`, `SOURCE_VALUES_INVALID`, `SOURCE_METADATA_TOO_LARGE`. Route mapping belongs to Task B/root. These helpers do not provide HTTP limits or admission authority themselves.

## Exactness, JSON identity, and contracts

The source helpers preserve a UTF8 BOM, CR/LF/CRLF, case, spacing, comments, supplementary Unicode, and combining sequences without normalization. Fatal UTF8 decoding retains the BOM (`ignoreBOM: true` means do not strip it). NUL, unpaired UTF16 surrogates, invalid UTF8, and oversized actual byte sequences are rejected rather than replaced. Empty source is valid exact input; empty/whitespace-only projection emits blocking `RAW_SOURCE_EMPTY`, with a message explaining that source remains saveable/downloadable while delivery needs content.

Canonical JSON accepts finite numbers, strings, booleans, null, dense ordinary arrays, and ordinary/null-prototype own data objects. It sorts object keys, preserves array order and exact string content, and rejects undefined, NaN/infinities, functions, symbols, BigInt, sparse arrays, custom prototypes, symbol properties, nonenumerable data fields, accessors, cycles, and depth beyond 256. Getters and `toJSON` are never invoked. This is a data contract for server-admitted JSON, not a security membrane around arbitrary executable Proxy objects. Metadata is canonicalized and measured separately after excluding only the exact `raw_html` property, whose source limit is still validated.

Source profiles are exactly `legacy-stored-1|exact-utf8-1`. Browser and email projection profiles are exactly `raw-browser-1` and `raw-email-2`. Projection contracts enforce actual UTF8 output bytes, matching html/hash nullability, blocking diagnostic/status correlation, bounded ordered UTF16 source ranges, and explicit truncation disclosure. Source hashes are independent from projection hashes.

Receipt v1 binds workspace UUID, email UUID, positive request base version, exactly base+1 saved version, command ID, canonical spec hash, and nullable exact source evidence `{profile, sha256, bytes}`. Schema keys are strict; actor/current authority/context and replay key namespace belong to the server service. Saved responses bind email identity/version to receipt and expose no receipt secret. Their arbitrary spec record is transport only: root's `EmailSourceSpecSchema` remains the separate domain admission gate and client must independently recompute canonical/source identity before accepting a save acknowledgement.

## Projection and asset rulings

Projection validates source first, checks a conservative lexical node budget before parse allocation, examines parse5 source locations, bounds authored node count/depth, and uses sanitize-html with a small explicit tag/attribute/style policy. No fetch, URL extraction, evaluation, persistence, or automatic conversion occurs. Diagnostics use generic messages, bounded UTF16 offsets, and do not echo executable source fragments. Invalid source throws; budget failure returns `unavailable`, exact source digest, and both outputs null instead of partial HTML.

Email projection retains only validated HTTPS/mailto/tel destinations and the exact unsubscribe token. Browser projection disables link destinations and navigation, removes resource attributes, and carries a restrictive CSP. External images, unsafe schemes, CSS resources, unresolved private markers, stylesheet layout, namespace/VML/conditional markup, and ambiguous parser repairs produce explicit blocking diagnostics where fidelity is unavailable. Sanitization differences and active-content removals remain visible diagnostics and never overwrite source.

Only an exact marker/public URL present in the caller-supplied `AssetManifestSchema`-valid manifest survives as an email img source. Duplicate variant identities/public URLs and animation without its same-asset registered fallback are refused. This helper assumes the manifest was already authorized and verified by the tenant-scoped server; a structurally valid fixture is not evidence of scanning or storage authority. Parent must obtain manifest entries through current authority before supplying them.

Browser images carry inert `img[data-raw-asset-binding]` with no `src`. Animation uses its exact registered fallback binding, and email retains the animation binding. The fallback is selected from the cloned, validated bindings rather than rereading caller objects. Root must inject actual authorized static bytes into preview, keep the iframe sandbox/CSP, and apply current authority/release checks for exports and sends. A marker is never fetched/executed by this helper.

Ordinary unsupported style normalization is surfaced as warning; `eligible_for_checks` means a candidate sanitized output can undergo downstream checks, not that source fidelity, delivery, or a client matrix has passed. Embedded stylesheets, VML and conditional fidelity are expressly unsupported in this increment. Exact recovery does not establish Outlook fidelity.

## Verification evidence

Fresh focused command `node --import tsx --test tests/raw-source-contract.test.ts tests/raw-html-projection.test.ts` exited 0 with **18/18 tests passed**. Evidence: `/tmp/lettercape-source-truth-domain-green.log`. Tests cover exact actual fixture bytes/BOM/mixed EOL/Unicode/empty digest; actual UTF8 bounds and fatal decoding; own JSON key order and hostile accessors/coercion/cycles; metadata separation; strict receipt profiles/version increment; UTF8 projection transport cap; browser bundling without Node imports; deterministic distinct projection hashes; empty delivery block; hostile DOM/schemes/CSS/namespaces/templates; VML/conditional blocks; remote/forged markers; exact static/animation fallback bindings; node/depth/diagnostic budgets; and 2 MiB entity expansion refusal without partial projection.

Tests were run RED before first implementation (initial missing-module assertions, `/tmp/lettercape-source-truth-domain-red.log`), and new UTF8 projection-byte and empty-source requirements were individually demonstrated RED before their fixes. Final tests now use ordinary static imports so dependency/import failures remain visible.

Fresh owned ESLint command covering all four modules and both tests exited 0. Browser esbuild test uses `platform: 'browser'`, `write: false`: contracts and values bundle successfully with no Node runtime dependencies and create no bundle files.

Fresh full `npm test`, without copied `.env` or credentials, ran **383 tests: 285 pass, 97 fail, 1 skipped** (`/tmp/lettercape-source-truth-domain-suite.log`). Most failures require the owned local database or sockets and reported `EPERM`/`Owned local database required`; one existing `tests/utm-compiler.test.ts:36` assertion still expects a remote pixel and UTM decoration that concurrent root compiler integration now correctly blocks. Root was notified. This is not a full-suite green claim.

Fresh full `tsc --noEmit --incremental false` reports only concurrent root `src/domain/email.ts:349,354` redundant raw-mode comparisons after branch narrowing (`TS2367`); no Task A module/test type errors were reported. The earlier Task B server type error was resolved by its owner. Root was notified of the current compiler errors; Task A did not edit shared files to fix them.

Actual fixture proof, measured from the checked-in-to-worktree bytes through the implemented decoder/digest/projector:

```json
{
  "fixture": "tests/fixtures/raw-source/exact-utf8.html.txt",
  "utf8_hex": "efbbbf3c503e412026616d703b20423c2f503e0d0a3c212d2d206e6f7465202d2d3e0af09f988065cc810d",
  "bytes": 43,
  "sha256": "17df8f0540032fa4649cd68365dd3199d1b5f5b24d2ee3c6a64eff4568312e83",
  "spec_hash": "4fdffa18316179ea970123564fd76b1d12977ec808d6535cb22d1f89d65fb72c",
  "browser_hash": "41a1c9c406d24a4654fb12b2bda5dc4dc735ac5b70bb8f1657c3f6ebaf51f4f8",
  "email_hash": "95aaf8fcd1f7f6b06629f0bd8ec2773cd94773535e96a8365858785c75cfc6dd"
}
```

The spec proof uses `{mode: "raw", raw_html: source}` solely as a canonical-hash example, not as an admitted EmailSpec. The 2 MiB entity-expansion test took about 1.35 seconds in the final focused local run; this is measured pure-helper evidence, not proof of an independent process CPU deadline or production sandbox.

## Remaining integration, alternatives, costs, and gates

Root/Task B still own source schema admission, immutable tenant provenance and migration033, actor authority/CAS/idempotency services, compiler/artifact separation, checkpoint/import/conversion behavior, acknowledged Monaco UI handling, exact private source download, current authorized image-byte resolution, and actual authenticated browser/DB tests. Task A neither implements nor claims that evidence. Parent must retain delivery/release/client gates and block exports/sends for projection failure, unsupported fidelity, unresolved assets, or failed downstream checks.

No new dependency, paid provider, infrastructure, or account is required: this increment uses existing pinned parse5/sanitize-html/zod/esbuild dependencies and local in-memory outputs. It incurs only existing local compute/storage. Ignored alternatives remain: sanitizing durable source, treating sanitized output as exact source, automatic Raw→Structured conversion, replacing source with a server artifact, browser executing email HTML directly, client-forged save acknowledgement, fetching arbitrary source URLs, marker-prefix authorization, pretending private markers are production CDN URLs, or claiming VML/Outlook fidelity from source preservation.

All 65 PRD requirements and all 13 gates remain binding, with none asserted fully accepted or GA-ready by this handoff. Production media/AI provider funding/rights/configuration, production storage/CDN/region/retention/legal/account setup, and real client qualification remain their existing material dependencies. No marketing sends, paid commitments, remote pushes, or unrelated account changes occurred.


---

Original handoff SHA256: `c01f5ec8112b1bdd4405ec2c44d235fd29afd8fbe3eb8aa5eeffe443925ffeeb`.

# Source-truth storage and command handoff — Task 2

2026-10-02. Agent /root/media_storage_build. Work happened only in /tmp/lettercape-source-truth-native, branch codex/source-truth, BASE e6de7620e9e3839dd7cf65520df980d47a73e54f. The main mailcraft tree, canonical application/database and main migration state were untouched. Root retains all shared interfaces/integration, review, index, commits and deployment. B staged/committed/pushed nothing, created no subagent/review, copied/printed/hashed no credentials/private env, provisioned no account/role/provider/paid service and installed/edited no dependency or shared node_modules. All code is frozen at the 11 hashes below, with no half-write. Migration033 is frozen at 10d0c6293befe8f12903374926c696cef88405f47de49859d47b1d699dc3a57a. There was no main033 migration.

## Delivered

Existing emails.spec.raw_html remains the sole mutable source. createEmail/saveDraft use the parent's shared EmailSourceSpecSchema, retain accepted source exactly and keep locale/brand/media/CAS rules plus current authority. BOM, CRLF/LF/CR, Unicode composition, case, quotes, entities, comments, scripts/handlers and unsupported VML remain inert text. No persistence-time sanitizer, UTM decoration or parse/serialize changes source. Source representation/metadata validation uses A's shared browser-safe values/digest helpers; malformed UTF8, NUL, unpaired surrogates and over-limit actual UTF8 bytes deny before writes. Empty raw source and ambiguous raw UTM targets are durable editable documents; delivery eligibility stays separate.

Migration033 adds server-owned head/revision raw_source_profile and append-only email_source_provenance. Existing raw rows acquire legacy-stored-1 without changing spec/artifact/manifest/hash/updated time. New accepted raw writes acquire exact-utf8-1; structured profile is null. Checkpoint profile matches the available head, so a legacy checkpoint is honestly legacy until an exact accepted write; restore/remix preserve available legacy bytes while retaining historical source-revision profile in provenance. No pre-sanitization recovery is invented. Direct profile-column mutation is denied by a trigger. New revisions derive their profile from their actual tenant head; immutable revision table permissions remain intact.

Provenance is DB-computed SHA256 and octet_length of the actual committed raw string, not a client claim. Each accepted raw version gets one event, unique(workspace,email,doc_version), with current transaction actor, server-generated request identity, real command identity when applicable, origin and optional real revision/key identity. Composite email/revision/key FKs and forced tenant RLS apply. A tightly scoped trigger inserts; runtime cannot INSERT/UPDATE/DELETE provenance directly. Its definer checks matching tenant/current identity and has a fixed search path. No raw bodies or credentials enter source provenance/audit/analytics logs.

Source command responses are strict {email,receipt}. Receipt identifies workspace/email, original base, exactly one incremented saved version, command, canonical full-spec hash and exact source profile/hash/bytes. Hashes are generated from the actual parsed committed row. Same actor/workspace/action/key/body/base replays the original fact; changed command denies409. Replay checks current resource and authority, including session/member/key/workspace validity, before returning. Replays after newer mutable heads still return their own exact old spec/receipt and do not overwrite the newer head.

Source-only idempotency storage is compact: ordinary saves persist only committed receipt + document summary, then hydrate from an immutable canonical capture of the identical original input whose hashes must match the durable receipt. Imports retain bounded non-source metadata + receipt, then hydrate with the identical strict UTF8 replay source. Forks retain the immutable checkpoint ID + receipt and reconstruct exact generated source/registry from that checkpoint. A newer mutable head is never used for reconstruction. Neither autosave/import/fork keyed response retains another raw_html blob. Broader existing keyed() behavior was left unchanged. General request payload hashes remain actor/action/key bound; the source command string itself is not persisted. Immutable revisions still retain source by the existing history policy, which is distinct from autosave replay facts.

Import checkpoints the old head and accepts exact new source in the same transaction; rejected CAS/admission/authority leaves no checkpoint/provenance/version mutation. Structured-to-raw fork checkpoints the actual server head, verifies its artifact hash and derives source from the frozen delivery artifact. It uses frozen server asset entries for explicit1.1 registry, never browser preview data URLs or caller asset authority. Save/restore/remix preserve real available bytes and tenant asset rules; compiler/projection/publication remain root-owned.

Checkpoint passes the actual head profile to root compileEmail. Root returns manifest.source and manifest.raw_projection, separate browser preview and safe delivery bytes. This preserves source when VML delivery is blocked or projection is unavailable. No artifact/projection/delivery safety is inferred from a source receipt.

## Published interfaces

- saveSourceDraft(tx,p,emailId,expectedVersion,spec,commandId): SavedEmailResponse
- importEmailSource(tx,p,emailId,expectedVersion,source,commandId): SavedEmailResponse
- forkEmailToRaw(tx,p,emailId,expectedVersion,expectedArtifactHash,commandId): SavedEmailResponse
- downloadRevisionSource(tx,p,revisionId): {bytes:Buffer,sha256,profile,revision_no}
- readEmailSourceText(request): exact UTF8 source
- readEmailSourceJson(request): route-specific bounded object; shared source/metadata checks
- emailSourceRoute(request,id,'draft'|'source-import'|'import-html'|'source-fork'): saved response
- sourceExpectedVersion(request): accepts existing plain/quoted/draft-N If-Match forms
- revisionSourceResponse(request,revisionId): inert exact source attachment
- emails create/save optional SourceOrigin context: origin/revision/commandId/requestId
- scripts/smoke-source-truth.ts exports sourceDatabase fixture and smokeSourceTruth; default CLI runs DB source smoke; --suite runs child npmtest entirely against a generated fixture DB (root decides when integration is ready).

Route dispatch must occur BEFORE generic readJson. Dedicated source-import POST uses text/plain; charset=utf-8. Legacy import-html accepts strict {html}. Source-fork POST accepts strict {expected_artifact_hash}. PATCH draft accepts strict {spec}. Writes require original If-Match and idempotency key. Caller X-Actor-ID is optional for backward API compatibility per root ruling; if supplied, central auth validates it, and new browser commands supply it. Actual authenticated principal/key always determines namespace and current authority.

Source route first authenticates/resource-checks in a short transaction, then reads the stream outside all transactions, then uses fresh principal/current authority in the mutation transaction. Body readers reject compression, wrong MIME/charset, invalid declared length, actual overflow and declared/actual mismatch. Text cap2MiB actual UTF8; source JSON ceiling13MiB+64KiB accommodates worst escaping while canonical source remains2MiB and metadata1MiB. Only two source bodies per process read concurrently, with30s deadline and request-abort cancellation; failed reads release admission. Every source service rechecks final current authority. No transaction spans network body reading.

Source download uses existing edit + emails:export permission, reads immutable revision under RLS, checks current authority before return and emits exact original UTF8 bytes as text/plain attachment email-vN.source.html.txt, nosniff/no-store/CSP default-src none sandbox plus x-source-sha256/profile/content-length. It grants no hosted HTML, ESP, public image, send or render authority. FOR SHARE on immutable revisions was deliberately removed because it requires UPDATE privilege, which runtime correctly lacks; immutable SELECT plus authority locks supplies the required read semantics.

## Direct verification

Final /tmp/lettercape-source-truth-owned-final.log:12/12 pass, zero skips, duration2829ms. This includes actual restricted PostgreSQL create/save/checkpoint/restore/remix exact source; legacy profile migration without spec/artifact rewrite; direct profile/provenance fabrication refusal; empty/ambiguous raw UTM source storage; compact replay facts with original save/import/fork hydration after newer heads; changed base/body under reused key; actual2MiB source storage and multibyte/surrogate/NUL/overflow denial without another version; key/session/member/workspace revocation; actual concurrent imports with one CAS winner and one rollback; tenant isolation; real loopback chunked HTTP; exact BOM/UTF8/text and >12MiB escaped JSON transport; MIME/compression/false-length/invalid-byte/interruption denial. Isolated fixture finally drops exact generated databases. No source readiness/provider/publication state is seeded to qualify these tests.

Actual original snapshot RED: /tmp/lettercape-source-truth-105-to-34-red.log. git show e6de762:src/server/emails.ts was bundled into a temporary /tmp artifact using existing installed package paths, then its actual createEmail was called through a restricted-role generated DB fixture. Accepted105 characters became stored34 and equality failed. The current same105-character fixture passes DB equality across the complete create/save/checkpoint/restore/remix path at /tmp/lettercape-source-truth-105-green.log. The temporary snapshot artifact was only test evidence and never replaced current/source/main code. Initial separate source-loss RED remains /tmp/lettercape-source-truth-db-red.log.

Meaningful profile guard RED: /tmp/lettercape-source-profile-red.log (direct restricted UPDATE unexpectedly succeeded) → trigger denial GREEN. Meaningful compact history RED: /tmp/lettercape-source-truth-compact-red.log (idempotency response contained the full raw source spec) → compact stored facts and original-hash/immutable-checkpoint hydration GREEN. Initial missing-module REDs remain /tmp/lettercape-source-truth-command-red.log and /tmp/lettercape-source-truth-body-red.log.

Actual final smoke: /tmp/lettercape-source-truth-storage-smoke.log. Source203 UTF8 bytes, SHA2560b412c0defcce01480039921e426b1c002b232fe1c9e9ccba26ddada96280b9c, exact-utf8-1; import version2, edit3, restore4, identical replay;3 parent source provenance events, exact immutable download and remix; VML delivery_status blocked. Final run elapsed445ms, process RSS203866112B including module/runtime/DB startup. Earlier independent smoke elapsed1389ms/RSS151601152B; these are local process observations, not parser-only load acceptance or a production capacity promise. Hostile source was not executed/emitted by the tested server flow; full actual browser tripwire proof remains root Task5.

Final TypeScript noEmit, owned ESLint and git diff --check all passed. Final logs /tmp/lettercape-source-truth-tsc-final.log and /tmp/lettercape-source-truth-lint-final.log are empty success. The earlier transient TypeScript SDK errors during root's concurrent generation remain /tmp/lettercape-source-truth-tsc.log; latest full typecheck is green after root integration advanced.

## Premature aggregate and retained integration failures

The isolated --suite aggregate was started before root's request to defer aggregates arrived and completed before it could be stopped. No aggregate repeats occurred. /tmp/lettercape-source-truth-isolated-suite.log:399 tests,387pass,11fail,1skip. Its parent generated DB and every nested withCreationDatabase fixture were isolated; no main database mutation. This is not a whole-slice green claim. It ran while root compiler/routes/UI/API work was unfinished.

Failures by test name/cause:
- api-contract: OpenAPI3.1 documents every enabled method...; source contracts distinguish exact text bytes... — source endpoints were not yet generated.
- editor: acknowledged CAS saves survive reload...; brand pins must belong to this tenant... — old fixtures omit current membership and new create authority returns Workspace not found.
- email-conversion-db: conversion proposals are read-only...; stale or tampered conversion...; conversion admission denies foreign source...; passive session expiry... — old admin raw source seeds omit tenant/source context, now SOURCE_CONTEXT_REQUIRED.
- sdk-generation: source SDK sends exact inert UTF8...; source SDK rejects invalid text/oversize... — operation catalog generation pending at that moment.
- utm-compiler: raw mode applies explicit policy to sanitized HTML... — old expected remote image/output policy differs from the current network-free/blocked projection path.

Root owns those existing fixtures/shared integration and will requalify them when ready. B did not weaken current authority, provenance or safe projection to make old expectations pass. The one aggregate skip is not included as acceptance evidence; the final owned12 skip count is zero.

## Rulings, real costs and remaining boundaries

1. Root's explicit isolated path and file ownership override skill default workspace/commit/review paths; executing-plans and test-driven-development were read/applied, but no forbidden child/review/index/source-tree work was performed. All65 PRD requirements and all13 gates remain binding; this is not GA acceptance or a scope reduction.
2. Use PostgreSQL built-in sha256 rather than add pgcrypto. The first migration test exposed unavailable digest(bytea,text); no extension, account or host change was needed. Existing engine crypto gives exact DB-computed source integrity at CPU cost proportional to accepted UTF8 bytes.
3. Parent EmailSourceSpecSchema was initially absent. B first qualified only nonempty/source persistence and reported the precise missing seam, then adopted the parent export once available. No permissive clone/fake source admission was created. Derivation now uses that same admission schema and explicit locale/direction copying rather than the prior render-target derivativeSpec gate, so inert raw repairs retain their existing UTM policy.
4. Keep legacy checkpoint profile truthful. New accepted writes are exact preservation of available bytes; preserving a legacy head in a revision does not recover unknown earlier source. Source provenance remembers historical parent profile while new restore/remix writes become exact. Wrong profile semantics would falsely imply recovered source, so DB/source manifest agree and tests pin this boundary.
5. Source profiles and hashes are server/DB-owned. Direct runtime profile/provenance edits are refused. Composite FKs/RLS plus current actor/session/key/workspace checks cost extra locked queries/trigger inserts but preserve tenant authority and real provenance. General audits contain identifiers/hashes, not source text.
6. Compact source command receipts prevent unbounded raw autosave blob retention through idempotency responses. Caller must retain/retry the exact original command for save/import, as specified; no old raw source can be recovered from a changed/missing caller command unless actually retained in an immutable revision. Save receipt+summary grows per accepted command; import may retain up to1MiB non-source metadata; fork relies on immutable checkpoint history. Root must qualify source-aware erasure/retention/receipt cleanup/legal policy for production without inventing seven-day or twelve-month defaults. Source-free receipts are still a database growth cost.
7. Canonical capture/hydration adds JSON parse, shape validation and source/spec SHA256 CPU/copies, bounded by source2MiB+metadata1MiB. Exact checks are not skipped merely because output sanitizes to identical HTML. Replay after newer head intentionally returns its own version; client must validate lifecycle/base and never adopt a stale receipt over newer local state. Root owns that client proof.
8. Network reader admission is2 per process, not cluster-wide. Worst source JSON13MiB+64KiB can temporarily coexist with parsed strings/canonical source/receipt/response copies. No published service tier or measured production memory allowance is inferred. Local smoke process RSS fluctuated151–204MB and includes startup; full load/RSS/admission deadline acceptance remains release work.30s deadline is implemented; final12 has actual abort/admission recovery but does not claim an actual30s stalled-request timeout qualification.
9. PostgreSQL source JSONB and immutable revision blobs/WAL retain actual source. Provenance adds one small hash/context row per accepted version instead of another source blob. Full2MiB boundary probe took roughly600–1045ms including generated migration/database fixture overhead; this is not a production edit latency benchmark. Default source smoke took445ms final, mostly local fixture/runtime work; real CPU, memory, DB locks/WAL and immutable history storage are costs despite no provider fee.
10. First smoke harness compared JSON.stringify replay objects, which incorrectly treated PostgreSQL JSONB key ordering as content change (Receipt replay mismatch). The response/spec/source facts were correct; canonical own-JSON comparison now qualifies replay. No source normalization was introduced. The failed attempt is recorded here rather than hidden as a feature failure/success.
11. A body/harness syntax typo and env-loader cache initially stopped tests; both were corrected before claiming meaningful source RED. Authorized guarded test runtime uses @next/env force-load only from the already-owned original mirror, in memory, without printing/copying/hashing secrets. Loopback fixture runs required sandbox escalation; no automatic approval rejection occurred for B's authorized tests. Parent push rejection belongs root's separate operation, not this source task.
12. Safe browser projection/compiler/asset registry/conversion/SDK/route mounting/acknowledgement lifecycle and actual enhanced/basic editor/browser tripwire proofs remain parent-owned integration. The server source path does not claim raw HTML is deliverable merely because saved. VML/conditional grammar, real Outlook/client fidelity, public media/account/residency/rights/erasure/paid/provider policies and full release/history/load/accessibility/evidence gates remain continuation; no public send/distribution gate is bypassed.
13. Source download supports actual raw revisions, not invented structured authored source. Structured users first use the explicit server-frozen raw fork. Legacy rows exceeding today's accepted2MiB bound or malformed existing raw representation may need an explicit migration/recovery ruling; they are never truncated or silently repaired by this code. Migration does not transform old artifacts/specs/manifests or claim prior sanitizer provenance.

## Frozen source SHA256

10d0c6293befe8f12903374926c696cef88405f47de49859d47b1d699dc3a57a  db/033-email-source-contract.sql
e409b288353f438746d125cac2dce89adaf8ff67e4cf537185e8eb535057e042  src/server/email-source.ts
02db9f3a1fefc123cf6a32097b8283d7f2715b8618bf6fa490bdf9a345b2276d  src/server/email-source-route.ts
2736c930ae92e169d20278680b2ac1a9381465a175a9de3e20edf6b5aa4f7c4a  src/server/email-source-body.ts
27985c2a02c1183d5e5927e03668df38a26017c6251b5a1f4e310660ac483239  src/server/emails.ts
eed2a410ac51e1c15fbc9312fff130bd336dfd7c8ed339912538a9fa811f2479  src/server/derivation.ts
47917497229bf47bbd55efd2e7f5ce7ed6668d723af2c1b6d13481e646c181c8  tests/email-source-db.test.ts
1f06aa536d65134a6023f53861373d0d95753ac86c4e071bd8150acbc3a4bee6  tests/email-source-http.test.ts
bddf77babf6d2193d77525870008375b448b4c2b1ec74dcbaf950d3e6e0833a0  tests/email-source-authority-db.test.ts
0ebe9b1213186407d66aad865a708fcf8f02dcab8dd59d0d5d948cde026fdb7b  tests/email-source-command-db.test.ts
daad2e6106291f1cf4abf777b40375b2b6c085017bf1ff5471d75f85565e8a3a  scripts/smoke-source-truth.ts


---

Original handoff SHA256: `5c5e10d182af26021c2f2f558a463a66ac04eb0c1b5d7ad77cdc6d4e02cbbf63`.

# Source-truth client helper handoff

Delegation owner `/root/media_ui_build`, isolated checkout `/tmp/lettercape-source-truth-native`, BASE `e6de7620e9e3839dd7cf65520df980d47a73e54f`. Main/media review checkout was not modified. Exactly two new owned files: `src/ui/source-save-command.ts`, `tests/source-save-command.test.ts`. No shared file, editor, server, schema, package, index or repo documentation edit; no commit/push/env copy/install/children/provider/account action.

Read the full `/tmp/lettercape-source-truth-plan.md`, repo AGENTS.md, installed Next use-client guide, actual domain source contracts/values and server receipt implementation. Applied executing-plans/TDD/verification guidance within the parent's explicit delegated ownership. Root retains whole-slice integration/final review and restricted DB/browser qualification.

## Interface

```ts
type SourceSaveScope = {
  workspace:string; actor:string; email:string;
  lifecycle:string; epoch:number;
};
type SourceSaveContext = SourceSaveScope & {
  baseVersion:number; spec:EmailSpec;
};
type SourceSaveCommand = {
  version:1; scope:SourceSaveScope; baseVersion:number; key:string;
  spec:EmailSpec; specHash:string;
  source:{profile:'exact-utf8-1';sha256:string;bytes:number}|null;
};
createSourceSaveCommand(context,key?):Promise<SourceSaveCommand>
serializeSourceSaveCommand(command):string
recoverSourceSaveCommand(serialized,current):Promise<SourceSaveCommand|null>
validateSourceSaveReceipt(command,unknownResponse,getLiveContext):Promise<{
  response:SavedEmailResponse; acknowledgedSpec:EmailSpec;
  acknowledgedCanonicalSpec:string; savedVersion:number; dirty:boolean;
}>
```

The command is detached from the input through the actual canonical JSON helper and deeply frozen. Its original full payload/base/key cannot change when the user types later. WebCrypto SHA256 uses actual shared `canonicalSpecString` and `rawSourceBytes`; no Node crypto, sanitizer, renderer or server import enters this helper. Source includes BOM/mixed endings/combining and supplementary characters exactly; raw empty source is permitted. Raw/source metadata budgets use shared byte validation. Scope requires verified nonempty actor/lifecycle, UUID workspace/email, safe epoch/base and bounded original key.

The receipt validator uses actual strict `SavedEmailResponseSchema`, including its actual optional updated_at/lineage/profile/request_id fields. It recomputes submitted and returned full canonical document/source digests, compares exact canonical content (not only supplied hashes), binds workspace/email/base+1/original key, requires exact-utf8 source evidence for raw writes and null source evidence for structured writes, and checks returned profile when present. Correctly shaped arbitrary200/different saved document is refused even if its own receipt hashes are internally consistent. Any malformed/corrupt/mismatched response throws before this pure helper can mutate a version/Saved state; it has no such effects.

`getLiveContext` is read after all asynchronous hashes. Different actor/workspace/email/lifecycle/epoch/current base rejects. Later local edits in the same save lifecycle/base are retained by the caller; the helper acknowledges only the original snapshot and returns dirty=true. Returned response/spec are deeply frozen. Root must parse the response spec using `EmailSourceSpecSchema` and repeat its authority/current task fences around editor integration; the transport contract's spec remains an unknown record, as requested. Never replace later current spec with returned acknowledgedSpec solely because validation succeeded.

Serialization has the shared source-command JSON byte ceiling. No source recovery is automatically written or replayed. The caller selects actor/document-scoped storage. Explicit recovery recomputes stored identities and requires current actor/workspace/email/base and the full exact current canonical payload before rebinding only lifecycle/epoch. Original key/base/spec/hash/source stay unchanged. Wrong scope, malformed command, changed payload/hash/profile, changed base or later current source returns null; no other actor's recovery slot is cleared.

## Qualification and rulings

- Meaningful RED: `/tmp/lettercape-source-truth-client-red.log` exit1, all8 named tests assert the missing helper before implementation. No fake DB or server success was introduced.
- GREEN: `/tmp/lettercape-source-truth-client-green-1.log` exit0,8/8 pass,0 skip. Real WebCrypto result independently compared with test-only Node SHA256. Tests cover detached/deepfrozen command, exact raw bytes/complete spec, key-order canonical equality, empty raw, changed source/subject, wrong spec hash/source hash/bytes/base/version/email/workspace/key/profile/strict shape, internally consistent response for another command, lifecycle/epoch/actor/base fences, scope change during async hashing, later exact local edits remaining dirty, original command replay recovery and corruption/encoding denial. Structured receipt requires null source evidence.
- Targeted ESLint `/tmp/lettercape-source-truth-client-lint-1.log` exit0, empty. Owned diffcheck exit0. Full tsc `/tmp/lettercape-source-truth-client-type-1.log` exit2 only parent-owned `src/domain/email.ts:349,354` TS2367 structured/raw comparisons; no owned errors. Root subsequently reported correcting those lines. No second baseline type run was needed or claimed.
- One full `npm test` was started per loaded TDD suite guidance, then root instructed no aggregate expansion/repetition because parent owns actual restricted DB aggregate. That run had already completed: `/tmp/lettercape-source-truth-client-suite-1.log`, exit1,394 tests,295 pass,98 fail,1 skipped.97 failures were unavailable local DB/loopback sandbox infrastructure; one actual compiler assertion was `tests/utm-compiler.test.ts:36`, `raw mode applies explicit policy to sanitized HTML without modifying original draft markup`: expected tracked HTML plus remote image versus current untracked projected HTML/image removal. Root was notified with exact output lines1768ff and owns that seam. The single skip was `native isolated decoder qualification runs all frames and denial corpus`; no decoder qualification claimed here. All failed names are preserved below and in the full raw log. No full aggregate rerun or DB escalation took place.
- Ruling: use parent's explicitly reserved `/tmp` handoff instead of skill-generated extra repo ledger/workspace — exact ownership permits only two new source files, and root owns full-plan execution/review/commits — cost if wrong is losing bookkeeping, addressed by this retained full handoff.
- Ruling: source persistence helper is transport/identity validation, not duplicate render/admission policy authority — actual shared schema parsing stays with root while this helper validates exact own JSON/source values — cost if wrong is integrating invalid document metadata, so root must parse `EmailSourceSpecSchema` before adoption.
- Ruling: explicit reload recovery may rebind lifecycle/epoch only with unchanged actor/document/base/full payload — root expressly accepted this distinction; no automatic replay — cost if too strict is requiring manual source recovery for a later locally edited draft rather than silently sending the old command.
- Ruling: stop baseline repetition per root direction — root has real restricted DB aggregate ownership and identified sandbox failures elsewhere — cost is aggregate remaining unqualified at this delegation boundary; no all-suite GREEN claim.

No paid fees/commitments incurred. Memory is bounded by shared2MiB source/1MiB metadata and13MiB+64KiB transport ceiling; canonical snapshots, UTF8 encodings and hashing allocate additional bounded copies, not priced allowance or zero-resource claim. No source text is logged by the helper. Test receipts are local synthetic contract fixtures, not actual DB durability evidence. Full GA/all65/all13 gates, Outlook/VML fidelity and real integrated browser/server receipt evidence remain root/full-project obligations.

## Freeze

```
34d739a9d5eccef863db7b49e4858177da74ee6afbfee63a5e7003db0e293593  src/ui/source-save-command.ts
1cf8f07e06a767b094a89471cb42698cb476e7c0518ec6297a3d5e10b934ec76  tests/source-save-command.test.ts
```

Owned implementation is frozen, readable, no half-write or active source mutation. No remaining delegated helper blocker. Root owns final integration, the reported UTM compiler mismatch, actual DB/browser aggregate and final whole-slice review/commit.

## Exhaustive failed aggregate test names

The following list is copied from the first full aggregate report in the retained log (its later repeated failure detail section is not duplicated):

```text
✖ actual local PNG and PDF use exact known private bytes and abort an unbound loopback request (11.331834ms)
✖ real HTTP chunked body follows binary stream bound without JSON parser (7.207375ms)
✖ asset tables force tenant RLS, composite identity and least privilege readiness (1.16125ms)
✖ duplicate source bytes share only verified tenant storage while each actor retains distinct asset and rights (0.201583ms)
✖ removing managed references when restoring legacy1.0 clears prior pins under current edit authority (0.099417ms)
✖ audience SQL selects exact typed values, observed facts and tenant membership; negative filters exclude missing (118.346209ms)
✖ campaign snapshot pins guard exact source members and metadata against runtime forgery (1.423417ms)
✖ snapshot bindings and source reads are tenant fenced with nullable composite foreign keys (1.273ms)
✖ immutable audience sources cannot be rewritten or deleted while pinned history remains (0.427958ms)
✖ current consent changes, state-only no-op and rollback cannot rewrite frozen selection history (0.141125ms)
✖ snapshot binding migration preserves unselected legacy rows and rejects reserved-key collisions atomically (0.092584ms)
✖ brand memory binds exact kit/tenant, excludes tombstones from fresh context and keeps immutable provenance (32.607083ms)
✖ campaign snapshots have forced tenant RLS and runtime cannot directly write or cascade-delete immutable history (0.436083ms)
✖ material campaign changes append one exact version and actor while no-op state-only rollback and foreign pins preserve history (0.099292ms)
✖ campaign migration observes only an existing current version and never invents earlier configurations or actors (0.069ms)
✖ only queued cancellation refunds; in-flight cancellation preserves its finite reservation (0.882375ms)
✖ cancellation cannot replace completion committed while it waits for the row lock (16.454458ms)
✖ additive worker migration adopts legacy queued work and retains uncertain legacy AI starts (0.979292ms)
✖ restricted creation claims enforce tenant identity, finite global and workspace concurrency (0.535709ms)
✖ recorded external generation crash retains accounting and never becomes a safe retry (0.086708ms)
✖ pre-start recovery requeues safely and current revocation denies the next external grant (0.063042ms)
✖ readonly extraction crash recovery spends the finite transient budget (0.0675ms)
✖ definitive settlement writes one immutable attempt, usage and outbox effect (2.059958ms)
✖ expired queued credentials deny once and release only unused reservation (0.168ms)
✖ creation runtime sees only tenant metadata and cannot write private queue authority (0.30225ms)
✖ queued backlog rejects new admission before any outbox or reservation is added (0.33375ms)
✖ a queued retry that loses its execution window ends without leaking its unused reservation (13.955292ms)
✖ ready batches interleave tenant work instead of draining one workspace backlog (0.2125ms)
✖ credential expiry while an unchanged job row is locked denies before admission (0.108042ms)
✖ generation cancellation after known success consumes once and suppresses the proposal (0.061208ms)
✖ cancellation before external start releases once and scope removal denies the next claim (0.047625ms)
✖ rate deferral preserves failures and stops when Retry-After exceeds the original window (0.053666ms)
✖ terminal recovery emits one atomic outbox effect and rejects empty success evidence (6.542208ms)
✖ credential expiry during a renewal lock wait cannot extend the existing execution lease (0.11ms)
✖ a failed deterministic Redis wake is rebuilt after a transient SQL claim failure (1.043208ms)
✖ known generation success after key revocation or permission loss consumes once without publishing (0.0925ms)
✖ post-start key expiry during settlement lock wait suppresses the proposal and keeps known charge (0.260708ms)
✖ committed PostgreSQL cancellation between redirect hops prevents another extraction request (2.594958ms)
✖ actual durable worker process crash and lost Redis wakes preserve SQL fences and finite admission (1.870417ms)
✖ a principal resolved before membership revocation cannot enter a resource transaction (17.479166ms)
✖ current role replaces the resolved role and prevents stale editing/management authority (2.538333ms)
✖ current API scopes, expiry, revocation, issuer and workspace binding fence delegation (0.125167ms)
✖ missing/foreign transaction context and inactive workspaces deny private resource authority (0.054583ms)
✖ a current transaction holds authority until commit and later admission observes committed revocation (0.0715ms)
✖ a key that expires while waiting for its SHARE lock cannot admit the resource callback (0.113958ms)
✖ /private/tmp/lettercape-source-truth-native/tests/current-authority-db.test.ts (8.468041ms)
✖ actual runtime role has no RLS bypass and missing tenant context returns no content (24.01775ms)
✖ forced RLS and composite foreign keys prevent cross tenant reads and references (7.957833ms)
✖ same-tenant source lineage is immutable and source changes never rewrite locale children (57.477334ms)
✖ dispatch policy authority is isolated, immutable evidence survives, and shared fences deny post-cutover races (8.597125ms)
✖ acknowledged CAS saves survive reload, stale changes fail, restore creates new head (39.20425ms)
✖ keyed replay preserves operation and refuses a different payload (4.346541ms)
✖ brand pins must belong to this tenant and audit order survives repeated transaction events (1.096ms)
✖ conversion proposals are read-only; acceptance pins source, checkpoints original and replays original fact without duplicate head (0.733792ms)
✖ stale or tampered conversion never creates a checkpoint or changes raw source, and unavailable conversion stays raw (0.174167ms)
✖ conversion admission denies foreign source and current Viewer before reads or receipt replay (0.0805ms)
✖ passive session expiry while waiting on raw source lock denies conversion before checkpoint or mutation (0.085625ms)
✖ source admission and replay recheck current session/member/key/workspace authority and make no partial writes (7.441666ms)
✖ racing exact source commands have one CAS winner and losing import rolls back its checkpoint/provenance (1.376667ms)
✖ source command receipt replays exact saved bytes once and changed original command denies (11.347542ms)
✖ server raw fork pins actual artifact and retries without duplicating checkpoint (1.426292ms)
✖ actual restricted DB retains exact inert source across create/save/checkpoint/restore/remix (12.0795ms)
✖ empty exact source and ambiguous raw UTM edits remain durable inert documents (2.513167ms)
✖ migration profiles available legacy source without rewriting immutable artifact/spec and provenance cannot be forged (1.304625ms)
✖ actual loopback chunked HTTP reads exact inert source without JSON or replacement decoding (9.807916ms)
✖ typed outbox events bind source versions, remain immutable and replay only the same transition (17.559041ms)
✖ one preference save records every removed topic at the same authoritative consent version (2.432459ms)
✖ queued API creation rechecks revoked, expired and narrowed credentials in the actual durable worker (0.93775ms)
✖ actual transfer commit and leased settlement reread session, membership, key and workspace; unknown scan cannot ready (33.017417ms)
✖ actual orphan cleanup failure retains reservation, then exact filesystem repair and janitor deletion release it once (0.150542ms)
✖ actual SQL global lease, crash recovery, cancellation and quota settle exactly once (0.587791ms)
✖ scheduler reclaims an expired interrupted upload reservation without a later user request (0.102875ms)
✖ queued cancellation releases an untransferred admission immediately and claim waiting on cancellation never resurrects it (0.109917ms)
✖ real membership mutation protects final Owner, current version, role/seat policy and tenant boundary (22.620708ms)
✖ ownership transfer promotes target and demotes initiator atomically without changing editing quantity (2.753417ms)
✖ runtime cannot directly write memberships or alter immutable membership evidence while SHARE authority still works (2.767583ms)
✖ two current managers serialize conflicting member versions without deadlock or duplicate seat evidence (2.6045ms)
✖ membership removal revokes issued credentials and queued reservations once while running work remains in cancellation (0.898583ms)
✖ exclusive workspace admission precedes member SHARE locks when two managers mutate concurrently (3.776916ms)
✖ signed recipient GET has no opt-out side effects; repeated POST suppresses once (9.63775ms)
✖ render receipts preserve immutable bytes, exact revision/format identity and forced tenant boundaries (9.594584ms)
✖ queued worker rechecks the target workspace, not another Owner membership (0.979209ms)
✖ sender tables force tenant RLS, strict composite references and restricted immutable captures (0.996ms)
✖ sender material changes require the exact next version, capture canonical snapshots and roll back atomically (0.311709ms)
✖ sender storage denies domain, identity, readiness and DNS source/evidence forgery (0.222667ms)
✖ only current Owner/Admin managers and scoped current API-key delegators can read and write sender storage (0.26375ms)
✖ sender mutations and DNS captures recheck current manager authority after actual sender lock waits (0.141583ms)
✖ raw mode applies explicit policy to sanitized HTML without modifying original draft markup (23.769625ms)
✖ persistent consumer dedupes exact events through restart, rejects conflicts, tolerates reorder and checks rotation expiry (21.770833ms)
✖ real receiver process restart after a committed lost acknowledgment preserves dedupe and aggregate ordering (8.006917ms)
✖ webhook durable truth dedupes events, fairly leases bounded tenants, rechecks authority and preserves attempt/failure/lease history (9.442959ms)
✖ owned HTTP worker retries exact events with rotated keys and persistent receiver dedupe, then disables a410 target (6.58125ms)
✖ webhook endpoint secrets stay encrypted/tenant-bound, CAS rotation overlaps and current database authority revalidates (14.29475ms)
✖ actual owned HTTP receiver verifies raw bytes and dedupes retried event with a fresh delivery signature (8.638792ms)
✖ permissioned replay retains logical identity/history/budget and rejects stale, acknowledged, expired or revoked requests (8.029083ms)
✖ calendar index derives valid original fold UTC only and runtime cannot forge an independent planned time (1.812042ms)
✖ timezone preferences enforce current manager tenant and version without changing frozen campaign history (0.15225ms)
✖ calendar migration observes valid current UTC and existing timezone without inventing invalid legacy timing (0.09525ms)
```


---

Original handoff SHA256: `40e8f6b9051948ee9c2177a37b54a9e180c806655247ccaef71eefb5addf5331`.

# Source-truth API/SDK handoff

Completed in isolated `/tmp/lettercape-source-truth-native` (realpath `/private/tmp/lettercape-source-truth-native`), base `e6de762`. Frozen main media tree was not edited. No environment/package/lock/index/commit/push/provider changes and no child agents. Parent authorized the exact local `tooling/openapi/node_modules` symlink to the already installed original toolchain after the isolated generator initially failed module resolution. That symlink is development setup, not a deliverable to stage.

## Owned deliverables

Edited `src/server/http.ts`, `scripts/generate-api.ts`, generated `public/openapi.json`, `sdk/client.ts`, `sdk/operations.ts`, `sdk/schema.d.ts`, `sdk/types.fixture.ts`, `sdk/README.md`, and `tests/api-contract.test.ts`. Added the explicitly assigned `tests/http-methods.test.ts`, `tests/api-key-scopes.test.ts`, `tests/sdk-generation.test.ts`. Actual existing baseline tests are `http.test.ts`, `api-keys.test.ts`, `sdk.test.ts`; they were left untouched. Existing `src/domain/api-keys.ts` already maps new email POST commands to emails:write and revision download to emails:export, so no production scope edit was necessary.

Read the full source-truth plan, installed route-handler guidance, shared source contracts/values, source body reader/route/services, and existing generator/SDK. Root owns catch-all routing, compiler, UI and source projection integration; worker B owns admission/persistence/download services. Those files were only inspected.

## API changes

- Exact `POST /v1/emails/{id}/source-import` and `POST /v1/emails/{id}/source-fork` method routes; wrong verbs, invalid IDs and suffixes reject. Generic `readJson` remains unchanged at2MiB.
- `importEmailSource` documents text/plain UTF-8 source and maximum2097152 actual bytes. Empty source is valid; BOM/mixed EOL/Unicode remain exact; malformed encoding, NUL, lone surrogates and compression reject. Command requires original If-Match and idempotency key and retains emails:write.
- `forkEmailSource` documents strict `{expected_artifact_hash:<64hex>}`, original If-Match/key and emails:write; browser preview text is not an accepted fork body.
- `saveDraft` and legacy `importHtml` now document keyed `{email,receipt}` responses. Generated SaveReceipt reuses the shared strict Zod contract: workspace/email/base/saved version/command identity, canonical spec hash, nullable source with historical/exact profile, SHA256 and UTF-8 byte count. Saved email shape uses the shared source-admission document shape instead of an arbitrary JSON-record typing. Cross-field version/identity/digest semantics are explicitly documented as server checks beyond JSON Schema shape validation.
- Specialized source-bearing JSON endpoints (create/save/import/preview/fork) document a13697024-byte transport ceiling. Canonical source remains2MiB and non-source metadata1MiB. No global parser increase or fake permissive body schema was introduced.
- Actor header is optional, per root's compatibility ruling. Supplied X-Actor-Id is only an account-change fence; real authenticated principal remains authoritative.
- `downloadRevision` query accepts `format:source`; response documents inert text/plain attachment, nosniff/no-store, X-Source-SHA256 and X-Source-Profile. Result stays raw bytes. Safe rendered formats remain separately gated; source preservation is not delivery fidelity.
- Generator/check covers114 operations. All eight media API paths and eight media schemas were compared programmatically to `e6de762:public/openapi.json` and match exactly. No working media endpoint contract was changed.

## SDK behavior

New source methods require explicit `idempotencyKey` and `ifMatch` at type and runtime levels. `importEmailSource` accepts string only, validates representable UTF-8 and actual encoded size, and sends exact encoded bytes as `text/plain; charset=utf-8` without JSON wrapping/BOM/EOL normalization. Optional `actorId` becomes X-Actor-Id.

All four source mutation operations (`importEmailSource`, `forkEmailSource`, `saveDraft`, `importHtml`) disable automatic retries, including transport errors and retryable429/503 responses. New methods never generate a key. Existing saveDraft/importHtml initial calls retain compatibility by generating one key if absent; any uncertain failure exposes that same key for explicit recovery with the original version and payload. This compatibility exception was coordinated with root before implementation. Ordinary other SDK operations keep their existing retry policy.

New-method missing keys/versions and invalid/over-limit text fail before fetch. Download source returns Uint8Array with intact BOM/source bytes and exposed evidence headers. Generated SDK receipts are typed; application-level recomputation/identity validation before declaring Saved remains the parent UI acknowledgement layer's responsibility.

## RED → GREEN / fresh validation

- Initial new scope/HTTP/SDK probe run: one existing-scope behavior passed; three tests failed because source route/methods were absent.
- Expanded contract probes then failed on missing documented source route inventory and missing text-import definition.
- After implementation, final command `node --import tsx --test tests/http-methods.test.ts tests/api-key-scopes.test.ts tests/sdk-generation.test.ts tests/api-contract.test.ts tests/sdk.test.ts` passed17/17. Includes exact text transport with BOM/CRLF/CR/LF/combining and supplementary Unicode, explicit same-key recovery, no automatic retries, malformed surrogate/NUL/multibyte overflow refusal, empty and exactly2MiB valid text,429 command preservation, legacy generated-key recovery, source attachment bytes/headers, strict fork/receipt shapes, scope boundaries, route suffix/method denials and generic2MiB retention. Existing media/binary SDK checks still pass.
- Fresh `npm run typecheck`: pass.
- Fresh scoped ESLint on all owned TS implementation/test files: pass.
- Fresh `npm run api:check`:114 documented operation outputs match.
- `git diff --check` on owned paths: pass.
- Initial api:generate failure was only isolated tooling module resolution; root-authorized read-only symlink resolved it without install/package/lock changes.

No DB/runtime/browser/provider smoke was run by this worker; parent explicitly owns aggregate actual DB and browser qualification after integration. Mocked transports only establish SDK byte/recovery behavior and do not fabricate persisted source or rendering evidence.

## Root integration / CI remaining

1. Dispatch emailSourceRoute for draft/source-import/import-html/source-fork before generic readJson, and authenticate specialized source create/preview reads before consumption. Handler supplies fresh current-authority checks around admission/commit; don't consume the same request stream twice.
2. Route format=source download to revisionSourceResponse before delivery-format handling and stamp X-Request-Id on the returned Response. These are root-owned seams and were reported early.
3. Worker B was asked by root to remove mandatory X-Actor-Id; generator/SDK intentionally model it optional. Final route behavior should match that ruling.
4. `.github/workflows/verify.yml` was intentionally left unchanged. At inspection `scripts/smoke-source-truth.ts` only exported the sourceDatabase fixture helper; invoking it as a CLI would be a vacuous smoke. Existing npm test discovery already includes new tests. Add the eventual real executable parent HTTP/browser smoke only when its final CLI exists.
5. Re-run generation/check if parent changes shared source/conversion/domain schemas during remaining integration. Generated files currently reflect the exact isolated worktree schema at validation time.
6. Full65requirements/all13gates remain binding; exact source preservation and receipt typing do not qualify VML/conditional delivery fidelity, actual Outlook, production source/asset retention, accessibility/load/security acceptance or public launch.

No staging/commit was performed. Parent retains sole ownership of eventual integration and canonical transfer from the isolated checkout.


---

Original handoff SHA256: `8f3c38e5af53fc5f09d11eb2743001398fe740a245bc7ffcfbc67d1d24b16077`.

# Source recovery IndexedDB support handoff

Owner `/root/media_ui_build`, Task3b, isolated `/tmp/lettercape-source-truth-native`, 2026-10-02 18:59 UTC. Own ONLY two new files: `src/ui/source-recovery-store.ts`, `tests/source-recovery-store.test.ts`. Main/media work untouched. Frozen source-save-command helper/handoff not modified by this delegation; root extended that helper with source-fork action/expected artifact hash during this task, and the store consumes its exported validator. No shared file/editor/server/schema/package/index/docs changes, no commit/push/install/env copy/auth/provider/children or service stop.

## Published API

```ts
type SourceRecoveryScope={workspace:string;actor:string;email:string};
type SourceRecoveryDraft={
  id:string; title:string; doc_version:number; spec:EmailSpec;
  lineage?:unknown; updated_at?:string; raw_source_profile?:SourceProfile|null;
};
type SourceRecovery={draft?:SourceRecoveryDraft;command?:string};
readSourceRecovery(scope):Promise<SourceRecovery>
writeSourceDraftRecovery(scope,draft):Promise<void>
writeSourceCommandRecovery(scope,serialized):Promise<void>
removeSourceRecovery(scope,{
  draft?:boolean; command?:boolean;
  expectedDraft?:{docVersion:number;specHash:string};
  expectedCommandKey?:string;
}):Promise<void>
```

IndexedDB database `lettercape-source-recovery-1`, schema1 object store `slots`, exact out-of-line key `JSON.stringify([workspace,actor,email])`. Exactly one draft snapshot and one original serialized command per record. Maximum20 records across all actor/workspace/document slots in this origin. New admission count and insertion share one serialized readwrite transaction; replacements remain allowed. No time eviction or silent work deletion. Removing both fields deletes only that exact slot; selecting one leaves the other intact.

Snapshots are own canonical JSON copies, so caller memory is not mutated. Draft uses actual strict shared saved-email transport fields and `EmailSourceSpecSchema`, UUID email equality, safe positive version, actual source UTF8/metadata budgets; document envelope is included in the1MiB nonsource metadata limit. Original command length/actual UTF8 bytes<=13697024, exact actor/workspace/email and recomputed fullspec/source identity checked through actual `recoverSourceSaveCommand` against the original command's own context. Serialized string/key/base/payload are preserved. Actual root fork extension is consumed through that same helper import. Read revalidates stored draft/command; malformed/corrupt hashes do not become restored source.

No automatic restore, actor switch, command dispatch or replay. Caller must supply a verified actor/document scope and explicitly choose recovery. Empty/unavailable actor fails validation. Different actor read returns only that actor's exact slot and cannot clear another slot through these scoped functions. No localStorage source duplication or source bytes in logs.

Write/remove resolves only in real IndexedDB `transaction.oncomplete`. Open errors/blocked open, request/transaction errors, actual abort and unavailable storage reject. Connections close after settlement and on versionchange. Original caller memory/command remains caller-owned on failure, allowing root to pause server dispatch if durable command retention fails. No durability claim before transaction completion, and no claim that browser storage is immune to user clearing/eviction/device failure.

Conditional acknowledgement cleanup: when expectedDraft supplied, read+validate stored exact draft and compute its actual WebCrypto canonical spec hash before write transaction. The write transaction rereads current record and compares its canonical spec+doc_version against that precomputed matching snapshot; any intervening later edit remains. Expected command key is compared inside that same write transaction, so a newer original command remains. Unconditional cleanup is for explicit root user reload/restore with disabled editor, as root directed. Conditional hash rejection does not remove work.

Origin quota guard uses actual `navigator.storage.estimate` where available. Known finite quota/usage with insufficient available bytes rejects QuotaExceededError before write, preserving earlier records. This is deliberately conservative for replacements and is advisory admission, not an infallible capacity prediction. Browsers may pad estimates; native Chromium here padded estimates despite CDP override. The real IndexedDB transaction remains the success/error boundary.

## Actual evidence and failed attempts

Meaningful RED `/tmp/lettercape-source-recovery-store-red.log`: missing module causes both required Node tests to fail. Initial Node GREEN `/tmp/lettercape-source-recovery-store-green-node.log`:2pass,0fail,1explicit native-test skip because browser opt-in not selected. That run did not claim actual native storage.

Native1 `/tmp/lettercape-source-recovery-store-native-1.log`: test runtime failure `ReferenceError: __name is not defined`; tsx named nested page functions require its naming helper in browser evaluate. Corrected only fixture global naming metadata helper; no IndexedDB mock. Initial type log `/tmp/lettercape-source-recovery-store-type-1.log` also flagged optional raw_html `.length` in test quota branch; corrected test nonnull assertion.

Native2 `/tmp/lettercape-source-recovery-store-native-2.log`: actual native core completed, final CDP quotaSize1 did not cause IndexedDB failure and assertedfalse!=true. Native3 `/tmp/lettercape-source-recovery-store-native-3.log`: CDP confirmed overrideActive=true/quota0 but write still succeeded. No false quota PASS claim. Native4 `/tmp/lettercape-source-recovery-store-native-4.log`: after estimate guard, fixture counted unrelated page IndexedDB readwrite completion and failed first exact count; narrowed observer to the exact owned database. Native5 `/tmp/lettercape-source-recovery-store-native-5.log`: all core again passed, physical quota still accepted. Native6 `/tmp/lettercape-source-recovery-store-native-6.log`: actual navigator.storage.estimate reported padded5368786944 quota despite CDP0, explaining why conservative guard did not reject. Native7 `/tmp/lettercape-source-recovery-store-native-7.log`: incompressible2MiB probe also accepted despite CDP0, estimate4295045120. No source text printed. These logs are all retained, not rewritten. Each browser used a fresh owned context; exact database cleanup was in finally and browser closed; CDP overrides reset before closing. No root app/worker/auth/session/database/env changes.

Root then expressly directed stopping repeated physical quota attempts and accepting actual native core/abort proof for integration while keeping physical quota release qualification open. Complied; no further physical quota attempts. Optional probe code remains opt-in `SOURCE_RECOVERY_PHYSICAL_QUOTA=true`, and normal final native test explicitly states it was not performed. No quota failure was simulated or turned into a false physical-quota success.

**Final native core GREEN exit0**, `/tmp/lettercape-source-recovery-store-native-final.log`, `SOURCE_RECOVERY_BROWSER=true node --import tsx --test tests/source-recovery-store.test.ts`:3/3pass,0fail,0skip, physical quota explicitly OPEN. Actual owned public originhttp://127.0.0.1:3003, anonymous fresh Chromium context, no auth/nodeenv. Browser helper bundled in memory with existing esbuild only; source values remained inert strings, never injected/rendered or logged. Real native assertions: exact2097152 UTF8 source bytes including BOM plus metadata; original full serialized command/key; observed actual owned transactioncomplete before promisesresolve; other actor read/clear isolation and invalid closed actor; UTF8 one-byte overflow; bad fullspec/sourcehash refuses write; true native request-success→transaction.abort rolls back and rejects; old receipt cleanup leaves later draft/new command, exact current conditional cleanup removes only matches; draft-only/command-only removal; exactly20 slots accepted and21st rejects without erasing earlier work; deliberately corrupted persisted command refuses read; exact owned deleteDatabase cleanup. In-memory source/command are preserved on unavailable/aborted writes.

Scoped ESLint `/tmp/lettercape-source-recovery-store-lint-frozen.log` exit0 empty; full TypeScript `/tmp/lettercape-source-recovery-store-type-frozen.log` exit0 empty; owned diffcheck exit0. Final subsequent source change only adds a missing space to the human slot-limit message (`has 20`), without changing behavior. No aggregate suite/DB tests repeated in Task3b; parent owns full integrated qualification.

## Rulings, costs and remaining qualification

- Ruling:20 exact records total, one draft+one command per record, deny new slots rather than evict — root explicit finite policy — cost is manual save/remove when full, preserving all earlier work.
- Ruling: command storage validates through existing frozen/root-owned command helper rather than duplicate cryptographic logic — actual source/fork contract stays root authority — cost is following future helper contract changes; malformed identity remains denied.
- Ruling: conditional cleanup computes digest outside IndexedDB transaction then compares exact canonical value inside write transaction — async crypto would otherwise inactivate transaction, and current reread prevents old digest erasing new text — cost is bounded extra snapshot/hash read.
- Ruling: quota estimates conservative when finite insufficient capacity, but no guarantee beyond actual transaction completion — padded Chromium estimates observed and root accepted honest open qualification — cost is possible near-quota false refusal and physical quota release evidence still open.
- Ruling: parent direction stops physical quota probes after native7, final core excludes probe and logs OPEN — avoids spending more local qualification effort and inventing passing behavior — cost is no physical-quota acceptance claim.

No paid fees, providers or commitments. Runtime allocations include bounded source/spec canonical copies, shared command JSON ceilings and IndexedDB structured clone; maximum20 slots keeps logical record count finite. Disk/CPU quota costs are not priced. No cross-user storage encryption/security or unlimited browser retention claim. Full GA/all65/all13 release gates remain binding; root owns integrated editor/server/browser acceptance and physical quota evidence.

Final two files frozen/readable, no half-write or active source mutation. No implementation blocker for accepted integration. Physical origin quota qualification remains explicitly open.

## Frozen hashes

```text
419a90d98f91f6fd53641deb2a2af92a99da98f5bd7294888e7b732be5348868  src/ui/source-recovery-store.ts
edaff9fa944e38b643a173a427d525f2d59ff9ed5c32db793cf674c709f3266b  tests/source-recovery-store.test.ts
```



## Root final native qualification, before frozen source review

All source/runtime code is frozen for one whole-source review after these checks. No fresh media/Monaco review is claimed. One additional meaningful node-budget test initially used paragraph markup whose actual node count stayed within budget; its fixture now uses 12,000 interleaved void-tag/text pairs, which stays below the lexical tag bound but exceeds the actual shared node budget. The corrected actual test passes with source preserved and projection unavailable. No implementation assertion was weakened.

Final aggregate: 418/418 pass, zero failures/skips. Full selected list was the entire baseline list: editor, complete Monaco, conversion API/browser, conversion full-review pointer/keyboard/mobile, UTM HTTP/browser and preflight HTTP/browser. All pass with zero provider calls. Two 404 Monaco diagnostics of unknown provenance remain disclosed; uncaught page errors are zero. Production build, lint, typecheck and API114 pass. Source/mobile screenshot was visually inspected: read-only Viewer layout at390px, disabled mutation controls and retained source profile; capture preceded projection completion and is not proof of completed viewer preview.

Evidence file SHA256 (local retained logs, no credentials):

| Evidence | SHA256 |
| --- | --- |
| `/tmp/lettercape-source-integration-suite6.log` | `312252d1a42c4f956c57d8cf4f1548fc890dea8c312916a6acd52566d5f9b96e` |
| `/tmp/lettercape-source-api-final.log` | `6c8f0936de4b67928019aaedba31e013d1ce37c6515f3817a0859cb9ad6041f0` |
| `/tmp/lettercape-source-build-final2.log` | `969073772ea5f1bc2a0bafb4270323894771d2473eef2e63ff342727237972db` |
| `/tmp/lettercape-source-editor-native10.log` | `f018c118ec7df1ad739b5b899fedbd6105a2b71f7c1ae732df88694f50932c3b` |
| `/tmp/lettercape-source-fragment-browser2.log` | `3306e52a1d9b7e19f811b9e60ec64f95b401da618580253a4982f679d180e6d6` |
| `/tmp/lettercape-source-media-native2.log` | `affaf8674d6e6d0d2c80d2af49c55c6743665bfdceb7007dd5735ceea2aabe57` |
| `/tmp/lettercape-source-media-ui-native1.log` | `32867df6cd0d3e615133bd8e59815b2523dc95807ebfea227956205fe0300b43` |
| `/tmp/lettercape-source-baseline-final-all.log` | `5167b49ce56f7521c4e4a8fc657dcc396db961882ba758aa9ecd958e4f3bac19` |
| `/tmp/lettercape-source-preflight-green1.log` | `e12274faffd2d4a73235806251b438b39c8091504db9af1ec3bce5a652f73c7a` |
| `/tmp/lettercape-source-fragment-node-budget-green.log` | `13e409e87d0c7fe9663102917a97e02bb2425f1a508964a41a07a760454e4602` |
| `/tmp/lettercape-source-type-final6.log` | `e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6` |
| `/tmp/lettercape-source-lint-final5.log` | `177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746` |

Local staged diff checking initially classified intentional CR endings in the 43-byte exact-source fixture as whitespace errors. `.gitattributes` now disables text normalization for that fixture and permits CR at EOL; its original byte hash is unchanged. Source bytes were not stripped to satisfy formatting.
