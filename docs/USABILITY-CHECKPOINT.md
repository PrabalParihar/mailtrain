# Published UI usability checkpoint — 2026-10-03

This independent patch starts from published main `0b969ece2e5c999335f06f1a77b498c16c472b61`. It covers PRD sections 6.1–6.4 and the public documentation/accessibility portions of REQ-062 and REQ-064. It does not accept an entire requirement or release gate, change the full 65-requirement GA baseline, or declare a public launch.

## Problems and resulting behavior

- At 390×600, the baseline navigation contained 801px of content with no internal scrolling. Settings and Help could leave the screen. The panel now scrolls, has a visible Close button, preserves Escape focus return, and keeps 44px mobile navigation controls.
- A simulated slow or failed email-list read previously displayed the first-use empty message. Home and Emails now show loading, unavailable and acknowledged-empty states separately. Retry is accessible and repeated clicks start one read. Previously loaded drafts stay visible with an explicit stale-data explanation when a subsequent read fails.
- A long subject widened the baseline 390px viewport to 3545px. Draft rows now wrap long titles and unbroken subjects within the content column.
- Mobile public navigation previously hid Documentation and Status. Both links remain visible and wrap alongside Open workspace.
- Shared headings, body copy, form inputs and list text use scalable sizes. Enlarged button labels retain adequate line spacing. Narrow dashboard headings wrap and decorative artwork is omitted where it competes with content.
- Public docs include section navigation, acknowledged-save/checkpoint guidance, retry guidance, mobile/keyboard instructions and preview/export limitations. Full accessibility, real-client and provider acceptance are still required.

## Validation and its limits

`npm run smoke:usability` renders the actual Next application in Chromium and intercepts all API reads with explicitly simulated workspace/list responses. It makes no database fixtures, sessions, provider calls or state-changing API requests. The fixture does not establish backend availability or provider success.

Six browser check groups pass on the emitted standalone build:

1. Eight public/workspace screens at 320, 390, 768 and 1440 CSS pixels without page overflow.
2. Short-screen navigation scrolling, hidden-panel keyboard exclusion, Enter, Escape, Close, screen links and skip-link focus.
3. Navigation while a list read is pending.
4. Loading, empty, initial-error, repeated-Retry and retained-list error states.
5. Full long titles and unbroken subjects at all four widths.
6. 200% root text sizing on four reviewed screens, enlarged button line spacing, mobile form text and documentation section links.

Whole lint, typecheck, production build and generated API consistency pass. The 137 published API operations are unchanged. Twelve focused native API-contract/compiler/template tests pass with zero failures or skips. Existing CI checks remain enabled; the new UI smoke and its screenshot/report artifact are added to the verify job. Exact published-head CI is required after publication.

This is bounded UI regression evidence, not WCAG certification. Screen-reader review, full end-to-end accessibility, other product modules, provider procurement/setup, consent and legal approval, operational acceptance and all production release gates remain open. The paused collaboration work is excluded; no collaboration files, workers, database validation review or access-revocation tests are part of this patch.

Local evidence is recorded under `/tmp/lettercape-usability-evidence/`, including `baseline-regressions.json` and `standalone/report.json` plus screenshots. Build, lint, typecheck, native and browser logs use the `/tmp/lettercape-usability-` prefix. CI reproduces the smoke and retains `usability-evidence` for seven days.
