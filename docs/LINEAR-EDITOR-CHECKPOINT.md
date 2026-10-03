# Linear Outline editor checkpoint

The editor now offers all ten block types and column children in reading order. Phones default to Outline; desktop retains Preview with an explicit Outline switch. Native fields support edits, keyboard move up/down/position, add/delete/undo, acknowledged save/reload and frozen HTML/TXT download using the existing source-save and revision contracts.

Literal custom HTML remains authored source, separate from preview/export. Reordering and edits to other fields preserve unchanged CRLF and Unicode source, sibling IDs and document metadata. Raw mode shows copyable exact source and its plaintext projection without claiming a conversion; full HTML editing remains available through the existing HTML view. Authored locale/direction applies to content fields; URL/source fields stay LTR and English app controls remain distinct.

Two existing save-state issues exposed by this workflow are corrected: returning to the acknowledged spec clears the dirty indication without a new write, and incomplete fields are validated before creating a pending save command. Partial input remains in the current tab; it does not qualify as a durable saved draft. A real uncertain command keeps its original payload/key and recovery behavior. Add block now also appends to the current live draft, so two rapid clicks preserve both new block IDs instead of replacing the first addition.

## Bounded qualification

- Domain command and existing source-command checks: 13 passed, zero failed. Three new domain tests cover stable identity/source, repeated deletion, immutable edits, partial fields and refusal of stale/raw commands.
- Native owned Chromium fixture: all fields, column children, exact retained source; keyboard typeahead position and move buttons; repeated delete/undo, add/remove; view switches; explicit source edit; save/reload; exact current frozen HTML/TXT downloads.
- Lost committed receipt and reload: repeated Save sends one command; retry uses identical key, If-Match and payload, with no second document version. Incomplete URL issues no draft write/pending command; correction saves successfully.
- Browser layout/ordinary display checks: 390/320px, visible field bounds, 200% root text zoom at 720px, navigation, empty/add, raw source authority, Arabic content language/direction with LTR links, readable/copyable Viewer fields and disabled mutation controls, desktop default. This is not a new permission or security qualification.
- Fixture browser initialization is restricted to the top frame; the existing preview sandbox remains intact. Owned app and disposable database are cleaned up; no original app/worker is restarted.
- Final native smoke completed with all six workflow groups plus owned app/database cleanup passing, zero page errors and zero external requests. Lint, typecheck, production build and API consistency (140 operations, unchanged generated contracts) passed. Production startup remained closed: full GA release evidence is incomplete. A fresh independent immutable review of code commit `1d2c1dda059498843c8f8f172259b5242042400a` found zero material issues. Preservation/publication and exact-head CI are reported in delivery. No AI, provider, campaign, billing or production deployment success is claimed.

## Remaining acceptance

REQ-015/019 remain Partial/development. Complex layout editing, complete keyboard/screen-reader/contrast/zoom journeys, physical device/assistive technology testing and real email-client fidelity remain open. The check is root text zoom, not a complete browser/OS zoom or WCAG certification. Untouched custom source is retained exactly; explicitly editing a native textarea may normalize its line endings.

Full GA baseline, all 65 requirements and all 13 release gates remain in force. Provider/accounts, production operations, consent/legal and independent acceptance require their named prerequisites in PRODUCTION-LAUNCH-CHECKLIST.md. Paused collaboration and its qualification remain excluded. No schema, API route, access policy, asset admission or provider configuration was changed.

## Original minor review findings — corrected subsequently

- Outline also shows the existing simulated-viewport controls and label; they affect Preview rather than the linear form. Clarify the label/visibility in a later UI polish change.
- Undo from invalid fields back to the acknowledged spec can leave a stale validation alert until manual Save clears it. The draft is correctly marked saved and remains usable; retire only the resolved validation alert in a later polish change.

Both original failures were reproduced and corrected in the subsequent ordinary editor feedback change; see EDITOR-FEEDBACK-CHECKPOINT.md for native regression evidence and delivery. The original review observations above are retained as history. These corrections do not establish complete accessibility acceptance.

## CI compatibility closure

The first publication (`65d5bc8`, run 37136176560) passed unit/lint/typecheck/build, media, renderer and every new Outline browser group. Its inherited template mobile fixture then timed out waiting for Preview to be the default. That fixture now explicitly selects Preview before checking the iframe and restricts browser initialization to the top frame. The existing isolated native template journey passes after this correction; lint/typecheck also pass. Production code is unchanged from the independently reviewed code commit. Final exact-head CI is reported in delivery.

Two further inherited phone consumers were reproduced locally: derivation waited for the default iframe, and UTM link editing selected the hidden legacy inspector. Both now explicitly choose Preview for their existing simulation/inspector journeys, including after reload. Their complete native disposable-database scripts pass after the change; original assertions remain in place. No production code or paused collaboration/security work changed.
