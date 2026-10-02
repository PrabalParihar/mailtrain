# Campaign configuration implementation plan

> Execute natively under superpowers:executing-plans; no implementer delegation. One fresh whole-slice Astra high reviewer after Tasks1–4, one native Important/Critical RED→GREEN pass, Minors deferred. Continuous authorized development supersedes routine repeated approval pauses.

Spec:docs/superpowers/specs/2026-10-02-campaign-configuration-design.md. BASE35d1515dff3bc33f7a5130bc0aa464b93e8218a1. No provider/account/deployment effects.

## Review Focus
- DST gaps/folds/calendar normalization/half-hour or quarter-hour offsets must preserve explicit intent, without machine-timezone inference or accepted scheduling claims.
- A stale or replayed command must not change another campaign/configuration, duplicate history or authorize an altered artifact.
- Trigger privileges, direct runtime writes, backfilled provenance and rollback must enforce exact tenant and immutable observed history.
- Existing campaign arrays/contracts and independent sending/consent/approval gates must not be silently bypassed or certified by draft metadata.
- Delayed initial reads/receipts/history, repeated/offline/lost acknowledgment and independent-client conflicts must preserve submitted settings and current workspace.

### Task1 Pure configuration/timing contract
Create src/domain/campaign-configuration.ts and tests/campaign-configuration.test.ts. Exports CampaignConfigurationInput/RequestedCampaignTiming, resolveCampaignTiming(input):ResolvedCampaignTiming, campaignCanonicalJSON(value):string. Canonical sorting is local disclosed JSON ordering, not an asserted external certification. No node crypto import in client-shared schema.
- [x] RED missing contract; strict keys/version, explicit null/offset, UTC, leap/invalid dates, DST gap/fold, non-hour timezone, wrong/unknown zone/offset, canonical key ordering and array-order distinction.
- [x] Implement bounded deterministic resolution/serialization. Focused/full suite/lint/typecheck expected PASS; commit and ledger.

### Task2 Immutable restricted storage
Create db/026-campaign-configurations.sql and tests/campaign-configuration-db.test.ts. Preserve existing base rows; backfill current snapshot labeled migration_current. Trigger-owned restricted NOLOGIN writer, forced tenant RLS, runtime read-only snapshot grants, append on initial/material version change; mutation version/state constraints and immutable guard. Use existing local migration flow only.
- [ ] RED owned isolated actual PostgreSQL missing table/grants/append; verify tenant/composite pin, version/CAS invariants, immutability/direct insert denial, labeled current-only backfill and transaction rollback.
- [ ] Implement/apply only owned local database. Focused/full suite/lint/typecheck expected PASS; commit.

### Task3 Scoped configuration API and generated contracts
Create src/server/campaign-configuration.ts; modify audience-routes.ts and scripts/generate-api.ts/generated OpenAPI+SDK. GET campaigns/:id, GET campaigns/:id/configurations signed campaign-bound page, POST campaigns/:id/configuration with expected_version and strict settings. Scope maps remain campaign read/write. Current immutable revision supplies hash; no-op/stale/keyed replay preserve observed truth; draft/review_pending only editing.
- [ ] RED actual owned HTTP/DB: new endpoints missing; strict foreign/role/key/encoded, version/CAS/no-op/header-independent keyed body identity, missing revision/rollback, pinned hash/timing/history, signed pagination binding and no provider/approval changes.
- [ ] Implement routes/typed response metadata. Full tests/lint/typecheck/API/build expected PASS; commit.

### Task4 Actual UI and browser recovery
Create src/ui/campaign-configuration.tsx and scripts/smoke-campaign-configuration.ts; update campaign cards/app role prop/package/CI. Freeze form while submitting; immediate mutex; stored settings with planned-only semantics; explicit stale-base reload; original-key retry and authoritative reload/no-op; metadata history without audience/secret material.
- [ ] RED actual Chromium controls missing and behavior absent.
- [ ] Verify UTC/NY DST/non-hour visible original+UTC timing, invalid no POST, offline kept settings, same-event one POST, lost ack original retry one snapshot/no-op reload, two pages stale CAS with retained fields, role/tenant/key boundary, empty/history/repeat paging/error/mobile/workspace interruption. Appropriate existing campaign/preflight/key/contract/creation regressions plus full checks expected PASS; commit.

### Task5 Single review/publication
- [ ] Fresh reviewer BASE..HEAD/spec/plan/ledger/all Review Focus; regrade actual effect, one native Important/Critical RED→GREEN pass, defer Minors and rule every declined judgment.
- [ ] Final checks/owned browser; clean expected-head canonical315baseline tracked-only SHA256 sync; authorized ordinary main push/exact-head CI readback. Preserve exhaustive public rulings/Minors before deleting only this workspace. Production stays closed.
