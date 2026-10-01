# Durable Creation Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans natively, task-by-task. One fresh whole-slice Astrahigh reviewer and one Critical/Important RED→GREEN pass. Continuous native execution is already authorized.

**Goal:** Make existing creation work durable, fairly admitted and recoverable without duplicating uncertain external AI effects.
**Architecture:** PostgreSQL owns budgets/leases/attempts and usage; separate ID-only BullMQ queues are rebuildable wakeups. Narrow NOLOGIN scheduler/worker functions enforce current authority and token fences; web runtime does not serve as the production worker identity.
**Tech Stack:** Existing Node24/TS6/PostgreSQL17/Redis/BullMQ6/Next16; no dependency or paid service added.
**Spec:** docs/superpowers/specs/2026-10-01-creation-queue-design.md. Depends on completed membership lifecycle publication.

## Global Constraints
- Full Baseline A:65requirements/13gates remain binding; zero public/provider/spend success invented.
- Version creation-1: generation120s/three transient failure attempts; terminal refusal/policy errors, Retry-After deferral without failure consumption, ambiguous external effects never generic retries.
- Global2/workspace1 active claims; workspace unfinished backlog1,000; scheduler batch25;30s renewable leases/10s renewal/five-second external-start grant.
- Separate generation/extraction UUID-only wake queues; PostgreSQL is durable truth, BullMQ attempts1, no Pro purchase.
- Workspace→member→key→operation locks, post-lock database-clock key expiry; no database transaction spans HTTP.
- Public operation states remain compatible; AI_RECONCILIATION_REQUIRED explicitly retains unresolved accounting and never automatic retry.

## Review Focus
- Kill worker after recording provider start but before acknowledgment: restart must not repeat AI effect or release unresolved reservation.
- Late worker acknowledgment after lease takeover/cancel/revocation: current token/state fences, no overwritten proposal or doubled usage.
- Redis loss or duplicate/stalled wake jobs: SQL reconciliation and tenant fairness, no PII in queue and no unbounded admission.
- Role/key expiry during authority-lock waits and ownership administration: same lock order/no deadlock, no stale current grant.
- Rate-limit deferral/terminal refusal/configuration/output errors and UI reload: exact finite budget, preserved draft, explicit unknown accounting rather than fabricated provider success.

### Task1: Pure retry and wake contracts
Files create src/domain/creation-queue.ts, tests/creation-queue.test.ts.
Interfaces produces CreationWake.strict({workspace_id:UUID,operation_id:UUID}), CREATION_POLICY constants, creationJobId(wake):string and decideCreationOutcome(input):CreationDecision. Input{type:'brand.extract'|'email.generate',outcome:'success'|'not_started'|'safe_transient'|'rate_limited'|'terminal'|'ambiguous',external_started:boolean,cancel_requested:boolean,failure_attempts:0..3,now_ms:number,deadline_ms:number,retry_after_ms?:number,jitter?:number}; Decision{state:'queued'|'succeeded'|'failed'|'cancelled',next_at_ms:number|null,failure_attempts:number,accounting:'consume'|'release'|'retain',code:string|null}. Terminal after generation external start retains unless known success; brand reads have no generation charge.
- [x] Write missing-module RED tests: wake rejects role/input/token/PII/foreign-key format and deterministic composite job IDs; constants exact; generation ambiguous or crash-started retains/fails (cancel→cancelled); pre-start cancel releases; success consumes once/suppresses cancelled proposal;3safe failures stop;429 preserves failures/earliest delay and deadline; unsafe/malformed timing rejects.
- [x] Run node --import tsx --test tests/creation-queue.test.ts. Expected missing-contract FAIL.
- [x] Implement exact exports/policy using strict bounded Zod and deterministic injectable jitter; never random provider retry assumptions.
- [x] Focused tests then npm test. Expected all PASS. Commit pure contract plus plan/spec.

### Task2: Restricted durable SQL/storage
Files create db/023-creation-queue.sql, src/server/creation-queue-store.ts, tests/creation-queue-db.test.ts; modify src/server/operations.ts admission limit and tests fixtures as necessary.
Consumes Task1 contracts. Produces claimCreation(pool,wake):Promise<CreationClaim|null>, beginCreationAttempt(pool,claim):Promise<CreationContext|null>, settleCreation(pool,claim,outcome):Promise<boolean>, renewCreation(pool,claim):Promise<boolean>, dueCreation(pool):Promise<CreationWake[]>, recoverCreation(pool,wake):Promise<boolean>. Claim{workspace_id,operation_id,token,lease_until,deadline_at}; private context includes original type/input and bounded current same-tenant brand/memory only after token/authority check.
- [x] RED real PostgreSQL owned tests: narrow runtime/scheduler/worker permissions, missing/foreign context, capacity/fairness between two workspaces, duplicate claims, exact immutable evidence, cancel/revoke/expired key admission, stale token, post-start crash accounting versus safe pre-start recovery and idempotent settle/release.
- [x] Run focused test expecting absent migration/store FAIL, then implement additive constrained tables/functions and service; preserve old data and future webhook workers.
- [x] Migrate owned DB; focused tests→PASS, full tests/lint/typecheck→PASS. Commit.

### Task3: Separate rebuildable queues and actual process recovery
Files create src/server/creation-queues.ts, src/server/creation-engine.ts, src/server/creation-worker.ts, tests/creation-engine.test.ts, tests/creation-worker-restart.test.ts and owned process fixture; modify existing src/server/worker.ts to guarded compatibility entry, ai.ts/safe-fetch.ts cancellation adapters, package scripts/CI/env example.
Consumes Task2 store functions. Engine runCreation(claim,adapters,signal):Promise<void>; adapters{extract(context,signal),generate(context,signal)} production adapters are existing real implementations, fixture adapters strictly owned loopback. Queue enqueueCreation(wake,type), reconcileCreation(), closeCreationQueues(); data strict Task1 wake only.
- [ ] RED engine/tests and distinct owned-process HTTP fixture: kill after effect commit/withhold acknowledgment; SQL recovery retains AI reservation and prevents second request, old tokens deny; separate pre-start kill safely requeues, Redis wake loss rebuilds and duplicates have one effect; global/per-tenant limits honored.
- [ ] Implement BullMQ ID-only queues, SQL periodic reconciliation, graceful cancellation/renewal and restricted worker pool. Production entry refuses incomplete/nonempty same-build gates/private worker identity before queue/provider access. Real AI not configured remains truthful pre-start failure.
- [ ] Run focused engine/restart tests and existing key-worker/cancellation tests→PASS; full suite/checks→PASS. Commit.

### Task4: Truthful operation recovery UI/API
Files modify operation route/schema generator/sdk, src/ui/api.ts and creation status controls; create scripts/smoke-creation-queue.ts.
Consumes store/engine evidence. Return redacted attempt/accounting metadata, never private context/token/credential in API/audit/logs. Existing polling terminates on compatible failed/cancelled with precise AI_RECONCILIATION_REQUIRED message.
- [ ] RED actual HTTP/Chromium missing metadata/unknown accounting; implement bounded signed history and explicit recovery state, no automatic retry/empty success/draft overwrite.
- [ ] Verify interruption/repeated click/lost response/reload/workspace navigation/mobile, configured-provider absent, queue/idempotency/accounting; existing membership/authority/key/contract smokes; full tests/lint/typecheck/API/build. Expected PASS. Commit.

### Task5: Single review/publication
- [ ] One fresh Astrahigh reviewer of complete BASE..HEAD/plan/spec/ledger and all five review focuses. Regrade by effect; one Important/Critical RED→GREEN pass, Minors deferred and all declined judgments ruled.
- [ ] Final tests/full checks/owned HTTP/Chromium; canonical clean expected-head check and tracked-only hash-verified sync; authorized ordinary push; exact-head CI readback. No production activation until private setup/full13gates accepted.
