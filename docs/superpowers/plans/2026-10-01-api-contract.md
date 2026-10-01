# Versioned API and SDK implementation plan

**Goal:** Advance REQ-048/TECH-060/061 with an actual OpenAPI3.1 contract and generated typed TypeScript client for implemented routes; preserve all unfinished GA command families.
**Architecture:** Shared tenant/actor/resource/filter-bound signed cursor pages use exact database timestamps and stable created_at/id order. OpenAPI schemas reuse current domain schemas and disclose disabled provider commands. Isolated OpenAPI tooling generates runtime-free types; app/compiler stay TypeScript6. A dependency-free fetch SDK retains command keys on bounded safe recovery, propagates request IDs/errors, supports aborts and signed pagination, and never follows cross-origin redirects with credentials.
**Spec:** authoritative Mailcraft-Development-PRD-v2.0.md REQ-048, TECH-060/061, TST-12. No SDK package publication or live provider activation.

## Steps
- [x] Write failing behavioral SDK recovery and actual HTTP cursor tests; verify failures before implementation.
- [x] Generalize signed pagination for supported resource lists with strict limit, tenant/account/filter binding, tie-break precision, stable insert traversal and explicit UI paging.
- [x] Produce versioned OpenAPI3.1 request/response schemas, examples and covered route-method inventory; validate examples with JSON Schema2020-12 and generator document validation. Track future/blocked command families explicitly.
- [x] Generate TypeScript operation types, build a credential-safe bounded fetch client with same-key retries, request IDs, typed commands/download and async page iteration. Verify transport loss, rate delay, business error no retry, interruption and page loops.
- [x] Real HTTP/Chromium contract/paging/SDK verification, full checks, one fresh whole-slice review and one Important/Critical fix pass. Document remaining GA obligations and sync a tested local checkpoint; ordinary GitHub checkpoint publication authorized by the human repository instruction; verify remote CI separately.

## Rulings
- Dev generator uses a separately locked TypeScript5 toolchain because openapi-typescript7 has an explicit TypeScript5 peer range; no force/legacy peer bypass or application downgrade.
- Production source/public package ownership and package-name approval remain owner requirements; development SDK source is usable locally and not published to npm.
- Existing static/aggregate audience schema is bounded; dedicated catalogs/large builder work remains required, never claimed covered by cursor resource endpoints.
