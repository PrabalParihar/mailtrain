# Dispatch Policy Controls Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans natively, then one fresh whole-slice reviewer and one Important/Critical RED→GREEN pass.

**Goal:** Add real persistent global/provider/workspace stop policies, tenant management and a shared transaction fence that denies stale dispatch policy decisions. Preserve opt-out and evidence paths.
**Architecture:** PostgreSQL global/provider policies are readable by runtime but writable only through separate restricted operator authority; tenant policy uses forced RLS plus current management checks. Policy mutation triggers acquire the same exclusive advisory keys that final policy reads acquire in shared mode, in fixed global → provider → workspace order. Missing/invalid policies fail closed. This is a policy fence, not complete provider submission authorization; real sending stays disabled until campaign/consent/budget/provider/release gates also pass.
**Tech stack:** Existing PostgreSQL/TypeScript/Zod/Next API and owned Chromium fixtures, no paid dependency or new provider connection.
**Spec:** Authoritative completed PRD REQ-037/060,TECH-044/110,TST-20,GATE-08; existing user-authorized full build plan. No approval or baseline reduction is introduced.

## Global constraints

- Seed global/provider stops engaged; a missing tenant policy is stopped. Releasing a workspace stop does not enable sending or bypass other stops/gates.
- Global/provider changes require a distinct NOLOGIN operator role; never customer API keys, runtime DB authority or ordinary membership. Production operator identity/MFA/provisioning remains a release gate.
- Workspace change requires current Owner/Admin session, exact version and keyed replay. It never deletes evidence, disables recipient opt-out or refunds uncertain submissions.
- Mutations increment version and preserve append-only policy evidence. No private incident text or credential is accepted.
- Existing drafts, exports, contacts and campaigns remain intact. No external calls, actual sends or deployment.

## Review focus

- Runtime cannot mutate global/provider policies, operator cannot read customer data, tenant foreign IDs/current revoked roles fail, encoded bearer paths cannot bypass session-only rules.
- Race initial read → policy pause → final fence denies; a transaction already holding a fence blocks a pause commit and must finish before cutover. Missing rows and stale version deny.
- Workspace UI shows all effective stops and explicitly says unpause is not activation; offline/repeated clicks/lost response/version conflicts/workspace navigation preserve safety.
- Recipient suppression/preference POST remains usable with all stops engaged. Full authorization, service event ingestion, production operator UI/MFA/on-call/load target remain open.

### Task1: Policy contracts, authority and transaction fences
Files:create `src/domain/dispatch-controls.ts`, `db/012-dispatch-controls.sql`, `src/server/dispatch-controls.ts`, `tests/dispatch-controls.test.ts`, `tests/dispatch-controls-db.test.ts`.
Interfaces:`readDispatchControls(tx,workspace)`, `setWorkspaceDispatchPolicy(tx,p,input)`, `dispatchPolicyFence(tx,workspace,provider)` returns only current policy eligibility + version stamps; it does not grant provider submission.
- [x] RED strict shape/provider/reason/version and live DB policy/RLS/role/race tests.
- [x] Add immutable policy event evidence and locked mutators; force fail-closed reads and fixed fence ordering.
- [x] GREEN PostgreSQL negative/race tests with no provider calls.

### Task2: Session-bound workspace control vertical slice
Files:modify API method/CSRF routing, SDK/OpenAPI contract, Settings; create `src/ui/dispatch-controls.tsx`, `scripts/smoke-dispatch-controls.ts`.
Interfaces:GET `/dispatch-controls`; POST `/dispatch-controls/workspace` with `{expected_version,paused,reason}`; session-only Owner/Admin. Existing attempted send/schedule/resume checks the policy fence and still rejects production activation.
- [x] RED actual HTTP strict body/method/CSRF/tenant/role/replay/conflict and missing UI tests.
- [x] Implement truthful status and pause/release controls with acknowledged versions and repeated-click fencing.
- [x] GREEN actual Chromium offline/lost-response/mobile/workspace navigation and opt-out availability with all stops engaged.

### Task3: Review, checkpoint and continue baseline
- [x] Full tests/lint/typecheck/build/APIcheck and affected existing regressions.
- [x] One fresh review and single Important/Critical fix pass; deferred Minor log and honest partial requirement register.
- [ ] Sync tracked source hashes to canonical Desktop, ordinary authorized push and inspect exact-head CI; continue remaining modules.
