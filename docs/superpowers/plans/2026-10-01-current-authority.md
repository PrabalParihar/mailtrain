# Current transaction authority implementation plan

> **For agentic workers:** Use superpowers:executing-plans for native implementation and one fresh whole-slice reviewer. Continuous native execution is already authorized by the user.

**Goal:** Close the membership/workspace/API-key check-to-use window in existing private resource transactions, advancing REQ-002/003/004/048/057 without claiming complete identity or team administration.
**Architecture:** Keep initial identity/key resolution and HTTP rate receipts. Before each withPrincipal resource callback, reread current workspace, real membership actor and (for delegation) key under PostgreSQL row SHARE locks, in workspace→membership→key order. Return the current role/scopes to the callback. Revocation either commits first and the callback is denied, or waits for an already authorized transaction to finish. No locks span provider network calls beyond existing bounded transaction behavior; provider/collaboration session revocation remains separate GA work.
**Spec:** docs/Mailcraft-Development-PRD-v2.0.md TECH-010/011/012, REQ-002/003/004/048/057.
**Tech stack:** Existing Node24/TypeScript6/PostgreSQL17/pg/Next16; no new dependencies.

## Global constraints
- Complete Baseline A remains required; no launch gates close from this slice.
- No provider calls, paid account changes, real campaign sends or deployment.
- Runtime context remains transaction-local forced RLS; never use migration credentials in production authorization.
- Current delegation requires active Owner/Admin issuer, unexpired/unrevoked workspace-bound credential and current route/operation scope.
- Receipt replay also requires current authority; rate charging remains once per incoming Request.

## Review focus
- An initial valid principal loses membership or editing permission before the data transaction: callback must receive denial/current role.
- Delegated keys retain an old in-memory write scope after narrowing/revocation/expiry/issuer demotion: no stale authorization.
- Revocation racing an already admitted transaction: mutation waits and later transactions deny; no deadlock in existing key-management flow.
- Cross-workspace key IDs/issuer identities, missing context, locked workspaces and Viewer/Billing roles: no private content or privilege escalation.
- Rechecking authority must preserve same-request API rate semantics and operation-specific scopes; no secret values appear in evidence.

### Task1: Transaction authority helper and real database tests
Files: create src/server/current-authority.ts and tests/current-authority-db.test.ts.
Interface: assertCurrentAuthority(tx:Tx,p:Principal,action:Action,scope?:string):Promise<Principal>; consumes verified principal and returns current role/scopes.
- [ ] Write tests using owned workspace/member/key fixtures: stale session membership/role, stale API key revocation/expiry/scopes/issuer demotion, workspace lock, foreign key, current-role output and operation scope output.
- [ ] Run node --import tsx --test tests/current-authority-db.test.ts; Expected RED missing helper.
- [ ] Implement helper with fixed ordered SELECT ... FOR SHARE, explicit tenant comparisons/current permission checks and no external I/O.
- [ ] Run focused tests; Expected all pass, no fixture leakage. Commit task.

### Task2: Wire existing requests and prove concurrency
Files: modify src/server/auth.ts and src/app/v1/[...path]/route.ts current workspace list; expand current-authority-db.test.ts; create scripts/smoke-current-authority.ts.
Interface: withPrincipal retains existing signature; resolves current route scope then calls Task1 helper before fn.
- [ ] Add real concurrent transaction test: hold admitted authority while separate owned admin revocation tries UPDATE; verify pg_locks waiting, finish admitted transaction, observe committed revocation, then denial.
- [ ] Add real HTTP/Chromium fixture checks: existing brands/email page works, membership revocation denies reload/create/repeated click, workspace navigation remains tenant-bound, same-request API quota recheck unaffected.
- [ ] Run RED missing wiring/workspace-list fence behavior, then wire helper; Expected GREEN. No arbitrary fake Clerk/MFA assertions.
- [ ] Run npm test plus lint/typecheck/API/build and smoke:api/keys/contract/browser fixture; Expected all pass. Commit task.

### Task3: Fresh review and publication
- [ ] Document exact tests, rulings and remaining production identity/MFA/team/invite/seat/collaboration obligations.
- [ ] Dispatch one fresh Astra high reviewer of the entire slice, plan/spec/ledger/review focus. Re-grade findings; one Critical/Important RED→GREEN pass only; Minor deferred.
- [ ] Full final suite/checks; tracked-only canonical sync from expected clean HEAD; ordinary authorized main push; read exact-head CI. Continue full-GA work.
