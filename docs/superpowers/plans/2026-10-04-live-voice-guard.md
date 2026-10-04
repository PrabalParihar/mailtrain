# Live mechanical Voice Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Preserve the existing native method and one fresh final reviewer.

**Goal:** Give the unsaved draft actionable deterministic brand/style feedback without saving, rewriting, approving or changing recovery.

**Architecture:** Browser-safe evaluation reuses existing toneFindings and literal phrase meaning; inert parse5 text extraction has explicit HTML coverage limits. The editor panel finds its exact immutable pinned kit via existing paginated GET /v1/brands, with explicit older-page search, verified admission and scope/pin/read fences. Current draft findings are synchronous; no asynchronous draft snapshot is presented as current.

**Tech Stack:** Existing Next16.3.8/React19.3/TypeScript6/Zod4/parse5/Playwright; no dependencies or endpoints added.

**Spec:** /Users/prabalpratapsingh/Documents/Codex/2026-10-01/task/lettercape-next-feature-proposal-2026-10-04.md; authoritative native inputs/Mailcraft-Development-PRD-v2.0.md REQ008/023; existing docs/superpowers/specs/2026-10-02-voice-guard-design.md.

## Global Constraints
- Original provenance repair awaits approval; four original orphan rows and original data/private files remain untouched.
- Flagged collaboration/database-security work and its tests remain paused. Ordinary focused local checks and unchanged required mainCI plus this smoke qualify delivery.
- No paid/provider/account/live campaigns or semantic/AI evaluation claims. All65requirements/all13GA gates remain the baseline; production closed.
- Exact pinned kit only, never brands/current substitution. GET pages max100; older-page continuation explicit; cursor max4096 and repeated cursor refused.
- Supported authoring fields only; inactive source excluded and disclosed. Raw/custom HTML max65536UTF8 bytes per field; larger HTML coverage unavailable. No HTML execution/fetch/CSS/client/conditional-layout certification.
- Preserve unsaved edits, original-command recovery and existing frozen preflight/export/send authority. No source mutator or save callback in panel.

## Review Focus
1. Local edits during held kit reads yield only current draft findings; scope/pin change, close and navigation fence late responses.
2. Old pinned versions outside first page remain reachable; malformed/wrong-workspace/repeated-cursor data never substitutes another kit or implies successful checks.
3. Legal colon/quote/Unicode IDs, empty/unset rules, decorative alt and inactive source do not collide or create misleading findings.
4. Inert HTML split inline words, text/paragraph boundaries, Unicode/hidden tags, deep markup and oversized source preserve copy and disclose unsupported coverage.
5. Many findings, keyboard/mobile/RTL and repeated/error/offline flows remain usable; no review outcome is represented as immutable preflight or AI approval.

### Task1: Browser-safe live evaluation and pinned-page admission
**Files:** Create src/domain/live-voice-guard.ts; tests/live-voice-guard.test.ts.
**Interfaces:** Consumes EmailSpec, BrandSchema, toneFindings. Produces liveVoiceReport(spec:EmailSpec,brand:Brand):LiveVoiceReport and checkedVoiceBrandPage(input:unknown,workspace:string):VoiceBrandPage; exports LIVE_VOICE_RULES_VERSION and MAX_VOICE_HTML_BYTES=65536.
- [x] Write tests for current located subject/preheader/nested copy/alt, per-field tone boundaries, literal phrase semantics, decorative/destination/inactive exclusion, inert Unicode/inline/paragraph/hidden/deep/oversized HTML, exact source purity and strict page admission.
- [x] Run node --import tsx --test tests/live-voice-guard.test.ts tests/voice-guard.test.ts tests/voice-review.test.ts. Expected: new behavior assertions RED; existing7tests PASS.
- [x] Implement evaluator/page admission using existing client-safe types and iterative inert HTML traversal; no shared authoritative preflight changes.
- [x] Run same command. Expected: all focused tests PASS/0skip; commit independently.

### Task2: Independent editor panel and real native qualification
**Files:** Create src/ui/live-voice-guard.tsx; scripts/smoke-live-voice-guard.ts. Modify src/ui/editor.tsx; package.json; .github/workflows/verify.yml; docs/CAPABILITIES.md; create docs/LIVE-VOICE-GUARD-CHECKPOINT.md.
**Interfaces:** Consumes liveVoiceReport/checkedVoiceBrandPage. Produces LiveVoiceGuard({scope:{workspace,actor,email},spec:EmailSpec}); no draft/recovery setter. Existing /v1/brands paged reads supply exact kit.
- [x] Write owned disposable HTTP/Chromium regression: live unsaved field findings, old pinned kit through page2/current-kit mismatch, witnesses/recovery unchanged, held reads with local edits/pin change/close/navigation, repeated clicks, malformed/wrong-workspace/cursor/error/offline retry, unset/no-findings, deep/oversized/raw/RTL/nested/alt, many finding pages, keyboard320px controls. Expected initial RED: Show live Voice Guard button absent.
- [x] Implement open/close/refresh/older-page controls, scope/pin fences, synchronous current-draft evaluation, located actionable instructions, rule/pin labels, bounded20findings display pages and clear pending/unavailable/coverage/no-finding states.
- [x] Run focused tests/native/API151/typecheck/lint/build and closed-production assertion. Expected all pass; inspected mobile/RTL pixels; fixture app/database cleaned; commit.

### Task3: Focused final review, preservation and main delivery
**Interfaces:** Consumes committed whole patch and Task1/2 evidence; produces qualified Desktop/main exact commit and delivery report.
- [x] Dispatch one fresh strongest bounded whole-change reviewer with five focus items, plan/spec/only this ledger, immutable base..head; no services/DB/private/flagged work. Grade and ledger every exclusion/cost.
- [x] One Important/Critical TDD fix pass if needed; Minor findings deferred; no re-review. Required checks/build after changes.
- [ ] Before/after original77table/private4metadata/unrelated hashes; retain original physical recovery; fast-forward mirror/Desktop; authorized nonforcepushmain.
- [ ] All3required CI jobs terminalSUCCESS on exact commit, then final preservation/remote/source/Desktop checks. Archive own ledger and remove only own scratch. Report delivered capability, blockers, all rulings/costs, deferred minors and next independent PRD slice.
