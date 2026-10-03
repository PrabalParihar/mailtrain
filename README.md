# Lettercape

On-brand emails, ready for review. Full GA baseline is retained from the Mailcraft development PRD. This repository contains a working development milestone, not a public production launch.

## Local development

Node 24 and Docker are required. Ports bind only to loopback.

```sh
npm ci
docker compose up -d
cp .env.example .env.local
# Set LOCAL_BOOTSTRAP_SECRET and PREFERENCE_SIGNING_SECRET privately to random 32-byte values.
npm run db:migrate
npm run dev
# In another terminal:
npm run worker
```

Open http://127.0.0.1:3000/app. Use the private local key in `.env.local`. The initial owner is explicitly a local development identity; local bootstrap is disabled in production. Configure Clerk to test real identity flows. Do not copy the sample local DB passwords into production.

Supported local flows: brand version confirmation; durable typed block editing; CAS save/conflict/recovery; immutable checkpoint/history restore; raw HTML sanitization; browser simulations; frozen HTML/plaintext/PNG/PDF download; provider-gated structured AI proposals; fixture CSV dry-run/import/hold/suppression; draft campaign intent/review/cancel; honest integration status and local audit/usage views; existing-member role/removal/ownership controls with recoverable confirmations and seat-impact history. Invitations and approved seat capacity still require implementation/configuration.

AI is not active until a model, server-only API key and finite approved `AI_GENERATION_ALLOWANCE` are configured. Default allowance is zero. No success is simulated. Browser render exports have remote networking disabled and do not count as real-client evidence.

## Verification

```sh
npm test
npm run lint
npm run typecheck
npm run build
# With the local dev server running:
npm run smoke:api
npm run release:check
```

Database tests require the isolated local PostgreSQL service. Release check intentionally fails while required evidence is pending. `docs/CAPABILITIES.md` and `docs/RELEASE.md` retain gaps instead of redefining GA scope.

## Deployment preparation

Selected repository: https://github.com/PrabalParihar/mailtrain. Selected Railway workspace: `43361b3a-6543-4993-92bc-42fe2457f1c3`. Do not substitute another workspace. Exact workspace access and spending approval are required before provisioning. `lettercape.com` is selected but not owned/configured by this build; the user intends to buy it.

Production requires a non-owner/NOBYPASSRLS runtime DB role separate from migrations, TLS, vaulted/KMS-encrypted secrets and isolated workers/storage. The local creation worker is a development runner; BullMQ fairness/leases/recovery, production rendering, telemetry and service accounts remain work. The NestJS transport extraction is a tracked architecture delta from the proposed stack.

The public repository excludes the user's authoritative MD/DOCX PRD and all local secrets/browser session artifacts. Both authoritative files are kept in the local Desktop project's docs directory for continuing implementation.


Klaviyo destination preparation is development behavior: structured frozen revisions map their canonical unsubscribe slot to the native Klaviyo URL tag for locally reviewed HTML/plaintext downloads. Raw/custom HTML, unresolved tokens, private/registered images, incomplete footer or mismatched compiler/source refuse this mapping. Remote exports remain disabled. The server-only create/readback primitive is tested with fixtures, requires submission/remote-ID durability callbacks and never retries a create; OAuth, encrypted connection grants, durable remote jobs, account/native test-send and all five ESP conformance remain required. `npm run smoke:klaviyo-export` runs the owned local HTTP/Chromium fixture. See [Klaviyo checkpoint](docs/KLAVIYO-EXPORT-CHECKPOINT.md).

Mailchimp development preparation adds a selected Classic HTML destination, native footer mapping, integrity-bound HTML/plaintext downloads and an unmounted conservative create/metadata-readback primitive. Both local destination browser flows pass;556/556 configured native tests and API122/lint/type/build pass. Initial candidate qualification precedes the completed whole-review correction recorded below. OAuth, Standard+ account eligibility, durable product export jobs, actual client/native content fidelity and management links remain open. REQ040 remains Partial;43partial/17undelivered/5roadmap, all65/all13, zero whole accepted. See [Mailchimp checkpoint](docs/MAILCHIMP-EXPORT-CHECKPOINT.md).

One immutable Mailchimp whole review found0Critical/0Important/1Minor. ONE complete correction and ONE scoped re-review closes M1; corrected556/556tests/0skip,API122/lint/type/build, actual Mailchimp6+Klaviyo4 HTTP/Chromium and Linux closed-startup checks pass. Canonical preservation/sync qualification follows. Local preparations and unmounted transports do not establish actual adapters/OAuth/eligible accounts/durable jobs/native fidelity/management links; all65/all13 and zero whole accepted remain. See docs/MAILCHIMP-EXPORT-CHECKPOINT.md.
