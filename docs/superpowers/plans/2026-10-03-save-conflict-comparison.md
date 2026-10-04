# Save Conflict Comparison Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, with one fresh strongest whole-change reviewer.

**Goal:** Show full read-only unsaved-draft versus captured-server differences in the existing single-author conflict flow.

**Architecture:** Reuse pure spec comparison rows; add a strict existing-document adapter, exact scoped source identity and bounded excerpt helper with full compared-value downloads. A separate keyed client panel snapshots the local draft and conflict document, pages50rows, and refreshes through the existing GET with epoch/abort/input fences. It never invokes save/copy/reload/recovery writes.

**Tech Stack:** Existing Node24/Next16/React19/TypeScript6/Zod4/PostgreSQL17/Playwright; no dependencies/migrations.

**Spec:** Explicit continuation and ../lettercape-next-feature-proposal-2026-10-03.md; authoritative ../inputs/Mailcraft-Development-PRD-v2.0.md REQ017/6.4/JRN04.

## Global Constraints

- Full65requirements/all13release gates remain; no whole-product acceptance.
- Original provenance repair remains unapproved. Preserve originals/private configuration.
- Flagged collaboration/database-security work and its tests stay paused; ordinary presentation and existing save/read contracts only.
- Existing copy/reload/recovery contracts unchanged; no automatic merge/new authority or artificial checkpoint receipts.
- No paid/account/provider/live-sending changes/new permissions. Existing authorized Desktop/main publication remains in scope.

## Review Focus

- Delayed refresh after local edits, conflict-head changes, close, navigation or actor/workspace changes never displays a stale pair or adopts source.
- Long/bounded source and row pages disclose omitted display while making every differing field reachable; authored source stays literal.
- Body-only conflicts with identical subjects, nested nodes, inactive source and literal absence remain distinguishable.
- Comparison preserves pending original-command recovery and both documents; copy/reload remain explicit independent choices.
- Strict malformed/wrong-email refresh refusal and offline/error retry do not replace the current pair or fabricate refreshed success.

### Task 1: Real conflict regression and pure comparison contracts

Files: tests/save-conflict-comparison.test.ts; scripts/smoke-save-conflict-comparison.ts; src/domain/save-conflict-comparison.ts.
Interfaces: ConflictDocument uses existing document fields; saveConflictRows(local,server) returns RevisionChange[] including title/profile; conflictComparisonIdentity(scope,doc) returns exact canonical scoped identity; checkedConflictDocument(input,email,workspace?) validates existing receipt/document spec; conflictExcerpt(value,peer,source) returns bounded value/partial.
- [ ] Write tests for full fields/title/profile/purity, exact scoped/canonical identity, strict existing-document admission and8192-character Unicode-safe first-difference excerpt. Expected RED: missing/empty comparison behavior before implementation.
- [ ] Write actual two-browser-context body-only412 fixture and assert Compare draft and server reveals full body. Run before production UI. Expected RED: existing subject-only panel has no compare control/body.
- [ ] Implement pure contracts; node --import tsx --test tests/save-conflict-comparison.test.ts tests/revision-comparison.test.ts. Expected all PASS/0skip.

### Task 2: Keyed client panel and native recovery qualification

Files: src/ui/save-conflict-comparison.tsx; src/ui/editor.tsx; scripts/smoke-save-conflict-comparison.ts; package.json; .github/workflows/verify.yml.
Consumes Task1 rows/identity/stricthead/excerpt. Produces SaveConflictComparison(scope,local,server) read-only client UI; existing conflict actions unchanged.
- [ ] Add Compare/Close, Show unchanged fields,50-row pages, full UTF-8 compared-value downloads and existing GET Refresh server; label local unsaved/captured server version; no new checkpoint receipt. Use exact input/lifetime fences and abort repeated refreshes.
- [ ] Qualify actual412, unchanged row/recovery witnesses, keyboard320px/RTL/raw/retained source/paging/large excerpts, repeated clicks, edit-during-refresh, close/navigation, offline/error/malformed-head/retry and empty/no differences. Expected native PASS,0external/page/key errors and owned fixture cleanup.
- [ ] Add only this ordinary smoke to unchanged required CI checks; run API151/lint/type/build and closed production startup. Expected PASS except intentionally refused production startup.

### Task 3: Review, preservation and delivery

Files: docs/SAVE-CONFLICT-COMPARISON-CHECKPOINT.md; docs/CAPABILITIES.md; this plan.
- [ ] One fresh strongest immutable whole-change static review; one RED→GREEN material fix pass if needed; no re-review. Record every declined area and deferred minor with costs.
- [ ] Read-only77original witnesses/private/unrelated baseline, fast-forward mirror/Desktop, match tracked files. Nonforce push authorizedmain and require exact-head terminal all3CI success.
- [ ] Retain evidence and exhaustive rulings; remove only owned scratch. Report usable bounded comparison and concrete remaining defects; recommend next independent PRD slice without implementing it.
