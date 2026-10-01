# Recipient preferences and double opt-in Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for native implementation and one fresh whole-slice reviewer.

**Goal:** Implement REQ-030/TECH-050–052 signed topic/frequency preferences, confirmed opt-in proof and the shared frequency reservation boundary.

**Architecture:** Lists are marketing topics. PostgreSQL stores per-topic consent and expiring confirmation requests under forced tenant RLS. Public signed pages make GET read-only and explicit POST mutations; confirmation-token issuance is server-internal and never exposed by the preferences response. Delivery remains unconfigured and is clearly disclosed. All reservations and preference mutations lock the contact row.

**Tech Stack:** Existing Next.js, PostgreSQL, Zod, JOSE and Playwright; no new dependencies.

**Spec:** `/Users/prabalpratapsingh/Documents/Codex/2026-10-01/task/inputs/Mailcraft-Development-PRD-v2.0.md` REQ-030, TECH-050–052, JRN-08, TST-04/10/11.

## Global Constraints

- Full GA baseline and every release gate remain required.
- No real email or paid provider operation; no fabricated delivery/confirmation.
- GET never changes permission; global opt-out remains obvious and idempotent.
- Verified deliberate re-opt-in may clear only unsubscribe/import-unsubscribe; manual, complaint, bounce and provider suppressions persist.
- Daily/weekly/monthly mean one per rolling UTC 24 hours/7 days/30 days. Weekly is the conservative initial cap.

## Review Focus

- A stale confirmation after an unsubscribe must not reactivate consent.
- A scanner visiting either signed GET must not mutate anything.
- Repeated and concurrent confirmation POSTs must create one proof.
- A foreign topic or confirmation request must never cross tenant boundaries.
- Concurrent campaigns and uncertain submissions must share the contact cap.

### Task 1: Consent and cap vertical slice

**Files:** Create `db/005-recipient-preferences.sql`, `src/domain/preferences.ts`, `src/server/opt-in.ts`, `src/server/frequency.ts`, `scripts/smoke-preferences.ts`, `tests/preferences.test.ts`; modify `src/server/preferences.ts`, signed preference page/routes, CI and package scripts.

**Interfaces:** `readPreference(token)` returns minimal brand, cap/version and topic statuses; `savePreference(token,input)` preserves current grants unless explicit opt-out or verified confirmation; `issueConfirmationToken(workspace,request)` is private delivery-boundary code, not a public endpoint; `confirmOptIn(token)` consumes proof once; `reserveFrequency(tx,workspace,contact,topic,delivery)` reserves only eligible permission under the shared contact lock.

- [x] Write failing domain and actual HTTP/DB tests for exact cap durations, invalid/foreign topics, GET non-mutation, opt-out persistence, expired/stale/duplicate proofs and concurrent reservations.
- [x] Run RED, implement migration and services with CAS, append-only evidence, no provider delivery claims, then run GREEN.
- [x] Build accessible signed preference and confirmation forms with explicit pending/unconfigured delivery, global re-opt-in confirmation, errors, and no contact address disclosure. POST forms require same-origin; RFC8058 remains login-free and does not redirect.
- [x] Exercise actual Chromium repeated clicks, offline response, expired/stale token, global unsubscribe and mobile width. Inspect screenshot pixels.
- [x] Fresh whole-slice review, fix Important/Critical once with regressions, run tests/lint/typecheck/build/HTTP, update capability/release evidence, preserve Desktop source, ordinary push only after current approval block is resolved.

Provider confirmation delivery, received DKIM/RFC8058 message verification, production load/security/legal evidence and topic-aware campaign dispatch remain separate full-GA gates.
