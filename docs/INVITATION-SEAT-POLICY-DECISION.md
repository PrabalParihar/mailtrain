# Invitation editing-seat decision

Option2 is explicitly authorized: keep production invitation acceptance disabled until commercial entitlements and counting are approved. This is the development default; there is no pending choice between proposed seat caps. PRD v2.0 TECH-100 and §17.1 still require owner approval for the commercial matrix, prices and included quantities. Premium one editing seat and Business two remain unapproved proposals.

Owner/Admin/Editor count as editing roles; Viewer/Billing do not gain editing indirectly. Existing membership commands continue to refuse positive seat increases with `SEAT_POLICY_REQUIRED` and report `capacity_policy_configured:false` / `billing_reconciled:false`. No purchasing, automatic charge, outstanding invitation reservation or commercial entitlement is inferred.

The implemented ordinary workflow saves proposed email/role/notes and an optional UTC planning-review deadline, with draft/withdrawn states, CAS updates, reopening, immutable history and exact-command replay. It creates no access credential, identity, invite/redeem link, membership or seat reservation. Sending and acceptance refuse unconditionally. See [INVITATION-PLANNING-CHECKPOINT.md](INVITATION-PLANNING-CHECKPOINT.md).

Before actual invitation acceptance: approve entitlement capacity and counting, pending-invitation reservation semantics, acceptance races and downgrade behavior; approve recipient identity verification and expiry/reissue; configure an approved transactional sender and limits; qualify production membership/MFA/audit and release activation. Additional editing seats remain unavailable unless separately approved. No real invitation is sent. The paused collaboration/database-security/revocation branch and its qualification remain untouched.
