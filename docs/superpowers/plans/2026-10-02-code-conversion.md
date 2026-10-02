# Raw conversion implementation plan

Use executing-plans/TDD/verification-before-completion. Explicit user parallel instruction permits disjoint workers; root integrates/serializes commits. ONE fresh whole-slice review followed by ONE native Important/Critical fix pass; defer Minors. Basec3eeead; no remote push without fresh direct trusted approval, no paid/provider effects. Preserve current sender and audience ledgers pending publication. Source spec:docs/superpowers/specs/2026-10-02-code-conversion-design.md.

1. [ ] Domain worker: strict contracts and deterministic conservative conversion, meaningful RED→GREEN pure tests. Own src/domain/email-conversion.ts/tests/email-conversion.test.ts only.
2. [ ] UI worker: dedicated proposal/recovery controller and unit recovery tests; actual Chromium fixture. Own src/ui/email-conversion.tsx/src/ui/conversion-recovery.ts/tests/conversion-recovery.test.ts/scripts/smoke-conversion.ts only. Coordinate stable API/domain interfaces; no shared editor/root edits.
3. [ ] Root: guarded proposal/accept server helper/routes, strict API/examples/SDK, editor actor/anchor/current-truth integration and affected real HTTP tests. No new DB schema/dependencies; preserve source checkpoint atomically on accept.
4. [ ] Aggregate focused/full/lint/typecheck/API/build, actual interruption/empty/error/repeated/source changes/tenant/role/key/390px browser. Inspect pixels. ONE immutable review/nativefix; public every ruling and limitation; canonical safe FF/checks. Publication blocked if fresh trusted approval remains absent; no false GA acceptance.
