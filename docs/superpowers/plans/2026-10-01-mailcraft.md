# Mailcraft Implementation Plan

**Goal:** Build the complete Baseline A from the development PRD, with truthful production release evidence.
**Architecture:** Next.js App Router UI with server domain modules and isolated durable workers. PostgreSQL owns tenant data, CAS drafts, immutable revisions, jobs, usage and outbox. API route transport is initially Next.js; extracting the transport to NestJS/Fastify is tracked as ADR-01 implementation work, not silently claimed complete.
**Tech stack:** TypeScript, Next.js, React, PostgreSQL, Drizzle, Redis/BullMQ, Clerk, React Email, Zod.
**Spec:** `docs/Mailcraft-Development-PRD-v2.0.md` (authoritative Library copy).
**Execution:** Native implementation in this session, already authorized by the user. No scope reduction. No public claims, external sending, procurement, provider use or paid commitments without their applicable gates.

## Global constraints

- All original P0 capabilities remain full-GA obligations.
- Every tenant resource checks current membership; runtime DB role cannot bypass forced RLS.
- AI produces proposals, generation never dispatches; provider success needs actual evidence.
- Same complete render manifest gives identical artifact hash.
- Draft writes require If-Match. Missing real-client evidence remains incomplete.
- No legal, billing, trademark, recipient or infrastructure commitments inferred from the PRD.

## Review focus

- Concurrent saves, repeated clicks and interruption preserve acknowledged work and reject stale writes.
- URL redirects and IPv6/private DNS answers cannot reach private networks.
- Billing role and cross-tenant IDs cannot disclose content or recipient data.
- Imports never clear suppressions or invent opt-in; GET preferences never unsubscribe.
- Late generation/exports cannot overwrite new drafts or blindly retry uncertain external writes.

## Sequenced tasks and evidence

1. **Foundations (REQ-001–008,057):** schema, runtime role/RLS, local authenticated session with no production fallback, Clerk boundary, capability policies, brand kit lineage/provenance, append-only audit. Tests: RLS/no-context, cross-tenant foreign keys, permission matrix, session origin.
2. **Artifact contracts (REQ-013–017,019,023,063):** strict JSON schema, ten typed block kinds, deterministic React Email compiler, raw mode sanitizer, revision checkpoint, ETag/CAS, voice guard. Tests: executable payloads, limits, escaping, deterministic bytes, stale writes and history restore.
3. **Brand/generation (REQ-006–012,020–021,025–026):** pinned public fetch gateway, extraction review; configured AI structured proposals; durable operation/idempotency/budget/cancellation; series/remix/import/media/locale adapters. Test refusal, truncation, injection, stale base version, URL/DNS attacks. Real model evaluation needs funded provider access and 50 briefs.
4. **Editor/export (REQ-015–024,040–041):** keyboard outline, raw checkpoint, autosave ≤5 sec, conflict/fork/reload, history, sandbox simulation, lint, frozen HTML/PNG/PDF, five explicit ESP capability adapters and uncertain export state. Real client procurement and authenticated ESP conformance are required before completion claims.
5. **Identity/team (REQ-001–005,018):** Clerk configuration, verified invites, entitlement seats, revocation, MFA, scoped service keys, Yjs collaboration. Verify two sessions converge and revocation disconnects; SSO remains gated by account contract.
6. **Audience/delivery (REQ-027–038,042–044,050):** CSV mapping/dry run, contacts/consent/suppression/preferences, typed segments, digest-bound review, scheduling, four providers, recipient ledger/authorization fence, signatures/analytics. Tests: suppression races, unknown acceptance, duplicate/out-of-order events, DST and empty audience.
7. **Billing/developer (REQ-045,047–054):** scoped API, OpenAPI/SDK, HMAC webhooks, signed Stripe state, immutable meters/reservations/caps. Prices, trial/refunds, paid overages are decisions, not assumed approvals.
8. **Operations/public (REQ-055–065):** honest docs/status/legal drafts, retention manifest, infrastructure, CI, load, restoration, accessibility, independent pentest, 10 partner workspaces, security/legal/ops signoff. P1/P2 work remains explicitly planned.

For each task: add behavioral tests; demonstrate missing behavior; implement; run full relevant checks; retain evidence and update capability register. Update: the user later authorized ordinary commits/push to the selected empty GitHub repository; never force-push or overwrite history. Public deployment waits for exact destination/costs and GATE-01–13 evidence. Preserve unrelated Desktop files.
