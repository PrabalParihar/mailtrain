# Submission ledger implementer and independent review records

Retained development records preserve original failures and findings followed by bounded correction verdicts. Each review binds its inspected source version; later reports record subsequent changes. Final task corrections pass;920 configured tests,18 browser checks and build/type/lint/API137 pass. Immutable whole review and canonical publication remain pending; no full GA acceptance is inferred.

## task-1-report.md

# Task 1 — durable staged recipient storage and worker

Implemented the eight assigned Task 1 source/test paths plus the explicitly root-authorized no-network CLI preload fixture. No commits, pushes, providers, original database mutations, private config copies/hashes, app restarts, or existing worker changes. The generated PostgreSQL fixture used the existing `sourceDatabase` guarded mirror loader in memory, created disposable UUID databases and dropped those databases. Loopback tests required sandbox escalation and were approved. The original 109 emails / 221 revisions and app/media/recipient workers were not touched by these task actions; parent owns final original-source hash verification.

## Deliverables and contracts

Migration 037 creates the six specified tables with workspace composite FKs, forced RLS, current Owner/Admin manager policies, runtime least privileges, and DELETE/TRUNCATE guards. A configuration has a single permanent ledger; recipient identities are unique by workspace/configuration/contact and deliveries by recipient. The database derives `logical_send_key` as SHA256 of canonical `JSON.stringify([workspace,configuration_id,contact_id])` UUID bytes. No jsonb whitespace enters the identity. Historical contact IDs deliberately have no live-contact FK.

Immutable manifest guards verify campaign configuration/revision/artifact/snapshot pins and exact sorted members. Recipient guards derive captured reason/locale/consent version from the manifest. Initial pending/skipped states and pending→cancelled are the only admitted delivery transitions; outcome stays unknown and authorization false. Runtime has SELECT only on attempts, and CHECK(false) also blocks attempts from privileged SQL until a future qualified migration. History is appended through the existing NOLOGIN non-bypass narrow trigger role; runtime cannot append history. Deferred commit guards require exact recipient/delivery/progress agreement and atomic cancellation. Per-job transaction accounting prevents a second call from exceeding 100 new recipients in one transaction.

Browser-safe domain exports all requested strict schemas/types. No Node dependency is imported by the domain module. Services export the exact eight operations and `assertSubmissionAuthority`. Authority precedes keyed receipt lookup; VERSION_CONFLICT, DIGEST_CONFLICT and STATE_CONFLICT appear only inside create's original keyed callback after receipt lookup. Root can safely use the narrowly specified definitive-conflict recovery classification. Query schemas reject duplicates/empty/unknown values; recipient state is signed into paging filters. No temporary paging casts remain.

Worker exports `processSubmissionLedgerBatch(tx,p)` with caller-owned transactions, SKIP LOCKED job selection, current worker/creator/key/campaign rechecks, sorted captured batches at most 100, immutable source drift preservation, and cancellation of staged pending rows after revocation/campaign cancellation. API keys and local sessions cannot act as trusted workers. CLI is development/loopback only, requires explicit workspace/actor, refuses production/remote database configuration, and does no dispatch.

## RED and GREEN

- Domain RED: `node --import tsx --test tests/submission-ledgers.test.ts tests/submission-ledgers-db.test.ts` failed at `strict staged ledger domain is missing` before domain implementation. The initial sandbox PostgreSQL connection was blocked; it was not claimed as storage RED.
- Actual restricted PostgreSQL RED: approved `node --import tsx --test tests/submission-ledgers-db.test.ts` failed at `submission_ledgers must exist with forced RLS` before migration implementation (zero skips). Missing service import was also observed.
- Worker RED: after migration/create checks passed, actual PostgreSQL run failed at `durable staged worker is missing` before worker implementation. Missing worker import was also observed.
- Corrections during qualification: migration CASE expression required parentheses; test fixture repeated segment names needed unique names and then separate text parameters; CLI NODE_ENV tuples required `as const`. All corrected and rerun. Earlier runs registered DB tests twice through a helper import; final worker test has its own local seed helper and counts each behavior once.
- Final exact command: `node --import tsx --test tests/submission-ledgers.test.ts tests/submission-ledgers-db.test.ts tests/submission-ledger-worker.test.ts` → **14/14 passed, zero skips**, duration 20251.69675 ms. Actual local PostgreSQL, restricted runtime role.
- Final scoped ESLint command on seven TS source/test paths → exit 0.
- Final `npx tsc --noEmit` → exit 0 (whole checkout).
- Final `git diff --check` → exit 0.

The 14 tests cover strict domain/PII exclusion, forced RLS and privileges, distinct-key and concurrent same-configuration uniqueness, current authority before old replay, source drift replay, real max100 progress, rollback/restart, SKIP LOCKED competing claims, canonical logical keys, frozen missing/excluded contacts, initial and cancellation histories, current key scopes/revocation, creator downgrade, cancelled campaign, empty audience, per-transaction limit, partial insertion commit rejection, signed recipient pages, composite tenant pins, no attempts/frequency/operations/outbox writes, fake dispatch/outcome evidence denial, DELETE/TRUNCATE denial, idempotent cancellation and no recreation, and production/remote CLI refusal.

## Self-review and integration limits

Checked that every mutation calls current authority before idempotent replay, only server-owned SQL projections are exposed, logical identity has no mutable facts, counts come from actual rows, runtime cannot fabricate provider outcomes/attempts/history, rollback erases all rows/progress/history together, and cancellation retains permanent dedupe identities. Real worker contention uses PostgreSQL locks, without timers or Redis. No sendability, charged ledger, frequency reservation, outbox/event, network/provider, resume or paid path was added.

Root owns routes/API/SDK/UI/browser qualification and final configured full test suite/build/lint/API checks. Those integrated checks are not claimed as completed by this task report. No remaining Task 1 blocker found. Complete PRDv2 all65/all13 remains binding and zero whole-PRD acceptance is claimed.

## SHA256 of final owned source/test artifacts

```
da21088de4ca68e5068ef501def5bcf845d3b56669985b10504af2064647b8ca  db/037-submission-ledgers.sql
4c2386aedf271d1bef596b3f27aa3052840e0d7755bfa96c389c0997b9ec7f7e  src/domain/submission-ledgers.ts
7890d05a21a45ac71edcbde4b86db2e5d9bfdc3121b1b42389ded0e94b070d1d  src/server/submission-ledgers.ts
9118c9ab07a9eeebe0c88b5ce407d89d11766cf26189afe4523f93142b004a96  src/server/submission-ledger-worker.ts
80ba3fcc462c379a9879209506811a81d3b7a6112ea06bfbd5b35e5a94e6d276  scripts/run-submission-ledger.ts
734221978bb9e09acf757469355a765d5af9507afe99a9124dd47b10881d3136  tests/submission-ledgers.test.ts
ad256e19fe31533079b16d125102eb8517b6c86f607c5cc9b120587c6840fca2  tests/submission-ledgers-db.test.ts
4003f8fef37a1d1c7016f2400023b9587f0170a434ee21c6cc4c2eefaf3bd5f7  tests/submission-ledger-worker.test.ts
```

## Bounded review correction — creator expiry after blocking campaign lock

Review identified that the worker checked a creator key before waiting for a campaign FOR SHARE lock, while SQL accepted expiry relative to transaction start. A native two-connection regression proved the worker passed its first creator check and blocked on the exact campaign query using pg_stat_activity; the blocker held that lock until database wall time proved the key expired. The original worker incorrectly returned completed instead of cancelled. Exact RED command: `node --import tsx --test --test-name-pattern='key expiry while the campaign lock' tests/submission-ledger-worker.test.ts` → 0 pass / 1 failure, actual completed versus expected cancelled (no skipped registrations).

Corrected only assigned paths: worker rechecks current creator authority after obtaining the potentially blocking campaign lock; SQL recipient admission checks `expires_at>clock_timestamp()` instead of transaction time. Final full scoped command above now passes 13/13, zero skips, including this race and all previous checks. The expired creator cancels the remaining work, preserves the existing 100 recipients and history, leaves pending_count zero, and admits no 101st recipient or attempt. Scoped ESLint, whole-checkout tsc, and diffcheck all exit 0 again. Three changed final hashes are updated above. No full-suite rerun was performed in this correction because parent explicitly owns the configured final suite and requested no duplicate full run.

## Bounded local CLI boundary correction — PostgreSQL query overrides

Root identified that hostname-only URL validation permits PostgreSQL query parameters to override a loopback hostname. Added a root-authorized tiny preload fixture that intercepts `pg.Pool.connect`, writes a fixed nonsecret sentinel, and throws before any network access. The exact CLI regression first failed: `node --import tsx --test --test-name-pattern='URL overrides' tests/submission-ledger-worker.test.ts` → 0 pass / 1 failure / 0 skips because a query-host override reached the connection interceptor. No remote connection was attempted. A positive valid loopback control ensures the interceptor actually runs.

The development CLI now requires postgres/postgresql protocol, localhost/127.0.0.1 hostname, and no query or fragment delimiter, including empty query/fragment forms. Invalid URLs fail closed with the generic configuration error. Validation runs before tenant/connect. The negative cases cover query host override, query port override, https protocol, fragment, empty query, and empty fragment. Focused CLI GREEN: `node --import tsx --test --test-name-pattern='development CLI' tests/submission-ledger-worker.test.ts` → 2/2 / 0 skips. Final scoped regression command above → **14/14 / 0 skips**, 20251.69675 ms. Scoped lint on changed script/test/preload, whole-checkout tsc and diffcheck → exit 0. No shared helper or mounted production behavior changed; no full-suite rerun, app/provider activation, commits or pushes. Final CLI/test hashes are updated above. New test-only fixture hash:

```
e4b51f72ca224e3cb58648ef4696b6741ca7944f771ad1196f38b27e220f5376  tests/fixtures/submission-ledger-no-network.ts
```


## task-1-independent-review.md

# Task 1 independent storage / worker review

Spec: **FAIL pending one bounded correction**. Quality: **CHANGES REQUESTED**. One Important finding; no Critical or Minor findings.

Scope: the eight assigned Task 1 artifacts in task-1-report.md, assessed against the submission-ledger design. Read existing authority/RLS helpers only to establish binding interfaces; routes/UI and wider integration were not reviewed. Independently checked all eight reported SHA256 hashes: all match. No tests rerun, runtime/provider/private-data actions, code changes, commit or push.

## Important — creator key expiry can pass during a blocking campaign lock

Locations: `src/server/submission-ledger-worker.ts:24`–25 and `db/037-submission-ledgers.sql:138` (related expiry check at worker line13).

The worker checks creator key expiry using database wall-clock time inside creatorAuthorized, then waits for `SELECT state FROM campaigns ... FOR SHARE`. If an otherwise ordinary campaign update holds that lock until the creator key expires, the stored `creator=true` remains sufficient to materialize the batch after the wait. The recipient SQL guard does not close the gap: it compares expires_at with transaction_timestamp(), which remains the transaction's earlier start time. The trusted worker's own current membership/RLS authority does not check the original creator key, so a batch of up to100 recipients can be committed after that creator credential expired. An empty captured audience can similarly be marked completed after the wait without another creator check.

This violates the spec's current creator-key expiry recheck before each batch and expired-creator stop/cancel behavior. The impact is unauthorized staging progress, not actual sending: attempts, outcomes and authorization remain closed.

Suggested bounded correction: recheck creator expiry after all potentially blocking authority/campaign locks and immediately before choosing/materializing the batch; preserve the cancellation path when it is expired. Change the recipient guard's creator expiry check to current database clock time so direct restricted SQL cannot rely on an old transaction timestamp. Add a meaningful PostgreSQL expiry/lock-wait regression that proves no new recipients/progress are admitted and already-staged pending rows are cancelled, including the empty-ledger edge if needed. Cost: small worker/SQL change plus one targeted real-DB regression. No change to dispatch policy or public contracts is needed.

Evidence is static control-flow/SQL analysis; this race was not independently executed. Existing reported12/12 tests cover creator revocation, but inspected tests do not cover creator expiry across a campaign lock wait.

## Otherwise verified by inspection

- Six tables use forced RLS, composite tenant bindings and existing current Owner/Admin plus campaign/audience scope policies. Immutable manifests verify configuration/revision/artifact/snapshot facts and sorted exact members; historical contact IDs do not require live contacts.
- Permanent configuration/contact uniqueness and database-generated SHA256 of canonical UUID JSON establish dedupe identity. Captured fields are derived by guards rather than trusted caller flags. Cancellation cannot recreate a configuration's identities.
- Job locks/SKIP LOCKED and per-transaction batch bookkeeping restrict materialization to100 new recipients. Immediate and deferred guards require exact recipient/delivery/progress agreement; partial insert/progress and incomplete cancellation cannot commit. Rollback leaves no partial durable batch.
- Only initial pending/skipped and pending-to-cancelled are admitted. Authorization false/outcome unknown are enforced. Runtime cannot write attempts; CHECK(false) blocks privileged attempt insertion too. History is captured by the existing narrow NOLOGIN non-bypass trigger role; runtime has no history insertion privilege. DELETE/TRUNCATE and state rewind are closed.
- Service authority is checked before keyed receipt lookup; create conflict codes are inside the original keyed callback. Distinct keys serialize on the campaign and return the existing permanent configuration ledger. Old successful replay retains original source pins while current authority remains required.
- Public projections are strict and redacted; counts derive from durable rows and currently impossible accepted/uncertain/attempt facts remain0. Query validation and signed parent/state paging match their service contracts. Worker/CLI add no network/Redis/provider/send/frequency/outbox path and refuse API/local-session worker identities and production/remote CLI execution.

## Qualification limits

Task report supplies meaningful domain/storage/worker RED history and actual restricted PostgreSQL12/12 with0skip, scoped lint/typecheck/diff0. Those are supplied execution results, not independently rerun results. Hash checks bind this review to those reported artifacts. No original-body preservation hashes, root browser/API integration, full configured suite/build, canonical sync, remote SHA or terminal CI are established here. Broader root qualification remains pending. Full all65/all13 and whole-PRD acceptance remain open; no provider or production readiness is inferred.


## task-1-expiry-correction-independent-review.md

# Independent Task 1 expiry correction review

Spec: **PASS for the bounded correction**. Quality: **APPROVED**. The prior Important creator-key expiry finding is resolved by inspection and supplied native regression evidence. No new findings in this correction scope.

Reviewed only db/037-submission-ledgers.sql, src/server/submission-ledger-worker.ts and tests/submission-ledger-worker.test.ts, plus the appended Task 1 report. No tests rerun, application/runtime/provider/private-data actions, commit or push. All eight final report hashes match actual artifacts. The other five assigned artifact hashes are identical to the original reviewed versions; changed SQL/worker/test hashes are respectively da21088de4ca68e5068ef501def5bcf845d3b56669985b10504af2064647b8ca, 9118c9ab07a9eeebe0c88b5ce407d89d11766cf26189afe4523f93142b004a96 and 1bb11a6fd221523a46957f781286d436a88f7cdf19c3412fec5a9650c62f922c.

At worker lines24–28, creatorAuthorized is called again after the potentially blocking campaign FOR SHARE query and before member selection/insertion. An expired creator now enters the existing atomic cancellation path, including for an empty member slice. Already-held membership/key row locks keep mutation-based authority stable; the second check reads database wall time for expiry, which can advance without a row change. At SQL line138, recipient admission compares key expiry with clock_timestamp(), closing the transaction-start-time loophole independently of the worker. Existing max100, progress, cancellation, immutable dedupe and no-attempt gates remain intact.

The added native PostgreSQL test is a meaningful regression rather than a mirrored assertion: it stages101 captured members, commits100, expires the creator credential shortly afterward, holds the exact campaign lock in a second connection, observes the worker waiting on that query in pg_stat_activity after its first creator check, waits until database time verifies expiry, then releases the lock. It requires cancelled status/progress100, zero pending rows, preserved100 captured recipients and zero attempts. The old worker reportedly produced completed versus cancelled RED; corrected full scoped suite reportedly passes13/13 with0skip, preserving all prior12 tests. Scoped lint, whole-checkout typecheck and diffcheck are reported0.

Cannot verify: execution evidence was not independently reproduced. Empty-ledger expiry is covered by the corrected common control flow, not a separate native regression. The new regression directly proves the worker lock-wait/cancellation behavior; it does not separately execute a direct-SQL expiry bypass against the new clock guard. Those limits do not leave the reported finding open. Root integration/browser/API checks and full configured qualification/build are outside this scoped re-review and remain controller-owned. Original-data hash preservation, canonical sync, commit/remote SHA/terminal CI and all65/all13 acceptance are not established here. Staging approval implies no actual sending/provider/production readiness.


## task-1-cli-correction-independent-review.md

# Independent Task 1 local CLI guard correction

Spec: **PASS for the bounded correction**. Quality: **APPROVED**. No new findings. Prior expiry correction remains intact.

Scope: scripts/run-submission-ledger.ts, the added CLI case in tests/submission-ledger-worker.test.ts and new tests/fixtures/submission-ledger-no-network.ts. Read the appended task report and existing db connection boundary; no broad integration review, tests rerun, runtime/private/provider actions, commit or push.

The CLI now admits only postgres/postgresql URLs with localhost/127.0.0.1 hostname and no query/fragment delimiters, including empty markers. Malformed URL parsing is caught and rejected. Existing LOCAL_DEVELOPMENT and production refusal stay in force. The guard executes before tenant()/pool.connect(), and rejection uses the fixed generic configuration error without including the supplied connection URL or parse exception. Rejecting all query fields prevents PostgreSQL host/port overrides from defeating the hostname guard. No shared database helper, authority policy or mounted behavior changed.

The test-only preload replaces pg.Pool.connect with a fixed sentinel and throw before a socket can be opened. It is loaded explicitly only in this test's child process; repository search found no runtime/package import. A safe loopback control must reach the sentinel, so negative cases cannot pass through an inactive interception probe. Host override, port override, foreign protocol, fragment and empty query/fragment cases must fail without the sentinel, without the worker-start marker and with the generic refusal. The original production/remote CLI case and native lock-wait expiry regression remain present; no prior assertions were removed.

All nine hashes in the updated Task 1 report match actual artifacts, including the new preload e4b51f72ca224e3cb58648ef4696b6741ca7944f771ad1196f38b27e220f5376. CLI and worker-test hashes match the reported80ba3fcc... and4003f8fe... values. The six unaffected artifacts from the original eight retain their approved expiry-review hashes; SQL da21088d... still uses clock_timestamp() and worker9118c9ab... still rechecks creator authority after the campaign lock.

Supplied evidence: original new CLI regression RED reached the connection interceptor for a forbidden query override, before any network; focused CLI GREEN2/2 with0skip; final Task 1 native suite14/14 with0skip; scoped lint/typecheck/diff0. Root separately reports fresh configured920/920 with0skip after the guard. These are supplied execution results, not independently reproduced results.

Cannot verify: malformed strings are rejected by inspected catch flow but are not a separate listed regression case. The guard proves URL policy, not administrator ownership of any particular loopback database; caller scope and current worker authority remain binding. This scoped approval does not establish original-data hashes, root browser/API completeness, build/remote SHA/terminal CI or full all65/all13 acceptance. Later immutable whole-slice review and final publication qualification remain controller-owned. No provider/send/production readiness is implied.


## task-2-report.md

# Task2 UI and recovery report

Owned changes: `src/ui/submission-ledgers.tsx`, `src/ui/submission-ledger-recovery.ts`, `tests/submission-ledger-recovery.test.ts` and this report. No services, browsers, commits, pushes or other files were started/changed by this worker. Read AGENTS.md, the installed Next.js use-client guide, the committed design/plan and the test-driven-development skill before implementation.

## Implemented behavior

`SubmissionLedgers({workspace,actor,role,id,version,digest})` exposes recipient information and mutation controls only to Owner/Admin. Other roles render a static authority explanation without recipient identifiers, counts or buttons. The interactive panel includes ledger history paging, source version/digest/hash, progress, cancel staging, recipient filtering/paging, delivery detail, state history paging and actual attempt paging with a truthful empty state. The visible status is “Staged; sending unavailable”; pending means unapproved, outcomes remain unknown, and no send/provider/acceptance action is added.

Recovery stores the exact canonical original body and key before POST under an explicitly constructed workspace/actor/campaign scope. Strict records reject extra fields, invalid/lowercase UUIDs, oversized/noncanonical bodies and transplanted scope. Recovery capacity is32 unresolved scopes. One origin Web Lock covers capacity checking, compare/write/readback, POST, immutable identity validation, fresh GET and compare/remove/readback. Missing locks fail closed; lock contention refuses dispatch. A shared coordinator synchronously prevents duplicate requests from mounted controls. Storage events reconcile other mounted/tab views. Actor/context/version fences abort stale requests and preserve unresolved commands. Network/auth/malformed or foreign success and fresh-read ambiguity retain the original command for reload/version-drift retry. Receipt creator equality is intentionally not required: the verified same immutable configuration may return an existing resource created by another authorized actor.

Explicit dismissal is limited to exact persisted create-only VERSION_CONFLICT409, DIGEST_CONFLICT409 and STATE_CONFLICT409 classifications. Actual service evidence was read: `stageSubmissionLedger` checks current authority before `keyed`, and `commands.keyed` checks the historical success receipt before invoking the staging callback; all three classified errors occur inside that callback. Classification surrounds only the original POST callback and checks current context and exact stored command. Cancel, generic4xx, auth, unknown conflict, fresh GET and stale completion cannot acquire rejection metadata. Dismiss compares the exact classified record under the same origin lock and requires an explicit button click.

## Test evidence

- Initial RED:17 tests,0 passed,17 failed,0 skipped. Missing production modules failed explicit existence assertions.
- Dismissal RED:21 tests,17 passed,4 failed,0 skipped. Failures were missing dismiss method/classification.
- Final GREEN: `node --import tsx --test tests/submission-ledger-recovery.test.ts` —21 passed,0 failed,0 skipped.
- Scoped lint: `npx eslint src/ui/submission-ledgers.tsx src/ui/submission-ledger-recovery.ts tests/submission-ledger-recovery.test.ts` — exit0,0 errors/warnings.
- Repository typecheck was actually run. Latest result exit2: only `tests/submission-ledger-worker.test.ts:95` has a spawnSync environment NODE_ENV string type mismatch outside this worker's ownership. Parent notified. No remaining owned-file errors.
- Two invalid fixture assertions were corrected after their first run: a numeric-only UUID did not change under uppercase, and a purported foreign detail assertion originally used matching identities.
- This worker did not run native fullsuite, database, API, build or Chromium checks; parent owns integrated qualification. No qualification claim is made for those checks here.

## Self-review

Checked strict scoping against the enriched-props spread bug; no production scope uses spread props. Browser-reachable imports contain no node:crypto. Original create/cancel transport bodies are canonical, so the existing API serialization preserves exact bytes. Cancellation binds exact ledger identity; create binds captured version/digest; fresh detail binds all immutable source identifiers/hashes. Shared controls, Web Locks and stale authority fences preserve ambiguity. PII stays outside nonmanager markup. Long identifiers use existing break-word styling and bounded buttons for mobile layout; actual390px keyboard/browser evidence remains with root browser qualification.

SHA256 at final scoped checks:

```text
3b5ef2ef5e8966294387e0307e8500c5d67737f1696382ff822946e8e1465542 src/ui/submission-ledgers.tsx
11ed87a2fe7387f1b9099726e3ae97fa1de5bef9b75e4f066c5382034115ac7d src/ui/submission-ledger-recovery.ts
d4e47ef36b696ac56373edcfa9a35d043e646e88228c543cc35ecd44fef79212 tests/submission-ledger-recovery.test.ts
```

All65 requirements/all13 gates remain binding, with zero whole acceptance. This is a reversible staging foundation and authorizes no provider dispatch or paid work.


## task-2-independent-review.md

# Task 2 independent spec and quality review

Reviewed 2026-10-03 against `docs/superpowers/specs/2026-10-03-submission-ledger-design.md` and Task 2 of `docs/superpowers/plans/2026-10-03-submission-ledger.md`.

## Outcome

No Critical, Important, or Minor findings established in the assigned UI/recovery scope. No application changes requested by this review.

Read the complete `src/ui/submission-ledgers.tsx`, `src/ui/submission-ledger-recovery.ts`, and `tests/submission-ledger-recovery.test.ts`. Supporting read-only inspection covered the UI API transport, ledger service, keyed-command ordering, campaign state transitions, and relevant existing layout rules. No tests, services, browsers, provider calls, commits, or pushes were run. This report is the only file written by this review.

## Reviewed invariants

- Exact recovery scope and original command: recovery lines 6–58 validate only workspace/actor/campaign, reject transplanted or enriched records, enforce canonical strict bodies and lowercase UUID keys, bound stored bytes, limit unresolved records to 32, and verify storage readback before dispatch. UI lines 131–139 explicitly build the scope-compatible body and pass the saved key/body plus current actor to transport. The transport's parse/serialize round trip preserves these canonical bodies.
- Lock and acknowledgment boundary: recovery lines 158–192 keep the same exclusive origin lock across reading the current record, capacity/write admission, POST, receipt validation, fresh GET, exact compare/remove, and removal readback. Missing locks and contention refuse dispatch. The shared coordinator registry at lines 211–218 and synchronous busy admission at lines 159–160 block concurrent mounted-control commands; the origin lock covers independent tabs and scopes.
- Ambiguity and response binding: recovery lines 69–117 bind ledger/campaign, original create version/digest, cancel ledger identity/status, fresh immutable pins, and recipient/delivery/history/attempt parents. Malformed/foreign success, auth, unknown errors, and fresh-GET failures retain the original command. UI lines 82–107 additionally bind recipient/delivery configuration IDs.
- Explicit dismissal ordering: `stageSubmissionLedger` checks current authority before `keyed`; `keyed` reads and returns an existing successful receipt before invoking its callback. VERSION_CONFLICT, DIGEST_CONFLICT, and STATE_CONFLICT originate inside that create callback. Recovery lines 123–126 and 172–180 classify only an actual original create POST `ApiError` with one of those exact 409 codes, current context, and the same saved command. Classification must survive readback before publication. Dismissal at lines 194–208 compares the exact persisted classified record under the origin lock. Cancel, generic/auth/unknown conflicts, stale failures, and fresh reads cannot gain this classification. Current supported configuration edits increase the version; the inspected campaign transitions do not restore a refused configuration's state without an edit.
- Context and late completion: the panel key at UI line 18 isolates workspace/actor/role/campaign state; layout fences also include version/digest (lines 35–40). Every request uses the actor header and abort signal. Recovery and view operations check their fence before publishing results or acknowledging commands. Reload changes the proposed new-command base while retaining any unresolved original command.
- Truthful staging and access: Owner/Admin gating precedes the interactive component (UI lines 16–18). Copy distinguishes captured historical facts from current eligibility and labels pending work unapproved. There are no send/provider-retry/approval controls. Attempt history is fetched from the actual endpoint and only reports an empty list after a successful validated response (lines 105–107, 222–224). Loading, errors, empty pages, refresh, cancellation, and continuation controls are reachable in source. Existing wrapping styles, bounded identifier buttons, native buttons/select, and labels support the intended narrow keyboard layout; actual 390px behavior remains browser qualification, not a source-review claim.

## Evidence and qualification limits

The existing `task-2-report.md` records the meaningful initial RED, rejection-handling RED, final **21 passed / 0 failed / 0 skipped**, and scoped lint exit 0 with no errors/warnings. I did not rerun those commands. Read-only SHA-256 inspection matched all three files to the report exactly:

```text
3b5ef2ef5e8966294387e0307e8500c5d67737f1696382ff822946e8e1465542  src/ui/submission-ledgers.tsx
11ed87a2fe7387f1b9099726e3ae97fa1de5bef9b75e4f066c5382034115ac7d  src/ui/submission-ledger-recovery.ts
d4e47ef36b696ac56373edcfa9a35d043e646e88228c543cc35ecd44fef79212  tests/submission-ledger-recovery.test.ts
```

The tests directly exercise write-before-POST, recovery through reload/input drift, lock absence/contention, shared/independent coordinators, strict scope/body admission, finite capacity, storage failure, response binders, cancellation, stale completion, definitive rejection persistence/dismissal, and restricted-role markup. They do not independently establish mounted React behavior, real cross-tab browser scheduling, or mobile keyboard usability; the parent owns the ongoing actual HTTP/Chromium qualification. The implementation report records a repository typecheck failure in the then-current out-of-scope worker test; this review makes no fresh aggregate typecheck/build/full-suite claim.

This review accepts only the inspected Task 2 implementation against this staging spec. All 65 baseline requirements and all 13 gates remain binding and unaccepted as a whole. Real approval, provider dispatch, live eligibility, spending/frequency reservations, actual delivery attempts, full integrated browser/native qualification, and production activation are not established or authorized by this review.


## task-3-integration-independent-review.md

# Task 3 independent integration review

Date: 2026-10-03. Reviewer: audience_review. Read-only code review against `docs/superpowers/specs/2026-10-03-submission-ledger-design.md`; HEAD observed `78027f22840782a745690c25b392700d6f9ab9ba` plus the current uncommitted Task 3 integration. This report is the only reviewer-created artifact. No tests, browser sessions, database queries, providers, services, commits, or pushes were run.

## Verdict

Changes requested: one Important/P2 SDK contract mismatch. Root accepted this finding and owns the bounded correction. No correction has yet been independently re-reviewed in this report.

## Finding 1 — P2 / Important: documented ledger SDK commands require an unrelated If-Match header

Locations: `scripts/generate-api.ts:1011` and `:1014`; generated `sdk/operations.ts` entries `stageSubmissionLedger` and `cancelSubmissionLedger`; shared behavior at `sdk/client.ts:35` and `:139–143`.

Both new mutations correctly set `explicitKey: true`, but the existing SDK interprets this flag as requiring both an explicit idempotency key and an `ifMatch` value. The public ledger contract requires create body `{expected_version, expected_digest}` and strict empty cancel body, with an explicit key. Neither endpoint reads If-Match, and neither OpenAPI operation documents it. The SDK therefore rejects valid documented calls before any request, at both TypeScript and runtime boundaries.

Source-traced reproduction (not executed, per no-test-rerun instruction): construct a `LettercapeClient`, then call `stageSubmissionLedger` with `{path:{id},body:{expected_version:1,expected_digest:'a'.repeat(64)},idempotencyKey:'ledger-create-1'}` or `cancelSubmissionLedger` with `{path:{id},body:{},idempotencyKey:'ledger-cancel-1'}`. Types require missing `ifMatch`; a JavaScript call reaches the `Supply the original acknowledged If-Match version.` error before fetch. Supplying an invented draft header only works around the inconsistent contract.

Impact: SDK users cannot stage or cancel using the documented API contract. This is not a server-side permission bypass or a provider submission risk.

Recommended correction: separate explicit-key requirements from the existing source-command CAS-header requirement in the shared SDK types and runtime. Preserve source commands' required original If-Match and no-automatic-retry behavior. Add focused compile fixtures and transport tests for ledger create/cancel without If-Match, missing explicit-key rejection, and unchanged source-header enforcement. Root explicitly accepted this correction direction.

## Inspected integration boundaries

- The route matrix exposes the specified eight method/path combinations, rejects extra suffixes and unsupported mutation methods, and mounts dispatch before the generic campaign handler. Ledger create and replay return 201; other specified operations return 200.
- Ledger requests use the 16 KiB JSON byte cap. Create parses the strict domain input and cancellation rejects nonempty object fields. Query names, duplicate names and empty values are rejected before dispatch; resource paging applies bounded limits and signed actor/workspace/resource/parent/filter-bound cursors.
- Current authority is checked through `withPrincipal`, then the service asserts audience and read/write campaign authority before keyed receipt lookup. API-key scopes are re-read from current storage. Optional actor mismatch is rejected. The accepted Task 1 key-expiry correction is owned by that review; this review does not claim its qualification.
- Mutations are internally keyed once; the catch-all does not wrap them again. The original successful receipt can replay before source-version CAS, after current authority. Public views select/validate redacted fields, excluding captured member arrays, addresses, HTML, personalization, credentials, and arbitrary errors.
- The campaign panel mounts `SubmissionLedgers` with workspace/actor/role/campaign keys and passes version/digest. The component gates the recipient/mutation surface to Owner/Admin. Detailed recovery and browser behavior remain Task 2/root qualification scope.
- Generated operation names, methods, paths, response schemas, page shapes and campaign-plus-audience scopes otherwise align with the frozen contract on inspection. The API137 assertion and strict foreign-key table-list update preserve exact expectations; the FK test adds the new table and its exact composite FK pattern rather than weakening the existing assertion.
- Package/workflow additions invoke the isolated smoke harness and separately expose an explicitly local staging worker. No integration change activates production dispatch or claims full GA; the capability register still states the full baseline and acceptance gates remain binding.

## Evidence and limits

This is a fresh static review, not an independent execution result. Parent-reported evidence: route RED2 to GREEN9; API seven passing tests/137 operations; lint/typecheck passed; first full suite 916 total, 914 pass, one exact-FK expectation failure and one opt-in skip; the precise FK expectation correction is present, final configured rerun pending; native browser qualification ongoing. These reports are not promoted here to independently verified results.

Declined to judge: final configured-suite/build/browser success, remote CI, native browser acceptance, complete worker/migration correctness already assigned to Task 1, full cross-tab recovery correctness assigned to Task 2, production identity or infrastructure, provider behavior, live dispatch or consent authorization, whole Baseline A acceptance, and private original-dataset preservation beyond the stated scope. No private data or external resources were accessed.


## task-3-sdk-correction-independent-review.md

# Task 3 SDK correction independent review

Date: 2026-10-03. Reviewer: audience_review.

Verdict: **PASS for the bounded correction.** The prior Task 3 P2/Important SDK If-Match mismatch is resolved. No new concrete finding in this correction.

Scope: only changes in `sdk/client.ts`, `sdk/types.fixture.ts`, and `tests/sdk.test.ts`, plus read-only inspection of the supplied correction logs. No tests were rerun. No implementation file, private data, service, provider, commit, or remote was changed by this reviewer. This requested report is the only new artifact.

The SDK now independently requires an explicit original key for `explicitKey` commands and an original If-Match version for `sourceCommand` commands, both in `CallOptions` and runtime admission. Ledger create/cancel therefore accept their documented bodies and keys without an invented draft header. The existing source-command exclusion from automatic retry is unchanged. Missing source versions still fail before transport.

The new runtime regression exercises ledger creation without If-Match, loses the first transport acknowledgment, and checks that recovery preserves the original key and body with no If-Match header. It also exercises empty-body ledger cancellation without If-Match. The second regression checks missing ledger keys and missing source version produce zero fetches. Compile fixtures accept both ledger mutations without If-Match and use expected type errors for a missing explicit ledger key and a missing source version. Existing source tests in the supplied GREEN log cover exact bytes, original recovery keys, required headers, and no automatic retry.

Evidence inspected, not independently executed:

- `/tmp/lettercape-submission-sdk-red.log`: new ledger regression fails with the former `Supply the original acknowledged If-Match version.` error; 2 tests, 1 pass, 1 failure, zero skips.
- `/tmp/lettercape-submission-sdk-green.log`: 15 tests pass, zero failures and zero skips, including both new ledger regressions and source recovery regressions.
- `/tmp/lettercape-submission-sdk-type.log`: typecheck invocation, no diagnostics; root reports exit 0.
- `/tmp/lettercape-submission-sdk-lint.log`: no diagnostics; root reports exit 0.

Limits: this PASS closes only the reported SDK correction. It does not substitute for the pending final whole frozen review, full configured suite/build/browser qualification, remote CI, or production/GA acceptance. No API, worker, migration, UI recovery, or other implementation change was re-reviewed here.


## task-3-browser-report.md

# Task 3 actual HTTP/Chromium qualification

Assigned scope: `scripts/smoke-submission-ledgers.ts` and this scratch report only. No application, migration, UI, package/workflow, git metadata, commits, pushes or provider changes were made by this worker. Read AGENTS.md, installed Next 16.3.8 backend-for-frontend guide and the committed submission ledger spec/plan before implementation. Coordinated storage/UI readiness and root launch permission before starting the owned server.

## Final outcome

`node --import tsx scripts/smoke-submission-ledgers.ts --isolated` exited **0**. Final actual native PostgreSQL/HTTP/Chromium run: **18 explicit PASS checks**, including process/database cleanup. Run started `2026-10-03T09:07:00.688Z`, completed `2026-10-03T09:07:17.088Z`. Owned Next PID **61145**, only port **3015**. Its normal finally stopped that PID, then sourceDatabase/withCreationDatabase dropped the exact generated fixture database. Root received BUILD GO immediately afterward. The original local apps/workers were never signalled. No remaining application defect was identified.

Final harness SHA256: `d3d25742af693d1c57363bbf07131d91a78b312ded9fe7f192ce68c08cbf0173`.

Artifacts:

- `/tmp/lettercape-submission-browser-reviewed-frozen.log`: final reviewed execution stdout, 18 PASS checks.
- `/tmp/lettercape-submission-browser/verdict.json`: PASS, UTC times, exact harness hash, owned PID/port, check list.
- `/tmp/lettercape-submission-browser/server.log`: final actual Next HTTP request log.
- `/tmp/lettercape-submission-browser/qualified-source-sha256.txt`: qualified migration/domain/service/worker/route/UI/recovery source hashes; no environment/private metadata hashes.
- `/tmp/lettercape-submission-browser/pixel-sha256.txt`: exact final screenshot hashes.
- `/tmp/lettercape-submission-browser/production-refusal.log`: explicitly production-mode local-worker CLI refusal, exit **1**, before database connection.

Scoped ESLint and whole-checkout `tsc --noEmit --pretty false` both exited **0** after the final run. Root owns the configured 919-test suite, API137 generation/check and build; their results are separate from this harness's evidence.

## Actual qualified behavior

The harness uses the established guarded sourceDatabase helper. It loads the owned loopback mirror environment in memory only, creates a disposable `creation_fixture_<UUIDhex>` PostgreSQL database, applies current migrations, and launches an app with a minimal local environment. It probes port3015 before starting, uses current HTTP auth session cookies and actor/workspace headers, creates an email and frozen revision through actual HTTP, creates a trusted immutable audience-snapshot fixture, then creates/configures the campaign through actual HTTP. The generated fixture workspace has API allowance100 because the multi-key scope matrix exceeds the normal ten-request test fixture allowance; this does **not** qualify rate limiting. No original database rows are touched, no private configuration is copied and no credentials are emitted by final diagnostics.

1. All eight HTTP operations: actual allowed responses and unsupported PUT/PATCH/DELETE/POST/GET variants, exact singleton/nonempty query validation, body rejection, CSRF, foreign workspace404, actor409, current Editor/Viewer/Billing403, campaigns+audience API scopes, revoked-key401 before historical keyed replay, and suspended-workspace409 before replay. No caller authority flag can grant access.
2. Same configuration with distinct keys returns one real ledger. Exact version/digest/revision/artifact/snapshot pins match actual persisted immutable facts. A later material configuration admits another ledger while old receipt and members stay unchanged. A changed command with the old key fails409.
3. Trusted transaction invocation of the actual worker materializes130 sorted frozen members in batches100 then30, yielding100 pending(unapproved),30 skipped,0 accepted/uncertain/attempts, authorization=false, dispatch=false. Current subscription/consent drift does not rewrite captured consent/members. Actual frequency reservations, usage, operations and outbox counts remain equal to their pre-stage values.
4. Real recipients default25/max100 paging, remainder30 and state filters. Signed cursor rejection binds filters, actor, resource and parent. Actual delivery detail, state history and empty attempt page are parsed through strict domain contracts. Projections contain no addresses, HTML, credentials, payload/lease/provider identifiers.
5. Actual Chromium create POST commits201, its acknowledgement is dropped by the browser interceptor, and two synchronous native button clicks issue one command. Explicitly awaited committed-response gate proves the commit before source drift. Exact key/body/actor/workspace survives reload and material version drift, then retries to the original ledger.
6. Two actual tabs synchronously attempt admission under real origin Web Locks and retain one original command and one ledger. Shared pending state/locks block duplicate work. Actual committed cancellation response200 is dropped and retried after reload with original empty body/key/ledger binder.
7. Actual browser reads paginate staged recipients and filter30 excluded recipients, then read real logical delivery/history and truthful empty actual-attempt list. Transient read503 is intentionally synthetic; refresh returns to actual HTTP. A real state filter produces an empty recipient view.
8. Browser recovery commands are intentionally seeded through the strict durable storage format for VERSION/DIGEST/STATE conflict fixtures, then submitted by the actual Retry control to the actual keyed service. **No409 is fabricated.** Each real409 is checked for its exact code and zero committed idempotency receipt, persisted across reload, then deliberately dismissed by the exact rejected-command control. These are recovery-path fixtures, not a claim that the original Stage control generated invalid digest input.
9. Synthetic authentication401 is explicitly an unknown-result fixture. It does not offer dismissal, retains exact command through reload/retry, and clears only after a later real bound success. Real network acknowledgement loss is separately proven in checks5/6.
10. Real committed response held across an actual workspace switch cannot clear the prior workspace's receipt or navigate stale context; switching back retries the exact command. Real session cookie actor switch/reload likewise leaves the original actor's receipt untouched and creates no new actor receipt; restoring the actor retries exact identity.
11. Owner and Admin staging/read controls, actual keyboard ledger selection,390px viewport/no page horizontal overflow, unsupported-Web-Locks read availability with mutation refusal, and verified current Viewer message with no details/recipient identifiers. The final Viewer checks wait for the verified role panel before assertions. Both final browser contexts (main and unsupported-Web-Locks) share the same external-request blocker and page-error collector. Their combined totals are zero external browser requests, zero browser page errors and zero uncaught route errors.

## Native pixel inspection

Screenshots are direct Playwright/native browser pixels, with no image editing. Viewed final images:

- `owner-progress-top-mobile.png`,316px panel within390px viewport: readable **130/130 processed ·100 pending(unapproved) ·30 skipped ·0 cancelled**,0 accepted/uncertain/actual attempts, authorization=false, dispatch=false, full wrapped immutable identity pins and controls. SHA256 `742743881f0f90622129deb4975d6b68fcbd41aa2d20c7aea27203475e59b324`.
- `owner-delivery-mobile.png`: logical delivery identity/key, pending(unapproved), unknown outcome, recorded ELIGIBLE state history and **Actual attempts(0)** / sending unavailable. SHA256 `751557471aedda2d7b09e49f858378614291631bdeae6d13dba27b76c263d712`.
- `viewer-panel-mobile.png`: only the staged-ledger heading and Owner/Admin audience-access explanation; no mutation control or recipient detail. SHA256 `664bd85e481d02e994f3188ed15eeac12ed02a4fa67e6bc352ce243655f6d366`.

Additional final pixels include owner top/full-page/full-progress, Admin, empty recipient filter and unsupported-lock reads. The entire long progress screenshot is supplementary; the native progress-top crop supplies legible counts.

## Harness stabilization and retained failure evidence

These pre-GREEN failures are **harness implementation/fixture/timing failures, not meaningful application TDD RED**. Parent domain/method/recovery RED evidence belongs to the other task reports. Retained `/tmp/lettercape-submission-browser-{first,second,third,fourth,fifth,sixth,seventh,eighth,ninth,tenth}.log` documents:

- API-key creation expectation200 corrected to current201; foreign-parent cursor expectation400 corrected to non-disclosing404.
- Initial native click awaited enabled control; tab attempts changed from sequential blocked second click to simultaneous native clicks.
- Retry control can become visible before original POST finishes; explicit actual committed-response gates now precede source drift/cancel reload. Pagination and synthetic authentication assertions now await their actual rendered response.
- Init scripts were incorrectly applied to opaque/about:blank documents; guarded top-level HTTP initialization retains the final zero-browser-errors assertion.
- Multi-key scope matrix exceeded generated workspace api_rpm10; only that generated workspace allowance changed to100, without changing authorization gates.

The fifth run's route-handler assert originally escaped as an unhandled promise rejection. Its recorded PID55360 and port3015 were natively verified absent. An authorized native cleanup found exactly one generated database containing the run's exact owned campaign UUID `1e4f4903-dfa1-4081-a343-40b60a607ae5`, and dropped only that match. No original database was selected. All async interceptors now catch/record errors, abort the intercepted request, and use bounded30s gates so errors propagate through normal finally cleanup. The first failure log briefly included a generated fixture API key; that already-dropped fixture secret was redacted and diagnostics now print only error codes/statuses. No private mirror credential was output.

Ninth complete run also passed17checks at SHA256 `f67775621da936116e6f04753d39dd726733d516675c1f32ac1d3e449467be09`, PID57649, normal cleanup; its verdict remains `/tmp/lettercape-submission-browser-ninth-verdict.json`. Final exact source is the hash above.

## Bounded independent-review corrections

Independent review accepted two harness findings: (1) rewriting only DATABASE_URL's pathname left an inherited remote host or wrong loopback port intact; (2) the unsupported-Web-Locks browser context did not share the main context's external-request blocker/page-error collector. Both are corrected in the exact final source above, without application changes or added provider capabilities.

Database admission now loads the same owned mirror environment in memory only when needed, then requires explicit LOCAL_DEVELOPMENT, PostgreSQL/postgresql protocol, literal localhost/127.0.0.1 host, no query/fragment marker (including empty `?`/`#`), and identical migration/runtime hostname and effective port **before calling sourceDatabase or creating any fixture**. The generated fixture URL and runtime authority are checked again before port probing or Next spawn, and only its generated pathname is substituted. Credentials can differ for the existing migration/runtime roles and are never printed. Query markers are prohibited because the installed pg connection-string parser can let `host`/`port` query entries override URL authority.

Meaningful RED evidence is separate from the earlier fixture stabilization failures. `/tmp/lettercape-submission-runtime-guard-probe.mjs` monkeypatches `child_process.spawn` plus `syncBuiltinESMExports`, intercepting **only** the Next invocation and allowing legitimate loopback migration subprocesses. With pre-fix code, fake remote-runtime host and wrong-runtime port reached the intercepted Next spawn; the sentinel prevented any unsafe server launch, and each generated database was normally dropped. A separately intercepted pg.Pool query showed the migration query-host override reaching CREATE DATABASE before the fix; the interceptor threw before connecting and absorbed only that unsafe pool's cleanup query. The real owned loopback database set stayed unchanged.

After correction, bounded GREEN probes for remote runtime host, wrong port, wrong protocol and migration query-host override all refuse **before either Next spawn or unsafe migration CREATE**. Empty query/fragment marker probes also refuse. These final admission refusals create no fixture; an intermediate generated-fixture callback guard also proved cleanup after refusal. No probe connected to the fake host/port, no private URL or credential was emitted, and no original database row was mutated. Supporting evidence is in `runtime-guard-probes.jsonl` and `runtime-guard-{red,green}-*.log` under `/tmp/lettercape-submission-browser`.

Both real Chromium contexts now register the same blocker/error collector before any page opens, and the full actual18-check run verifies their combined zero totals. The corrected harness first passed all18 at PID59472/SHA256 `9ca2ad895560e6dbf6f44637a1b5a966ed2b5b17a846d4ce6cf74c26efff8958`. A later strict-marker rerun at PID60533 exposed one remaining harness keyboard timing issue: focus/Enter happened while the ledger-history control remained disabled after cancellation replay, and actual server logs show no admitted-ledger GET. A Playwright trial action now waits for that same control to become enabled before the unchanged keyboard focus/Enter test. The final exact source passed all18 at PID61145 and retained normal cleanup; scoped lint/type are green. Application bytes and the established full919-test baseline were not changed by this worker.

The prior complete18-check run is retained in `/tmp/lettercape-submission-browser-final.log`, `pre-review-verdict.json` and `pre-review-server.log`, at original harness SHA256 `698b3673d38f91ae0809c0e78120522d77da3026574f38d3f5a7740df3d99981`. Prior/final source and pixel manifests are separate. Final direct screenshots preserve the same readable130/100/30 progress, zero attempts and restricted Viewer behavior; fresh fixture identifiers naturally change screenshot bytes.

## Limits and self-review

Default and `--isolated` operation are qualified. An APP_ORIGIN without `--isolated` is deliberately rejected rather than allowing qualification against a database not created by this harness; existing-app mode is not delivered/qualified. The root package/workflow invokes `--isolated`.

This harness does not prove real provider dispatch, complete approval manifests, sending eligibility, paid usage, worker crash/restart/concurrent SKIP LOCKED or forged SQL privilege refusals. Those storage-worker tests are separately owned by task1; no fake provider acceptance or fabricated attempt is used here. No send provider is activated. Empty attempts are real stored truth. All65 requirements/all13 gates remain binding; this independent slice does not establish whole-project acceptance.

Self-review: assigned file boundaries respected; source/DB/origin guards are strict; minimal child environment avoids inherited provider activation; only recorded owned PID is killed; fixture helper drops only its generated database; immutable/original command checks use actual HTTP and PostgreSQL facts; synthetic conditions are labelled; no response body/secret is dumped by final assertions; browser recovery/context assertions await definitive evidence; final source is frozen and no further broadening is planned.


## task-3-browser-independent-review.md

# Task 3 browser harness independent review

Reviewed 2026-10-03. Scope: frozen `scripts/smoke-submission-ledgers.ts`, submission-ledger design/plan, retained public fixture evidence, and read-only fixture-helper inspection. No test, browser, server, database, provider, process, private configuration, commit, or push action was performed by this reviewer. This report is the only write.

## Verdict

**One Important finding and one Minor finding.** The recorded successful execution is credible for its configured local fixture, but the runtime database guard needs correction before claiming the harness always fails closed to the owned disposable database. No Critical finding. No application behavior defect established by this scoped harness review.

Reviewed script SHA-256: `698b3673d38f91ae0809c0e78120522d77da3026574f38d3f5a7740df3d99981`, matching `/tmp/lettercape-submission-browser/verdict.json` and the worker report. The actual final stdout is `/tmp/lettercape-submission-browser-final.log` (not a `final.log` inside the artifact directory).

## Findings

### Important — child runtime database authority is not bound to the generated fixture server

Location: `scripts/smoke-submission-ledgers.ts:609–614` (contrasted with fixture validation at lines 57–60 and 607).

The harness validates the generated migration connection as loopback, but constructs the child app's runtime connection from independently supplied `process.env.DATABASE_URL` and changes only its pathname. It never validates that runtime URL's host/port or binds its server authority to the server where the generated database was created. `LOCAL_DEVELOPMENT=true` in the child is only a flag and does not repair this omission.

Reproduction by source tracing, without making a connection: provide a valid loopback `MIGRATION_DATABASE_URL` and a runtime URL such as `postgresql://runtime:fixture-password@remote.example:5432/original`. `sourceDatabase` can create the local fixture and `guardDatabase` passes; line 610 changes the runtime path to `/creation_fixture_<generated id>` while preserving `remote.example:5432`. Lines 613 and 617 then give that URL to Next, whose HTTP fixture requests attempt runtime database access at the other server. Two different local PostgreSQL ports exhibit the same ownership mismatch. This is an isolation-contract failure even if the remote database is absent and the run ultimately fails; it does not establish that the recorded final run accessed a remote server.

Correction: before spawning or issuing app requests, validate both effective PostgreSQL destinations and require the runtime destination to be the same owned loopback server/port as the generated fixture. Preserve the runtime role credentials and exact generated database name. Reject connection-string options that can override that binding, or derive the destination from the trusted fixture connection and transplant only the intended runtime credentials. Add a focused refusal probe that does not launch services or contact the mismatched destination.

### Minor — zero external requests/page errors is measured for only one of two browser contexts

Location: `scripts/smoke-submission-ledgers.ts:284–287`, `448–451`, and `581–595`.

The primary context installs the external-origin blocker/counter and page-error collector. `unsupportedLocks` creates another context independently and installs neither. Its requests and page errors therefore cannot affect the final `external === 0` / `errors === []` assertions. The worker report's statement that the final contexts have zero external requests/page errors exceeds the actual measurement.

Reproduction by inspection: a page error or external request in the second context created at line 582 has no listener or route capable of modifying the counters declared at lines 284–286, so the final zero assertions still pass. The recorded unsupported-lock screenshot is genuine, and this gap is not evidence that such a request/error occurred.

Correction: attach shared network/error instrumentation before creating pages in every context, including `unsupportedLocks`, or explicitly limit the claim to the primary context. Shared instrumentation also preserves the harness's no-external-request boundary for this branch.

## Corroborated evidence

- The final verdict and stdout record 18 PASS checks, UTC start/end, owned Next PID 58138, and port 3015. Their source hash matches the inspected file. I did not rerun qualification.
- The fixture helper creates a randomly named `creation_fixture_<UUIDhex>` database, migrates that database, closes its pools, and drops that exact generated name in finally. The new harness probes port 3015, starts a child with a minimal environment, and signals its recorded child PID in finally. This supports cleanup of the normal final run; it does not eliminate the runtime URL finding above.
- Async assertion-bearing interception handlers use `safeRoute`; handler failures are collected and asserted, gates have 30-second deadlines, browser closure and process cleanup are in finally. The retained fifth-run log documents the previous unhandled route assertion. The worker report records separate authorized cleanup of the exact fifth-run fixture and native verification that PID 55360/port 3015 were absent. This reviewer did not query runtime state or independently repeat that cleanup.
- Actual create recovery calls `route.fetch`, requires HTTP 201 before dropping acknowledgment, waits for the commit gate before changing source configuration, and compares key/body/actor/workspace after reload. Cancellation likewise fetches and requires a committed 200 before dropping its response and replaying the original command. Two synchronous clicks and two actual tabs are exercised, with one observed admission/ledger and durable shared recovery.
- All three dismissible conflicts come from real keyed HTTP service calls. The harness deliberately seeds original recovery commands, asserts exact 409 codes, verifies zero committed idempotency receipts, reloads the persisted record, and uses explicit dismissal. The report accurately identifies these as seeded recovery fixtures. The authentication 401 and transient-read 503 are synthetic and are identified as such; the 401 is never treated as definitive nonexecution.
- Source drift, distinct-key configuration dedupe, strict methods/queries/bodies, current forbidden roles, scoped API keys, revoked key replay, suspended workspace, actor/workspace fences, signed recipient paging, filter and parent/caller cursor rejection, actual history, and actual empty attempts have concrete HTTP/database assertions. The generated workspace's `api_rpm=100` update is scoped by its generated workspace ID. It does not alter the global limiter or turn this into rate-limit qualification.
- Real worker batches yield 100 then 30 rows, with 100 pending and 30 skipped. The harness checks frozen members/consent after current contact drift, compares frequency/usage/operations/outbox counts to their original fixture values, and verifies zero stored attempts at the end. There is no provider/send/approval invocation or fabricated accepted history.
- I viewed native `owner-progress-top-mobile.png` and `viewer-panel-mobile.png`. The former visibly shows 130/130 processed, 100 unapproved pending, 30 skipped, zero accepted/uncertain/attempts, false authorization/dispatch, wrapped immutable pins, and readable controls. The latter contains only the restricted-role explanation. The script also measures 390px page overflow and uses actual keyboard Enter to select a ledger.
- Retained first-through-tenth logs show earlier wrong fixture status expectations, timing waits, opaque-document initialization errors, and generated-workspace rate exhaustion. The current script still requires the actual expected status/error codes, complete paging row counts, exact recovery identity, and zero measured errors. I found no application assertions removed or relaxed to fabricate the final PASS. The worker report correctly does not call those harness-development failures application TDD RED.

## Limits

The harness compares parsed JSON bodies plus exact keys/actor/workspace, while the UI unit/source review establishes canonical serialization; it is not an independent raw-wire byte comparison. The browser cancellation recovery fixture cancels queued work and establishes response-loss recovery/identity, not materialized-recipient cancellation/history preservation by itself. That broader mutation invariant belongs to the separate storage tests. Keyboard selection, readable native pixels, and no horizontal overflow are useful measured checks, not an exhaustive mobile accessibility audit. The primary context network/page-error result must retain the scope described in the Minor finding until corrected.

Root's configured 919-test suite, lint, typecheck, API137 checks, build, and later whole immutable review are separate evidence and were not rerun here. Worker crash/restart/SKIP LOCKED, SQL privilege refusal, full approval, actual dispatch, paid usage, and production activation are outside this harness's proof. All 65 requirements and all 13 gates remain binding; this scoped review grants no whole-project acceptance.


## task-3-browser-correction-independent-review.md

# Task 3 bounded browser correction review

Reviewed 2026-10-03. **PASS: both findings from `task-3-browser-independent-review.md` are resolved. No new Critical, Important, or Minor finding established in the bounded correction.**

The inspected `scripts/smoke-submission-ledgers.ts` SHA-256 is `d3d25742af693d1c57363bbf07131d91a78b312ded9fe7f192ce68c08cbf0173`, matching the supplied frozen source and latest recorded verdict. This review covered only the two corrections, their nearby harness wiring, the documented keyboard readiness adjustment, and supplied probe/run evidence. No tests or runtime actions were rerun; no application code was changed. This report is the only write.

## Important finding closed: runtime destination binding

At lines 58–92, database admission now requires a PostgreSQL URL, literal permitted loopback hostname, and absence of query/fragment markers, including empty markers. It requires runtime and migration/fixture hostnames and effective ports to match. The runtime credentials remain independent for the intended runtime role; only the generated database pathname is substituted.

`guardOwnedDatabaseEnvironment()` runs at line 647 **before** `sourceDatabase` at line 648 can create/connect to its fixture. Its existing owned environment loader is in-memory only and emits no URL/credential. `fixtureRuntimeDatabase()` checks the generated fixture name and runtime authority again at line 649, before port probing and Next spawn. This directly closes the previously unguarded host/port inheritance, and rejecting query options also prevents PostgreSQL connection-string overrides from bypassing the inspected authority.

Read-only inspection of `/tmp/lettercape-submission-runtime-guard-probe.mjs` and `/tmp/lettercape-submission-browser/runtime-guard-probes.jsonl` supports the recorded RED→GREEN:

- Pre-fix remote runtime host and mismatched local port reached an intercepted Next spawn. The interceptor threw before starting Next, preventing a connection to either fake runtime destination. Generated local fixture databases were dropped, with before/after database sets compared.
- Pre-fix migration query-host override reached an intercepted migration CREATE query. That query was stopped before the unsafe pool connected.
- Final guard probes reject remote runtime host, wrong port, wrong protocol, migration query-host override, empty query marker, and empty fragment marker before Next spawn or unsafe migration CREATE. The script checks those refusal assertions explicitly. The final early guard means these rejected inputs do not create a fixture; the evidence's unchanged database set should not be interpreted as an actual create/drop in those final cases.

These probes are meaningful checks of the original missed boundary. They are not remote-network tests, and do not expose real credentials in their public results.

## Minor finding closed: both contexts measured

`guardBrowserContext` at lines 95–101 installs the external-origin blocker/counter and page-error listener. The primary context uses it before `newPage` (lines 324–326); the unsupported-Web-Locks context receives the **same** evidence object and installs it before its own page (lines 474 and 621–627). The final zero assertions at lines 488–490 therefore include both contexts and the existing interception-error collector. This closes the prior gap between the measured primary context and the broader combined-context claim.

The additional keyboard adjustment at lines 389–392 uses a Playwright trial action solely to wait for the same ledger button to be enabled, then still focuses it and uses actual keyboard Enter. It preserves the keyboard assertion rather than replacing it with a click. The report retains the intermediate timing failure and explains that no target GET had occurred while that control was disabled.

## Recorded result and limits

`/tmp/lettercape-submission-browser-reviewed-frozen.log` and `verdict.json` record the exact reviewed source passing all **18 checks**, finishing at `2026-10-03T09:07:17.088Z`. The recorded owned process is PID **61145**, port **3015**, with normal process stop and generated-database cleanup checks. The final combined browser network/page-error assertions passed. This corroborates the supplied execution; it is not a new execution by this reviewer.

The broader application qualification was not reopened. The original review's limits still apply: parsed canonical-body equality is not an independent raw-wire byte comparison; queued cancellation recovery alone is not proof of materialized-row cancellation preservation; mobile evidence is scoped; provider dispatch, complete approval, paid usage, SQL/worker qualification and whole-project acceptance remain separate. Root owns the refreshed configured suite, lint, typecheck, API checks, build and subsequent whole immutable review. All 65 requirements and all 13 gates remain binding.

---

## Retained record: whole-review.md

# Final immutable submission-ledger review

Reviewed 2026-10-03. Frozen commit: `fc952eb469e3aca1f00e157483122cb724d37999`. Reviewed main ancestor: `461fa56d4b903b558ba65c809fb468ed823a22d5`. The tracked working tree was clean throughout inspection. The diff contains 39 paths: the feature commit's 37 paths (including the two retained review/controller records), plus the two earlier committed design/plan documents.

**Verdict: CHANGES REQUESTED — 0 Critical / 1 Important / 0 Minor.** One additional expiry boundary requires a bounded correction before publication. No other concrete whole-slice defect was established. The previously corrected worker expiry, SDK If-Match, CLI URL, harness database-authority and second-browser-context findings remain closed.

This is a source/evidence review, not a new execution qualification. I read AGENTS.md, the design and implementation plan, the complete retained review and controller-rulings documents, scratch task reports, the pre-freeze qualification manifest, all changed handwritten implementation/test files, generated contract changes, relevant existing authority/transaction/snapshot/campaign/paging helpers, and the recorded final evidence. No tests, build, app, browser session, database, provider, private configuration, commit, push or remote query was run. Only this ignored report was written. Reading and hashing public source/evidence and viewing the two recorded native screenshots were read-only actions.

## Important I-1 — credential expiry during the keyed lock wait can still replay a historical receipt

**Locations:** `src/server/submission-ledgers.ts:55–56` and `:107–108`; supporting control flow at `src/server/commands.ts:16–27`, `src/server/auth.ts:96–111`, and `src/server/db.ts:24–26`. The idempotency table's tenant-only policy is established by `db/001-foundations.sql:27–31`.

Both new mutations check current authority and then return `keyed(...)` directly. `keyed` can block on `pg_advisory_xact_lock(hashtext(namespace))`. Once that wait ends, an existing matching receipt is returned directly from `idempotency`, without invoking the mutation callback or any ledger-table query. Neither these services nor their outer `withPrincipal`/`tenant` wrapper rechecks the credential deadline after that wait. API-key and local-session row locks prevent conflicting tuple changes from committing, but do not stop wall-clock expiry.

**Concrete trigger:** first commit an ordinary stage or cancel receipt under a still-valid credential. In a second connection, hold that command's exact advisory namespace: `workspace + ':' + user + ':' + action + ':' + key`, where action is `submission-ledger.create:<campaign>` or `submission-ledger.cancel:<ledger>`. Start the original same-key replay while the credential is valid; its authority checks pass, then it waits in `keyed`. Keep the advisory lock until database wall time passes the credential's existing deadline, then release it. The frozen code reads and returns the cached receipt as a successful 201/200 despite the now-expired credential. No concurrent revocation update is needed.

**Why the other controls do not close it:** ledger RLS checks current key expiry, but cached receipt replay never reads `submission_ledgers` or `deliveries`. The `idempotency` policy checks the workspace context and has no key/session deadline condition. `withPrincipal` checks before invoking the service; `tenant` commits and returns the callback result without a final authority check. The browser actor fence protects identity changes, not the deadline of the same actor's credential. The corrected worker's post-campaign-lock creator check applies to worker materialization, not this HTTP receipt path.

**Impact and severity:** a request can return protected historical ledger metadata after its API key or local session expires. The cached response includes resource/configuration/snapshot identities, creator information and historical counts. This violates the slice's current-authority requirement on original receipt replay. This is Important/P2 because it is an authorization boundary gap with a concrete blocking interleaving. It is not Critical: this demonstrated path exposes no addresses or message body, adds no provider attempt, and does not authorize sending. No production compromise or actual exploitation is claimed. Source tracing establishes the missing check; I did not execute this interleaving.

**Bounded correction:** retain the current pre-keyed checks, await the keyed result, reassert `assertSubmissionAuthority(tx, p, true)` in the same transaction, then return the result. Apply this to both stage and cancel so cached and fresh success paths are covered and a failed final check rolls back any new command/receipt. Existing `configureCampaign` already uses a final authority check after `keyed`, providing an established local pattern. If a post-lock check is also added inside the create callback, preserve the original receipt-before-version/digest/state ordering required by browser recovery. Do not move version validation ahead of historical receipt lookup or weaken exact command identity.

**Validation suggestion:** add a native two-connection regression for each mutation. Seed an actual successful receipt, hold the exact advisory lock, start a replay using a near-expiry credential, and observe the replay waiting on the actual advisory-lock query before waiting past database wall time. Release the blocker and require `AUTH_REQUIRED`, rather than the old successful receipt; assert unchanged ledger/delivery/history/receipt counts. Exercise the API-key and local-session deadline paths, plus a still-valid replay control returning the identical receipt. Show old-source RED and corrected GREEN; retain the existing worker lock-wait regression and source-drift replay assertions. No provider, remote database, or private data is required.

**Cost judgment:** low, bounded service changes plus focused native transaction regressions; no migration, public API/schema, SDK, browser command format, or dispatch policy change is necessary. The short blocking tests add fixture coordination and elapsed time, but directly test the missed authorization boundary. Root owns that correction wave and its independent scoped re-review.

## Whole-slice checks without additional findings

- **Storage and immutable identity:** migration 037 pins campaign/configuration/revision/artifact/snapshot and exact sorted captured members through composite tenant FKs, existing immutable source bindings, and manifest guards. Configuration uniqueness and configuration/contact uniqueness survive distinct command keys and cancellation. The database derives the lowercase SHA-256 logical key from fixed canonical UUID JSON. Historical contact IDs intentionally survive missing live contacts. Captured locale/reason/consent data comes from the frozen member array, not current eligibility or caller authority flags.
- **Atomic worker progress:** the worker locks a queued/running job with SKIP LOCKED and materializes at most 100 members per invocation. The per-job transaction bookkeeping prevents a second batch in the same transaction from exceeding the bound. Immediate and deferred guards require exact recipient/delivery/progress equality and complete cancellation before commit. The caller owns the transaction; no partial batch/history survives rollback. Current worker membership and creator membership/key/scope checks, the repaired post-campaign-lock expiry check, and SQL wall-clock recipient admission remain intact. Paused/cancelled campaigns and revoked creators stop the remainder while preserving durable identities/history.
- **No manufactured dispatch:** only pending/skipped/cancelled deliveries with unknown outcome and false authorization can exist. Runtime cannot write attempts or arbitrary history; attempt CHECK(false) also refuses privileged fabricated insertion. History uses the narrow NOLOGIN/non-bypass trigger role. Immutable/delete/truncate guards and transition checks prevent rewinds. No new send/provider/network/Redis/usage/frequency/outbox path is present in the staged worker or mounted service.
- **HTTP and SDK integration:** the catch-all admits the eight specified operations before generic campaign dispatch, applies the 16 KiB body cap, performs actor checks and current manager/audience/campaign scope checks, and keys each mutation once. Fixed projections omit member arrays, addresses, HTML, payloads and credentials. Signed paging binds actor/workspace/resource/parent/filter. Static JSON comparison of the generated OpenAPI against 461fa56 found exactly eight added operations and eleven added schemas, with no semantic change to any prior operation or schema. Generated operation metadata and types match the generator. The corrected SDK independently requires explicit keys and source-command If-Match; it preserves serialized bodies/keys for supported retries and retains the source-command automatic-retry exclusion.
- **Browser recovery and PII:** the strict bounded store records the canonical original create/cancel body and key before POST under exactly workspace/actor/campaign. The shared coordinator prevents synchronous duplicate dispatch; origin Web Locks span admission, transport, bound receipt validation, fresh detail and exact acknowledgment. Missing locks/storage fail closed. Context/version fences abort stale work and leave the original command recoverable. Only an original create POST's exact VERSION/DIGEST/STATE 409 can persist dismissal classification, after keyed receipt lookup; cancellation/auth/unknown/fresh-read errors do not acquire it. Mounted campaign transitions do not restore a rejected source version to an executable staging state. Current nonmanager markup contains no recipient or mutation surface. Native recorded pixels visibly show 130 processed, 100 unapproved pending, 30 skipped, zero attempts and false authorization/dispatch; the Viewer image shows only the permission explanation.
- **Local process/database boundaries:** CLI validation rejects unsupported protocols, nonloopback destinations, malformed URLs and query/fragment delimiters before tenant connection. Both effective harness PostgreSQL URLs are checked for strict loopback authority and matching effective ports before fixture creation, then checked again with the generated database name before Next spawn. Runtime credentials remain separate without changing destination. The child receives a minimal environment; normal cleanup signals only its owned ChildProcess and drops only the helper's generated database. Both browser contexts register the same external-request blocker and page-error collector before pages open. The recorded intercepted RED/GREEN probes support these corrections without claiming any fake remote connection occurred.
- **Truthful release state:** capability/checkpoint documentation retains Partial REQ-036, historical captured facts, absent current eligibility/approval, empty actual attempts, and blocked production sending. All 65 requirements and 13 gates remain binding. `release-gates.json` still has no accepted gate/evidence. Pending whole-review/canonical-publication wording is truthful for this frozen checkpoint. Intermediate fixture failures and corrected findings remain visible in the historical reports rather than being presented as final qualification.

## Recorded evidence and limits

The six log SHA-256 values in `pre-freeze-qualification.json` all match the supplied files. I inspected the configured suite's final 920 tests / 920 pass / 0 fail / 0 skips, including explicit native IndexedDB and media-decoder success lines, plus the native ledger/storage/worker cases. Lint and typecheck logs contain no diagnostics; API check reports 137 matching operations; the build log reaches completed route output. The startup log reports the expected refusal for incomplete full-GA evidence; expected exit 1 is recorded by the manifest/controller.

`/tmp/lettercape-submission-browser/verdict.json` records PASS with 18 checks, UTC completion `2026-10-03T09:07:17.088Z`, owned PID 61145 and port 3015. Its harness hash matches the frozen script. All eight source hashes in its qualified-source manifest match the inspected files; Task 1's final source/test hashes also match. The final recorded stdout agrees with the verdict, including process/database cleanup. The harness's zero external requests/page errors covers both instrumented browser contexts. Synthetic 401/503 and seeded original conflict commands remain explicitly identified; the conflict 409s and committed-response losses use actual HTTP.

These are verified retained records, not independently repeated executions. The existing 920 tests and 18 browser checks do not cover I-1's expiry during a cached-receipt advisory-lock wait. Parsed browser-body equality is supported by canonical serialization inspection; it is not an independent raw-wire byte capture. Queued browser cancellation recovery is supplemented by native materialized-recipient cancellation/history tests. Mobile screenshots and keyboard selection are scoped checks, not exhaustive accessibility qualification. No load, production identity, provider, real delivery, charged usage or whole-PRD acceptance follows from these results.

Static `git diff --check 461fa56..fc952eb` reports one extra blank line at EOF in the retained review document at line 448. This is documented as trivial artifact hygiene, not an additional Minor correctness finding or a reason to broaden the correction. Removing that blank line is optional zero-behavior-cost cleanup. Earlier task-scoped diff checks predate that assembled document and are not represented here as a clean final whole-diff check.

The inherited sender-navigation correction is present through reviewed ancestor 461fa56. I read `/tmp/lettercape-ci37103963077-fix/sender-navigation-report.md`, which distinguishes its actual local RED/GREEN from the failed earlier remote run. The reported remote ea4407e CI result does not qualify this candidate. No remote status was queried or inferred. Original 109/221 row-hash/private-metadata preservation, canonical synchronization, publication and exact-head terminal CI remain controller-owned and unestablished by this review. No provider/send/spend activation is authorized. After the one bounded correction and scoped re-review, root must retain those publication and full-acceptance limits.

---

## Retained record: whole-fix-report.md

# Whole-review correction — authority after keyed lock waits

Accepted I1 whole-review finding: staging and cancellation returned keyed results without a final current-authority check. Their advisory lock can wait past API-key or local-session expiry, then return cached responses or admit fresh commands. Within the same bounded correction, root confirmed that callback business errors also need current authority after blocking resource locks; a stale-version fresh command could return private current-version metadata before reaching the final check.

## Exact bounded scope

Changed only `src/server/submission-ledgers.ts` and `tests/submission-ledgers-db.test.ts`, plus this requested own scratch report. Both services retain their initial authority check and original keyed receipt lookup. Inside each keyed callback they now recheck `assertSubmissionAuthority(tx,p,true)` immediately after the potentially blocking campaign/job FOR UPDATE query, before resource-existence, version/digest/state responses or mutation. Both services also await the keyed result, recheck authority again and only then return it. Historical receipt lookup still precedes callback version checks; final checks protect cached responses and expiry during callback execution. No public contract, shared authorizer/helper, worker, schema, API, browser or unrelated file was changed.

No commits, pushes, providers, network requests, existing service changes or original database writes were performed. All database proof used generated disposable loopback PostgreSQL fixtures through the approved `sourceDatabase` helper and restricted runtime role. This is one bounded I1 wave, including root's explicitly requested error-exit extension.

## Meaningful actual PostgreSQL RED

The seven new regressions use a separate connection to hold the exact command's idempotency advisory lock. A credential is valid before the waiter starts. `pg_stat_activity` and `pg_blocking_pids` prove the command has passed initial authority and is waiting on `SELECT pg_advisory_xact_lock(hashtext($1))`. Database wall time proves the credential is still valid when the advisory wait is observed, then waits precisely until expiry and proves it expired before releasing the blocker. No arbitrary fixed delay establishes admission or expiry.

Initial RED command:

```
node --import tsx --test --test-name-pattern='idempotency lock wait' tests/submission-ledgers-db.test.ts
```

Before the final-check implementation: **0 passed, 6 failed, 0 skipped**, 17631.187417 ms. All failed with missing AUTH_REQUIRED rejection: cached stage/cancel × API key/local session, plus fresh stage/cancel with local sessions. These tests exercised the real production services without mocking keyed or authority.

Same-wave error-exit RED after the two final checks were added:

```
node --import tsx --test --test-name-pattern='fresh stale-version stage' tests/submission-ledgers-db.test.ts
```

Result: **0 passed, 1 failed, 0 skipped**, 3106.240125 ms. Actual VERSION_CONFLICT, expected AUTH_REQUIRED, reproduced the private-version error response after session expiry. The post-resource-lock callback checks correct this error-exit path.

## Final GREEN and preservation evidence

Exact final scoped regression command:

```
node --import tsx --test tests/submission-ledgers.test.ts tests/submission-ledgers-db.test.ts tests/submission-ledger-worker.test.ts
```

Result: **21 passed, 0 failed, 0 skipped**, 23168.366334 ms. All prior 14 checks pass, plus all seven authority regressions. Cached stage/cancel reject with AUTH_REQUIRED for both credential types. Original idempotency responses, immutable manifests and job states compare identically as PostgreSQL rows before and after the denied replay. Fresh local-session stage and cancel reject with AUTH_REQUIRED and retain exactly the pre-command ledger, job, delivery, history and receipt rows; no expired fresh command commits mutations. The stale-version case now returns AUTH_REQUIRED and preserves the original campaign, with no ledger or receipt created.

The intermediate final-check implementation also passed the six original new regressions while exercising rollback after fresh callback writes. The final post-lock callback check denies those observed expired credentials earlier, before writes or private business errors; the final check remains as the rollback guard for expiry during fresh callback execution. Fresh API writes already have current-key SQL RLS/admission checks. No permissive authorizer or test-only production path was introduced.

Scoped `npx eslint src/server/submission-ledgers.ts tests/submission-ledgers-db.test.ts` and `git diff --check` both exit 0. Final diff scope: two files, 97 insertions and 2 deletions (10 service lines and 89 test lines). Parent explicitly owns configured full suite, global lint/type/API/build, actual browser and bounded fix rereview; none of those global checks was rerun or claimed here. No additional failure or remaining blocker was found. Complete PRDv2 all65/all13 remains binding, with zero whole-PRD acceptance.

Final SHA256:

```
4f6890741e35d03cb536b3d36ecb2aedc969f384e4d5158b5cdcef61b8e8ef12  src/server/submission-ledgers.ts
17feb5ecff780f81d9803f2ff11a64c4985150eff084c6999e1293cf223e5ba3  tests/submission-ledgers-db.test.ts
```

---

## Retained record: whole-fix-independent-review.md

# Bounded I-1 correction review

Reviewed 2026-10-03. **PASS — I-1 is closed. New findings: 0 Critical / 0 Important / 0 Minor.** The final authority checks and the same-wave callback checks resolve the reported credential-expiry gap for staged-ledger creation and cancellation. No additional application correction is requested in this scope.

This is only the independent scoped re-review of the single bounded correction wave, not a second whole-slice review. I inspected the two changed files against frozen `fc952eb469e3aca1f00e157483122cb724d37999`, the correction report, and the already-reviewed surrounding keyed/transaction authority behavior. No tests, build, runtime, database, browser, provider, private-data, commit or push action was performed. This report was written and the original ignored whole-review report received only the requested file-count sentence correction; its original verdict and finding remain preserved as historical evidence.

## Source binding and closure

Both current file hashes match the supplied final correction exactly:

```text
4f6890741e35d03cb536b3d36ecb2aedc969f384e4d5158b5cdcef61b8e8ef12  src/server/submission-ledgers.ts
17feb5ecff780f81d9803f2ff11a64c4985150eff084c6999e1293cf223e5ba3  tests/submission-ledgers-db.test.ts
```

The tracked diff from fc952eb contains only those two files. I compared the other 37 paths in the original 39-path `461fa56..fc952eb` diff directly against Git's frozen bytes: all 37 are unchanged. This binds the original whole-review conclusions and closed scoped findings outside I-1 without reopening them. Root's later document assembly/EOF cleanup was not present during this comparison.

At `src/server/submission-ledgers.ts:56–82`, create now awaits `keyed`, checks current submission authority again at line 81, and returns only after that check passes. At lines 111–122, cancel uses the same final check at line 121. Thus an existing successful receipt obtained after an advisory-lock wait cannot be returned under an expired API key or local session. A failed final check propagates through the existing caller-owned transaction, which rolls back any new ledger/cancellation/history/receipt changes before returning an error.

The create callback rechecks authority immediately after campaign FOR UPDATE (line 58), before resource-existence, version/digest/state errors or mutation. Cancel rechecks immediately after job FOR UPDATE (line 113), before existence responses or cancellation. These checks cover a credential that expired while waiting for either advisory or resource locks and prevent the same-wave stale-version/private-current-version response. The final checks additionally cover expiry during successful callback execution. The initial current-authority checks remain, so unauthorized callers cannot enter the keyed lookup initially.

Historical receipt lookup remains inside unchanged `keyed` and still precedes callback source/version/state validation. Successful old receipts therefore preserve the original command identity under later source drift when current authority remains valid. No route, schema, SDK behavior, recovery classification, SQL privileges, worker, dispatch policy or public response shape changed. This retains the original review's low bounded implementation-cost judgment; the extra callback checks are part of closing the same authority boundary on its error exits.

## Regression evidence and its limits

The new helper at `tests/submission-ledgers-db.test.ts:128–151` uses a separate connection to hold the exact idempotency namespace. It verifies the waiter through the exact production query plus `pg_blocking_pids`, proves the credential is still valid once that wait is observed, then uses database wall time to wait past its deadline and prove expiry before releasing the blocker. It calls real services through restricted runtime transactions, without mocking authority or keyed execution. Test-controlled SQL table/column choices are internal constants for API-key/local-session fixtures.

The seven new cases are meaningful coverage of the missed boundary:

- Four cached-receipt cases cover stage/cancel crossed with API-key/local-session expiry and require `AUTH_REQUIRED`, preserving exact stored receipt, manifest and job rows.
- Two fresh local-session cases cover stage and cancellation of materialized work; ledger/job/delivery/history/idempotency rows must remain exactly unchanged after rejection. In the final implementation, expiry already established during the advisory wait is rejected by the callback check before writes. Therefore these final cases prove refusal and preservation, rather than independently forcing the final post-write rollback branch.
- The stale-version create case requires `AUTH_REQUIRED` instead of `VERSION_CONFLICT`, preserves the campaign, and commits no ledger or receipt. It directly checks the same-wave business-error correction.

The retained `whole-fix-report.md` records initial actual PostgreSQL RED of six failures (0 pass / 0 skipped), the later stale-version RED (0 pass / 1 failure / 0 skipped; actual VERSION_CONFLICT versus expected AUTH_REQUIRED), and final **21 pass / 0 failures / 0 skips**, duration 23168.366334 ms. The final count preserves all 14 prior scoped checks plus these seven regressions. It also records scoped lint and diff-check exit 0. These are implementer/controller execution records inspected by this reviewer, not independently rerun results. The report distinguishes the intermediate final-check implementation's rollback proof from the final earlier-admission check; this distinction is accurate by source inspection.

The existing worker campaign-lock expiry regression remains unchanged. A separate new resource-lock-only race is not executed by the seven new cases; placement immediately after each FOR UPDATE establishes that coverage by source reasoning. The final tests do not independently force expiry after the callback recheck but before the final recheck; the final transaction guard's placement and the reported intermediate rollback execution support that branch. Neither limitation leaves I-1 open or warrants broader speculative changes.

## Remaining controller work

The original whole review is now resolved by this scoped PASS at the two hashes above. Fresh global configured-suite/lint/type/API/build and actual HTTP/Chromium requalification were controller-owned and pending at the re-review request; no result from that concurrent work is claimed here. The earlier 920/920 and 18-check records remain historical evidence for the pre-correction source, not a fresh whole qualification of these changed bytes.

Canonical preservation, source publication and exact-head terminal CI remain controller-owned. The previously failed remote ea4407e run does not qualify this candidate. All 65 requirements and all 13 release gates remain binding with zero whole acceptance. Approval/current eligibility/provider attempts/real sending/paid usage/production startup are not established or activated by this correction or review.
