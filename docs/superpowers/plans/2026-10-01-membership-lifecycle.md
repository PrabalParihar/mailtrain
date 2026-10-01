# Membership lifecycle implementation plan

> **For agentic workers:** Use superpowers:executing-plans task-by-task with native implementation, one fresh whole-slice reviewer, and one Critical/Important RED→GREEN pass. Continuous native execution is already authorized.

**Goal:** Deliver truthful existing-member role/removal/ownership controls, live authority revocation and immutable local seat-impact evidence; preserve all65requirements.
**Architecture:** Pure role/MFA/seat transition rules; additive022 membership lifecycle SQL with narrow NOLOGIN functions and workspace-exclusive serialization before the shared authority fence; session-only keyed API and manager UI. No invitation/provider/paid seat success is fabricated.
**Tech stack:** Existing Node24/TS6/PostgreSQL17/Next16/Clerk7/React19, no new dependency.
**Spec:** docs/superpowers/specs/2026-10-01-membership-lifecycle-design.md plus authoritative docs/Mailcraft-Development-PRD-v2.0.md REQ002003004048051057/TECH012100/JRN02.

## Global constraints
- All65requirements/13GA gates remain binding, no public deployment/provider calls/paid commitments.
- Owner/Admin/Editor are editing seats; Viewer/Billing cannot gain editing indirectly. Positive quantities deny SEAT_POLICY_REQUIRED until approved entitlement capacity exists.
- Session-only sensitive membership changes require recent actual MFA in production; strict loopback local fixture bypass never claims provider MFA.
- Lock workspace exclusively before any membership SHARE lock for administration; ordinary requests share the workspace lock; immutable versions/CAS prevent stale mutation.
- Final Owner cannot be removed/demoted without a surviving Owner; explicit transfer promotes active target and demotes caller to Admin atomically.

## Review focus
- Two managers change/remove owners concurrently: exclusive-before-shared order, last owner invariant and exactly one CAS effect, no deadlock.
- Demotion/removal after old session/key/queued operation authorization: no future admission, no resurrection of issued keys; running provider work is not falsely recalled.
- Viewer/Billing/Editor/Admin or bearer tries privilege escalation, foreign IDs, direct runtime SQL writes: role matrix, forced RLS and narrow grants deny.
- Equal/decreasing versus positive editing quantities, keyed replay and stale versions: count/evidence changes once, no unapproved capacity/spending.
- Lost acknowledgment followed by403/reload/workspace switch/self-demotion and edited controls: original command preserved, no stale UI outcome or fabricated success.

### Task1: Pure membership transitions and recent-factor policy
Files create src/domain/memberships.ts and tests/memberships.test.ts.
Produces role/seat helpers and strict inputs: RoleChangeInput{role:Admin|Editor|Viewer|Billing,expected_version:positive int}, RemoveMemberInput{expected_version,acknowledge:true}, TransferOwnerInput{expected_version,expected_owner_version,acknowledge:true}. Pure recentMfa(age:unknown):boolean requires exactly2finite nonnegative minute ages each≤10; no first-factor fallback. Pure transition validation takes current actor/target/status/active-owner-count and returns editing-seat delta or typed denial.
- [ ] Write missing-module RED assertions for Owner/Admin/Editor/Viewer/Billing role matrix, final Owner denial, transfer same editing quantity, no resurrection, positive seat policy denial, strict malformed/negative/expired MFA.
- [ ] Implement minimal typed helpers/strict Zod inputs, run focused tests→GREEN then npm test, commit Task1.

### Task2: Real transactional lifecycle storage/service
Files create db/022-membership-lifecycle.sql, src/server/memberships.ts, tests/memberships-db.test.ts; modify current-authority.ts/auth.ts with server-owned optional exclusive workspace lock mode.
Consumes Task1 inputs; produces changeMembership(tx,p,id,command,input):Promise<{member,changes}> plus readMembershipSummary(tx,p).
- [ ] Write RED owned PostgreSQL tests for current version CAS/lastOwner/transfer, role+tenant+narrow privilege negatives, issued-key revocation/queue cancellation and finite reservations, equal/decreasing/positive seat counts, two concurrent managers/transfer-versus-removal with no deadlock, immutable journal/no repeated quantity changes.
- [ ] Add SQL migration/functions and services, workspace-exclusive authority mode before other locks. Keep row SHARE privilege functional after narrowing runtime writes. Run migration/focused tests→GREEN and full suite, commit Task2.

### Task3: Scoped session API, generated contract and real browser controls
Files create src/server/membership-route.ts, src/ui/memberships.tsx, src/ui/membership-command.ts, scripts/smoke-memberships.ts; modify v1 route/http, pagination, OpenAPI generator/fixtures, settings and workflow/package scripts.
Routes GET/v1/memberships, GET/v1/membership-changes, GET/v1/memberships/summary; POST/v1/memberships/:uuid/role|remove|transfer-owner. Current manager session only; mutations require current MFA before effect. Signed pages tenant/actor/resource bound. Typed metadata responses, no new key scopes.
- [ ] RED404 owned HTTP and missing UI controls; implement routes and generated schemas/API fixtures plus paged manager UI/current seat count/confirmations/CAS/epoch fences/opaque receipts.
- [ ] GREEN actual HTTP role/scope/MFA-unconfigured/CSRF/encoded/foreign/cursor/replay tests and Chromium empty/offline/errors/repeated clicks/lost response/reload/staleCAS/self-demotion/workspace navigation/mobile. Inspect mobile pixels. Full tests/lint/typecheck/API/build plus existing authority/key/contract regressions. Commit Task3.

### Task4: Fresh review and publication
- [ ] Exactly one fresh Astra high whole-slice reviewer of task1–3/plan/spec/ledger/review focus; grade effect, one blocking fix pass RED→GREEN only, defer Minors.
- [ ] Final full suite/checks/HTTP/Chromium, record every ruling and full-GA gap; tracked-only canonical sync from verified clean expected head; authorized ordinary main push; exact-head CI readback. Continue invitations/approved entitlement and remaining fullGA work.
