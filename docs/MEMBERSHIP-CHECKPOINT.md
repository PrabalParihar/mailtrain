# Existing-member lifecycle development checkpoint

Source review: f0a4c869..4d538502, exactly one fresh Astra high reviewer; no rereview. One Important and one Minor; no Critical. The Important policy-rejection receipt dead end was independently reproduced in Chromium, then reproduced natively in a failing unit and failing browser regression. Narrow verified transaction rejections now release rejected receipts, while network/authentication/MFA/locked-workspace/5xx uncertainty retains original identity. Unit4/4 and full108/108 pass; API85,lint0,typecheck/build and owned HTTP/Chromium pass. Authority/key/contract regressions passed. Authorized source publication is verified at8d61ffe5dcb92d9e9c9b5bf836906efa64fd4553;277canonical tracked SHA256 matches and actual canonical HTTP/Chromium pass. Exact-head CI36937005736 passed app and dedicated sandboxed renderer jobs; this is source publication, not a public production launch.

Implemented: existing-member role/removal/atomic Owner transfer; final Owner/version/CAS/tenant protection; narrow NOLOGIN mutation authority; forced-RLS immutable local seat-impact journal; delegated key revocation, queued cancellation/one-time release and running cancellation requests; session-only typed API/pages; strict recent two-factor production policy and explicit local-development bypass; confirmations, original-command recovery, current seats and history. Invitations, approved capacity, production provider MFA, collaboration and Stripe acceptance remain required.

## Rulings made

- Existing-member lifecycle is delivered separately from invitations, approved capacity, provider MFA and collaboration. Full GA scope is retained; if wrong, those remaining modules still block release.
- Explicit transfer makes the initiating Owner an Admin; leaving is a separate action. If a different approved UX is required, the transfer contract needs a versioned change before GA.
- Positive editing-seat quantities fail closed until capacity is approved; local journal counts are not Stripe reconciliation. If wrong, entitlement/catalog/billing acceptance remains unresolved.
- Global creation-worker fixture tests share a test-only advisory semaphore. Production selectors are unchanged; if wrong, production concurrency/load drills still remain required.
- Both Clerk factor ages must be nonnegative and strictly below ten minutes; has() first-factor fallback is not accepted. If wrong, configured account/MFA acceptance must resolve it before production.
- Actor-bound tab receipts retain original input across uncertain outcomes. The reviewed CAS-only reconciliation decision was replaced by narrow transactional no-effect rejection reconciliation, proved by RED→GREEN unit and Chromium tests. If wrong, future routes must preserve lookup-before-policy ordering; lost storage or self-revocation requires current Owner journal reconciliation.
- Confirmed self-demotion/removal hides team data and reloads workspace authority. Already released provider context cannot be recalled; if wrong, production session/collaboration revocation acceptance remains required.
- Configured Clerk MFA, impersonation, recovery and production revocation latency remain unassessed. Development factor-age rules do not certify identity; if wrong, the production identity gate stays blocked.
- Invitations, capacity/catalog, pricing and Stripe reconciliation remain required. No grants or paid success are invented; if wrong, full REQ004/051 acceptance stays blocked.
- Collaboration disconnect and global identity revocation remain unimplemented acceptance. Workspace-local admission is the current boundary; if wrong, production revocation remains blocked.
- Production migration/grants, load/deadlock endurance and recovery drills remain required. Local PostgreSQL tests cannot certify deployed policy; if wrong, operations/security gates stay blocked.
- Live provider cancellation/accounting, spending and production worker isolation remain unverified. Queued cancellation is proved, running work is only cancellation-requested; if wrong, provider/worker/economics gates stay blocked.
- Full accessibility, assistive technology, real device/cross-browser and production frontend recovery remain required. Owned Chromium/mobile pixels are scoped evidence; if wrong, experience acceptance stays blocked.
- Canonical synchronization, authorized source publication and exact-head CI are executable follow-up gates; independent security assessment remains separate. If wrong, no source/public launch success may be claimed.
- All65requirements and13GA gates remain binding and unclosed. If wrong, launch must still wait for actual accepted evidence and accountable signoff.

## Deferred minor

The recovery dialog computes seat impact from the reloaded current member role; after a lost acknowledgment this can differ from the original command's impact. It is a read-only confirmation disclosure; authoritative returned journal quantities remain correct. Deferred explicitly, along with previously recorded Minors from earlier slices.

No production deployment, external provider request, email/campaign, account change, resource provisioning or paid commitment occurred. All13production gates remain open.
