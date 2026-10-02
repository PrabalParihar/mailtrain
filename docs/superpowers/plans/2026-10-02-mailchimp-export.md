# Mailchimp preparation implementation plan

Spec: docs/superpowers/specs/2026-10-02-mailchimp-export-design.md. Existing Next16/React19/TS/Postgres; no new dependencies. All65/all13/zero accepted, no provider/paid/push/userdata rewrite.

1. Shared frozen-source validator and Mailchimp compiler/contracts: src/domain/frozen-export-source.ts, esp-export.ts extraction, mailchimp-export.ts, mailchimp-export-contracts.ts; covering unit tests, preserve existing Klaviyo behavior.
2. Unmounted Mailchimp create/metadata-readback primitive: src/server/mailchimp-template-adapter.ts/tests, marker+ID-before-IO/readback, no content-verified state. Independent worker after exact interface brief; no shared files.
3. Root integration: current-authority shared routes, discriminated generated API/SDK, selected-destination editor lifecycle and panel. Actual owned HTTP/Chromium dual mapping/selection interruption.
4. Root qualification/review/canonical closeout: full configured regression/lint/type/API/build, immutable whole review and one bounded correction, preserve original/private data and exact tracked matches; production closed.

Review focus: source validation extraction must keep every old refusal; unknown provider tokens cannot be silently reinterpreted; selected-destination races cannot adopt stale artifacts; trustworthy numeric ID cannot be lost due partial attributes; metadata/sharing link cannot certify HTML fidelity/deep link; no real remote effects.
