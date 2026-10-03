# Column child editing

Authoritative scope: PRD v2.0 REQ-015/019 and TECH-030/033. Baseline `535fdb83c6ead248ff70034c067515faf58f9e46`, independently reviewed Outline and terminal all-job CI 37137914188. Full GA remains unchanged.

Extend the existing fixed column structure with child add, delete, ordering and transfer controls. Use native labeled controls in Outline and the existing inspector. Preserve stable child IDs, untouched source/metadata and managed references; use current live draft commands, existing undo, validation and original-command recovery. No layout resizing, schema/API/access change, provider, sending, billing, collaboration or flagged qualification.

1. Write domain regression tests first: immutable add/move/replace/remove, repeated removal, column and total-node limits, ID collisions, stale/raw refusal and exact source. Watch RED, implement helpers, watch GREEN.
2. Add native child controls and connect commands to the current draft. Keep all nine non-column types supported, copyable read-only fields and disabled mutations. Run lint/typecheck and focused regressions.
3. Use an owned app/disposable database for actual keyboard/pointer ordering and transfers, rapid Add/Delete, empty columns, undo, partial-input correction, save/reload, literal source and frozen export, limits, mobile/RTL/read-only and desktop inspector. Stop only owned resources. Inspect screenshots.
4. Run checks/build/API consistency; conduct one immutable independent review. Fix material findings with reproduced regressions, record minor findings. Preserve original files/data, sync canonical Desktop, publish real changes and monitor exact-head CI. No production release claim.

Review focus: current-draft command semantics under rapid clicks, cross-column position boundaries, duplicate/stale IDs, object/source preservation, rejected limits without partial mutation, closure-safe child replacement, keyboard/label/focus behavior, inspector/Outline parity and existing asset admission. Fixture success does not certify complete accessibility or real email clients.
