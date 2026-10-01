# Outbound Webhook Endpoint and Queue Implementation Plan

Use superpowers:executing-plans inline; one fresh complete-slice reviewer and one Critical/Important RED→GREEN pass. Original full Baseline A remains binding.

Goal: implement recoverable encrypted webhook endpoint lifecycle and bounded durable delivery attempts, with HTTPS/SSRF transport and a persistent-dedupe reference consumer. Do not activate external targets or claim production conformance without private service keys, authorization and release evidence.
Spec: REQ-047/050, TECH-061/070/071/072/090, TST-13. Existing immutable schema1 outbox is the source; legacy/future unimplemented events stay excluded.

Global constraints:
- Private versioned AES256-GCM wrapping key; tenant/endpoint/secret-version AAD. One-time endpoint HMAC secret disclosure outside replay receipts. Current/previous signing key rotation overlap explicit, bounded and time-limited. Production KMS/service identity/rotation evidence remain required.
- HTTPS443 only, no credentials/fragments, public DNS answers only; re-resolve and pin each connection, TLS host verification, no redirect/cookies, bounded request/response/header bytes and10s absolute deadline. URL queries stay out of audit/analytics/error records.
- Current Owner/Admin plus distinct webhooks:read/write scopes. SQL RLS and current issuer/service rechecks; create disabled/paused, current CAS lifecycle, fixed replay identity. No subscription accepts reserved unsupported event types.
- PostgreSQL owns endpoint/event logical delivery, next-at, leases, immutable attempts and24h retry deadline. Unique endpoint/event, exact persisted body/eventID, fresh delivery-time signature and attempt secret-version evidence. Redis/BullMQ wakeups are rebuildable hints.
- Finite per-workspace backlog/admission/concurrency and round-robin fairness; reserve capacity for consent/event processing. 2xx acknowledged;410 disables;408/5xx/transport retry;429 Retry-After deferral does not spend failure attempt. Others terminal. No raw response body/error credential dump. DLQ replay keeps event/logical key and current safety checks.
- Webhook at-least-once may duplicate/reorder; persistent consumer dedupe by consumer/event UUID, not timestamp. Delivery acknowledgment does not prove email delivery. Worker absent/disabled is shown truthfully.
- No new paid account or external messages; fixtures use only owned local services/synthetic public DNS validation. Provider/production egress fixtures need authorized accounts and remain separate.

Task1 — encrypted key and transport contracts:
RED tests for strict key envelope/AAD/cross-tenant/tamper/rotation expiry, private/mixed DNS/redirect/timeout/body limits and retry budget semantics. GREEN encryption/domain/transport helpers with private config fail-closed; focused tests and owned TLS fixture where transport can be safely exercised without a runtime SSRF bypass.

Task2 — endpoint lifecycle vertical slice:
Add forced-RLS endpoint/signing-key tables and immutable version/audit/one-time response guards. Implement scoped API/create/read/rotate/pause/CAS and typed OpenAPI/SDK. UI displays actual configuration/paused state and one-time reveal; lost responses never duplicate endpoint and never pretend secret was recovered. Real HTTP/Chromium role/scope/tenant/repeat/offline/mobile/navigation tests.

Task3 — durable queue and reference consumer:
Add unique delivery/append-only attempts, bounded fair admission, leases/recovery, endpoint/status/key-authority recheck and separate narrow service role. Bind fixed source body/hash; simulate actual owned HTTP2xx/429/410/timeout/reorder/rotation/retry, durable receiver dedupe/restart and Redis-loss rebuild. Actual external transport stays off until explicit target/service setup. Publish n8n reference flow only with tested raw-byte verification and persistent idempotent transaction contract.

Task4 — validation and checkpoint:
Full tests/lint/typecheck/build/API check and consent/key/event regression journeys. One fresh reviewer; Important/Critical one fix pass, Minor recorded. Preserve all GA gates; canonical hash synchronization, ordinary authorized source checkpoint/CI, then continue remaining full-PRD modules.

Ruling:24h overlap is a proposed development rotation policy, not an approved production retention/rotation policy; version and bound it, keep both valid key identities in attempt evidence, and require production owner/KMS acceptance before activation. Cost if wrong: new policy/version migration and consumer cutover.
