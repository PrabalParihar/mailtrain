# Invitation Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native execution, one fresh whole-branch reviewer.

**Goal:** Durable invitation planning and honest refusal without issuing invitations or granting membership.
**Architecture:** Typed draft/withdrawn requests, versioned immutable history and existing session/tenant/keyed/paging contracts. Separate UI from ordinary persistence; all delivery/acceptance flags remain false.
**Tech Stack:** Installed Next16.3.8/React19.3, TypeScript6/Zod4, PostgreSQL, Playwright; no dependencies added.
**Spec:** docs/superpowers/specs/2026-10-03-invitation-planning-design.md

## Global Constraints

- Option2; no approved Premium/Business quantities or prices.
- No real invitations, live access credentials or actual membership changes.
- Preserve original records/private files; leave flagged collaboration/database-security branch/review untouched.
- Only isolated fixture migrations; production migration/activation remains a prerequisite.
- Draft/withdrawn planning is Partial REQ004, not invitation acceptance/full GA.

## Review Focus

- Lost response/repeated clicks must keep original command and history once; navigate/reload must discover saved records without granting access.
- Definitive conflict must preserve local proposed fields until explicit reload; stale actor/workspace callbacks cannot install.
- Reopen conflicts with another active request to the same address must preserve both records/history.
- UTC deadline must round-trip and mean planning review only, with no implicit expiry/sending/seat reservation.
- Role choices and disabled send/accept must never affect memberships or create grant credentials.

### Task1: Typed planning contract

**Files:** src/domain/invitation-requests.ts; tests/invitation-requests.test.ts.
**Interfaces:** InvitationRequestInput/Create/Update/StateInput, InvitationRequestRecord/View/History/PlanningContext; invitationPlanningStatus(record,now):draft|withdrawn|review_due; invitationRefusal(send|accept):{code,message}; editingSeat(role) reused.

- [ ] Write tests for strict inputs, no Owner/grant fields, whitespace/Unicode notes and optional valid UTC due; review due/withdrawn at boundary; constant disabled refusals and context flags.
- [ ] Run `node --import tsx --test tests/invitation-requests.test.ts`; Expected:missing-module RED.
- [ ] Implement schemas/status/refusal helpers with input notes4000/email254 and positive finite versions, literal zero/false flags.
- [ ] Rerun same test; Expected:3PASS; commit typed contract.

### Task2: Durable noncredential requests

**Files:** db/039-invitation-planning.sql; src/server/invitation-requests.ts; tests/invitation-requests-db.test.ts.
**Interfaces:** createInvitationRequest(tx,p,input,key), changeInvitationRequest(tx,p,id,command,input,key), invitationRequest(tx,p,id), invitationRequestPage(req,tx,p,id?), invitationPlanningContext(tx,p). Commands return {request:InvitationRequestView,changed:boolean}.

- [ ] Write real isolated-DB tests: create/update/no-op/withdraw/reopen/history/replay; CAS/active-email/reopen conflict without partial mutation; deadline/pagination/role refusal and unchanged membership/session/seat rows.
- [ ] Run targeted DB tests with sourceDatabase guard; Expected:missing-service RED before original DB writes.
- [ ] Implement two ordinary tenant tables, CAS/keyed/current manager logic, immutable snapshots/audit and bounded pages. No tokens, delivery jobs or memberships are written.
- [ ] Run targeted contract+DB tests; Expected:7PASS; commit persistence.

### Task3: API and native Team workflow

**Files:** src/server/invitation-request-route.ts; src/server/http.ts; src/server/pagination.ts; src/app/v1/[...path]/route.ts; scripts/generate-api.ts and generated files; src/ui/invitation-requests.tsx; src/ui/memberships.tsx; scripts/smoke-invitation-planning.ts; package/CI/docs.
**Interfaces:** session-only manager routes as Spec; expectedActor header, literal disabled readiness; Team child consumes workspace+summary.actor.user_id+role and typed records/pages.

- [ ] Write owned native3042/disposable fixture checks with original membership/session snapshot and no external access. Expected initial RED:planning region absent.
- [ ] Mount labeled planning form/history/controls and routes; keep pending original command in memory, errors/local values retained, native read-only blocked actions and prerequisites.
- [ ] Generate/check API/SDK; add existing CI browser sequence.
- [ ] Run native repeated create/lost receipt/retry/version conflict/reload/withdraw/reopen/deadline/refusal/320px/keyboard and loading/error/navigation groups; inspect pixels. Expected:completePASS, zero external requests/member/credential changes, owned resources cleaned.
- [ ] Full configured941+new tests, lint/type/build/API, existing membership and editor consumers; Expected:0fail, inherited skips reported; commit candidate.

### Task4: Independent review and delivery

- [ ] One fresh most-capable static whole-branch review of immutable9459168..candidate, plan/spec/ledger and focus. Material findings require one reproduced RED→GREEN fix pass and green suite; minor findings recorded.
- [ ] Witness private/unrelated/original records, fast-forward clean mirror/Desktop, verify parity, actual authorized main push and terminal exact-headCI.
- [ ] Record precise disabled features/prerequisites and exhaustive rulings/minors, preserve final ledger outside owned scratch then remove only own scratch. Expected:qualified source/main/Desktop match, original records preserved, GA still closed.
