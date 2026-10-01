# Source-linked Email Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement natively; one fresh whole-slice reviewer, one Important/Critical RED→GREEN pass.

**Goal:** Extend the existing frozen email/editor flow with source-preserving remixes and separately versioned locale drafts whose source drift is visible.
**Architecture:** PostgreSQL immutable same-workspace lineage links each new email to a frozen revision. New drafts copy the pinned spec, retain node IDs/URLs/brand and create their own initial revision; locale drafts change only explicit locale/direction and retain source copy until human translation. Source version changes produce derived stale status without rewriting children.
**Tech Stack:** Existing TypeScript/Next/PostgreSQL/Zod/compiler/API and Chromium fixtures; no new dependencies/providers.
**Spec:** Authoritative local `docs/Mailcraft-Development-PRD-v2.0.md`:REQ-011,026,TECH-010/012/030/031/034,JRN-05; existing approved full implementation plan supplies execution context. The user's complete-build instruction authorizes independent implementation; no new vendor, paid use or reduced scope is selected.

## Global Constraints

- All original P0 capabilities remain full-GA obligations.
- Immutable same-tenant source revisions and brand pins; original drafts/revisions/assets remain intact.
- Manual locale drafts must explicitly disclose that source text is retained, untranslated and unreviewed. No AI, currency conversion, send approval or client fidelity is fabricated.
- Current Editor/Owner/Admin authority, idempotency keys and existing CAS/epoch fences apply.
- No production activation, procurement, campaigns or secrets/public financial observations.

## Review Focus

- Foreign source/brand IDs and Viewer/Billing cannot create derived content; runtime FK/RLS must deny cross-tenant lineage.
- Retrying one lost command returns the same child/revision and never overwrites the source; changed intent conflicts.
- Source changes/restores mark existing children stale; legacy revisions without known source version disclose unknown rather than appear current.
- Locale changes, RTL, raw HTML/custom blocks, URLs/merge tags/node IDs and pinned brand must retain truthful provenance; locale identity cannot silently change on child save.
- Repeated clicks, offline failures and delayed responses retain input and cannot navigate another workspace/draft; parents/children remain reachable through paging.

### Task1: Immutable derivation contracts and database slice
Files:create `src/domain/derivation.ts`, `src/server/derivation.ts`, `db/010-email-lineage.sql`, `tests/derivation.test.ts`, `tests/derivation-db.test.ts`; modify `src/server/emails.ts` for checkpoint source version, get lineage and locale identity fencing.
Interfaces:`deriveEmail(tx,p,sourceRevisionId,{kind:'remix'|'locale',title,locale?}) -> {email,revision,lineage}`; `getEmail` includes optional lineage status; immutable source_doc_version attached to future checkpoints.
- [x] RED strict inputs/locale/direction/source unchanged and tenant lineage/FK/immutable permissions tests.
- [x] Implement typed derivation, additive migration and transaction-bound source copy + initial checkpoint; source-current classification uses stored source version, unknown stays unknown.
- [x] GREEN owned PostgreSQL tests prove copied spec/source unchanged, children separate revisions, CAS/replay/foreign scope/source drift, raw-mode provenance and locale-save denial.

### Task2: Authorized public contract and editor flow
Files:modify route/method matrix, API contract/generator examples, `src/ui/editor.tsx`; create `src/ui/derived-emails.tsx` and `scripts/smoke-derivation.ts`.
Interfaces:POST `/email-revisions/{id}/remix`, POST `/email-revisions/{id}/localize`; GET `/emails/{id}/derivatives` uses signed resource paging. Editor freezes acknowledged draft before deriving; current anchor guards navigation after command acknowledgment.
- [x] RED HTTP method/permission/idempotency/stale source/paging/SDK examples and actual Chromium missing controls.
- [x] Implement one shared transaction helper, validate bodies strictly, add generated OpenAPI/SDK operation types and explicit manual locale copy disclosure.
- [x] GREEN real HTTP/Chromium remix + locale flow, parent edit/restore stale status with child bytes unchanged, offline/repeated-click/lost-response and mobile/navigation tests.

### Task3: Whole-slice acceptance/checkpoint
- [x] Full tests/lint/typecheck/build/APIcheck and relevant existing local regressions.
- [x] One fresh reviewer, reproduce Important/Critical findings before one fix pass; document deferred Minors and unconfigured translation/template-catalog/media/client acceptance.
- [ ] Update capability/release/verification register, sync only tracked files to canonical Desktop, ordinary authorized checkpoint push, inspect CI. Preserve whole Baseline A and continue remaining modules.
