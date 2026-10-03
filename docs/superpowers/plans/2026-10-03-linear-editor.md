# Linear Outline editor implementation plan

Authoritative scope: PRD REQ-015/019 and sections 6.2#7/6.6. Full GA baseline remains in force. Baseline commit: 1fb843fc8da2ed3bff628d8d3d1419af83beb6d4.

1. Implement immutable section commands; extract existing block fields without changing legacy behavior; expose all ten block types and column children in a linear Outline. Preserve literal authored HTML, stable IDs and document metadata. Existing asset admission stays top-level.
2. Integrate Outline into the editor using existing save, recovery, undo, checkpoint and export contracts. Default to Outline on phones; preserve explicit desktop preview and raw-source authority. Scope styles for 320px reflow and text zoom. No API, schema, access, collaboration or provider changes.
3. Verify native browser editing, keyboard positions, repeated clicks, add/delete/undo, acknowledged save/reload, retained command after lost receipt, raw and empty states, Viewer read-only fields, RTL, text zoom, navigation, frozen HTML/TXT export and unchanged sibling source. Run focused tests, lint, typecheck, build and API consistency. Record the bounded evidence; full WCAG/screen-reader and real-client acceptance remain outstanding.
4. Fresh independent static review of the immutable change; fix material findings with a failing then passing regression. Preserve private files and existing data, fast-forward mirror/Desktop, publish the actual completed changes to main and verify exact-head CI.

Interfaces: root owns editor integration/domain/tests/docs; UI task owns reusable BlockFields, EmailLinearOutline and scoped CSS. Callbacks operate on existing top-level IDs. Field inputs retain partial values until existing server validation. Viewer text stays readable/copyable; mutation controls stay disabled.

Review focus: legacy field behavior, authored HTML bytes, nested-field identity, no-op commands, save interruption, selected image admission, phone/raw mode, complete keyboard controls and truthful simulation labels.
