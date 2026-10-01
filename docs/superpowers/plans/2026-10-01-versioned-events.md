# Versioned Events and Webhook Contracts Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans natively; one fresh whole-slice reviewer, then one Important/Critical RED→GREEN pass without rereview.

**Goal:** Persist immutable typed event envelopes in the existing transactional outbox, expose permissioned recoverable event history, and implement exact-byte webhook signing/verification/retry contracts with real owned HTTP fixtures. Continue outbound endpoint/queue/rotation integration after this contract slice.
**Architecture:** Add optional versioned envelope columns to existing outbox rows, preserving legacy records as explicitly unversioned. New helper validates event-specific ID-only data, uses database times and aggregate versions, serializes once and binds payload hash/id/workspace. Runtime can advance publication metadata but cannot modify/delete a versioned event. Initial integrations emit only actual recipient unsubscribe/topic changes and import completion; generation/domain/campaign contracts remain unavailable until their authoritative flows exist. Session/API scope history, signed cursor pages and a truthful event UI support recovery. Webhooks sign timestamp + '.' + exact raw body; retry classification preserves event body/id with new delivery-time signatures. External targets remain unconfigured and no delivery is claimed.
**Tech stack:** Existing TypeScript/PostgreSQL/Zod/Node crypto/HTTP, Next/OpenAPI/SDK and owned Chromium fixtures. No paid account, external message or new dependency.
**Spec:** Original PRD REQ-047/050,TECH-061/070/071/072,TST-13; user-authorized full build. Full outbound queue, rotating encrypted endpoint secrets, HTTPS/SSRF transport and n8n recipe remain following work; no GA reduction.

## Global constraints

- Source event/body immutable; no inferred legacy provenance, fake generated emails/domain proofs/submission or delivery completion.
- IDs/counts only, strict typed data; no addresses, tokens, credentials, freeform errors or recipient dumps.
- Atomic outbox with authoritative mutation; repeated unchanged actions do not invent duplicate transition events. Aggregate consent/version semantics are explicit.
- Current Owner/Admin event history; bearer requires separate events:read grant and its issuer remains authorized. Cursor binds actor/workspace/resource/filter, bounded25/max100 pages.
- Signed receiver checks exact raw bytes, timestamp tolerance≤5minutes, event ID/version/workspace and signature key/version. Consumer dedupe must survive retry; never treat delivery signature alone as deduplication.
- 2xx acknowledgment,410 disable,408/429/5xx/transport retry, other4xx terminal. New timestamp/signature, unchanged body/eventID on every retry.
- No external endpoint activation or sensitive config; provider/account/production gates remain open. Opt-out never depends on webhook delivery.

## Review focus

- Tenant/role/scope/context cannot leak legacy arbitrary payloads; DB content/id/hash constraints and immutable update/delete trigger cannot alter signed history.
- Event emission failures roll back source mutation; stale consent and keyed replay produce authoritative versions and logical transition count.
- Invalid/expired/future/tampered signatures and body/envelope mismatch fail before acknowledgment; maximum body/header bounds and strict types.
- Event UI paging/offline/repeated clicks/workspace navigation preserve original data; signed recipe fixtures record real HTTP bytes, not a fabricated remote success.

### Task1: Typed event/outbox and signing contracts
Files:create `src/domain/events.ts`, `src/server/events.ts`, `src/server/webhook-protocol.ts`, `db/013-versioned-events.sql`, `db/014-event-topic-transitions.sql`, focused tests; modify authoritative existing preference/import producers.
Interfaces:`recordEvent(tx,workspace,{type,aggregate,data,trace_id?})`, `readEventBody(row)`; webhook signing/verification functions operate exact bounded bytes with explicitly passed secret and time; retry classifier is pure.
- [x] RED strict data, immutable bytes/hash, signature/time/retry and tenant/RLS/transaction tests.
- [x] Add nullable versioned columns without changing legacy data; protected immutable payload, strict typed emitter and actual transition producers.
- [x] GREEN owned PostgreSQL and real owned HTTP signed-byte/retry/dedupe fixtures.

### Task2: Authorized history vertical slice
Files:modify API methods/scopes/paging/generator/SDK/Settings; create event history UI and local smoke.
Interfaces:GET `/events` returns typed versioned envelopes with signed pages; optional GET `/events/{id}` returns one immutable envelope. No unversioned record is represented as schema1. Current management permission plus explicit bearer events:read scope.
- [x] RED HTTP/contract/scope/tenant/paging and actual Chromium missing surface.
- [x] Implement current-authority history and event-specific docs/contract examples; expose external delivery as unconfigured.
- [x] GREEN real HTTP/Chromium paging/offline/repeated clicks/mobile/workspace navigation and unchanged opt-out availability.

### Task3: Review/checkpoint and continue outbound integration
- [x] Full tests/lint/typecheck/build/APIcheck and affected import/preferences/key/contract regressions.
- [x] One fresh review/fix pass, capability/evidence register and deferred Minor log.
- [ ] Sync tracked hashes to Desktop, ordinary authorized source push and exact-head CI readback; then continue endpoint encryption/rotation, bounded durable outbound queue and signed n8n reference recipe.
