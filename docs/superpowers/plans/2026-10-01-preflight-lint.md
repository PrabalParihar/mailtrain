# Static preflight coverage plan

Goal: advance REQ-008/023/024 and TECH-093 with deterministic located checks against frozen artifacts; no invented network, asset-weight, dark-mode or real-client evidence.
Base: b43bb417f1ec893582d299baa0484712849ae664. Authority: local Mailcraft-Development-PRD-v2.0.md requirement table and TECH-091/093.
Interfaces: lintEmail consumes an immutable EmailSpec plus its pinned brand phrases and optional exact stored HTML; preflight stores artifact hash and a versioned rule set, UI displays evidence and location. Existing legacy reports remain marked legacy. Compilation/export bytes do not change.

1. Write behavioral RED tests: phrase only in URL/ID cannot block; phrase split by HTML tags produces a located finding; opaque/custom HTML unsafe/missing links and image alt; structured known link/button contrast; exact UTF8 artifact bytes; spam advisory; safe unsubscribe slot recognized; absent client/network/asset measurement remains incomplete.
2. Implement deterministic bounded checks, versioned warning thresholds and transparent incomplete evidence. Warning thresholds are proposed rules (4.5 normal-text contrast following W3C,100KiB HTML heuristic), not approved blocking policy or deliverability guarantees.
3. Add additive migration storing rule_set_version on reports; run against actual frozen HTML and pinned brand; surface version/coverage in editor.
4. Real HTTP/Chromium: save/freeze/report, bad nested block locations, exact artifacts unchanged, stale report fences, offline retry, repeated clicks, mobile/read/navigation and no provider calls.
5. Full tests/lint/type/build/contract check and one fresh whole-slice review; one Important/Critical RED→GREEN fix pass, defer minors, update ledger and publish tested source. Keep all GA gates open.

Completed native41-test validation followed by one fresh4-Important review and one RED→GREEN fix pass; final45-test/full-check/actual HTTP+Chromium suite green. No rereview; full GA obligations unchanged.
