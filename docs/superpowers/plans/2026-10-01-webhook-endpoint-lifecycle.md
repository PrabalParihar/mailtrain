# Webhook Endpoint Lifecycle Checkpoint Plan
Use superpowers:executing-plans inline. This concrete checkpoint covers Task1/2 of the outbound webhook plan: encryption/rotation/HTTPS/retry contracts, PostgreSQL endpoint lifecycle, scoped API/SDK and actual UI failure/recovery. One fresh complete-slice reviewer, one Critical/Important RED→GREEN pass, no rereview. Full durable queue and reference consumer remain the next slice; no full-GA requirement is removed.
Spec: original REQ-047/050,TECH-061/070/071/072/090,TST-13; docs/superpowers/plans/2026-10-01-outbound-webhooks.md.
Review focus:
- One-time signing secret never persists in plaintext, replay/audit/browser storage or screenshots; AEAD binds tenant/endpoint/secret and wrapping version; unavailable/corrupt inventory fails closed.
- API scopes/current role/tenant and encoded routes; replay skips unavailable DNS/keys but returns current endpoint state without secret; permissions revalidate after remote DNS outside DB transactions.
- SQL forced RLS/immutable identities/current and previous key transition/CAS/explicit cutover acknowledgment; max10 active/paused endpoints and32 opaque unresolved tab receipts without eviction.
- HTTPS443-only/mixed/private/reserved DNS rejection, bounded/cancellable resolution, exact TLS peer pin before payload, no redirect/cookies, strict certificate checks, bounded body/headers and10s absolute deadline.
- Actual HTTP and Chromium empty/unconfigured/configured/offline/lost response+reload/repeated clicks/one-time reveal/dismiss/mobile/workspace interruption; no external HTTP or production conformance claim.
- Prior timestamp-canonicalization Minor remains documented/deferred; do not treat configured development fixtures as owner production secret/account setup.
Validation:68 full tests,lint/typecheck/build/APIcheck70; exact green status recorded after latest fixture regression. Checkpoint publication follows fresh review, then durable queue work continues.
Ruling: split network-authority and queue integration into separately reviewed vertical checkpoints — the durable worker depends on the endpoint/key authority contract; each checkpoint retains the whole full-GA baseline — cost if wrong: a queue-slice review must also inspect integration with this checkpoint before any activation.
