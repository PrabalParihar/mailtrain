# Klaviyo frozen destination review and adapter contracts

The full 65-requirement Baseline A and all13 release gates remain required. The next independent REQ040/041 slice gives an editor a real Klaviyo-specific frozen HTML/text preparation to inspect and download, and implements the real documented create/readback transport contract. This does not enable a remote export, imply OAuth/account entitlement, replace five-adapter acceptance or treat browser/static checks as real-client evidence.

Existing analytics cannot be used for a delivery dashboard/CSV: engagement_events lacks campaign correlation and there is no delivery-attempt/event ingestion authority. Implementing a false zero dashboard would conceal that dependency. A five-client shallow batch would also conceal provider-specific mapping and reconciliation requirements. Klaviyo-first provides a narrow foundation; all other adapters and full durable connection/export jobs remain open.

## Architecture and boundaries

A pure destination compiler consumes an immutable revision's exact compiled HTML/plaintext, EmailSpec and asset manifest. It maps only the canonical uppercase UNSUBSCRIBE_URL slot into the documented Klaviyo unsubscribe_link tag. Raw mode and custom HTML remain preserved but refused by this mapping version. All other template tokens, missing legal footer/identity/address, source hash corruption and private asset bindings block this preparation. This conservative mapping performs no network fetch and never resolves recipient data. It does not alter the original revision or tracking/UTM policy. Subject/HTML are never sent to analytics.

Authenticated read-only destination review/download endpoints require current edit permission and emails:export. JSON review declares mapping/version/source and destination hashes, readiness blockers and transformations. HTML/text download remains explicitly locally prepared and unqualified; it performs no provider action. The editor freezes its current revision first and fences async results/downloads to the exact current workspace/actor/email/local state. GET cannot create a remote object.

A server-only Klaviyo transport pins API revision2026-07-15 and the fixed a.klaviyo.com origin. It supports CODE HTML templates only, not campaigns, assignment, sending, enrollment or updates. OAuth and scope/capability admission belong to the future connection/export service; the existing remote export route continues to reject unconfigured readiness. The transport requires the caller to durably record a submission marker before network IO, creates once, persists the returned opaque template ID through a callback before GET readback, and verifies exact name/editor_type/HTML/text. It never automatically retries POST. Transport failures,5xx or invalid success without a trustworthy ID are outcome_unknown. Known-ID verification failures retain the ID and are needs_attention. Provider raw errors/token/content are never surfaced in diagnostics. A known ID yields only its documented API resource URL; an app management deep link remains unqualified rather than guessed.

## Qualification

Domain RED/GREEN tests cover source/hash integrity, native unsubscribe mapping, unknown tokens, raw/custom refusal, private assets, footer and unchanged source. Transport tests exercise durable marker/readback-ID callbacks, acknowledgement loss, malformed201,429,401/403,5xx, mismatched content, oversized bodies, cancellation and no redirects/retries. Actual local HTTP/Chromium covers editor freeze/review/download/repeated clicks/navigation/mobile/Viewer denial and honest missing-provider/client evidence. Full lint/type/API/build and relevant suite qualify the slice; one immutable final review and its bounded correction pass precede clean Desktop synchronization. All provider/live conformance remains blocked.

## Sources verified 2026-10-02

- https://developers.klaviyo.com/en/reference/create_template — CODE template POST,templates:write,201 and revision2026-07-15.
- https://developers.klaviyo.com/en/reference/get_template — exact-ID GET,templates:read.
- https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/create_template.json — name/editor_type/html/text create/readback schema.

## Rulings and costs

User authorization to complete independent development takes precedence over routine skill approval handoffs. No material procurement/policy choice is settled here. This intentionally conservative mapping blocks raw/custom templates and unresolved personalization until a qualified mapping exists; it costs unsupported exports rather than silently losing authored content. Remote jobs,OAuth lifecycle, encrypted grant storage, account discovery, endpoint/account scheduling, entitlement, external edits/reexport, native test-send and the other four adapters remain independent work. This slice must not advance a whole requirement or gate to accepted.
