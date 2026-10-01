# Isolated frozen-export renderer plan

Goal: advance REQ-041/064 and TECH-031/091 by replacing production web-process browser rendering with a separately authenticated restricted worker; no cloud deployment or client-capture claims.
Base483de04344c2d35235164baddadafdd8d9e69b48; authoritative local PRD TECH-031/091/110/120, full Baseline A retained.
Known RED: prepared web Docker image cannot load traced playwright-core/browsers.json. Existing production PNG/PDF refuses RENDER_WORKER_REQUIRED. Local browser export remains development-only.

1. Specify versioned request/response authentication and artifact/tenant identity: server-owned endpoint, exact body digest/time/request ID HMAC, private environment key, strict schema/size/deadlines. No recipient lists/session/provider keys in render worker.
2. RED unit boundary tests (tamper, expiry, unknown shape, invalid destinations, format/size limits, capacity, cancellation) then implement dedicated Node worker and app client. Preserve frozen HTML/hash and honest missing configuration. Private endpoint DNS/server ownership checked; no user URL selects the worker.
3. Add durable tenant/frozen-revision/renderer/format-bound binary cache with immutable receipts and locks, bounded retry/read/stream. No new generation/send authority or fabricated real-client evidence.
4. Build pinned Linux browser-worker container, non-root, explicit production release refusal; own local internal network only for fixture validation. Browser scripts disabled, all HTTP/image/font routes aborted, service-worker disabled and bounded resources. Confirm no outbound request and bytes are actual PNG/PDF. No secrets in image or public Git.
5. Actual HTTP/Chromium exports, lost/repeated responses, interruption/offline, mobile/navigation; full tests/lint/type/build/APIcheck and one fresh whole-slice review with one Important/Critical RED→GREEN pass. Keep deployment/security/firewall/load/restore/full queue acceptance gates open.

Ruling: the renderer's application/request isolation and actual local internal Docker network evidence do not certify a future Railway network policy — exact production egress/capacity/operations must be evidenced before activation — cost if wrong: platform architecture change or separate renderer hosting under an approved cost plan.

Native implementation and one fresh review/fix pass complete.3 Important failures reproduced and fixed; deferred identity-type Minor documented. Actual nonroot sandboxed network-none Linux signed PNG/PDF and local cache/editor interruption/concurrency/navigation checks pass. Final full verification/publication is recorded in VERIFICATION.md/progress.md. No whole requirement or GA gate is closed.
