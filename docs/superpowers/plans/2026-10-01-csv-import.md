# CSV mapping and bulk import slice

PRD REQ-028 follows tenant organization (REQ-027) and preserves REQ-030 consent/suppression boundaries.

1. Add a bounded CSV/header/mapping parser with typed attribute conversion, row-level errors, duplicate/case collision detection and explicit consent-claim fields. Claims are stored as unverified evidence, never opt-in approval. Test malformed/duplicate headers, invalid types/dates, prototype keys, reserved-address gate and missing consent.
2. Replace per-row writes with transactional bulk insert and append-only evidence. Idempotent retries return actual processed/created/existing counts. Existing contact data/permission is preserved; opt-out claims are honored, never reversed. Lists/tags are tenant-validated and never enroll permission. Test repeated confirmation, suppression preservation and actual 10,000 valid-row elapsed time on the isolated local instance.
3. Build file/textarea input, header inspection and mapping controls, typed-field choices, list/tag assignment, consent-source columns and clear held/error/count results. Changing CSV/mapping invalidates the old dry-run confirmation. Exercise empty/error/offline/repeated-click/navigation behavior in actual Chromium.
4. Run tests/lint/typecheck/build/HTTP and browser checks, update capability/release ledger honestly, synchronize Desktop/mail, ordinary push and CI readback. Local throughput does not substitute for the PRD's specified production worker-capacity acceptance.

Full GA remains required. No contact import sends mail; no import assertion grants confirmed subscription. Real recipient admission remains behind outstanding legal/retention/consent launch gates. No external provider or spending is needed for this slice.
