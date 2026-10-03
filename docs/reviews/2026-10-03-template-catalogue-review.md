# Independent template catalogue review records — 2026-10-03

Retained development review evidence. Local execution, canonical preservation and remote publication are separate controller gates; all65/all13 remain binding.


---

# Task 1 independent specification and quality review

Reviewed the task brief/report/new-file review package, frozen catalogue design, and actual five task-owned files. Shared integration/UI files were read only to trace the new domain module's client consumers; they were not independently reviewed or changed. No tests rerun, edits to implementation, commits or subagents.

## Specification verdict: correction required

The storage/service behavior otherwise matches the scoped specification: strict bounded commands and canonical IDs; metadata-only immutable revision pins; forced tenant RLS and composite revision/email/brand foreign keys; active1 to archived2 as the only transition; limited runtime column updates; no deletion/truncation or pin mutation; current authority checked before keyed receipt lookup; signed active/archived collection paging; row-locked archive/reuse serialization; same-key historical reuse receipts; direct inherited derivation/current asset checks. JSON normalization fixes initial-versus-replayed derivation timestamp representation. Source title is deliberately captured from the source email at template registration because existing revisions have no independent frozen title; that disclosed boundary does not rebind revision/hash/brand pins.

The domain module must also be usable by the specified client UI/recovery journey. Its current locale-schema import crosses the browser boundary described in I1 below.

## Quality verdict: correction required

Findings: **0 Critical / 1 Important / 0 Minor**.

### I1 — Browser-consumed domain schema imports the server compiler graph

Location: `src/domain/email-templates.ts:2` imports `EmailSpecSchema` from `./email` and accesses its locale shape at line13. That module imports `node:crypto`, `@react-email/render`, `sanitize-html` and `cheerio` (`src/domain/email.ts:5–9`). The new client component imports `EmailTemplateViewSchema` as a runtime value (`src/ui/email-templates.tsx:7`); its client recovery module also imports that runtime schema (`src/ui/template-recovery.ts:2`). Therefore the new domain-schema dependency path exposes the server compiler/import graph to the client build rather than keeping the schema browser-safe. Unit/service tests execute in Node and cannot establish that this browser import works.

Effect: the catalogue/recovery journey risks a client bundling failure on `node:crypto` and unnecessarily includes server/compiler dependencies. This is a required user journey and production build boundary, so the finding is Important rather than a style concern. The import graph is confirmed statically; no claim is made that this reviewer ran a failing build.

Requested correction: import the browser-safe `EmailSpecSchema` from `./email-schema` for the existing locale enum, or use its existing browser-safe locale schema. The locale vocabulary is the same; the template contract does not need compiler/tracking refinements. Preserve all task-owned storage/service behavior. Verify with the controller-owned Next build and relevant domain/recovery checks; no new package or polyfill is needed.

Correction cost: one import source change, no schema migration, runtime policy, account/provider setting or paid operation. A focused browser-import/build verification establishes the integration boundary that Node tests alone cannot.

## Inspected evidence and CannotVerify boundaries

- Worker report records meaningful missing-feature RED, subsequent implemented-service RED, timestamp-replay RED/fix, and final9pass/0fail/0skip on isolated generated restricted PostgreSQL databases, plus scoped lint and typecheck. Test bodies meaningfully exercise foreign scope, immutable storage, role/session/key/workspace revocation, exact raw/custom/brand retention, removed-asset refusal, same-key children, archive-lock waiting and signed paging. This reviewer did not execute those tests or independently inspect their terminal log files; qualification outcomes remain worker-reported evidence.
- Shared HTTP method/scope/API generation, UI actor recovery, actual browser/mount behavior, full configured suite and production build are controller/other task qualification. The browser dependency finding is traced from actual imports, not an independently reproduced build failure.
- Existing `deriveEmail`, `keyed`, `assertCurrentAuthority`, asset checks and pagination are inherited dependencies inspected for use, not a new broad audit of their entire behavior or physical storage.
- SQL checks enforce template state/version/archive relationships. This review does not certify arbitrary database corruption, production migration lock timing/load, clock rollback or operational retention/deletion policy.
- No customer data/private configuration/PRD was copied or modified; no provider/network request, paid activation, campaign submission, publication or production deployment occurred here.
- All65 requirements/all13 gates remain open; this task review does not accept an entire GA capability or infer provider readiness.


---

# Task 1 scoped I1 correction re-review

Scope: original Important I1 only, plus new breakage introduced by its correction. Compared the two corrected files against frozen `task-1-review-package.md`, read the appended task report and regression body. No tests rerun, implementation edits, commits or broader review.

## Verdict

**I1 ADDRESSED. Specification PASS and quality PASS for this correction.** New findings in the fix diff: **0 Critical / 0 Important / 0 Minor**. Original I1 remains recorded in `task-1-review.md` and is closed by this scoped review.

The production diff is exactly one import source: `src/domain/email-templates.ts:2` now reads `EmailSpecSchema` from browser-safe `./email-schema`. It no longer imports the compiler/refinement module `./email`. The template contracts use only the unchanged locale shape; exports, strictness, fields, parsing, storage and service behavior are untouched.

The sole test addition actually bundles the template domain entry with esbuild `bundle:true`, `platform:'browser'`, ESM output and no Node externals/polyfills. This meaningfully checks the dependency boundary rather than inspecting the corrected source literal. `write:false` avoids a generated-file mutation. A build exception fails the test; assertions also verify no returned errors and expected schema content. Existing parser/view tests remain unchanged.

The worker's appended report records meaningful RED before the production import change: four unresolved `node:crypto` imports, 3tests/2pass/1fail/0skip. GREEN after the change records3pass/0fail/0skip. Final restricted domain/database qualification records10pass/0fail/0skip and scoped lint0. These outcomes support the original finding's correction; this reviewer inspected the report/test/code and did not independently rerun them.

Cost: one import change and one actual browser-bundle regression using the existing esbuild dependency. No new package, migration, runtime policy, data mutation, provider/account action or paid operation. The added test performs an in-memory bundle; no production runtime work is added.

## CannotVerify boundaries

- Worker-reported command outcomes were not independently rerun or supplemented with new terminal evidence by this reviewer.
- Esbuild's focused entry qualification is not the full Next build or mounted client journey. Root-owned Next build, full configured suite, HTTP and actual Chromium remain separate checks.
- Review is limited to the original dependency defect and the two-file fix diff; previous task storage/service findings and disclosed boundaries are not broadened or relitigated.
- No source publication, remote SHA/CI, real-client/provider acceptance or production readiness follows. All65 requirements/all13 gates remain binding and provider gates closed.


---

# Task 2 independent spec and quality review

Spec: **FAIL** (recovery usability and shared-control synchronization).
Quality: **CHANGES REQUESTED**.

Reviewed only the frozen Task 2 UI/recovery/test patch against the exact brief, report and catalogue design. Read existing paging/API/domain and service boundaries to establish effects; did not review those files as Task 2 changes. No tests rerun, application code edits, commits or subagents.

## Frozen identity

Base named by package: `c97cc49`.
SHA-256 of `task-2-review-package.md`: `0fe3ae98cf76e15a38d9394792d43d6066281cf13ded597b2bc46aea8238c7b4`.
Extracted additions match the current three reviewed files byte for byte:

- `src/ui/email-templates.tsx`: `79d1e03d11dbdc5f0642b7ee6ccddca37ea92380416374f5b8359e380a2f5001`
- `src/ui/template-recovery.ts`: `e5ced34bf31859f5f821dbce828e59358fe0c28e109399d16eb906295853327c`
- `tests/template-recovery.test.ts`: `3310bdf32202d161e82ba70c7e164d4e9ba75fa2b8f239375d80ae5ea57486c9`

## Findings

### Important: terminal rejections permanently block all template writes for this actor/workspace

Location: `src/ui/email-templates.tsx:18-28`, `:32`, `:40`, `:47`; one-slot policy in `src/ui/template-recovery.ts:16-17`.

Receipt creation precedes POST, but every error keeps the receipt and the only available recovery action repeats it. Consider a person opening an active template, another actor archiving it, and the first person clicking Create separate draft. The service rejects the original command with TEMPLATE_ARCHIVED. Retrying that exact command cannot ever succeed. The pending receipt disables save/archive/reuse throughout this actor/workspace, even after reload or selecting an unrelated valid template. A stale archive can similarly return VERSION_MISMATCH with an instruction to refresh, while refreshing cannot resolve the stored expected_version=1. This is an ordinary collaborative rejection, not a lost-response case. The report acknowledges deliberately retaining all rejections; that choice leaves the specified journey unusable after a definitive rejected command.

Effect: permanent template-write lockout requiring out-of-band storage deletion. Cost: moderate; model authoritative terminal nonexecution separately from ambiguity and provide a deliberate safe resolution path. Preserve original commands on 401, unknown outcomes, malformed success and interrupted responses. Do not introduce replacement or blanket clearing on 4xx; classification must establish that no original operation succeeded.

### Important: independent mounted controls never synchronize their shared receipt state

Location: `src/ui/email-templates.tsx:12-14`, `:18-26`, `:40`, `:43-47`.

Every hook hydrates the same actor/workspace slot once but owns separate pending/busy/guard state. Reproduction from code: leave an unresolved receipt, then mount two save controls (the editor mounts one for each frozen revision). Both hydrate pending. Retry in control A and receive validated success: A clears storage and its state, but B remains pending with Save disabled. Retry in B reads null, throws No original command is available, and never clears B's pending state. B has no recovery action that works until remount. A second path starts with no receipt: A persists a command, B attempts a new save, and B gets Use Retry original command without loading the existing receipt into pending, so B does not actually expose that retry control.

The per-instance synchronous guard also permits concurrent same-command retries from different controls. Server idempotency should prevent duplicate children, but after one clears storage the other's validated success fails acknowledgment and presents a spurious changed-receipt error. There is no shared notification or scope-wide in-flight guard.

Effect: visibly blocked controls, unusable retry instructions and false errors after an otherwise successful command. Cost: moderate; coordinate state and in-flight status by actor/workspace, and reconcile every read/acknowledgment with mounted subscribers. Retain exact-match acknowledgment so resolving an old response cannot remove a newer receipt.

## Checks supported by this diff

Original path/body/key and actor/workspace are persisted and checked before POST. Input changes cannot replace a stored receipt. Explicit transport actor binding is present on POST. 401/lost/malformed-success paths retain receipts. Successful registration/archive responses are schema-validated and bound to original identity; reuse checks child/revision association, original title and retained source revision before clearing/navigation. Keyed actor/workspace/role mounts and unmount checks fence stale mutation callbacks. Detail epochs fence filter/close/unmount races. Viewer has no mutation controls; Billing requests no catalogue workspace and renders denial. Active/archived, empty/loading/error/refresh/load-more controls and frozen metadata are implemented using existing signed paging. Save accepts explicit frozen revision/hash props rather than editor working content. No dependencies, provider/send/payment/GA claims appear in the frozen patch.

## Cannot verify from diff

- Actual Chromium repeat-click, navigation/401 interruption, role changes, multiple controls and 390px behavior; root's browser worker owns this evidence.
- Integrated typecheck/build/regressions and reported RED/GREEN execution results; report was read, tests deliberately not rerun.
- Service-side current authority, transaction isolation, forced RLS, asset authorization and immutable derivation correctness; outside this frozen review scope.
- Root navigation/editor integration acceptance. Existing mounts were inspected only to confirm multiple save controls are a real boundary, not to approve root changes.
- Cross-tab atomicity of localStorage command creation. Read-then-write is not an atomic lock across browsing contexts; browser evidence would be needed if multi-tab exclusion is claimed.

The two findings are user-journey failures, not evidence of duplicate persisted drafts or an authority bypass. Server idempotency/authorization protections remain outside this review's approval.


---

# Task 2 scoped correction re-review

Scoped spec verdict: **PASS**. Scoped quality verdict: **APPROVED**.
Both original Important findings are addressed. No new actionable breakage found in the correction diff. This verdict covers the two findings and changes introduced to resolve them; it does not reopen or approve the whole branch.

## Frozen identity and review method

Compared the exact three-file additions in `task-2-fix-review-package.md` against the original `task-2-review-package.md`, then checked that each corrected package addition matches the current corresponding file byte for byte. Read the appended Task 2 report and updated spec. Inspected existing `keyed` and template service boundaries solely to validate nonexecution classification. No tests rerun, application edits, commits or subagents.

SHA-256 identities:

- Fix review package: `541c827a39332e553b0ebdc111e712e4be1674a3e9d502b29a6423c1edb1f844`
- Original review package: `0fe3ae98cf76e15a38d9394792d43d6066281cf13ded597b2bc46aea8238c7b4`
- Corrected `src/ui/email-templates.tsx`: `94b7d80c3479be84da2fad8b8fc04793c7f949e2961a59ea59a26ce4acadd00e`
- Corrected `src/ui/template-recovery.ts`: `09322251fbb0d1b73c7d09c2d608fa2479fc052a4ad5c6d08385d0004827bc81`
- Corrected `tests/template-recovery.test.ts`: `4769efaf0e9473ffdde7126ffc5a35568409bca5e49f9a3ab0da8d4f797ed7f2`

## Original I1: addressed

`template-recovery.ts` records a strict rejection extension only for the original archive/remix POST receiving TEMPLATE_ARCHIVED409 or VERSION_MISMATCH412, and only if the complete original receipt still matches persisted state. `dismiss` rereads and exact-matches the expected rejected receipt under the shared busy guard/available browser lock before removing it. The UI provides deliberate dismissal, and catalogue dismissal closes stale details and refreshes metadata. Reload preserves the classification.

The classification is supported by the inspected service boundary: template archive/remix authority checks precede `keyed`; `keyed` returns an existing matching successful historical response before invoking the callback; the allowlisted failures arise before mutation/derivation in that callback. Thus those particular responses establish nonexecution rather than hiding a historical successful child. Unknown/auth/network errors, wrong code/status, registration errors and malformed success retain the original receipt and cannot be dismissed through this UI. The revised spec explicitly bounds this behavior. No blanket4xx clearing or silent replacement was introduced.

Cost remains moderate overall, with a small strict optional rejection field and narrow classification/dismissal methods. The ordinary archived/stale-version collaboration scenarios from I1 now have a usable recovery path without weakening ambiguous-command retention.

## Original I2: addressed

`getTemplateCoordinator` returns one coordinator for a storage object and actor/workspace slot. All mounted hooks subscribe to the same pending/error/busy/ready snapshot. `run` sets scope-wide busy synchronously before awaiting a lock or request, so another mounted control cannot issue a simultaneous retry. Existing receipt reads publish the original command; an already-resolved receipt reconciles to null without the former unusable error. Successful acknowledgment and dismissal publish cleared state to all controls. Every late response/dismissal compares the complete current receipt, protecting newer commands.

Storage events reconcile other contexts. Available Web Locks reject contention without queueing and cover persistence through response validation/acknowledgment. The documented same-document fallback when Web Locks are unavailable is accurate and does not claim unsupported cross-tab atomicity. Hook subscription cleanup uses effect-local mounted state; context keys and active checks continue suppressing stale success callbacks/navigation.

Cost is moderate: a shared state machine, subscriber lifecycle and optional browser locking replace independent per-control guards. The original stale-control and concurrent same-document retry failures are resolved.

## Other correction changes

Explicitly picking workspace/actor into the strict receipt fixes the enriched runtime props failure without weakening receipt schemas or freezing current editor content. Source-title label clarification is descriptive only. The added unit cases cover authoritative dismissal/reload, ambiguity preservation, shared subscribers/guard, stale/newer receipt protection, lock refusal, enriched props and storage reconciliation. Existing response validators remain in place before clearing/navigation.

## Evidence and Cannot verify from diff

Read reported 18/18 unit tests, RED failures preceding both coordinator and enriched-props fixes, and scoped lint/typecheck exit0. The controller reports actual HTTP/Chromium PASS for both terminal statuses, reload/dismiss/subsequent success, two save controls and synchronous repeats. These execution results were not independently rerun in this review.

Cannot verify from this correction diff: full branch regression/build qualification; real database/RLS/asset authorization behavior; exhaustive browser/mobile/navigation scenarios; cross-tab atomic exclusion in environments lacking Web Locks; or service guarantees after a future server change. The narrow rejection classifier depends on the inspected server ordering continuing to hold. Those bounds do not leave either original finding unresolved.


---

# Task 3 independent integration review

Spec: **PASS** within the frozen Task 3 integration scope. Quality: **APPROVED**. No concrete blocking or nonblocking defect found in this scope; no correction requested.

Reviewed the exact Task 3 brief, report, review package, browser report and catalogue design specification against the current files. Independently checked all 24 SHA-256 entries in `qualification-files.json`: every file matches. No tests were rerun; no application edits or commits were made. Task 1 storage and Task 2 UI/recovery reviews remain separate; their current-authority, forced-RLS, immutable pin, archive-version and shared recovery contracts were treated as binding interfaces.

## Integration findings and evidence

- The method allowlist exposes precisely collection GET/POST, detail GET, archive POST and remix POST. Unknown commands/extra path segments fail closed. The catch-all routes template traffic through the existing origin/body/principal/error envelope, returning registration/remix201 and read/archive200 with request ID and no-store. Source/destination downloads remain GET; HubSpot artifact remains POST. Generated operation metadata preserves those methods.
- Templates use explicit existing emails:read/emails:write scopes. Route actor fencing compares the supplied header to the authenticated principal without changing actor identity or receipt namespace. Services are internally keyed and reauthorize before replay; root does not add an outer replay wrapper that could bypass those contracts.
- Root accepts only the documented collection query names once and nonempty, denies detail/mutation query parameters, canonicalizes template IDs, and delegates strict bodies/state/paging to the existing validators. Pagination resource identity includes email-templates; service state is bound into the signed cursor filter. The original exact-command recovery interface is preserved.
- The app mounts an actor/workspace/role-keyed catalogue and adds Templates navigation. Editor save controls receive each immutable history revision ID and exact artifact hash, without passing current unsaved working spec. The underlying reviewed UI component owns mutation role gates and shared pending-command synchronization.
- Generator, OpenAPI and SDK add five operations with correct scopes, request/response types, explicit mutation idempotency keys, actor fence and validated request examples. Notices restrict capability to frozen metadata and independent draft derivation, with no provider/send/production acceptance claim. Reuse deliberately uses the existing derivation response contract.
- Package/CI additions use the existing dependencies and run the isolated template and HubSpot browser fixtures before the shared Next development server. The template runner owns its loopback server/disposable database, validates fixture locality, cleans generated UUID scopes and closes its own browser/server/database. No provider or deployment step is introduced.

## Qualification assessment

The supplied root evidence records route/scope RED2fail then GREEN8/8, API129, lint/typecheck0, full configured suite878/878 with0skip and build0. These are reported execution results, not independently rerun results.

Inspection of the actual browser script supports the browser report: exact body/key replay after committed lost registration/reuse acknowledgments; multiple mounted save controls and synchronous repeat clicks; edited input, reload and source navigation; archive/reuse races yielding authoritative409/412, persisted dismissal and subsequent valid reuse; held committed201 across an actual workspace selection change, unchanged original receipt and one-child retry; Viewer controls, error-refresh recovery, empty workspace, keyboard detail activation and390px overflow checks. HTTP coverage checks frozen structured/raw/custom source derivation, lineage, one child, role/key/tenant/actor denials and signed cursor state/workspace isolation. The failure history is retained rather than hidden.

## Cannot verify / remaining bounds

This review does not independently reproduce reported test execution, pixel-review screenshots, authenticated cookie/account replacement, exhaustive cross-tab races or20-client rendering. Browser catalogue load-more/archived-selector interaction is not asserted by this harness; signed pagination/state isolation is HTTP-qualified and the panel itself was independently reviewed in Task 2. Current asset lifecycle qualification belongs to Task 1; production identity/media/client gates remain open.

Canonical synchronization, immutable commit/remote SHA and terminal remote CI are controller finalization work and are not established by this task report. Approval applies to this development integration slice only. Full65/all13 and complete REQ-011/GA acceptance remain open; no provider requests, sends, purchases or deployment are authorized or evidenced by this review.


---

# Independent whole-slice review — frozen template catalogue

Candidate: `6310c46402ad361db23945e00f1f364a0493ea76`, against `c142de12bf930a76829064907c3abb822448c80a`.

Spec verdict: **PASS against the literal frozen command/storage contract, with a recovery-policy gap requiring a bounded spec correction.** Quality verdict: **CHANGES REQUESTED**. Final readiness: **HOLD for Important I1**. No Critical findings; one Important finding; no separate Minor findings.

The implementation follows the explicit two-error dismissal allowlist. That compliance does not make the resulting asset-refusal journey usable. I1 is graded by its effect on a person, rather than presented as a violation of that allowlist.

## Scope and evidence

Reviewed the whole committed slice, its design/plan, ledger rulings, candidate proof, task reports, prior Task 2 findings/correction account, and the actual HTTP/Chromium report. Read the service dependencies needed to establish authority, transaction rollback, receipt ordering, source derivation, asset checks and paging. Reviewed generated API changes semantically as well as the generator/operation registry: the OpenAPI semantic delta adds only six template schemas and four template paths (five operations); it changes no existing API schema or operation.

HEAD matches the requested candidate. Independently hashed all 24 files in `candidate-proof.json`; none differs from the qualified hash. Review-package SHA-256: `e30d25c788ceedf39d5ba84f220469a4d76e0ce484d7465114d75738e3e62649`.

Accepted the supplied qualification evidence: configured suite 878/878, zero failures/skips; typecheck, lint, generated API check (129 operations), build, and owned HTTP/Chromium flow exit zero. No qualified tests were rerun. This review makes no fresh execution claim. Only this review artifact was written; no application edits, subagents, commits, pushes, providers or private-data operations were performed.

## Important I1 — asset refusal leaves every template mutation blocked

**Locations:** `src/ui/template-recovery.ts:8-11`, `:42-45`, `:90-95`, `:104-118`, `:125-128`; `src/ui/email-templates.tsx:38`, `:46`, `:53`. Originating refusal: `src/server/assets.ts:56-70`, reached through `src/server/email-templates.ts:56` and existing `deriveEmail`/`createEmail`.

**Trigger:** save a template whose immutable source references a valid private asset; the asset subsequently becomes unavailable/deleted; select Create separate draft. The existing restricted-DB test, `template reuse preserves exact raw/custom content and frozen brand while removed assets deny new children`, explicitly establishes that a new reuse then fails with `ASSET_NOT_READY` and creates no child. This is a required current-asset check, not a forged client command.

Before sending the POST, the UI stores the original remix command in its one actor/workspace slot. `ASSET_NOT_READY` (409) is absent from the dismissal schema, so the coordinator keeps the receipt without a rejection classification. Recovery offers only Retry original command. The stored source is immutable and still references the unavailable asset, so the retry fails again. Every Save, Archive and Create separate draft control checks the same pending receipt and remains disabled, including controls for unrelated healthy templates. Reload restores the same blockage. The affected person cannot even archive the problematic template through this UI to obtain one of the currently dismissible responses.

**Actual effect:** one legitimate asset refusal disables the person's entire template-writing journey in this browser/workspace until an out-of-band intervention changes asset/template state or removes browser storage. The service correctly protects source media and rolls back partial child creation; there is no authority bypass or duplicate-child finding here. The defect is persistent recovery lockout, not a request to relax asset validation.

**Evidence and limits:** the server refusal is already covered by the qualified restricted-DB test. The persistent UI effect follows directly from the coordinator and disabled-control predicates. Existing recovery tests cover the two allowed terminal errors and ambiguous/authentication errors, but do not combine an asset refusal with reload and a subsequent healthy template command. The browser report does not claim that case, and this reviewer did not reproduce it in Chromium.

**Correction direction and cost:** small-to-moderate, localized service/recovery contract work plus one focused regression. Establish a narrowly proven nonexecution outcome for this original remix failure, preserve its exact identity through reload, and permit deliberate resolution before a healthy command. The service's successful historical receipt lookup precedes `deriveEmail`, and the enclosing tenant transaction rolls back the failure, which provides an existing basis to prove this particular nonexecution outcome. An explicit server classification is also possible. Do not clear generic 409/4xx errors or discard ambiguous/authentication/network/malformed-success receipts. Update the ledger/spec's two-error-only ruling explicitly rather than silently broadening it. Regression should prove zero child/receipt success on refusal, exact-command retained rejection across reload, deliberate resolution, and successful subsequent work on an unrelated valid template, while historical successful reuse still replays its original child.

## Review focus outcomes

1. **Authority before receipt replay: supported.** Every template service calls current authority before `keyed`; workspace/membership/key locks and local-session revalidation remain in the enclosing transaction. Current roles and read/write scopes are checked; the route actor fence does not grant delegation. The restricted-DB tests cover stale resolved principals, role/membership/workspace changes, key scope/revocation and session revocation. No historical receipt restoration of revoked authority found.
2. **Archive/reuse serialization: supported.** Both callbacks read the same row `FOR UPDATE` before transition/derivation. A waiting reuse sees committed archive state and fails. Previously successful keyed reuse returns the original child before the callback. The DB race test observes an actual PostgreSQL lock wait rather than assuming concurrency from a timer. The opposite winning order naturally completes the admitted child before archive obtains the row lock; no new post-archive child path found.
3. **Frozen source and media: supported, with I1 at the UI boundary.** Metadata storage references immutable revisions through same-tenant composite foreign keys, forced RLS, insert canonicalization and restricted UPDATE privileges. Later source edits do not change the pin. Reuse invokes existing derivation, source validators, current asset resolution and checkpoint logic. Exact raw/custom source and frozen brand preservation are covered. Historical successful receipts remain historical even when current assets become unavailable; new derivation is denied.
4. **Original-command recovery and context fencing: supported within the qualified boundary.** Original path/body/key and source identity persist before requests; scoped coordinators, synchronous busy guards, exact receipt comparisons and subscriptions prevent replacement commands or stale mounted controls. Workspace/actor/role keyed components and unmount guards prevent stale completion navigation. Successful response validation precedes clearing. The reported actual held-success workspace switch and committed lost-response reload/navigation cases exercise these boundaries. I1 is a separate inability to resolve a definitive failure.
5. **UI states and exposure: mostly supported; I1 blocks readiness.** Catalogue loading/error/refresh/empty/state/load-more and Viewer/Billing presentation are present. Server list/detail projections contain only frozen metadata; body-bearing results occur only for authorized child creation. Signed cursors bind workspace/actor/resource/filter state. The browser report covers 390px overflow, keyboard detail opening, empty/Viewer states and error refresh. No provider success or entire-launch claim is introduced.

## Quality and integration assessment

The five exact routes, bounded existing JSON transport, strict request/query validation, actor header, scopes, response statuses and internally keyed services align. Generated SDK mutations require explicit keys; API generation is additive. The CI script invokes the owned isolated template smoke before the shared Next dev server acquires its lock. Disposable DB/fixture ownership and process cleanup are explicit; no new runtime dependency or provider integration is introduced.

Tests generally assert meaningful boundaries: real restricted RLS/privileges, actual transaction contention, immutable raw source equality, child counts, authority changes, storage failures, synchronized subscribers, original HTTP bodies/keys and actual browser interruptions. These are stronger than implementation-mirroring mocks. The principal missing regression is the composed asset-denial/recovery journey described in I1. Several new files pack substantial logic into long lines, which increases review and correction cost, but no separate effect-bearing defect is established merely by formatting.

## Declined findings and unverified boundaries

- **Declined:** another finding for the prior Node-only schema import, terminal archive/version refusal, or independent mounted-control state. The candidate contains the documented browser-safe schema import, deliberate exact-receipt dismissal and shared coordinator corrections, with relevant qualified evidence.
- **Declined:** treating frozen `source_title` as a historical revision-title defect. The stored title is captured at registration because revisions do not contain historical titles, and the UI truthfully says “Source title when saved.”
- **Declined:** requiring receipt replay to rederive or reauthorize current source assets. That would change the historical result instead of replaying the original child; current actor authority is still checked first.
- **Declined:** blanket clearing of all authoritative-looking client errors to fix I1. Some errors precede the receipt lookup or have unknown outcomes; classification must remain tied to the original command and proven nonexecution.
- **Unverified:** exhaustive multi-tab exclusion, especially browsers without Web Locks. The fallback only supplies same-document coordination; the report expressly makes no cross-context atomicity claim. No unsupported-browser product requirement or demonstrated in-scope browser failure was supplied, so this is not promoted to a new Important finding.
- **Unverified:** authenticated cookie replacement without a remount/reload, twenty-client behavior, and pixel/accessibility behavior beyond the recorded Chromium flow. Actor mismatch and revoked authority are HTTP-qualified; no stronger browser claim is made here.
- **Unverified:** exact remote SHA, terminal CI on this candidate, canonical synchronization, production identity/media/client acceptance and deployment. These remain controller/publication gates. Local green evidence does not establish remote CI success.
- **Not accepted:** complete REQ-011, AI adaptation, full GA, any of all 65 requirements or all 13 gates. Those remain binding and open.

**Final readiness:** hold this candidate for the single bounded I1 correction and focused qualification before canonical synchronization/publication. The other reviewed authority, concurrency, source, route/API and integration boundaries have no additional finding.


---

# Scoped re-review — whole-review I1 correction

Baseline: frozen `6310c46402ad361db23945e00f1f364a0493ea76`. Reviewed the correction diff in `src/ui/template-recovery.ts`, `tests/template-recovery.test.ts`, `scripts/smoke-email-templates.ts`, the corrected spec/plan and added ledger rulings, plus `whole-fix-report.md` and `whole-fix-browser-report.md`. This is the single bounded correction re-review, not another whole-slice review.

**I1: ADDRESSED. Spec: PASS. Quality: PASS within correction scope. New findings: 0 Critical / 0 Important / 0 Minor.** The prior review hold for the asset-refusal recovery lockout is lifted.

## Effect and safety

The helper adds precisely `ASSET_NOT_READY` with status 409 to the rejection union. Both original-response classification and persisted-receipt validation restrict this new outcome to the original remix command. Save/archive and wrong statuses remain ineligible. The existing exact-command comparison, actor/workspace slot, original body/key/source identity, and deliberate dismissal path are retained. No automatic clearing or blanket 409/4xx classification is introduced.

Consequently a person whose original remix is refused because its frozen source asset is unavailable can reload, see the classified original refusal, dismiss that exact command deliberately, and create an unrelated healthy draft. This resolves the effect identified in I1. The spec and ledger explicitly refine the earlier two-error-only ruling and document the existing successful-receipt-before-callback and enclosing-transaction rollback basis. Server asset validation, authority admission and historical receipt behavior are unchanged by this correction.

The three new recovery tests cover the composed refusal/reload/dismiss/healthy-child journey, unchanged original command identity, blocking silent replacement while pending, wrong operation/status exclusions, forged persisted save/archive classifications, protection of a newer receipt from a late refusal, and historical validated success. These test the required recovery effects rather than merely the added union member.

The browser harness exercises the actual server refusal: it creates and freezes a private-asset source, first obtains a successful historical child, marks its fixture asset deleted, loses the first real 409 response, reloads, retries the exact body/key, and checks zero refused children and zero successful idempotency receipts. It then requires dismissal to survive another reload and proves that deliberate dismissal permits one unrelated healthy child. Historical same-key replay still returns the original child after asset removal. The new cleanup entries remain restricted to generated workspace IDs and the existing transaction-local fixture cleanup. The added iframe capture affects evidence only.

## Qualification and identity

Accepted the supplied execution evidence without rerunning tests:

- Unit RED: 20 pass / 1 fail because the asset refusal lacked classification; GREEN: 21/21, zero skips/failures.
- Actual browser RED: the real 409, exact retry and zero-child/receipt assertions passed, then the missing dismissal control failed. Actual browser GREEN: the full retained flow and new asset-refusal recovery pass; owned server stopped and disposable database dropped.
- Scoped lint and integrated typecheck reported exit zero. Root reports the corrected configured suite at 881/881, zero skips/failures, exit zero (`/tmp/lettercape-template-whole-fix-suite.log`). These are supplied execution results, not fresh reviewer runs.

Independently compared the existing 24-file candidate proof against current file hashes. Only the three expected correction files differ; all other 21 hashes match the original qualified candidate. Reviewed correction identities:

| File | SHA-256 |
|---|---|
| `src/ui/template-recovery.ts` | `8ab3e19bf7596fb4771268ee8e039e5071194a0a27e4ef3f577a60f438f14d03` |
| `tests/template-recovery.test.ts` | `ac39260556f98de625a38a1c94da6c89c2a1afd9cc3963c89434c33573c78aa0` |
| `scripts/smoke-email-templates.ts` | `9c62f593fa4247edca69eefb5f83428c017594128f4ad255d49a53f603f55620` |

## Declined and unverified boundaries

- Declined expanding this review or the fix to unrelated error codes. This correction proves and resolves the specific original-remix asset refusal; authentication, unknown, network and malformed-success outcomes remain unresolved as required.
- No correction-introduced authority, source-media, receipt-identity or fixture-ownership defect found in the reviewed diff.
- Browser asset metadata is a synthetic fixture, as the report states. This establishes actual application refusal and recovery, not scanner/object processing or production media acceptance.
- Exhaustive multi-tab behavior, authenticated cookie replacement without remount, broader client/pixel/accessibility acceptance and all other previously stated unverified boundaries remain open.
- No tests were rerun and no application files were edited. Only this review artifact was written.

**Final readiness:** the bounded I1 correction is ready for the controller's packaging/checkpoint and canonical/publication gates. Exact remote SHA and terminal CI remain pending; this review grants no production launch, full REQ-011, all-65 or all-13 acceptance.
