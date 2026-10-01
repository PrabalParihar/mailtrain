# Development verification — 2026-10-01

This is a tested development milestone. It does not close GA release gates.

- 19 compiler, permission, tenant DB, CAS, idempotency, method/body limit, brand pin, audit ordering and preference tests pass (`npm test`). Actual PostgreSQL runtime has no RLS bypass and cannot read authentication sessions or change migration stamps.
- 12 real HTTP smoke groups pass (`npm run smoke:api`), including repeated create replay/mismatch, acknowledged save and stale 412, origin/tenant denial, role denial, Viewer preview, all four immutable-hash downloads, honest unconfigured AI with no meter debit, CSV errors/held consent/persistent suppression, non-mutating preference GET/repeated one-click POST and disabled send/approval.
- ESLint, TypeScript and Next production build pass. Build includes preference and API routes.
- Actual headed Chromium journeys: dashboard zero state; manual fixture brand confirmation; provider-unavailable generation with retained brief; blank draft; edit/save/reload; offline edit/reconnect/save/reload; frozen HTML/TXT/PNG/PDF download. PNG pixels inspected. Browser simulations block remote image/network access and are not real email-client captures.
- Local evidence files (ignored in public Git): `output/playwright/lettercape-dashboard.png`, `lettercape-editor.png`, `export.html`, `export.txt`, `export.png`, `export.pdf`.
- Negative production startup test exits 1 with incomplete release evidence. Release register remains blocked. No Railway resource or deployment was created.

No AI response, provider acceptance, remote ESP creation, billing success, production uptime, security certification, partner adoption or public launch is claimed. Remote CI for source commit 2e06f915ef022cb04f600e65945b009ac3354035 passed: https://github.com/PrabalParihar/mailtrain/actions/runs/36841063917. It ran fresh npm ci, migrations, 19 tests, lint, typecheck, production build, Linux Chromium HTTP checks and the closed-production gate. Docker image execution remains unverified.

Remaining architecture: Next transport instead of proposed NestJS/Fastify, durable local polling worker instead of complete fair BullMQ system, no immutable processed media/real-client provider/complete adapter suite. The 65-row capability register remains authoritative for outstanding implementation and acceptance work.

Fresh checkpoint review found six important defects. Fixes preserve command identity after lost responses, scope worker authority to the target active workspace, lock cancellation transitions and retain in-flight allowance, preserve supplied brand-pinned copies, discard prior-workspace reads/state, and bind editor transitions/proposals/frozen artifacts to the originating local epoch and acknowledged snapshot.
Regression evidence: worker/key/cancellation/brand/workspace/raw-response defects demonstrated failing before the fixes. Browser checks then passed raw snapshot compilation, destructive input fencing, stale freeze/report rejection and same-route Owner-to-Billing isolation. Stale AI proposal handling passed with a controlled test fixture, not a live AI response. Screenshots `lettercape-reviewed-editor.png`, `lettercape-reviewed-preview.png`, `lettercape-workspace-isolation.png` remain local.

Canonical Desktop/mail production build also passes. Chromium 390×844 navigation to Brand passed without horizontal overflow; final Owner dashboard verified after removing the temporary Billing test workspace. Local screenshots: `lettercape-mobile-brand.png` and `lettercape-final-dashboard.png`.
