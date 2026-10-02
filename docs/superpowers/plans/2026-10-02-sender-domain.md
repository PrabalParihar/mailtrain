# Sender drafts and DNS evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Native implementation; ONE fresh whole-slice reviewer and ONE native Important/Critical RED→GREEN fix pass; defer Minors. No implementer delegation.

**Goal:** Preserve versioned provider-bound sender drafts and truthful bounded DNS observations while account/authentication/send readiness remains disabled.
**Architecture:** Strict domain contracts feed guarded tenant storage and managed routes. An owned resolver produces immutable evidence; a dedicated delivery panel preserves saved/working/command identity across interruptions.
**Tech Stack:** Existing Next16.3.8/React19.3/TS6/Zod4.6.5/PG17/Playwright1.63; node:dns/promises and node:url, no dependency installation.
**Spec:** docs/superpowers/specs/2026-10-02-sender-domain-design.md

## Global Constraints
- Full65requirements/13gates remain binding. No provider/account creation, credential capture, DNS write, message sends, paid resources or public activation.
- Mirror branch codex/mailcraft; preserve Desktop/private/PRD/unrelated work. Remote publication is blocked by auto-review despite supplied parent authorization; no more retry without trusted approval.
-100character name/account label/from name,254email,40region; up to40RRs each4096characters/32KiB combined;5second DNS deadline;10checks/minute/workspace;15minute display freshness; never send authorization.
- Owner/Admin manage boundary plus sender:read/sender:write keys, current authority after resource/key/receipt/DNS waits. Tenant-composite immutable version/check captures. Not-connected and sending_enabled=false enforced.
- Exact-domain TXT/SPF and _dmarc TXT discovery only; no guessed DKIM/ReturnPath, full protocol evaluation or aligned received-message claim.
- Meaningful RED→GREEN/full checks and actual Chromium interruption/mobile/empty/error/storage/navigation; no provider setup prompt repetition.

## Review Focus
- Domain/address IDNA/control/IP/private/reserved inputs; split/multiple/oversize records and resolver timeout/cancellation must refuse honestly.
- Provider/account/region/from/reply-to changes must advance version and not inherit old DNS/history readiness; forged direct writes/cross-tenant references denied.
- Post-wait current role/scopes/session expiry and exact receipt replay must never disclose sender data or duplicate queries after denial.
- Unapplied invalid text/base and original exact pending command must survive reload/lost acknowledgment without accidental base advance.
- Initial/empty/error pages, repeated clicks, explicit older source, changed workspace/role and quota fallback must remain correct and usable at390px.

### Task1: strict sender and observed-DNS contracts
**Files:** src/domain/sender-domain.ts; tests/sender-domain.test.ts.
**Interfaces:** SenderDraftInput/VersionInput; normalizeSender(input):CanonicalSender; DNSObservation; summarizeTXT(records,purpose):status/records. No secret/readiness injection.
- [ ] Write focused tests: IDNA domain/from normalization, invalid controls/URL/IP/single-label, provider/region/account/reply-to bounds; schema rejects connection/readiness/private unknowns; split TXT concatenation and duplicate SPF; all limits/unavailable statuses.
- [ ] Run node --import tsx --test tests/sender-domain.test.ts and observe missing-module RED.
- [ ] Implement strict schemas/functions with exact spec bounds and literal disabled connection state.
- [ ] Run focused/full/lint/typecheck; commit only green Task1.

### Task2: tenant version/check storage
**Files:** db/030-sender-domain.sql; tests/sender-domain-db.test.ts.
**Interfaces:** sender_identities+sender_identity_versions+domain_checks composite workspace keys; strict snapshot and DNS evidence JSON; version guard/direct disabled readiness/history immutability.
- [ ] Write isolated PG tests for required tables, next-version/no-op, cross-tenant FK/RLS, direct readiness/old-source forgery, immutable history/check edits and rollback.
- [ ] Run test and observe actual missing table/guard RED.
- [ ] Implement additive migration with no invented historical proof, guarded manager version capture and runtime historic revoke; preserve trusted synthetic cleanup.
- [ ] Run PG/focused/full/typecheck; commit green.

### Task3: bounded isolated DNS observer
**Files:** src/server/sender-dns.ts; tests/sender-dns.test.ts.
**Interfaces:** observeSenderDNS(domain,resolver factory?):Promise<DNSObservation>; own Resolver per call; fixed owner queries, timeout/cancel and safe errors.
- [ ] Inject resolver test port to prove split TXT, NXDOMAIN, timeout cancellation, simultaneous independent calls, oversize refusal, reserved/private no-query and exact-domain-only semantics.
- [ ] Observe missing observer RED, implement no HTTP/provider/DNS mutations; focused/full/typecheck and commit green.

### Task4: managed HTTP, paging and API contracts
**Files:** src/server/sender-domain-route.ts; src/app/v1/[...path]/route.ts; src/server/http.ts; src/domain/api-keys.ts; scripts/generate-api.ts; generated public/sdk; scripts/smoke-sender-domain.ts; tests/sender-domain-contract.test.ts.
**Interfaces:** GET/POST /sender-identities; GET detail/history/checks; POST versions/dns-checks expected_version. Strict projections and signed pages; sender scopes; current authority and exact original receipts;10checks/minute excludes replay.
- [ ] Write route/schema/method tests and actual owned HTTP missing routes RED, role/key/tenant/CAS/no-op/replay/redaction/current expiry probes.
- [ ] Implement using existing principal/keyed/pagination/audit and Task1-3 interfaces; actual DNS receipt permanently disabled readiness; fail-safe cancellation/errors retained as observations; honest reserved DNS fixture.
- [ ] Generate/check strict API/examples; apply030 only owned development DB; actual HTTP/full/lint/typecheck/build green and commit.

### Task5: delivery panel and actual browser recovery
**Files:** src/ui/sender-domain.tsx; src/ui/sender-form-recovery.ts; src/ui/app.tsx; scripts/sender-domain-browser.ts; tests/sender-form-recovery.test.ts; package.json/CI existing smoke command.
**Interfaces:** workspace+identity scoped recovery original base/body/key and current observation; roles managed only; paged reads/detail/version/check commands from Task4.
- [ ] Actual absent controls/empty recovery RED; pure schema roundtrip/full max escaped text, exact pending source/path/version; Chromiuminvalid/reload/lostack/repeated/staleCAS/role403/workspace delay/quotaguard/390px initialerror/historypaging.
- [ ] Implement dedicated controller/panel, honest unavailable provider and explicit read-only DNS guidance; do not enable existing send route or alter campaign approvals.
- [ ] Full+actual browser+affected audience/campaign/export checks; inspect pixels, commit green.

### Task6: ONE review, evidence and local closeout
**Files:** current-plan private ledger and public checkpoint/registers/plan.
- [ ] ONE immutable whole-slice reviewer, grade concrete effects, fix Important/Critical in ONE native RED→GREEN pass, defer Minors and rule every declined judgment.
- [ ] Full/actual final checks, preserve every ruling/task/deferred public; canonical clean/hash/collision FF/actual browser if authorized local scope. No remote retry without trusted approval. If publication remains blocked mark it explicitly, retain current private workspace until complete; all65/13gates remain open.
