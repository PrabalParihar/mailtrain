# Integration registry checkpoint

Qualified product code8f686578cd6fce2488bac4423f65f89feecc32c8; predecessor closedBrevoe9e9fe19ce79486afdf20f3a80cb4dc7292aa9d2. Durable SQL account bindings/private credential-reference history plus strict redacted unmounted wrappers; current browser Owner/Admin authority, cross-tenant refusal, immutable replay/CAS rotation/revocation and append-only atomic events. Opaque references are not resolved and every connection remains unverified or revoked with can_export=false/verified_atNULL. No provider/OAuth/account/client/native/link/send/billing success. Full65 BaselineA/all13GA/zero whole accepted;43Partial/17Requiredpending/5Roadmap. REQ040/REQ036 stay incomplete.

Root exactcandidate760/760configuredtests/zero skips; type/API122/build and four actual HTTP/Chromium destination journeys pass, including repeated clicks, current authority, frozen-history ABA fences, interruption, retry, navigation, integrity and390px. Original native lint exit0 had142generated-scratch-bundle warnings; precise correction retains the byte-identical bundle outside source then removes only its scratchcopy and reruns lint clean. Worker fullsuite758/760 withtwo existing native/browser skips remains distinguished. Actual isolatedPG17 abruptcrash/restart preserves committed history and rolls back pendingrotation; fixture uses ordinary uniquelyowned bridge with explicitloopbackonlyport, outboundnotdisabled, providerfetchtrap. This does not accept productionrestore/scale/network gates. Three harness failures and whole-review evidence-order finding preserved. Linuxbuildstage tests19domain cases/sourceSQLhash underUID1001/networknone; runtime existing4destinationcontracts/assets/privateabsence pass and productionstartup correctlyrefuses1. Registry modules remain unmounted and are not represented as a productionworker entrypoint.

Whole review0Critical/1Important/0Minor identified proof-manifest-before-finally bug; ONEcompletecorrection and ONEscopedreview recorded below. Canonical delivery and fresh canonical qualification status are explicitly given in final delivery evidence; no remote push/deployment/new spend.

## Task1 complete report including type correction — complete retained text

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


## Integration-discovered fixture type correction

Corrective status: DONE. Correction commit `5d19e165ce723ade14b8b73dd5edda3bad43f866` (`Widen integration registry fixture UUID types for adversarial tests`) owns **only** `tests/integration-registry-db.test.ts` (one line changed); no SQL, Task2, root, or other tracked files changed by this delta.

Root's Task2 integration typecheck discovered errors at test lines160–173. Node crypto randomUUID() returns a template-literal UUID type, inferred into Binding, while deliberate malformed/generated-uppercase test values have plain string types. Reproduced the failure before fixing: `npm run typecheck` exited 2, with nine TS2322/TS2345 diagnostics in this owned test. Full output retained in `task-1-correction-typecheck-red.log`.

The correction widens only fixture `id` and `credential` inference using erased `as string` annotations on randomUUID(). Registration/rotation/refusal assertions, UUID sentinels, test data generation, SQL, and runtime behavior remain unchanged.

Commands executed in `/tmp/lettercape-integration-registry-native`:

| Command | Outcome |
|---|---|
| `npm run typecheck > .superpowers/sdd/integration-registry/logs/task-1-correction-typecheck-red.log 2>&1` | exit2; reproduced nine fixture compilation errors before correction |
| `sed -n '5,17p' tests/integration-registry-db.test.ts`, `git status --short`, `cat` of RED log | exit0; narrowed issue to fixture inference |
| Python replacement adding `as string` to fixture id/credential only | exit0; erased type-only delta |
| `git diff --check -- tests/integration-registry-db.test.ts`, `git diff -- tests/integration-registry-db.test.ts` | exit0; exact one-line type-only correction |
| `npm run typecheck > .superpowers/sdd/integration-registry/logs/task-1-correction-typecheck-green.log 2>&1` | exit0; complete tsc --noEmit, no diagnostics |
| `npx eslint tests/integration-registry-db.test.ts > .superpowers/sdd/integration-registry/logs/task-1-correction-lint.log 2>&1` | exit0; no findings |
| `node --input-type=module` comparison script below, output to `task-1-correction-runtime-equivalence.log` | exit0; identical transpiled JavaScript confirmed |
| `git add -- tests/integration-registry-db.test.ts`, `git diff --cached --check -- tests/integration-registry-db.test.ts` | exit0; scoped staging/check |
| `git commit -m 'Widen integration registry fixture UUID types for adversarial tests' -- tests/integration-registry-db.test.ts` | exit0; exact single owned test file |
| `git show --format=fuller --stat HEAD` | exit0; commit `5d19e165ce723ade14b8b73dd5edda3bad43f866`, one file/one insertion/one deletion |

Exact runtime-equivalence script:

```js
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const file='tests/integration-registry-db.test.ts';
const prior=execFileSync('git',['show','c55ba43:'+file],{encoding:'utf8'});
const current=readFileSync(file,'utf8');
const options={loader:'ts',format:'esm',target:'esnext',sourcemap:false};
const before=transformSync(prior,options).code,after=transformSync(current,options).code;
assert.equal(after,before);
console.log('Type annotation correction produces identical JavaScript; runtime assertions unchanged.');
console.log('Identical transpiled JavaScript SHA-256: '+createHash('sha256').update(after).digest('hex'));
```

Identical JavaScript SHA-256: `660f420f51b4377ec28ce68d01faae2a41fecf69e746a4a6573a5b86f8489318`.
Current corrected owned test source SHA-256: `e822db32f033be1c24ab10153a2edeb67dede8e6edf9635e6e4b49c4bba9320a`.
SQL source unchanged from previous committed/hash-reviewed state.

Per root's explicit corrective task, no database repeat was needed for erased type annotations. Prior 10/10 actual database evidence remains the runtime coverage; JavaScript equivalence proves that this delta does not alter that coverage. Complete typecheck passed against current shared integration workspace; scoped lint passed. No new blocker or remaining compilation error observed. Prior accepted lock/Unicode/native-cast/durability limitations remain documented above.

Corrective log hashes (all logs retained, none overwritten):

| Log | SHA-256 |
|---|---|
| `task-1-correction-lint.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `task-1-correction-runtime-equivalence.log` | `8af3ce10c3fac848e49a96986bf97a76e0b8198a3cbc998f73da23982581157d` |
| `task-1-correction-typecheck-green.log` | `e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6` |
| `task-1-correction-typecheck-red.log` | `d102d5d8adf59cc5fcb647be0b8d4c851cf04d5ded6985aab1452905fad8017d` |

## Task1 binding brief — complete retained text

# Task1 requirements

 Durable SQL and database behavior
Own db/035-integration-registry.sql and tests/integration-registry-db.test.ts only. Read spec for exact SQL interfaces/schema/authority/transitions/outputs. Existing tests/fixtures/creation-database.ts and scripts/smoke-source-truth.ts build owned isolated DBs; no original DB mutation. No product TS/UI/package/docs edits. Report .superpowers/sdd/integration-registry/task-1-report.md.
- [ ] Write meaningful behavioral RED using a temporary executable permissive schema, retain failed output and remove only scaffold; do not settle for undefined import/function failures.
- [ ] Implement migration/functions/RLS/history and all exact semantics from spec.
- [ ] Run owned node --import tsx --test tests/integration-registry-db.test.ts (escalated loopback), scoped lint/diff; meaningful privilege/concurrency/revocation/rollback/restart/redaction assertions.
- [ ] Self-review SQL lock order/NULL checks/grants/triggers/output, commit exact2files and full report with commands/status/log hashes/failures/limitations. No subagents.


## Binding design

# Unverified integration connection registry design

Architectural prerequisite for PRD REQ-040 and model311, before durable export admission. Full65 BaselineA/all13 GA gates/zero whole accepted remain. Purpose: preserve provider/account identity, credential-reference versions and revocation across process loss without treating a database record as qualified provider access. No OAuth flow, credential resolver, provider call, sending, public route, worker or paid resource is mounted.

## Alternatives and selected boundary
A memory-only record loses rotation history; mounting export admission now would invent readiness evidence. Selected: forced-RLS Postgres binding and append-only lifecycle history, strict redacted server wrappers. These are usable within trusted tenant transactions and durable across connections; future OAuth/KMS qualification and export attempt ledger consume their identity. This slice does not complete REQ-040 or REQ-036.

## Authority and secret boundary
Only an active Owner/Admin browser tenant in an active workspace may register/read/rotate/revoke. Derive current identity from existing app.workspace_id/app.user_id, never caller role flags. Reject api-key actors: no integrations scope or OAuth delegation contract exists. Lock workspace then current membership then connection, recheck after waits. Runtime has no direct table reads/writes; worker/scheduler/PUBLIC cannot execute service mutations or read secrets. Definer owner mailcraft_integration_admin is NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE, no runtime membership. Search path pg_catalog,public; schema-qualified references; fixed functions only.
Credentials are opaque strict UUID references to future approved private storage; this is not evidence the reference resolves or a grant exists. Never accept/store token/password/key bytes. External account ID is private server metadata. Public return shapes omit external account ID, credential reference, actor and history. No provider response body is stored.

## Schema and transitions
Create db/035-integration-registry.sql. Tables integration_connections and integration_connection_history use workspace-scoped composite identity/FK, ENABLE/FORCE RLS. Connection identity provider/external_account_id/auth_mode/region/created_by/created_at stays immutable. Provider enum klaviyo,mailchimp,hubspot,brevo,omnisend; mode oauth/api_key is declared metadata only, no approved auth mode. Account nonblank well-formed text at most255 characters; region nonblank at most48; reject controls. Credential reference UUID; credential_version starts1, record_version starts1. State only unverified/revoked; can_export=false constrained, verified_at=NULL constrained; revoked_at present iff revoked. All timestamps derive database clock. No ready transition exists.
History is append-only with unique(workspace_id,connection_id,record_version); event registered/rotated/revoked, captured credential reference/version, actor/time. No UPDATE/DELETE, immutable trigger. Each committed connection state has corresponding history; rollback preserves both. Service-only direct mutation privileges, protected identity fields; no cascading deletion of historical records.
Register same ID+exact original binding+initial credential reference replays current redacted metadata without another event, including after rotation/revocation. A conflicting ID fails CONNECTION_BINDING_CONFLICT. A duplicate active same(workspace,provider,external_account_id) under another ID fails CONNECTION_ACCOUNT_CONFLICT; after revocation an explicitly new ID may register unverified. Concurrent duplicate registration yields one connection/history.
Rotate requires expected record_version positive integer, fresh UUID credential reference not used previously, unverified state. Lock/CAS yields CONNECTION_VERSION_CONFLICT for stale writes; revoked refuses CONNECTION_REVOKED; reused reference refuses CONNECTION_CREDENTIAL_REUSED. Successful rotation increments both credential_version/record_version and appends history atomically. No identity remap permitted.
Revoke is idempotent after current authorization and identity lookup; first invocation increments record_version only, timestamps revoke and appends event. No credential rotation/reactivation/delete permitted after revoke. Read is bounded single identity, current manager-only. Missing/foreign id gives CONNECTION_NOT_FOUND with no existence leakage; unauthorized actor gives CONNECTION_PERMISSION_DENIED. UUID null or invalid arguments fail CONNECTION_INPUT_INVALID without writes. Error messages contain fixed codes, never inputs.

## Exact SQL interface and redacted output
mailcraft_register_integration(w uuid,id uuid,provider text,account text,mode text,region text,credential uuid) RETURNS jsonb.
mailcraft_read_integration(w uuid,id uuid) RETURNS jsonb.
mailcraft_rotate_integration(w uuid,id uuid,expected integer,credential uuid) RETURNS jsonb.
mailcraft_revoke_integration(w uuid,id uuid) RETURNS jsonb.
Output exact keys: id,provider,auth_mode,region,state,record_version,credential_version,created_at,updated_at,revoked_at,can_export,blockers. IDs UUID; timestamps RFC3339 offset accepted. revoked_at nullable. can_export literalfalse. blockers exactordered [CONNECTION_AUTH_MODE_UNAPPROVED,ACCOUNT_ENTITLEMENT_UNVERIFIED,REAL_CLIENT_PREFLIGHT_UNAVAILABLE,DESTINATION_CONFORMANCE_UNVERIFIED,DURABLE_REMOTE_EXPORT_UNAVAILABLE,MANAGEMENT_LINK_UNVERIFIED], with CONNECTION_REVOKED prepended only for revoked. No readiness success inference. SQL public output construction private helper not directly granted.

## Server interface and qualification
Task2 src/domain/integration-registry.ts strict zod schemas: IntegrationProvider, IntegrationRegistration, IntegrationRotation, IntegrationConnection; browser-safe no node imports. Inputs include id/provider/external_account_id/auth_mode/region/credential_reference; rotation includes expected_record_version/credential_reference. All UUIDs strict z.uuid; reject controls, unpaired surrogate, whitespace-only account/region; no trimming/case folding of account identity. Versions positive safe integers <=2147483647. Input/output unknown fields refused. State/versions/timestamp/revocation and exact blockers relationship enforced; can_exportfalse.
Task2 src/server/integration-registry.ts exports registerIntegration(tx:Tx,workspace:string,input), readIntegration(tx,workspace,id), rotateIntegration(tx,workspace,id,input), revokeIntegration(tx,workspace,id). Validate all inputs before SQL; fixed parameterized functions only; returned rows strictly parsed. No env loading/DB singleton/provider import/credential lookup, no Principal role trust. SQL authority owns current identity. Errors propagate only existing fixed DB error codes; no wrapping raw payloads. These wrappers are unmounted.
Actual isolated generated loopback databases only: forced RLS/privilege denial/foreign workspace and actor fences, browser Owner/Admin success and Viewer/Editor/Billing/api denial, current membership/workspace revocation, immutable history/binding, concurrency/CAS/replay/rotation/revocation/restart/transaction rollback, credential redaction, permanently false readiness, zero operations/outbox/usage/provider IO. Meaningful RED must assert behavior against a permissive executable temporary fixture or existing SQL, not merely missing imports/functions. Root integration uses actual wrappers against the durable SQL. Full configured suite/type/lint/API122/build, Linux packaged-source/no-ready/startup refusal and ONE whole review before canonical sync. No new UI: previously verified editor journeys remain valid; broad canonical browser regressions accompany delivery.

## Global Constraints
Full65 BaselineA/all13 GA gates/zero whole accepted. No OAuth/provider/credential resolver/send/public route/worker activation/spend/push/deploy. No private env/PRD copy/read/hash; normal trusted test-config loading existing guarded fixture permitted. Only owned generated loopback DBs, preserve original109/221. Strict schemas and fixed SQL; can_export=false/verified_at NULL permanent. Complete reports/failures/rulings retained before only own scratch cleanup.

Report exactly /tmp/lettercape-integration-registry-native/.superpowers/sdd/integration-registry/task-1-report.md; full report with exact commits, all commands/results/log hashes, RED/scaffold/failures, self-review, limitations. Return only DONE/DONE_WITH_CONCERNS/etc, commit and summary. No subagents.

Root clarification after self-review, before taskreview: SQL private UUID guard matches installed z.uuid() versions1–8+RFCvariant8/9/a/b plus nil/max, case-insensitive; native badsyntax22P02 stillpreentry. Add meaningful invalidbitpatterns RED/GREEN parity. Timestamps created<=updated, unverified record_version=credential_version, revoked record_version=credential_version+1 and revoked_at=updated_at; guard clockstep updates via greatest(clock_timestamp(),previous updated_at). Read workspace lock currentlyUPDATE like mutations; costbrief per-workspace read/write serialization recorded. Spec authoritative currentfile includes clarifications; ownexact2files/report.

## Task1 original separate review — complete retained text

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

## Task1 ONE scoped type correction review — complete retained text

# Task 1 correction scoped review

Spec compliance: COMPLIANT. Quality: APPROVED. Critical 0 / Important 0 / Minor 0.

Reviewed exact immutable commit 5d19e165ce723ade14b8b73dd5edda3bad43f866 with its full one-line diff and updated full implementer report. Scope is only tests/integration-registry-db.test.ts:8. Two erased `as string` annotations widen the randomUUID fixture values so deliberately malformed UUID boundary cases typecheck; all test assertions and executable behavior are unchanged. No SQL, production wrapper, authority, migration or runtime change occurs. The retained RED typecheck has nine diagnostics; retained GREEN typecheck/scoped lint/diff exit0 and esbuild emitted-JS equality prove the precise correction. No broad re-review or test rerun was performed: the original ten actual SQL tests and original task review remain applicable. Reviewed compile integration failure only; Task2 wrappers and root full qualification remain separate gates.

## Task2 complete report — complete retained text

# Task 2 report — strict integration registry schemas and wrappers

Status: DONE. Commit: `8f686578cd6fce2488bac4423f65f89feecc32c8` (`Add strict redacted integration registry wrappers`). Exactly four owned files, 262 additions. Parent base `1bab45579c7f44e321b7f78ad0b0a8d46abfdcc9`; parent separately committed Task1 test typing correction `5d19e16` before this commit. Reviewed Task1 SQL implementation was already present (upstream `c55ba43`). No parent documentation/package/checkpoint files staged by this task.

## Implemented boundary

- Browser-safe `IntegrationProvider`, `IntegrationRegistration`, `IntegrationRotation`, `IntegrationConnection` schemas. Inputs and outputs strictly reject unknown keys. Providers, auth modes, state, tuple ordering and permanent `can_export=false` are exact.
- Unicode scalar character bounds match PostgreSQL `character_length`: account <=255, region <=48. Nonblank identity text, C0/C1 controls and lone UTF-16 surrogates rejected; exact strings preserved without trim/case folding.
- UUID strings canonicalized lowercase BEFORE pinned strict `z.uuid()` validation. Installed z.uuid accepts RFC versions1–8/variants8,9,a,b, nil/max, but its MAX literal regex rejects uppercase F; the intended case-insensitive contract therefore requires this preprocessing. Regression explicitly includes uppercase MAX, ordinary uppercase values, every RFC version/variant and invalid version/variant/syntax.
- Positive integer versions <=2147483647. Unverified requires null revoked_at and record_version=credential_version. Revoked requires nonnull revoked_at and record_version=credential_version+1.
- Strict RFC3339 timestamps with offsets and at most6 fractional digits. Source strings retained; fractionless epoch milliseconds plus padded fractional microseconds are compared as BigInt internally, never serialized. created<=updated and revoked=updated by exact instant; equivalent offsets accepted, one-microsecond contradictions refused.
- Four unmounted server wrappers use only fixed schema-qualified parameterized functions. Validate every input before any SQL, check exactly one strict output and canonical requested identity, exact register binding metadata, rotation expected+1/unverified, revoke revoked.
- Fresh fixed errors only: eight recognized DB codes, otherwise CONNECTION_STORAGE_UNAVAILABLE; invalid input CONNECTION_INPUT_INVALID. Raw PG error/detail/cause and Zod diagnostics never attached. `Tx` imported using `import type`; no db singleton/environment/provider/credential resolver import executes through wrappers.

## RED and all observed failures

Initial meaningful RED executed real imports and methods, with both retained scaffold modules implementing permissive executable behavior. Eleven assertions failed for missing behaviors; no missing-import/missing-function errors. Scaffold source retained as `domain-red-scaffold.ts.txt` and `server-red-scaffold.ts.txt`.

After adding independently named boundary regressions, temporarily restored the retained scaffold and observed 19/19 failing assertions. This replay makes readiness=true, malformed UUID version, control, surrogate, ordered blockers, backwards microsecond timestamp and foreign returned identity individually visible. Fresh current-authority error redaction tests fail on returning raw SQL permission/not-found errors. Actual SQL authority itself was already supplied by reviewed Task1 and never intentionally weakened. Byte-identical green snapshots restored afterward; final19unit+4DB pass.

All unexpected intermediate failures are retained:

1. First green unit run: uppercase MAX UUID rejected by pinned raw z.uuid sentinel expression (10 pass/1 fail). Corrected lowercase normalization before strict parsing; all strict version/variant rules retained.
2. First DB run inside sandbox: four actual DB test cases failed `connect EPERM 127.0.0.1:55439` before generated fixture creation; unit cases passed. Approved escalation authorized ONLY the existing guarded generated-loopback test fixture; rerun passed. No automatic approval rejection occurred.
3. First whole-repository typecheck: nine UUID template-literal inference errors in separately owned Task1 adversarial SQL tests, lines160–173. Parent notified; parent correction committed5d19e16; final typecheck clean.
4. Discovery-only command tried nonexistent `vitest.config.ts` and stopped that batched read with exit1; repository actually uses Node test runner, identified from package.json. No code/test claim made from that command.
5. Optional TDD referenced `writing-good-tests.md` skill resource lookup failed; main TDD and verification skills were read successfully. Tests use actual schemas/DB; controlled fake Tx isolates strict SQL/error-boundary behavior.

## Actual database proof and limits

Four independently generated guarded loopback databases per targeted run, plus whole-suite generated fixtures; `sourceDatabase`/`withCreationDatabase` enforce owned loopback and generated creation_fixture UUID names, migrate existing repository SQL, and clean only their own databases. Trusted fixture normal env-config loading used as authorized; no private environment file contents read/copied/printed/hashed by this task.

Actual wrappers prove register/replay, conflicting binding/account denial, rotation/version conflict/reused reference denial, revoke/idempotent replay/no reactivation, replacement registration after revoke, exact account and region identity, UUID normalization/parity, transactional register/rotate/revoke rollback, duplicate concurrency and concurrent CAS. Administrative owned-fixture reads prove private credential-reference history and original account retained while runtime returned metadata omits them. Fresh runtime pool/connection reads reproduce committed revoked metadata and private history remains unchanged.

Owner register success and current Admin read/register success; Viewer/Editor/Billing deny every wrapper. API-key and unknown actor deny every wrapper. Workspace argument mismatches deny permission; authorized foreign tenant cannot see existing foreign connection (NOT_FOUND). Current membership revocation and workspace lock deny all wrappers. Three export tables remain empty. Lifecycle test wraps global fetch in an assertion trap: zero provider fetch calls. Production wrappers contain only schema imports/type-only Tx and parameterized SQL.

New-pool persistence is NOT a PostgreSQL server crash/restart proof. Root separately owns server crash/restart qualification, broader application/browser/build/API/packaged-source proof, whole review and canonical delivery. This task neither claims those proofs nor qualifies provider access. REQ-040/REQ-036 and Full65 BaselineA/all13GA/zero whole accepted remain unchanged. No public route, OAuth, credential resolution, provider send/worker activation, spend, push or deploy added.

## Fresh verification

Final targeted `09` =23/23 (19unit+4actualDB), zero skips/failures. Browser esbuild `10`, scoped lint `11`, whole repository typecheck `12`, staged diff check `13` pass. Full configured final suite `15` on immutable commit =760 total/758 pass/0fail/2existing skips. Existing skips by exact name: `native isolated decoder qualification runs all frames and denial corpus`; `actual native IndexedDB preserves full2MiB source, exact command, actor boundaries, finite slots and aborted transactions`.

## Commands and retained logs

All verification commands run from `/tmp/lettercape-integration-registry-native`; stdout/stderr redirected to the listed evidence files, then printed in full for scoped runs or tail for full-suite runs. Nonzero statuses were preserved with the shell exit status. Evidence root: `.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/`.

| Log | Command | Result | SHA-256 |
| --- | --- | --- | --- |
| `01-red.log` | `node --import tsx --test tests/integration-registry.test.ts` | 1; expected RED: 11/11 behavioral failures against executable permissive scaffold | `20c05a08b242cff726c29894e27fa3e24d6a6a0a849ab2afac9103a9588abd5f` |
| `02-unit-green.log` | `node --import tsx --test tests/integration-registry.test.ts` | 1; 10 pass, uppercase MAX sentinel fails strict installed z.uuid | `0bfed46e0d274bf204238d793144a929d2417717592ba12f64773e6ac35d66e4` |
| `03-unit-db-green.log` | `node --import tsx --test tests/integration-registry.test.ts tests/integration-registry-store-db.test.ts` | 1; 11 unit pass, all 4 DB cases fail sandbox loopback EPERM before fixture creation | `f5d35ddf8353422e6634e134ba5308dd0fb0fc43117bc8bb4738d073b8d65b89` |
| `04-unit-db-approved.log` | `node --import tsx --test tests/integration-registry.test.ts tests/integration-registry-store-db.test.ts [approved loopback escalation]` | 0; 15 pass | `b91ec103b7a905e38db88b016f2a2bc73bea85b722fb06d52f77c63a040219bc` |
| `05-typecheck.log` | `npm run typecheck` | 2; nine TS2322/TS2345 errors solely in separately owned Task1 tests/integration-registry-db.test.ts lines 160–173 | `d102d5d8adf59cc5fcb647be0b8d4c851cf04d5ded6985aab1452905fad8017d` |
| `06-lint.log` | `npx eslint src/domain/integration-registry.ts src/server/integration-registry.ts tests/integration-registry.test.ts tests/integration-registry-store-db.test.ts` | 0; clean | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `07-configured-full-suite.log` | `node --import tsx scripts/smoke-source-truth.ts --suite [approved owned generated loopback fixture]` | 0; 752 total /750 pass /0 fail /2 existing skips | `4d3957314759a1388adb37bf58334e3646d77a0cc09bea8ea01bdeb5a3016ed3` |
| `08-red-boundary-replay.log` | `restore retained permissive scaffold; node --import tsx --test tests/integration-registry.test.ts; restore byte-identical green snapshots` | 1; expected RED: 19/19 behavioral failures, including individually named required boundaries | `4a6abc3130c438a1f5a2f920f97933285aaa1455b0b1e2fc42a5fc343b51261d` |
| `09-final-unit-db.log` | `node --import tsx --test tests/integration-registry.test.ts tests/integration-registry-store-db.test.ts [approved loopback escalation]` | 0; 23 pass: 19 unit and 4 actual DB | `bc62ba93ac4d8126a5c1ff83a6ae6ceb6f283c476b1690f1a721c2ce35da0ede` |
| `10-browser-bundle.log` | `npx esbuild src/domain/integration-registry.ts --bundle --platform=browser --format=esm --outfile=.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/domain-browser-bundle.mjs` | 0; browser bundle succeeds, no Node imports | `64c2319639e88ead270002011c66b7980f8842183781bfe7d098c6779cb3815e` |
| `11-final-lint.log` | `npx eslint src/domain/integration-registry.ts src/server/integration-registry.ts tests/integration-registry.test.ts tests/integration-registry-store-db.test.ts` | 0; clean | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `12-final-typecheck.log` | `npm run typecheck` | 0; clean after parent Task1 fixture typing correction | `e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6` |
| `13-staged-diff-check.log` | `git diff --cached --check` | 0; clean exact4file staged diff | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `14-commit.log` | `git add [four owned paths]; git diff --cached --stat; git diff --cached --name-only; git commit -m 'Add strict redacted integration registry wrappers'` | 0; immutable exact4file commit 8f686578cd6fce2488bac4423f65f89feecc32c8 | `0cc4691419f7c0c83a1cd6b88e2179c02c85f31d376d879d612db9dd758d81cf` |
| `15-final-configured-full-suite.log` | `node --import tsx scripts/smoke-source-truth.ts --suite [approved owned generated loopback fixture]` | 0; final immutable commit: 760 total /758 pass /0 fail /2 existing skips | `04ffe35cbf02304ad3bff42067473d0cd7a95340ec47676b4e3b7fee69068401` |

Read-only discovery/self-review commands: `pwd`; `cat task-2-brief.md`; `git status --short`; `rg --files` with AGENTS/package/registry/fixture/tsconfig filters; `cat AGENTS.md package.json src/server/db.ts tsconfig.json eslint.config.mjs`; `sed` existing SQL test/source fixture/domain file; `rg 'type Tx|interface Tx' src/server`; `cat tests/fixtures/creation-database.ts`; `git diff --stat`; `git diff --no-index /dev/null` for both new implementation modules (expected exit1 = differences); `rg '^ℹ|^✖ boundary'` RED replay log; `rg 'integration-registry' src scripts tests --glob '*.ts' --glob '*.tsx'` confirmed no application imports; `git log -3 --oneline`; `git rev-parse HEAD`; `git show --format=fuller --stat HEAD`; `rg 'SKIP|# SKIP'` configured suite. Mutation commands: mkdir owned evidence directory, heredoc writes four owned files, Python UUID normalization, cp scaffold/snapshots for explicit RED replay/restoration, exact-four-file git add/commit, Python report and artifact/source hash generation. No subagents/review dispatch.

## Self-review

Reviewed binding brief line-by-line, strict unknown-field/state/version/blocker relationships, Unicode/PostgreSQL parity, UUID sentinel nuance, microsecond offset comparison, all four requested-identity checks, replay metadata and lifecycle assertions, error isolation, SQL literals/parameter ordering, no runtime DB import or route mounting, generated fixture cleanup and file ownership. No unresolved implementation finding identified. Two existing native/browser suite skips and root-owned crash/build/application-wide review remain explicit qualification limits, not readiness claims. Root review may identify further issues; final verification is evidence for this immutable implementation, not a substitute for that review.

## Source SHA-256

- `src/domain/integration-registry.ts`: `ecace74e5298fbbbdba47503f6a6c07a89226ee0750da92bb6b5ec2afe2cf77a`
- `src/server/integration-registry.ts`: `b9c46cc75a95e94f09f659ee394c4f6c47cc556ad07870e5bc12eb7fbb644a2b`
- `tests/integration-registry.test.ts`: `901c328b803f6dbb581f28023e755485315149528cfc6728c362e3208dbbaf32`
- `tests/integration-registry-store-db.test.ts`: `96cae9e79f4d9c72b55efe46b53c53509523c1961ef50205e0e1a04969d0886c`
- `db/035-integration-registry.sql`: `52f95a75cbe9f21dbaf4e81944e2b264a2c28a36130a208192cda9a2984cdc3e`
- `binding-brief`: `d5ec290ddd8da347ac88f1c5919fd72c865dc5e6c0d5cc00897acd7ea9529526`

`source-sha256.json` retains these hashes. `artifact-sha256.json` retains every existing evidence file hash/size including RED scaffolds, restored green snapshots, browser bundle and all command logs. Report and evidence are retained outside this exact-four-file commit for the parent to collect. No own scratch cleanup removed evidence.

## Task2 binding brief — complete retained text

### Task 2: Strict domain and redacted server wrappers
Own src/domain/integration-registry.ts,src/server/integration-registry.ts,tests/integration-registry.test.ts,tests/integration-registry-store-db.test.ts. Consume exactTask1 SQLinterfaces only after reviewed. Exports schemas/wrappers in spec; no routes/providercalls. Report .superpowers/sdd/integration-registry/task-2-report.md.
- [ ] Meaningful executable RED against permissive scaffold before strict implementation; include unknown-secretfields/readinesstrue/malformedUUID/versions/controls/surrogate/blocker/timestamp/foreign current authority.
- [ ] Implement strict zod schemas and parameterized wrappers; unit malformed inputs issue zero SQL, extra/private DBoutput rejected, errors not rendered with payloads.
- [ ] Actual owned DBwrapper register/replay/rotation/revocation/rollback/newconnectionreadback persists private history; cross-tenant/current authority denied; no operations/outbox/usage/providerIO.
- [ ] Scoped unit/DB/type/lint/diff, exact4filecommit and full report. No subagents.


## Binding current design (exact values/interfaces)

# Unverified integration connection registry design

Architectural prerequisite for PRD REQ-040 and model311, before durable export admission. Full65 BaselineA/all13 GA gates/zero whole accepted remain. Purpose: preserve provider/account identity, credential-reference versions and revocation across process loss without treating a database record as qualified provider access. No OAuth flow, credential resolver, provider call, sending, public route, worker or paid resource is mounted.

## Alternatives and selected boundary
A memory-only record loses rotation history; mounting export admission now would invent readiness evidence. Selected: forced-RLS Postgres binding and append-only lifecycle history, strict redacted server wrappers. These are usable within trusted tenant transactions and durable across connections; future OAuth/KMS qualification and export attempt ledger consume their identity. This slice does not complete REQ-040 or REQ-036.

## Authority and secret boundary
Only an active Owner/Admin browser tenant in an active workspace may register/read/rotate/revoke. Derive current identity from existing app.workspace_id/app.user_id, never caller role flags. Reject api-key actors: no integrations scope or OAuth delegation contract exists. Lock workspace then current membership then connection, recheck after waits. Runtime has no direct table reads/writes; worker/scheduler/PUBLIC cannot execute service mutations or read secrets. Definer owner mailcraft_integration_admin is NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE, no runtime membership. Search path pg_catalog,public; schema-qualified references; fixed functions only.
Credentials are opaque strict UUID references to future approved private storage; this is not evidence the reference resolves or a grant exists. Never accept/store token/password/key bytes. External account ID is private server metadata. Public return shapes omit external account ID, credential reference, actor and history. No provider response body is stored.

## Schema and transitions
Create db/035-integration-registry.sql. Tables integration_connections and integration_connection_history use workspace-scoped composite identity/FK, ENABLE/FORCE RLS. Connection identity provider/external_account_id/auth_mode/region/created_by/created_at stays immutable. Provider enum klaviyo,mailchimp,hubspot,brevo,omnisend; mode oauth/api_key is declared metadata only, no approved auth mode. Account nonblank well-formed text at most255 characters; region nonblank at most48; reject controls. Credential reference UUID; credential_version starts1, record_version starts1. State only unverified/revoked; can_export=false constrained, verified_at=NULL constrained; revoked_at present iff revoked. All timestamps derive database clock. No ready transition exists.
History is append-only with unique(workspace_id,connection_id,record_version); event registered/rotated/revoked, captured credential reference/version, actor/time. No UPDATE/DELETE, immutable trigger. Each committed connection state has corresponding history; rollback preserves both. Service-only direct mutation privileges, protected identity fields; no cascading deletion of historical records.
Register same ID+exact original binding+initial credential reference replays current redacted metadata without another event, including after rotation/revocation. A conflicting ID fails CONNECTION_BINDING_CONFLICT. A duplicate active same(workspace,provider,external_account_id) under another ID fails CONNECTION_ACCOUNT_CONFLICT; after revocation an explicitly new ID may register unverified. Concurrent duplicate registration yields one connection/history.
Rotate requires expected record_version positive integer, fresh UUID credential reference not used previously, unverified state. Lock/CAS yields CONNECTION_VERSION_CONFLICT for stale writes; revoked refuses CONNECTION_REVOKED; reused reference refuses CONNECTION_CREDENTIAL_REUSED. Successful rotation increments both credential_version/record_version and appends history atomically. No identity remap permitted.
Revoke is idempotent after current authorization and identity lookup; first invocation increments record_version only, timestamps revoke and appends event. No credential rotation/reactivation/delete permitted after revoke. Read is bounded single identity, current manager-only. Missing/foreign id gives CONNECTION_NOT_FOUND with no existence leakage; unauthorized actor gives CONNECTION_PERMISSION_DENIED. UUID null or invalid arguments fail CONNECTION_INPUT_INVALID without writes. Error messages contain fixed codes, never inputs.

## Exact SQL interface and redacted output
mailcraft_register_integration(w uuid,id uuid,provider text,account text,mode text,region text,credential uuid) RETURNS jsonb.
mailcraft_read_integration(w uuid,id uuid) RETURNS jsonb.
mailcraft_rotate_integration(w uuid,id uuid,expected integer,credential uuid) RETURNS jsonb.
mailcraft_revoke_integration(w uuid,id uuid) RETURNS jsonb.
Output exact keys: id,provider,auth_mode,region,state,record_version,credential_version,created_at,updated_at,revoked_at,can_export,blockers. IDs UUID; timestamps RFC3339 offset accepted. revoked_at nullable. can_export literalfalse. blockers exactordered [CONNECTION_AUTH_MODE_UNAPPROVED,ACCOUNT_ENTITLEMENT_UNVERIFIED,REAL_CLIENT_PREFLIGHT_UNAVAILABLE,DESTINATION_CONFORMANCE_UNVERIFIED,DURABLE_REMOTE_EXPORT_UNAVAILABLE,MANAGEMENT_LINK_UNVERIFIED], with CONNECTION_REVOKED prepended only for revoked. No readiness success inference. SQL public output construction private helper not directly granted.

## Server interface and qualification
Task2 src/domain/integration-registry.ts strict zod schemas: IntegrationProvider, IntegrationRegistration, IntegrationRotation, IntegrationConnection; browser-safe no node imports. Inputs include id/provider/external_account_id/auth_mode/region/credential_reference; rotation includes expected_record_version/credential_reference. All UUIDs strict z.uuid; reject controls, unpaired surrogate, whitespace-only account/region; no trimming/case folding of account identity. Versions positive safe integers <=2147483647. Input/output unknown fields refused. State/versions/timestamp/revocation and exact blockers relationship enforced; can_exportfalse.
Task2 src/server/integration-registry.ts exports registerIntegration(tx:Tx,workspace:string,input), readIntegration(tx,workspace,id), rotateIntegration(tx,workspace,id,input), revokeIntegration(tx,workspace,id). Validate all inputs before SQL; fixed parameterized functions only; returned rows strictly parsed. No env loading/DB singleton/provider import/credential lookup, no Principal role trust. SQL authority owns current identity. Errors propagate only existing fixed DB error codes; no wrapping raw payloads. These wrappers are unmounted.
Actual isolated generated loopback databases only: forced RLS/privilege denial/foreign workspace and actor fences, browser Owner/Admin success and Viewer/Editor/Billing/api denial, current membership/workspace revocation, immutable history/binding, concurrency/CAS/replay/rotation/revocation/restart/transaction rollback, credential redaction, permanently false readiness, zero operations/outbox/usage/provider IO. Meaningful RED must assert behavior against a permissive executable temporary fixture or existing SQL, not merely missing imports/functions. Root integration uses actual wrappers against the durable SQL. Full configured suite/type/lint/API122/build, Linux packaged-source/no-ready/startup refusal and ONE whole review before canonical sync. No new UI: previously verified editor journeys remain valid; broad canonical browser regressions accompany delivery.

## Wrapper error redaction clarification
Recognized fixed SQL errors are CONNECTION_INPUT_INVALID,CONNECTION_PERMISSION_DENIED,CONNECTION_BINDING_CONFLICT,CONNECTION_ACCOUNT_CONFLICT,CONNECTION_NOT_FOUND,CONNECTION_VERSION_CONFLICT,CONNECTION_REVOKED,CONNECTION_CREDENTIAL_REUSED. Wrappers validate via strict schemas before query; invalid input throws a fresh fixed Error(CONNECTION_INPUT_INVALID). Parse exact output; malformed/extra/private output or unexpected database error throws a fresh fixed Error(CONNECTION_STORAGE_UNAVAILABLE). Recognized SQL message maps to fresh Error of that exact fixed code. Never attach raw PGerror, detail, input, payload or cause. Domain schemas remain independently importable with safeParse. This preserves actionable codes while preventing unique-constraint/driver details from exposing private account/reference data. Include injected-query failures with secret-like marker in message/detail and verify no leakage in returned errors.

Output relationship precision: unverified implies revoked_at=null and record_version=credential_version; revoked implies revoked_at nonnull, record_version=credential_version+1 and revoked_at=updated_at as the same timestamp instant. created_at<=updated_at. Reject contradictory outputs; SQL JSON timestamps have at most6 fractional digits and may include timezone offsets; enforce that precision and compare instants with microsecond precision (Date.parse alone loses fractional microseconds). Accept equivalent valid offsets; reject a one-microsecond backwards timestamp or unequal revoke/update instant. A normalized epoch-microsecond BigInt from fractionless Date.parse plus padded fraction is sufficient; do not serialize BigInts into output. Browser-safe contract metadata contains no account/reference/actor/history.

SQL UUID parity: private helper/table/function guards must match installed z.uuid() RFC version1–8+variant8/9/a/b plus nil/max, case-insensitive. PostgreSQL uuid::text canonicalizes lowercase; reject otherwise parseable bit patterns with fixed CONNECTION_INPUT_INVALID before writes. Syntax casts may22P02 before typedfunction. Include allversion/uppercase/nil/max/malformedversion+variant conformance.

Wrapper identity: canonicalize validated UUIDs lowercase; check returned id matches requested canonical id on all functions. Register returned provider/auth_mode/region must equal exact input (including replay). Rotate return unverified with record_version=expected+1; revoke return revoked. Refuse otherwise valid but contradictory rows as CONNECTION_STORAGE_UNAVAILABLE. No provider/account string folding.

Timestamp guard: updates use greatest(clock_timestamp(),previous updated_at); revoked_at shares the same chosen instant. This preserves per-connection monotonic history during a backwards host-clock step; no caller time admitted.

## Global Constraints
Full65 BaselineA/all13 GA gates/zero whole accepted. No OAuth/provider/credential resolver/send/public route/worker activation/spend/push/deploy. No private env/PRD copy/read/hash; normal trusted test-config loading existing guarded fixture permitted. Only owned generated loopback DBs, preserve original109/221. Strict schemas and fixed SQL; can_export=false/verified_at NULL permanent. Complete reports/failures/rulings retained before only own scratch cleanup.


Complete report exactly /tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-report.md. No subagents. All commands/log hashes/RED/scaffold/failures/actualDB evidence/concerns/commit/source hashes must be retained. Return concise DONE/DONE_WITH_CONCERNS, commits and test summary. Never stage root docs/otherfiles.

## Task2 separate review — complete retained text

### Spec Compliance

- ✅ COMPLIANT for Task2. The immutable artifact contains exactly the four owned files: `src/domain/integration-registry.ts`, `src/server/integration-registry.ts`, `tests/integration-registry.test.ts`, and `tests/integration-registry-store-db.test.ts`. No missing, extra, or misunderstood Task2 behavior was found.
- Required domain schemas are exported and independently parseable: `src/domain/integration-registry.ts:3`, `:9`, `:13`, `:29`. Their module imports only Zod at `:1`; no Node, environment, database, provider, or credential-resolver import appears.
- Inputs/outputs reject unknown fields, states and auth modes are enumerated, UUIDs normalize lowercase before pinned strict parsing, and versions are positive bounded integers: `src/domain/integration-registry.ts:4`, `:5`, `:8`, `:12`, `:13`, `:30`, `:31`. Unicode scalar bounds, controls, whitespace-only text and unpaired surrogates are checked while exact account/region text is preserved at `:7`. This follows the parent's accepted character-count and uppercase-MAX clarification.
- Permanent false readiness and exact ordered blockers are encoded structurally at `src/domain/integration-registry.ts:22`, `:27`, `:30`, `:31`. Unverified/revoked version and timestamp relationships are checked at `:33`, `:35`, `:36`, `:37`.
- Timestamps retain their source representation, enforce at most six fractional digits, and compare normalized offset instants at microsecond precision without serializing BigInt: `src/domain/integration-registry.ts:16`, `:17`, `:18`, `:20`, `:36`, `:37`. Equivalent offsets and one-microsecond contradictions receive explicit unit coverage in `tests/integration-registry.test.ts:56`.
- All four wrappers validate workspace, connection identity and relevant input before SQL; SQL consists of fixed schema-qualified parameterized function calls: `src/server/integration-registry.ts:26`, `:27`, `:28`, `:32`, `:33`, `:34`, `:36`, `:37`, `:38`, `:42`, `:43`, `:44`. `Tx` is imported as a type at `:2`; SQL owns current actor authority rather than a supplied Principal role.
- Storage output must contain one strict connection value with the requested canonical id. Registration checks exact provider/auth_mode/region, rotation checks unverified and expected+1, and revoke checks revoked: `src/server/integration-registry.ts:20`, `:21`, `:22`, `:29`, `:39`, `:45`.
- Invalid input and database failures produce fresh fixed errors with no raw payload/detail/cause attached: `src/server/integration-registry.ts:6`, `:11`, `:13`, `:19`, `:20`, `:22`. Secret-bearing injected PG errors and otherwise valid foreign identities are tested in `tests/integration-registry.test.ts:85` and `:105`.
- Real wrapper/SQL integration covers durable private history, replay, rotation, revoke, replacement after revoke, rollback, concurrent replay/CAS, fresh-pool reads, tenant/current-actor fences, and empty operations/outbox/usage tables: `tests/integration-registry-store-db.test.ts:16`, `:28`, `:31`, `:33`, `:37`, `:47`, `:63`. A provider fetch trap is installed/restored at `:17`, `:34`, with zero calls asserted at `:33`.
- Meaningful executable RED evidence is present. Retained scaffold modules export working permissive schemas and wrapper functions; the initial log contains 11 behavioral assertion failures, and replay contains 19, including independently named readiness, UUID, controls, surrogate, blocker, microsecond and foreign-output boundaries. These are not missing-import/function failures. The corresponding final regression tests appear at `tests/integration-registry.test.ts:92` and `:105`.
- ⚠️ Cannot verify from the Task2 artifact: application-wide route mounting/import state, preservation of original database counts 109/221, all Full65/BaselineA/all13 GA gates, API122/build/Linux packaged-source/no-ready/startup checks, canonical browser journeys, the separate whole review, or delivery/canonical synchronization. The package adds no route/provider/worker/OAuth/credential-resolver code; broader absence and delivery claims require the controller's separate evidence.
- ⚠️ Database crash/process-restart qualification is not established by this task. `tests/integration-registry-store-db.test.ts:31` uses a fresh runtime pool, proving persisted state across connections. The report correctly distinguishes this from PostgreSQL crash/restart evidence.
- ⚠️ The retained full suite reports two skips: native isolated decoder qualification and native IndexedDB qualification. Their preexisting status is reported by the implementer but not independently established by this Task2 diff. This review does not convert those skips or metadata registration into qualified provider access or export readiness.

### Strengths

- The domain contract uses discriminated strict states and literal blocker tuples, making private fields, true readiness, reordered blockers, and contradictory lifecycle metadata fail closed: `src/domain/integration-registry.ts:22`, `:29`, `:33`; `tests/integration-registry.test.ts:22`, `:49`.
- Shared invocation logic centralizes row validation, identity matching and error redaction without admitting dynamic function selection: `src/server/integration-registry.ts:16`, `:19`, `:22`, `:28`, `:34`, `:38`, `:44`.
- Microsecond chronology is implemented without lossy fractional Date.parse comparisons, and guards avoid comparing dirty timestamp values: `src/domain/integration-registry.ts:20`, `:34`, `:35`, `:37`.
- Unit fixtures isolate the SQL/output/error boundary, while actual PostgreSQL tests establish the behavior of the real wrappers with tenant transactions and durable private history: `tests/integration-registry.test.ts:12`, `:65`, `:77`, `:85`; `tests/integration-registry-store-db.test.ts:16`, `:37`, `:47`.
- Failure evidence is retained and explained, including uppercase MAX normalization, initial sandbox loopback EPERM, and the separately corrected Task1 annotation issue. Final scoped evidence has no skips, failures, warnings or unexpected noise; source and report do not imply provider qualification.

### Issues

#### Critical (Must Fix)

- None found.

#### Important (Should Fix)

- None found.

#### Minor (Nice to Have)

- None found.

### Focused Checks and Evidence

- Artifact SHA-256 verified: `1ef1eb0f0a1c3042a5149822737773491e22e64f9af08f2ffac097a067619cf0`. Complete Task2 report SHA-256: `480bfe67d23bcf70b27d2c3c705752f6d1ecbf7c03ea98b6c3ea806a19aea8a5`. Requested boundary: BASE `5d19e165ce723ade14b8b73dd5edda3bad43f866` to HEAD `8f686578cd6fce2488bac4423f65f89feecc32c8`; artifact identifies that HEAD and its exact four-file/262-addition scope. No git command was used to derive another view.
- Read the Task2 brief, complete report, current authoritative design and immutable diff once. The diff was fully visible with no truncated hunk, so neither it nor any changed source file was reread. The previously supplied local task-reviewer prompt remains the governing review method. Task1 SQL and its annotation correction were not reviewed again.
- Named cross-task risk: the type-only Tx import must match the repository's transaction interface while avoiding runtime database/environment loading. One focused unchanged-code query found `src/server/db.ts:7` defines `Tx = pg.PoolClient`, matching the wrapper/test use. The `import type` declaration at `src/server/integration-registry.ts:2` is erased at runtime. No new unchanged SQL or fixture inspection was needed; actual wrapper integration evidence covers the reviewed SQL contract.
- Verified all 15 retained log hashes against the report. Evidence directory: `.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/`. Read final scoped output in full: `09-final-unit-db.log` reports 23/23 pass, 0 fail/cancelled/skipped/todo. SHA-256 `bc62ba93ac4d8126a5c1ff83a6ae6ceb6f283c476b1690f1a721c2ce35da0ede`.
- Final browser-bundle evidence succeeds; its routine bundle size/Done output is not a warning. Final lint and staged-diff-check logs are empty (SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`). Final typecheck contains only the npm/tsc invocation and no diagnostics, SHA-256 `e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6`.
- Read final configured-suite summary/skip records: 760 total, 758 pass, 0 fail, 2 skips. SHA-256 `04ffe35cbf02304ad3bff42067473d0cd7a95340ec47676b4e3b7fee69068401`. Skips are at retained log lines 443 and 690; summary lines 766–771. No Warning/warning match appeared in the inspected final-suite log search.
- Retained initial RED SHA-256 `20c05a08b242cff726c29894e27fa3e24d6a6a0a849ab2afac9103a9588abd5f`; expanded RED replay `4a6abc3130c438a1f5a2f920f97933285aaa1455b0b1e2fc42a5fc343b51261d`. Read executable scaffold source and failure records. A combined failure-log search display was truncated; independently named failures, assertion errors and totals were visible, and no suite was rerun to replace retained evidence.
- Concrete focused doubt: JavaScript end anchors can admit a terminal line separator, so pinned Zod plus the timestamp refinement might allow malformed UUID or timestamp strings. Ran one read-only, no-database Node probe importing the domain schemas with `node --import tsx --input-type=module`; checked appended LF, CR, CRLF and U+2028 independently on registration id and connection updated_at. All eight cases returned `success:false`, resolving the doubt. Exact probe output:

```json
{"suffix":"\n","uuidAccepted":false,"timestampAccepted":false}
{"suffix":"\r","uuidAccepted":false,"timestampAccepted":false}
{"suffix":"\r\n","uuidAccepted":false,"timestampAccepted":false}
{"suffix":"\u2028","uuidAccepted":false,"timestampAccepted":false}
```

- No broad/scoped suite was repeated. No source/index/HEAD/branch/database mutation, provider/network call, private environment/PRD read/copy/hash, subagent or scratch cleanup occurred. This requested report is the only written review deliverable.

### Assessment

**Task quality:** Approved.

**Reasoning:** The implementation preserves the reviewed SQL authority boundary while adding strict browser-safe input/output contracts, exact microsecond lifecycle validation, canonical identity checks and fresh fixed errors. Retained executable RED and final unit/actual-database evidence substantiate Task2 behavior, with the broader qualification and restart limits kept explicit.

**Finding counts:** Critical 0; Important 0; Minor 0.

## ONEwhole review original findings — complete retained text

# Integration registry — ONE immutable whole-plan review

Verdict: ISSUES FOUND in qualification evidence. Critical: 0. Important: 1. Minor: 0. No concrete production SQL, domain-schema or store-wrapper defect found. The single evidence finding below needs the authorized complete correction and scoped re-review before canonical qualification is declared complete. This is a new integration-registry review, not a reopened Brevo review.

## Immutable boundary and method

BASE `e9e9fe19ce79486afdf20f3a80cb4dc7292aa9d2`; HEAD `8f686578cd6fce2488bac4423f65f89feecc32c8`; checkout `/tmp/lettercape-integration-registry-native`. Supplied review artifact `/tmp/lettercape-integration-registry-whole.diff` is exactly 169,910 bytes, SHA256 `da008a7931a65d10408b61154841b63cde461738b508e36192aa4c0e14560c9e`. Its commit metadata identifies the specified candidate and its 11-file scope. The supplied artifact was the implementation review source; no Git-derived alternate diff or separate reread of changed implementation/test files was used. This report does not claim an independent Git HEAD/live-byte comparison.

Read AGENTS.md, authoritative design/plan, complete current progress ledger and rulings, full Task1 and Task2 reports, original Task1 review, its ONE erased-annotation correction review, Task2 review, all changed implementation/test hunks and added checkpoint/documentation content. Read root native/crash/Linux proof manifests and supporting logs, including all three retained crash-harness failure explanations. Later supplied harness provenance was checked narrowly to locate I1. Earlier task verdicts were treated as evidence, not as binding whole-plan conclusions.

## Findings

### I1 — Important: crash-proof hashes are captured before the successful container log replaces the previous run's file

Location: `/tmp/lettercape-integration-registry-crash-qualify.py:42`, with the later overwrite at `:46`; observable incorrect receipt at `/tmp/lettercape-integration-registry-crash-proof.json:34`.

The harness builds `proof['logs']` inside the try block before its finally block captures `docker logs` from the current successful container. The finally block then overwrites `postgres-container.log`, so the saved manifest contains the previous run's byte count and hash while its path now points to different bytes. On a first run without a prior file, that same ordering would omit the current container log entirely.

Concrete verified evidence:

| Evidence | Bytes | SHA256 |
| --- | ---: | --- |
| Manifest's claimed postgres-container.log | 4979 | `49eb4b5abf6f81e28e77eadc53f0f4e363a1cf141f211bb1963fa31097a7792a` |
| Actual current successful-run postgres-container.log | 4992 | `90bd9b5aa3fc4407b67bfa61d655a11702f4aa62f209c884f961a206554bd3a7` |
| Retained failed-after-actual-crash/postgres-container.log | 4979 | `49eb4b5abf6f81e28e77eadc53f0f4e363a1cf141f211bb1963fa31097a7792a` |

The stale manifest entry matches the retained failed run exactly. Root supplied this provenance and the read-only comparison independently confirmed it. Current seed/pending/verify/migration logs match their manifest hashes; the current container log visibly corroborates interruption and automatic WAL recovery. Thus this finding is an evidence-order and traceability defect, not evidence that SQL durability failed. Nevertheless, the claimed immutable successful-run proof does not verify against its retained artifacts and must not be reported as fully hash-verified or copied into canonical acceptance unchanged.

Remediation: preserve the original manifest, both run logs and failure provenance; correct the harness to finalize the log manifest only after final log capture and ownership-checked cleanup, including the current container log. Recompute the corrected evidence receipt from the already retained successful-run bytes, retain a clear correction/provenance record, and verify every referenced byte count/hash. No PostgreSQL crash rerun, product SQL change or broad suite rerun is needed to resolve this evidence-order defect. A scoped review should check the ordering change, retained old receipt, exact successful-run references and complete corrected hash verification.

Critical: none. Other Important findings: none. Minor: none.

## SQL/store whole-plan assessment

`db/035-integration-registry.sql:26-67` creates private composite workspace identity and noncascading history, forces RLS on both tables, constrains readiness to false/verified_at NULL, limits states to unverified/revoked and enforces version/revocation/timestamp relationships. Runtime has no private-table access; the service owner is restricted and not a runtime role membership. Only the four fixed SECURITY DEFINER interfaces are granted; helper/trigger execution remains private. Fixed search paths and schema-qualified relations/helpers avoid dynamic input-selected SQL.

`db/035-integration-registry.sql:69-89` derives actor/workspace from the trusted tenant transaction, rejects API-key actors and requires current active Owner/Admin membership and an active workspace. Workspace UPDATE, membership SHARE and connection UPDATE locks follow the approved order; authority rows remain held and are reread after waits. The accepted read-helper serialization cost remains explicit. This is a trusted tenant-transaction boundary, not a standalone browser-session/OAuth authenticator or public route.

The cross-task unchanged-code risk was whether the service owner can see authority rows under existing RLS and whether its lock order conflicts with membership lifecycle. Focused inspection of `db/001-foundations.sql:18-25` and `db/022-membership-lifecycle.sql:45-51` confirms tenant-context visibility and workspace-first membership changes. Focused inspection of `src/server/db.ts:7-23` confirms the PoolClient Tx contract and transaction-local app identity, with commit/rollback ownership outside the wrappers. The wrappers' type-only Tx import does not execute the database module or its environment loader.

Register replay locks the connection, checks exact immutable provider/account/mode/region and the original registered reference, and returns current metadata without another event even after rotation/revocation. Another active ID for the same tenant/provider/account is refused; an explicitly new ID after revocation remains unverified. Workspace serialization plus the active-account unique index prevent duplicate admission. Rotate performs locked expected-version/state/reference-history checks before incrementing both versions; revoke is idempotent only after current authorization and identity lookup, increments record version alone and never reactivates. Public maximum-version guards prevent arithmetic overflow. Triggers protect identity, enforce transitions and capture history in the same transaction, so failed mutations/rollback preserve both state and history.

The code at `db/035-integration-registry.sql:123-139` chooses monotonic database timestamps and shares the revoke/update instant. SQL UUID predicates match the pinned strict versions1–8/variants8–b plus nil/max. Native syntax casts can still fail before typed SQL entry; strict wrappers reject those inputs before SQL and sanitize unexpected driver errors. Unicode account/region validation preserves exact strings and aligns with the final scalar-count ruling; the older worker report's proposed UTF16 subset is superseded, not the final contract.

`src/domain/integration-registry.ts:3-39` provides browser-safe strict inputs and discriminated outputs. UUID normalization precedes pinned strict parsing, including uppercase MAX; account and region use Unicode scalar limits, reject controls/unpaired surrogates/blank text and preserve identity. Version bounds match SQL integer range. Exact state/blocker/version/revocation relationships reject contradictory rows; timestamp comparison preserves offset-equivalent instants and microseconds instead of truncating them through Date.parse fractions. BigInts remain internal.

`src/server/integration-registry.ts:11-47` validates all input before issuing one of four fixed parameterized functions; it requires exactly one strict returned value with the requested canonical ID. Registration also checks provider/mode/region, rotation checks unverified/expected+1, and revoke checks revoked. Eight recognized fixed errors are recreated without original detail/cause; invalid input and unexpected storage/output use fresh fixed codes. The adapter never returns private account IDs, credential references, actors or history. No credential resolver, provider operation, public route, OAuth flow or export worker is mounted by the artifact.

The real SQL and real wrapper tests cover registration/replay/rotation/revoke/history, account/binding conflicts, rollback, duplicate admission, CAS, current authority, foreign tenant identity, private grants/RLS, exact strings and UUID conformance. Actual lock-wait tests observe pg_blocking_pids and show revocation before admission refuses while authority admitted earlier remains held through commit. These assertions support the whole integration boundary rather than relying solely on fake query objects.

## Native, browser, crash and Linux evidence

All nine native manifest log hashes match. Root's exact-candidate full suite records 760 tests / 760 pass / 0 fail / 0 cancelled / 0 skipped / 0 todo. Typecheck/build/API122 pass according to saved outputs and exit receipts. This supersedes the worker's earlier 758/760 with two explicitly retained skips; the worker report was not silently relabeled as fully configured success.

Native lint exited 0 but is NOT warning-free: the retained log reports 0 errors and 142 warnings, all in `.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/domain-browser-bundle.mjs`. This is generated scratch evidence outside the reviewed production patch, not a new product-code finding. A byte-identical retained copy exists at `/tmp/lettercape-integration-registry-task-logs/task-2-evidence/domain-browser-bundle.mjs`, verified SHA256 `9d2cb3712cab1647d8b3c7f028a71fedc0f3c37dd410c0b9e1e48b382f1384b3`, 756628 bytes. Root may ownership/hash-check and remove only the redundant scratch bundle, then rerun lint and preserve both results; product warning suppression is not warranted.

All four saved actual-browser logs pass: Brevo7, Omnisend6, Mailchimp6 and Klaviyo4 groups, with owned fixture cleanup, current authority, distinct mappings, stale-response/download controls, mobile/Viewer checks and zero instrumented external requests/page errors. No UI/API implementation changed in this registry patch; these are regression results, not a mounted registry journey.

Crash proof uses actual strict wrappers and isolated PostgreSQL17.11. Saved logs show committed registration/rotation, interruption of an uncommitted transaction and read/revoke/replay verification after recovery, with permanent false readiness and empty operations/outbox/usage. Current container log shows interrupted shutdown and automatic WAL redo before accepting connections. Five of six pinned crash logs match; the sixth is I1. The three harness failures remain explicit: internal-network port publication; readiness accepting the temporary socket-only initialization server; and stale ephemeral host port after restart. Their corrections are harness changes, not hidden product fixes. The uniquely owned bridge permits outbound routing; loopback publication plus the provider fetch trap is not network-none isolation. No original shared PostgreSQL stop/write or production restore acceptance is claimed by this review.

All six Linux manifest log hashes match. The build-stage source unit log records 19/19; source probe records registry SQL/source hash, UID1001 and private exclusion. Runtime probe covers existing four destination contracts, exact receipts/media/assets/private exclusion, under the parent's retained network-none qualification. Expected startup refusal exits1 with incomplete GA evidence. Registry modules are unmounted source tested in the build stage: this does not prove a production registry worker is packaged or active.

All 20 Task1/correction and 15 Task2 saved log hashes match their full reports. Final scoped logs were read: SQL10/10; Task2 unit19 + real wrapper DB4 =23/23. Meaningful scaffold/readiness/Unicode/UUID/microsecond REDs, fixture sentinel mistake, uppercase-MAX correction, sandbox EPERM, nine erased-annotation type errors, expanded RED replay and all root harness failures remain retained. No second whole task review or broad test rerun was performed here.

## Documentation and remaining gates

The committed checkpoint is explicitly an in-progress snapshot retaining Task1 and predecessor context. Current Task2/root reports and exhaustive rulings are supplied separately and must be retained in the final canonical checkpoint before owned scratch cleanup; no completeness of that future documentation step is claimed. The REQ021 tracker correction is explained as reconciliation with existing private-media evidence and does not accept the requirement. HubSpot material is explicitly next-slice research with schema-access/account/visible-footer prerequisites; no HubSpot transport or success is introduced.

Full65 BaselineA/all13 GA gates/zero whole accepted persist; REQ040/REQ036 remain incomplete. Unverified account declarations and opaque reference versions do not establish real grants, approved auth mode, entitlement, credential resolution, account control, native fidelity/client tests, management links, durable export admission or production readiness. Per-workspace read/write serialization, trusted tenant context, native typed-cast errors and eventual provider qualification remain explicit inherited/design limits rather than new findings.

Canonical/main/Desktop synchronization, original109/221/private preservation and final canonical qualification remain root-owned pending work. I1 correction and its ONE scoped re-review must precede claiming fully verified crash evidence. This review wrote only this report; it performed no Git derivation/mutation, database or network/provider actions, build/browser/test rerun, private-environment access, sends/spend/push/deploy or subagent dispatch. No focused behavioral probe was needed after source and retained evidence inspection.

## Reviewed proof identities and verification status

### native-qualification

Manifest SHA256: `250c15101b483f13c90df91960e6d8a76088e79c911a5f46b73130f1ea5607f3`.

| Log | Declared SHA256 | Actual verification |
| --- | --- | --- |
| `/tmp/lettercape-integration-registry-native-full-suite.log` | `2f1bb70ecff93281dc02b3d8a0bd380e7bd8f016543b7dd9f964e847c95c543e` | MATCH |
| `/tmp/lettercape-integration-registry-native-type.log` | `e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6` | MATCH |
| `/tmp/lettercape-integration-registry-native-lint.log` | `508ee4c4c738e0b4d0dcef8064f4860f6de0618b68400c902ac54a21b4567e77` | MATCH |
| `/tmp/lettercape-integration-registry-native-api.log` | `ab290f6bee02e1fcfa50627a9b4ecd92b7ab23d8bdeacf6560075c6f1d46140f` | MATCH |
| `/tmp/lettercape-integration-registry-native-build.log` | `13ec915354826069404742f260cb41e22545e2f27cc453eca3c8ac4c36eba479` | MATCH |
| `/tmp/lettercape-integration-registry-native-brevo-browser.log` | `b66673982fa7af1f8cf9a0cbb56980377708fbdaa5dd1aadf9759c6ba8e288dc` | MATCH |
| `/tmp/lettercape-integration-registry-native-omnisend-browser.log` | `6756f4ca9c989be5e1150f3b066963a7f4729c66f3f2aebc7a9385606e021817` | MATCH |
| `/tmp/lettercape-integration-registry-native-mailchimp-browser.log` | `f31637df9f5fed30b4b028532e170bcd6e160ddc454fa7037afc30d6692ff05d` | MATCH |
| `/tmp/lettercape-integration-registry-native-klaviyo-browser.log` | `815ba9545226eb9c5aa82b739db6d224331660fab705f6fb78b3a9a45b827b76` | MATCH |

### crash-proof

Manifest SHA256: `84c09fb82a040be520fa043280606bf1aa8c6797a1a7b36d0cc364a0c293470d`.

| Log | Declared SHA256 | Actual verification |
| --- | --- | --- |
| `/tmp/lettercape-integration-registry-crash-logs/migrate.log` | `0b877eebefea5339a4dcda979a846a3019777ab8da8f953f2eeff64a3715694a` | MATCH |
| `/tmp/lettercape-integration-registry-crash-logs/migration-first-failure.log` | `9f1c4e88508477a6e39633026d0bdfb621299eb7503bf5c16514efca53ebde9b` | MATCH |
| `/tmp/lettercape-integration-registry-crash-logs/pending.log` | `96914729786dbf932a2e4b22c20638976b42e3adf15de375dc81ae431b6fef40` | MATCH |
| `/tmp/lettercape-integration-registry-crash-logs/postgres-container.log` | `49eb4b5abf6f81e28e77eadc53f0f4e363a1cf141f211bb1963fa31097a7792a` | MISMATCH — I1; actual 90bd9b5aa3fc4407b67bfa61d655a11702f4aa62f209c884f961a206554bd3a7 |
| `/tmp/lettercape-integration-registry-crash-logs/seed.log` | `03715ac3068be0b240b0a14fa80935088e7622ec1227dc22d58cd1b5f088dbba` | MATCH |
| `/tmp/lettercape-integration-registry-crash-logs/verify.log` | `be454399fc76db3611c9200570275f9a029ccdecd9ca350a8881b34a1d8d6ef3` | MATCH |

### linux-proof

Manifest SHA256: `91571b68235cebbe932ce524c949745506a41b9a8aa73afb5909d88a10e801fb`.

| Log | Declared SHA256 | Actual verification |
| --- | --- | --- |
| `/tmp/lettercape-integration-registry-linux-build-build.log` | `279dc9c465840f2a0c8e1530e20a8fa7833371336ddce706f7a563587a4a02c1` | MATCH |
| `/tmp/lettercape-integration-registry-linux-source-unit.log` | `9ec8922cf2cd17fe04cacb7333c215db38cfe9080bc0f482416a30ee4e6e9691` | MATCH |
| `/tmp/lettercape-integration-registry-linux-source-probe.log` | `aceec27ca7be742eeadc12066f90d8156e7ec9b547ac17869910bcdab0934404` | MATCH |
| `/tmp/lettercape-integration-registry-linux-runtime-build.log` | `498d4c1da1cf2fe89831fb3675de91b951ac663c5690c86cd9eb705e716d1396` | MATCH |
| `/tmp/lettercape-integration-registry-linux-runtime-probe.log` | `62470a8a3371ebf17d9a344d6fa684961e68f421267e6fa84eac7ee23d1d3dcb` | MATCH |
| `/tmp/lettercape-integration-registry-linux-runtime-startup.log` | `e331306af1367c23fa850fb3f6d9708b5f8bba6bf376512ce7139dd1516c5754` | MATCH |


## ONEcomplete corrective report — complete retained text

# ONE whole-review correction wave — complete report

Status: DONE within delegated scope. I1 provenance ordering is corrected, all six corrected crash log entries verify, and fresh full native lint exits 0 with zero errors/warnings. The root-owned ONE scoped correction review remains the next acceptance step. No whole review, product fix wave, actual database/crash/full-suite/type/build/API/browser/Linux rerun or subagent dispatch occurred.

Reviewed product HEAD: `8f686578cd6fce2488bac4423f65f89feecc32c8`.
Documentation-only correction commit: `f0a4ea54ab9a2f3f057182164109994de5c2e71e` (`Record corrected integration qualification evidence provenance`).
Exact Git delta: **only** `docs/INTEGRATION-REGISTRY-QUALIFICATION-CORRECTION.md` (45 added lines).
Root-owned `docs/superpowers/plans/2026-10-03-integration-registry.md` remains dirty and was neither edited nor staged/committed by this task. No SQL, TS, tests, checkpoint, root plan, lint configuration or other tracked product file changed.

## Input finding and exact provenance

Read the complete `/tmp/lettercape-integration-registry-whole-review.md` (SHA-256 `54fed23bad45d7280128cedcbc7572d93b8a34590c3de0d53d330e14dbb4a50c`). The ONE whole review reports 0 Critical, 1 Important, 0 Minor; I1 is crash-receipt evidence ordering, not a product SQL/schema/wrapper defect. Its immutable review artifact is `/tmp/lettercape-integration-registry-whole.diff`, 169910 bytes / SHA-256 `da008a7931a65d10408b61154841b63cde461738b508e36192aa4c0e14560c9e`.

Before any mutation, copied and byte-compared:

| Original bytes preserved | Bytes | SHA-256 |
|---|---:|---|
| `/tmp/lettercape-integration-registry-correction-before-harness.py` | 5979 | `c8e76f8b8a49dbfc9e8b52fb8e3a3538da0fec77018f392319f38c780fb04244` |
| `/tmp/lettercape-integration-registry-correction-before-proof.json` | 2002 | `84c09fb82a040be520fa043280606bf1aa8c6797a1a7b36d0cc364a0c293470d` |

The stale old container receipt is 4979 bytes / SHA-256 `49eb4b5abf6f81e28e77eadc53f0f4e363a1cf141f211bb1963fa31097a7792a`. Read-only verification establishes that it matches `/tmp/lettercape-integration-registry-crash-logs/failed-after-actual-crash/postgres-container.log` exactly. The original failed-after-actual-crash migration/seed/pending/verify/marker files remain untouched. The successful current container log is 4992 bytes / SHA-256 `90bd9b5aa3fc4407b67bfa61d655a11702f4aa62f209c884f961a206554bd3a7`; it visibly records interrupted shutdown, automatic recovery, WAL redo, end-of-recovery checkpoint and readiness. The old receipt hashed the previous file before finally replaced it, explaining the mismatch without implying SQL durability failure.

## Helper correction: exact full diff

Corrected helper: `/tmp/lettercape-integration-registry-crash-qualify.py`, 5980 bytes / SHA-256 `9d95dce354041a2139c733d8a34e6b37ed479b5e7321b7ae7192065e38b404d1`.

Only receipt ordering changed. The successful proof claims are assembled inside try but logs are not read or hashed there. Finally captures successful Docker logs and completes ownership-checked container/volume/network removal. Only after finally returns successfully does the code set its cleanup flag, hash all retained log files and write the proof. Capture or cleanup exceptions bypass the receipt writer. This also includes the current container log on a first run with no prior file.

Python AST/syntax verification asserts the receipt block follows the try/finally block, the manifest loop is in that receipt block, there is no hashlib.sha256 in try, and log capture precedes removal. It exits 0; output is retained in `/tmp/lettercape-integration-registry-correction-helper-check.log`. The helper was not executed against Docker or any database.

```diff
--- /tmp/lettercape-integration-registry-correction-before-harness.py
+++ /tmp/lettercape-integration-registry-crash-qualify.py
@@ -39,7 +39,6 @@
  port=run(['docker','port',name,'5432/tcp']).stdout.decode().strip();assert re.fullmatch(r'127\.0\.0\.1:[0-9]+',port) and not port.endswith(':55439')
  descriptor['url']='postgresql://registry_fixture:registry_fixture_password@'+port+'/registry_fixture';descriptor_path.write_text(json.dumps(descriptor)+'\n');descriptor_path.chmod(0o600);node('verify')
  proof={'source_head':head,'postgres_image_id':image,'postgres_platform':'linux/arm64','owned_container':container,'uniquely_owned_network':True,'network_outbound_disabled':False,'loopback_only_ephemeral_port':True,'committed_state_and_history_preserved':True,'uncommitted_state_and_history_rolled_back':True,'actual_strict_wrappers':True,'readiness_false':True,'operations_outbox_usage_zero':True,'provider_io':False,'original_shared_postgres_stopped_or_written':False,'production_restore_or_release_gate_accepted':False,'logs':[]}
- for p in sorted(logs.glob('*.log')):b=p.read_bytes();proof['logs'].append({'path':str(p),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
 finally:
  if pending is not None and pending.poll()is None:pending.kill();pending.wait(timeout=10)
  if created_container:
@@ -47,4 +46,6 @@
  if created_volume:owned('volume',volume);run(['docker','volume','rm',volume])
  if created_network:owned('network',network);run(['docker','network','rm',network])
 if 'proof'in globals():
- proof['only_owned_fixture_container_volume_network_cleaned']=True;Path('/tmp/lettercape-integration-registry-crash-proof.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
+ proof['only_owned_fixture_container_volume_network_cleaned']=True
+ for p in sorted(logs.glob('*.log')):b=p.read_bytes();proof['logs'].append({'path':str(p),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
+ Path('/tmp/lettercape-integration-registry-crash-proof.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
```

The exact diff is also retained at `/tmp/lettercape-integration-registry-correction-harness.diff`.

## Reconciliation of the already successful run

Executed `/tmp/lettercape-integration-registry-correction-reconcile.py` with no database, Docker, environment loader or provider action. It asserts the current top-level crash directory has exactly the six expected logs; verifies the five unaffected rows against the original manifest; ties the stale sixth row to the retained failed run; validates exact expected seed/pending/verify PASS lines, all35 applied migrations, the explicitly retained first migration error, and the ordered automatic recovery sequence; then rebuilds the receipt from the retained successful bytes and rechecks each referenced byte count/hash.

Corrected receipt `/tmp/lettercape-integration-registry-crash-proof.json`: 2002 bytes / SHA-256 `2222f92f22fb2c31b4d2653820b3dc9da31ddc7480019b2b0876839d67a51bd7`. An exact copy is `/tmp/lettercape-integration-registry-correction-crash-proof.json`. The original receipt remains preserved. JSON non-log fields are exactly equal before/after; only the container entry's bytes/hash changed. No claim, source HEAD, image/container identity, provider boundary, cleanup assertion or release-gate assertion was upgraded. Existing cleanup evidence is retained, not newly exercised.

| Corrected crash log | Bytes | SHA-256 | Verification |
|---|---:|---|---|
| `/tmp/lettercape-integration-registry-crash-logs/migrate.log` | 1118 | `0b877eebefea5339a4dcda979a846a3019777ab8da8f953f2eeff64a3715694a` | MATCH |
| `/tmp/lettercape-integration-registry-crash-logs/migration-first-failure.log` | 754 | `9f1c4e88508477a6e39633026d0bdfb621299eb7503bf5c16514efca53ebde9b` | MATCH |
| `/tmp/lettercape-integration-registry-crash-logs/pending.log` | 101 | `96914729786dbf932a2e4b22c20638976b42e3adf15de375dc81ae431b6fef40` | MATCH |
| `/tmp/lettercape-integration-registry-crash-logs/postgres-container.log` | 4992 | `90bd9b5aa3fc4407b67bfa61d655a11702f4aa62f209c884f961a206554bd3a7` | MATCH |
| `/tmp/lettercape-integration-registry-crash-logs/seed.log` | 111 | `03715ac3068be0b240b0a14fa80935088e7622ec1227dc22d58cd1b5f088dbba` | MATCH |
| `/tmp/lettercape-integration-registry-crash-logs/verify.log` | 219 | `be454399fc76db3611c9200570275f9a029ccdecd9ca350a8881b34a1d8d6ef3` | MATCH |

Extra immutable copies of all six logs, failed-after-actual-crash container log and prior warning-bearing native lint log are retained under `/tmp/lettercape-integration-registry-correction-retained-logs/`. All original logs and prior receipts are retained. Migration-first-failure.log deliberately records `Connection terminated unexpectedly`; it is failure provenance, not silently relabeled success. Earlier internal-network/readiness/stale-host-port harness failures remain root-retained and unchanged.

## Redundant generated bundle and lint

Only removed untracked owned scratch path `/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/domain-browser-bundle.mjs`. Before deletion, verified the path was not a symlink, resolved inside the owned checkout, was untracked, and its full bytes exactly equaled retained `/tmp/lettercape-integration-registry-task-logs/task-2-evidence/domain-browser-bundle.mjs`: 756628 bytes / SHA-256 `9d2cb3712cab1647d8b3c7f028a71fedc0f3c37dd410c0b9e1e48b382f1384b3`. After unlink, the retained copy still matches the original bytes. No other scratch removal occurred. Removal receipt: `/tmp/lettercape-integration-registry-correction-bundle-removal.json`.

The old native lint log remains unchanged, exit0 with 0 errors/142 warnings exclusively in that generated scratch file. Its SHA-256 remains `508ee4c4c738e0b4d0dcef8064f4860f6de0618b68400c902ac54a21b4567e77`. It is not relabeled warning-free. Fresh exact `npm run lint` exited 0 and printed only npm script headers plus `eslint .`, with zero errors and zero warnings. Fresh log `/tmp/lettercape-integration-registry-correction-lint.log`, 36 bytes / SHA-256 `177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746`. No product warning was ignored or suppressed; no lint/source configuration change occurred.

## Product equality and unchanged reusable proofs

Captured every tracked non-documentation file before mutation and compared live bytes to Git product HEAD, then rechecked after correction and after documentation commit: **all511 files match before and reviewed HEAD**. Detailed path/byte/hash records are in `/tmp/lettercape-integration-registry-correction-product-before.json` and `/tmp/lettercape-integration-registry-correction-verification.json`. Git HEAD delta contains exactly the new documentation file, so product evidence remains applicable. Ignored private environment files were not read/copied/printed/hashed.

All nine original native logs and six Linux logs were hash-reverified without executing their checks, and both original manifests remain unchanged. The native lint receipt remains the prior warning-bearing result; the new clean lint log supplements it. Existing full-suite760/760, type, API122, build, four actual-browser logs, Linux source19/19/probes and expected startup refusal are preserved evidence, **not new runs**. No additional acceptance or production restore claim follows from this correction.

| Existing reusable proof artifact | Bytes | SHA-256 | Verification |
|---|---:|---|---|
| `/tmp/lettercape-integration-registry-native-full-suite.log` | 77256 | `2f1bb70ecff93281dc02b3d8a0bd380e7bd8f016543b7dd9f964e847c95c543e` | MATCH |
| `/tmp/lettercape-integration-registry-native-type.log` | 45 | `e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6` | MATCH |
| `/tmp/lettercape-integration-registry-native-lint.log` | 18811 | `508ee4c4c738e0b4d0dcef8064f4860f6de0618b68400c902ac54a21b4567e77` | MATCH |
| `/tmp/lettercape-integration-registry-native-api.log` | 157 | `ab290f6bee02e1fcfa50627a9b4ecd92b7ab23d8bdeacf6560075c6f1d46140f` | MATCH |
| `/tmp/lettercape-integration-registry-native-build.log` | 1342 | `13ec915354826069404742f260cb41e22545e2f27cc453eca3c8ac4c36eba479` | MATCH |
| `/tmp/lettercape-integration-registry-native-brevo-browser.log` | 893 | `b66673982fa7af1f8cf9a0cbb56980377708fbdaa5dd1aadf9759c6ba8e288dc` | MATCH |
| `/tmp/lettercape-integration-registry-native-omnisend-browser.log` | 755 | `6756f4ca9c989be5e1150f3b066963a7f4729c66f3f2aebc7a9385606e021817` | MATCH |
| `/tmp/lettercape-integration-registry-native-mailchimp-browser.log` | 734 | `f31637df9f5fed30b4b028532e170bcd6e160ddc454fa7037afc30d6692ff05d` | MATCH |
| `/tmp/lettercape-integration-registry-native-klaviyo-browser.log` | 491 | `815ba9545226eb9c5aa82b739db6d224331660fab705f6fb78b3a9a45b827b76` | MATCH |
| `/tmp/lettercape-integration-registry-native-qualification.json` | 2962 | `250c15101b483f13c90df91960e6d8a76088e79c911a5f46b73130f1ea5607f3` | MATCH |
| `/tmp/lettercape-integration-registry-linux-build-build.log` | 7869 | `279dc9c465840f2a0c8e1530e20a8fa7833371336ddce706f7a563587a4a02c1` | MATCH |
| `/tmp/lettercape-integration-registry-linux-source-unit.log` | 1567 | `9ec8922cf2cd17fe04cacb7333c215db38cfe9080bc0f482416a30ee4e6e9691` | MATCH |
| `/tmp/lettercape-integration-registry-linux-source-probe.log` | 80 | `aceec27ca7be742eeadc12066f90d8156e7ec9b547ac17869910bcdab0934404` | MATCH |
| `/tmp/lettercape-integration-registry-linux-runtime-build.log` | 4588 | `498d4c1da1cf2fe89831fb3675de91b951ac663c5690c86cd9eb705e716d1396` | MATCH |
| `/tmp/lettercape-integration-registry-linux-runtime-probe.log` | 178 | `62470a8a3371ebf17d9a344d6fa684961e68f421267e6fa84eac7ee23d1d3dcb` | MATCH |
| `/tmp/lettercape-integration-registry-linux-runtime-startup.log` | 83 | `e331306af1367c23fa850fb3f6d9708b5f8bba6bf376512ce7139dd1516c5754` | MATCH |
| `/tmp/lettercape-integration-registry-linux-proof.json` | 2250 | `91571b68235cebbe932ce524c949745506a41b9a8aa73afb5909d88a10e801fb` | MATCH |

## Exact commands/results and retained failures

All checkout commands used cwd `/tmp/lettercape-integration-registry-native`.

1. `cat /tmp/lettercape-integration-registry-whole-review.md` and `cat /tmp/lettercape-integration-registry-crash-qualify.py`: exit0, complete finding/harness read.
2. Discovery `rg --files /tmp/lettercape-integration-registry-task-logs /tmp/lettercape-integration-registry-native/.sdd`: reported missing guessed `.sdd` path. Correct exact path discovered with `rg --files --hidden --no-ignore .superpowers/sdd`. Read-only discovery issue only, no failed correction or source mutation.
3. `git rev-parse HEAD`, `git status --short`: exit0, reviewed product HEAD confirmed, root plan dirty observed.
4. `cat /tmp/lettercape-integration-registry-crash-proof.json`; `cat` six successful-run logs; `ls -l` current/failed crash log directories; `rg -n 'domain-browser-bundle|warning|problems' /tmp/lettercape-integration-registry-native-lint.log`: exit0, exact provenance and warning scope read.
5. Inline Python exclusive-copy/byte comparison of original helper/proof, followed by `git ls-files -z` and `git show 8f686578cd6fce2488bac4423f65f89feecc32c8:<path>` comparisons: exit0, originals retained and511 tracked product files equal.
6. Inline Python exact textual helper delta and AST verification: exit0, manifest moved after finally, no Docker/DB execution. Exact code delta retained above.
7. `python3 /tmp/lettercape-integration-registry-correction-reconcile.py > /tmp/lettercape-integration-registry-correction-reconcile.log 2>&1`: exit0, full retained script and output available; corrected all-six manifest and only redundant verified bundle removed.
8. `npm run lint > /tmp/lettercape-integration-registry-correction-lint.log 2>&1`: exit0, zero errors/warnings.
9. Read-only original native/Linux manifest inspection, then inline Python complete log/hash comparisons and product-file after comparisons: exit0, all15 log rows and two manifests preserved, lint-clean assertion passed. Detailed receipt retained.
10. `python3 - > /tmp/lettercape-integration-registry-correction-helper-check.log 2>&1` AST/order helper check: exit0, corrected syntax/order PASS.
11. Inline Python wrote only new `docs/INTEGRATION-REGISTRY-QUALIFICATION-CORRECTION.md`; `git diff --check`, `git status --short`: exit0.
12. `git add -- docs/INTEGRATION-REGISTRY-QUALIFICATION-CORRECTION.md`; `git diff --cached --check -- docs/INTEGRATION-REGISTRY-QUALIFICATION-CORRECTION.md`: exit0, owned document only.
13. `git commit -m 'Record corrected integration qualification evidence provenance' -- docs/INTEGRATION-REGISTRY-QUALIFICATION-CORRECTION.md`: exit0, `f0a4ea54ab9a2f3f057182164109994de5c2e71e`, exact one-file documentation commit.
14. `git show --format=fuller --stat HEAD`; `git diff --name-only 8f686578cd6fce2488bac4423f65f89feecc32c8 HEAD`; `git status --short`: exit0, only new document committed, root dirty plan remains outside commit.
15. Final read-only Python product/hash revalidation: exit0, all511 product files, six corrected crash logs, 15 reused native/Linux logs still match, current proof equals retained corrected copy.
16. Inline Python writes this requested report and artifact hashes only. No actualDB/full-suite/type/build/API/browser/Linux repeat, private-env read, provider/send/spend/push/deploy/network call or subagent dispatch.

No unexpected corrective validation failure occurred. Original I1 mismatch and warning-bearing lint remain preserved as inputs. The earlier guessed scratch discovery path failed read-only and was corrected before any removal. No data or private configuration was involved.

## Retained correction artifacts: complete hashes

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `/tmp/lettercape-integration-registry-correction-before-harness.py` | 5979 | `c8e76f8b8a49dbfc9e8b52fb8e3a3538da0fec77018f392319f38c780fb04244` |
| `/tmp/lettercape-integration-registry-correction-before-proof.json` | 2002 | `84c09fb82a040be520fa043280606bf1aa8c6797a1a7b36d0cc364a0c293470d` |
| `/tmp/lettercape-integration-registry-correction-bundle-removal.json` | 487 | `438bb62724856c53c7b1be9f7b6b46f59d653ae1b451151fcb9e9becd84889f2` |
| `/tmp/lettercape-integration-registry-correction-crash-proof.json` | 2002 | `2222f92f22fb2c31b4d2653820b3dc9da31ddc7480019b2b0876839d67a51bd7` |
| `/tmp/lettercape-integration-registry-correction-harness.diff` | 2062 | `d0a0c07fc38a9198c2f47ceccc9d20406c0fb50136297a1f8f19ce6ded293eef` |
| `/tmp/lettercape-integration-registry-correction-helper-check.log` | 256 | `4afc4e0ae3d012de04b953d46ce4e0297d6592e1e4504e1111b3b214c478e86f` |
| `/tmp/lettercape-integration-registry-correction-lint.log` | 36 | `177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746` |
| `/tmp/lettercape-integration-registry-correction-product-before.json` | 76579 | `04d712eda4d516971ec87c6b8747029187768b0b6ae5f8a9aa8a3018454a5363` |
| `/tmp/lettercape-integration-registry-correction-reconcile.log` | 804 | `550178967e1192f8ca7780654ce3d68b3fc38316b25d6c6a7812c46049b7ce68` |
| `/tmp/lettercape-integration-registry-correction-reconcile.py` | 5584 | `7e7bcb839f47480db1700b26676eed113fc069c8864353aef02bf54cf8196fa3` |
| `/tmp/lettercape-integration-registry-correction-retained-logs/failed-after-actual-crash-postgres-container.log` | 4979 | `49eb4b5abf6f81e28e77eadc53f0f4e363a1cf141f211bb1963fa31097a7792a` |
| `/tmp/lettercape-integration-registry-correction-retained-logs/migrate.log` | 1118 | `0b877eebefea5339a4dcda979a846a3019777ab8da8f953f2eeff64a3715694a` |
| `/tmp/lettercape-integration-registry-correction-retained-logs/migration-first-failure.log` | 754 | `9f1c4e88508477a6e39633026d0bdfb621299eb7503bf5c16514efca53ebde9b` |
| `/tmp/lettercape-integration-registry-correction-retained-logs/native-lint-before.log` | 18811 | `508ee4c4c738e0b4d0dcef8064f4860f6de0618b68400c902ac54a21b4567e77` |
| `/tmp/lettercape-integration-registry-correction-retained-logs/pending.log` | 101 | `96914729786dbf932a2e4b22c20638976b42e3adf15de375dc81ae431b6fef40` |
| `/tmp/lettercape-integration-registry-correction-retained-logs/postgres-container.log` | 4992 | `90bd9b5aa3fc4407b67bfa61d655a11702f4aa62f209c884f961a206554bd3a7` |
| `/tmp/lettercape-integration-registry-correction-retained-logs/seed.log` | 111 | `03715ac3068be0b240b0a14fa80935088e7622ec1227dc22d58cd1b5f088dbba` |
| `/tmp/lettercape-integration-registry-correction-retained-logs/verify.log` | 219 | `be454399fc76db3611c9200570275f9a029ccdecd9ca350a8881b34a1d8d6ef3` |
| `/tmp/lettercape-integration-registry-correction-verification.json` | 80960 | `c6a1793a41403f3ac4e7c8fb6e44726e4f8b9e52175552570a5cac637be10c28` |

Committed correction document SHA-256: `c1e2ff13e80736706418f93c1fcec126b8847bd195fae767636ace830d947fe9`.
Original retained generated bundle SHA-256 remains `9d2cb3712cab1647d8b3c7f028a71fedc0f3c37dd410c0b9e1e48b382f1384b3`; successful/failed raw crash logs remain original paths as enumerated above. Report SHA is returned separately to avoid a self-referential hash.

## Remaining limits and acceptance boundary

The root ONE scoped correction review must verify this complete evidence wave before canonical qualification is declared complete. Canonical/main/Desktop synchronization and final checkpoint remain root-owned. Full65 BaselineA/all13 GA gates/zero whole accepted persist; REQ040/REQ036 incomplete. The registry remains unmounted, readiness false, UUID credentials opaque, with no OAuth/provider call/credential resolver/export worker/public route/send/spend/push/deploy. The crash fixture used a uniquely owned bridge with outbound routing available; this is not network-none isolation, production restore acceptance or real-provider qualification. Original shared PostgreSQL was neither stopped nor written in this correction. No product defect was discovered or fixed by this evidence-only wave.


## Root-owned transient metadata annotation and final receipt split

After the completed correction verification and immutable documentation commit `f0a4ea54ab9a2f3f057182164109994de5c2e71e`, root briefly annotated its own native receipt with exactly five additive metadata fields: `initial_lint_warnings`, `initial_lint_warning_scope`, `final_lint`, `mobile_pixel_inspected` and `mobile_image`. The original nine check entries, commands, exit statuses and log hashes were not changed. The clean-lint metadata refers to this task's existing fresh zero-noise log; this task did not perform a new pixel/browser inspection or qualification run.

Root then recovered the exact original native receipt after annotation by removing only those five fields and preserving original JSON serialization. This is explicitly **post-annotation byte-exact recovery**, not a pre-mutation copy. Root retained it at `/tmp/lettercape-integration-registry-native-qualification-before-annotation.json`, 2962 bytes / original whole-review SHA-256 `250c15101b483f13c90df91960e6d8a76088e79c911a5f46b73130f1ea5607f3`. In this agent's metadata comparison, that archive's pinned original hash assertion passed. A subsequent additive-field comparison stopped with AssertionError (exit1) because root concurrently restored the current native receipt while that read-only script was running. The script had written only an exclusive preserved copy of the earlier correction report; it did not mutate any root file, product source, proof, or documentation. This late stop is retained explicitly rather than hidden as a successful metadata comparison. Earlier product/crash/log/lint checks remain the completed successful evidence.

Root's final arrangement is:

- `/tmp/lettercape-integration-registry-native-qualification.json` restored to the exact original reviewed receipt. Original lint remains the 142-warning run; it is not relabeled.
- `/tmp/lettercape-integration-registry-native-qualification-before-annotation.json` retains the exact recovered original bytes, with recovery provenance as described above.
- `/tmp/lettercape-integration-registry-native-final-qualification.json` retains supplemental final-clean-lint and root pixel-inspection metadata separately.

Original native/Linux manifest byte-identity assertions in the immutable correction document and completed verification receipt therefore remain valid in the final arrangement. Root explicitly instructed no repeated checks or reruns. No SQL/TS/test/product change or documentation commit amendment was made. No second whole review or second fix wave was dispatched. The source and six-log crash correction remain the same completed ONE wave.

Read-only metadata hashing for this final provenance appendix (no test, log-revalidation, or product-check rerun):

| Root/final provenance artifact | Bytes | SHA-256 |
|---|---:|---|
| `/tmp/lettercape-integration-registry-native-qualification.json` | 2962 | `250c15101b483f13c90df91960e6d8a76088e79c911a5f46b73130f1ea5607f3` |
| `/tmp/lettercape-integration-registry-native-qualification-before-annotation.json` | 2962 | `250c15101b483f13c90df91960e6d8a76088e79c911a5f46b73130f1ea5607f3` |
| `/tmp/lettercape-integration-registry-native-final-qualification.json` | 3405 | `9f315b4b4d2d27fe512345e469635b5f504af7cec1a93143f8021e7dc2a1ea4f` |
| `/tmp/lettercape-integration-registry-correction-report-before-root-annotation.md` | 21662 | `49d9dc2f6fc8125fd2d3224f3d16c510d5b0fb3ce1fc9d74df2c1f1fd81d6ac5` |

Documentation commit remains `f0a4ea54ab9a2f3f057182164109994de5c2e71e`. Corrected crash receipt SHA-256 remains `2222f92f22fb2c31b4d2653820b3dc9da31ddc7480019b2b0876839d67a51bd7`; fresh clean lint SHA-256 remains `177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746`. All completed checks and limits are unchanged. Ready for root's ONE scoped correction review, with no canonical acceptance or new provider/readiness claim.

## ONEscoped corrective review — complete retained text

# Integration registry — ONE scoped whole-review correction review

**I1: ADDRESSED. Correction quality: Approved. Residual/new findings: 0 Critical, 0 Important, 0 Minor.**

This review checks only the previously reported crash-receipt ordering defect and new breakage introduced by its evidence correction. It does not repeat Task1, Task2, the whole review, or product qualification. No new production defect or qualification claim is established.

## Immutable correction boundary

Requested BASE `8f686578cd6fce2488bac4423f65f89feecc32c8`; HEAD `f0a4ea54ab9a2f3f057182164109994de5c2e71e`. The supplied package identifies that correction commit and contains only the new 45-line `docs/INTEGRATION-REGISTRY-QUALIFICATION-CORRECTION.md`.

- Package: `/tmp/lettercape-integration-registry-correction-review-package.diff`, 7096 bytes, verified SHA-256 `caa08046339fac0df186a69655e3b881bbd9dcc51fc4cc216ed2a4990c5da30f`.
- Complete correction report: `/tmp/lettercape-integration-registry-correction-report.md`, verified SHA-256 `28b658e0cc9fece373bc2a6c27f8482dbc096ab280129ea0d339070de9426ac5`. Read the complete report, including exact helper diff, retained failures and final concurrent-metadata provenance appendix.
- Read the original whole review and its I1 reasoning. Its preserved SHA-256, checked through the correction report's artifact rows, is `54fed23bad45d7280128cedcbc7572d93b8a34590c3de0d53d330e14dbb4a50c`.
- Read the immutable documentation diff once, fully visible without a truncated hunk. No changed documentation file was separately reread; no Git command derived an alternate patch.

## I1 closure

The corrected actual helper captures current container logs inside `finally`, then removes ownership-checked container, volume and network resources at `/tmp/lettercape-integration-registry-crash-qualify.py:42`, `:45`, `:46`, `:47`. The manifest loop is outside and after that block at `:50`; receipt writing follows at `:51`. The proof object is created only after successful stage verification at `:40` and `:41`. An exception in log capture or cleanup propagates before the writer, so it cannot finalize a new success receipt from an incomplete finalization. The first successful run also captures its current log before enumerating the directory. This closes the exact ordering problem at the old helper's line 42.

The helper is 5980 bytes, SHA-256 `9d95dce354041a2139c733d8a34e6b37ed479b5e7321b7ae7192065e38b404d1`. The original helper remains preserved at `/tmp/lettercape-integration-registry-correction-before-harness.py`, 5979 bytes, SHA-256 `c8e76f8b8a49dbfc9e8b52fb8e3a3538da0fec77018f392319f38c780fb04244`. The complete report includes the exact ordering-only helper diff; the retained helper-check log confirms syntax/order checks without executing Docker or PostgreSQL.

The reconciliation is constrained to existing bytes. `/tmp/lettercape-integration-registry-correction-reconcile.py:8` requires exactly the six expected logs; `:20` and `:21` require all five unaffected entries to remain identical. Lines `:24`–`:27` bind the stale original container entry to the retained failed run and the new entry to the exact successful log. Lines `:32`–`:39` validate retained stage text, migrations, explicit first failure, and ordered recovery markers. Lines `:45`–`:51` rebuild only log metadata and assert all other proof fields unchanged. No new run is represented as having occurred.

Independent read-only JSON and byte/hash comparison verified:

| Receipt/log | Bytes | SHA-256 | Result |
|---|---:|---|---|
| Original crash receipt | 2002 | `84c09fb82a040be520fa043280606bf1aa8c6797a1a7b36d0cc364a0c293470d` | Preserved |
| Corrected crash receipt | 2002 | `2222f92f22fb2c31b4d2653820b3dc9da31ddc7480019b2b0876839d67a51bd7` | Matches retained corrected copy |
| Archived failed container log | 4979 | `49eb4b5abf6f81e28e77eadc53f0f4e363a1cf141f211bb1963fa31097a7792a` | Matches stale original entry |
| Successful current container log | 4992 | `90bd9b5aa3fc4407b67bfa61d655a11702f4aa62f209c884f961a206554bd3a7` | Matches corrected entry |

All six corrected log rows match their referenced byte counts and hashes. Exactly one row changes, `postgres-container.log`; the other five rows are identical to the original receipt. All non-log JSON fields remain exactly equal, including source HEAD, image/container identity, cleanup assertions and negative production/provider qualification assertions. The original receipt, successful/failed logs, helper and failure provenance remain retained. The documentation accurately describes this repair at `docs/INTEGRATION-REGISTRY-QUALIFICATION-CORRECTION.md:7`, `:9`, `:18`, `:31`.

## New corrective breakage checks

No new defect was found in the correction document or receipt arrangement.

The old native lint result remains warning-bearing and unchanged: its log has the one generated bundle path at line 6 and reports 142 problems / 0 errors / 142 warnings at line 150. The generated bundle has a retained outside-source copy, independently verified as 756628 bytes / SHA-256 `9d2cb3712cab1647d8b3c7f028a71fedc0f3c37dd410c0b9e1e48b382f1384b3`; the redundant owned scratch path is absent. The reconciliation source checks symlink/checkout ownership, untracked status, full byte identity and pinned hash before the single unlink at `/tmp/lettercape-integration-registry-correction-reconcile.py:60`–`:67`. This does not suppress a product warning or modify lint configuration.

Fresh lint evidence contains only npm/ESLint invocation headers, with zero diagnostics: `/tmp/lettercape-integration-registry-correction-lint.log`, 36 bytes, SHA-256 `177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746`. Retained exit receipts record exit 0 and zero errors/warnings. The correction document preserves the old/new distinction at `docs/INTEGRATION-REGISTRY-QUALIFICATION-CORRECTION.md:35` and `:37`.

The original native receipt and its recovered original copy are byte-identical, both 2962 bytes / original reviewed SHA-256 `250c15101b483f13c90df91960e6d8a76088e79c911a5f46b73130f1ea5607f3`. The complete report explicitly describes the recovered copy as post-annotation byte-exact recovery, rather than claiming an earlier pre-mutation copy. Its documented concurrent read-only comparison failure remains disclosed. The final supplemental native receipt preserves every original field/value and adds exactly five fields: initial_lint_warnings, initial_lint_warning_scope, final_lint, mobile_pixel_inspected, mobile_image. Its final_lint metadata refers to the independently verified fresh lint log and records exit 0 / warnings 0 / errors 0. Thus the original receipt still describes the 142-warning lint result; supplemental metadata does not relabel it.

All nine retained native log hashes and all six retained Linux log hashes match their original manifests. A table-driven comparison also verified all 48 path/size/hash rows in the complete correction report, including preserved originals, corrected copies, supporting logs and final metadata provenance artifacts. No mismatch remained. The separate full report is internally explicit about its late concurrent-comparison stop, so the earlier historical “no unexpected corrective validation failure” wording is qualified by that appendix rather than hiding the stop.

The immutable Git package is documentation-only. The retained verification receipt names the reviewed product HEAD, reports 511 non-documentation files, and records equality with pre-correction live bytes and reviewed HEAD. Its SHA-256 was verified; product files themselves were not crawled again. Together with the supplied exact documentation-only delta, this supports reusing the existing product qualification for this correction without a new broad test wave. The document expressly preserves this scope and the pending canonical boundary at `docs/INTEGRATION-REGISTRY-QUALIFICATION-CORRECTION.md:41`, `:43`, `:45`.

## Checks, observed review failure and limits

Read-only checks consisted of SHA-256/byte verification, reading complete review/report inputs and the one immutable patch, focused helper/reconciliation source inspection, retained log inspection, and receipt comparison. No SQL/store/task crawl, source/index/HEAD mutation, helper/reconciliation execution, database creation, crash replay, product build/test/browser/Linux/lint rerun, private environment access, provider/network action, subagent or scratch cleanup occurred. This report is the only deliverable written.

The reviewer's first comparison script successfully checked all 48 correction-report artifact rows and all six crash rows, then stopped with `KeyError: 'bytes'` while inspecting native receipt rows. Native receipts store hashes but omit byte counts. The read-only comparator was corrected to require the SHA-256 and compare size only when declared; it then completed all 9 native / 6 Linux rows and final metadata comparisons successfully. This was a reviewer-script assumption, not a correction defect, and did not trigger any product or qualification rerun.

Canonical/main/Desktop synchronization, final checkpoint retention, original109/221/private preservation and final canonical qualification remain root-owned pending work. This scoped review does not independently re-prove mobile pixels, cleanup execution, network isolation, production restore acceptance, real-provider access, OAuth/credential resolution, durable export readiness or all GA gates. The existing crash fixture's outbound-capable bridge is not converted to network-none isolation. Full65 BaselineA/all13 GA gates/zero whole accepted and incomplete REQ040/REQ036 remain unchanged.

## Residual/new findings

- Critical: none.
- Important: none; I1 is addressed.
- Minor: none.

**Scoped correction verdict: Approved.** The evidence-order fix and retained-log reconciliation close I1 without product changes or upgraded qualification claims. The canonical acceptance work remains separate.

## Current ledger and exhaustive rulings — complete retained text

# SDD ledger — plan: docs/superpowers/plans/2026-10-03-integration-registry.md

| Pair/task | Interface/consistency | Outcome |
|1/2|Exact4 SQLfunctions/redacted schema|Binding spec copied; task2 aftertask1review.|
|1/3|Migration+isolatedDB vsqualification|Existing fixture migratesall ordereddbSQL; no canonical application migrations beforereview.|
|2/3|Unmounted wrappers,no routes|No APIcounts/readinesschange; noUItestfabrication.|
|1|Durability/RLS/CAS/currentauth|Exactowned2files, serviceowner no privileges to external resources.|
|2|Strict schema/store|Exactowned4files, SQLtests isolate; no directDBsingleton/privateimports.|
|3|Reports/canonical/wholegates|Review bindswholecode; allgateclaimsremain partial.|

Ruling: Standing continuous development authorization replaces routine design/spec/plan approval menus; use architectural written spec and task reviews without pausing. Costs preference rework if the reversible implementation differs from intent; no material provider/footer/spend/launch consent inferred.
Ruling: Implement unverified connection registry before export attempt ledger because current provider connection identity/readiness is absent. Costs a separate foundation slice and later integration; prevents arbitrary account proof and cannot activate export.
Ruling: Opaque UUID credential references are metadata only and never resolved in this slice; readiness remains schema-constrained false. Costs later qualified KMS/OAuth resolver and migration before real accounts; registration cannot claim connectivity.
Ruling: Reject all API-key actors for connection management until an integrations scope/delegation contract is approved and implemented. Costs unavailable API management in this foundation; browser Owner/Admin only, no inferred broad emails:export authority.

Task1 dispatched /root/integration_registry_sql, BASEd06a648758a679d8de8b61b567f805bb30e2441c; ownSQL+DBtests. Root HubSpot optionalquestion resolved by task-scoped direction: require matching company/address, clear mismatch, no silent rewrite/live validation. Exactcurrentpublishedmarketing/CMSschemas403 retained, no schema/transport invented. Exploration /tmp/lettercape-hubspot-footer-design-draft.md; independentregistryexecutioncontinues.

Ruling: Serialize registry mutations with a workspace FOR UPDATE lock before membership/connection locks; avoids same-workspace concurrent account/ID duplicates and authority races. Costs brief registry write serialization and waiting behind workspace authority locks; no global lock.
Ruling: Keep TS text bounds conservative UTF16 while PostgreSQL length uses codepoints. Costs stricter rejection for astral text near local account255/region48 limits; these are local metadata bounds, never provider claims. SQL UUID type malformed casts may return22P02; strict wrappers refuse beforeSQL and SQLexplicitNULL guards remain binding.

Ruling: Fresh fixed-code wrapper errors replace raw SQL/Zod failures and strip PG detail/cause. Unexpected storage/output becomes CONNECTION_STORAGE_UNAVAILABLE; recognized fixedSQL codes preserved. Costs less driver detail for diagnosis, prevents leaking private account/reference values before a future public flow. Task2brief/spec clarified before dispatch, SQLinterface unchanged.

Ruling: SQL UUID values must match pinned z.uuid() acceptance (versions1–8/RFC variant, nil/max, case-insensitive) for workspace/id/credential references, not merely PostgreSQL parseability. Worker self-review identified mismatch; root inspected exact installed Zod regex. Costs rejecting PG-parseable non-RFC bits and coordinated conformance on Zod upgrades; prevents registering rows strict wrappers cannot read. Native malformed syntax still22P02 before typedfunction, wrappers block beforeSQL. Worker adds meaningful bit-patternRED/GREEN parity before taskreview.

Ruling: Preserve per-connection monotonic DB timestamps via greatest(clock_timestamp(),previous updated_at), with revoke using the same instant; output comparison retains microseconds. Costs holding the previous recorded time during a backwards host-clock step, rather than accepting contradictory public history; no client-supplied time.

Ruling: Retain the same tenant-local workspace UPDATE authority lock for the bounded single-connection read helper as for mutations, matching implemented lock order/current-authority tests. Costs serializing registry reads with registry writes and other workspace locks; future high-frequency polling will require explicit lock optimization. No global lock or readiness assumption.

Normalized manually created shortscratch to bundled sdd-workspace canonical datedplan directory after Task1 completion; all20ownedartifacts verified byteidentical. Ownedshort alias preserves exact existing report/loglinks; no siblingplan touched. Only datedownworkspace+ownedalias maybe cleaned after full canonical retention.

Task 1: complete (commits d06a648..c55ba43, review clean). Separate specCOMPLIANT/qualityAPPROVED/0Critical/0Important/0Minor, fullreview/tmp/lettercape-integration-registry-task1-review.md SHAce9fa5b5bed10d8a689bcaee469c37dc0858bcae3c79f1f335ab0b6419bf198c. Workerreport4deb73e0 completebothcommits and10committedDBtests/lint/diff, readiness/Unicode/UUID+microsecondRED and sentinelfixturefailure retained. PostgreSQL crash/restart notperformed, onlytransaction/independentpooldurability; no false restartproof. Task2 strictschemas/wrappers next.

Task1review cannotverify broaderwrapper/fullqualification/canonical checks: assignedTasks2/3, notclaimedcomplete. Original109/221 preservationbeforeproofcaptured, afterproofrequired. Newpool provesconnectionlifetime durability only; rootTask3 will add owned isolatedPostgreSQLcrash/restart proof without stopping sharedoriginalPG or ownedapps. No productionrestore/loadgate inferred.

## Task 1 compile correction and Task 2 completion

Task1 correction5d19e16: erased fixture string annotations; nine typecheck diagnostics retained, GREEN type/lint and emitted-JS equality. Root ONE scoped correction review APPROVED0/0/0; no repeated fullTask1review. Task2 immutable8f68657, fourfiles,23focused tests pass. Worker broad runs retained honestly: final760total/758pass/2existingnative/browser skips; these do not qualify root configured gates.

Ruling: Supersede earlier ruling6 for actual wrapper implementation: use Unicode scalar counts, matching PostgreSQL character_length, rather than earlier proposed conservative UTF16-unit subset. Exact text and no C0/C1/unpairedsurrogates still required; no provider-boundary claim. Cost: scalar iteration/validation rather than simple JS length; removes unnecessary astral-text rejection, no account identity rewriting. Raw pinned z.uuid uppercase MAX sentinel is normalized lowercase before strict parsing; coordinated Zod-version validation still required.

Task2review COMPLIANT/APPROVED0C0I0M, fullreport/tmp/lettercape-integration-registry-task2-review.md. Root exact8f68657 configured760/760/0skip, type/lint/API122/build/allfouractualbrowserjourneys pass. Actual isolatedPG17abruptcrash/restart preservedcommittedv2/history2 and rolledbackpendingv3/history; revoke/replay afterrestartpass. Rootharness3failures and network/readiness/ephemeralport corrections fullyretained; ordinaryownedbridge loopbackpublished, outboundnotdisabled, fetchtrap no providerIO. Linuxsource19unit/hash and runtimecontract/assets/privateexclusion/startuprefusal pass UID1001/networknone; registryunmounted modules testedinbuildstage, nofalseproductionworkerpackagingclaim. No13GAaccepted. ONEwhole immutable review pending.

Task 2: complete (commits5d19e16..8f68657, review clean).

Whole review exactBASEe9e..HEAD8f68657 returned0Critical/1Important/0Minor. I1: crashmanifest computed beforefinally captures currentcontainerlog, staleprior-runhash; noSQL/storeproductiondefect. Fullreview/tmp/lettercape-integration-registry-whole-review.md. ONEcompletecorrectiveworker /root/integration_registry_sql handlesI1andobserved142generatedscratchbundlelintwarnings, preservingoldproof/logs; rootONEscopedreviewwillfollow, nosecondwhole/fixwave.

Ruling: For isolated crash qualification, use a uniquely owned ordinary Docker bridge with strictly loopback-only ephemeral publication after --internal provided no binding; global provider-fetch trap and synthetic local data only. Re-resolve the ephemeral port after restart of SAMEownedcontainer/volume, wait actualTCPPG rather than temporaryUnixsocketinit. Cost: fixture technically has outboundrouting and needscarefulendpoint/ownershipchecks; does not qualify productionnetworkisolation/restore. Allthree failedharnessruns retained, originaldatabase/servicesuntouched.

ONEcomplete correction f0a4ea54ab9a2f3f057182164109994de5c2e71e adds only45line correctiondoc, runtimecodeunchanged. Correctedhelper computes logmanifest afterfinallycapture/ownedcleanup; currentcrashlog4992/90bd... correctlybound, old4979/49eb... preservedarchivedfailure. Freshfull lint0warnings afteronlyhashverifiedredundantscratchbrowserbundleremoved; no lintconfig/source suppression. Originalnative receipt temporarilyannotatedbyroot, exactoriginalbytes recovered/verified250c...andrestored; supplemental native-final receipt separate, fiveaddedmetadatafields only; workerconcurrentread-onlycheckstoppedwithassert1andallprovenanceretainedinfullreport28b658.... One scopedreview pending /tmp/lettercape-integration-registry-correction-review.md. No producttest/crash/build/browser reruns.

ONEscopedcorrection review APPROVED/I1ADDRESSED/0residualCritical/0Important/0Minor; complete/tmp/lettercape-integration-registry-correction-review.md SHA2aea2192f0dfadd75472a6e205e1f30a73039c2f7cfcd2b791fc7bcda5ec4af9. Originalwhole0C1I0M retained; nosecondwhole/fixwave. Rootcanonicaldelivery next, acceptedproductiongatesstill0.

## Allrootcrashharnessfailures — complete retained text

First attempted fixture failed at docker port after pg_isready: internal Docker network produced no published 5432 binding. No migration or seed ran and no original DB read/writes occurred. Finally ownership-checked cleanup removed only nonce6aaceab9c0ec4a76812856154a6bfa32 container/volume/network. Root cause: --internal network publishing unavailable in this Docker setup, unlike existing working loopback-owned PG fixture on ordinary bridge. Single correction: ordinary uniquely owned bridge retaining explicit127.0.0.1 ephemeral port and ownership guards; no claim of outbound network isolation. PG fixture executes only local migrations/wrappers, global provider-fetch trap; synthetic credentials only. Cost: fixture network can technically route outbound, unlike release-image networknone proof. No production network or restore qualification inferred. Traceback retained in tool transcript and this complete failure record.

Second attempt bound loopback successfully, but Unix-socket pg_isready accepted the official image temporary initialization server. The image subsequently stops it before real TCP startup, terminating migration connection. Migration failed before applied logs; retained migration-first-failure.log; owned cleanup performed. Single precise readiness correction: pg_isready -h127.0.0.1 inside fixture, which cannot accept the socket-only temporary server. Container startup/crash logs now retained before ownership-cleanup to corroborate boundary. No product SQL/wrapper changes.

Third attempted harness reached real seed, commit, pending transaction, abrupt KILL and PostgreSQL recovery; verify connected to stale Docker-assigned ephemeral host port and refused. All logs/markers retained in failed-after-actual-crash. PostgreSQL startup logs corroborate real automatic WAL recovery. Architecture re-evaluated: own container and volume are stable identity; an empty requested host port intentionally permits Docker to assign a new ephemeral port each start. The harness must re-resolve and strictly validate current127.0.0.1 non55439 publication after restarting the same ownedcontainer, then refresh its synthetic descriptor. This corrects a boundary assumption, not product persistence. Standing task-scoped authorization permits reversible fixture corrections despite routine skill discussion menu; cost is explicit additional fixture run/evidence handling. No provider readiness or production restore acceptance claimed.

## Verbatim root failed tool outputs — complete retained text

Verbatim returned tool output: first attempt, chunk38d0df, exit1. No migration/seed ran.
Traceback (most recent call last):
  File "/tmp/lettercape-integration-registry-crash-qualify.py", line 22, in <module>
    ready();port=run(['docker','port',name,'5432/tcp']).stdout.decode().strip();assert re.fullmatch(r'127\.0\.0\.1:[0-9]+',port);assert not port.endswith(':55439')
  File "/tmp/lettercape-integration-registry-crash-qualify.py", line 6, in run
    def run(cmd):return subprocess.run(cmd,check=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
  File "/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/lib/python3.9/subprocess.py", line 528, in run
    raise CalledProcessError(retcode, process.args,
subprocess.CalledProcessError: Command '['docker', 'port', 'lettercape_registry_crash_6aaceab9c0ec4a76812856154a6bfa32', '5432/tcp']' returned non-zero exit status 1.

Verbatim returned tool output: second attempt, chunkacf59c, exit1. Migration stderr separately retained in crash-logs/migration-first-failure.log.
Traceback (most recent call last):
  File "/tmp/lettercape-integration-registry-crash-qualify.py", line 28, in <module>
    result=subprocess.run(['/usr/local/bin/node','--import','tsx','scripts/migrate.ts'],cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);(logs/'migrate.log').write_bytes(result.stdout);assert result.returncode==0,'Owned migration failed; retained log.'
AssertionError: Owned migration failed; retained log.

Verbatim returned tool output: third attempt, chunk5dc60d, exit1. Actual seed/pending crash passed; verify stderr and container recovery log archived under failed-after-actual-crash.
Traceback (most recent call last):
  File "/tmp/lettercape-integration-registry-crash-qualify.py", line 38, in <module>
    owned('container',name);run(['docker','start',name]);ready();node('verify')
  File "/tmp/lettercape-integration-registry-crash-qualify.py", line 16, in node
    (logs/(stage+'.log')).write_bytes(result.stdout);assert result.returncode==0,'Owned fixture '+stage+' failed; retained log.'
AssertionError: Owned fixture verify failed; retained log.

One root functions.exec JavaScript argument syntax error occurred while preparing the immutable whole-review package. It executed no shell or mutation; corrected call succeeded. Separate discovery reads of nonexistent guessed helper/module paths were corrected using rg --files; no qualification claim came from those failed reads. All outputs are retained in the tool transcript; relevant concrete failure output above is transcribed verbatim, not a replay.

## HubSpot approved matching-footer exploration — complete retained text

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

## Qualifiednativecandidatewithsupplementalcleanlint

```json
{
  "head": "8f686578cd6fce2488bac4423f65f89feecc32c8",
  "checks": [
    {
      "name": "full-suite",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-source-truth.ts",
        "--suite"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-full-suite.log",
      "sha256": "2f1bb70ecff93281dc02b3d8a0bd380e7bd8f016543b7dd9f964e847c95c543e"
    },
    {
      "name": "type",
      "command": [
        "npm",
        "run",
        "typecheck"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-type.log",
      "sha256": "e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6"
    },
    {
      "name": "lint",
      "command": [
        "npm",
        "run",
        "lint"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-lint.log",
      "sha256": "508ee4c4c738e0b4d0dcef8064f4860f6de0618b68400c902ac54a21b4567e77"
    },
    {
      "name": "api",
      "command": [
        "npm",
        "run",
        "api:check"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-api.log",
      "sha256": "ab290f6bee02e1fcfa50627a9b4ecd92b7ab23d8bdeacf6560075c6f1d46140f"
    },
    {
      "name": "build",
      "command": [
        "npm",
        "run",
        "build"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-build.log",
      "sha256": "13ec915354826069404742f260cb41e22545e2f27cc453eca3c8ac4c36eba479"
    },
    {
      "name": "brevo-browser",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-brevo-export.ts"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-brevo-browser.log",
      "sha256": "b66673982fa7af1f8cf9a0cbb56980377708fbdaa5dd1aadf9759c6ba8e288dc"
    },
    {
      "name": "omnisend-browser",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-omnisend-export.ts"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-omnisend-browser.log",
      "sha256": "6756f4ca9c989be5e1150f3b066963a7f4729c66f3f2aebc7a9385606e021817"
    },
    {
      "name": "mailchimp-browser",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-mailchimp-export.ts"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-mailchimp-browser.log",
      "sha256": "f31637df9f5fed30b4b028532e170bcd6e160ddc454fa7037afc30d6692ff05d"
    },
    {
      "name": "klaviyo-browser",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-klaviyo-export.ts"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-klaviyo-browser.log",
      "sha256": "815ba9545226eb9c5aa82b739db6d224331660fab705f6fb78b3a9a45b827b76"
    }
  ],
  "deployment": false,
  "initial_lint_warnings": 142,
  "initial_lint_warning_scope": "owned generated scratch browser bundle; original log retained",
  "final_lint": {
    "log": "/tmp/lettercape-integration-registry-correction-lint.log",
    "sha256": "177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746",
    "exit": 0,
    "warnings": 0,
    "errors": 0
  },
  "mobile_pixel_inspected": true,
  "mobile_image": "/tmp/lettercape-brevo-mobile.png"
}
```

## Originalnativecandidatewithwarningreceipt

```json
{
  "head": "8f686578cd6fce2488bac4423f65f89feecc32c8",
  "checks": [
    {
      "name": "full-suite",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-source-truth.ts",
        "--suite"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-full-suite.log",
      "sha256": "2f1bb70ecff93281dc02b3d8a0bd380e7bd8f016543b7dd9f964e847c95c543e"
    },
    {
      "name": "type",
      "command": [
        "npm",
        "run",
        "typecheck"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-type.log",
      "sha256": "e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6"
    },
    {
      "name": "lint",
      "command": [
        "npm",
        "run",
        "lint"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-lint.log",
      "sha256": "508ee4c4c738e0b4d0dcef8064f4860f6de0618b68400c902ac54a21b4567e77"
    },
    {
      "name": "api",
      "command": [
        "npm",
        "run",
        "api:check"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-api.log",
      "sha256": "ab290f6bee02e1fcfa50627a9b4ecd92b7ab23d8bdeacf6560075c6f1d46140f"
    },
    {
      "name": "build",
      "command": [
        "npm",
        "run",
        "build"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-build.log",
      "sha256": "13ec915354826069404742f260cb41e22545e2f27cc453eca3c8ac4c36eba479"
    },
    {
      "name": "brevo-browser",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-brevo-export.ts"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-brevo-browser.log",
      "sha256": "b66673982fa7af1f8cf9a0cbb56980377708fbdaa5dd1aadf9759c6ba8e288dc"
    },
    {
      "name": "omnisend-browser",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-omnisend-export.ts"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-omnisend-browser.log",
      "sha256": "6756f4ca9c989be5e1150f3b066963a7f4729c66f3f2aebc7a9385606e021817"
    },
    {
      "name": "mailchimp-browser",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-mailchimp-export.ts"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-mailchimp-browser.log",
      "sha256": "f31637df9f5fed30b4b028532e170bcd6e160ddc454fa7037afc30d6692ff05d"
    },
    {
      "name": "klaviyo-browser",
      "command": [
        "node",
        "--import",
        "tsx",
        "scripts/smoke-klaviyo-export.ts"
      ],
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-native-klaviyo-browser.log",
      "sha256": "815ba9545226eb9c5aa82b739db6d224331660fab705f6fb78b3a9a45b827b76"
    }
  ],
  "deployment": false
}
```

## Correctedcrashproof

```json
{
  "source_head": "8f686578cd6fce2488bac4423f65f89feecc32c8",
  "postgres_image_id": "sha256:d4bb0a8c1b7bb2e29f976d099e7bfb9a5d8858cffe9e46b35cd302cd1f1f8168",
  "postgres_platform": "linux/arm64",
  "owned_container": "9b0c7ba24b106d9cca45d38496d9a50d0edaf3d8114fb341ecdfdd466c0dfe41",
  "uniquely_owned_network": true,
  "network_outbound_disabled": false,
  "loopback_only_ephemeral_port": true,
  "committed_state_and_history_preserved": true,
  "uncommitted_state_and_history_rolled_back": true,
  "actual_strict_wrappers": true,
  "readiness_false": true,
  "operations_outbox_usage_zero": true,
  "provider_io": false,
  "original_shared_postgres_stopped_or_written": false,
  "production_restore_or_release_gate_accepted": false,
  "logs": [
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/migrate.log",
      "bytes": 1118,
      "sha256": "0b877eebefea5339a4dcda979a846a3019777ab8da8f953f2eeff64a3715694a"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/migration-first-failure.log",
      "bytes": 754,
      "sha256": "9f1c4e88508477a6e39633026d0bdfb621299eb7503bf5c16514efca53ebde9b"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/pending.log",
      "bytes": 101,
      "sha256": "96914729786dbf932a2e4b22c20638976b42e3adf15de375dc81ae431b6fef40"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/postgres-container.log",
      "bytes": 4992,
      "sha256": "90bd9b5aa3fc4407b67bfa61d655a11702f4aa62f209c884f961a206554bd3a7"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/seed.log",
      "bytes": 111,
      "sha256": "03715ac3068be0b240b0a14fa80935088e7622ec1227dc22d58cd1b5f088dbba"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/verify.log",
      "bytes": 219,
      "sha256": "be454399fc76db3611c9200570275f9a029ccdecd9ca350a8881b34a1d8d6ef3"
    }
  ],
  "only_owned_fixture_container_volume_network_cleaned": true
}
```

## Precorrectioncrashproof

```json
{
  "source_head": "8f686578cd6fce2488bac4423f65f89feecc32c8",
  "postgres_image_id": "sha256:d4bb0a8c1b7bb2e29f976d099e7bfb9a5d8858cffe9e46b35cd302cd1f1f8168",
  "postgres_platform": "linux/arm64",
  "owned_container": "9b0c7ba24b106d9cca45d38496d9a50d0edaf3d8114fb341ecdfdd466c0dfe41",
  "uniquely_owned_network": true,
  "network_outbound_disabled": false,
  "loopback_only_ephemeral_port": true,
  "committed_state_and_history_preserved": true,
  "uncommitted_state_and_history_rolled_back": true,
  "actual_strict_wrappers": true,
  "readiness_false": true,
  "operations_outbox_usage_zero": true,
  "provider_io": false,
  "original_shared_postgres_stopped_or_written": false,
  "production_restore_or_release_gate_accepted": false,
  "logs": [
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/migrate.log",
      "bytes": 1118,
      "sha256": "0b877eebefea5339a4dcda979a846a3019777ab8da8f953f2eeff64a3715694a"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/migration-first-failure.log",
      "bytes": 754,
      "sha256": "9f1c4e88508477a6e39633026d0bdfb621299eb7503bf5c16514efca53ebde9b"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/pending.log",
      "bytes": 101,
      "sha256": "96914729786dbf932a2e4b22c20638976b42e3adf15de375dc81ae431b6fef40"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/postgres-container.log",
      "bytes": 4979,
      "sha256": "49eb4b5abf6f81e28e77eadc53f0f4e363a1cf141f211bb1963fa31097a7792a"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/seed.log",
      "bytes": 111,
      "sha256": "03715ac3068be0b240b0a14fa80935088e7622ec1227dc22d58cd1b5f088dbba"
    },
    {
      "path": "/tmp/lettercape-integration-registry-crash-logs/verify.log",
      "bytes": 219,
      "sha256": "be454399fc76db3611c9200570275f9a029ccdecd9ca350a8881b34a1d8d6ef3"
    }
  ],
  "only_owned_fixture_container_volume_network_cleaned": true
}
```

## QualifiedLinuxsource/runtime

```json
{
  "head": "8f686578cd6fce2488bac4423f65f89feecc32c8",
  "deployment": false,
  "images": {
    "build": {
      "tag": "lettercape-integration-registry-check:build",
      "id": "sha256:d20ff2e3b02a05da59db3c23363b88e4a0bbda1a8fca2e9ecc92d0a4e53e2bb0",
      "platform": "linux/arm64",
      "source_head": "8f686578cd6fce2488bac4423f65f89feecc32c8",
      "oci_config_id": "sha256:cf26d9ee85779d86d121fce17ce2fe960a1486600b73a226523b2c20ee899db3"
    },
    "runtime": {
      "tag": "lettercape-integration-registry-check:runtime",
      "id": "sha256:819af614a5c9e47c917b3781bb35afcd143c282b397539925dbed57c892b7e2e",
      "platform": "linux/arm64",
      "source_head": "8f686578cd6fce2488bac4423f65f89feecc32c8",
      "oci_config_id": "sha256:b04024f66d155b13e5a183868a2105b60de037adc02ce3c2364bd5ac9eba26a2"
    }
  },
  "checks": [
    {
      "name": "build-build",
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-linux-build-build.log",
      "sha256": "279dc9c465840f2a0c8e1530e20a8fa7833371336ddce706f7a563587a4a02c1"
    },
    {
      "name": "source-unit",
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-linux-source-unit.log",
      "sha256": "9ec8922cf2cd17fe04cacb7333c215db38cfe9080bc0f482416a30ee4e6e9691"
    },
    {
      "name": "source-probe",
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-linux-source-probe.log",
      "sha256": "aceec27ca7be742eeadc12066f90d8156e7ec9b547ac17869910bcdab0934404"
    },
    {
      "name": "runtime-build",
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-linux-runtime-build.log",
      "sha256": "498d4c1da1cf2fe89831fb3675de91b951ac663c5690c86cd9eb705e716d1396"
    },
    {
      "name": "runtime-probe",
      "exit": 0,
      "log": "/tmp/lettercape-integration-registry-linux-runtime-probe.log",
      "sha256": "62470a8a3371ebf17d9a344d6fa684961e68f421267e6fa84eac7ee23d1d3dcb"
    },
    {
      "name": "runtime-startup",
      "exit": 1,
      "log": "/tmp/lettercape-integration-registry-linux-runtime-startup.log",
      "sha256": "e331306af1367c23fa850fb3f6d9708b5f8bba6bf376512ce7139dd1516c5754"
    }
  ],
  "registry_runtime_entrypoint_mounted": false,
  "registry_source_tested": true
}
```

## Ownedtaskartifactretentionmap

```json
[
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-correction-lint.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-correction-lint.log",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-correction-runtime-equivalence.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-correction-runtime-equivalence.log",
    "bytes": 194,
    "sha256": "8af3ce10c3fac848e49a96986bf97a76e0b8198a3cbc998f73da23982581157d"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-correction-typecheck-green.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-correction-typecheck-green.log",
    "bytes": 45,
    "sha256": "e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-correction-typecheck-red.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-correction-typecheck-red.log",
    "bytes": 4255,
    "sha256": "d102d5d8adf59cc5fcb647be0b8d4c851cf04d5ded6985aab1452905fad8017d"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-final-db-parity.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-final-db-parity.log",
    "bytes": 1155,
    "sha256": "c324cde6ee36920c90d4ff0bf680a4c072d781de0b00e82791c6389205d96970"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-final-db.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-final-db.log",
    "bytes": 1061,
    "sha256": "3d6c742980dc09a46b40357ff0360cb688109a0761fe3dbed86e0a8fe64aabd6"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-final-lint.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-final-lint.log",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-green-1.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-green-1.log",
    "bytes": 849,
    "sha256": "a5c2e43043f6aa451868a3f7f34ebadc55d05686af8d167fe6bc397e838dccfe"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-green-2.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-green-2.log",
    "bytes": 847,
    "sha256": "75860eb99d841ba02e2847acb2fc811f235f626098acdeb9eb22661afe9b52d3"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-green-3.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-green-3.log",
    "bytes": 1057,
    "sha256": "bcd87162f87e6e0cb0f1da7057fe67b035fecf9faf865a2172c3f2ac2a2416b5"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-lint-1.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-lint-1.log",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-lint-2.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-lint-2.log",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-parity-final-lint.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-parity-final-lint.log",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-parity-green-2.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-parity-green-2.log",
    "bytes": 1163,
    "sha256": "81bd4ac1b258628a9bd74184d002ea52c39688471b45e032fe7d0ca57e1ae9f6"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-parity-green-3.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-parity-green-3.log",
    "bytes": 1158,
    "sha256": "5e1479037db29f1013c72e593eabc3af8ab4598593ed39f1f852e2875218bf55"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-parity-green.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-parity-green.log",
    "bytes": 2303,
    "sha256": "10a4d5c717fa3384357e0331349d013a3eae289172987d2cfad54643f2c53b13"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-parity-lint.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-parity-lint.log",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-parity-red.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-parity-red.log",
    "bytes": 2623,
    "sha256": "53094749e63361bae36b153badaac3a7e7238934cd86a494d5e01a755e0f5c28"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-red.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-red.log",
    "bytes": 1399,
    "sha256": "cc75a849b60d28a3841c0c6dd8951d7f37d64e18ccda76dde5e922b2e751c97c"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/logs/task-1-unicode-red.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/logs/task-1-unicode-red.log",
    "bytes": 1179,
    "sha256": "4967dd2cf32ebb124b1f50cb31f38c429deff70839d6538ebbff9792d09b9cdc"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/plan-path",
    "retained": "/tmp/lettercape-integration-registry-task-logs/plan-path",
    "bytes": 58,
    "sha256": "5aef8ff3ccd8f9bad2907ca12dc49e2e6303b30bcef0f87670752bcc0f040746"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/progress.md",
    "retained": "/tmp/lettercape-integration-registry-task-logs/progress.md",
    "bytes": 9819,
    "sha256": "f502b0b196f971d428e50b88fb0b3f653b1d94f14b3b1f9975c0ef6c6ec0f67d"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-1-brief.md",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-1-brief.md",
    "bytes": 10289,
    "sha256": "8684512af737d41874f45b4200314b649dfc69b36f4b0237d4949978e8d24668"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-1-report.md",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-1-report.md",
    "bytes": 22072,
    "sha256": "d7d2d775d860549c02b79b52ddac37b9ef920bb591e5d48d965650180b74aa79"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-brief.md",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-brief.md",
    "bytes": 12526,
    "sha256": "d5ec290ddd8da347ac88f1c5919fd72c865dc5e6c0d5cc00897acd7ea9529526"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/01-red.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/01-red.log",
    "bytes": 11251,
    "sha256": "20c05a08b242cff726c29894e27fa3e24d6a6a0a849ab2afac9103a9588abd5f"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/02-unit-green.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/02-unit-green.log",
    "bytes": 2523,
    "sha256": "0bfed46e0d274bf204238d793144a929d2417717592ba12f64773e6ac35d66e4"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/03-unit-db-green.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/03-unit-db-green.log",
    "bytes": 4676,
    "sha256": "f5d35ddf8353422e6634e134ba5308dd0fb0fc43117bc8bb4738d073b8d65b89"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/04-unit-db-approved.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/04-unit-db-approved.log",
    "bytes": 1515,
    "sha256": "b91ec103b7a905e38db88b016f2a2bc73bea85b722fb06d52f77c63a040219bc"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/05-typecheck.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/05-typecheck.log",
    "bytes": 4255,
    "sha256": "d102d5d8adf59cc5fcb647be0b8d4c851cf04d5ded6985aab1452905fad8017d"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/06-lint.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/06-lint.log",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/07-configured-full-suite.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/07-configured-full-suite.log",
    "bytes": 76562,
    "sha256": "4d3957314759a1388adb37bf58334e3646d77a0cc09bea8ea01bdeb5a3016ed3"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/08-red-boundary-replay.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/08-red-boundary-replay.log",
    "bytes": 18156,
    "sha256": "4a6abc3130c438a1f5a2f920f97933285aaa1455b0b1e2fc42a5fc343b51261d"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/09-final-unit-db.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/09-final-unit-db.log",
    "bytes": 1995,
    "sha256": "bc62ba93ac4d8126a5c1ff83a6ae6ceb6f283c476b1690f1a721c2ce35da0ede"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/10-browser-bundle.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/10-browser-bundle.log",
    "bytes": 98,
    "sha256": "64c2319639e88ead270002011c66b7980f8842183781bfe7d098c6779cb3815e"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/11-final-lint.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/11-final-lint.log",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/12-final-typecheck.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/12-final-typecheck.log",
    "bytes": 45,
    "sha256": "e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/13-staged-diff-check.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/13-staged-diff-check.log",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/14-commit.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/14-commit.log",
    "bytes": 352,
    "sha256": "0cc4691419f7c0c83a1cd6b88e2179c02c85f31d376d879d612db9dd758d81cf"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/15-final-configured-full-suite.log",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/15-final-configured-full-suite.log",
    "bytes": 77086,
    "sha256": "04ffe35cbf02304ad3bff42067473d0cd7a95340ec47676b4e3b7fee69068401"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/artifact-sha256.json",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/artifact-sha256.json",
    "bytes": 4436,
    "sha256": "6aa974da8e9189b57acf2b1d28450e992732eaec1c255f3b60bc85130cb1a595"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/domain-browser-bundle.mjs",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/domain-browser-bundle.mjs",
    "bytes": 756628,
    "sha256": "9d2cb3712cab1647d8b3c7f028a71fedc0f3c37dd410c0b9e1e48b382f1384b3",
    "source_removed_after_verified_retention": true
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/domain-green-snapshot.ts.txt",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/domain-green-snapshot.ts.txt",
    "bytes": 2987,
    "sha256": "ecace74e5298fbbbdba47503f6a6c07a89226ee0750da92bb6b5ec2afe2cf77a"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/domain-red-scaffold.ts.txt",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/domain-red-scaffold.ts.txt",
    "bytes": 554,
    "sha256": "7eab6f46288301a732a246dc72375849b2bd7b90c5d2c08c6e0e7eafd954a8a8"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/server-green-snapshot.ts.txt",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/server-green-snapshot.ts.txt",
    "bytes": 3124,
    "sha256": "b9c46cc75a95e94f09f659ee394c4f6c47cc556ad07870e5bc12eb7fbb644a2b"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/server-red-scaffold.ts.txt",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/server-red-scaffold.ts.txt",
    "bytes": 1120,
    "sha256": "0fafb339db451c57bb4f9c68930ead6ff1a02a6c390d77079b036620e156d654"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-evidence/source-sha256.json",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-evidence/source-sha256.json",
    "bytes": 636,
    "sha256": "a0eb4ceccc2e808614a07da12d8b51b503c730e935674b3f7135a816ebae3760"
  },
  {
    "source": "/tmp/lettercape-integration-registry-native/.superpowers/sdd/2026-10-03-integration-registry/task-2-report.md",
    "retained": "/tmp/lettercape-integration-registry-task-logs/task-2-report.md",
    "bytes": 14547,
    "sha256": "480bfe67d23bcf70b27d2c3c705752f6d1ecbf7c03ea98b6c3ea806a19aea8a5"
  }
]
```

## Originalbeforeproof

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

## Freshpredeliverypreservation

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

## Corrected reproducible isolatedcrashharness

```
from pathlib import Path
import subprocess,json,uuid,time,os,re,hashlib
root=Path('/tmp/lettercape-integration-registry-native');nonce=uuid.uuid4().hex;name='lettercape_registry_crash_'+nonce;volume=name+'_pg';network=name+'_net';image='sha256:d4bb0a8c1b7bb2e29f976d099e7bfb9a5d8858cffe9e46b35cd302cd1f1f8168';label='lettercape.fixture='+nonce
logs=Path('/tmp/lettercape-integration-registry-crash-logs');logs.mkdir(exist_ok=True)
created_volume=created_network=created_container=False;pending=None;descriptor_path=Path('/tmp/lettercape-integration-registry-crash-descriptor.json');head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root).decode().strip()
def run(cmd):return subprocess.run(cmd,check=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
def owned(kind,n):
 item=json.loads(run(['docker',kind,'inspect',n]).stdout)[0];labels=item.get('Labels')if kind!='container'else item['Config']['Labels'];assert labels.get('lettercape.fixture')==nonce;return item
def ready():
 for _ in range(150):
  if subprocess.run(['docker','exec',name,'pg_isready','-h','127.0.0.1','-U','registry_fixture','-d','registry_fixture'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0:return
  time.sleep(.2)
 raise RuntimeError('Owned fixture readiness timed out')
def node(stage):
 result=subprocess.run(['/usr/local/bin/node','--import','tsx','/tmp/lettercape-integration-registry-crash.mts',str(descriptor_path),stage],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 (logs/(stage+'.log')).write_bytes(result.stdout);assert result.returncode==0,'Owned fixture '+stage+' failed; retained log.'
try:
 run(['docker','volume','create','--label',label,volume]);created_volume=True;owned('volume',volume)
 run(['docker','network','create','--label',label,network]);created_network=True;assert owned('network',network)['Internal']is False
 container=run(['docker','run','-d','--pull=never','--name',name,'--label',label,'--network',network,'-p','127.0.0.1::5432','-v',volume+':/var/lib/postgresql/data','-e','POSTGRES_USER=registry_fixture','-e','POSTGRES_PASSWORD=registry_fixture_password','-e','POSTGRES_DB=registry_fixture',image]).stdout.decode().strip();created_container=True
 item=owned('container',name);assert item['Id']==container and item['Image']==image
 ready();port=run(['docker','port',name,'5432/tcp']).stdout.decode().strip();assert re.fullmatch(r'127\.0\.0\.1:[0-9]+',port);assert not port.endswith(':55439')
 descriptor={'url':'postgresql://registry_fixture:registry_fixture_password@'+port+'/registry_fixture','workspace':str(uuid.uuid4()),'id':str(uuid.uuid4()),'user':'registry-crash-'+nonce,'reference1':str(uuid.uuid4()),'reference2':str(uuid.uuid4()),'reference3':str(uuid.uuid4()),'committed':'/tmp/lettercape-integration-registry-crash-committed.json','pending':'/tmp/lettercape-integration-registry-crash-pending.json'}
 descriptor_path.write_text(json.dumps(descriptor)+'\n');descriptor_path.chmod(0o600)
 for key in ['committed','pending']:
  p=Path(descriptor[key]);assert not p.exists(),'Owned fixture prior stage marker exists; avoid blind overwrite.'
 env=os.environ.copy();env.update({'LOCAL_DEVELOPMENT':'true','MIGRATION_DATABASE_URL':descriptor['url']})
 result=subprocess.run(['/usr/local/bin/node','--import','tsx','scripts/migrate.ts'],cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);(logs/'migrate.log').write_bytes(result.stdout);assert result.returncode==0,'Owned migration failed; retained log.'
 node('seed')
 pending_log=(logs/'pending.log').open('wb');pending=subprocess.Popen(['/usr/local/bin/node','--import','tsx','/tmp/lettercape-integration-registry-crash.mts',str(descriptor_path),'pending'],cwd=root,stdout=pending_log,stderr=subprocess.STDOUT)
 for _ in range(150):
  if Path(descriptor['pending']).exists():break
  if pending.poll()is not None:raise RuntimeError('Owned pending helper exited before marker')
  time.sleep(.1)
 else:raise RuntimeError('Owned pending marker timed out')
 marker=json.loads(Path(descriptor['pending']).read_text());assert marker['commit_issued']is False and marker['record_version']==3
 owned('container',name);run(['docker','kill','--signal','KILL',name]);assert pending.wait(timeout=10)==0;pending_log.close()
 owned('container',name);run(['docker','start',name]);ready();
 port=run(['docker','port',name,'5432/tcp']).stdout.decode().strip();assert re.fullmatch(r'127\.0\.0\.1:[0-9]+',port) and not port.endswith(':55439')
 descriptor['url']='postgresql://registry_fixture:registry_fixture_password@'+port+'/registry_fixture';descriptor_path.write_text(json.dumps(descriptor)+'\n');descriptor_path.chmod(0o600);node('verify')
 proof={'source_head':head,'postgres_image_id':image,'postgres_platform':'linux/arm64','owned_container':container,'uniquely_owned_network':True,'network_outbound_disabled':False,'loopback_only_ephemeral_port':True,'committed_state_and_history_preserved':True,'uncommitted_state_and_history_rolled_back':True,'actual_strict_wrappers':True,'readiness_false':True,'operations_outbox_usage_zero':True,'provider_io':False,'original_shared_postgres_stopped_or_written':False,'production_restore_or_release_gate_accepted':False,'logs':[]}
finally:
 if pending is not None and pending.poll()is None:pending.kill();pending.wait(timeout=10)
 if created_container:
  owned('container',name);(logs/'postgres-container.log').write_bytes(run(['docker','logs',name]).stdout);run(['docker','rm','-f',name])
 if created_volume:owned('volume',volume);run(['docker','volume','rm',volume])
 if created_network:owned('network',network);run(['docker','network','rm',network])
if 'proof'in globals():
 proof['only_owned_fixture_container_volume_network_cleaned']=True
 for p in sorted(logs.glob('*.log')):b=p.read_bytes();proof['logs'].append({'path':str(p),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
 Path('/tmp/lettercape-integration-registry-crash-proof.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
```

## Actualstrictwrapper crashstages

```
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
const require=createRequire('/tmp/lettercape-integration-registry-native/package.json');
const pg=require('pg');
const descriptor=JSON.parse(await readFile(process.argv[2],'utf8'));
const u=new URL(descriptor.url);
assert.equal(u.hostname,'127.0.0.1');assert.notEqual(u.port,'55439');assert.equal(u.pathname,'/registry_fixture');assert.equal(u.username,'registry_fixture');
const store=await import('/tmp/lettercape-integration-registry-native/src/server/integration-registry.ts');
const pool=new pg.Pool({connectionString:descriptor.url});
const {workspace,id,user,reference1,reference2,reference3}=descriptor;
const input={id,provider:'klaviyo' as const,external_account_id:'owned-crash-fixture-account',auth_mode:'oauth' as const,region:'owned-fixture',credential_reference:reference1};
globalThis.fetch=async()=>{throw Error('Fixture external calls prohibited');};
async function tx(fn:(c:any)=>Promise<any>){const c=await pool.connect();try{await c.query('BEGIN');await c.query('SET LOCAL ROLE mailcraft_runtime');await c.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[workspace,user]);const result=await fn(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}}
const stage=process.argv[3];
try{
 if(stage==='seed'){
  await pool.query("INSERT INTO workspaces(id,name)VALUES($1,'Owned isolated registry crash fixture')",[workspace]);
  await pool.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[workspace,user]);
  const registered=await tx(c=>store.registerIntegration(c,workspace,input));assert.equal(registered.can_export,false);assert.equal(registered.record_version,1);
  const committed=await tx(c=>store.rotateIntegration(c,workspace,id,{expected_record_version:1,credential_reference:reference2}));assert.equal(committed.record_version,2);assert.equal(committed.credential_version,2);assert.equal(committed.can_export,false);
  await writeFile(descriptor.committed,JSON.stringify(committed)+'\n');console.log('Actual strict wrapper registered and committed rotation with atomic history in owned isolated PostgreSQL PASS.');
 }else if(stage==='pending'){
  const c=await pool.connect();let begun=false;
  try{
   await c.query('BEGIN');begun=true;await c.query('SET LOCAL ROLE mailcraft_runtime');await c.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[workspace,user]);
   const rotated=await store.rotateIntegration(c,workspace,id,{expected_record_version:2,credential_reference:reference3});assert.equal(rotated.record_version,3);
   const lost=new Promise<void>(resolve=>c.once('error',()=>resolve()));
   await writeFile(descriptor.pending,JSON.stringify({stage:'uncommitted_rotation_written',record_version:rotated.record_version,commit_issued:false})+'\n');
   await lost;begun=false;console.log('Owned PostgreSQL crash terminated the actual uncommitted wrapper transaction; no commit issued PASS.');
  }finally{if(begun)await c.query('ROLLBACK').catch(()=>{});c.release(true);}
 }else if(stage==='verify'){
  const expected=JSON.parse(await readFile(descriptor.committed,'utf8'));const actual=await tx(c=>store.readIntegration(c,workspace,id));assert.deepEqual(actual,expected);
  const rows=(await pool.query('SELECT record_version,credential_version,credential_reference,event FROM integration_connection_history WHERE workspace_id=$1 AND connection_id=$2 ORDER BY record_version',[workspace,id])).rows;
  assert.equal(rows.length,2);assert.deepEqual(rows.map((r:any)=>[r.record_version,r.credential_version,r.credential_reference]),[[1,1,reference1],[2,2,reference2]]);
  const state=(await pool.query('SELECT credential_reference,can_export,verified_at FROM integration_connections WHERE workspace_id=$1 AND id=$2',[workspace,id])).rows[0];assert.equal(state.credential_reference,reference2);assert.equal(state.can_export,false);assert.equal(state.verified_at,null);
  for(const table of ['operations','outbox','usage_ledger'])assert.equal((await pool.query('SELECT count(*)::int AS n FROM '+table)).rows[0].n,0);
  const revoked=await tx(c=>store.revokeIntegration(c,workspace,id));assert.equal(revoked.state,'revoked');assert.equal(revoked.record_version,3);assert.equal(revoked.credential_version,2);
  assert.deepEqual(await tx(c=>store.registerIntegration(c,workspace,input)),revoked);assert.deepEqual(await tx(c=>store.revokeIntegration(c,workspace,id)),revoked);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM integration_connection_history')).rows[0].n,3);
  console.log('Actual owned PostgreSQL abrupt crash/restart preserves committed binding+history, rolls back both uncommitted state+history, restores strict read/revoke/replay with readinessfalse and zero operations/outbox/usage PASS.');
 }else throw Error('Unknown owned fixture stage');
}finally{await pool.end();}
```
