# Invitation planning workflow

Authoritative PRD REQ004, TECH100 and journeyS14/JRN04; full GA remains unchanged. Explicit option2: production invitation acceptance stays disabled until commercial entitlements are approved. Real delivery, access credentials and membership changes are excluded.

Implement durable workspace planning requests with recipient email (unverified), proposed Admin/Editor/Viewer/Billing role, optional notes and optional UTC review deadline. States are draft/withdrawn. A past review deadline is a derived planning warning, not an expired access grant. Requests reserve zero editing seats and create no credential, invite link, identity or membership. Owner continues to require existing ownership transfer; Admin cannot plan/manage Billing requests.

Use new invitation_requests/current rows plus immutable invitation_request_history snapshots. Explicit record IDs, finite integer versions, current manager session/actor and workspace scope; keyed create/update/withdraw/reopen commands, CAS and case-insensitive active-email deduplication. Identical updates are no-ops; replay returns original receipt. Do not migrate the original database during development, only isolated fixtures/CI. Actual deployment migration and acceptance remain prerequisites.

Routes: GET/POST invitation-requests; GET readiness; GET item/history; POST item/update/withdraw/reopen. POST item/send/accept refuse with exact disabled errors and no row/history/member/credential side effect. Existing bounded pages and generated API/SDK contracts remain in sync. All sending/acceptance/readiness flags are server-owned false; no environment/payload toggle enables them.

Owner/Admin Team settings display planning form, empty/error/retry/working/unconfirmed states, edit/history/withdraw/reopen, review-deadline warnings and prerequisite register. Unconfirmed commands freeze their original input/key while retrying; form edits survive definitive conflicts until explicit reload; stale context results cannot install. No retained payload/access credential is put in browser storage. In-memory retry plus active-email deduplication prevents duplicate records after interruption; lists/history provide durable server discovery.

Real acceptance requires approved commercial entitlement/counting, recipient identity and expiry/reissue policy, transactional sender, membership/MFA/audit/required acceptance and activation. Production configuration, delivery and paused collaboration/database-security review remain outside this slice.

Validation: observed domain/database/native RED then GREEN, normal role/duplicate/version/no-op/replay/date/pagination behavior; actual browser repeated clicks/lost receipt/keyboard/mobile/invalid/error/reload/navigation; no membership/session/seat changes, external requests or credential creation. Full tests/lint/type/build/API and immutable independent review, preservation/Desktop/main/exact-headCI.
