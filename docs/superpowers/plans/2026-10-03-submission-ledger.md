# Durable staged recipient ledger implementation plan

Use superpowers:subagent-driven-development and disjoint parallel scopes; root owns shared integration. No worker subagents, commits/pushes/provider activation. Continuous full-PRD authorization supersedes routine reversible design reapproval. Spec: docs/superpowers/specs/2026-10-03-submission-ledger-design.md. Base0b0ede54313b53f54788bac9b14494ff61d595f7. Existing configured881/881 baseline and exact qualified app bytes retained; this code-only isolated checkout has no private config/PRD copies. All65/all13 remain binding, zero whole acceptance.

## Task1 — domain/storage/services/worker

Own db/037-submission-ledgers.sql, src/domain/submission-ledgers.ts, src/server/submission-ledgers.ts, src/server/submission-ledger-worker.ts, scripts/run-submission-ledger.ts, tests/submission-ledgers.test.ts, tests/submission-ledgers-db.test.ts, tests/submission-ledger-worker.test.ts. Keep meaningful functions/readable formatting. Server exports assertSubmissionAuthority(tx,p,write), stageSubmissionLedger(tx,p,campaign,body,key), submissionLedgerDetail(tx,p,id), submissionLedgerList(req,tx,p,campaign), submissionLedgerRecipients(req,tx,p,id), cancelSubmissionLedger(tx,p,id,key), deliveryDetail(tx,p,id), deliveryHistory(req,tx,p,id), deliveryAttempts(req,tx,p,id). Worker exports processSubmissionLedgerBatch(tx,p). Domain exports strict schemas/types SubmissionLedgerInput/View,StagedRecipientView,DeliveryHistoryView,DeliveryAttemptView. Add stable deterministic identity helper server-only or browser-safe asynchronous SHA as appropriate; no node:crypto import in client-reachable domain graph. Root extends paging resource union to submission-ledgers,staged-recipients,delivery-history,delivery-attempts; temporary TypeScript casts permitted only until root union lands, flag them.

- [ ] Write meaningful domain and actual restricted DB RED, absent modules/schema must fail rather than skip.
- [ ] Implement immutable staging schema/guards, current authority and keyed service with one configuration ledger, no send/usage/frequency/outbox activation. Guard fake accepted/uncertain/outcome/attempt mutations.
- [ ] Implement durable max100 batch and explicit local-only CLI. Prove transaction rollback, restart/duplicate/concurrent SKIP LOCKED, immutable source drift, creator revocation and cancelled campaign/ledger preservation, zero events/reservations/provider attempts. Generated isolated databases only, preserve original data/services.
- [ ] Run exact scoped tests0skip/lint/type, report RED/GREEN, hashes and self-review in own scratch task-1-report.md. No commit/push.

## Task2 — browser-safe UI/recovery

Own src/ui/submission-ledgers.tsx, src/ui/submission-ledger-recovery.ts, tests/submission-ledger-recovery.test.ts. Root owns campaign mount only. Props/schema/API frozen in spec; use existing campaign/assessment/paging transport conventions, all requests X-Actor-Id. Strict scopes use only workspace/actor/campaign, no enriched props spread. Use shared coordinator+origin locks; no duplicate bodies/keys or silent version drift. Write meaningful RED recoverystore/coordinator/result binders, implement owner/admin-only staged progress/recipient/detail/history/empty attempt list/cancel controls with loading/error/empty/refresh/paging and mobile. Explicit exact definitive rejection handling only after verified ordering, no generic errors. Record actual unitRED/GREEN/scopedlint/type/self-review in own scratch task-2-report.md; no services/browsers/commits/push.

## Task3 — root API/SDK/browser/review/canonical publication

Own src/server/submission-ledger-route.ts, catch-all route, method/scope/paging unions, src/ui/operations.tsx mount, API generator/generated OpenAPI/SDK, scripts/smoke-submission-ledgers.ts, package/workflow, capability/checkpoint docs. Write exact route/scope RED then integrate8 operations; no recursive keyed wrapping or missing current authority. Actual isolated local HTTP/Chromium fixtures useowned3015/disposablePG, explicit localenvguard, UUIDcleanup/pinnedclient only; no existingapp kill/provider calls. Test original recoveries/two clicks/two tabs/navigation/version drift/empty/errors/cancel/paging/390px/disabledproduction. Full configured suite/lint/type/API/build, fresh task reviews +one whole review/one correction wave. Preserve original109/221/private metadata and synchronize canonical by FF afterqualification, directauthorizednonforcepush, exactheadterminalCI. Keep allledger/rulings untilfinaldelivery.

## Review focus

1. Staging never grants approval/sendability, creates attempts or reserves paid/frequency work; current SQL rejects forged states/outcomes.
2. Immutable configuration/snapshot/member pins + per-recipient logical dedupe survive keys/retries/source drift/cancel.
3. Worker crash/restart/concurrency bounded atomic progress and revoked creator/key/workspace/campaign fences.
4. PII current Owner/Admin/campaign+audience scopes before replay; no caller authority flags or browser node import.
5. Exact browser command identity before POST, durable ambiguity, strict definitive rejection, shared controls and stale context fencing.
