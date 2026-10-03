# Omnisend HTML Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task.

**Goal:** Add integrity-bound local Omnisend preparation and a conservative unmounted import acknowledgement primitive.
**Architecture:** Existing shared frozen validator, destination GET/UI lifecycle and strict generated contract extend by a third discriminant. Compiler and server transport are disjoint; root integrates and qualifies the whole slice.
**Tech Stack:** Existing Next16/React19/TypeScript/Postgres; no new dependencies.
**Spec:** docs/superpowers/specs/2026-10-03-omnisend-export-design.md

## Global Constraints
- Full65 BaselineA/all13 gates/zero whole accepted; no real provider/OAuth/spend/sends/push/deployment.
- OMNISEND_MAPPING_VERSION='omnisend-html-import-1', OMNISEND_API_REVISION='2026-03-15', OMNISEND_IMPORT_BODY_LIMIT=1000000.
- Native footer [[unsubscribe_link]], name255 well-formed UTF16 units, exactJSON{name,html}, metadata never content/handoff verification.
- Owned loopback fixture DBs only; original/private files/data and both earlier mappings preserved.

## Review Focus
- JSON escaping, Unicode/name reserve and actual serialized bytes at request boundary ->Task1 reserve tests/Task2 exactlimit beforeIO.
- Omnisend conditional/native/foreign token ambiguity ->Task1 refusal tests.
- Partial create metadata or cancellation after trustedID ->Task2 identity persistence and shared budget tests.
- Returned shape/link/render-key fabrication ->Task2 metadataonly/sanitization tests.
- Selection away/back during initialfreeze, including failedack ->Task3 actual browser generation/error/adoption regression.

### Task1: Omnisend compiler and client-safe review
Files create src/domain/omnisend-export-contracts.ts, src/domain/omnisend-export.ts, tests/omnisend-export.test.ts. Consumes validateFrozenExportSource(r):Promise<{footerCount:number}>, FrozenExportRevision from existing domain module. Produces OmnisendArtifact with same common fields as MailchimpArtifact and destination:'omnisend'; async compileOmnisendArtifact(r):Promise<OmnisendArtifact>; omnisendReview(a):OmnisendReview. Browser-safe constants/schema exact values/7blockers in spec.
- [x] Write real compiler tests: exactslot mapping/UTF8/destination hashes/sourceimmutability/reorderedJSONB/allmanifest corruption/refusedraw/private/footer/unknownnativeconditionaltokens/bodyescaping-reserve and strict contentfree review. Existing Klaviyo/Mailchimp tests unchanged.
- [x] Run owned tests against unimplemented behavior and retain meaningful RED.
- [x] Implement only owned files against spec; no shared validator refactor.
- [x] Run owned + existing compiler/Klaviyo/Mailchimp regression; scoped lint/type when interface is available.
- [x] Commit only owned files; full handoff report in plan scratch, no reviewer/subagents.

### Task2: Unmounted Omnisend import transport
Files create src/server/omnisend-template-adapter.ts, tests/omnisend-template-adapter.test.ts. Consumes Task1 OmnisendArtifact/interface/constants. Produces createAndInspectOmnisendTemplate(o):Promise<OmnisendTemplateResult>, options artifact/name/accessToken/signal?/required markSubmission:()=>Promise<void>/required persistRemoteId:(id:string)=>Promise<void>/fetcher?:typeof fetch. Result state needs_attention|outcome_unknown, code,remote_id:string|null,resource_url:string|null,destination_url:null,content_verified:false,retry_after?:number. Never mounts.
- [x] Write injected-fetcher tests: exactPOST/namehtml/versionBearer/noextraIO; beforeIO completevalidation/exactbodylimit/JSONescaping/nameUnicode; captured callbackmutation; partial24hexID beforeGET; knownID allfailures; metadataonly/unsolicitedhtml/links; HTTPuncertainty/rate/auth/version/size; foreignorigin/path/redirect/userinfo; 5MiB response streaming/abort/signalignoring/late-response/30sec combined budget. Real compiled artifact fixtures for normalpaths.
- [x] Run scaffold behavioral RED; retain failures.
- [x] Implement exact spec independently within owned files; no generic shared-helper change.
- [x] Run owned tests/scoped lint/type; full no secrets/DB/provider report, then scoped commit.

### Task3: Root integration and qualification
Modify src/server/esp-export-review.ts, src/ui/editor.tsx, src/ui/klaviyo-export.tsx, scripts/generate-api.ts,public/openapi.json,sdk/schema.d.ts,tests/esp-export.test.ts,package.json,.github/workflows/verify.yml; create scripts/smoke-omnisend-export.ts. Existing122operations and earlier mapping behavior preserved; strictdest/media/mapping unions expand. Show exact honest Omnisend import notice and selector; generation fences allselected intervals. Saved worker joint spec+quality review precedes wholeintegrationgate.
- [x] Run actualrootHTTP/ChromiumRED then all third-destination and both earlier fixtures incl initialfreeze away/back/error/download/navigation/mobileness.
- [x] Implement integration/contracts/CI/docs, then fullconfiguredsuite/lint/type/API/build/Linuxchecks.
- [x] Freeze immutablewholebaseline-to-candidate patch; one mostcapable whole reviewer; iffindings onecompleteworker +onescopedrereview.
- [ ] Guarded canonical sync/buildchecks/both prior+thirdbrowser/original109/221/private/hash preservation; restoreowned apps/keepunrelated.
- [ ] Commit completehandoffs/reviews/ledger/rulings/evidence to checkpoint before removing only thisplan's scratch. Product/fullGA remains pending.
