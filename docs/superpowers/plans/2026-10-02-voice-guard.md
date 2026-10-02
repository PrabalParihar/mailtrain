# Versioned Voice Guard Implementation Plan

> Execute natively under superpowers:executing-plans with one fresh whole-slice Astra high reviewer; continuous authorized development supersedes repeated routine approval pauses.

Spec: docs/superpowers/specs/2026-10-02-voice-guard-design.md. Start after creation-queue checkpoint review/fixes/source publication. Exact-head CI may run while this separate native slice advances; never mix unreviewed product code into the published queue checkpoint.

## Review Focus
- User rules must not introduce executable regex/model permissions or alter pinned old kits.
- Hidden/raw/custom HTML, decorative alt and URL destinations must not contaminate visible-copy findings.
- Unicode and sentence boundaries must have bounded reproducible disclosed behavior, including zero exclamation limit.
- A cached passing report under an old rule version must not authorize an exact-artifact campaign after upgrade.
- Offline/repeated save/workspace navigation must preserve the intended kit fields and version rather than silently applying stale policy.

### Task1 Pure configured rule contract/traversal
Create src/domain/voice-guard.ts, tests/voice-guard.test.ts. Modify src/domain/preflight.ts and email.ts. Interfaces: ToneRules.strict optional integer max_sentence_words1..200/max_exclamations0..100; toneFindings(text:string,location:string,rules:ToneRuleData):Finding[]. lintEmail(spec,forbidden?,artifact?,toneRules?):Finding[].
- [x] RED absent module; exact limits/unknown types/keys/no limits, boundary/one-over Unicode sentence punctuation/newline, zero/fullwidth exclamations, field locations; structured/raw/custom visible copy excludes script/URL/decorative alt. Run focused expecting FAIL.
- [x] Implement pure bounded checks and existing traversal integration, preserve phrase blockers. Bump newly evaluated LINT_RULES_VERSION static-3. Focused + full suite expected PASS; commit.

### Task2 Versioned brand persistence/API/approval fences
Modify src/domain/brand.ts optional tone_rules, src/server/ai.ts data-only prompt, preflight/approval route, scripts/generate-api.ts/generated SDK. Existing brand rows immutable JSON need no destructive migration.
- [x] RED owned tests that a pinned old kit remains unchanged, new rules parse/persist/validate scopes, current report receives pinned rules; old passing rule version fails campaign approval with PREFLIGHT_BLOCKED.
- [x] Integrate optional field and bounded documented API; approval checks current rules version in addition to existing artifact/provider/gates. Run focused/full suite/API/lint/typecheck expected PASS; commit.

### Task3 Brand controls and actual browser/HTTP acceptance
Modify src/ui/brand.tsx; create scripts/smoke-voice-guard.ts/package/CI. Existing preflight located finding UI consumes same Finding interface.
- [x] RED owned Chromium controls missing; implement unset/zero/numeric limits, explicit per-field counting explanation, preserve pending edits on errors and same-event save mutex. No automatic rewrite.
- [x] Verify immutable v1/v2 pins and reload, strict/foreign/role/key boundary, offline/repeated clicks/invalid limits/located findings/mobile/workspace interruption. Full tests/lint/typecheck/API/build + appropriate existing brand-memory/preflight/membership/key smokes expected PASS; commit.

### Task4 Whole-slice review/publication
- [x] One fresh Astra high reviewer of BASE..HEAD/spec/plan/ledger; regrade by effect, one Critical/Important RED→GREEN pass, defer Minors/rule all declined judgments.
- [x] Final full checks/HTTP/browser; expected-head clean canonical tracked-only SHA256 sync, ordinary authorized main push, exact-head CI success readback. Copy exhaustive rulings/deferred Minors to public checkpoint then delete only this plan workspace. No public activation.
