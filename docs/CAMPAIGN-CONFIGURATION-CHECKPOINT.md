# Campaign configuration development checkpoint — 2026-10-02

Full Baseline A remains binding: all65 requirements/all13 release gates, no entire requirement accepted by this slice. Planned timing contributes to REQ-035/038 foundations; approval, accepted scheduling and actual dispatch remain disabled. No provider/model/send/deploy/account changes or spending.

## Implemented and exercised

Strict draft/review-pending configuration edits pin the same-workspace immutable revision/hash and retain captured audience/provider/sender/topic/tracking. Exact body-version CAS, unchanged-save no-op, canonical local JSON digest, keyed replay and post-wait current key authority are verified. Timing retains Gregorian local minute, original IANA zone, explicitly chosen UTC offset and resolved UTC. DST gaps/invalid calendar/zone/offset reject; both repeated-minute occurrences remain distinct; Kathmandu/Adelaide non-hour offsets pass. This never accepts a delivery schedule.

Additive026 stores immutable exact observed configuration history under forced tenant RLS/restricted NOLOGIN capture authority. Runtime cannot directly write snapshots or delete through parent cascades. State-only/no-op adds no history; rollback adds none; existing current-only backfill labels migration_current with unknown actor and never invents earlier versions. New detail/configuration/history surfaces are strict metadata, with counts instead of recipient arrays and no arbitrary retained provider/sender data. Existing collection contract remains compatible.

Actual owned HTTP/Chromium verifies initial-read fences, NY fold/Kathmandu/UTC candidates, invalid DST no POST, frozen submitted/uncertain form, offline retained settings, repeated clicks, lost acknowledgment original-key replay, reload no-op, independent-tab conflict/retained fields/explicit reload, signed actor/campaign/tenant-bound metadata history, repeat paging/error recovery, Viewer/Billing/scoped keys/foreign pins/encoded route boundaries, passive expiry during campaign row lock, empty/error/mobile/workspace interruption. Inspected390px screenshot output/playwright/lettercape-campaign-configuration-mobile.png has no horizontal overflow.

## Review and validation

ONE fresh Astra high whole-slice review35d1515..8a5b029: no Critical, two Important, one Minor. Reviewer independently ran pure9/9, isolatedPG3/3, diff check and two synthetic reproductions. Author performed ONE native Important RED→GREEN pass, no rereview: raw new detail/command data is projected to strict metadata, and the captured command key survives acknowledged POST→failed read plus unavailable sessionStorage. Each actual Chromium recovery retries200 with currentv2/exactly two snapshots.

Final author checks172/172 tests, lint0/typecheck/build/API90, complete affected actual HTTP/Chromium PASS. Existing API14groups/preflight/contract/creation/Voice actual HTTP/browser regressions PASS. Existing rotated-key parallel browser check initially timed out on disabled first historical row; bounded independent rerun passed unchanged and the failure is retained. Logs /tmp/lettercape-campaign-final-{tests,lint,typecheck,api,build,http}.log; review RED/GREEN /tmp/lettercape-campaign-review-{metadata-red,metadata-green,refresh-red,storage-red,recovery-green}.log; prior regression /tmp/lettercape-campaign-task4-regression-*.log and /tmp/lettercape-campaign-task5-{creation,voice,release}.log.

Reviewed/fixed executable e8f96c057588a75ec5de769678037e57c501db54 is published to the intended main branch with exact remote readback,326canonical tracked SHA256 matches and canonical3002 actual HTTP/Chromium PASS including both reviewed recovery cases. [Exact-head CI36959642753](https://github.com/PrabalParihar/mailtrain/actions/runs/36959642753) completed successfully for exact e8f96c0; both application verification and renderer jobs passed. This is source publication; application activation remains disabled. Production release check exits1 with all13 gates still open. Full intent/locale/assets/sender/consent/frequency/legal review, refreshed audience policy, accepted scheduling, recipient ledger/reconciliation, real clients and representative SLOs remain required.

## Rulings I made

Ruling: completed PRD and continuous native implementation authorize this bounded provider-independent campaign foundation without another routine approval pause — all65/all13 remain required, while material provider/economic/legal decisions still wait — cost if wrong: reversible draft/configuration UX revision before GA signoff.

Ruling: planned timing is persisted draft intent, never accepted scheduling — providers/identity/consent/spend/real-client gates remain closed — cost if wrong: UI/API must keep explicit planned-only labels and future dispatcher must revalidate the actual accepted schedule.

Ruling: retain captured audience/provider/sender/tracking rather than inventing configured identities or refreshed consent — this slice versions current configuration truth and exact content pin — cost if wrong: full audience/sender/tracking/approval-manifest implementation and configured acceptance remain required before GA.

Ruling: restrict configuration edits to draft/review_pending and explicitly reject approved/scheduled/dispatching/terminal states — unsafe lifecycle edits cannot be inferred while dispatch/approval gates are unfinished — cost if wrong: later explicit invalidate/unschedule/fork workflow must satisfy the full PRD before GA.

Ruling: operator cleanup may cascade-delete owned snapshots while runtime deletion cannot — actual session role is checked even when referential actions run as table owner — cost if wrong: production retention/data-rights operator policy still requires reviewed acceptance before GA.

Ruling: check current API-key authority after campaign-row and idempotency waits — passive expiry can advance without a conflicting tuple update — cost if wrong: all future longer resource waits need an equally explicit authority-at-effect rule.

Ruling: new configuration digest covers canonical local JSON of configuration version/name/revision/retained intent; old observed digests remain unchanged — exact content/hash and chosen timing now bind this new version — cost if wrong: final approval/manifests must define and validate their complete independent GA contract.

Ruling: initial HTTP fixture expected201 for existing campaign create, but actual documented existing route returns200; fix fixture then independently observe missing-detail404 — preserve existing public behavior — cost if wrong: full contract conformance remains required.

Ruling: after unresolved acknowledgment, freeze captured form and offer original-command retry or explicit reload replacing edits — prevents an unknown accepted payload from silently becoming a different command — cost if wrong: user waits for recovery or deliberately discards unsaved form state; no submitted payload is stored in browser storage.

Ruling: existing key browser parallel run observed disabled same-name row after rotation; independent bounded rerun passes unchanged — fixture selects first matching historical key before asynchronous refresh, outside changed campaign code — cost if wrong: retain failure evidence and require exact-head CI/regressions; underlying key UI/fixture timing is not silently certified by the retry.

Ruling: cloud code-reviewer.md resource lookup failed, bounded local search found and read installed6.4.2 exact template — no invented review template or missing review gate — cost if wrong: use installed instructions and record review capabilities honestly.

Ruling: initial combined API/browser fixture terminal state assertion used the earlier v4 after browser advanced to v8; assert against actual current version to reach state guard — preserves separate stale-version guard — cost if wrong: both CAS and lifecycle denial must continue to be tested independently.

Final: Ruling: new detail and configuration command responses use strict metadata projection; existing collection remains compatible — author nonempty synthetic audience/private retained-field HTTP RED verifies user-visible boundary — cost if wrong: broader legacy collection entitlement/privacy acceptance remains full GA work.

Final: Ruling: retain command key in component memory alongside captured payload until both receipt and current-read recovery resolve, independent of sessionStorage — acknowledged-POST/read-failure and unavailable-storage actual Chromium RED show existing helper lifecycle cannot preserve this identity — cost if wrong: navigation/reload requires authoritative current read and never automatic replay; no form payload/secret stored in browser storage.

Final: Ruling: declined production readiness/complete requirement and GA acceptance — all65/all13 remain required and closed — cost if wrong: complete requirement evidence and accountable gate signoffs before public activation.

Final: Ruling: declined provider-backed scheduling/dispatch/delivery/real-client conformance — planned timing never creates accepted delivery and no provider calls were issued — cost if wrong: configured provider/client conformance and security/consent/economic gates before dispatch.

Final: Ruling: declined complete approval manifests/current consent/audience refresh/sender/legal/frequency policy — retain existing captured data without asserting current send permission — cost if wrong: build full intent review and fresh dispatch authorization before GA.

Final: Ruling: declined production deployment/operational migration rollback/retention-erasure/operator procedures — only additive owned local migration and transaction rollback tested — cost if wrong: production backup/restore/operator authorization and data-rights policy evidence before deployment.

Final: Ruling: declined representative production scale/history growth/SLO compliance — bounded development tests do not establish production capacity — cost if wrong: representative load, retention and measured operational acceptance before GA.

Final: Ruling: declined changing legacy campaign collection raw-array contract — compatibility preserved while new detail/command/history projections redact private retained data — cost if wrong: full endpoint entitlement/privacy review remains required before GA.

Final: Ruling: declined repair of pre-existing rotated-key fixture timing — native independent rerun passes unchanged and original failure is retained — cost if wrong: remote exact-head CI and later key/browser coverage must resolve reproducible failures without hiding them.

Final: Ruling: declined source publication/remote CI/canonical sync/workspace deletion — reviewer read-only verdict does not certify those executor steps — cost if wrong: clean expected-head hashes, actual canonical browser, ordinary push/exact-head readback, exhaustive public Rulings/Minors preservation before declaring publication.

Final: Ruling: bound post-fix validation to full172/lint/typecheck/API90/build plus entire affected HTTP/Chromium and prior API14/preflight/contract/key/creation/Voice regressions — no production/provider conformance inferred — cost if wrong: exact-head CI and canonical actual browser must pass before source publication, all65/13gates remain open.

Final: Ruling: source-only Git bundle fast-forward after clean expected aa8c464 and315baseline hash/no new-path collisions, then326tracked hash/actual canonical verification — Git preserves ignored local settings/dependencies and rejects unsafe non-fast-forward/untracked overwrite — cost if wrong: stop publication on mismatch and preserve unrelated files.

Final: Ruling: stop after stalled native plan-write and one bounded read-only retry; on explicit connected-again instruction inspect both clean git states and intended calendar files before repeating — no calendar files/workspace exist and no uncommitted changes observed — cost if wrong: preserve any later discovered work and never infer completion from timed-out commands.

Final: Ruling: explicit new user request authorizes the formerly deferred child lifecycle-status/edit-controls fix as new tested follow-up work — original whole-slice review and single native fix pass remain complete — cost if wrong: follow-up must preserve unsaved fields and explicit original-command recovery while refreshing lifecycle authority.

## Deferred minors

Final: minor (deferred): child configuration lifecycle status/editable controls can remain draft after parent review/cancel; server state guard prevents mutation, but explicit reload is needed for accurate child status.

The lifecycle-display Minor was deferred at the original review. The user explicitly requested a tested follow-up after executor recovery; that follow-up now passes four actual HTTP/Chromium regressions in the workspace-calendar slice. Publication/review evidence is recorded in WORKSPACE-CALENDAR-CHECKPOINT.md. The original review and its single native fix pass remain complete.
