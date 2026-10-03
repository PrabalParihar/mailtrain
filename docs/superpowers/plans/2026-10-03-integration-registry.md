# Integration registry implementation plan

> For agentic workers: use superpowers:subagent-driven-development task-by-task.

Goal: Durable unverified account binding, credential-reference versions, revocation and redacted wrappers before qualified export admission.
Architecture: restricted Postgres functions/history plus browser-safe strict schemas and parameterized unmounted store. Existing TS/Zod/Postgres, no dependencies.
Spec: docs/superpowers/specs/2026-10-03-integration-registry-design.md.

## Global Constraints
Full65 BaselineA/all13 GA gates/zero whole accepted. No OAuth/provider/credential resolver/send/public route/worker activation/spend/push/deploy. No private env/PRD copy/read/hash; normal trusted test-config loading existing guarded fixture permitted. Only owned generated loopback DBs, preserve original109/221. Strict schemas and fixed SQL; can_export=false/verified_at NULL permanent. Complete reports/failures/rulings retained before only own scratch cleanup.

## Review Focus
Concurrent ID/account registration and rotation/revoke races must serialize without duplicate history.
Current actor/workspace revocation while waiting must refuse mutation; declared role flags never authorize.
Null inputs, PostgreSQL three-valued logic, malformed text/UUID and timestamp relationships must refuse.
Runtime/PUBLIC/other workers cannot read credential/account values or mutate tables; redacted returns exact.
Register replay after rotation/revocation must preserve current state and original binding without new events.

### Task 1: Durable SQL and database behavior
Own db/035-integration-registry.sql and tests/integration-registry-db.test.ts only. Read spec for exact SQL interfaces/schema/authority/transitions/outputs. Existing tests/fixtures/creation-database.ts and scripts/smoke-source-truth.ts build owned isolated DBs; no original DB mutation. No product TS/UI/package/docs edits. Report .superpowers/sdd/integration-registry/task-1-report.md.
- [x] Write meaningful behavioral RED using a temporary executable permissive schema, retain failed output and remove only scaffold; do not settle for undefined import/function failures.
- [x] Implement migration/functions/RLS/history and all exact semantics from spec.
- [x] Run owned node --import tsx --test tests/integration-registry-db.test.ts (escalated loopback), scoped lint/diff; meaningful privilege/concurrency/revocation/rollback/restart/redaction assertions.
- [x] Self-review SQL lock order/NULL checks/grants/triggers/output, commit exact2files and full report with commands/status/log hashes/failures/limitations. No subagents.

### Task 2: Strict domain and redacted server wrappers
Own src/domain/integration-registry.ts,src/server/integration-registry.ts,tests/integration-registry.test.ts,tests/integration-registry-store-db.test.ts. Consume exactTask1 SQLinterfaces only after reviewed. Exports schemas/wrappers in spec; no routes/providercalls. Report .superpowers/sdd/integration-registry/task-2-report.md.
- [x] Meaningful executable RED against permissive scaffold before strict implementation; include unknown-secretfields/readinesstrue/malformedUUID/versions/controls/surrogate/blocker/timestamp/foreign current authority.
- [x] Implement strict zod schemas and parameterized wrappers; unit malformed inputs issue zero SQL, extra/private DBoutput rejected, errors not rendered with payloads.
- [x] Actual owned DBwrapper register/replay/rotation/revocation/rollback/newconnectionreadback persists private history; cross-tenant/current authority denied; no operations/outbox/usage/providerIO.
- [x] Scoped unit/DB/type/lint/diff, exact4filecommit and full report. No subagents.

### Task 3: Root delivery and review
Own docs/checkpoint/plan/package/CI only if meaningful entrypoint needed; no new public endpoints. Tasks separate spec+quality reviews, then full qualification and ONE immutable whole review; if findings ONE completeworker and ONE scopedre-review then explicit residualrulings. Retain full reports/briefs/currentledger/rulings verbatim in committed canonicalcheckpoint. Guarded local sync with original/private preservation, no publicreadiness. Canonical build/browser while ownedapps paused, restore after fixtures.
- [x] Taskreviews and fullconfigured tests/type/lint/API122/build/Linux and prior4actualbrowser journeys.
- [x] ONE whole review/one completefix+scopedifnecessary; preserve full findings/evidence.
- [ ] Guarded canonical sync/qualification/codeequivalence/privateoriginal checks/reportsretention/onlyown scratch cleanup; continue independent GAwork.
