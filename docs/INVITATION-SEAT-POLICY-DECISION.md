# Invitation editing-seat decision

This records an unresolved commercial prerequisite, not an approval or implementation. PRD v2.0 TECH-100 requires an approved commercial matrix; §17.1 says final prices and included quantities require owner approval. Premium one editing seat and Business two are proposals. Owner/Admin/Editor each count as editing seats; Viewer/Billing cannot gain editing indirectly. Existing membership commands refuse seat increases with `SEAT_POLICY_REQUIRED` and report `capacity_policy_configured:false` / `billing_reconciled:false`.

Before enabling editing-role invitation acceptance, approve the capacity entitlement and counting policy: whether the proposed included limits are used, whether outstanding invitations reserve seats, and what happens when acceptance races another invitation or a downgrade. Additional editing seats must remain unavailable unless separately approved; no extra-seat price or automatic charge is inferred. Owner already consumes Premium's proposed one included editing seat.

Conservative options:

1. Authorize **development-only** limits of Premium 1 / Business 2, including Owner/Admin/Editor; count active editing members plus outstanding editing invitation reservations. Refuse invitations/acceptances beyond the cap, reconcile expiry/revocation atomically and hold new acceptance when capacity is unavailable or exceeded. No purchasing, automatic billing or public pricing; production still needs signed approved entitlements. Tradeoff: useful local end-to-end fixtures, but future commercial changes may require policy migration.
2. Keep invitation acceptance disabled until the commercial matrix and entitlement source are approved. Build the same lifecycle with an unavailable-capacity response and no assumed plan values. Tradeoff: less local user-flow completion now, minimal policy migration or unintended commitments.

Independent implementation remains possible: current-role checks; draft invitation UI showing workspace/role/capabilities; identity-bound single-use expiring/revoked token states; idempotent redeem/reissue commands; explicit capacity-unavailable refusal; bounded outcome/history UI; fixtures for wrong identity, expiry, repeated clicks and concurrent decisions using a test capacity resolver. Real delivery and production acceptance stay disabled. No invitation is sent. Any access/session/collaboration qualification remains subject to the existing paused boundary; this decision does not authorize resuming it.

Focused owner decision when editing acceptance is to be enabled: Should local development use the proposed 1/2 hard caps with pending editing invitations reserving seats and extra seats blocked, or leave all invitation acceptance disabled until approved commercial entitlements exist?
