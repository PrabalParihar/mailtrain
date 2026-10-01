# Full GA capability register

No reduced GA baseline is approved. Partial local behavior does not satisfy the full requirement or its production-like acceptance evidence. Source PRD remains authoritative in the local docs directory.

| ID | Capability | State | Evidence / remaining work |
|---|---|---|---|
| REQ-001 | 5.1 Email/password, Google sign in and magic link | Partial / development | Local session + configurable Clerk; real identity flows unverified |
| REQ-002 | 5.1 Workspaces and memberships | Partial / development | Membership + forced RLS negative tests; full surface matrix pending |
| REQ-003 | 5.1 Owner, Admin, Editor, Viewer, Billing | Partial / development | Server policy negative tests; comprehensive endpoint/step-up coverage pending |
| REQ-004 | 5.1 Invitations, seats, membership audit | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-005 | 5.1 Enterprise SAML/OIDC and later SCIM | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-006 | 5.2 Brand extraction from URL and assets | Partial / development | Manual kit + public extraction proposal; fixture performance/asset extraction pending |
| REQ-007 | 5.2 Brand Memory and retrieval | Partial / development | Pinned immutable brand versions; retrieval/source erasure pending |
| REQ-008 | 5.2 Voice Guard | Partial / development | Located visible-copy/alt exact-phrase lint with shared compiler sanitization tested; configured tone rules pending |
| REQ-009 | 5.3 Prompt, goal and persona aware generation | Partial / development | Real structured AI adapter gated by provider/allowance; live corpus unverified |
| REQ-010 | 5.3 Series and delay hints | Partial / development | Series proposals with delay hints gated by AI access |
| REQ-011 | 5.3 Remix template or past email | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-012 | 5.3 Screenshot clone | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-013 | 5.3 HTML import | Partial / development | Explicit sanitized raw mode; VML/conditional preservation unverified |
| REQ-014 | 5.3 Canonical EmailSpec and compiler | Partial / development | Typed nodes and deterministic manifest compiler; golden client suite pending |
| REQ-015 | 5.4 Block visual editor | Partial / development | 10 block types + pointer/keyboard outline; advanced editing QA pending |
| REQ-016 | 5.4 Code tab and round trip | Partial / development | Read-only compiled view and raw fork; Monaco/reviewed conversion pending |
| REQ-017 | 5.4 Save history and undo | Partial / development | CAS autosave/local recovery/history restore tested; retention/collaboration contract pending |
| REQ-018 | 5.4 Business realtime collaboration | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-019 | 5.4 Responsive canvas | Partial / development | Desktop/390px simulation shares spec; no client evidence claim |
| REQ-020 | 5.5 AI images and editing | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-021 | 5.5 GIFs and static fallback | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-022 | 5.6 Real client preflight | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-023 | 5.6 Lint links spam and dark mode | Partial / development | Frozen-artifact rule-versioned severity, located voice/footer/alt, static URL syntax, known-token contrast/HTML-byte warnings and spam advisory tested. Live availability/image measurement, opaque contrast/dark mode, client conformance and labeled catch-rate acceptance remain required. |
| REQ-024 | 5.6 Blocking and report sharing | Partial / development | Missing real-client evidence remains incomplete; sharing/override not implemented |
| REQ-025 | 5.7 Twenty plus locales and RTL | Partial / development | 22 locale selectors and semantic dir; translation/client fixtures pending |
| REQ-026 | 5.7 Linked localized variants | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-027 | 5.8 Contacts lists tags and fields | Partial / development | Tenant-isolated contacts/lists/tags/typed fields, CAS profile updates and usable controls tested. Large-audience paging/lifecycle and production consent gates remain. |
| REQ-028 | 5.8 CSV mapping and import | Partial / development | File/header/typed-field/consent-claim mapping, paginated row errors, whole-file consent conflict fence, transactional bulk insert/counts/retry preservation tested. 10,000 valid local rows in ~10 seconds; specified production capacity and real recipient/verified-proof admission remain gated. |
| REQ-029 | 5.8 Dynamic segmentation | Partial / development | Bounded versioned rule AST, parameterized typed/list/tag/observed-event queries, timestamped eligibility previews and immutable sorted/digested snapshots tested. Nested builder UI, campaign snapshot selection, dispatch eligibility recheck and production capacity remain. |
| REQ-030 | 5.8 Preferences and double opt in | Partial / development | Signed topic/frequency forms, explicit expiring DOI proof, later opt-out invalidation and shared rolling cap tested. Confirmation delivery, production dispatch wiring and received RFC8058/DKIM evidence remain required. |
| REQ-031 | 5.8 Suppression and consent evidence | Partial / development | Import does not clear suppression; append-only safety events; full dispatch races pending |
| REQ-032 | 5.9 Domain DNS setup | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-033 | 5.9 Managed SES and provider keys | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-034 | 5.9 Trial domain and warming | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-035 | 5.9 Immediate schedule approval | Partial / development | Frozen campaign intent/review request, approval blocked by missing evidence |
| REQ-036 | 5.9 Recipient jobs and logs | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-037 | 5.9 Abuse controls | Partial / development | Sending disabled, real imports held; risk/appeal controls pending |
| REQ-038 | 5.10 Campaigns calendar and UTM | Partial / development | Campaign snapshots; scheduling/calendar/UTM pending |
| REQ-039 | 5.10 A/B subject testing | Roadmap | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-040 | 5.11 ESP adapters | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-041 | 5.11 Export fidelity and downloads | Partial / development | Frozen HTML/txt plus authenticated isolated Linux PNG/PDF and tenant/profile-bound immutable cache tested locally. Production sandbox/egress/queue/load/storage policy and destination fidelity remain pending. |
| REQ-042 | 5.12 Delivery and engagement analytics | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-043 | 5.12 Tracking and attribution | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-044 | 5.12 CSV analytics export | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-045 | 5.13 Stripe and Slack | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-046 | 5.13 Shopify and Stripe customer events | Roadmap | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-047 | 5.13 Webhooks and n8n recipes | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-048 | 5.14 REST and TS SDK | Partial / tested development | OpenAPI3.1 covers 58 enabled method/routes with validating examples; generated TS6 client, bounded same-key recovery, request IDs, downloads/abort and signed collection paging pass actual HTTP/Chromium. Full GA families, expanded generic response types, published package ownership and production conformance remain required. |
| REQ-049 | 5.14 Workspace API keys and limits | Partial / tested development | Explicit scopes, hashed one-time secrets, atomic rotation/revocation, current issuer/queued checks, shared configurable rolling limits and signed key pagination pass actual HTTP/Chromium. Approved commercial entitlements, production identity/MFA, security and operational acceptance remain open. |
| REQ-050 | 5.14 Domain and campaign event contracts | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-051 | 5.15 Plan trial annual and seat billing | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-052 | 5.15 Cost and usage control | Partial / development | Immutable reserve/consume/release and zero finite allowance; catalog/economics pending |
| REQ-053 | 5.15 Refund cancel and retention | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-054 | 5.15 P1 referral and India payments | Roadmap | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-055 | 5.16 Legal materials and consent | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-056 | 5.16 Data rights and deletion | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-057 | 5.16 Encryption MFA and audit | Partial / development | Local hashed sessions, role/RLS and hash audit; KMS/TLS/MFA/full audit pending |
| REQ-058 | 5.16 Assurance and penetration test | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-059 | 5.16 US and EU residency | Roadmap | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-060 | 5.17 Status flags and kill switches | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-061 | 5.17 Internal admin | Required / pending | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
| REQ-062 | 4 and 12 Public experience and docs | Partial / development | Honest marketing/docs/status/legal/support development routes |
| REQ-063 | 10 AI evaluation and trust | Partial / development | Versioned no-tool structured AI prompt/validation; 50 real golden briefs pending |
| REQ-064 | 13 and 16 Production delivery | Partial / development | Pinned lockfile/build/test/lint/typecheck and release blocker register; production gates pending |
| REQ-065 | 18 and 19 Later product surfaces | Roadmap | Implementation and acceptance evidence remain required; provider/decision gates apply where stated. |
