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

## Corrected whole-slice closure before canonical qualification

ONE whole review:0Critical/0Important/1MinorM1. ONE complete correction7aa9eedace18f20affed399b17a4de16b09ed4f0 and ONE scopedre-review close M1/no new findings. Fresh625/625configuredtests/zero fail/cancel/skip/fulltype/lint/API122/build pass. Existing actual3browser runtime files are byteidentical through this unmounted-adapter-only correction; fresh canonical3browser qualification remains pending. Corrected localLinux image source7aa9eed/source-label-bound/UID1001/networknone/two endpoints+three mappings/exactreceipts/generatededitorassets/privateexclusions pass. FullGA productionstartup intentionally refusesexit1. No new provider/public production acceptance.

## Complete immutable whole review — complete retained text

# Immutable whole Omnisend slice review

Date: 2026-10-03. Status: COMPLETE. Verdict: APPROVE WITH ONE MINOR FINDING; the planned correction and scoped re-review remain necessary to close this development slice. Critical 0 / Important 0 / Minor 1. This is not production acceptance or acceptance of a whole Full65 requirement.

## Identity and immutable scope

Reviewed exactly one complete baseline-to-candidate slice in the native Darwin checkout `/tmp/lettercape-mailchimp-export-native`, branch `codex/omnisend-export`.

- Baseline: `fda23c6b1a36de389d414a3585f75747c09a9f0c`.
- Candidate: `debeee8410c17167e4a969d04f2b5c47f9c4a046`.
- Exact binary artifact: `/tmp/lettercape-omnisend-whole.diff`.
- Patch SHA256: `37d5b926fdab9f1cacb1593df513054591d4ed06a192907b16758b06bd923c9d`.
- Official operation subset: `/tmp/lettercape-omnisend-operations.json`, SHA256 `b79b71797842f86e9e65ecb54fd9001f3ad2c77ea4a8c27a2a0df08ef2061d1a`.

`uname -s` returned Darwin and HEAD matched the candidate. Regenerating `git diff --binary BASE HEAD` reproduced the supplied patch byte for byte. All 24 changed tracked files matched their candidate Git blobs byte for byte. The tracked tree was clean. Untracked tooling, node_modules, and private scratch were excluded. The change contains 1,546 additions and 29 deletions across the compiler/contracts, server transport, route integration, UI, generated API/SDK, test fixture, CI, and documentation.

Read the brief first, repository `AGENTS.md`, installed Next.js server/client-components and route-handler guides, the complete design and implementation plan, and all 444 lines of `docs/OMNISEND-EXPORT-CHECKPOINT.md`, including the retained compiler/transport handoffs, separate-task review, ledger/rulings, failed attempts and evidence. Read all changed implementation/test files and the relevant unchanged frozen validator, editor lifecycle, route dispatch, authority/RLS, and prior contract context. The receiving-code-review skill was applied to independently evaluate the deferred finding rather than adopting its verdict.

No source, Git/index, private environment, database, provider, network, send, spend, push, or deployment action was performed. No browser, broad test, lint, typecheck or build was rerun. No subagents were used. The only behavioral execution was the bounded in-memory UUID probe below; its fetcher and persistence callbacks were injected. This report is the only authored deliverable.

## Finding M1 — transport UUID validation accepts identities rejected upstream

Severity: **Minor**. Status: **confirmed and carried forward for correction**, not waived. This is the independently adjudicated Task2 Minor, counted once.

Locations: `src/server/omnisend-template-adapter.ts:11` and `:39`. Relevant stricter contracts: `src/domain/omnisend-export-contracts.ts:7`, `src/domain/frozen-export-source.ts:11`. Missing regression coverage: `tests/omnisend-template-adapter.test.ts:69`.

The transport's UUID regex checks only hexadecimal groups and hyphen placement. The compiler and browser-safe review use `z.uuid()`, which also validates the UUID version and variant (with its supported nil/max exceptions). The destination hash covers mapping/API/source hash/HTML/text, but not `revision_id`; changing only that identity therefore leaves every checked content hash intact. An otherwise valid artifact with an invalid version or variant reaches `markSubmission`, the import request, persistence, and GET, despite the required complete source-identity validation before the marker.

Independent in-memory reproduction used an ordinary real `compileEmail` -> `compileOmnisendArtifact` fixture, copied it with only `revision_id` changed, and checked both upstream rejection and downstream callbacks. No actual provider or database request was made.

| Substituted revision ID | Compiler | Review schema | Marker | Injected requests | Persist callback | Result |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `11111111-1111-1111-1111-111111111111` | `EXPORT_SOURCE_INTEGRITY` | rejected | 1 | 2 | 1 | `needs_attention / EXPORT_IMPORT_CONTENT_UNVERIFIED` |
| `11111111-1111-9111-8111-111111111111` | `EXPORT_SOURCE_INTEGRITY` | rejected | 1 | 2 | 1 | `needs_attention / EXPORT_IMPORT_CONTENT_UNVERIFIED` |

Both results retained the injected trusted 24hex remote ID with `content_verified:false` and `destination_url:null`. The existing invalid-artifact test uses `not-an-id`, so it does not detect this correctly grouped invalid UUID case. The first probe isolates an invalid variant; the second isolates an unsupported version with an otherwise accepted variant.

Impact: malformed source identity can pass this new transport's pre-submission contract and reach a future durable caller. The implementation explicitly claims complete pre-marker validation, so upstream rejection is not grounds to dismiss the mismatch. It is Minor because this primitive has no mounted caller, current compiler-produced artifacts already have valid identities, and no authorization/RLS bypass or current end-user exploit was demonstrated. It is not elevated based on hypothetical remote activation.

Remediation: apply the existing browser-safe `z.uuid()` semantics (or an exactly equivalent validator) to `revision_id` before the marker. Add injected-fetcher cases for a correctly grouped invalid variant and invalid version, requiring `EXPORT_ARTIFACT_INVALID` with zero marker, fetch and persistence calls. Preserve all valid UUID forms accepted by the existing compiler/review contract rather than replacing this with a UUIDv4-only check. Retain normal real-compiled-artifact behavior and sanitized outcomes.

## Whole-slice requirements and quality assessment

### Compiler and local review

`src/domain/omnisend-export.ts:11-23` correctly reuses the unchanged frozen-source validator. Recompilation and deep manifest comparison bind the input source/spec/HTML/text/hash while preserving JSONB object-key reordering. Existing raw/custom, private-asset, static-blocker and legal-footer refusals remain. Only canonical unsubscribe slots become `[[unsubscribe_link]]`; exact per-format occurrence counts and HTML href counts prevent authored extra slots being mistaken for canonical footers. Curly/Liquid, Mailchimp, Omnisend square and conditional delimiters are rejected after the canonical slots are removed. Other frozen content is unchanged.

The decimal 1,000,000-byte limit is applied to final serialized JSON with a 255 UTF-16-unit U+FFFF name reserve, including JSON escaping overhead, and separately to plaintext. Three UTF-8 bytes per permitted UTF-16 unit is conservative for the transport's well-formed, control-free names; surrogate pairs and permitted quote/backslash escaping do not exceed that reserve. Actual transport serialization is measured separately. The destination hash and format hashes bind exact UTF-8 content and required mapping/API/source constants. Earlier compilers are unchanged.

`src/domain/omnisend-export-contracts.ts:6-8` is browser-safe and strictly content-free, with exact discriminant/constants, lowercase hashes, remote availability false and the exact ordered seven blockers. Unknown content, credential, link, verification and other extra fields are refused. No secret/server dependency enters the changed client import graph.

The 42 compiler tests meaningfully cover exact content/source preservation, hashes, footer counts, manifest and source corruption, private/raw/static/token refusals, boundary/one-byte-over/escaping behavior and strict review rejection. The plaintext guard exists even though the renderer may hit HTML limits first; no isolated plaintext-overflow fixture is falsely claimed. No additional compiler finding.

### Unmounted import and metadata inspection

The saved official import/get/render definitions support fixed `https://api.omnisend.com/api`, POST import201, name/html body, required `Omnisend-Version: 2026-03-15`, write/read scopes and a 24-character hexadecimal GET path ID. The source's schema version `5.0` is not substituted for the HTTP header. The 1 MB body unit remains conservatively interpreted as 1,000,000 bytes pending provider-boundary qualification. GET describes metadata, while render returns an arbitrary string-valued JSON map without a named HTML field. The implementation calls no render endpoint and invents no HTML key or management URL.

Apart from M1, pre-marker validation covers artifact constants, string well-formedness and sizes, exact hashes, source-hash shape, transformation array, names, token, callbacks, optional signal and actual serialized body. Validated name/body/token and dependencies are captured before awaiting the marker, so later callback mutation cannot alter the request. Local plaintext is never sent. The transport sends only one name/html POST per invocation, with fixed host/path, Bearer/version/JSON headers and `redirect:error`.

A trusted201/24hex ID is persisted before GET; malformed optional create attributes cannot erase it. Persistence/readback/abort/mismatch failures after that identity retain it. Exact GET ID/name yields only `needs_attention / EXPORT_IMPORT_CONTENT_UNVERIFIED`, never verified content or native handoff. Provider HTML/link fields are ignored. POST uncertainty remains conservative for lost/malformed/no-ID, 5xx,408, undocumented success statuses and untrusted responses. Other rejection classes yield fixed sanitized codes, and only429 carries bounded numeric Retry-After. There is no automatic POST retry.

Declared and streamed response bytes are bounded at 5MiB-1, decoding is fatal UTF-8, one shared30-second transport timer starts after the marker, and fetch/read races handle signal-ignoring operations and discard late responses. Results do not expose provider bodies or credentials. The future caller owns durable callback semantics and callback duration; callbacks themselves are awaited rather than forcefully interrupted. An indefinitely pending callback is therefore an expressly documented caller qualification, not a new breach of the transport-budget promise.

A source search found only the adapter's own exported definition under `src`; no mounted route or runtime caller was added. The 24 transport tests exercise request bytes/order, receipt handling, bounds, mutation capture, refusal/sanitization, fixed response binding, aborts, late streams and timer behavior. M1 is their identified coverage gap. No other transport finding.

### Routes, UI, API and earlier destinations

`src/server/esp-export-review.ts:14-33` extends the existing selected-destination branch without weakening current edit authority, explicit `emails:export`, principal/actor/workspace binding, tenant RLS, strict duplicate/unknown query refusal, GET-only dispatch, source lookup or audit. Downloads retain exact mapping/source/destination/content receipts, `no-store`, `nosniff`, attachment disposition, sandbox CSP and false remote availability. The existing forced tenant RLS and immutable-revision privileges remain unchanged.

The Editor imports only the new browser-safe schema, parses the selected discriminant, verifies revision/source identity and uses the existing actor/workspace/email/lifecycle/content anchors. Existing selection-generation fencing spans initial freeze dispatch/result/error adoption; this patch also adds it to the download freshness predicate. Changing away and back cannot revive an older selection interval. Download stream size and SHA256 checks occur before blob adoption. Buttons remain serialized through the existing busy guard, Viewer has no preparation/download buttons, and the default Klaviyo choice and prior labels remain.

The Omnisend panel discloses local preparation, remote export disabled, the total name/encoded-HTML body budget, native-import fidelity and management-link limits, local plaintext companion and unavailable editable blocks before review. The retained 390px screenshot was inspected: warning text, source/destination receipts, and controls wrap readably in the visible panel. No new UI finding was identified.

Generated OpenAPI and SDK expose the third destination and mapping literal and the strict review branch. Read-only structural inspection confirmed all122 operation identities remain unchanged, all prior standalone Klaviyo/Mailchimp schemas remain equal to baseline, and the new `oneOf` branch equals the standalone Omnisend schema after removing its top-level `$schema` annotation. No content-bearing or remote-effect operation was added. One initial inspection helper assumed the union key was `anyOf` and stopped with KeyError; inspecting/correcting it to the actual discriminated `oneOf` completed successfully. That was a reviewer helper error and changed no file.

The new owned HTTP/Chromium fixture observes real route denial, exact downloaded hashes and native tokens, immutable stored source, no remote operations, double-click freezing, local edits, failure/retry, held downloads/navigation, initial-freeze successful/failed acknowledgment selection round trips, three destination mappings, mobile overflow and Viewer denial. All fetch/provider transport tests remain injected. Fixture cleanup is owned, and CI invokes the new smoke after prior fixtures and before the shared dev-server lock. No fixture/CI finding.

### Documentation and acceptance limits

The design/plan/checkpoint preserve the actual scope and the complete task handoffs, separate review, ledger/rulings and failed attempts. Public summary documents label this slice under qualification and retain provider/fidelity/management and whole-review gates. Their general “full validation pending” language is conservative relative to the detailed native candidate results; Linux/canonical/full closure are genuinely still pending at this immutable candidate. Unchecked root-plan closure boxes are not evidence of a completed gate. No unsupported production, remote connection or whole-requirement claim was introduced.

Full65 BaselineA / all13 gates / zero whole accepted and43 Partial /17 Undelivered /5 Roadmap remain unchanged. REQ040 remains Partial. No extra promised provider features were invented for this review.

## Verification evidence accepted and its limits

All25 files named in `/tmp/lettercape-omnisend-candidate-evidence.json` were checked against their recorded byte lengths and SHA256 hashes, including retained RED/intermediate logs and the owned app log. All four materialized official Markdown files also matched their saved lengths and hashes. The public operation subset hash matched independently. This review used saved official material, without refreshing it or claiming real provider acceptance.

| Evidence | Observed saved result | SHA256 |
| --- | --- | --- |
| `/tmp/lettercape-omnisend-full-suite1.log` | 622 tests,622 pass,0 fail/cancel/skip/todo | `b1b19aa73e1fa39969087595f9104d07bfdd920c058838ea03558efff6efb03e` |
| `/tmp/lettercape-omnisend-type1.log` | full TypeScript command, reported successful exit | `e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6` |
| `/tmp/lettercape-omnisend-lint1.log` | full ESLint command, reported successful exit | `177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746` |
| `/tmp/lettercape-omnisend-build1.log` | optimized Next16.3.8 build completed | `0f9e49a234ba430514c1cedec35ffaa25bd0e878050cc7fee34d3ee96bdb2d99` |
| `/tmp/lettercape-omnisend-root-api1.log` |122 operations; generated OpenAPI/SDK match | `ab290f6bee02e1fcfa50627a9b4ecd92b7ab23d8bdeacf6560075c6f1d46140f` |
| `/tmp/lettercape-omnisend-root-browser1.log` | Omnisend6 groups and cleanup PASS | `64d1118a8766c8483fc334fc52ca133df49273d96b3226e29167be8bf55b4e54` |
| `/tmp/lettercape-omnisend-mailchimp-browser1.log` | Mailchimp6 groups and cleanup PASS | `b716c4145f29c2249467696270c49d512469f953a75ec03d8c8ff6d2af9c97c9` |
| `/tmp/lettercape-omnisend-klaviyo-browser1.log` | Klaviyo4 groups and cleanup PASS | `84bf5fee002fbc42d5b96a4fd25909f0e1d4e0c89fbcf19dc9758f44fa2acc2e` |

The saved RED root HTTP fixture fails422 vs200 for unsupported Omnisend; the saved API RED misses the new mapping enum. Compiler and transport retained scaffold/follow-up failures are documented, with successful owned/focused runs. Quiet lint/type logs alone do not independently encode exit status; their successful exits are supplied by the retained handoffs/root manifest. No fresh broad-run claim is made. The whole review's own UUID probe completed successfully and directly confirms M1 independently of those logs.

## Remaining blockers and exclusions

The only concrete in-scope finding is M1. The planned one complete correction and one scoped re-review should address it before local slice closure. No Critical or Important issue was identified.

Root separately owns Linux/private-exclusion/closed-startup qualification, guarded canonical sync/build/browser checks, original109-email/221-revision and private-file preservation, and final checkpoint/report retention. During report completion root supplied `/tmp/lettercape-omnisend-linux-proof-candidate.json`; it was read without rerunning the container. It binds this exact candidate to image `sha256:5fc955a3b15e7eeeda93d3b2a42abea97fa613ed306b9ff3a748d2c1b0552fd8`, linux/amd64, UID1001, network none, asset probe exit0, three-destination contracts/private exclusions true and closed production startup exit1. This is supplementary root-owned evidence beyond the frozen checkpoint; it does not alter the immutable review target. Root also reports main/Desktop still clean at baseline with fresh original109/221/private preservation and healthy dispatch-disabled apps. Canonical sync/closure and M1 correction remain pending. No original database or private environment material was accessed by this reviewer.

Final read-only recheck: HEAD still equals the candidate, tracked diff remains empty, and the binary patch retains its stipulated SHA256. No source change occurred during this review.

Actual provider account/grant/OAuth/entitlement, import transformations and exact provider size boundary, real-client/native fidelity, management link, durable queue/callback and production qualifications remain open exactly as disclosed. Existing earlier Minor/source/media/locale/global gates are not closed, reclassified or counted as new Omnisend findings. This immutable review does not authorize remote activation, sending, spending, publication, push or deployment.

## Complete correction handoff — complete retained text

# Omnisend ONE complete whole-review correction

Date: 2026-10-03. Status: implementation complete within delegated scope; root qualification and scoped re-review remain pending. Native Darwin checkout `/tmp/lettercape-mailchimp-export-native`, branch `codex/omnisend-export`.

Original reviewed candidate: `debeee8410c17167e4a969d04f2b5c47f9c4a046`. Exact correction commit: `7aa9eedace18f20affed399b17a4de16b09ed4f0` (direct parent is the original candidate). Commit contains exactly `src/server/omnisend-template-adapter.ts` and `tests/omnisend-template-adapter.test.ts`, 47 additions / 3 deletions. This scratch report is deliberately outside that two-file commit for root retention.

## Finding adjudication and implementation

Read the fix brief first, repository AGENTS.md, complete Omnisend design and implementation plan, full immutable whole review `/tmp/lettercape-omnisend-whole-review.md`, checkpoint, prior transport handoff, transport/tests, and existing strict compiler/review validation. No Next.js code is changed. Applied receiving-code-review, test-driven-development and verification-before-completion skills; the dispatched-subagent exception in using-superpowers applies. No reviewer or subagent was created.

Whole-review finding inventory: Critical 0 / Important 0 / Minor 1. M1 was confirmed independently against the implementation: the transport regex only constrained hex groups/hyphens, whereas `validateFrozenExportSource` and `OmnisendReview` use `z.uuid()`. The destination hash omits revision identity, so changing only that field retains every required content hash. All whole-review findings are addressed in this one correction; none is waived or silently reclassified.

The adapter now holds `const UUID = z.uuid()` and checks `UUID.safeParse(a.revision_id).success` during artifact validation, before any marker. This uses exactly the existing source/review semantics, including version/variant rules, case insensitivity, nil and max exceptions. Existing Zod dependency is reused; no shared validator, earlier compiler/transport, UI, route, contract, API/SDK, dependency or documentation source was changed.

Two separately named regressions copy an ordinary real compiled Omnisend artifact and replace only its revision ID. One isolates invalid variant (`11111111-1111-1111-1111-111111111111`), one unsupported version with valid variant (`11111111-1111-9111-8111-111111111111`). Each first observes the existing browser review rejection, then invokes the real transport with injected in-memory fetch and persistence callbacks. Assertions require markers=0, requests=0, persisted=0 and the exact `EXPORT_ARTIFACT_INVALID` error. Counting all three effects before checking the error makes the original failure observable even when the transport incorrectly resolves.

A compatibility regression admits versions 1 through 8, an uppercase ordinary UUID, nil and max through the existing review schema and transport. It checks marker/POST/persist/GET order, trusted remote ID, fixed `EXPORT_IMPORT_CONTENT_UNVERIFIED` result, false content verification and null destination handoff. Ordinary baseline tests continue to compile real source artifacts and assert exact request bytes/headers/order. All injected fetchers remain in memory.

## RED / GREEN and scoped verification

RED ran before any adapter change, against the exact original candidate adapter with only the new tests added:

`node --import tsx --test tests/omnisend-template-adapter.test.ts > /tmp/lettercape-omnisend-fix-red.log 2>&1`

Exit 1. Tests 27 / pass 25 / fail 2 / cancelled 0 / skipped 0 / todo 0. Exactly the new invalid UUID variant and version regressions failed. Each observed markers=1, requests=2, persisted=1 against the required all-zero counters. No loader/fixture error caused RED; the compatibility test and all 24 prior tests passed.

GREEN ran after replacing the regex with the existing strict Zod semantics:

`node --import tsx --test tests/omnisend-template-adapter.test.ts > /tmp/lettercape-omnisend-fix-green.log 2>&1`

Exit 0. Tests 27 / pass 27 / fail 0 / cancelled 0 / skipped 0 / todo 0. Both malformed identities now yield zero callbacks and the exact sanitized error. Compatibility and all original transport behavior passed.

Scoped TypeScript command:

`node_modules/.bin/tsc --ignoreConfig --noEmit --strict --target ES2022 --lib dom,dom.iterable,esnext --module esnext --moduleResolution bundler --jsx react-jsx --esModuleInterop --skipLibCheck src/server/omnisend-template-adapter.ts tests/omnisend-template-adapter.test.ts > /tmp/lettercape-omnisend-fix-type.log 2>&1`

Exit 0, empty log. Checks only two owned entrypoints and their transitive imports, with no emitted output or incremental state. This is not a whole-repository type qualification.

Scoped lint command:

`node_modules/.bin/eslint src/server/omnisend-template-adapter.ts tests/omnisend-template-adapter.test.ts > /tmp/lettercape-omnisend-fix-lint.log 2>&1`

Exit 0, empty log. `git diff --check` and `git diff --cached --check` each exited 0. Precommit diff and staged scope were exactly the two owned files. Commit completed successfully. Postcommit tracked tree and index were clean; initial untracked `tooling/openapi/node_modules` remained unchanged.

## Exact evidence

| Artifact | Bytes | SHA256 |
| --- | ---: | --- |
| `/tmp/lettercape-omnisend-fix-red.log` | 4641 | `9fa81ccaf13a512d5a24c6e112e8b64365414db78616a263b8b3d73b68e41e2a` |
| `/tmp/lettercape-omnisend-fix-green.log` | 2837 | `7a8a7410d86c886eaa41e0d06a33721a08adfef614ccb5426f4b0fb7fcae3b3c` |
| `/tmp/lettercape-omnisend-fix-type.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `/tmp/lettercape-omnisend-fix-lint.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `/tmp/lettercape-omnisend-fix-diff-check.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `/tmp/lettercape-omnisend-fix.diff` | 5167 | `517df19fc4a03dd689087b07c5c0f4aa794409e038a7e0758845dc0334acfa4e` |

The binary diff was saved before commit and independently regenerated from original candidate to correction HEAD afterward; both have the identical SHA256 above. Successful exits were directly observed in tool results; quiet lint/type logs alone are not represented as proof of status.

## Failures, rulings and remaining qualification

The two expected RED behavior failures are fully retained. One attempt to read the TDD skill's auxiliary `writing-good-tests.md` resource failed (`failed to read skill resource`); the main skill instructions were successfully read and applied, and this did not affect source or evidence. No unexpected implementation/test/lint/type/commit failure occurred.

Ruling: use the already-installed `z.uuid()` semantics directly rather than invent a second regex or impose UUIDv4-only validation. This fixes the identity mismatch and preserves every form the existing compiler/review contract permits. Ruling: the explicit delegated prohibition on broad suite/browser/build execution and root ownership of those gates controls this correction, notwithstanding the generic TDD skill's broad-suite guidance. No broad-green claim is made. Root must freshly qualify the corrected commit and conduct the single scoped re-review before slice closure.

No provider/network/DB/private-environment/original-data action, OAuth/account admission, send, spend, push, deployment, browser, build, broad suite, reviewer or subagent action was performed. Adapter remains unmounted and `remote_export_enabled:false`; metadata remains unverified content, `destination_url:null`, no native editable-block or management-link acceptance. Callback durability/duration remains future-caller qualification. Earlier provider transports and unresolved source/media/locale/global gates are unchanged.

Full65 BaselineA / all13 gates / zero whole accepted remain binding. REQ040 remains Partial and 43 Partial / 17 Undelivered / 5 Roadmap remain unchanged. Actual provider grants/entitlement/account acceptance, fidelity/client preflight, exact provider body boundary, management handoff, durable queue/callback and production qualifications remain open as recorded. No in-scope implementation blocker remains; root fresh qualification, canonical checks, report/checkpoint retention and scoped re-review are pending.

## Complete scoped re-review — complete retained text

# Omnisend M1 scoped correction re-review

Date: 2026-10-03. Status: COMPLETE. Verdict: **M1 ADDRESSED**. Correction-introduced findings: Critical 0 / Important 0 / Minor 0. No in-scope blocker remains in this correction. This is the single scoped correction re-review, not another whole-slice review or production acceptance.

## Immutable scope and identity

Read `/tmp/lettercape-omnisend-scoped-review-brief.md` first. Reviewed only the correction from original candidate `debeee8410c17167e4a969d04f2b5c47f9c4a046` to corrected commit `7aa9eedace18f20affed399b17a4de16b09ed4f0` in native `/tmp/lettercape-mailchimp-export-native`, branch `codex/omnisend-export`.

`uname -s` returned Darwin. HEAD equals the corrected commit and its direct parent equals the original candidate. The exact diff changes only `src/server/omnisend-template-adapter.ts` and `tests/omnisend-template-adapter.test.ts`. Regenerated `git diff --binary ORIGINAL CORRECTED` matches `/tmp/lettercape-omnisend-fix.diff` byte for byte: 5,167 bytes, SHA256 `517df19fc4a03dd689087b07c5c0f4aa794409e038a7e0758845dc0334acfa4e`.

Both owned live files match their corrected Git blobs byte for byte:

| File | Bytes | SHA256 |
| --- | ---: | --- |
| `src/server/omnisend-template-adapter.ts` | 10,175 | `747e1411655b388611076fc6f622c7cb6e2df37f61db53ccfd88ef029387cc84` |
| `tests/omnisend-template-adapter.test.ts` | 23,431 | `d19b34fc4d4a436351609ccbf19486e5fafbdbe25636fc648a00f7f32de6cf30` |

Read the complete immutable whole-review report, complete fix report, repository AGENTS.md, complete Omnisend design and implementation plan, exact correction diff, both complete owned files, and relevant unchanged frozen-source compiler and browser-safe review contracts. Applied receiving-code-review and verification-before-completion skills. AGENTS.md requires installed Next.js guides before writing Next.js code; no Next.js code was written here.

## M1 adjudication

Original finding: the adapter accepted a grouped hexadecimal revision ID whose UUID version/variant was rejected by compiler/review `z.uuid()` semantics. The destination content hash excludes revision identity, so otherwise intact artifacts could reach the submission marker and injected transport effects. The original whole review rated this Minor; that historical severity is retained, and the finding is now addressed rather than waived or reclassified.

Corrected implementation at `src/server/omnisend-template-adapter.ts:4`, `:12`, and `:40` imports existing Zod, holds `const UUID = z.uuid()`, and evaluates `UUID.safeParse(a.revision_id).success` in `validateArtifact`. The public transport calls `validateArtifact` synchronously before callback capture, submission marker, fetch, or persistence. A rejected identity therefore produces the exact fixed `EXPORT_ARTIFACT_INVALID` error before all three effects. `safeParse` also rejects non-string values, preserving the removed explicit string guard's purpose.

This is exactly the validator used by unchanged `src/domain/frozen-export-source.ts:11` and `src/domain/omnisend-export-contracts.ts:7`. It does not introduce a UUIDv4-only restriction or a divergent handwritten regex. It preserves Zod-supported versions, case handling, nil, and max exceptions.

Two separately named tests at `tests/omnisend-template-adapter.test.ts:91` isolate grouped invalid variant and unsupported version, copy a real compiled artifact, confirm browser review rejection, and require all-zero marker/request/persistence counters plus the exact sanitized error. Those assertions detect the original behavior even if the adapter incorrectly resolves. The compatibility test at `:110` covers versions 1–8, uppercase ordinary UUID, nil, and max with normal marker/POST/persist/GET order, trusted remote ID, unverified metadata code, false content verification, and null destination handoff. Existing normal real-compiled-artifact bytes/headers/order assertions remain unchanged.

No correction-introduced issue was identified. The production diff only replaces the revision-ID validation predicate and adds its Zod import/schema; no earlier compiler, transport, route, UI, API/SDK, dependency, or provider behavior is changed. Content hashing, body validation/capture, receipt ordering, response bounds, abort behavior, sanitized outcomes, and unmounted status are unchanged in the inspected exact patch.

## Saved evidence independently read and hashed

Read the complete saved RED and GREEN logs, and the empty scoped type/lint/diff-check logs. Independently verified each byte count and SHA256 against the complete fix report.

| Saved evidence | Observed contents | Bytes | SHA256 |
| --- | --- | ---: | --- |
| `/tmp/lettercape-omnisend-fix-red.log` | 27 tests / 25 pass / 2 fail, exactly the new invalid variant/version cases | 4,641 | `9fa81ccaf13a512d5a24c6e112e8b64365414db78616a263b8b3d73b68e41e2a` |
| `/tmp/lettercape-omnisend-fix-green.log` | 27 tests / 27 pass / 0 fail/cancel/skip/todo | 2,837 | `7a8a7410d86c886eaa41e0d06a33721a08adfef614ccb5426f4b0fb7fcae3b3c` |
| `/tmp/lettercape-omnisend-fix-type.log` | empty scoped TypeScript log | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `/tmp/lettercape-omnisend-fix-lint.log` | empty two-file ESLint log | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `/tmp/lettercape-omnisend-fix-diff-check.log` | empty diff-check log | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

RED records each malformed ID reaching markers=1, requests=2, persisted=1, with the expected all-zero deep-equality assertion failing. Compatibility and all 24 prior transport tests passed in RED. GREEN records both targeted regressions and compatibility passing. No fixture/loader failure is represented as behavioral RED.

These are retained worker runs, not fresh suite/type/lint runs by this reviewer. Quiet type/lint/diff logs do not independently encode process exit status; their reported successful exits come from the fix handoff. Root owns fresh configured-suite/full-type/lint/API/build/Linux/canonical qualification. No broad qualification is inferred here.

## Independent fresh bounded probe

Executed one bounded in-memory 13-case probe via `node --import tsx --input-type=module` with stdin script in the native checkout; exit 0. It imported the real compiler, browser review, and corrected transport. It compiled an ordinary `blankSpec`/`compileEmail` fixture with a valid footer and reused the resulting frozen source. Every transport fetcher and both callbacks were injected in-memory; no provider or database request was made. No probe file or source was authored.

| Revision identity | Compiler | Review | Corrected transport effects/result |
| --- | --- | --- | --- |
| `11111111-1111-1111-1111-111111111111` (invalid variant) | `EXPORT_SOURCE_INTEGRITY` | rejected | `EXPORT_ARTIFACT_INVALID`; marker=0, fetch=0, persist=0 |
| `11111111-1111-9111-8111-111111111111` (unsupported version) | `EXPORT_SOURCE_INTEGRITY` | rejected | `EXPORT_ARTIFACT_INVALID`; marker=0, fetch=0, persist=0 |
| Versions 1–8 with accepted variant | accepted | accepted | marker → POST → persist → GET; `EXPORT_IMPORT_CONTENT_UNVERIFIED` |
| `ABCDEFAB-CDEF-4ABC-ABCD-EFABCDEFABCD` | accepted | accepted | same normal order/result |
| `00000000-0000-0000-0000-000000000000` | accepted | accepted | same normal order/result |
| `ffffffff-ffff-ffff-ffff-ffffffffffff` | accepted | accepted | same normal order/result |

For every valid identity, freshly compiling the real source with that ID produced an artifact deeply identical to the ordinary artifact after normalizing only `revision_id`; content, source/destination/format hashes and transformations therefore retained exact compiler semantics. The probe asserted exact POST JSON bytes and the complete sanitized result including trusted remote ID/resource URL, `state:needs_attention`, `content_verified:false`, and `destination_url:null`.

Fresh final read-only recheck confirmed the corrected HEAD, parent, branch, patch hash, and owned live bytes still match this review target. The owned working-tree diff is empty. The report is the only authored deliverable.

## Limits and remaining work

The single in-scope M1 finding is closed by this correction and scoped review. No inherited issue or provider gap is counted as a correction-introduced finding. Root independently owns fresh full qualification, canonical preservation/checks, and checkpoint/report retention; their completion is outside this report's claim.

The transport remains unmounted and remote export disabled in the artifact contract. Actual provider account/grant/OAuth/entitlement, import fidelity and real-client qualification, exact provider size boundary, management handoff, durable queue/callback duration, production acceptance, and earlier source/media/locale/global gates remain open as documented in the whole review and design. Full65 BaselineA / all13 gates / zero whole accepted remain binding; REQ040 remains Partial and 43 Partial / 17 Undelivered / 5 Roadmap are unchanged.

No source/Git/index mutation, private environment access, DB/provider/network action, browser/build/broad rerun, sending, spending, push, deployment, or subagent action occurred. No remote activation or production acceptance is authorized by this review.

## Complete current ledger and exhaustive rulings — complete retained text

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

ONE immutable whole review candidate debeee8410c17167e4a969d04f2b5c47f9c4a046 (baselinefda23c6, patchSHA37d5b926fdab9f1cacb1593df513054591d4ed06a192907b16758b06bd923c9d) found0Critical/0Important/1Minor M1, confirms task UUID-validator drift. ONE complete native correction worker will align strict sourceidentity and zero-IO regression; no root production edit. CandidateLinux UID1001/networknone/three exactmapping contracts/assets/privateexclusion/startupclosedPASS; metadata at/tmp/lettercape-omnisend-linux-proof-candidate.json. Canonical remains clean fda.

ONE complete correction7aa9eedace18f20affed399b17a4de16b09ed4f0 changes exactly transport+tests47+/3-, patchSHA517df19fc4a03dd689087b07c5c0f4aa794409e038a7e0758845dc0334acfa4e. Strictz.uuid beforemarker; invalidversion/variant meaningfulRED27tests/25pass2fail each marker1/request2/persist1, GREEN27/27 including acceptednil/max/modernvalidsemantics. Freshroot625/625configuredtests/0fail/cancel/skip and fulltype/lint/build/API122 pass. Onlyunmountedadapter+its tests changed; reviewed UI/routes/compilers and existing successful actual3browser byteidentical; freshcanonicalactual3fixtures planned. ONE scopedre-review and correctedLinux pending.

ONE scoped re-review M1ADDRESSED/no correction-introduced findings; exactlive/patch/loghashesverified and13independent in-memory cases preserve versions1–8/uppercase/nil/max while malformedvariant/version zeroeffects. CorrectedLinux source7aa9eed image7059c779/configbcf2afcb UID1001/networknone/three mappings/two endpoints/assets/privateexclusion/startuprefused1PASS. Root625tests/fulltype/lint/API122/build PASS. Whole/fix/scoped cycle closed; no residual finding/adjudication waiver. Canonical qualification follows.

## Compiler brief — complete retained text

# Omnisend compiler task

- Full65 BaselineA/all13 gates/zero whole accepted; no real provider/OAuth/spend/sends/push/deployment.
- OMNISEND_MAPPING_VERSION='omnisend-html-import-1', OMNISEND_API_REVISION='2026-03-15', OMNISEND_IMPORT_BODY_LIMIT=1000000.
- Native footer [[unsubscribe_link]], name255 well-formed UTF16 units, exactJSON{name,html}, metadata never content/handoff verification.
- Owned loopback fixture DBs only; original/private files/data and both earlier mappings preserved.


### Task1: Omnisend compiler and client-safe review
Files create src/domain/omnisend-export-contracts.ts, src/domain/omnisend-export.ts, tests/omnisend-export.test.ts. Consumes validateFrozenExportSource(r):Promise<{footerCount:number}>, FrozenExportRevision from existing domain module. Produces OmnisendArtifact with same common fields as MailchimpArtifact and destination:'omnisend'; async compileOmnisendArtifact(r):Promise<OmnisendArtifact>; omnisendReview(a):OmnisendReview. Browser-safe constants/schema exact values/7blockers in spec.
- [ ] Write real compiler tests: exactslot mapping/UTF8/destination hashes/sourceimmutability/reorderedJSONB/allmanifest corruption/refusedraw/private/footer/unknownnativeconditionaltokens/bodyescaping-reserve and strict contentfree review. Existing Klaviyo/Mailchimp tests unchanged.
- [ ] Run owned tests against unimplemented behavior and retain meaningful RED.
- [ ] Implement only owned files against spec; no shared validator refactor.
- [ ] Run owned + existing compiler/Klaviyo/Mailchimp regression; scoped lint/type when interface is available.
- [ ] Commit only owned files; full handoff report in plan scratch, no reviewer/subagents.

Execution: native Darwin /tmp/lettercape-mailchimp-export-native on codex/omnisend-export; baseline04fe4b82b9f252575f8880377f9645b77a1ae873. Read AGENTS.md and pertinent installed Next docs before changing any Next/client files (worker scopes are domain/server). Read design docs/superpowers/specs/2026-10-03-omnisend-export-design.md for binding contract. Do not read entire plan or sibling scratch. Own only task-listed files. No DB/privateenv/provider/request/push/spend/deploy/subagents/reviewers/broad suite/build/browser. Injected fetches/in-memory compiler only. Commit only owned files while root/sibling edits may be unstaged. Report complete exact commands/log SHA/RED failures/GREEN outcomes/commit/limits to .superpowers/sdd/omnisend-export/compiler-report.md. Logs /tmp/lettercape-omnisend-compiler-{red,green,type,lint}.log, preserve unsuccessful attempts; return status/commit/tests/concerns only. Exact shared interface: OmnisendArtifact same common fields as MailchimpArtifact with Omnisend discriminant/constants; OMNISEND_IMPORT_BODY_LIMIT exported from browser-pure contracts. Signal/callback/fetcher transport options exact in Task2. Worker1 publishes interface as soon as ready; Worker2 uses exact brief until then. Scoped tests/lint/type only; no repository-wide index additions.

## Transport brief — complete retained text

# Omnisend transport task

- Full65 BaselineA/all13 gates/zero whole accepted; no real provider/OAuth/spend/sends/push/deployment.
- OMNISEND_MAPPING_VERSION='omnisend-html-import-1', OMNISEND_API_REVISION='2026-03-15', OMNISEND_IMPORT_BODY_LIMIT=1000000.
- Native footer [[unsubscribe_link]], name255 well-formed UTF16 units, exactJSON{name,html}, metadata never content/handoff verification.
- Owned loopback fixture DBs only; original/private files/data and both earlier mappings preserved.


### Task2: Unmounted Omnisend import transport
Files create src/server/omnisend-template-adapter.ts, tests/omnisend-template-adapter.test.ts. Consumes Task1 OmnisendArtifact/interface/constants. Produces createAndInspectOmnisendTemplate(o):Promise<OmnisendTemplateResult>, options artifact/name/accessToken/signal?/required markSubmission:()=>Promise<void>/required persistRemoteId:(id:string)=>Promise<void>/fetcher?:typeof fetch. Result state needs_attention|outcome_unknown, code,remote_id:string|null,resource_url:string|null,destination_url:null,content_verified:false,retry_after?:number. Never mounts.
- [ ] Write injected-fetcher tests: exactPOST/namehtml/versionBearer/noextraIO; beforeIO completevalidation/exactbodylimit/JSONescaping/nameUnicode; captured callbackmutation; partial24hexID beforeGET; knownID allfailures; metadataonly/unsolicitedhtml/links; HTTPuncertainty/rate/auth/version/size; foreignorigin/path/redirect/userinfo; 5MiB response streaming/abort/signalignoring/late-response/30sec combined budget. Real compiled artifact fixtures for normalpaths.
- [ ] Run scaffold behavioral RED; retain failures.
- [ ] Implement exact spec independently within owned files; no generic shared-helper change.
- [ ] Run owned tests/scoped lint/type; full no secrets/DB/provider report, then scoped commit.

Execution: native Darwin /tmp/lettercape-mailchimp-export-native on codex/omnisend-export; baseline04fe4b82b9f252575f8880377f9645b77a1ae873. Read AGENTS.md and pertinent installed Next docs before changing any Next/client files (worker scopes are domain/server). Read design docs/superpowers/specs/2026-10-03-omnisend-export-design.md for binding contract. Do not read entire plan or sibling scratch. Own only task-listed files. No DB/privateenv/provider/request/push/spend/deploy/subagents/reviewers/broad suite/build/browser. Injected fetches/in-memory compiler only. Commit only owned files while root/sibling edits may be unstaged. Report complete exact commands/log SHA/RED failures/GREEN outcomes/commit/limits to .superpowers/sdd/omnisend-export/transport-report.md. Logs /tmp/lettercape-omnisend-transport-{red,green,type,lint}.log, preserve unsuccessful attempts; return status/commit/tests/concerns only. Exact shared interface: OmnisendArtifact same common fields as MailchimpArtifact with Omnisend discriminant/constants; OMNISEND_IMPORT_BODY_LIMIT exported from browser-pure contracts. Signal/callback/fetcher transport options exact in Task2. Worker1 publishes interface as soon as ready; Worker2 uses exact brief until then. Scoped tests/lint/type only; no repository-wide index additions.

## Correction brief — complete retained text

# Omnisend ONE complete whole-review correction
Native /tmp/lettercape-mailchimp-export-native branchcodex/omnisend-export frozen candidate debeee8410c17167e4a969d04f2b5c47f9c4a046. Read AGENTS.md, design/plan, full whole report /tmp/lettercape-omnisend-whole-review.md and checkpoint. Address ALL whole findings (0Critical/0Important/1MinorM1) in ONE complete correction: transportUUID regex admits invalidversion/variant compiler/client reject; align with existing z.uuid() and add meaningful zero-marker/zero-provider regression cases for both variants. Do not alter shared validator/earlier transports/UI/contracts. Owned ONLY src/server/omnisend-template-adapter.ts and tests/omnisend-template-adapter.test.ts, plus full report .superpowers/sdd/omnisend-export/fix-report.md. Retain meaningful RED against currentadapter then GREEN/scopedtype/lint/diff and exacthashlogs; no broad suite/browser/build/DB/privateenv/provider/network/spend/push/deploy/reviewer/subagents. Root handles fresh whole qualification/canonical and scopedreview. Commit ONLY2ownedfiles, report complete evidence/failures/concerns/rulings. Full65/all13/zero accepted/remoteunmounted unchanged. No routine permission menu under standing independent development instruction.

## Corrected qualification evidence

```json
{
  "corrected_code_head": "7aa9eedace18f20affed399b17a4de16b09ed4f0",
  "configured_tests": {
    "tests": 625,
    "pass": 625,
    "fail": 0,
    "cancelled": 0,
    "skipped": 0
  },
  "typecheck": true,
  "lint": true,
  "build": true,
  "api_operations": 122,
  "browser_at_candidate": "debeee8410c17167e4a969d04f2b5c47f9c4a046",
  "browser_runtime_files_unchanged_by_correction": true,
  "fresh_canonical_browsers": "pending",
  "scoped_review": "pending",
  "logs": [
    {
      "path": "/tmp/lettercape-omnisend-api-fixed.log",
      "bytes": 157,
      "sha256": "ab290f6bee02e1fcfa50627a9b4ecd92b7ab23d8bdeacf6560075c6f1d46140f"
    },
    {
      "path": "/tmp/lettercape-omnisend-build-fixed.log",
      "bytes": 1343,
      "sha256": "6aecd535b622c708662c835926348b86ae1c9a5fc8b38f078049900ff7f1dcc7"
    },
    {
      "path": "/tmp/lettercape-omnisend-full-suite-fixed.log",
      "bytes": 65176,
      "sha256": "ac38313860456652f638372123209819238a8c4388fe45e25bb6dd4b70d77d1f"
    },
    {
      "path": "/tmp/lettercape-omnisend-lint-fixed.log",
      "bytes": 36,
      "sha256": "177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746"
    },
    {
      "path": "/tmp/lettercape-omnisend-type-fixed.log",
      "bytes": 45,
      "sha256": "e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6"
    }
  ]
}
```

## Corrected Linux evidence

```json
{
  "head": "7aa9eedace18f20affed399b17a4de16b09ed4f0",
  "image": "lettercape-omnisend-check:fixed",
  "image_id": "sha256:7059c779568c063004a9081e9bdb1fe2755ac56418c389849c1f0ae22ed7290f",
  "platform": "linux/amd64",
  "source_label_bound": true,
  "uid": 1001,
  "network": "none",
  "asset_probe_exit": 0,
  "startup_exit": 1,
  "closed_startup": true,
  "private_exclusions": true,
  "three_destination_contracts": true,
  "deployment": false,
  "oci_config_digest": "sha256:bcf2afcbe4b8422f7a04a4542efef0f88c89f6f2a17bda24b9494ba29dd711ef"
}
```

## Canonical development closure

Qualified actual Desktop/mail and mirror atc99851614494f4d43596a772e6eff42ebefe1b9d with582trackedSHA matches, fullcanonicaltype/lint/API122/build, freshactualOmnisend6+Mailchimp6+Klaviyo4HTTP/Chromium groups and cleanup pass. Mobile390pixels inspected and readable. The first canonicalfixture failed atstartup because root restored its same-directorydevserver tooearly; diagnosed Nextlock and fixed only execution ordering, then unchanged assertions passed. Both ownedapps restored/main91988/canonical92419 healthy dispatchdisabled. Original109email/221revision old-column digests/private metadata remain identical. Final evidence-only local commit does not change executable bytes; no remoteCI/push/deployment/nativeprovider/fullGA acceptance is inferred. All65/all13/zero whole accepted,43Partial/17undelivered/5roadmap retained.

```json
{
  "qualified_head": "c99851614494f4d43596a772e6eff42ebefe1b9d",
  "tracked_sha256_matches": 582,
  "source_main_canonical_equal": true,
  "main_canonical_clean": true,
  "original_counts_and_old_column_digests_preserved": true,
  "private_metadata_unchanged_readable": true,
  "private_contents_copied_printed_or_hashed": false,
  "canonical_type_lint_api122_build": true,
  "fresh_canonical_browser": {
    "omnisend": 6,
    "mailchimp": 6,
    "klaviyo": 4,
    "cleanup": true,
    "external_calls": 0
  },
  "canonical_mobile_pixel_inspected": true,
  "failure_retained": "Restoring canonical dev app before owned fixture caused diagnosed same-directory Next dev lock; only canonicalgroup91991 stopped, same unchanged fixtures passed; main91988 preserved. Helper historical banner said two groups although filtered execution stopped one; banner corrected, guards unchanged.",
  "owned_app_pids": {
    "main": 91988,
    "canonical": 92419
  },
  "workers_and_unrelated_app_preserved": true,
  "health": [
    {
      "port": 3002,
      "health": {
        "request_id": "81b579a3-2551-4932-885d-1440ba5501d3",
        "status": "ok",
        "release": "development",
        "dispatch_enabled": false
      }
    },
    {
      "port": 3003,
      "health": {
        "request_id": "06125538-f398-471b-919a-8c95e3836dd8",
        "status": "ok",
        "release": "development",
        "dispatch_enabled": false
      }
    }
  ],
  "deployment": false,
  "logs": [
    {
      "path": "/tmp/lettercape-omnisend-canonical-type.log",
      "bytes": 45,
      "sha256": "e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6"
    },
    {
      "path": "/tmp/lettercape-omnisend-canonical-lint.log",
      "bytes": 36,
      "sha256": "177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746"
    },
    {
      "path": "/tmp/lettercape-omnisend-canonical-api.log",
      "bytes": 157,
      "sha256": "ab290f6bee02e1fcfa50627a9b4ecd92b7ab23d8bdeacf6560075c6f1d46140f"
    },
    {
      "path": "/tmp/lettercape-omnisend-canonical-build.log",
      "bytes": 1368,
      "sha256": "1755cac1f57086dd39de970ba3927979f13b05628b9714ef2c6c89da09c99327"
    },
    {
      "path": "/tmp/lettercape-omnisend-canonical-browser.log",
      "bytes": 850,
      "sha256": "64d1118a8766c8483fc334fc52ca133df49273d96b3226e29167be8bf55b4e54"
    },
    {
      "path": "/tmp/lettercape-omnisend-canonical-mailchimp-browser.log",
      "bytes": 831,
      "sha256": "b716c4145f29c2249467696270c49d512469f953a75ec03d8c8ff6d2af9c97c9"
    },
    {
      "path": "/tmp/lettercape-omnisend-canonical-klaviyo-browser.log",
      "bytes": 584,
      "sha256": "84bf5fee002fbc42d5b96a4fd25909f0e1d4e0c89fbcf19dc9758f44fa2acc2e"
    },
    {
      "path": "/tmp/lettercape-omnisend-canonical-browser-lock-failure.log",
      "bytes": 914,
      "sha256": "7bc1e280386a3c224c152100abde4d97e381be4d3527c4eaed4475f8637ca903"
    },
    {
      "path": "/tmp/lettercape-omnisend-canonical-app-lock-failure.log",
      "bytes": 526,
      "sha256": "1ac1268c162549a53cc4e7fc6e3cbc73708485da29881327c854687dab7b8792"
    }
  ]
}
```

## Final complete plan ledger and exhaustive rulings

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

ONE immutable whole review candidate debeee8410c17167e4a969d04f2b5c47f9c4a046 (baselinefda23c6, patchSHA37d5b926fdab9f1cacb1593df513054591d4ed06a192907b16758b06bd923c9d) found0Critical/0Important/1Minor M1, confirms task UUID-validator drift. ONE complete native correction worker will align strict sourceidentity and zero-IO regression; no root production edit. CandidateLinux UID1001/networknone/three exactmapping contracts/assets/privateexclusion/startupclosedPASS; metadata at/tmp/lettercape-omnisend-linux-proof-candidate.json. Canonical remains clean fda.

ONE complete correction7aa9eedace18f20affed399b17a4de16b09ed4f0 changes exactly transport+tests47+/3-, patchSHA517df19fc4a03dd689087b07c5c0f4aa794409e038a7e0758845dc0334acfa4e. Strictz.uuid beforemarker; invalidversion/variant meaningfulRED27tests/25pass2fail each marker1/request2/persist1, GREEN27/27 including acceptednil/max/modernvalidsemantics. Freshroot625/625configuredtests/0fail/cancel/skip and fulltype/lint/build/API122 pass. Onlyunmountedadapter+its tests changed; reviewed UI/routes/compilers and existing successful actual3browser byteidentical; freshcanonicalactual3fixtures planned. ONE scopedre-review and correctedLinux pending.

ONE scoped re-review M1ADDRESSED/no correction-introduced findings; exactlive/patch/loghashesverified and13independent in-memory cases preserve versions1–8/uppercase/nil/max while malformedvariant/version zeroeffects. CorrectedLinux source7aa9eed image7059c779/configbcf2afcb UID1001/networknone/three mappings/two endpoints/assets/privateexclusion/startuprefused1PASS. Root625tests/fulltype/lint/API122/build PASS. Whole/fix/scoped cycle closed; no residual finding/adjudication waiver. Canonical qualification follows.

Canonicalbuild/type/lint/API122 PASS and source/main/Desktop582trackedSHA matches/private/original109/221 unchanged atc998516. Root restored both ownedapps before canonicalfixture, causing unchangedfixture app3004 to fail beforetests: Nextdiagnostic says another same-directorydevserver3002 (child91994) already running. Systematicdebugging read/applied: compare successful isolatedfixture(nonconflictingcwd) vs restoredcanonicalserver same.next lock; hypothesis samecwdprocesslock prevents fixture startup. Correct onlyexecutionordering: pause identitychecked ownedcanonicalgroup91991; keepmain91988/workers/proofapp alive; rerun unchanged all3fixtures then restorecanonical. Retain initialfailed canonical browser and appdiagnostic logs; no product/check weakening.

Canonicalexecution ordering hypothesis confirmed: unchanged Omnisend6/Mailchimp6/Klaviyo4HTTP-Chromium groups+cleanup PASS afteronlycanonicalpause; restoredcanonicalPID92419/main91988 both healthdevelopment/dispatchfalse. Original109/221/private proofs identical across before/after/final;582trackedSHA source/main/Desktop match atc998516, allclean. Canonicaltype/lint/API122/build/mobilepixelPASS. FinalMarkdown-onlyevidencecommit/guardedFF retains completeallreports/ledger/rulings and code491-file equivalence beforedeletingonlythisplanscratch. No currenttaskrediscussion/remote action. Historical filtered helper banner saidtwo although execution stoppedone group; correctedbanner, actualPID/cwd/PGID guards unchanged.
