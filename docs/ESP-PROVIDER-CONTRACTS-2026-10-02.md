# Lettercape remaining ESP export contracts

Verified: 2026-10-02 UTC. Research only. Scope: PRD REQ-040/041, TECH-083, destination transformations, and section 7.1 export contracts. Source PRD: /Users/prabalpratapsingh/Desktop/mail/docs/Mailcraft-Development-PRD-v2.0.md.

## Environment and evidence boundaries

Native execution verified with `uname -s` → `Darwin`. `/tmp` verified as a filesystem symlink; this report is a native local file there. Only the specified PRD requirement/contracts excerpts were read. Public official developer/help documents were read through the web tool. No authenticated provider requests, account creation, credentials/environment inspection, purchases, code/DB/Git changes, send/test-send operations, or provider writes occurred. One unauthenticated public-document fetch from local Python failed at DNS; research continued through the web tool. No escalation was requested.

“Fact” means supported by the linked current official document. “Design recommendation” and “inference” are explicitly marked. An inaccessible schema or an unverified management link is a research gap, not proof the provider lacks it. Every real-account conformance gate remains unrun.

## Decision matrix

| Provider | Confirmed supported destination | Readback | Material prerequisite | Management deep-link evidence |
|---|---|---|---|---|
| Mailchimp | Classic reusable HTML template; campaign creation/content is a separate route | Template info/default editable sections; campaign content GET exists | Standard or higher for custom HTML; SaaS OAuth | Artifact-specific management link not verified from accessible documentation |
| HubSpot | Marketing email create using templatePath; coded template upload via CMS Source Code API | Marketing email GET; CMS file bytes/metadata GET | Legacy content scope lists Professional/Enterprise; exact per-endpoint grants and coded-email account eligibility need confirmation | Artifact-specific management link not verified |
| Brevo | Marketing campaign draft with inline HTML; separately inactive transactional template | Campaign and transactional template GET include HTML and modification timestamp | API-key route documented; OAuth currently private within own organisation | shareLink is social sharing, not draft management; exact management URL not verified |
| Omnisend | HTML template import or structured template; optional campaign draft copies template content | Template GET + render; campaign GET and content GET/render | Version 2026-03-15; explicit read/write scopes; OAuth provider provisioning; possible plan gate | Artifact-specific management link not verified |

These are separate capabilities. Do not label all four “template export” or infer that template creation creates a campaign.

## Mailchimp

**Facts.** Marketing API `POST /3.0/templates` creates Classic templates only. `GET /3.0/templates/{template_id}` retrieves template information; `PATCH` updates name, HTML or folder_id. `GET /3.0/templates/{template_id}/default-content` retrieves editable sections and their defaults, not a documented full original-HTML round trip. Campaign creation is `POST /3.0/campaigns`; campaign content has separate `PUT` and `GET /3.0/campaigns/{campaign_id}/content`. Sending, scheduling and testing are separate actions. [Template API](https://mailchimp.com/developer/marketing/api/templates/add-template/), [template info](https://mailchimp.com/developer/marketing/api/templates/get-template-info/), [default content](https://mailchimp.com/developer/marketing/api/template-default-content/).

**Facts.** Custom HTML templates require Standard or higher. The help guide requires UTF-8 and `*|UNSUB|*`; template edits can affect existing draft campaigns. [HTML import prerequisites](https://mailchimp.com/help/import-a-custom-html-template/). Audience merge fields may be renamed; `*|FNAME|*` is not guaranteed for every audience. [Merge fields](https://mailchimp.com/developer/marketing/docs/merge-fields/).

**Facts.** For access to other customers' accounts, Mailchimp instructs integrations to use OAuth rather than collect API keys. Register an app with a redirect URI; authorization-code exchange and metadata discovery provide the customer's data-center/server prefix. Tokens remain valid until revoked. The quick-start warns that API keys grant full account access. [OAuth](https://mailchimp.com/developer/marketing/guides/access-user-data-oauth-2/), [quick-start](https://mailchimp.com/developer/marketing/guides/quick-start/).

**Contract precision/gaps.** Preserve the returned template identifier as an opaque external ID plus account and server prefix. The accessible web rendering exposed operation descriptions but not the full request/response schema, so required create-body details, ID JSON type, HTML readback fields, and any returned `edit_url` field are not certified here. The official schema is linked by Mailchimp at [provider codegen schema](https://github.com/mailchimp/mailchimp-client-lib-codegen/blob/main/spec/marketing.json); its oversized/raw view was inaccessible in this research. Do not invent an edit URL from template ID. A templates landing page or archive/share link is not evidence of an artifact-specific management link.

**Independent implementable slice (design recommendation).** Implement Classic-template capability selection, Standard+ prerequisite display, destination HTML compiler preserving `*|UNSUB|*`, merge-field mapping, create/get/update transport behind an injected client, operation reconciliation and conflict fixtures. Pin the official schema before finalizing request/response decoding. Keep campaign export as a separate selected capability. Full fidelity needs destination preview/test-account validation; template-info success alone does not prove rendered parity.

**Provider/account-only blockers.** OAuth registration/grant, eligible test account and role, authoritative endpoint schema/deep-link confirmation, and real template/campaign rendering. Do not claim new drag-and-drop native editability.

## HubSpot

**Facts.** The legacy v3 guide documents `POST /marketing/v3/emails` with name, subject and templatePath, then `GET /marketing/v3/emails/{emailId}` or list GET. Example templatePath: `@hubspot/email/dnd/welcome.html`. The Enterprise/transactional-add-on restriction is explicitly for `/publish` and `/unpublish`. It does not establish that all draft creation requires Enterprise. The guide was modified April 13, 2026. [Marketing email guide](https://developers.hubspot.com/docs/api-reference/legacy/marketing/marketing-emails/guide).

**Facts.** The legacy scopes reference (modified September 2, 2026) lists `content` for CMS, calendar, email and email-events access with CMS Hub Professional/Enterprise or Marketing Hub Professional/Enterprise. It separately lists `marketing-email` for single-send access with Marketing Hub Enterprise or transactional add-on. Public apps request required/optional scopes; private apps configure scopes. [Scope/tier table](https://developers.hubspot.com/docs/apps/legacy-apps/authentication/scopes). **Gap:** the guide's expandable endpoint-scope panel was not present in extracted text; confirm the exact create/read/CMS endpoint scope set for the chosen platform rather than assuming the single-send scope is necessary for export.

**Facts.** CMS Source Code API supports `PUT /cms/v3/source-code/{environment}/content/{path}` using multipart field `file`, file-byte GET, metadata GET, and validation POST. `draft` is unpublished; `published` makes source changes live and clears the source draft. This source publication is distinct from marketing-email publication/sending. [CMS source-code guide](https://developers.hubspot.com/docs/api-reference/legacy/cms/source-code/guide).

**Facts.** Coded email templates use HubL. `{{ unsubscribe_link }}` targets subscription preferences; `{{ unsubscribe_link_single }}` targets one subscription type; `{{ unsubscribe_link_all }}` targets all types. Place link variables in href. Templates require company/address information. The markup example adds `class="hubspot-mergetag" data-unsubscribe="true"`. [HubL variables](https://developers.hubspot.com/docs/cms/reference/hubl/variables), [email markup](https://developers.hubspot.com/docs/cms/start-building/building-blocks/templates/email-template-markup).

**Contract precision/gaps.** Save marketing-email ID plus portal/account, templatePath, and separately any CMS metadata identifier. The create guide does not expose a full content-injection/readback response schema or an object-specific management URL. No raw-HTML field or URL formula is asserted here. A draft referencing HubSpot's welcome template does not prove export of Lettercape's frozen HTML. The published official [legacy API schema](https://developers.hubspot.com/docs/specs/legacy/v3/marketing-marketing-emails-v3.json), discovered through the official documentation index, was inaccessible via the tool.

**Independent implementable slice (design recommendation).** Build a compiler for a Lettercape-owned coded template with HubL footer, template-path ownership, source validation/upload/readback and draft-create/get orchestration behind fixtures. Gate customer availability until the portal supports the coded-email route and its exact scopes. Prefer immutable versioned template paths so updating a shared source cannot change existing customer drafts. Validate whether source must be published before templatePath can be used; do not infer draft source is selectable.

**Provider/account-only blockers.** Eligible marketing/design-manager portal, consent and exact required scopes, coded-email entitlement, real rendered draft/content injection and management link. No purchase/publication/send is authorized by this research.

## Brevo

**Facts.** `POST /v3/emailCampaigns` creates a draft by default. Required name/sender; pass either sender.id or sender.email, never both. Use exactly one of htmlContent, htmlUrl or templateId; standard non-A/B campaigns require subject. Recipients and scheduledAt are optional. The create response is numeric `id` (201). A narrow export can omit audience and scheduling. The reference describes templateId specifically as active transactional-template content copying for RSS; inline HTML is the clearest regular-marketing route. [Create campaign](https://developers.brevo.com/reference/create-email-campaign).

**Facts.** `GET /v3/emailCampaigns/{campaignId}` returns id, status, htmlContent, sender, createdAt/modifiedAt and other data. Do not set excludeHtmlContent=true for content verification. `shareLink` is for social sharing, and unsent classic campaigns return a descriptive message instead of a URL. It cannot satisfy draft management handoff. [Campaign readback](https://developers.brevo.com/reference/get-email-campaign).

**Facts.** `POST /v3/smtp/templates` is transactional-template creation, requiring sender, subject, templateName and content (htmlContent or htmlUrl). It is inactive unless isActive=true. `GET /v3/smtp/templates/{templateId}` returns numeric ID, HTML, isActive and timestamps; it can address a custom template identifier if assigned. [Create transactional template](https://developers.brevo.com/reference/create-smtp-template), [template readback](https://developers.brevo.com/reference/get-smtp-template).

**Facts.** API-key header authentication is documented. Current OAuth docs explicitly limit apps to users within the app's own Brevo organisation; public distribution is planned. OAuth write does not imply read. Thus current public docs do not establish cross-customer SaaS OAuth availability. [Authentication](https://developers.brevo.com/docs/authentication-schemes), [OAuth restriction](https://developers.brevo.com/docs/oauth). The create references do not name a paid minimum plan; absence of a gate in them is not proof of all-plan/account eligibility.

**Facts.** Native HTML unsubscribe contract: `<a href="{{ unsubscribe }}">…</a>`. Marketing unsubscribe links are required; removing one triggers provider restoration at send time, which can alter the design/language. Native other email tokens include `{{mirror}}` and `{{update_profile}}`. [HTML unsubscribe](https://help.brevo.com/hc/en-us/articles/209553645-Insert-a-custom-unsubscribe-link-in-your-emails), [template language](https://help.brevo.com/hc/en-us/articles/360000946299-Personalize-your-messages-with-dynamic-content-Brevo-Template-Language).

**Independent implementable slice (design recommendation).** Prioritize campaign-draft export with inline frozen HTML, native unsubscribe, explicit sender selection, no recipients/scheduledAt and readback asserting draft/HTML/subject. Keep inactive transactional-template export separately named. Provide auth-mode capability gating; API-key client fixtures can be implemented without handling actual credentials now. Persist numeric remote ID as an opaque normalized value, account identity, modifiedAt and canonicalized content hash. Exact artifact-specific management URL remains unverified; never use shareLink as a substitute.

**Provider/account-only blockers.** Cross-customer OAuth path or deliberately scoped API-key connection design, approved customer access and sender, exact plan/account limits, real footer/personality tests, management-link evidence.

## Omnisend

**Facts.** With version `2026-03-15`, `POST /api/email-templates/import` accepts required name (1–255 chars) and html, body ≤1 MB, returning an imported template (201). Scope: `email-templates.write`, 400 requests/minute. [Import endpoint](https://api-docs.omnisend.com/reference/post_email-templates-import).

**Facts.** The import API extracts head styles and wraps body content as an HTML code block. Structured creation instead uses sections → rows → columns → blocks; custom code uses htmlCode. This does not convert arbitrary HTML to native editable blocks. [Template model](https://api-docs.omnisend.com/reference/email-templates). The separate UI import help says remove DOCTYPE/head, remove previous-provider personalization/browser/unsubscribe links, and Omnisend adds its own versions. **Inference:** UI and API import transformation expectations differ; maintain separate fixtures and test API behavior rather than apply UI stripping blindly. [UI import](https://support.omnisend.com/en/articles/2964086-import-custom-html-email-templates).

**Facts.** `GET /api/email-templates/{id}` requires email-templates.read; IDs are 24-character hexadecimal. Template render `POST /api/email-templates/{id}/render` requires write and is limited to 40/minute. Creation documentation also lists a 402 response for unavailable plan features without naming a minimum tier. [Template read](https://api-docs.omnisend.com/reference/get_email-templates-id), [render](https://api-docs.omnisend.com/reference/post_email-templates-id-render), [structured create](https://api-docs.omnisend.com/reference/post_email-templates).

**Facts.** Campaign `POST /api/campaigns` creates a draft using campaigns.write. Regular email content uses subject, senderName and templateID. Creation copies the template and returns contentID for later content edits. `GET /api/campaigns/{id}` uses campaigns.read; ID is 24-character hexadecimal. Absent verified default sender causes 422; only drafts can be edited (409 otherwise). Omitted/empty includedSegmentIDs means all subscribers. Sending is a separate endpoint; test-email is also separate. Billing restrictions at send time do not prove draft creation requires a paid plan. [Campaign create](https://api-docs.omnisend.com/reference/post_campaigns), [campaign read](https://api-docs.omnisend.com/reference/get_campaigns-id), [campaign semantics](https://api-docs.omnisend.com/reference/campaigns).

**Facts.** Native personalization uses `[[contact.first_name]]` and supports fallback filters. Unsubscribe is `[[unsubscribe_link]]`; preferences are `[[preference_link]]`. Test emails lack real contact data, so test-email output alone cannot prove recipient personalization. [Personalization contract](https://support.omnisend.com/en/articles/1061845-use-personalization-in-omnisend).

**Facts.** API key uses `Authorization: Omnisend-API-Key …`; OAuth uses Bearer; every request requires version header. OAuth credentials require an official form and provider response stated as 1–3 business days; endpoint scopes must be requested. [Auth](https://api-docs.omnisend.com/reference/authentication), [OAuth provisioning](https://api-docs.omnisend.com/reference/oauth).

**Independent implementable slice (design recommendation).** Begin with HTML template import, GET and render; persist template ID, version and readback hash. Optional campaign draft creation is a separately selected second step, persisting campaign ID and contentID independently. Reconcile each write independently; a template success plus campaign failure is partial success, not a campaign export. Do not call send/test endpoints. Do not silently choose an audience for handoff. Native recipient/footer fidelity and a management URL remain real-account gates.

**Provider/account-only blockers.** OAuth provisioning/brand grant, precise plan entitlement for template operations, verified sender for campaigns, real API import/render/footer behavior and remote management link. Full response schemas are partly client-rendered; capture schema and fixture for IDs and optional link fields before decoder acceptance.

## Concrete independent next work

This is preparation scope, not completed implementation:

1. Define provider/object capability records separating reusable-template, campaign-draft, source-template, readback, render, update and deep-link support. Unknown capability must remain unknown.
2. Implement destination compilers from a frozen revision using the verified native tags above; remove Lettercape recipient trackers and foreign-provider footer tags. Save mapping version and transformations.
3. Build injected HTTP-client adapters and synthetic documented-shape fixtures for Brevo and Omnisend first. For Mailchimp/HubSpot, fetch exact schemas before freezing response parsing; endpoint orchestration can be scaffolded while that remains unresolved.
4. Require ownership/account check and readback comparison before update. Snapshot normalized remote content plus available modifiedAt; these are evidence, not atomic concurrency guarantees. No ETag/conditional-write support was verified here.
5. Store source revision, job correlation, object type, remote ID(s), account, provider/API/mapping version, remote fingerprint, reconciliation state, and link evidence source. A timeout after POST is outcome_unknown; no blind second POST.
6. Keep “artifact created and verified” distinct from “handoff ready.” REQ-040 requires an external ID and deep link. Until an actual documented/provider-confirmed or authorized-account-verified artifact management link is available, strict REQ-040 remains incomplete even when creation/readback works.
7. Provider conformance gates: authorized test accounts, entitlement denial, grant/scope denial, revoked connection, rate limit, accepted-write timeout, duplicate retry, remote edits, native merge/unsubscribe behavior, hosted assets, render parity and management-link opening. These require future explicit account/test-send authorization where applicable; none ran here.

## Evidence status and provider questions

No provider lacks a template/draft export route on the evidence reviewed. The main uncertainty is fidelity and handoff completeness, not mere endpoint existence.

Ask providers/account owners for: exact plan/permission matrix; complete current response schemas and returned management URL fields or an officially supported artifact URL; supported retries/idempotency/conditional writes; template copy/update effects; and authorized test accounts. For Brevo additionally confirm a public OAuth integration path; for HubSpot confirm coded-template → marketing draft content injection and source-publication requirements; for Omnisend confirm API versus UI footer/import transformations and feature-plan 402 conditions.

A guessed browser route is not a provider contract. HTML download remains useful fallback, but does not mark the native ESP acceptance gate complete.


## Mailchimp schema follow-up (2026-10-03 UTC)

The native executor subsequently resolved the full official Marketing API schema from the [official codegen repository](https://github.com/mailchimp/mailchimp-client-lib-codegen/blob/main/spec/marketing.json): version3.0.91,10769438bytes, SHA256374046a5209daa8d68cdb5dd7e0244fcf214928af4321ff539755849641b9a21. Template POST200 has a numeric ID; required body is name/html. Template GET metadata exposes no uploaded HTML; default-content is editable sections. A sharing URL does not establish a management link. The earlier full-schema access gap is resolved; account/content-fidelity/deep-link acceptance remains open. See MAILCHIMP-EXPORT-CHECKPOINT.md for local implementation and qualification.

## Omnisend exact-schema follow-up (2026-10-03 UTC)

The native executor materialized the exact Markdown URLs published by the official llms.txt index. Import POST /api/email-templates/import requires name/html and returns201 Template; GET uses a24hex ID. The mandatory Omnisend-Version header is2026-03-15; schema info.version5.0 is not that header. Import total body is1MB; local preparation conservatively treats it as1,000,000 serialized JSON UTF8 bytes with a worst permitted255-unit well-formed name reserve. Native footer is [[unsubscribe_link]]; unknown authored tokens and conditional [% ... %] syntax are refused. [Import contract](https://api-docs.omnisend.com/reference/post_email-templates-import), [GET contract](https://api-docs.omnisend.com/reference/get_email-templates-id), [personalization](https://support.omnisend.com/en/articles/1061845-use-personalization-in-omnisend).

Template GET exposes id/name/sections/generalSettings/createdAt/updatedAt, not frozen uploaded HTML. Import extracts head styles and wraps body as htmlCode. Render200 is an arbitrary string-valued JSON map with no specified HTML property; no field is invented or called by this slice. Exact import/GET identity therefore remains needs_attention/EXPORT_IMPORT_CONTENT_UNVERIFIED with content_verified:false and destination_url:null. API resource URLs are not management links. The earlier full-schema access gap is resolved; account grants, plan eligibility, native transformations/size boundary/client fidelity and an artifact management link still require qualification. [Render contract](https://api-docs.omnisend.com/reference/post_email-templates-id-render), [template model](https://api-docs.omnisend.com/reference/email-templates).

Materialized operation subset SHA256 b79b71797842f86e9e65ecb54fd9001f3ad2c77ea4a8c27a2a0df08ef2061d1a; raw import/get/render/model SHA256 respectively0fd7714597c198dbb3fd7a1d51a54bfe314c5577a4572b342645d09376c12f2f /82454445088498b80402335a211191744fc5146a820d065763688e3a960f0655 /1d1c17dcda6513209ed52bf5a8cfba9c9da7fc11c0ab771f929c29523eb7b443 /5fa5144b0ecf26161fa34c4eb09835c6f85506e6c630ce60b9d3e36bf1cd9068. No real provider traffic or account configuration occurred.
