# Recipient Assessment Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: superpowers:subagent-driven-development; user explicitly requests focused parallel workers on disjoint scopes.

Goal: real durable frozen-audience assessments, observations and recovery while dispatch stays disabled.
Architecture: strict domain contract; additive tenant storage and bounded PostgreSQL worker; actor-fenced UI; root HTTP/SDK integration and native/browser qualification.
Tech Stack: Next 16.3.8, React 19.3.0, TypeScript 6.0.3, PostgreSQL, zod4, node:test, Playwright.
Spec: docs/superpowers/specs/2026-10-02-recipient-assessment-design.md

Global Constraints: max 10,000 members; batch <=100; signed cursor default25/max100; input max16KiB; no addresses/provider secrets; forced RLS/composite FKs; immutable observations/history; no delivery writes/frequency reservations/send quota/network; required current audience Owner/Admin plus campaigns and audience scopes; all13 release gates remain unaccepted; source base6df75a9; canonical/private untouched until qualification.

Review Focus: (1) stale authority and key revocation—storage DB tests; (2) mutable frozen membership and tenant forgery—storage DB tests; (3) crash/duplicate claim/cancel races—runtime DB tests; (4) lost acknowledgments/repeated clicks/navigation—UI recovery tests and actual browser; (5) response/cursor contracts and no-send accounting—root actual HTTP/browser and full suite.

Task1 domain worker owns src/domain/recipient-assessments.ts and tests/recipient-assessments.test.ts. Export strict RecipientAssessmentInput, RecipientAssessmentView, RecipientObservationView, RECIPIENT_ASSESSMENT_RULE_VERSION, evaluateRecipientObservation. Exact contracts supplied in dispatch. [ ] meaningful RED [ ] implement [ ] GREEN [ ] diff/handoff.

Task2 storage/runtime worker owns db/034-recipient-assessments.sql, src/server/recipient-assessments.ts, src/server/recipient-assessment-worker.ts, tests/recipient-assessments-db.test.ts. Export prepareRecipientAssessment(tx,p,campaign,input,key), assessmentDetail(tx,p,id), assessmentHistory(req,tx,p,campaign), assessmentObservations(req,tx,p,id), cancelRecipientAssessment(tx,p,id,key), processRecipientAssessmentBatch(tx,p). Root authorizes endpoints too; service independently rechecks authority/scope. Worker local CLI root-owned. [ ] RED actual restricted DB [ ] additive implementation [ ] GREEN recovery/RLS/no-send [ ] diff/handoff.

Task3 UI worker owns src/ui/recipient-assessments.tsx, src/ui/recipient-assessment-recovery.ts, tests/recipient-assessment-recovery.test.ts. Export RecipientAssessments({workspace,id,role,actor,version,digest}) and actor-bound recovery helpers. Actor via explicit prop; current UI actor threading root owns. [ ] recovery RED [ ] code [ ] GREEN [ ] diff/handoff.

Task4 root owns shared routes/http/pagination/API scopes/OpenAPI/SDK, UI mounting, scripts/CI/docs. [ ] method/scope RED [ ] integration [ ] actual owned fixture HTTP/browser [ ] lint/typecheck/API/full suite/build [ ] one independent whole diff review [ ] correct Important findings one wave [ ] qualify changed scope [ ] preserve main database snapshots/additive migrate [ ] fast-forward mirror/Desktop and hash/readability proof [ ] record exact evidence and remaining18/19 paths accurately.
