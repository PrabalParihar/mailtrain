# Klaviyo Destination Export Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inspect/download a real frozen Klaviyo preparation and implement create/readback transport without enabling unqualified remote effects.
**Architecture:** Pure destination compiler, authenticated current-authority review/download, lifecycle-fenced editor panel and server-only create/readback transport. Existing provider-not-ready remote route remains authoritative.
**Tech Stack:** Existing Next16/React19/TypeScript/Zod/Postgres/Playwright; no new dependencies.
**Spec:** docs/superpowers/specs/2026-10-02-klaviyo-export-design.md

## Global Constraints

Full65/all13/zero accepted. No provider calls, campaigns, paid spending or remote push. Exact immutable sources remain unchanged. CURRENT emails:export/edit authority applies to review/download. No secrets or recipient data in UI/diagnostics. API revision2026-07-15, fixed https://a.klaviyo.com, templates only. No automatic POST retries; durable submission marker before IO and remote-ID persistence before readback. Native mapping only UNSUBSCRIBE_URL; raw/custom/private assets/unresolved tokens block.

## Review Focus

- Authenticated current identity changes during download: stale result must not be adopted.
- POST accepted and acknowledgement lost: unknown outcome must not trigger retry.
- Provider201 partial/malformed schema: cannot claim verified creation.
- Literal/opaque template content: blocked rather than blind native rewriting.
- Saved revision corruption: integrity refusal before preparing or transmitting.

### Task1: Destination compiler
**Files:** src/domain/esp-export.ts; tests/esp-export.test.ts.
**Interfaces:** compileKlaviyoArtifact(revision:FrozenExportRevision):KlaviyoArtifact; strict review/input contract and content hashes.
- [ ] Write/run RED tests for source integrity,exactslotmapping,emptyfooter,unknown tokens,raw/custom/privateassets/source preservation.
- [ ] Implement bounded immutable compiler and explicit preparation gates; run GREEN and commit.

### Task2: Transport and reconciliation contract
**Files:** src/server/klaviyo-template-adapter.ts; tests/klaviyo-template-adapter.test.ts.
**Interfaces:** createAndVerifyKlaviyoTemplate(options) with required markSubmission/persistRemoteId callbacks; returns verified|needs_attention|outcome_unknown plus sanitized code/knownID/resourceURL. Consume Task1 artifact.
- [ ] Write/run RED for callback ordering,unknown accepted outcome,noPOSTretry,4xx/429/5xx,knownID mismatch,oversize/foreignlink/cancellation.
- [ ] Implement fixed-origin redirect-refusing bounded request/readback; run GREEN and commit.

### Task3: Authenticated destination review and editor
**Files:** src/server/esp-export-review.ts; src/app/v1/[...path]/route.ts; src/server/http.ts;src/server/api-keys.ts;src/ui/klaviyo-export.tsx;src/ui/editor.tsx;scripts/generate-api.ts;generated publicAPI/SDK;tests/esp-export-route.test.ts.
**Interfaces:** GET /v1/email-revisions/{id}/destination-review?destination=klaviyo;GET destination-artifact?destination=klaviyo&format=html|txt. Consume Task1, exact current emails:export/edit authority, strict query/read envelope. Mount keyed current actor/email frozen revision panel in existing export section.
- [ ] Write/run RED route/method/scope tests; implement current authority/integrity/validated download.
- [ ] Implement lifecycle and synchronous-click fencing with truthful readiness, empty/error/readonly states.
- [ ] Document schemas/operations; regenerate API/SDK;run focused tests/typecheck/API and commit.

### Task4: Qualification and closeout
**Files:** scripts/smoke-klaviyo-export.ts;docs/KLAVIYO-EXPORT-CHECKPOINT.md;README/package/CI/tracker docs.
- [ ] Run actual owned HTTP/Chromium freeze/review/download/repeated clicks/stale navigation/mobile/Viewer scenarios; no external requests.
- [ ] Run lint,type,API,build and configured relevant suites; preserve failed attempts explicitly.
- [ ] Freeze immutable diff for one final independent review, fix confirmed findings once with covering checks, record all rulings/costs.
- [ ] Sync clean Desktop locally,preserve original draft/revision/private metadata and restore running app; no provider or whole-GA acceptance.
