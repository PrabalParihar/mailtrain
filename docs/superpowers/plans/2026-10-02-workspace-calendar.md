# Workspace calendar implementation plan

Execute natively using superpowers:executing-plans; no implementer delegation. ONE fresh Astra high whole-slice reviewer after Tasks1–5, ONE Important/Critical native RED→GREEN pass; defer Minors. Spec:docs/superpowers/specs/2026-10-02-workspace-calendar-design.md. BASEe329d1763c41246aa6d24347208031ad20173894. Existing continuous development authorization overrides repeated routine approval pauses. All65/all13 remain required; no provider/launch effects.

## Review Focus
- Lifecycle refresh must keep typed settings and original uncertain command, while current cancellation gates editing; newer configuration must never silently advance unsaved form base.
- Display timezone never rewrites/accepts original campaign timing, especially DST folds/month crossings.
- No old cursor/delayed response combines different tenant/month/timezone versions; new metadata excludes audience/provider configuration.
- Derived index must not normalize unknown/invalid timing or allow runtime forgery; preference manager/version/tenant/rollback gates hold.
- Retry identity survives acknowledged POST→failed current read and unavailable browser storage.
- Calendar/heuristic labels never imply measured audience behavior, accepted schedules/SLO or full GA.

### Task 1: Requested lifecycle freshness fix
Files src/ui/campaign-configuration.tsx, src/ui/operations.tsx, scripts/smoke-campaign-lifecycle.ts, package/CI.
- [x] Actual owned HTTP/Chromium RED: parent review/cancel badge changes while child stays draft/editable; preserve edited name/revision/planned timing across state refresh. Expected actual stale-state failure.
- [x] Implement current lifecycle signal without unsaved hydration/base advancement or original-key loss. Test delayed initial/read/receipt, cancellation controls/no submission, version conflict/explicit reload, old recovery regression. Expected full tests/lint/typecheck/API/build and browser PASS; commit/task-done.

### Task 2: Pure calendar contract
Files src/domain/workspace-calendar.ts, tests/workspace-calendar.test.ts. Export WorkspaceTimezoneInput, CalendarMonth, validateDisplayTimeZone, moveCalendarMonth, calendarDayCells, formatCalendarInstant.
- [x] Missing module RED: strict version/fields/month/zone, numeric zone denied, UTC/NY fold/Kathmandu/month crossing, leap Monday-first cells/cross-year navigation. Expected missing module failures.
- [x] Implement no-machine-timezone helpers. Expected focused/full/lint/typecheck PASS; commit/task-done.

### Task 3: Observed index and preference storage
Files db/027-workspace-calendar.sql, tests/workspace-calendar-db.test.ts. Add timezone_version and derived planned_at/index/trigger; runtime manager/version/context guard and index forgery guard; preserve026 history.
- [ ] Isolated actual PG RED: missing columns, current-only valid/invalid backfill, tenant/manager/version/no-op/rollback and campaign timing/version/hash/history unchanged.
- [ ] Implement/apply owned local database only. Expected focused/full/lint/typecheck PASS; commit/task-done.

### Task 4: Scoped calendar/preference API
Files src/server/workspace-calendar.ts, audience-routes/auth/http/API handler/generator and generated contracts. GET campaigns/calendar?month=YYYY-MM&limit; GET workspace-preferences; POST workspace-preferences/timezone current manager session CAS. Read campaigns:read; session-only preference writes.
- [ ] Actual HTTP RED new routes; DST/month grouping, strict metadata/session/foreign/role/key/encoded, CAS/no-op/replay/current preference, unchanged campaign intent, timezone-changed cursor rejection. Expected new-route failure.
- [ ] Implement signed month/zone/version metadata pages and strict DTOs. Expected full tests/lint/typecheck/API/build PASS; commit/task-done.

### Task 5: Calendar/timezone UI and recovery
Files src/ui/workspace-calendar.tsx, operations/app/css, scripts/smoke-workspace-calendar.ts, package/CI. Accessible month/events/display-zone preference, planned labels and disclosed unmeasured heuristic.
- [ ] Actual Chromium RED controls missing.
- [ ] Actual initial/offline/error/repeated/lost acknowledgment/POST→failed GET/storage-unavailable, independent stale CAS/retained input/explicit reload, month/date folds/paging/error/empty/Viewer/mobile/workspace navigation. Expected full checks plus campaign/Voice/preflight/key/contract regressions PASS; commit/task-done.

### Task 6: Single review/source publication
- [ ] Fresh whole-slice BASE..HEAD/spec/plan/ledger/all Review Focus. Grade effects; ONE native Important/Critical RED→GREEN pass; defer Minors/rule every declined judgment.
- [ ] Final checks/canonical clean expected-head tracked-only sync/actual browser/authorized ordinary main push/exact-head CI. Preserve exhaustive public Rulings/Minors before deleting only this workspace; all65/all13 remain binding.
