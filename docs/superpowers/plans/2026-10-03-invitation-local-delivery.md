# Invitation local delivery plan

Use superpowers:executing-plans inline with one fresh whole-branch reviewer.
Spec: docs/superpowers/specs/2026-10-03-invitation-local-delivery-design.md
Base:5e07ef5d616d1e06dc2cfe17ecf4fdbc4d234b6f.

Review Focus:
- Migration is additive and targeted to the owned loopback development DB; snapshot restore is verified and existing rows/private files preserved.
- No live credential, actual membership change, invitation send/acceptance, global role/policy or paused collaboration/security work.
- Historical recipient/deadline come from the immutable snapshot, not current selected record; null deadline remains explicit.
- Generated email input validation preserves server trimming/post-trim length semantics, rejects malformed email and leaves unrelated schemas intact.

Task1 recovery and migration preparation: inspect039/owned target; private complete dump, restore-to-disposable verification and exact witnesses. Expected: owned target and existing role/schema match, dump/hash/restore verified, no actual writes.
Task2 ordinary corrections: write API parity/native history tests; observe RED; implement snapshot fields and shared normalized-email input pattern, generate/check SDK; observe GREEN. Expected: actual historic changed-email/due/null states and schema/server parity.
Task3 local application: reviewed targeted039 transaction plus receipt after verified backup; original witnesses unchanged; actual runtime synthetic service transaction rollback and native disposable UI checks. Expected: tables installed, original rows intact, no live credential/member/send/acceptance change. Full configured tests/lint/type/API/build/closed-startup pass.
Task4 delivery: immutable strongest fresh whole-branch static review, material RED→GREEN pass if necessary; exact preservation/sync/push and terminal all3CI. Expected: canonical/main/source match, actual local migration available, fullGA closed. Save exhaustive rulings/minors and delete only this plan's scratch.
