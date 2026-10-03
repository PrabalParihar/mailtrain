# Omnisend local export checkpoint

Baseline fda23c6b1a36de389d414a3585f75747c09a9f0c. Compiler1e5036112ad5566ee166a3075c18ae07fdc62366; transport399eba346885404ff1ebfc0dcd026664c8c34b7d. All65 BaselineA/all13 gates/zero whole accepted remain binding. REQ040 stays Partial;43partial/17undelivered/5roadmap. No provider/OAuth/account/native-client/content-fidelity/management-link/production success is claimed. Main/Desktop remain unchanged until whole review closes.

The Editor adds Omnisend HTML import alongside Klaviyo and Mailchimp Classic: exact frozen canonical-footer mapping, immutable per-format receipts, local HTML/plaintext downloads, conservative total-JSON budget and seven disclosed readiness blockers. The unmounted import/GET primitive persists a trusted remote ID before metadata readback; metadata is never content or handoff verification. Campaign creation/update/render/send routes are not used.

Candidate development qualification:622/622 configured tests/0fail/0cancel/0skip, full type/lint/build/API122, actual Omnisend6+Mailchimp6+Klaviyo4HTTP/Chromium groups and cleanup pass. Native390pixel inspected, readable wrapped receipts and controls/no horizontal overflow. Whole review/Linux/canonical qualification pending. Original109emails/221revisions column digests and canonical private file metadata remain unchanged in fresh preflight.

## Compiler handoff — complete retained text

# Task1 compiler handoff

Status: complete in native Darwin `/tmp/lettercape-mailchimp-export-native`, branch `codex/omnisend-export`. Owned commit `1e5036112ad5566ee166a3075c18ae07fdc62366` creates only `src/domain/omnisend-export-contracts.ts`, `src/domain/omnisend-export.ts`, and `tests/omnisend-export.test.ts` (195 added lines). No shared validator or previous destination compiler/contract/test edits by this worker. Concurrent root work was left unstaged.

## Shared interface

`OmnisendArtifact` contains the same common fields as `MailchimpArtifact`: destination literal `omnisend`, mapping_version literal `omnisend-html-import-1`, api_revision literal `2026-03-15`, revision_id/source_artifact_hash/destination_hash/html_sha256/text_sha256/html/text strings, remote_export_enabled literal false, transformations string[]. `compileOmnisendArtifact(r:FrozenExportRevision):Promise<OmnisendArtifact>` consumes existing unchanged `validateFrozenExportSource`; `omnisendReview(a:OmnisendArtifact):OmnisendReview`. Browser-pure contracts export the constants, `OMNISEND_IMPORT_BODY_LIMIT=1000000`, and strict content-free `OmnisendReview` schema/type. Domain module reexports these symbols.

Exact ordered blockers: OAUTH_CONNECTION_UNAVAILABLE, ACCOUNT_ENTITLEMENT_UNVERIFIED, REAL_CLIENT_PREFLIGHT_UNAVAILABLE, DESTINATION_CONFORMANCE_UNVERIFIED, DURABLE_REMOTE_EXPORT_UNAVAILABLE, IMPORT_FIDELITY_UNVERIFIED, MANAGEMENT_LINK_UNVERIFIED. Reserved JSON body and plaintext budget refusals both use `EXPORT_SOURCE_LIMIT`, communicated to root before integration.

## Verification commands and outcomes

- RED: `node --import tsx --test tests/omnisend-export.test.ts` against an explicitly temporary executable previous-destination reexport scaffold, not a missing-import loader error. Corrected fixture run: 42 tests, 32 passed, 10 expected behavior failures, exit 1. Failures: wrong destination/native footer/metadata blockers; native [% if contact %], [%, %] delimiters not rejected; wrong decimal body limit; boundary mapped bytes wrong; one-byte-over and JSON-escaping bodies wrongly admitted. Scaffold removed and replaced with final implementation after observing RED.
- First RED attempt retained: 41 tests, 31 passed, 10 failed. JSON escaping fixture initially exceeded existing 1 MiB structured source admission. Reduced 60 text blocks to 50 to create an admitted source whose serialized import body exceeds 1000000 bytes; added explicit Mailchimp *|UNSUB|* delimiter coverage. Shell attempt also used zsh reserved variable `status`; subsequent command used `task_exit`. Both unsuccessful attempt details retained here; both test runs remain in RED log.
- Owned GREEN: `node --import tsx --test tests/omnisend-export.test.ts`: 42/42 passed, exit 0.
- Focused compiler regression GREEN: `node --import tsx --test tests/omnisend-export.test.ts tests/mailchimp-export.test.ts tests/esp-export.test.ts tests/email-source-compiler.test.ts`: 97/97 passed, exit 0. Root was concurrently implementing its own integration tests; this worker did not change existing tests.
- Scoped lint: `node_modules/.bin/eslint src/domain/omnisend-export-contracts.ts src/domain/omnisend-export.ts tests/omnisend-export.test.ts`: exit 0, empty log.
- Scoped TypeScript: `node_modules/.bin/tsc --project /tmp/lettercape-omnisend-compiler-tsconfig.json --noEmit`: exit 0, empty log. Temporary config extends repository tsconfig, disables incremental and plugins, includes exactly the three owned files and their transitive imports, excludes repository node_modules. This is scoped type verification, not a whole-repository claim.
- Commit check: `git diff --cached --check`: exit 0; `git diff --cached --stat` confirmed exactly three owned files before commit.

## Log evidence

- `/tmp/lettercape-omnisend-compiler-red.log`: 26507 bytes; SHA256 `3667ad13956f078900a8c518e7aaa20ea704013f2ff0cfdbe71abe1d959fd34e`.
- `/tmp/lettercape-omnisend-compiler-green.log`: 12573 bytes; SHA256 `ce92107642899cd62e5404ddc5958d58886c1fe63ffbe0a5825c51b46e35bb3d`.
- `/tmp/lettercape-omnisend-compiler-type.log`: 0 bytes; SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- `/tmp/lettercape-omnisend-compiler-lint.log`: 0 bytes; SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

## Requirement coverage and limits

42 owned tests cover exact canonical-slot-only HTML/plaintext mapping; multi-footer column counts/hrefs; UTF-8 format and destination hashes; frozen source immutability and determinism; recursive JSONB key ordering; top-level manifest version corruption, missing/extra metadata, nested corruption/array order; source bytes/spec/id/hash corruption; raw/custom/column/private-asset refusals; missing footer/static blockers; curly/Liquid/Mailchimp/Omnisend native/conditional delimiters and authored canonical CTA/text slots; exact 1000000-byte JSON boundary and 1000001-byte refusal; worst-case well-formed 255-unit UTF-16 name reserve; JSON escaping overhead; strict review rejecting content, credentials, metadata/handoff claims, malformed identities/hashes/constants and altered blockers.

No DB/private env/provider IO/OAuth/spend/send/push/deployment/browser/build/broad-suite/subagent/reviewer actions. No production transport or integration changes in this owned scope. Final implementation remains remote_export_enabled false; review preserves all seven unresolved blockers. The plaintext <=1000000 guard is implemented alongside the reserved body guard; for the current structured renderer the HTML body may hit its limit first, so no isolated plaintext-only overflow fixture was claimed. Full65 BaselineA/all13/zero whole accepted remain unchanged. No outstanding compiler blockers.

## Transport handoff — complete retained text

# Task2 Omnisend transport outcome

Status: complete within the two-file task scope. Commit `399eba346885404ff1ebfc0dcd026664c8c34b7d` on `codex/omnisend-export`. Owned committed files: `src/server/omnisend-template-adapter.ts` and `tests/omnisend-template-adapter.test.ts`. All root/sibling edits were left untouched. This report is retained local evidence outside that commit.

## Behavioral evidence

Real compiled Omnisend artifacts are used in ordinary paths. Every fetcher is injected, including boundary/rejection/stream/abort cases. No provider request was made, no DB was contacted, no private environment/data was read, and no OAuth/account/spend/send/push/deployment work was performed. No subagent/reviewer/browser/build/broad test action was taken.

Scaffold RED command: `node --import tsx --test tests/omnisend-template-adapter.test.ts > /tmp/lettercape-omnisend-transport-red.log 2>&1`. Result: 24 tests, 0 pass, 24 expected behavioral failures, 0 cancellations. The shell wrapper attempted `status=$?` afterward and zsh rejected the read-only variable `status`; the tests themselves had finished and their complete RED output was preserved. Subsequent wrappers use `transport_exit=$?`.

Initial implementation GREEN: same test command to `...-green.log`; 24 pass, 0 fail. Preserved separately as `/tmp/lettercape-omnisend-transport-green-initial.log`.

Additional validation RED: same test command to `/tmp/lettercape-omnisend-transport-red-signal.log` after adding invalid optional `signal: {}`. Result: 23 pass, 1 expected failure (`complete validation refuses invalid constants/hashes/formats/source identity/name/token/callbacks before any marker or fetch`, actual marker count 1 vs expected 0); an invalid signal reached AbortSignal.any after the marker and left the budget timer pending. Pre-marker signal validation corrected this. Post-fix intermediate run `/tmp/lettercape-omnisend-transport-green-final.log`: 24 pass, 0 fail.

Final canonical GREEN command: `node --import tsx --test tests/omnisend-template-adapter.test.ts > /tmp/lettercape-omnisend-transport-green.log 2>&1`; exit 0, 24 pass, 0 fail, 0 cancelled, 0 skipped. Cases include exact POST/name+html/version+Bearer/no-extra-IO; before-marker full validation; actual finalJSON1,000,000-byte boundary including quote/backslash/Unicode escaping; valid paired Unicode name255 and unpaired/control/name256 refusal; callback mutation capture; 24hex partial identity persistence before GET; all known-ID failures; metadata-only unverified result ignoring unsolicited HTML/links; uncertain HTTP/lost receipt/no retry; fixed sanitized auth/permission/entitlement/version/size/rate/validation codes; bounded RetryAfter only429; exact origin/path/userinfo/query/fragment/redirect response binding; 5MiB-1 declared/streamed bounds; pre/post-marker abort; signal-ignoring fetch/stream races and late response cancellation; one30sec shared POST+GET budget.

Final scoped lint command: `npx eslint src/server/omnisend-template-adapter.ts tests/omnisend-template-adapter.test.ts > /tmp/lettercape-omnisend-transport-lint.log 2>&1`; exit0, empty log.

Final scoped TypeScript command: `npx tsc --ignoreConfig --noEmit --strict --target ES2022 --lib dom,dom.iterable,esnext --module esnext --moduleResolution bundler --jsx react-jsx --esModuleInterop --skipLibCheck src/server/omnisend-template-adapter.ts tests/omnisend-template-adapter.test.ts > /tmp/lettercape-omnisend-transport-type.log 2>&1`; exit0, empty log. Only the owned entrypoints and their import dependency closure were checked; no repository-wide typecheck was run.

Commit gate: `git diff --cached --check`, exit0. Staged ownership verified; scoped commit command `git commit -m "Add unmounted conservative Omnisend import transport" -- src/server/omnisend-template-adapter.ts tests/omnisend-template-adapter.test.ts`, exit0.

## Log SHA256

- red.log: `1d46882547683248e1d2836ad6ea9c948c4de5223d13fe5db936a78c11a49644`
- red-signal.log: `df3077b90271be2f0e91411173d384227b80196df723c9c4f6fbda9a5583bfec`
- green.log: `203345da69d616c02626eb2b68e20b07dfeac4ba82f4bf1faa3b32138fec0ddd`
- green-initial.log: `b9af60b6292434709185de32cd74f5a9957d2c1320df4db502b03f3f4527becd`
- green-final.log: `34b253772355e6f0a7c37a36a87b057e948c34912133b1346777a17f51a32ce8`
- type.log and lint.log (empty): `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

## Limits and concerns

The module remains unmounted. Success from exact GET id/name yields only `needs_attention/EXPORT_IMPORT_CONTENT_UNVERIFIED`, with `content_verified:false`, `destination_url:null`, and an API resource URL, not a management link. No render/update/campaign/send/retry/link-following capability was added. Optional create fields cannot erase the trusted ID. Every persistence/readback/abort failure after trusted identity preserves it.401/403/402/410/413/429 and remaining4xx return fixed sanitized codes;402 is conservative unexpected entitlement-response handling, not evidence of a paid-tier restriction on this endpoint. Durable callback completion/duration remains the future caller's responsibility; the provider budget starts after the marker and runs across both requests and persistence wait, but callbacks themselves are not raced or claimed durable by this module. Full configured regression/review/API/build/browser gates remain root-owned and were not claimed by this task. Full65 BaselineA/all13/zero accepted, actual account/native-client/fidelity/management-link qualifications remain unchanged.

## Joint separate-task review — complete retained text

# Joint Omnisend Task1 / Task2 review

Date: 2026-10-03. Review scope: the five-file immutable patch `/tmp/lettercape-omnisend-task.diff`, base `04fe4b82b9f252575f8880377f9645b77a1ae873` through candidate `399eba346885404ff1ebfc0dcd026664c8c34b7d`. Native cwd `/private/tmp/lettercape-mailchimp-export-native`; `uname -s` returned `Darwin`; HEAD matched the candidate. This is a separate compiler/transport task review, not whole-change acceptance.

## Verdicts

| Task | Spec compliance | Code quality | Findings |
| --- | --- | --- | --- |
| Task1 — compiler and browser-safe contracts | PASS within the three owned files | PASS | Critical 0, Important 0, Minor 0 |
| Task2 — unmounted transport | Compliant except one Minor source-identity validation mismatch | APPROVE WITH MINOR FINDING | Critical 0, Important 0, Minor 1 |

No Critical or Important finding was identified. Task2's Minor finding does not establish a mounted vulnerability or authorize remote export. All Full65 BaselineA / all13 gates / zero whole accepted remain binding.

## Review boundaries and evidence integrity

Read `AGENTS.md`, `docs/superpowers/specs/2026-10-03-omnisend-export-design.md`, both `.superpowers/sdd/omnisend-export/{compiler,transport}-brief.md` and both handoff reports. Inspected all five patch files and the unchanged shared validator and previous destination compiler implementations. No source, Git/index, DB, private environment, provider, network, send, spend, push, deploy, or browser action was performed. No broad test rerun and no subagent delegation occurred. The only behavioral probe used an ordinary locally compiled fixture, injected in-memory Responses and callbacks; it made no network request. This report is the only written deliverable.

The patch SHA256 is `67d0d5f82521710495c826082cc04594760235b62392a6151ec457c5b0fd66c3`. A read-only `git diff BASE HEAD --` reproduced its bytes exactly. Each owned file's HEAD blob matched live bytes, and the diff contains exactly these five added files:

| File | Bytes | SHA256 |
| --- | ---: | --- |
| src/domain/omnisend-export-contracts.ts | 1082 | 10f9e897baf8cbed188c903e23f777a473a3711f526a683133ee84368d894951 |
| src/domain/omnisend-export.ts | 3024 | 0169047f3c69dd5d4079403b16d232fff136cb6930dab8a04ce11317ecc317f7 |
| src/server/omnisend-template-adapter.ts | 10231 | 1c47080f493221019255b9339d3414a076c99d8527384e7afe04139aeb4ee28a |
| tests/omnisend-export.test.ts | 12908 | 69129462c318957680cb7d83af15360351ca4746f312bd62a84261d479f5b805 |
| tests/omnisend-template-adapter.test.ts | 21311 | 11585ad750f0b9620f7cca9b6fb5fcfb7e749cf0f3dc17df22507e6a4d7381e3 |

Base, HEAD and live bytes also match for `frozen-export-source.ts`, `mailchimp-export.ts`, `mailchimp-export-contracts.ts`, `esp-export.ts`, `mailchimp-export.test.ts` and `email-source-compiler.test.ts`. `tests/esp-export.test.ts` is unchanged between base and candidate but currently has a root-owned unstaged addition to the API mapping enum expectation; that integration change is excluded. No entire-tree-clean or currently rerun regression claim is made.

Public contract evidence was inspected entirely from saved material; it was not freshly fetched. `/tmp/lettercape-omnisend-operations.json` matched its stipulated SHA256 `b79b71797842f86e9e65ecb54fd9001f3ad2c77ea4a8c27a2a0df08ef2061d1a`. Materialization manifest SHA256: `8f9a43f4356b8b9b2cab4dae85cf471768828e871f17b79fd10b21a58416b4c9`. All four referenced files matched recorded byte lengths and hashes:

| Saved source | Bytes | SHA256 |
| --- | ---: | --- |
| /tmp/lettercape-omnisend-import.md | 89231 | 0fd7714597c198dbb3fd7a1d51a54bfe314c5577a4572b342645d09376c12f2f |
| /tmp/lettercape-omnisend-get.md | 88151 | 82454445088498b80402335a211191744fc5146a820d065763688e3a960f0655 |
| /tmp/lettercape-omnisend-render.md | 7266 | 1d1c17dcda6513209ed52bf5a8cfba9c9da7fc11c0ab771f929c29523eb7b443 |
| /tmp/lettercape-omnisend-model.md | 17018 | 5fa5144b0ecf26161fa34c4eb09835c6f85506e6c630ce60b9d3e36bf1cd9068 |

Parsed import/get/render definitions were equal to the corresponding saved JSON fences (including the four-backtick import/get fences). They support fixed API host, import POST201, GET200, 24 hexadecimal path ID, required `Omnisend-Version` default `2026-03-15`, OAuth write/read scopes, name/html request and 1 MB total-body limit. Schema info.version `5.0` is not used as the HTTP version. Render's arbitrary string-valued JSON map supplies no named HTML contract, and the patch does not call it. The native footer spelling and conditional syntax are treated as the frozen design's recorded support evidence, not independently refreshed provider acceptance.

## Task1 — spec compliance

`src/domain/omnisend-export-contracts.ts:3-8` exports exact mapping/revision/body constants. It imports only Zod, has no Node/server/content dependency, and uses a strict metadata-only schema with the exact ordered seven-blocker tuple. Unknown content, credential, handoff and verification fields are rejected. `omnisendReview` removes HTML/text and validates all remaining metadata through that strict schema.

`src/domain/omnisend-export.ts:12-17` consumes the existing `validateFrozenExportSource` without refactoring it. The shared validator preserves prior source/version/manifest/static/private-asset/refused raw/custom behavior. Only the canonical unsubscribe slots are replaced. Both format counts must equal the validated legal-footer count and HTML href count must also agree; authored extra canonical slots and foreign/unknown curly, Liquid, Mailchimp, Omnisend square and conditional delimiters are refused. No earlier compiler changes appear in this patch.

`src/domain/omnisend-export.ts:18-23` measures final serialized JSON with a 255-unit U+FFFF name reserve against decimal 1000000 bytes and independently bounds plaintext. Under the allowed well-formed, control-free name contract, three UTF-8 bytes per UTF-16 unit conservatively covers names, including surrogate pairs and permitted JSON escaping. Hashes use exact UTF-8 mapped HTML/text and JSON[mapping, API, source hash, HTML, text]. Name is absent from compiler metadata; remote export stays false.

The 42 tests inspect exact output and preserved input, rather than merely checking successful returns. Coverage includes multiple/column footers, UTF-8 hashes, recursive JSONB ordering and manifest corruption, source corruption, private/raw/custom/static refusals, delimiter rejection, exact body boundary/one extra byte, escaping reserve and strict browser review. Existing prior compiler tests are not edited by the task.

Verdict: PASS. No in-scope Critical, Important or Minor finding.

## Task1 — code quality and verification

The implementation is small and follows adjacent destination module conventions. Server compiler logic and browser schema remain separate. Canonical-slot count checks plus integrity recompilation give an observable source-to-output boundary. Error codes and deterministic hashes are stable; no unrelated helper changes or transport behavior are mixed into this task.

Saved compiler RED contains the first 41-test run (31 pass / 10 fail) and corrected 42-test run (32 pass / 10 fail). The corrected run fails real destination/footer/blocker/conditional-token/body-limit/escaping behavior against the executable prior-destination scaffold, rather than failing to load. The first escaping fixture failed source admission and was reduced; the unsuccessful attempt is disclosed and retained. Saved GREEN contains both owned 42/42 and focused regression 97/97, no failures/cancellations/skips. Scoped lint/type logs are empty and their successful exits are recorded by the handoff. Empty logs alone do not independently prove exit status; no fresh lint/type run was claimed.

| Compiler log | Bytes | Verified SHA256 |
| --- | ---: | --- |
| red | 26507 | 3667ad13956f078900a8c518e7aaa20ea704013f2ff0cfdbe71abe1d959fd34e |
| green | 12573 | ce92107642899cd62e5404ddc5958d58886c1fe63ffbe0a5825c51b46e35bb3d |
| type | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| lint | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |

Evidence files use `/tmp/lettercape-omnisend-compiler-{red,green,type,lint}.log`. The plaintext guard is implemented, but the current renderer may exhaust HTML first; no independent plaintext-only overflow case was demonstrated or claimed. This coverage limit does not invalidate the explicit guard.

Code-quality verdict: PASS within task scope.

## Task2 — spec compliance

`src/server/omnisend-template-adapter.ts:118-133` validates artifact constants, UTF-8 hashes, well-formed format strings, upper byte limits, source identifiers, transformation array, name, token, callbacks, fetcher and optional signal before the marker. It serializes and bounds actual final name/html JSON before awaiting the marker, captures validated bytes/dependencies, trims name and sends no plaintext. Invalid signal is now rejected before marker. The source UUID check has the Minor mismatch described below.

Fixed URLs, Bearer/version headers and redirect:error constrain POST/GET. Exactly one POST can occur per invocation, only201 establishes a receipt, and only a 24hex ID establishes known identity. Malformed optional create attributes cannot erase that trusted ID. The ID is persisted before GET and retained on persistence/readback/mismatch/abort failures. Exact GET ID/name supports only metadata; all results remain content_verified:false and destination_url:null. Undocumented HTML/link fields are ignored and no links or render/update/campaign/send operations are followed.

`src/server/omnisend-template-adapter.ts:47-95,131-164` bounds declared/observed response bytes at 5MiB-1, parses strict UTF-8 JSON, cancels/discards streams without waiting on broken cancellation, races fetch/stream with shared abort, discards late responses and clears one shared30sec budget. Marker duration is outside that budget. Persist callback is awaited while budget time elapses, but callback completion is not raced: an indefinitely unresolved callback can leave the function pending. The frozen design expressly assigns callback durability/duration to the future caller, so this is a scope limit rather than an implementation finding.

POST uncertainty is conservative for lost/malformed/no-ID, 5xx,408, undocumented2xx and untrusted response. Fixed sanitized needs_attention codes cover create rejection classes; only POST429 can carry bounded numeric RetryAfter. Once a known ID exists, non200 GET returns sanitized EXPORT_READBACK_UNAVAILABLE with that ID, rather than losing identity or retrying creation. The GET failure code is coarse and does not claim an OAuth repair or provider-content verification.

Verdict: compliant except the single Minor source-identity mismatch. No Critical or Important spec finding.

## Task2 — code quality finding

### Minor M1 — source UUID validation differs from the compiler and client contract

Location: `src/server/omnisend-template-adapter.ts:11` and `:39`; reference contract `src/domain/omnisend-export-contracts.ts:7` and unchanged `src/domain/frozen-export-source.ts:11`.

The adapter's regular expression verifies only hex digits and hyphen positions. It accepts invalid UUID variant/version structures rejected by the compiler's and browser review's `z.uuid()`. The transport brief requires complete source-identity validation before a submission marker. A caller can therefore provide otherwise intact artifact bytes with a malformed revision identity and reach the marker and provider request path. The destination hash does not include revision ID, so the malformed ID substitution does not trip its hash check.

Bounded in-memory evidence: an ordinary real compiled artifact was copied with only `revision_id:'11111111-1111-1111-1111-111111111111'`. `omnisendReview` rejected it. `createAndInspectOmnisendTemplate` accepted it: marker count1, injected request count2, persistence callback count1, result `needs_attention/EXPORT_IMPORT_CONTENT_UNVERIFIED` with known24hexID and unverified content. Both Responses were constructed in memory; no provider or other network request was made. Existing validation tests at `tests/omnisend-template-adapter.test.ts:69-88` cover `not-an-id` but not an invalid UUID with the correct hyphen shape.

Impact: inconsistent pre-marker validation and an incorrectly formed source identity may reach a future durable caller. This is Minor because the module is unmounted, ordinary compiler output already passes stricter validation, and the probe did not bypass any implemented account/authorization/queue boundary or prove a mounted exploit.

Remediation: reuse the browser-safe `z.uuid()` semantics (or an equivalently strict UUID validator) for `revision_id` before the marker; add an injected-fetcher case proving an invalid version/variant UUID yields zero marker/fetch callbacks. Preserve valid compiler-produced IDs and all current fixed/sanitized outcomes.

## Task2 — verification and quality assessment

Transport tests use real compiled artifacts for ordinary paths and injected fetchers throughout. Checks observe exact URL/body/header/order, before-marker refusal, body escaping and Unicode bounds, callback mutation capture, partial trusted receipt, retained ID, HTTP uncertainty, sanitization, response-origin/path/userinfo/query/fragment binding, stream limits, aborts, signal-ignoring operations and late response cancellation. The shared timer test records exactly one30000ms timer per invocation across both phases. No mounted caller or real provider behavior is inferred.

Saved scaffold RED: 24 tests / 0 pass / 24 fail, behavioral assertion failures. Invalid-signal correction RED: 23 pass / 1 fail, observed marker count1 versus expected0; its approximately30sec duration corroborates the abandoned budget timer. Final canonical GREEN: 24 pass / 0 fail / 0 cancellations/skips. Initial and intermediate GREEN logs are separately retained. Scoped lint/type successful exits are reported; all log hashes match. No broad rerun was performed for this review.

| Transport log | Bytes | Verified SHA256 |
| --- | ---: | --- |
| red | 19325 | 1d46882547683248e1d2836ad6ea9c948c4de5223d13fe5db936a78c11a49644 |
| red-signal | 3244 | df3077b90271be2f0e91411173d384227b80196df723c9c4f6fbda9a5583bfec |
| green | 2523 | 203345da69d616c02626eb2b68e20b07dfeac4ba82f4bf1faa3b32138fec0ddd |
| green-initial | 2522 | b9af60b6292434709185de32cd74f5a9957d2c1320df4db502b03f3f4527becd |
| green-final | 2525 | 34b253772355e6f0a7c37a36a87b057e948c34912133b1346777a17f51a32ce8 |
| type | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| lint | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |

Evidence files use `/tmp/lettercape-omnisend-transport-*.log`. The retained shell wrappers' zsh `status` variable failures are execution bookkeeping issues already disclosed in both reports; preserved test logs contain actual behavioral runs. The module's helper boundaries are clear and limited, fixed result constructors prevent provider content/credentials leaking into results, and explicit conservative outcomes prevent metadata from being presented as content or native handoff verification.

Code-quality verdict: APPROVE WITH MINOR FINDING M1; no Critical or Important findings. M1 is recorded as a deferred task-review Minor for root whole-slice triage under SDD; no source correction was performed during this immutable review.

## Outside task scope / not verified

Root-owned unstaged routes, selector/controller generation binding, downloads, strict query/RLS/actor scopes, API/SDK union/enum regeneration, fixture integration and CI are excluded. No review verdict is supplied for those changes. Actual owned HTTP/Chromium third-destination/download/selection roundtrip/retry/navigation/mobile/Viewer checks, configured full suite/lint/type/API/build/Linux private-exclusion/closed-startup checks and whole-change immutable review/correction/re-review remain root-controlled and unverified here.

OAuth provisioning, token acquisition and actual grant scopes, account entitlement, provider/account acceptance, real-client preflight, import/native-block/render fidelity, management links and durable queue/callback semantics are not implemented or verified by this patch. A documented API contract and injected fake responses do not close those qualifications. The seven blockers remain present and remote_export_enabled remains false. Prior Minor/source/media/locale/global gates and Full65 BaselineA/all13/zero whole accepted are not closed by these task verdicts.

Root subsequently reports full qualification passing 622/622 configured tests with zero skips, full type/lint/build/API122 and all three actual browser fixtures. Those root-reported results do not alter this five-file review and were not independently re-executed or reviewed here. They do not constitute whole-change acceptance.

## Plan ledger and exhaustive rulings — complete retained text

# SDD ledger — plan: docs/superpowers/plans/2026-10-03-omnisend-export.md
## Preflight interface/self-consistency table
| Pair/task | Produces/consumes or internal consistency | Outcome |
|1/2|OmnisendArtifact/constants, exact options/results|Disjoint owned files; transport may scaffold interface until compiler arrives.|
|1/3|OmnisendReview strict browser schema/artifact mapping|Root owns UI/routes/API; no node imports in browser contracts.|
|2/3|Unmounted primitive, no route activation|Root product still refuses actualremote export; no inferred connection.|
|1|Validator unchanged/token/hash/JSONreserve vs tests|Aligned; prior two compilers preserved.|
|2|20124hexID + metadataonlyGET vs tests|Aligned; arbitrary renderJSON key not invented.|
|3|122existingoperations + thirdliteral, selectiongeneration, localonly qualification|Aligned; fullGA does not close.|
Ruling: standing user instruction to continue independent development and focused parallel workers replaces routine spec/plan permission menus and SDD sequential workers for disjoint tasks — exact interface/file ownership and joint/whole review retained — costs integration or preference rework if assumptions drift, no provider/spend/publication permission inferred.
Ruling: use1000000 totalJSON bytes and compiler reserve for worst allowed255-unit well-formed UTF8 name — docs specify1MB without binary boundary, requestescaping affectssize — costs avoidable rejection up to48,576bytes until native boundary qualification.
Ruling: Omnisend imported template metadata/readback is never content/handoff verified in this slice; renderJSON lacks a named HTML property and import transforms bytes — no invented key/normalization/management URL — costs blocked nativehandoff until account-tested fidelity/link evidence.

Preflight artifact writer reached a final status-print NameError (json import omitted) after successfully writing spec/plan/ledger; git whitespace check and exact2-file plan commit04fe4b82 verified. No product code affected. Corrected handoff writer imports json; all files read/verified before task dispatch.

Root integration RED actualHTTP Omnisend422vs200 retained; API mapping enum assertion RED failed against old2-destination generated schema, regenerated API122/15testsGREEN. Initial root edit writer matched wrong CI indentation and failed after route/UI/API/package edits; multiline CI command block corrected explicitly. No compiler/transport changes by root. Third mapping/generation-bound downloads and actual3-destination round-trip fixture now integrated.

Root candidate qualification: full configured622/622tests/0fail/0cancel/0skip; full type/lint/API122/build pass. Actual owned Omnisend6+Mailchimp6+Klaviyo4HTTP/Chromium groups and fixture cleanup pass; native390pixel inspection shows readable wrapped receipts/buttons/no horizontal overflow. Original109emails/221revisions old-column hashes/private metadata unchanged in fresh pre-sync proof; main/Desktop remain clean fda23c6 until reviewed closure. Joint reviewer provisionally reported Minor UUID-validator drift; final task report and whole-slice triage pending.

Task1 complete after separate spec/quality PASS. Task2 complete with one Minor UUID-validation mismatch, no Critical/Important; full joint report /tmp/lettercape-omnisend-tasks-review.md retained and deferred to final whole-slice triage (not silently accepted). RootTask3 implementation/browser/fullcandidate qualification complete, immutablewhole/Linux/canonical gates pending.

## Candidate qualification evidence

```json
{
  "source_baseline": "fda23c6b1a36de389d414a3585f75747c09a9f0c",
  "compiler_commit": "1e5036112ad5566ee166a3075c18ae07fdc62366",
  "transport_commit": "399eba346885404ff1ebfc0dcd026664c8c34b7d",
  "configured_tests": {
    "tests": 622,
    "pass": 622,
    "fail": 0,
    "cancelled": 0,
    "skipped": 0
  },
  "typecheck": true,
  "lint": true,
  "build": true,
  "api_operations": 122,
  "browser": {
    "omnisend_groups": 6,
    "mailchimp_groups": 6,
    "klaviyo_groups": 4,
    "cleanup": true,
    "instrumented_external_calls": 0
  },
  "pixel_inspected": "/tmp/lettercape-omnisend-mobile.png",
  "whole_review": "pending",
  "canonical_sync": "pending",
  "production_acceptance": false,
  "logs": [
    {
      "path": "/tmp/lettercape-omnisend-api-contract-green.log",
      "bytes": 1385,
      "sha256": "bacdfedeb791fe3001d35d5cb362c9eb868babd605fd180eb3f48147f7e30947"
    },
    {
      "path": "/tmp/lettercape-omnisend-api-contract-red.log",
      "bytes": 2520,
      "sha256": "66693982e7294524042f186410ba5602dd76bb493fb3bb06c2e9195bcae17a7c"
    },
    {
      "path": "/tmp/lettercape-omnisend-api-generate.log",
      "bytes": 154,
      "sha256": "c91ba2dbae46f015b75801f89695e34419056add251630d9a784e4c53b3a7081"
    },
    {
      "path": "/tmp/lettercape-omnisend-app.log",
      "bytes": 13233,
      "sha256": "d88daa1f22d74891b69758c7fcf95fd541b9cbb0a25a7e74857184c8eb8225ad"
    },
    {
      "path": "/tmp/lettercape-omnisend-build1.log",
      "bytes": 1342,
      "sha256": "0f9e49a234ba430514c1cedec35ffaa25bd0e878050cc7fee34d3ee96bdb2d99"
    },
    {
      "path": "/tmp/lettercape-omnisend-compiler-green.log",
      "bytes": 12573,
      "sha256": "ce92107642899cd62e5404ddc5958d58886c1fe63ffbe0a5825c51b46e35bb3d"
    },
    {
      "path": "/tmp/lettercape-omnisend-compiler-lint.log",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "/tmp/lettercape-omnisend-compiler-red.log",
      "bytes": 26507,
      "sha256": "3667ad13956f078900a8c518e7aaa20ea704013f2ff0cfdbe71abe1d959fd34e"
    },
    {
      "path": "/tmp/lettercape-omnisend-compiler-type.log",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "/tmp/lettercape-omnisend-full-suite1.log",
      "bytes": 64848,
      "sha256": "b1b19aa73e1fa39969087595f9104d07bfdd920c058838ea03558efff6efb03e"
    },
    {
      "path": "/tmp/lettercape-omnisend-klaviyo-browser1.log",
      "bytes": 584,
      "sha256": "84bf5fee002fbc42d5b96a4fd25909f0e1d4e0c89fbcf19dc9758f44fa2acc2e"
    },
    {
      "path": "/tmp/lettercape-omnisend-lint1.log",
      "bytes": 36,
      "sha256": "177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746"
    },
    {
      "path": "/tmp/lettercape-omnisend-mailchimp-browser1.log",
      "bytes": 831,
      "sha256": "b716c4145f29c2249467696270c49d512469f953a75ec03d8c8ff6d2af9c97c9"
    },
    {
      "path": "/tmp/lettercape-omnisend-root-api1.log",
      "bytes": 157,
      "sha256": "ab290f6bee02e1fcfa50627a9b4ecd92b7ab23d8bdeacf6560075c6f1d46140f"
    },
    {
      "path": "/tmp/lettercape-omnisend-root-browser1.log",
      "bytes": 850,
      "sha256": "64d1118a8766c8483fc334fc52ca133df49273d96b3226e29167be8bf55b4e54"
    },
    {
      "path": "/tmp/lettercape-omnisend-root-lint1.log",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "/tmp/lettercape-omnisend-root-red.log",
      "bytes": 763,
      "sha256": "44f29d3fad15ba70ef6520700e976f03e59ea7b87f6b5692954e1dac7629fca2"
    },
    {
      "path": "/tmp/lettercape-omnisend-transport-green-final.log",
      "bytes": 2525,
      "sha256": "34b253772355e6f0a7c37a36a87b057e948c34912133b1346777a17f51a32ce8"
    },
    {
      "path": "/tmp/lettercape-omnisend-transport-green-initial.log",
      "bytes": 2522,
      "sha256": "b9af60b6292434709185de32cd74f5a9957d2c1320df4db502b03f3f4527becd"
    },
    {
      "path": "/tmp/lettercape-omnisend-transport-green.log",
      "bytes": 2523,
      "sha256": "203345da69d616c02626eb2b68e20b07dfeac4ba82f4bf1faa3b32138fec0ddd"
    },
    {
      "path": "/tmp/lettercape-omnisend-transport-lint.log",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "/tmp/lettercape-omnisend-transport-red-signal.log",
      "bytes": 3244,
      "sha256": "df3077b90271be2f0e91411173d384227b80196df723c9c4f6fbda9a5583bfec"
    },
    {
      "path": "/tmp/lettercape-omnisend-transport-red.log",
      "bytes": 19325,
      "sha256": "1d46882547683248e1d2836ad6ea9c948c4de5223d13fe5db936a78c11a49644"
    },
    {
      "path": "/tmp/lettercape-omnisend-transport-type.log",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "/tmp/lettercape-omnisend-type1.log",
      "bytes": 45,
      "sha256": "e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6"
    }
  ]
}
```

## Official materialization evidence

```json
[
  {
    "name": "import",
    "path": "/tmp/lettercape-omnisend-import.md",
    "bytes": 89231,
    "sha256": "0fd7714597c198dbb3fd7a1d51a54bfe314c5577a4572b342645d09376c12f2f",
    "source": "https://api-docs.omnisend.com/reference/post_email-templates-import.md"
  },
  {
    "name": "get",
    "path": "/tmp/lettercape-omnisend-get.md",
    "bytes": 88151,
    "sha256": "82454445088498b80402335a211191744fc5146a820d065763688e3a960f0655",
    "source": "https://api-docs.omnisend.com/reference/get_email-templates-id.md"
  },
  {
    "name": "render",
    "path": "/tmp/lettercape-omnisend-render.md",
    "bytes": 7266,
    "sha256": "1d1c17dcda6513209ed52bf5a8cfba9c9da7fc11c0ab771f929c29523eb7b443",
    "source": "https://api-docs.omnisend.com/reference/post_email-templates-id-render.md"
  },
  {
    "name": "model",
    "path": "/tmp/lettercape-omnisend-model.md",
    "bytes": 17018,
    "sha256": "5fa5144b0ecf26161fa34c4eb09835c6f85506e6c630ce60b9d3e36bf1cd9068",
    "source": "https://api-docs.omnisend.com/reference/email-templates.md"
  }
]
```

## Original preservation evidence

```json
{
  "private_contents_copied_printed_or_hashed": false,
  "trusted_application_config_loading": true,
  "emails": {
    "count": 109,
    "sha256": "95d2d1cd1822bab9b78601321d99db238f2298ba245b9b3b209d257063a4a172"
  },
  "revisions": {
    "count": 221,
    "sha256": "a600901eefd05fae90e155eb30f2aece3f9a0236dcd0b91ccfb0f938666294d4"
  },
  "private_metadata": {
    "mode": 384,
    "size": 986,
    "inode": "44097037",
    "mtime_ns": "1790839723000000000"
  }
}
```
