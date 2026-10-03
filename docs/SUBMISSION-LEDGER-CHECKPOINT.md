# Durable staged recipient ledger development checkpoint

Full PRDv2 BaselineA retains all65 requirements and13 release gates. No entire requirement or gate is accepted. Recipient jobs/logs REQ036 remains Partial. Source publication and local test results do not establish a production launch.

This slice preserves one immutable ledger per campaign configuration, sorted frozen audience members, revision/artifact/snapshot pins and permanent per-contact identities. Different verified command keys return the same configuration ledger; later configuration creates separate work. A bounded development worker materializes at most100 members per transaction with PostgreSQL locks and atomic row/progress guards. Captured consent and exclusion reasons are historical facts. Pending is unapproved staging; outcomes remain unknown and authorization remains false.

Current SQL admits only pending/skipped/cancelled and prevents manufactured acceptance, uncertainty, provider attempts and outcome history. Runtime has no attempt-write privilege and even privileged attempt insertion fails the current schema constraint. Cancelling preserves identities/history, stops materialization and cancels only pending rows. No provider call, frequency reservation, usage consumption, sending event, paid commitment or campaign send is added. A future qualified authorizer/provider/attempt migration remains required.

Eight exact API operations and generated OpenAPI/TypeScript contracts expose current Owner/Admin plus campaign/audience scope-checked metadata, signed bounded recipient/history pages and an actual empty attempt history. Authority precedes historical receipt lookup. Browser recovery stores exact original workspace/actor/body/key before POST, uses shared controls and origin Web Locks through acknowledgment, fails closed when locks/storage are absent and fences delayed context changes. Only original-create VERSION_CONFLICT/DIGEST_CONFLICT/STATE_CONFLICT409 after historical receipt lookup can be explicitly dismissed; unknown/authentication/cancellation errors retain recovery identity.

## Qualification so far

The pre-correction configured native suite passed920/920 with zero failures or skips in54.376seconds, including native IndexedDB, isolated media decoding and disposable restricted PostgreSQL. API137 generation/check, global lint/typecheck and focused route/API/SDK tests pass. The final actual HTTP/Chromium harness passes18 checks with zero external requests/page errors across both browser contexts. Production build passes. Actual startup refuses incomplete release evidence with expected exit1. The immutable whole review and its single Important correction are now closed by scoped independent PASS. Fresh corrected-byte qualification is recorded below; canonical preservation and source publication/remote CI remain pending at this checkpoint revision.

Meaningful RED evidence preceded the domain/schema/worker/recovery/route implementation. The first integrated suite reported916 total/914pass/1fail/1browser-opt-in-skip: its strict existing audience foreign-key list omitted the new immutable ledger reference. The exact list and composite workspace/snapshot definition were extended; all five scoped audience tests pass. An initial unconfigured scoped retry refused before database access; supported in-memory owned environment loading then passed without credentials copied or printed. Final configured920/920 evidence supersedes that intermediate failure and explicitly enables both opt-in checks.

Task1 review found one Important key-expiry race across a blocking campaign lock. A real two-connection regression proved the old worker completed after the credential expired. Worker creator authority now rechecks after the campaign lock and the SQL guard uses database wall time; all13 focused native tests pass. A subsequent root-noticed CLI URL override guard regression brings the final scoped count to14/14 zero skips. Independent bounded re-review passed with no new findings.

Task2 recovery/UI review found no concrete findings;21 focused tests and scoped lint passed. Task3 review found one P2 SDK contract mismatch: explicit-key ledger commands incorrectly required source If-Match. The existing explicitKey and sourceCommand obligations are now separate in types/runtime. Exact body/key recovery and absent-key/source-version refusal pass15 SDK tests; source version checks and no automatic source retries remain intact. Independent bounded correction review passed.

Browser fixture timing/status corrections are retained in the controller ledger and final harness report; intermediate runs are not claimed successful. Owned generated fixture services are stopped by recorded PID only and disposable databases are dropped. Original apps, workers,109 emails/221 revisions and private files remain protected; fresh original-row/private metadata/tracked-code proofs are required before canonical publication.

## Remaining acceptance

Complete topic/purpose and current consent manifests, final approval authorizer, authenticated production service identity, real sender/DNS/provider accounts, uncertainty reconciliation, bounded retry policy, frequency/quota charging, signed actual provider events, safe scheduling and full delivery outcome evidence remain open. Production identity/MFA, funded real AI evaluation, real email-client/ESP conformance, approved Stripe economics/legal data rights, security/load/restore/on-call/design-partner and all13 release gates remain open. No source push or local qualification enables production startup.

## Local connection and harness review corrections

The browser harness review found one Important unchecked runtime database destination and one Minor second-context instrumentation gap. Runtime and migration URLs now require PostgreSQL protocol, a literal loopback host, no query/fragment markers and matching effective server ports before any fixture creation/Next spawn; the generated fixture is checked again. Controlled probes intercepted the old unsafe paths before any fake remote connection, then proved current refusal. Both browser contexts share external-request blocking and page-error collectors. Independent bounded re-review passes with no new findings.

The development CLI also rejects URI query/fragment overrides and malformed/unsupported URLs before connecting. A test-only PostgreSQL preload intercepts any attempted connection in the invalid-input regression. Native RED reached that sentinel; corrected GREEN refuses beforehand. All14 scoped tests and an independent CLI guard review pass. Private owned configuration is loaded in memory only, never copied or printed.

Final native browser pixels visibly show130 processed,100 pending (unapproved),30 skipped, zero attempts and false authorization/dispatch; Viewer has only a permission explanation. The final recorded owned fixture PID61145 was stopped normally and its generated database dropped. Initial fixture status/timing/error-instrumentation failures remain recorded; no application assertion was relaxed or production success fabricated.

## Whole-review correction and final native qualification

The immutable whole review at fc952eb found 0 Critical / 1 Important / 0 Minor: current stage/cancel authority could expire during an idempotency lock wait before a cached receipt was returned. The one bounded correction wave rechecks authority after each blocking resource lock and again before returning the keyed result. Historical receipt lookup still precedes source CAS validation. Seven real PostgreSQL lock-wait regressions cover cached API-key/local-session receipts, fresh command preservation and stale-version metadata refusal. Initial six-case RED and same-wave stale-version RED are retained in the implementer report; final focused 21/21 has zero skips. Independent scoped re-review PASS closes I-1 with 0 new findings; all other 37 paths from the frozen 39-path whole-review diff remained unchanged during re-review. Cost/ruling: two bounded source/test paths, additional authority reads, no contract/provider/dispatch activation.

Fresh controller qualification of corrected bytes: configured native 927/927, 0 failures, 0 skips, 64.817 seconds; global lint/typecheck/API137/build exit0; actual HTTP/Chromium 18 PASS with both-context external/page-error counts zero. Browser PID63402/3015 was stopped and only its disposable database dropped. Root inspected the refreshed readable mobile progress pixels:130 processed/100 pending unapproved/30 skipped,0 attempts/authorization false/dispatch false. Startup again refuses incomplete GA evidence with expected exit1. These results supersede the historical920 count for this candidate. Canonical sync/preservation/source publication and terminal exact-head remote CI are still controller-owned at this record revision. All65/all13 remain required, zero whole acceptance.

Evidence log SHA256 manifest:

```json
{
  "scope": "corrected immutable staged recipient foundation",
  "tests": 927,
  "pass": 927,
  "fail": 0,
  "skipped": 0,
  "browser_checks": 18,
  "api_operations": 137,
  "whole_review": "one Important closed by bounded independent PASS",
  "full_prd_requirements": 65,
  "release_gates": 13,
  "whole_requirements_or_gates_accepted": 0,
  "logs": [
    {
      "path": "/tmp/lettercape-submission-whole-fix-suite.log",
      "sha256": "8fb2996fcb24580434dece92396a8594ae6246c2c4240f953526809180bfea28"
    },
    {
      "path": "/tmp/lettercape-submission-whole-fix-lint.log",
      "sha256": "177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746"
    },
    {
      "path": "/tmp/lettercape-submission-whole-fix-type.log",
      "sha256": "e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6"
    },
    {
      "path": "/tmp/lettercape-submission-whole-fix-api.log",
      "sha256": "3ce151472ed70a81ddd691370de74ea2cdb89622a2e7a8a165f2576a64e4f583"
    },
    {
      "path": "/tmp/lettercape-submission-whole-fix-build.log",
      "sha256": "8502d3948fe5b3b9a72c60d7fdee229c979c2252c7faa322c9f22e46945d8241"
    },
    {
      "path": "/tmp/lettercape-submission-whole-fix-browser.log",
      "sha256": "d1104c4392e920fd7c1e6aab42867e32a6b27172abb47f665cf3d7cf29496285"
    },
    {
      "path": "/tmp/lettercape-submission-whole-fix-startup-refusal.log",
      "sha256": "e331306af1367c23fa850fb3f6d9708b5f8bba6bf376512ce7139dd1516c5754"
    }
  ]
}
```
