# Comprehensive local regression — 2026-10-02

Stable baseline8ed9ab1; reproduced mobile keyboard defect fixed in09a7eea. Full235/235tests,lint0,typecheck,API95/production build PASS. These results qualify implemented development paths, not the full65requirement/13gate GA baseline or live providers. Sender storage/DNS implementation is concurrent and separately qualified; later integration requires fresh checks.

## Final coverage

24existing owned HTTP/browser/worker groups PASS; the25th navigation group PASS. Affected browser groups rerun after the actual mobile focus fix; one calendar fixture initially tried an invisible closed-sidebar picker, now opens the real drawer and preserves its original delayed-workspace isolation assertion. No skipped/weakened safety assertion. Original failures retained in logs.

| Group | Final result | Evidence |
|---|---|---|
| smoke:webhook-configured | PASSED | /tmp/lettercape-comprehensive-configured-retry.log |
| smoke:webhook-history-configured | PASSED | /tmp/lettercape-comprehensive-configured-history-retry.log |
| smoke:api | PASSED | /tmp/lettercape-comprehensive-smoke-api.log |
| smoke:import | PASSED | /tmp/lettercape-comprehensive-smoke-import.log |
| smoke:preferences | PASSED | /tmp/lettercape-comprehensive-smoke-preferences.log |
| smoke:keys | PASSED | /tmp/lettercape-comprehensive-smoke-keys.log |
| smoke:contract | PASSED | /tmp/lettercape-comprehensive-smoke-contract.log |
| smoke:preflight | PASSED | /tmp/lettercape-comprehensive-smoke-preflight.log |
| smoke:render-cache | PASSED | /tmp/lettercape-comprehensive-final-smoke-render-cache.log |
| smoke:derivation | PASSED | /tmp/lettercape-comprehensive-final-smoke-derivation.log |
| smoke:dispatch-controls | PASSED | /tmp/lettercape-comprehensive-final-smoke-dispatch-controls.log |
| smoke:events | PASSED | /tmp/lettercape-comprehensive-final-smoke-events.log |
| smoke:webhooks | PASSED | /tmp/lettercape-comprehensive-final-smoke-webhooks.log |
| smoke:webhook-history | PASSED | /tmp/lettercape-comprehensive-final-smoke-webhook-history.log |
| smoke:brand-memory | PASSED | /tmp/lettercape-comprehensive-final-smoke-brand-memory.log |
| smoke:authority | PASSED | /tmp/lettercape-comprehensive-final-smoke-authority.log |
| smoke:memberships | PASSED | /tmp/lettercape-comprehensive-final-smoke-memberships.log |
| smoke:creation | PASSED | /tmp/lettercape-comprehensive-final-smoke-creation.log |
| smoke:voice-guard | PASSED | /tmp/lettercape-comprehensive-final-smoke-voice-guard.log |
| smoke:campaign-configuration | PASSED | /tmp/lettercape-comprehensive-final-smoke-campaign-configuration.log |
| smoke:campaign-lifecycle | PASSED | /tmp/lettercape-comprehensive-final-smoke-campaign-lifecycle.log |
| smoke:calendar | PASSED | /tmp/lettercape-comprehensive-calendar-final.log |
| smoke:utm | PASSED | /tmp/lettercape-comprehensive-final-smoke-utm.log |
| smoke:audience-selection | PASSED | /tmp/lettercape-comprehensive-final-smoke-audience-selection.log |
| smoke:navigation | PASS | /tmp/lettercape-keyboard-final.log |
| Dedicated Linux renderer | PASS | /tmp/lettercape-comprehensive-renderer-retry.log |

The pass covers nested audience/save/reload/pending original command and immutable selection/history; calendar/UTM/mobile workspace navigation; current tenant/role/key scope and post-wait expiry; malformed/encoded input/URL guards; repeated clicks/idempotent unknown-response retries; offline/cancellation/stale responses; CSV10000rows/replay/suppression retained/no fabricatedoptin; consent/version/proof/frequency races; immutable content/remix/locale/export/cache; paused webhook management/26receipts/101attempts and queue/worker recovery fixtures. Each command's log specifies its actual assertions.

Dedicated actual Linux renderer: UID1001, official seccomp, read-only filesystem, Docker network none,1GiB/2CPU/256PIDs, sandboxed Chromium153; signed/replay/tamper/shape/size/dimensions/capacity tests; actual PNG11539bytes/PDF15658bytes, image/font/script/frame outboundtripwire0. PNG pixels inspected (intentional blocked remote image); this is not real-email-client fidelity. Native390/1440keyboard/navigation screenshots inspected; source screenshots are /tmp/lettercape-keyboard-{mobile,desktop}.png and renderer artifacts /tmp/lettercape-comprehensive-renderer-evidence/{renderer.png,renderer.pdf}.

## Failures reproduced and resolved

- Product: closed mobile sidebar received invisible keyboardTabfocus. CSSvisibility now excludes it; explicit aria-expanded/controls, opening focus and Escapeclose/restore verified with Enter/Tab/Escape. MeaningfulRED /tmp/lettercape-keyboard-red.log, GREEN/final logs; no exhaustive screen-reader claim.
- Environment: configured webhook fixture initially failed because Next forbids two dev servers per project directory. After finishing main suite, exactownedPID/cwd/3003 verified and paused; both configured ephemeral-key suites passed,3003restored. Original /tmp/lettercape-comprehensive-smoke-webhook{,-history}-configured.log retained; no privatekeyenvfile or actualexternaldelivery.
- Fixture: calendar's workspace picker action was previously allowed offscreen. Newaccessibilityvisibility revealed that hidden interaction; open actualmobile drawer then sameoriginalworkspace/stale-responseassertions PASS. Original /tmp/lettercape-comprehensive-final-smoke-calendar.log and diagnostic failure retained.
- Environment: Docker Desktop could not bind the Mac Documents fixture. Exact SHA2567cb357ae2ba7296d432a979a25ac0d65551d26e2f777b79b70033b5e3514432c copy in/tmp allowed samefixture/officialsandboxflags to PASS. Original /tmp/lettercape-comprehensive-renderer.log retained; no weakening of renderer sandbox.

## Blocked and not-run distinctions

**Blocked:** current-head remote main push/exact-headCI (auto-review rejected both initial and explicitly permitted once-only retry under trusted No remote push); productionClerk/MFA/session acceptance; actualfunded AI/extraction/media/translation corpus; configured provider/domain/receivedDKIM/RFC8058 and legalconsent; actualESP/nativeunsubscribeconformance; Stripecharges/refunds/seat/economics; privateKMS/TLSreceiver/n8n; Railway exactworkspace all-inUS$30/tax/cap qualification; public deployment.

**Not run / not accepted:** otherbrowserengines/fullscreen-reader and exhaustive accessibility;20realemail-client profiles; productionload/10kcapacitybeyonddevelopmentcap/livebackuprestore/productionmigrationlocks; independentpen-test/legal/retention/data-rights/fullteam/editor/media/admin and othermissingPRDpaths; designpartneracceptance. Source/receipt simulations are explicitly not live-provider evidence. Deferred knownMinors remain in existing slice checkpoints, including uppercasefrozenUUID selection; this report does not erase them.

All13releasegates remain open; no completeGA requirement accepted. Source publication and public application launch are separate. No realmarketing sends/livecharges/unapprovedcredentials/account/provisioning effects.

## Throughput and next implementation

One integration owner. Userexplicitparallelinstruction supersedes native-onlysenderplan: storage agent owns onlydb030+DBtests; DNS agent owns onlyobserver+injectedtests; root owns API/UI/package/docs/integration and aggregate checks. Focused tests only in agents, serialized shared-index commits; one eventual whole-sender review, no per-task/repeated fullreview. Avoid duplicate fullsuite jobs; repeat only newcode/failed/affectedcoverage. No broad diagnosis or transcript export.

Extended editor browser coverage subsequently PASS in `/tmp/lettercape-editor-core-browser-final.log`: Undo, explicit save/reload, frozen history restore, unacknowledged local work reload, raw conversion of the just-saved heading with read-only transition, and delayed checkpoint refusing attachment after later edits;390px screenshot inspected. The initial fixture failure was a premature old Saved-status assertion during asynchronous restore, obscured by concurrent checkpoint cleanup; the fixture now waits for the actual restored subject and uses a locked cleanup transaction. Original failure logs are retained, and its exact interrupted synthetic workspace was removed after name/actor verification. No editor product change was needed. This adds `smoke:editor` as a26th reusable group; it does not claim complete code round trip, collaboration, media or real-client fidelity.
