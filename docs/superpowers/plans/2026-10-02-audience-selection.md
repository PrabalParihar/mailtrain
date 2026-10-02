# Nested audience rules and campaign snapshot selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. No implementer delegation; ONE fresh whole-slice Astrahigh reviewer and ONE native Important/Critical fix pass, defer Minors.

**Goal:** Author bounded nested versioned selections and explicitly bind immutable audience snapshots to campaign configuration without implying accepted delivery.
**Architecture:** Browser working-rule model and recovery use the existing server Rule AST; SQL-authoritative snapshots bind exact members/source/digest through tenant FKs and guarded immutable history. Strict metadata endpoints/configuration commands and recursive UI preserve current authority, original source/form/receipt identities and legacy unselected campaigns.
**Tech Stack:** Existing Next16.3.8/React19.3/TypeScript6/Zod4.6.5/PostgreSQL17/Playwright1.63; no new dependency.
**Spec:** docs/superpowers/specs/2026-10-02-audience-selection-design.md

## Global Constraints
- Full Baseline A/all65requirements/all13GA gates remain binding. No provider/model/collector/send/paid-resource/public activation or consent acceptance claim.
- Work natively in the preserved mirror; canonical Desktop is tracked-only sync after clean immutable baseline/hash/collision checks. Ordinary non-forced main pushes are authorized; exact-head CI mandatory.
- Rules preserve100nodes/depth5/20children; snapshot capacity remains10,000matched contacts. Invalid working strings must not coerce into valid comparisons or disappear.
- Omitted audience_snapshot_id preserves the captured audience. Explicit UUID selection requires current audience and campaign-write authority. No implicit clear/all-recipient policy.
- Freeze membership/version/digest/locale/consent-version/captured eligibility; dispatch still requires current consent/suppression/topic/frequency/sender/legal/provider checks.
- Current content-role campaign responses expose bounded metadata/counts, never snapshot member arrays or arbitrary intent/provider fields. Snapshot member detail remains audience-authorized only.
- Follow installed Next docs, meaningful RED→GREEN, full relevant checks and actual browser interruption/error/retry/mobile evidence. No repetitive account setup prompts while independent work remains.

## Review Focus
- Nested all/any edits and saved leaf roots must preserve meaning; blank/nonfinite numbers, invalid date/boolean/days, unknown saved relation IDs and depth/node/child limits must retain correctable input.
- Unsaved/recovered form and a newer observed source must never authorize preview/freeze/save of a different rule; exact-body/key unknown-outcome retries and workspace interruptions must not lose or overwrite work.
- Selected immutable source must bind exact members/metadata/digest and tenant FK/history without adopting live new members or rewriting captured eligibility; direct runtime forgery/rollback/legacy rows must remain safe.
- Recipient-role and API scope changes, passive expiry while waiting, Viewer/Editor collection/detail/command responses, foreign/tampered cursors and missing source must deny or redact without private fields.
- Initial/empty/read/page/retry/storage-unavailable/mobile/navigation states and old selections outside the loaded page must remain usable; no scheduled/delivered/consent/provider success follows from draft selection.

### Task 1: Recursive working-rule model
**Files:** Create src/domain/segment-working.ts; test tests/segment-working.test.ts.
**Interfaces:** Consumes Rule/Field/validateRule from domain/segments. Produces WorkingRule/WorkingLeaf, workingFromRule(rule), workingToRule(working,fields):Rule, replaceWorkingNode(root,id,change), workingBounds(root) and workingRuleFingerprint(root,fields).
- [ ] Write/run focused RED: nested any/all typed/date/boolean/tag/list/observed exact round-trip and unchanged input; leaf-root identity; blank/nonfinite/invalid typed comparisons and days throw while original text persists; explicit add/remove immutable structure;100nodes/depth5/20children bounds; unknown relation value retained.
- [ ] Implement pure browser-safe model, client-only IDs, strict late conversion/shared validation and bounded edits. Run focused/full/lint/typecheck; expected PASS. Commit and task-done focused command.

### Task 2: Immutable snapshot binding storage and domain
**Files:** Create src/domain/audience-snapshots.ts, db/028-audience-snapshot-bindings.sql, tests/audience-snapshot.test.ts, tests/audience-snapshot-db.test.ts.
**Interfaces:** Produces strict AudienceSnapshotMetadata/Pointer/Member schemas and snapshotSource(input) with exact original v1 digest input; generated tenant FK source IDs on campaigns/campaign_revisions, immutable snapshots and binding trigger. Task3 consumes pointer/source; Task5 consumes metadata.
- [ ] Write/run missing-domain/migration RED: sorted unique member/count/reason bounds and faithful digest input; forced RLS, foreign source/direct pointer/member/metadata forgery denied; immutable update/cascade protections; legacy campaigns/history unchanged; proper selected copy/current consent change leaves pinned membership/history; no-op/rollback atomic.
- [ ] Implement nullable generated IDs/composite FKs and before-write exact source/member guard, trusted fixture deletion only, no invented backfill. Existing history capture stays authoritative. Snapshot source projection never includes addresses/secrets. Run focused PG/pure/full/lint/type/API/build; expected PASS. Commit/task-done.

### Task 3: Strict audience metadata and campaign commands
**Files:** Modify organization-routes, audience-routes, campaign-configuration domain/server, http/pagination and generated API/SDK; create scripts/smoke-audience-selection.ts and focused contract tests; adapt campaign clients/smokes to redacted DTO as necessary.
**Interfaces:** GET /v1/audience-snapshots signed metadata collection optional segment_id; GET /v1/audience-snapshots/{id}/metadata strict detail. Optional configuration audience_snapshot_id UUID; campaign DTO/history expose nullable pointer/counts. Collection/create/lifecycle responses use the same redacted campaign projection; immutable stored intent still retains exact members. Existing full audience snapshot detail stays compatible/authorized.
- [ ] Write/run actual HTTP RED: missing metadata routes, strict/duplicate/unknown query denial, pagination/cursor actor/tenant/filter binding, no addresses/member/provider/private intent fields for Viewer/Editor; selected Owner/Admin/current scopes only; same-source no-op, omit preserve, foreign/corrupt refuse, CAS/replay/review reset, exact source/version/history/digest and no live re-evaluation.
- [ ] Add current authority after target lock waits and before/after original receipt recovery; correct preview/freeze evaluation cutoff to query-time evidence rather than an earlier lock-wait transaction label. Implement strict schemas/generated examples and actual owned fixture cleanup. Run HTTP/contract/full/lint/type/API/build plus existing campaign/lifecycle/calendar checks; expected PASS. Commit/task-done.

### Task 4: Nested builder and scoped recovery
**Files:** Create src/ui/segment-rule-builder.tsx and src/ui/segment-working-recovery.ts; modify audience-organization.tsx/globals.css; add browser portion scripts/audience-selection-browser.ts.
**Interfaces:** RuleBuilder({value:WorkingRule,fields,lists,tags,disabled,onChange}) uses Task1. Audience form preserves segment ID/base version/saved fingerprint/name/working tree; pending commands preserve exact source/body/key. Task3 supplies versioned saved rule/preview/freeze and current catalog.
- [ ] Write/run actual missing nested-controls RED and saved-nested load refusal RED. Verify recursive save/reload/preview/freeze, dirty form blocks old-rule actions, invalid typed input/recovery, stale source explicit reload, unknown relation labels, exact body/key loss/retry/repeated clicks, current role/workspace response fences, storage failure/SPA/unload protection and390px/nooverflow.
- [ ] Implement accessible bounded recursive controls and recovery/fingerprints/receipt reconciliation, retain invalid text and never manufacture engagement. Run complete owned browser/HTTP and full/lint/type/API/build/import checks; expected PASS. Inspect painted pixels. Commit/task-done.

### Task 5: Campaign audience selection and history
**Files:** Modify ui/campaign-configuration.tsx and operations.tsx; extend owned audience-selection browser and existing campaign recovery fixtures.
**Interfaces:** Owner/Admin signed metadata pages and explicit ID verified by Task3; current pointer/recipient counts readonly for other content roles. Captured command includes source only when explicitly selected; omission preserves original intent.
- [ ] Write/run missing-selector RED: source outside first page remains visible, strict initial/error/empty/failed paging/repeated page and current source metadata; select/save/no-op/omit/history; segment/contact changes leave pinned membership; review invalidation; lost POST/failed GET/original receipt after cancellation; stale saved config preserves form/base; Viewer/Editor denial; workspace interruption/storage unavailable and mobile.
- [ ] Implement metadata selection with current acknowledged base and existing original-key/lifecycle fences. Run complete selection/browser and existing campaign/lifecycle/calendar/UTM/preflight/remix/PNG+PDF checks/full/lint/type/API/build; expected PASS. Commit/task-done.

### Task 6: ONE review and publication
**Files:** Current-plan ledger/spec/plan, public AUDIENCE-SELECTION-CHECKPOINT/CAPABILITIES/VERIFICATION/COVERAGE/RELEASE evidence; reviewed source/canonical sync only.
**Interfaces:** Immutable BASE..HEAD plus all prior deliverables, spec/plan/Review Focus and current ledger for ONE fresh Astrahigh fork_none reviewer.
- [ ] Dispatch ONE reviewer using exact installed template. Grade concrete effects, fix Important/Critical in ONE native meaningful RED→GREEN pass, defer Minors and rule every declined judgment; no rereview.
- [ ] Run final full and actual browser/affected commands; preserve every Ruling/Minor publicly. Clean immutable canonical baseline/collision/hashes/actual canonical suite, ordinary exact-head push/readback/CI both jobs. Complete task-done and delete only this plan's private workspace after committed exhaustive preservation. All65/all13 remain binding; no production/provider claim.
