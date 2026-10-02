# Locale comparison and selected manual text development checkpoint — 2026-10-02

All65 requirements/all13 Baseline A gates remain binding, zero entire requirement/gate accepted. REQ025/026/TECH034/JRN05 remain partial. Base5d310e6 has completed exact-source canonical qualification; this independent local increment adds manual comparison and selective text copying. No AI translation/provider success or language review is implied.

## Delivered behavior

GET `/v1/emails/{id}/locale-source` returns the original immutable parent revision, current parent draft and saved linked locale child. Forced-RLS/composite lineage identifies the parent; caller cannot substitute a source. Current authority is locked/reread, actual actor/workspace/version identities are strict and an optional actor header rejects mismatch. Viewer/read-scoped access is permitted; nonlocale409, foreign/missing404 and unsupported methods405 are explicit. JSON is no-store. Comparison makes no email/revision/audit/idempotency/source-lineage mutation.

The three escaped specs share8MiB response admission before response serialization. Oversized comparison returns413 while exact source/draft remains intact. Validating/serializing the three individually bounded documents still allocates/uses CPU before this aggregate decision; it is a local comparison limit, not a process-memory/distributed throughput SLA. No source text enters diagnostics/general logs.

The UI displays original/current source and local language draft as React text. No field is selected by default. Only changed subject/preheader or same-ID/same-type existing hero heading/body, text body, CTA label and product title/description text can be copied. Unselected translations, URLs, offer prices/currency, image registry, layout, brand, locale/direction, legal/footer and authored custom/raw source remain unchanged. Structural additions/removals/type changes, image/custom/nested/raw/legal content are visible read-only. Source text is explicitly untranslated; review and translation remain required.

Copying rereads saved child/current parent and refuses any observed comparison drift; local editor changes invalidate the view. Synchronous task admission, abort/generation/token ownership and fenced catch/finally prevent repeated/delayed/navigation effects. Failed refresh hides old comparison/selection. The parent editor independently checks actual lifecycle/actor/document/spec/role/conflict/pending state before mutation. Copying changes only local editor state; existing actor-scoped recovery, strict original-command CAS save/current-head receipt, Undo/history and approval-invalidating spec changes handle durable persistence. It does not advance original lineage, mark source current/reviewed, create an AI proposal or approve the locale. A parent change after the recheck returns remains a later change; this is manual local copy, not an atomic parent-and-child source-review command.

The original immutable lineage remains stale after manual copying. Actual input-revision/reviewer provenance for translated proposals, qualified review/history, selected AI updates, locked terminology/merge slots, recipient locale fallback, app language, overflow/glyph/RTL golden/20-client acceptance and source-review baseline transitions remain required. Large raw comparisons may be refused. Browser snapshots and comparing multiple full specs have material memory/CPU costs. This does not reopen the frozen source or media reviews: sourceM1 and six inherited media Minors remain deferred/disclosed, including bundled DOMPurifyLow independent of npm's graph audit.

## Root code inspection and rulings

This is root author inspection, not an independent reviewer or GA signoff. No agent was spawned/resumed for this increment.

| Boundary | Ruling and practical limit |
| --- | --- |
| Scope | Full PRD retained, no requirement/gate promotion or export-only sequencing |
| Canonical truth | Original source revision and current parent/child come from actual restricted DB; client cannot provide lineage |
| Authority | Workspace/member/session/key and read scope rechecked and locked; account header is a fence, no delegation |
| Comparison writes | Actual before/after versions/specs/revision/audit/idempotency counts unchanged |
| Size |8MiB escaped aggregate; actual1.5MiB quote-source rejection leaves source bytes/hash/version unchanged; pre-decision allocations remain bounded but not load-qualified |
| Exact/inert source | Hostile custom/raw text displayed through React/pre, no unsafe HTML or remote request; source storage bounds unchanged |
| Text selection | Stable same-ID/type field admission; URLs/prices/legal/assets/layout cannot be selected; duplicate/unknown/current-ineligible selectors refuse |
| Manual copy | Explicit source-language text, default none; no translation/review/freshness/approval fabrication |
| Source drift | Fresh actual parent/target compare before local apply; later changes stay later changes and existing source lineage remains outdated |
| Target drift | Full local-spec token plus parent editor guard; durable save uses existing CAS/strict original receipt |
| Repeated actions | Synchronous busy admission; actual repeated comparison one read and repeated copy one version |
| Async ownership | Commit-phase token/generation, abort and owned catch/finally; delayed typing/navigation cannot repopulate old comparison |
| Read errors | Old comparison/selection hidden; explicit retry, target unchanged |
| Role/mobile | Viewer reads without selection/apply, existing editor readonly;390px/Hebrew no overflow in actual browser; not RTL/client golden acceptance |
| UI validation | Initial React ref/setState-effect lint failures corrected with committed-layout ownership and fenced microtask reset, without lint suppression |
| Toolchain | Existing exact toolchain copied locally; generator-only setup symlink excluded. No dependency/lock version change |
| API |115 generated operation contracts; shared EmailSourceSpec refs avoid triplicated SDK document types; shape validation plus actual identity/semantic server checks |
| CI ownership | Owned source/locale fixture apps run/stop before shared primary Next dev lock. YAML parses/order checks pass; actual remote exact-head CI remains open |
| Linux | Current app/API/assets UID1001/private exclusion and actual closed-startup exit1 pass; no deployment qualification |
| Evidence |431/431 zero skips; actual fixtures/providers distinction retained, no readied/scanned/provider/sending/billing state fabricated |
| Remaining acceptance | Immutable locale proposal input/reviewer/update-baseline history and real provider/client/consent/economics/legal/ops gates open |

## Validation evidence

Focused initial4tests passed. Initial aggregate passed429/431 with two intentional optional IndexedDB/native-decoder skips because their flags were omitted; corrected explicit native run passes431/431 with zero fail/skip. Build/lint/type/API115 pass. First API generator run failed because its separate installed toolchain was not yet linked; existing pinned toolchain linked, no dependency change. First YAML check requested an absent optional yaml module; existing js-yaml parses and verifies owned fixture lock order. These setup failures are retained; no permission/connection wait remained stalled.

Actual owned Chromium runs pass parent drift refusal, default-none/repeated comparison, strict HTTP/actor methods, no read mutation, manual selected copy/repeated save/reload, unselected translations/URL/price/legal/locale/source retention, original stale lineage,503 retry, delayed newer typing, unchanged source empty state, Hebrew mobile, held navigation, Viewer read-only, hostile source inertness, zero external calls and zero page errors. All generated databases/apps were cleaned/stopped. Root visually inspected the390px screenshot.

Full source receipt/fragment refusal plus original editor/Monaco/conversion/pointer+keyboard/UTM/preflight regressions pass. Full inherited Monaco still has two unexplained404 diagnostics and zero uncaught errors. New Docker image `lettercape-locale-check:native`, config SHA256 `7412cba58c87fbeb1d88483e3c15a2c6b156c1f6ba558e8581e36f5d861cb651`, has actual compareLocaleSource API/current3846 asset base/UID1001/private-artifacts false and production refusal exit1. No live model/provider/send/billing, paid commitment, remote push or public deployment occurred.

| Native evidence | SHA256 |
| --- | --- |
| `/tmp/lettercape-locale-focused1.log` | `a7bcf6dce21baff4436044549c9b41ec92ca13ce967a89b6d4808a9320708d61` |
| `/tmp/lettercape-locale-suite1.log` | `8bf2a95aa59b39a0ced2a00a1bbcd334021f897c46eb30df17bc95a2c035f4ca` |
| `/tmp/lettercape-locale-suite2.log` | `cf129b8fe2e0fd82c52f647c2d6896dce57497ded8e42e37864c3d82e7005e33` |
| `/tmp/lettercape-locale-browser1.log` | `3dc46a7f478051626e0b1017f866d99ac79d5110d63116d4fee5388e46e84ef2` |
| `/tmp/lettercape-locale-browser2.log` | `68a0d30fbf2b47f2bf5ec85fd731cb5303c5ebc8b25cdddcc5640bc2445680b5` |
| `/tmp/lettercape-locale-mobile.png` | `1020bcad908372cf5cc30cb61994e8d5865d986e0496368ebaecf6b4aa1b27e4` |
| `/tmp/lettercape-locale-api-generation.log` | `197d85042af8f246090a4716e62199873ad813d1f63b1e8f0e391dabf5e87874` |
| `/tmp/lettercape-locale-api-final.log` | `c1df945026ca3e0bbafeac88754e45e319958cc63f173155cb28733cedfc91df` |
| `/tmp/lettercape-locale-type3.log` | `e11c3d59ab9d9aabaa73e552f5ae5dca4fb95a39e0ae3d568aa0d9e41b5bcaa6` |
| `/tmp/lettercape-locale-lint1.log` | `daa61337717187ed44ad4c5f21acdd81418a814e7a55e2df0326502e6f6650fe` |
| `/tmp/lettercape-locale-lint4.log` | `177e308fb34c67e35b7e5d386753d3db49bdb519b9ccb1b1f223066b4372f746` |
| `/tmp/lettercape-locale-build1.log` | `21c3294b8ff687fa01ea6497506fa66ff63bfcccc4730cd98accdef9da481715` |
| `/tmp/lettercape-locale-source-regression.log` | `f018c118ec7df1ad739b5b899fedbd6105a2b71f7c1ae732df88694f50932c3b` |
| `/tmp/lettercape-locale-fragment-regression.log` | `3a544c4f4397cafc21e46feaab8e9e67240f5c619518a0a47d927b3c26cfbf7f` |
| `/tmp/lettercape-locale-baseline-regression.log` | `5167b49ce56f7521c4e4a8fc657dcc396db961882ba758aa9ecd958e4f3bac19` |
| `/tmp/lettercape-locale-linux-build.log` | `1fff36373cf5ebe6b8b53cf92fdda1891e0bc4d183f092ff2078a7648279ddf7` |
| `/tmp/lettercape-locale-linux-assets.log` | `46c856999608c58f9b8b83f2d6605a8954daab9161be3618a3241f6984aaaa76` |
| `/tmp/lettercape-locale-linux-startup.log` | `e331306af1367c23fa850fb3f6d9708b5f8bba6bf376512ce7139dd1516c5754` |

Canonical integration and executable commit follow below. Publication remains paused: automatic review rejected the prior ordinary main push as unverified external private-source egress under the original no-push instruction; direct native permission is unanswered. All13 production gates/current-head remote CI remain open.
