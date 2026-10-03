# Unverified integration registry development checkpoint

Implementation/review in progress in the isolated local worktree; canonical Desktop/mail has not received this slice. Design and sequenced plan are committed. Full65 BaselineA/all13 GA gates remain binding, zero whole requirements/gates accepted. REQ040 stays Partial; recipient sending attempt ledger and durable ESP export operations remain incomplete.

Durable account identity, private opaque credential-reference versions and append-only revocation history are the prerequisite scope. No qualified connection, real grant, native account entitlement/client/content/management link or provider IO is inferred. Runtime access is limited to strict redacted manager functions; can_export stays constrained false and verified_at NULL. No public route, OAuth flow, credential resolver or worker activation is added.

Brevo predecessor is CLOSED at local e9e9fe19ce79486afdf20f3a80cb4dc7292aa9d2. All591 tracked files match source/main/actual Path.home()/Desktop/mail; all497 nonMarkdown bytes match qualified b7f70f950c95a4972c74f4def33a9fcc70da6e7a.727/727 configuredtests/0skip, API122/lint/type/build/Linux and fresh canonical four actual browser journeys passed. Original109emails/221revisions old-column digests and private metadata/readability preserved; ownapps restored afterfixtures, unrelated app/workers preserved. Full reports/currentledger/6rulings retained verbatim committed canonical BREVO-EXPORT-CHECKPOINT.md before deleting only Brevo scratch. Source closure initially caught a trailing blank-line diff-check failure, corrected documentation-only and then committed; no executable failure waived.

HubSpot optional footer decision resolved by task-scoped direction: require matching company/address values, explain mismatch, preserve saved brand footer; live account validation cannot be claimed. Explicit reviewed remapping is a future option. Exact current published marketing/CMS schemas returnedHTTP403. Primary facts and safe byte-preserving compiler exploration remain in the research note below; no contract/schema/management URL fabricated.

## Complete HubSpot next-slice exploration

# HubSpot fifth-destination design exploration

Latest task-scoped direction: require matching company/address footer values and show clear mismatch explanation. Never silently rewrite a saved brand footer or claim live-account validation. Explicit reviewed remapping remains a future option. This resolves the optional product question; real credentials/legal acceptance stay separate.

Primary facts checked 2026-10-03:
- Required native email markup variables are site_settings.company_name, company_street_address_1, company_city, company_state and unsubscribe_link in an anchor href. Account marketing-email settings supply the values. https://developers.hubspot.com/docs/cms/reference/hubl/variables
- Official coded-email footer examples also include optional address2/zip/country and native unsubscribe annotations. No evidence that unused tokens inside comments/hidden content qualify a visible legal footer. https://developers.hubspot.com/docs/cms/start-building/building-blocks/templates/email-template-markup (modified2026-06-03)
- CMS source-code draft content is unpublished; published PUT changes live source and clears drafts. Binary GET returns file bytes, multipart PUT uses file field, validation is separate. These are distinct from marketing-email publication/sending. https://developers.hubspot.com/docs/api-reference/legacy/cms/source-code/guide
- Current published index explicitly lists marketing-marketing-emails-v2026-09 and cms-source-code-v2026-09. Both exact URLs returned native HTTP403; readable index SHA936e7afcaa90f254ab7bb1962642db1c9213ef2c1f5482d4c0f4df5f38bf4c6d. Earlier exact legacy marketing schema also inaccessible. Evidence /tmp/lettercape-hubspot-current-schema-materialization.json; no fabricated schema/request fields/deeplink.

Safe staged scope: first a structured frozen-source compiler and explicit footer settings comparison, then exact documented transport only after schemas/account-source lifecycle are qualified. Account values manually declared for a local preparation are not verified account values; receipt must carry permanent false remote/account/native/link evidence and bind a settings digest into transformed artifact identity. No remote draft can be claimed by referencing HubSpot's unrelated welcome template.

Source footer has identity and one opaque postal-address string, not native street/city/state fields. Need explicit structured local comparison inputs and a documented deterministic visible address composition before transformation. Check identity exactly against company_name and complete composed postal address exactly against each source legal footer. Optional address components cannot disappear. Empty state/international layouts and separator conventions must remain explicit conservative refusal cases until account/native qualification, never inferred components from arbitrary text. No change to saved source or brand.

Byte-preserving mapping approach: shared frozen-source validator unchanged; reject raw/custom/private/unresolved native/foreign syntax. parse5 with sourceCodeLocationInfo can identify canonical-footer anchor's immediate legal-footer container and exact paragraph text nodes/br; verify only expected source legal footers, replace source spans backwards with native company/address variables and unsubscribe href token. Avoid DOM reserialization or global identity/address string substitution because those change unrelated frozen content. Plaintext companion needs separately verified unambiguous legal-footer spans; reject ambiguous occurrence rather than rewrite another content block. Escape token-adjacent user values and reject unresolved authored HubL. Native account evaluation/render remains unknown.

Clear mismatch copy candidate: “The company name or postal address in this saved footer differs from the HubSpot values provided for comparison. Your saved footer is unchanged. Use matching values before preparing this destination.” Missing settings: “HubSpot coded templates use company and address values from its account settings. Supply those values for comparison before preparing this destination. Account access is not verified.” Exact rendered mismatch details must avoid echoing private account values in API metadata/audit/errors.

A mounted preparation flow requires a typed body for comparison settings; placing them in GET query strings leaks account data to URL logs. Existing four-destination GET routes stay unchanged. New endpoints must define body/hash/download/result privacy and generation fences explicitly, preserve idempotent immutable freeze history, and qualify repeated clicks/settings changes/held responses/navigation/mobile/current authority. Do not append HubSpot to the existing success union while it only has a blocked or unrelated file.

Remaining material prerequisites: exact current schemas/scopes/auth mode/eligible native account, source draft versus published-template selection, immutable collision-safe CMS paths, actual marketing-draft content injection/readback, account settings proof/client rendering/management link. No account/provider calls or new publication occurred during exploration.

Tracker reconciliation: CAPABILITIES.md had a stale Required/pending REQ021 row while the completed MEDIA-ASSETS-CHECKPOINT.md and current COVERAGE-CHECKPOINT.md already record its Partial private-media/GIF/static-fallback foundation. Corrected the row from the retained tested media evidence; no requirement accepted or new media qualification claimed. Actual65-row counts now reconcile43Partial/17undelivered/5roadmap.

## Task1 complete report (verbatim)

# Task1 durable SQL registry report

Status: DONE_WITH_CONCERNS. Final owned SQL/test implementation complete, all 10 scoped database tests pass, lint and diff checks pass. Remaining limitations are recorded below; root integration checks remain separate.
Base: `d06a648758a679d8de8b61b567f805bb30e2441c`.
Local commits: `d669df725b4539b6bfbde5c602f9e5109a9455b9` (`Add durable unverified integration registry SQL and isolation tests`), then `c55ba43cd1f2cda4bfbba14815401857c62d5333` (`Align integration SQL UUID and lifecycle output invariants`).
Commit owns exactly `db/035-integration-registry.sql` and `tests/integration-registry-db.test.ts`; no other tracked files staged or committed.
Report location: `/tmp/lettercape-integration-registry-native/.superpowers/sdd/integration-registry/task-1-report.md`.

## Deliverables

- Composite workspace-scoped connection identity and noncascading history FK; forced RLS on both tables and a tenant-scoped private service policy.
- Restricted NOLOGIN/NOSUPERUSER/NOBYPASSRLS/NOCREATEDB/NOCREATEROLE service owner, runtime cannot assume it. Four fixed SECURITY DEFINER public functions only; private helpers/trigger functions have no runtime/PUBLIC EXECUTE.
- Browser current active Owner/Admin authority from app settings and database rows; api-key actors rejected. Workspace UPDATE then membership SHARE then connection UPDATE locks, explicit current-state rechecks after authority waits, held through transaction commit.
- Exact unverified/revoked states; immutable provider/account/mode/region/creator/creation timestamp; database clock timestamps; permanent can_export=false and verified_at=NULL constraints.
- Exact redacted public keys/blocker order; opaque UUID credential references/private account metadata appear only in private storage/history, never returned.
- Original-binding registration replay after rotation/revocation, active account uniqueness, CAS rotation/fresh reference checks, idempotent revoke, append-only captured history, transaction rollback atomicity and no reactivation/deletion.
- Locale-independent whitespace/control metadata validation, preserving exact identity strings with no trim/case folding.

## RED evidence and failures

1. Wrote behavioral tests before production SQL. Temporary executable `db/035-integration-registry.sql` scaffold defined the exact registration function, returning `can_export=true` and private fields with runtime EXECUTE. The real generated DB invocation succeeded, then the assertion failed `Registry metadata must never claim readiness`, `true !== false`. This was a behavioral RED, not a missing import/function. Scaffold completely overwritten with implementation after retaining the failed log.
2. Initial production implementation and 7 tests passed. Added Unicode NBSP/BOM/Unicode-whitespace/C1 assertions before changing SQL validation. Test failed `Missing expected rejection`, proving locale-dependent regex accepted a forbidden blank/control input. Added explicit Unicode ranges, then all 7 tests passed.
3. Expanded privilege, foreign tenant, provider/mode, rollback, and actual connection wait coverage: 9 tests passed. No unexpected DB test, lint, or diff failure.
4. Early exploratory read `cat tests/tenant-rls-db.test.ts db/001-init.sql` exited 1 because those guessed files do not exist. Correct files were discovered with rg and read. No source edits resulted from that failure.
5. Extra assertions added after initial GREEN are regression coverage, not individually claimed as separate RED cycles. Primary readiness and Unicode validation RED cycles are documented precisely above.

## Commands and outcomes

All shell commands used workdir `/tmp/lettercape-integration-registry-native`. Database commands used authorized escalated loopback execution. No network/provider call, push/deploy/public route/spend, credential resolver, worker mounting, or private environment content read/copy/print/hash was performed.

| Command | Outcome |
|---|---|
| `cat .superpowers/sdd/integration-registry/task-1-brief.md` | 0; requirements read |
| `rg --files -g AGENTS.md -g 'db/*.sql' -g 'tests/*db*' -g 'tests/fixtures/*' -g 'scripts/smoke-source-truth.ts' -g package.json` | 0; discovered owned fixtures/schema |
| `cat tests/fixtures/creation-database.ts` | 0; owned DB create/migrate/drop contract reviewed |
| `cat tests/tenant-rls-db.test.ts db/001-init.sql` | 1; nonexistent guessed paths, corrected |
| `cat AGENTS.md tests/sender-domain-db.test.ts db/030-sender-domain.sql` | 0; repository instructions and existing definer patterns |
| `cat db/022-membership-lifecycle.sql tests/current-authority-db.test.ts scripts/smoke-source-truth.ts` | 0; lock/authority and guarded loader patterns |
| `rg -n 'CREATE ROLE\|GRANT\|CREATE POLICY\|CREATE TABLE (workspaces\|memberships)\|app.workspace\|mailcraft_member\|search_path\|FOR SHARE\|FOR UPDATE' db/001-foundations.sql db/022-membership-lifecycle.sql db/034-recipient-assessments.sql db/026-campaign-configurations.sql` | 0; grant/lock inspection |
| `cat package.json scripts/migrate.ts` | 0; migration runner reviewed |
| `git status --short`, `git rev-parse HEAD` | 0; baseline confirmed |
| `sed -n '1,42p' db/001-foundations.sql`, `cat db/029-local-session-current-expiry.sql` | 0; RLS/context inspection |
| `node --import tsx --test --test-name-pattern='output is redacted' tests/integration-registry-db.test.ts` | 1, expected meaningful RED; 1 failed assertion |
| `node --import tsx --test tests/integration-registry-db.test.ts` (green-1) | 0; 7/7 |
| `npx eslint tests/integration-registry-db.test.ts` (lint-1) | 0; no findings |
| `node --import tsx --test --test-name-pattern='null/invalid' tests/integration-registry-db.test.ts` | 1, expected Unicode RED; 1 failed assertion |
| `node --import tsx --test tests/integration-registry-db.test.ts` (green-2) | 0; 7/7 after Unicode correction |
| `rg -n 'CREATE ROLE\|mailcraft_worker\|mailcraft_scheduler' db`, `head`/`sed` reads of role SQL/tests | 0; worker/scheduler access inspection |
| `node --import tsx --test tests/integration-registry-db.test.ts` (green-3) | 0; 9/9 expanded tests |
| `npx eslint tests/integration-registry-db.test.ts` (lint-2) | 0; no findings |
| `git diff --check` | 0; no whitespace errors |
| `git add -- db/035-integration-registry.sql tests/integration-registry-db.test.ts` | 0; exact two owned files staged |
| `git diff --cached --check`, `git diff --cached --stat`, `git diff --cached --name-only` | 0; exact two owned files, no whitespace errors |
| `git commit -m 'Add durable unverified integration registry SQL and isolation tests'` | 0; `d669df725b4539b6bfbde5c602f9e5109a9455b9` |
| `node --import tsx --test tests/integration-registry-db.test.ts` (final-db, committed sources) | 0; 9 passed, 0 failed, 0 skipped/cancelled |
| `npx eslint tests/integration-registry-db.test.ts` (final-lint) | 0; no findings |
| `git diff --check -- db/035-integration-registry.sql tests/integration-registry-db.test.ts` | 0 |
| `git show --format=fuller --stat d669df7` | 0; exact two-file commit verified |
| `rg`/`sed` local zod regex source | 0; strict UUID syntax boundary inspected, ruling requested |

Tool reads of TDD/verification skills completed; parent explicit task requirements govern the delegated scope. Shell heredocs and Python scripts wrote only the two owned source files, retained task logs, and this requested report. Reporting hashes use only task-owned logs. Full configured npm test/type/lint/API/build and whole review remain root integration responsibilities, not claimed here.

## Final behavioral coverage

10 node tests exercise the actual migrated owned database and runtime role, including:
- Exact redacted output, permanent blockers, history registered/rotated/revoked and credential/version capture, replay after rotation/revocation, old/reused credentials refusal, account conflict and replacement ID after revocation.
- Browser Owner/Admin versus Editor/Viewer/Billing/api-key/unknown actor; revoked membership/locked workspace; foreign explicit workspace permission fence and authorized foreign-context identity NOT_FOUND.
- Forced RLS, no runtime table privileges, no runtime membership in definer role, private function ownership/search path/grants, worker/scheduler access denial, service foreign context invisibility, binding/history immutability and no cascading workspace deletion.
- Null/invalid input checks on all four public functions and fields, Unicode whitespace/control/length refusal with exact fixed error messages and no writes.
- Registration/rotation/revocation rollback of both state/history, duplicate registration with one history, duplicate active account with one winner, concurrent CAS rotation with exactly one winner.
- Actual workspace and membership lock waits plus committed revocation denial; current authority held through commit; authority before connection wait prevents revocation until commit.
- New pool after earlier transactions proves durable read independent of connection lifetime.
- Every declared provider/mode remains metadata only, exact account and region preserved, operations/outbox/usage remain zero in generated databases.

## SQL self-review

Lock order is workspace -> current membership -> connection. The guard reacquires already-held authority locks during mutation; it does not introduce a new order for public functions. Workspace lock serializes duplicate ID/account admission before SELECT/INSERT and constrains races; unique active-account index is an additional storage invariant. CAS/revoked/reference checks occur only after connection lock. Current authority is locked while history captures current actor and all history/state changes share one database transaction. Maximum version checks prevent integer overflow through public functions. Final schema additionally enforces unverified record_version=credential_version, revoked record_version=credential_version+1, created_at<=updated_at and revoked_at=updated_at. Mutation timestamps use greatest(clock_timestamp(),OLD.updated_at), and revocation derives both timestamps from that same value, preserving microsecond equality and monotonicity even if wall clock steps backwards.

All public function arguments have explicit NULL checks before writes. Well-formed SQL metadata check has coalesced boolean result; provider/mode enum NULLs explicit. Composite identity and FK include workspace throughout. Protected immutable columns have no service update grant and mutation guard checks the whole tuple. Connection DELETE/TRUNCATE and history UPDATE/DELETE/TRUNCATE triggers deny deletion/rewrite. Runtime has no SELECT on private account/reference/history fields; only the exact private output constructor returns public metadata. Definer role is restricted and not granted to runtime; temporary schema CREATE needed for ownership transfer is revoked. Search paths are fixed pg_catalog,public with explicit public relation/helper references. Public fixed-code exceptions never interpolate input values. Public output always constructs literal false readiness and exact blockers; no provider-ready transition exists.

## Concerns and limitations

- Scoped tests only: root must run full configured suite/type/lint/API/build/Linux startup/browser/whole review and record integration results.
- Tenant-local workspace UPDATE lock includes reads as well as writes. This favors a single consistent lock order and predictable account concurrency, at the cost of serializing registry requests per workspace and waiting behind authority/membership lifecycle locks. Keep tenant transactions short. No global/advisory lock is used.
- PostgreSQL text bounds count Unicode codepoints while JS string bounds count UTF16 units. Root accepted conservative TS UTF16 bounds as a subset, potentially rejecting astral text earlier in wrapper validation.
- PostgreSQL native malformed UUID/integer cast errors occur before typed SQL function entry; fixed-code INPUT_INVALID applies to the function argument domain. Root wrappers validate before SQL.
- Root requested exact pinned z.uuid parity at the durable SQL boundary, now enforced: versions 1–8, RFC variants 8/9/a/b, plus nil/max, case-normalized by PostgreSQL. A future pinned Zod upgrade requires coordinated conformance review. PostgreSQL-parseable non-RFC version/variant values are intentionally rejected.
- Durability demonstrated across transactions and independent pools, not a PostgreSQL crash/restart. No provider/credential-store qualification is implemented or implied. Registry remains unmounted and permanently blocked.


## Final parity refinement, command outcomes and failure retention

After initial commit, root ruled that direct runtime SQL must enforce the pinned wrapper strict UUID contract and timestamp/version relationships. Before implementation, added assertions for canonical PostgreSQL UUID text with invalid version/variant and exact revoked_at=updated_at.

- `node --import tsx --test --test-name-pattern='output is redacted|strict UUID' tests/integration-registry-db.test.ts`: exit 1, two meaningful behavioral RED failures. Existing SQL accepted an invalid RFC UUID (missing rejection) and revoke timestamps differed by 1 microsecond. Output retained as `task-1-parity-red.log`.
- SQL correction: private immutable UUID helper, public explicit fixed INPUT_INVALID checks on workspace/id/credential parameters, UUID constraints on private storage/history, version/timestamp schema relationships, one monotonic timestamp for revocation.
- `node --import tsx --test tests/integration-registry-db.test.ts` (`task-1-parity-green.log`): exit 1, 9 passed/1 failed. This was a test-fixture error: public connection ID and private credential sentinel were deliberately both nil/max, so naive string containment redaction assertion detected the legitimate public id. Changed fixture to use distinct nil/max pairs; did not weaken assertions or production code. Failure retained.
- `node --import tsx --test tests/integration-registry-db.test.ts` (`task-1-parity-green-2.log`): exit 0, 10/10.
- Expanded accepted UUID test to every version1–8 × variant8/9/a/b; uppercase/nil/max remain accepted, invalid version/variant rejected for every typed workspace/id/reference interface.
- `node --import tsx --test tests/integration-registry-db.test.ts` (`task-1-parity-green-3.log`): exit 0, 10/10.
- `npx eslint tests/integration-registry-db.test.ts` (`task-1-parity-lint.log`, `task-1-parity-final-lint.log`): both exit 0, no findings.
- `git diff --check -- db/035-integration-registry.sql tests/integration-registry-db.test.ts`: exit 0.
- `git add -- db/035-integration-registry.sql tests/integration-registry-db.test.ts`, `git diff --cached --check`, `git diff --cached --name-only`: exit 0, exact owned two files only.
- `git commit -m 'Align integration SQL UUID and lifecycle output invariants'`: exit 0, `c55ba43cd1f2cda4bfbba14815401857c62d5333`.
- Final committed check `node --import tsx --test tests/integration-registry-db.test.ts` (`task-1-final-db-parity.log`): exit 0, 10 passed/0 failed/0 skipped/0 cancelled.
- `git show --format=fuller --stat c55ba43`, final owned `git diff --check` and targeted `rg` source inspection: exit 0. Both commits contain exact owned files only.

Final source SHA-256 (owned source only, no environment content):

| Source | SHA-256 |
|---|---|
| `db/035-integration-registry.sql` | `52f95a75cbe9f21dbaf4e81944e2b264a2c28a36130a208192cda9a2984cdc3e` |
| `tests/integration-registry-db.test.ts` | `dc01016a442cb436c08b4c0ba2551ebe83170243d77ea031ab29c811fd34bf5d` |

## Log SHA-256

Logs retained under `/tmp/lettercape-integration-registry-native/.superpowers/sdd/integration-registry/logs/`.

| Log | SHA-256 |
|---|---|
| `task-1-final-db-parity.log` | `c324cde6ee36920c90d4ff0bf680a4c072d781de0b00e82791c6389205d96970` |
| `task-1-final-db.log` | `3d6c742980dc09a46b40357ff0360cb688109a0761fe3dbed86e0a8fe64aabd6` |
| `task-1-final-lint.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `task-1-green-1.log` | `a5c2e43043f6aa451868a3f7f34ebadc55d05686af8d167fe6bc397e838dccfe` |
| `task-1-green-2.log` | `75860eb99d841ba02e2847acb2fc811f235f626098acdeb9eb22661afe9b52d3` |
| `task-1-green-3.log` | `bcd87162f87e6e0cb0f1da7057fe67b035fecf9faf865a2172c3f2ac2a2416b5` |
| `task-1-lint-1.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `task-1-lint-2.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `task-1-parity-final-lint.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `task-1-parity-green-2.log` | `81bd4ac1b258628a9bd74184d002ea52c39688471b45e032fe7d0ca57e1ae9f6` |
| `task-1-parity-green-3.log` | `5e1479037db29f1013c72e593eabc3af8ab4598593ed39f1f852e2875218bf55` |
| `task-1-parity-green.log` | `10a4d5c717fa3384357e0331349d013a3eae289172987d2cfad54643f2c53b13` |
| `task-1-parity-lint.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `task-1-parity-red.log` | `53094749e63361bae36b153badaac3a7e7238934cd86a494d5e01a755e0f5c28` |
| `task-1-red.log` | `cc75a849b60d28a3841c0c6dd8951d7f37d64e18ccda76dde5e922b2e751c97c` |
| `task-1-unicode-red.log` | `4967dd2cf32ebb124b1f50cb31f38c429deff70839d6538ebbff9792d09b9cdc` |

## Task1 spec and quality review (verbatim)

### Spec Compliance

- ✅ Spec compliant for Task1: the immutable package changes exactly `db/035-integration-registry.sql` and `tests/integration-registry-db.test.ts`, implementing the required SQL boundary and scoped behavioral coverage. No missing, extra, or misunderstood Task1 implementation was found.
- SQL interfaces and redacted output match the specification: `db/035-integration-registry.sql:92`, `:144`, `:164`, `:173`, `:186`, `:208`. Output contains only the twelve specified keys, literal false readiness, and the exact ordered blocker list with revoked prefix.
- Storage identity, versions, permanently blocked qualification, and timestamp relationships are constrained: `db/035-integration-registry.sql:26`, `:36`, `:39`, `:43`, `:123`, `:126`. UUID guards implement versions 1–8 / RFC variants plus nil/max at `:22`, with explicit public entry checks at `:147`, `:167`, `:176`, `:189`.
- Current browser manager authority, workspace/member/connection lock order, and post-wait rechecks appear at `db/035-integration-registry.sql:69`, `:78`, `:80`, `:85`, `:151`, `:169`, `:178`, `:191`. Api-key actors are rejected before any identity lookup at `:73`.
- Both private tables force RLS and have composite workspace identity and a noncascading history FK: `db/035-integration-registry.sql:38`, `:50`, `:52`. Runtime receives only the four fixed public functions, not private table/helper access: `:60`, `:200`, `:205`, `:208`.
- Registration replay checks exact immutable binding and the original registered credential; active account admission rejects another ID; rotations use locked CAS and historical reference refusal; revoke is idempotent after current authorization: `db/035-integration-registry.sql:151`, `:153`, `:154`, `:159`, `:178`, `:180`, `:181`, `:182`, `:190`, `:193`.
- Connection/history rewrite and deletion are refused; state capture shares the mutation transaction and uses the same timestamp: `db/035-integration-registry.sql:99`, `:104`, `:109`, `:119`, `:135`. No cascade erases committed history.
- Meaningful behavioral RED evidence is retained in `logs/task-1-red.log` (false readiness assertion against executable scaffold), `logs/task-1-unicode-red.log` (missing forbidden-text rejection), and `logs/task-1-parity-red.log` (strict UUID acceptance and differing revoke/update microseconds). The final changed assertions at `tests/integration-registry-db.test.ts:17`, `:25`, and the strict UUID test exercise the corrected behavior. The retained intermediate fixture failure is explained rather than hidden.
- ⚠️ Cannot verify from this task diff: Task2 domain/server wrappers, strict wrapper output parsing/error redaction/identity checks, actual wrapper-to-SQL integration, the full configured suite/type/lint/API122/build, Linux packaged-source/startup checks, canonical browser regressions, and the required whole review. These remain controller integration gates; Task1 does not claim to satisfy them.
- ⚠️ Cannot verify from this task diff: preservation of the original 109/221 database counts or absence of unrelated actions outside the package. The inspected fixture generates and drops only its own random database; this is evidence of intended isolation, not a fresh audit of original databases.
- ⚠️ Database crash/process-restart durability was not demonstrated. `tests/integration-registry-db.test.ts:47` creates an independent pool and confirms persisted metadata, establishing connection-lifetime independence. The implementer explicitly reports no PostgreSQL crash/restart test. Controller should distinguish this evidence from crash-recovery testing if that is an acceptance gate.

### Strengths

- The narrow definer surface and fixed errors preserve the private account/reference boundary. `db/035-integration-registry.sql:4`, `:6`, `:60`, `:92`, `:205`, `:208` restrict authority and construct metadata explicitly rather than returning a table row.
- Trigger-enforced lifecycle and atomic captured history complement the public service functions: `db/035-integration-registry.sql:109`, `:123`, `:135`, `:142`. Identity and historical references remain stable through replay and revocation.
- The tests exercise real migrated PostgreSQL under the runtime role rather than mocking SQL. Exact output/history/replay and rollback/CAS behavior are asserted at `tests/integration-registry-db.test.ts:34`, `:46`, `:52`, and the atomicity/concurrency test. The lock tests observe `pg_blocking_pids` via `:28`, requiring an actual wait rather than a timing-only assumption.
- The tests cover manager/nonmanager actors, cross-workspace fences, immutable binding/history, forced RLS, private helper grants, worker/scheduler denial, Unicode metadata, declared provider/mode preservation, and all requested strict UUID version/variant combinations. Exact output keys at `tests/integration-registry-db.test.ts:18` prevent accidental private-field additions.
- The per-workspace read/write serialization cost is explicitly disclosed in the implementer report and follows the authoritative clarification. `db/035-integration-registry.sql:78` and `:169` show the deliberate lock behavior; it is not an undisclosed quality defect.

### Issues

#### Critical (Must Fix)

- None found.

#### Important (Should Fix)

- None found.

#### Minor (Nice to Have)

- None found.

### Focused Checks and Evidence

- Immutable identity verified: review package SHA-256 `6683ade0e75f0d81aea75d6af0543c1e10e8f4900a7f0bd99b1f57218c7e2d1c`; implementer report SHA-256 `4deb73e07765e4ea1747224542d84bd39d819db541013bf32e67e096b1cfcb54`. Package declares BASE `d06a648758a679d8de8b61b567f805bb30e2441c` and HEAD `c55ba43cd1f2cda4bfbba14815401857c62d5333`, with the two Task1 commits and exactly two owned files.
- Review inputs: the requested reviewer prompt, Task1 brief, complete implementer report, and current authoritative `docs/superpowers/specs/2026-10-03-integration-registry-design.md`. Initial batched tool output truncated the report, so the complete report was recovered from its stated path. Initial diff display also truncated mid-SQL and omitted the test introduction; only artifact lines 1–270 were recovered to see those missing hunks. No changed source file was separately read, and no git command was run.
- Named unchanged-code risk: adding a definer role must retain existing authority visibility and lifecycle lock order. Focused inspection of `db/001-foundations.sql:18`, `:21`, `:22`, `:25` confirms applicable workspace/membership context RLS; `db/022-membership-lifecycle.sql:46`, `:49`, `:51` confirms workspace-first membership lifecycle locking. The new functions retain that order. Existing runtime execution evidence in the retained tests corroborates usable authority access.
- Named unchanged-code risk: new database tests might target original databases or omit the new migration. Focused inspection of `scripts/smoke-source-truth.ts:9`, `:12`, `:13`, `:15`, `:19` and `tests/fixtures/creation-database.ts:3`, `:4`, `:5`, `:6` confirms guarded loopback configuration, generated `creation_fixture_` UUID names, full migration execution when no cutoff is passed, runtime-role transactions, and cleanup of only the generated database. Only source was inspected; no private environment file or PRD was read, copied, printed, or hashed.
- Read retained `logs/task-1-final-db-parity.log`: 10 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo; no warnings or unexpected noise. Final lint logs hash to the empty-file SHA-256, consistent with a clean reported lint run. All 16 retained Task1 log hashes match the complete implementer report, including RED and intermediate failed output.
- Final database log SHA-256 `c324cde6ee36920c90d4ff0bf680a4c072d781de0b00e82791c6389205d96970`. Primary RED SHA-256 `cc75a849b60d28a3841c0c6dd8951d7f37d64e18ccda76dde5e922b2e751c97c`; Unicode RED `4967dd2cf32ebb124b1f50cb31f38c429deff70839d6538ebbff9792d09b9cdc`; parity RED `53094749e63361bae36b153badaac3a7e7238934cd86a494d5e01a755e0f5c28`.
- No test was rerun: reading the diff and retained results left no concrete unresolved behavioral doubt requiring a focused probe. No source, index, HEAD, or branch mutation, database creation, subagent, provider/network operation, or scratch cleanup occurred during this review. This report is the only review deliverable written.

### Assessment

**Task quality:** Approved.

**Reasoning:** The SQL exposes a bounded, authorized, redacted registry with enforced immutable identity, atomic history, locked CAS, permanent blocked readiness, and faithful replay/revocation behavior. The retained real-database tests and meaningful RED evidence support the task-scoped implementation; the explicitly listed broader integration and restart items remain unverified by this review.

**Finding counts:** Critical 0; Important 0; Minor 0.
