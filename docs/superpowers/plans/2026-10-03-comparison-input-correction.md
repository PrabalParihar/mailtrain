# Comparison Input Correction Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, with one fresh strongest whole-change reviewer.

**Goal:** Close the two ordinary comparison defects from the prior review and deliver qualified code to main/Desktop.

**Architecture:** Normalize admitted comparison UUIDs before database result matching and normalize recovered checkpoint selections. Use tuple identities for block comparison rows while preserving metadata labels and current permission/draft contracts. Keep actor identity and scoped storage namespaces exact.

**Tech Stack:** Existing Node24.12, Next16.3.8, React19.3, TypeScript6, Zod4/PostgreSQL17/Playwright; no dependency additions.

**Spec:** Explicit continuation plus R2/R3 in /tmp/lettercape-revision-comparison-review.md and authoritative PRD REQ017/S09 at ../inputs/Mailcraft-Development-PRD-v2.0.md.

## Global Constraints

- Preserve full65 requirements/all13 gates with zero whole acceptance.
- Original four provenance rows await approval; no repair/quarantine schema or original-record/private-config changes.
- Flagged collaboration/security review and its branch-specific tests remain paused; do not inspect/change that branch or its policies.
- Local tests are comparison regressions only; existing main CI baseline remains unchanged, as requested for final publication qualification.
- No paid/account/provider/live-sending changes or new permissions.

## Review Focus

- Uppercase/mixed UUID before/after/email inputs must return the same canonical records; strict unknown/duplicate query refusals remain.
- Legal colon/percent/quoted/Unicode block IDs must yield unique stable identities across presence, position, fields and column count.
- Scoped recovered uppercase checkpoint metadata must compare successfully; actor case and workspace/email storage namespace must stay exact.
- Repeated toggles/selections must preserve all displayed changed rows, cancellation/recovery and unrelated unsaved edits.
- Correction must remain comparison-only with no global authority/policy, persisted-source mutation or paused-test changes.

### Task 1: UUID and row identity regressions

Files: src/server/revision-comparison.ts, src/domain/revision-comparison.ts, src/ui/revision-comparison-selection.ts, src/ui/revision-comparison.tsx; corresponding comparison tests.
Interfaces: compareRevisions keeps strict query/receipt schema; revisionComparisonRows keeps labels/kinds/values/presence but block key becomes JSON tuple; recovered selection keeps UUID/open metadata only.
- [ ] Add actual isolated-DB case/mixed UUID regressions, canonical recovered selection tests, collision/stability tests for valid adversarial IDs. Run focused tests and observe uppercase404/422, noncanonical recovery, duplicate keys RED.
- [ ] Normalize only UUID values at comparison boundaries; use JSON tuple identities for block presence/position/field/column_count. Keep ordinary source values/actor/storage keys unchanged.
- [ ] Update existing comparison test hooks for new block identities; focused regression tests GREEN and strict contract checks unchanged.

### Task 2: Native qualification and review

Files: scripts/smoke-revision-comparison.ts; docs/REVISION-COMPARISON-CHECKPOINT.md and this plan.
- [ ] Add actual HTTP upper/mixed query cases, uppercase recovered pair and colon-ID display/toggle/change-selection checks with duplicate-key console diagnostics captured.
- [ ] Run actual owned HTTP/Chromium fixture; all existing dirty/recovery/raw/RTL/quota/error/paging cases plus new cases pass; no original data/provider requests.
- [ ] Run API151 check, lint, typecheck, build and closed production startup. One fresh strongest static review of the immutable whole correction; one material RED→GREEN fix pass if needed, no re-review; record deferred minors.

### Task 3: Delivery and next feature

- [ ] Preserve all77original row witnesses, private metadata and unrelated tracked files. Sync mirror/Desktop and verify tracked hashes.
- [ ] Nonforce push main under existing explicit authorization; require exact-head terminal-success existing CI without removing gates or adding paused-branch tests.
- [ ] Retain full evidence/rulings before removing only owned scratch. Identify the next high-value independent PRD feature from current code/capability gaps, with concrete acceptance criteria and no implementation beyond this correction.
