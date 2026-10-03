# Column content editor checkpoint

Fixed column layouts now support adding all nine non-column block types, deleting, keyboard up/down/position ordering and moving a child to the other existing column. Outline and the existing desktop inspector use the same command callbacks. Empty columns remain usable; native controls show the existing 20-child and 200-total-node limits. This does not add nested columns, resizing or a new payload schema.

Commands operate on the current draft using stable parent/child IDs. Repeated Add preserves separate IDs; repeated Delete consumes one undo step. Moves retain unchanged node objects, authored source, managed-image references and document metadata. Child field changes replace the current child rather than a captured whole parent. Partial fields remain local until existing shared save validation accepts them. Original save receipts, revisions and exports remain authoritative.

Moving a focused column selector across containers now restores focus to the same child's selector after rendering, scoped to the original workspace/account/document. Other focus is not moved. Locale/direction remains on authored fields; URL/source and English app controls retain their separate direction.

## Bounded validation

- Four new domain cases plus existing Outline/source-command cases: 17 passed, zero failed. Missing helpers first failed; immutable commands then passed. Managed-reference tests preserve references without certifying asset admission.
- Owned native Chromium app 3038 and disposable database: rapid Add, stable IDs, editing/save/reload, exact retained CRLF/Unicode, keyboard position/down, cross-column transfer, repeated Delete/Undo, incomplete-URL refusal/correction, byte-exact frozen HTML/TXT, empty columns/all nine types, full-column/global limits, 320px reflow, Arabic content/English controls, copyable Viewer fields and desktop inspector parity passed. Focus-loss regression was reproduced before correction. Zero page errors/external requests; owned resources removed.
- Inherited Outline smoke passed all six groups and cleanup, including original-command/lost-receipt recovery, invalid-input correction, 320px bounds, 200% root text zoom and native tab navigation through the new child controls to the next source field. The old one-Tab textarea assertion was updated for the intentional new tab stops.
- Lint/typecheck, production build and unchanged API consistency (140 operations) passed. Actual mobile/desktop pixels inspected. Fresh independent review, preservation, publication and exact-head CI are reported in delivery.

## Remaining acceptance

REQ-015/019 remain Partial. Full accessibility/assistive technology/physical-device journeys, complex layout design, real email-client fidelity and production load remain open. Explicit textarea editing may normalize line endings; untouched source stays exact. Existing asset admission, save/undo/recovery and compiler contracts are reused; no new security certification or provider readiness is implied.

All 65 requirements and 13 release gates remain in force with no whole requirement/gate accepted. Paused collaboration and flagged qualification are unchanged. No paid commitments, real messages, AI generation, transport, billing, provider configuration or production deployment occurred.
