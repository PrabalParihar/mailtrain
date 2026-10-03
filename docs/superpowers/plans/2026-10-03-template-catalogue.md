# Frozen Template Catalogue Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. User explicitly directs disjoint parallel worker scopes; root owns shared integration and qualification. No worker spawns other workers or commits/pushes without controller instruction.

**Goal:** Save immutable workspace email revisions as templates and reuse them as separate drafts.
**Architecture:** Add metadata-only forced-RLS storage; reuse existing deriveEmail and signed collection paging. Actor-fenced UI retains original mutation receipts.
**Tech Stack:** Existing Next16.3.8, React19.3.0, TypeScript6, PostgreSQL, zod4, node:test, Playwright. No dependency additions.
**Spec:** docs/superpowers/specs/2026-10-03-template-catalogue-design.md

## Global Constraints

Names/titles trim to1..160 characters; hashes lowercase64hex; UUIDs lowercase. Signed paging default25/max100, active(default)/archived scope. Immutable source pins; archive only active1→archived2. Current Owner/Admin/Editor mutate with emails:write; Viewer reads with emails:read; Billing denied. Forced RLS/composite tenant foreign keys. All65/all13 remain binding. No provider/network/send/paid activation. Sourcebasec97cc49; canonical data/private files untouched.

## Review Focus

1. Authority changes before receipt replay deny access; no historical receipt restores revoked authority.
2. Concurrent archive/reuse serialize, preserving historical children without creating a new child after archive.
3. Source edits/raw/custom content and current removed assets do not silently rebind or bypass existing deriveEmail checks.
4. Lost responses and changed actor/workspace/navigation replay the original exact command, never a replacement body.
5. Empty/error/pagination/mobile states stay usable and expose no source body or provider success.

### Task 1: Domain and storage

Own db/036-email-templates.sql, src/domain/email-templates.ts, src/server/email-templates.ts, tests/email-templates.test.ts, tests/email-templates-db.test.ts.

Interfaces: strict SaveEmailTemplateInput, ArchiveEmailTemplateInput, RemixEmailTemplateInput; export EmailTemplateView. View includes id,name,state,version,source_revision_id,source_email_id,source_revision_no,source_doc_version,source_title,artifact_hash,brand_kit_version_id,locale,direction,editing_mode,created_at,archived_at. Service exports listEmailTemplates(req,tx,p), getEmailTemplate(tx,p,id) returning {template}, saveEmailTemplate(tx,p,input,key), archiveEmailTemplate(tx,p,id,input,key), remixEmailTemplate(tx,p,id,input,key). All mutations internally current-authorize then keyed; root never wraps them again. For shared paging type use cast only temporarily if root union update not landed; flag it before handoff.

- [ ] Write/run meaningful RED parser and restricted-DB tests proving immutable same-tenant binding, stalehash/CAS, current roles/revocation/key/workspace, successful same-key replay exactlyone child, archive/reuse serialization and raw/source/brand/asset preservation. Expected: absent feature failure, not skipped DB.
- [ ] Implement strict domain, additive migration and services using deriveEmail/resourcePage/current authority/idempotency conventions. No new source/spec copying or update/delete privileges on pins.
- [ ] Run node --import tsx --test tests/email-templates.test.ts tests/email-templates-db.test.ts. Expected: allpass/0skip. Record exact RED/GREEN commands and report self-review in own task report.

### Task 2: Actor-fenced UI and recovery

Own src/ui/email-templates.tsx, src/ui/template-recovery.ts, tests/template-recovery.test.ts. Root mounts only. Export EmailTemplatesPanel({workspace,actor,role}) and SaveEmailTemplate({workspace,actor,role,revisionId,artifactHash}); use EmailTemplateView from Task1. Recovery helper interface may be internal to owned files but must document exact original-command persistence/validation and return response validators in report.

- [ ] Write/run meaningful RED recovery tests for exact commands/keys, actor/workspace separation, storage denial/corruption/capacity, 401 retention, repeated-command identity and acknowledged clearing. Expected: absent behavior fails.
- [ ] Implement panel/editor save control with frozen metadata, loading/empty/errors/active/archived/paging, original-command retry and synchronous guards; no mutation for Viewer/Billing. Root wires app/editor.
- [ ] Run node --import tsx --test tests/template-recovery.test.ts and scoped ESLint. Expected: allpass/0skip/lint0. Record RED/GREEN commands and report self-review.

### Task 3: Root integration and qualification

Own src/server/email-template-route.ts; catch-all route; method/scope/pagination union; app/editor mounts; scripts/generate-api.ts and generated API/SDK files; scripts/smoke-email-templates.ts; public capability evidence. No media-harness edits here.

- [ ] Write/run route/method/scope RED tests; implement exact five method/routes under existing principal/response/error/idempotency conventions.
- [ ] Mount Template navigation and selected immutable revision save controls; generate checked API/SDK contracts with validating examples.
- [ ] Run actual owned HTTP/Chromium template journey and derivation regression, including lost responses, reload/input changes/two-click/context fences, role/empty/error/navigation/mobile.
- [ ] Run typecheck/lint/API/full configured suite/build; package each worker diff for independent task review, correct findings, then one independent whole-slice review and one correction wave/scoped verification if needed.
- [ ] Preserve original records/private metadata, qualify canonical sync, record exact evidence and remaining gates. Commit/push non-force under direct authorization; verify exact remote SHA and terminal CI. Retain failure history, no launch/provider claims.
