# Audience authoring and frozen campaign selection checkpoint

Full Baseline A: all65 requirements and all13 release gates remain binding. This is development evidence; no GA requirement is accepted and no production deployment occurred.

Tasks1–5 implement bounded recursive all/any rules, strict typed conversion and invalid-input recovery; immutable tenant-bound snapshot source/storage; recipient-safe signed metadata paging; optional immutable campaign pin/history with current post-wait authority; nested authoring and campaign source UI with interruption recovery. Selected sources preserve their original membership under later segment/contact/consent changes. Dispatch-time rechecks remain required.

One immutable whole-slice review: e0f69ebb858b37b8877b1d0846ce690983feedfa..dc92d671684e3d2b0413d2d7076e078d676a185f, package SHA256 e605f3dd0d09227eac30fe40283a6ba3c9f43159b4086d3f962aad786fcd08b1. No Critical; two Important recovery findings reproduced before fixes, one Minor deferred. The reviewer independently reran21focused/contract tests and diff checks; author browser/database/full-build evidence is distinct. ONE native fix pass, no second review.

I1: large admitted rule records were written successfully but silently rejected on reload. Limits now derive from the100-node/2000-character/six-character JSON-escape envelope including both serialized source/command copies. Writers validate roundtrip before durable success; failures retain memory with a leaving guard. Pure maximum100-node escaped/control-value cases and actual64-node browser reload/lost accepted response retain the exact original body/key without duplicate version.

I2:101-character invalid revision rejected the whole recovered campaign form, losing unrelated edits. Revision working input and recovery now share a2000-character bound; writer validation is truthful, and offset input shares its existing100-character bound. Actual browser reload preserves name/timing/source/invalid revision and invalid save leaves server unchanged.

Pre-review evidence:228tests/lint0/typecheck/API95/build; actual owned HTTP/post-wait expiry/query cutoff and Chromium mobile flows; existing campaign/lifecycle6/calendar/UTM/preflight/remix/cachedPNG+PDF/10k import. Post-fix231/231tests,lint0,typecheck,API95/build and complete audience HTTP/Chromium suite PASS, including both new regression probes. Existing actual campaign/recovery/lifecycle6/calendar checks pass. Publication is pending; older CI does not qualify this head.

## Exhaustive decisions, deferred Minor and task records

Ruling: continuous full-PRD authorization covers this reversible native audience authoring/configuration slice and ordinary main publication after its single review/checks — no external account, policy, spend, consent or sending decision is made — cost if wrong: all65/all13 acceptance and account-dependent gates must still qualify launch separately.

Ruling: retain unknown saved tag/list IDs explicitly rather than replacing them from partial catalogs — existing signed pages can omit saved referenced rows — cost if wrong: unavailable relation remains visible/correctable and server existence validation still decides save; no guessed selection.

Ruling: redact all content-role campaign responses in this slice, adapting consumers/storage assertions to the strict DTO — newly pinned member locale/consent data must not leak via legacy raw collections/create/lifecycle — cost if wrong: generated contract compatibility and all affected existing HTTP/browser checks must pass before publication.

Task 1: complete (commits e0f69eb..b9cd075, tests: node --import tsx --test tests/segment-working.test.ts → ℹ duration_ms 157.284209)

Ruling: reuse the existing NOLOGIN/non-bypass campaign history capture role for the SECURITY DEFINER pin guard, adding only source SELECT/policy — history capture needs exact source validation while runtime history writes remain revoked; each lookup binds explicit NEW.workspace_id and ID — cost if wrong: forced RLS, role privilege/no-login and tenant/direct-forgery tests plus fresh review must establish no cross-tenant exposure.

Ruling: reject selected pointer removal at the database guard and reserved-key legacy collision before adding derived columns — omission preserves the captured source and no clear/all-recipient policy was approved — cost if wrong: future explicit source-clear semantics require their own product decision/migration, rather than silently reinterpreting old private intent.

Task 2: complete (commits b9cd075..51e9553, tests: node --import tsx --test tests/audience-snapshot.test.ts tests/audience-snapshot-db.test.ts → ℹ duration_ms 1707.764541)

Ruling: respond to the parent's explicit immediate delivery-estimate request with a concise grounded checkpoint and durable65-row delivery register — current audience API/UI are unfinished despite222previous-source tests,21full paths are absent and39requirements partial; external timing cannot support a production deadline — cost if wrong: audience-only8–16focused-hour estimate must be revised on defects rather than extrapolated to full GA; all13gates stay required.

Ruling: carry only the local fixture session hash privately in the request principal and use a restricted identity function with post-lock database-clock expiry — fresh authority calls after resource/receipt waits cannot otherwise identify the original session; no cookie/hash reaches DTO or durable receipt — cost if wrong: exact lock-wait HTTP and full auth/role regressions must qualify the local boundary; Clerk/live identity/MFA/session lifecycle remain unaccepted external production evidence.

Ruling: evaluate matches and timestamp in one materialized statement-time query, including the empty-match case, and use that cutoff for observed engagement windows — transaction admission can precede a resource wait and is not evaluation evidence — cost if wrong: actual lock-release boundary probe and stable source digest/member ordering must pass; production query capacity remains required.

Task 3: complete (commits 51e9553..343da93, tests: npm run smoke:audience-selection → Owned audience query-time cutoff PASS after actual row wait.)

Task 4: Ruling: nested editor uses a dedicated SegmentEditor controller beside RuleBuilder/recovery — isolates contacts/definitions from segment pending commands and workspace fencing — cost if wrong: additional component surface to maintain.

Task 4: Ruling: initial browser RED selector used an exact accessible name on an implicit select label including option text; repaired fixture selector before establishing absent nested controls/load refusal RED — preserves real product assertions — cost if wrong: fixture could target the wrong select, addressed by explicit new aria-label.

Task4 Ruling: workspace picker intentionally returns Home; recovery browser uses actual mobile drawer and Audience navigation rather than assuming picker retains audience URL — asserts intended navigation and memory recovery — cost if wrong: browser fixture navigation needs updating if this product behavior changes.

Task 4: complete (commits 343da93..0b16d89, tests: npm run smoke:audience-selection → Owned Chromium interruption PASS: boolean/date/day invalid recovery, failed initial source read, tab-only storage recovery/workspace switching/unload refusal, delayed old-workspace response fence, root-leaf round-trip/20-child refusal, retained original command under current authority denial, failed acknowledgment read/original receipt against newer current truth, no duplicate lost-response freeze and Viewer refusal.)

Task5 Ruling: factor snapshot selector and bounded campaign recovery into dedicated modules and a separate owned campaign browser fixture — keeps metadata authority and durable command state separate from recipient data and existing segment fixture — cost if wrong: additional modules and fixture setup; one whole-slice review still covers them all.

Task5 Ruling: existing lifecycle version fixture expected page reload to discard its previously typed name/timing; new scoped recovery explicitly requires retaining those fields — change setup assertion to exact recovered name + original typed minute while retaining subsequent independent remote-CAS/form-base/no-POST/explicit-reload checks — cost if wrong: browser must still prove no accidental base advance and truthful current state in all6cases.

Task 5: complete (commits 0b16d89..dc92d67, tests: npm run smoke:audience-selection → Owned metadata verification interruption PASS: clearing an in-flight source restores omission controls and fences its stale response.)

Final grading: I1 Important (silently discards admitted large/escaped segment records and original command); I2 Important (silently discards unrelated admitted campaign edits with long invalid revision). Both reproduced pure + actual Chromium before changes. One native fix pass; no rereview.

Final: minor (deferred): M1 uppercase valid snapshot UUID verifies under canonical lowercase identity but leaves explicit-ID Save disabled; manually entering lowercase remains available. Not fixed in this pass.

Ruling: declined1 draft audience capture does not qualify delivery/scheduling/provider/dispatch-time consent, suppression, topic, frequency or sender gates — no real sends/provider operations — cost if wrong: unsafe marketing delivery; all independent gates remain required.

Ruling: declined2 existing observation queries do not establish authentic external engagement ingestion — ingestion/provenance remain unfinished — cost if wrong: misleading audience predicates; no live event acceptance claimed.

Ruling: declined3 local session post-wait expiry proof does not certify production Clerk revocation, MFA or identity configuration — production setup remains open — cost if wrong: unauthorized production access; live identity evidence required.

Ruling: declined4 retain explicit 10,000-member development cap without higher-capacity/query-lock SLO acceptance — no production load exercise — cost if wrong: refusal/latency beyond tested capacity; operational qualification still required.

Ruling: declined5 synthetic migration/storage validation does not close live lock, rollout, rollback or backup/restore acceptance — no production environment touched — cost if wrong: operational outage/data loss; live exercises remain required.

Ruling: declined6 retain adjacent contact coercion/consent/list/tag administration and arbitrary old catalog discovery as separate unfinished scope — only already-selected unknown IDs preserved here — cost if wrong: incomplete broader audience workflows; full GA requirement remains binding.

Ruling: declined7 workspace/campaign browser slots and same-tab fallback do not promise independent concurrent drafts, eviction/private-mode lifetime or different-user retention — broader ownership/concurrency policy remains unfinished — cost if wrong: independent edits may overwrite/recover another slot; no broad preservation claim.

Ruling: declined8 semantic labels and Chromium mobile checks do not close exhaustive screen-reader or other-engine acceptance — no such exercise completed — cost if wrong: inaccessible or engine-specific behavior; accessibility gates remain open.

Ruling: declined9 public checkpoint, canonical sync, ordinary push and exact published CI remain Task6 work after fix — older evidence cannot qualify new head — cost if wrong: publishing unchecked/stale source; fresh exact-head readback required.

Ruling: declined10 all65 Baseline A requirements and all13 release gates remain binding, with legal/provider/account/billing/economics/public launch unaccepted — slice review cannot certify GA — cost if wrong: premature unsafe/over-budget launch; no production claim.

Ruling: derive bounded segment recovery limits from100 nodes,2000-character leaf text,48-character saved field,100-character edit ID,six-character JSON escapes and both nested serialized copies; validate full record before durable claim — admitted records must roundtrip, storage/unsupported exceptions retain guarded memory — cost if wrong: storage quota falls back honestly and requires confirmation; large-form parsing cost increases.

Ruling: admit campaign revision working text up to2000 with visible input maxLength and matching recovery schema; bind offset to its existing100 recovery limit and validate writer truthfulness — correctable invalid input must preserve unrelated fields — cost if wrong: values beyond admitted bounds remain tab-only with warning rather than falsely durable; server UUID contract unchanged.
