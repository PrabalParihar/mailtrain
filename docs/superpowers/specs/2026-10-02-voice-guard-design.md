# Versioned configured Voice Guard

## Intent and binding scope
Complete the independent configured-rule portion of REQ-008/023 alongside existing located forbidden-phrase lint. Full Baseline A remains binding. The existing PRD and continuous native implementation instruction provide scope and execution authorization; material provider/economic/legal decisions still ask. No semantic tone-model certification, automatic rewrite or sending approval is implied.

## Design
Use optional explicit numeric limits in each immutable Brand JSON version: `tone_rules:{max_sentence_words?:integer1..200,max_exclamations?:integer0..100}` with unknown keys rejected. Missing fields mean no configured limit, including old kits. The limits apply separately to each located copy field, not the whole message. The brand editor can leave either unset; help text defines deterministic counting. Brand versions stay immutable and existing emails retain their pinned version.

Pure `ToneRules` and `toneFindings(text,location,rules):Finding[]` live in src/domain/voice-guard.ts. Count word sequences using Unicode Letter/Number with internal apostrophe/hyphen; split sentences at terminal `.?!` (including corresponding Arabic/CJK punctuation) and newlines. Count exclamation marks ASCII/fullwidth across that one field. Bounds keep work linear in already bounded content; no user regex or model call. Exceeding a configured limit yields located warning codes `VOICE_SENTENCE_LENGTH`/`VOICE_EXCLAMATIONS`, naming observed and configured quantities. This is a disclosed mechanical style check; language-sensitive segmentation/semantic tone remains a separate acceptance task.

The existing shared preflight voice traversal invokes these findings on subject/preheader/visible block fields and nondecorative alt, including sanitized raw/custom HTML emitted text. Hidden scripts, URL destinations and decorative alt do not become tone copy. Forbidden literal phrase matching and blocking severity retain existing behavior. New rule set `static-3` applies only to newly evaluated reports; old immutable reports retain their version. Reports identify exact frozen artifact and pinned kit.

The configured rules join generationMessages as untrusted brand data, preserving no-tools permission boundary; readiness still refuses missing provider/finite allowance. Proposals remain reviewed separately. Draft save/checkpoint remain allowed so users can recover problematic copy. Campaign approval must require both the exact artifact and current rule-set version, as well as existing real-client/provider/release gates; no existing cached report bypasses a rule change. No automatic rewrite path is introduced.

## Alternatives and choice
Mechanical explicit limits improve current located lint without new vendor setup/spend. A semantic provider evaluator needs funded model/terms/evaluation and remains gated. Regex-configurable policy creates execution/complexity hazards and is excluded. Explicit numeric limits make each finding reproducible and editable.

## Verification
Pure RED→GREEN tests for strict limits, absent rules, Unicode punctuation, exact boundary/one-over, located warnings, visible/raw/custom copy versus hidden content/decorative alt. Owned PostgreSQL/HTTP verifies immutable pinned kit, editor-created new rule version, old kit compatible, foreign kit denial and approval rejection for stale rule-set/old artifact. Chromium brand controls, unset/zero/invalid bounds, repeated save clicks, offline/error preserved fields, new-version reload, located preflight findings and workspace/mobile navigation. Full tests/lint/typecheck/API/build; one fresh whole-slice review and one Important/Critical RED→GREEN pass; Minors deferred. No paid provider or campaigns.

## Remaining gates
Qualified locale/client fixtures, live model corpus, policy ownership/approval UX, automatic rewrite lifecycle if introduced and all13GA gates remain required. This development slice alone does not accept an entire requirement.
