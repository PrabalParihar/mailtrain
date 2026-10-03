import {HubSpotFooterSettings,HubSpotReview,HubSpotReviewInput,HubSpotArtifactInput,HUBSPOT_MAPPING_VERSION,HUBSPOT_COMPARISON_VERSION} from '../src/domain/hubspot-footer-contracts';
import {SubmissionLedgerInput,SubmissionLedgerView,StagedRecipientView,DeliveryHistoryView,DeliveryAttemptView} from '../src/domain/submission-ledgers';
import {LocaleReviewInput,LocaleReviewRecord,LocaleReviewContext,LocaleReviewHistoryItem} from '../src/domain/locale-content-review';
import {SaveEmailTemplateInput,ArchiveEmailTemplateInput,RemixEmailTemplateInput,EmailTemplateViewSchema} from '../src/domain/email-templates';
import{KlaviyoReview,KLAVIYO_MAPPING_VERSION}from'../src/domain/esp-export-contracts';
import{MailchimpReview,MAILCHIMP_MAPPING_VERSION}from'../src/domain/mailchimp-export-contracts';
import{OmnisendReview,OMNISEND_MAPPING_VERSION}from'../src/domain/omnisend-export-contracts';
import{BrevoReview,BREVO_MAPPING_VERSION}from'../src/domain/brevo-export-contracts';
import {RecipientAssessmentInput,RecipientAssessmentView,RecipientObservationView}from'../src/domain/recipient-assessments';
import{ConversionProposalInput,ConversionAcceptInput,ConversionProposalSchema}from'../src/domain/email-conversion-contracts';
import{WorkspacePreferences,WorkspaceTimezoneInput,CalendarEntry,CalendarMonth}from'../src/domain/workspace-calendar';
import {SenderDraftInput,SenderVersionInput,SenderCheckInput,SenderView,SenderVersionView,DNSObservation,DNSCheckView} from '../src/domain/sender-domain';
import{CampaignConfigurationInput,CampaignConfigurationSnapshot,CampaignConfigurationView}from'../src/domain/campaign-configuration';
import { AudienceSnapshotMetadataSchema } from '../src/domain/audience-snapshots';
import{CreationMetadata,CreationAttempt,CreationSummary,CreationType}from'../src/domain/creation-history';
import { Membership,MembershipChange,MembershipSummary,RoleChangeInput,RemoveMemberInput,TransferOwnerInput } from '../src/domain/memberships';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { BrandSchema } from '../src/domain/brand';
import{BrandSourceInput,BrandSource,BrandMemoryChunk,BrandMemoryContext,MemoryPreviewInput}from'../src/domain/brand-memory';
import { EmailSpecSchema, blankSpec } from '../src/domain/email';
import { KeyInput } from '../src/domain/api-keys';
import {EmailSourceSpecSchema} from '../src/domain/email-schema';
import {SaveReceiptSchema,SavedEmailResponseSchema,SourceProfileSchema} from '../src/domain/email-source-contracts';
import {MAX_RAW_SOURCE_BYTES,MAX_SOURCE_COMMAND_JSON_BYTES} from '../src/domain/email-source-values';
import { MEDIA_LIMITS, UploadIntentInput, AssetMetadataSchema, UploadIntentResponseSchema, UploadContentResponseSchema, FallbackInput, FallbackResponseSchema } from '../src/domain/assets';
import { MappingSchema } from '../src/domain/contact-import';
import { FieldSchema, RuleLeafSchema } from '../src/domain/segments';
import{WebhookDelivery,WebhookAttempt,WebhookReplayInput,WebhookDeliveryState}from'../src/domain/webhook-history';
import { WebhookEndpointInput, WebhookVersionInput, WebhookRotateInput, WebhookEndpoint } from '../src/domain/webhooks';
import { EventEnvelopeShape, EventType } from '../src/domain/events';
import { DispatchPolicyInput, DispatchProvider } from '../src/domain/dispatch-controls';
import { RemixInput, LocaleDraftInput } from '../src/domain/derivation';
type Schema = Record<string, unknown>;
const uuid = { type: 'string', format: 'uuid' },
  string = { type: 'string' },
  integer = { type: 'integer' },
  time = { type: 'string', format: 'date-time' },
  json = { type: 'object', additionalProperties: true };
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
  extra = true,
): Schema => ({ type: 'object', properties, required, additionalProperties: extra });
const ref = (name: string) => ({ $ref: '#/components/schemas/' + name });
const array = (items: unknown) => ({ type: 'array', items });
const nullable = (schema: unknown) => ({ anyOf: [schema, { type: 'null' }] });
const fromZod = (schema: z.ZodType) =>
  z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as Schema;
const schemas: Record<string, Schema> = {
  LocaleReviewInput:fromZod(LocaleReviewInput),
  LocaleReviewRecord:fromZod(LocaleReviewRecord),
  LocaleReviewContext:fromZod(LocaleReviewContext),
  LocaleReviewHistoryItem:fromZod(LocaleReviewHistoryItem),
  SubmissionLedgerInput:fromZod(SubmissionLedgerInput),
  SubmissionLedgerView:fromZod(SubmissionLedgerView),
  StagedRecipientView:fromZod(StagedRecipientView),
  DeliveryHistoryView:fromZod(DeliveryHistoryView),
  DeliveryAttemptView:fromZod(DeliveryAttemptView),
  SaveEmailTemplateInput: fromZod(SaveEmailTemplateInput),
  ArchiveEmailTemplateInput: fromZod(ArchiveEmailTemplateInput),
  RemixEmailTemplateInput: fromZod(RemixEmailTemplateInput),
  EmailTemplateView: fromZod(EmailTemplateViewSchema),
  HubSpotFooterSettings:{...fromZod(HubSpotFooterSettings),description:'Seven explicit locally declared footer values. Server validation additionally enforces composed address length, well-formed Unicode, controls, nonblank required values and authored delimiters; JSON Schema omits these refinements.'},
  HubSpotReview:fromZod(HubSpotReview),
  HubSpotReviewInput:fromZod(HubSpotReviewInput),
  HubSpotArtifactInput:fromZod(HubSpotArtifactInput),
  HubSpotMappingVersion:fromZod(z.literal(HUBSPOT_MAPPING_VERSION)),
  HubSpotComparisonVersion:fromZod(z.literal(HUBSPOT_COMPARISON_VERSION)),
  HubSpotReviewResponse:fromZod(z.strictObject({request_id:z.uuid(),review:HubSpotReview})),
  KlaviyoReview:fromZod(KlaviyoReview),
  MailchimpReview:fromZod(MailchimpReview),
  OmnisendReview:fromZod(OmnisendReview),
  BrevoReview:fromZod(BrevoReview),
  DestinationReviewResponse:fromZod(z.strictObject({request_id:z.uuid(),review:z.discriminatedUnion('destination',[KlaviyoReview,MailchimpReview,OmnisendReview,BrevoReview])})),
  KlaviyoReviewResponse:fromZod(z.strictObject({request_id:z.uuid(),review:KlaviyoReview})),
  EmailSourceSpec: fromZod(EmailSourceSpecSchema),
  SourceProfile: fromZod(SourceProfileSchema),
  SaveReceipt: {...fromZod(SaveReceiptSchema),description:'Durable CAS receipt; saved_doc_version equals request_base_version+1. Hashes identify the actual committed spec and exact UTF-8 source. A receipt does not grant authority or certify render eligibility.'},
  SavedEmailResponse: {...fromZod(SavedEmailResponseSchema),required:['request_id','email','receipt'],properties:{request_id:uuid,email:{...fromZod(SavedEmailResponseSchema.shape.email),properties:{...fromZod(SavedEmailResponseSchema.shape.email).properties as Record<string,unknown>,spec:ref('EmailSourceSpec')}},receipt:ref('SaveReceipt')},description:'Exact committed email and strict durable receipt. Server enforces matching email/version, CAS increment, canonical spec hash and exact source hash; these cross-field/digest checks exceed JSON Schema shape validation.'},
  SourceForkInput: fromZod(z.object({expected_artifact_hash:z.string().regex(/^[a-f0-9]{64}$/)}).strict()),
  AssetUploadInput: fromZod(UploadIntentInput),
  AssetFallbackInput: fromZod(FallbackInput),
  AssetMetadata: fromZod(AssetMetadataSchema),
  AssetUploadResponse: fromZod(UploadIntentResponseSchema.extend({request_id:z.string()})),
  AssetUploadContentResponse: fromZod(UploadContentResponseSchema.extend({request_id:z.string()})),
  AssetFallbackResponse: fromZod(FallbackResponseSchema.extend({request_id:z.string()})),
  AssetResponse: fromZod(z.object({request_id:z.string(),asset:AssetMetadataSchema}).strict()),
  AssetsPage: fromZod(z.object({request_id:z.string(),data:z.array(AssetMetadataSchema).max(100),has_more:z.boolean(),next_cursor:z.string().max(4096).nullable()}).strict()),
  SenderDraftInput:fromZod(SenderDraftInput),SenderVersionInput:fromZod(SenderVersionInput),SenderCheckInput:fromZod(SenderCheckInput),SenderView:fromZod(SenderView),SenderVersionView:fromZod(SenderVersionView),DNSObservation:fromZod(DNSObservation),DNSCheckView:fromZod(DNSCheckView),
  WorkspacePreferences:fromZod(WorkspacePreferences),WorkspaceTimezoneInput:fromZod(WorkspaceTimezoneInput),CalendarEntry:fromZod(CalendarEntry),
  CreationMetadata:fromZod(CreationMetadata),CreationAttempt:fromZod(CreationAttempt),CreationSummary:fromZod(CreationSummary),
  Membership:fromZod(Membership),MembershipChange:fromZod(MembershipChange),MembershipSummary:fromZod(MembershipSummary),RoleChangeInput:fromZod(RoleChangeInput),RemoveMemberInput:fromZod(RemoveMemberInput),TransferOwnerInput:fromZod(TransferOwnerInput),
  BrandSourceInput:fromZod(BrandSourceInput),BrandSource:fromZod(BrandSource),BrandMemoryChunk:fromZod(BrandMemoryChunk),BrandMemoryContext:fromZod(BrandMemoryContext),MemoryPreviewInput:fromZod(MemoryPreviewInput),
  WebhookEndpoint: fromZod(WebhookEndpoint),
  WebhookEndpointInput: {...fromZod(WebhookEndpointInput), allOf:[{properties:{subscriptions:{uniqueItems:true}}}]},
  WebhookVersionInput: fromZod(WebhookVersionInput),
  WebhookRotateInput: {...fromZod(WebhookRotateInput), allOf:[{if:{required:['retire_previous'],properties:{retire_previous:{const:true}}},then:{required:['acknowledge_key_cutover'],properties:{acknowledge_key_cutover:{const:true}}}}]},
  WebhookConfiguration: object({key_configured:{type:'boolean'},delivery_enabled:{const:false}},undefined,false),
  EventEnvelope: fromZod(EventEnvelopeShape),
  DispatchPolicyInput: { ...fromZod(DispatchPolicyInput), allOf: [{ if: { properties: { paused: { const: false } } }, then: { properties: { reason: { const: 'verified_recovery' } } } }] },
  DispatchPolicy: object({ scope: { type: 'string', enum: ['global','provider','workspace'] }, target: string, paused: { type: 'boolean' }, version: { type: 'integer', minimum: 0 }, reason: { type: 'string', enum: ['incident','abuse_review','maintenance','verified_recovery'] }, updated_at: nullable(time) }, undefined, false),
  Brand: fromZod(BrandSchema),
  EmailSpec: fromZod(EmailSpecSchema),
  ConversionProposalInput:fromZod(ConversionProposalInput),
  ConversionAcceptInput:fromZod(ConversionAcceptInput),
  ConversionProposal:fromZod(ConversionProposalSchema),
  KeyInput: fromZod(KeyInput),
  RemixInput: fromZod(RemixInput),
  LocaleDraftInput: fromZod(LocaleDraftInput),
  Mapping: fromZod(MappingSchema),
  FieldInput: fromZod(FieldSchema),
  LocalSessionInput: object({ secret: string }, undefined, false),
  Empty: object({}, [], false),
  WorkspaceInput: object(
    { name: { type: 'string', minLength: 1, maxLength: 100 } },
    undefined,
    false,
  ),
  EmailInput: object(
    { title: { type: 'string', minLength: 1, maxLength: 160 }, spec: ref('EmailSourceSpec') },
    ['title'],
    false,
  ),
  GenerateInput: object(
    {
      prompt: { type: 'string', minLength: 5, maxLength: 8000 },
      brand_kit_version_id: uuid,
      base_email_id: uuid,
      base_version: integer,
      locale: EmailSpecSchema.shape.locale ? fromZod(EmailSpecSchema.shape.locale) : string,
      mode: { type: 'string', enum: ['single', 'series'], default: 'single' },
      count: { type: 'integer', minimum: 2, maximum: 10 },
    },
    ['prompt', 'brand_kit_version_id'],
    false,
  ),
  DraftInput: object({ spec: ref('EmailSourceSpec') }, undefined, false),
  RestoreInput: object({ revision_id: uuid }, undefined, false),
  PreviewInput: object({ spec: ref('EmailSourceSpec') }, undefined, false),
  HtmlInput: object({ html: { type: 'string', maxLength: MAX_RAW_SOURCE_BYTES,'x-max-utf8-bytes':MAX_RAW_SOURCE_BYTES } }, undefined, false),
  UrlInput: object({ url: { type: 'string', format: 'uri', maxLength: 2048 } }, undefined, false),
  NamedInput: object({ name: { type: 'string', minLength: 1, maxLength: 100 } }, undefined, false),
  ProfileInput: object(
    {
      expected_version: { type: 'integer', minimum: 1 },
      attrs: {
        type: 'object',
        maxProperties: 100,
        additionalProperties: { type: ['string', 'number', 'boolean', 'null'] },
      },
      list_ids: { ...array(uuid), maxItems: 200 },
      tag_ids: { ...array(uuid), maxItems: 200 },
      preferred_locale: fromZod(EmailSpecSchema.shape.locale),
    },
    ['expected_version'],
    false,
  ),
  Rule: {
    anyOf: [
      fromZod(RuleLeafSchema),
      object(
        {
          kind: { type: 'string', enum: ['all', 'any'] },
          children: { type: 'array', minItems: 1, maxItems: 20, items: ref('Rule') },
        },
        undefined,
        false,
      ),
    ],
  },
  SegmentInput: object({
    name: { type: 'string', minLength: 1, maxLength: 100 },
    rule: ref('Rule'),
  }),
  SegmentVersionInput: object({
    expected_version: { type: 'integer', minimum: 1 },
    rule: ref('Rule'),
  }),
  VersionInput: object({ expected_version: { type: 'integer', minimum: 1 } }, undefined, false),
  InspectInput: object({ csv: { type: 'string', maxLength: 2097152 } }, undefined, false),
  ImportInput: object(
    {
      csv: { type: 'string', maxLength: 2097152 },
      mapping: ref('Mapping'),
      list_ids: { ...array(uuid), maxItems: 20 },
      tag_ids: { ...array(uuid), maxItems: 20 },
    },
    ['csv'],
    false,
  ),
  RecipientAssessmentInput:fromZod(RecipientAssessmentInput),
  RecipientAssessmentView:fromZod(RecipientAssessmentView),
  RecipientObservationView:fromZod(RecipientObservationView),
  CampaignConfigurationInput:fromZod(CampaignConfigurationInput),
  CampaignConfigurationView:fromZod(CampaignConfigurationView),
  CampaignConfigurationSnapshot:fromZod(CampaignConfigurationSnapshot),
  AudienceSnapshotMetadata: fromZod(AudienceSnapshotMetadataSchema),
  CampaignInput: object(
    { name: { type: 'string', minLength: 1, maxLength: 160 }, revision_id: uuid },
    undefined,
    false,
  ),
  ErrorResponse: object({
    request_id: string,
    error: object({ code: string, message: string, retryable: { type: 'boolean' }, details: {} }, [
      'code',
      'message',
      'retryable',
    ]),
  }),
  Email: object(
    {
      id: uuid,
      title: string,
      doc_version: integer,
      spec: ref('EmailSpec'),
      updated_at: time,
      created_at: time,
    },
    ['id', 'title', 'doc_version', 'spec', 'updated_at'],
  ),
  BrandVersion: object({ id: uuid, version: integer, data: ref('Brand'), created_at: time }),
  Key: object({
    id: uuid,
    name: string,
    prefix: nullable(string),
    scopes: array(string),
    created_by: string,
    created_at: time,
    expires_at: time,
    revoked_at: nullable(time),
  }),
  Revision: object({
    id: uuid,
    email_id: uuid,
    revision_no: integer,
    subject: string,
    artifact_hash: string,
    created_at: time,
  }),
  Contact: object({
    id: uuid,
    email_original: string,
    subscription: { type: 'string', enum: ['subscribed', 'pending_confirmation', 'unsubscribed'] },
    suppressed: { type: 'boolean' },
    deleted: { type: 'boolean' },
    consent_version: integer,
    profile_version: integer,
    attrs: json,
    list_ids: array(uuid),
    tag_ids: array(uuid),
    preferred_locale: string,
    created_at: time,
  }),
  Campaign: fromZod(CampaignConfigurationView),
  Segment: object({ id: uuid, name: string, current_version: integer, created_at: time }),
  Audit: object({
    id: uuid,
    actor: string,
    action: string,
    resource_id: nullable(string),
    event_hash: string,
    created_at: time,
  }),
  Operation: object(
    { id: uuid, type: string, state: string, result: {}, error: {}, created_at: time,creation:nullable(ref('CreationMetadata')) },
    ['id', 'type', 'state'],
  ),
};
schemas.WebhookDelivery=fromZod(WebhookDelivery);schemas.WebhookAttempt=fromZod(WebhookAttempt);schemas.WebhookReplayInput=fromZod(WebhookReplayInput);
const envelope = (props: Record<string, unknown>, required = Object.keys(props)) =>
  object({ request_id: string, ...props }, ['request_id', ...required]);
const senderEnvelope=(props:Record<string,unknown>)=>object({request_id:string,...props},undefined,false);
schemas.SenderResponse=senderEnvelope({sender:ref('SenderView')});
schemas.SenderVersionResponse=senderEnvelope({sender:ref('SenderView'),changed:{type:'boolean'}});
schemas.DNSCheckResponse=senderEnvelope({check:ref('DNSCheckView')});
for(const [name,item] of Object.entries({SenderIdentities:'SenderView',SenderVersions:'SenderVersionView',SenderDNSChecks:'DNSCheckView'}))schemas[name+'Page']=senderEnvelope({data:array(ref(item)),has_more:{type:'boolean'},next_cursor:nullable(string),total_count:{type:'integer',minimum:0}});
for (const [name, item] of Object.entries({
  Members:'Membership',MemberChanges:'MembershipChange',
  Emails: 'Email',
  EmailTemplates: 'EmailTemplateView',
  Brands: 'BrandVersion',
  Keys: 'Key',
  Revisions: 'Revision',
  Contacts: 'Contact',
  Campaigns: 'Campaign',
  CampaignConfigurations:'CampaignConfigurationSnapshot',
  RecipientAssessments:'RecipientAssessmentView',
  RecipientObservations:'RecipientObservationView',
  AudienceSnapshots: 'AudienceSnapshotMetadata',
  Segments: 'Segment',
  Audit: 'Audit',
  Derivatives: 'Email',
  Events: 'EventEnvelope',
}))
  schemas[name + 'Page'] = envelope({
    data: array(ref(item)),
    has_more: { type: 'boolean' },
    next_cursor: nullable(string),
    total_count: { type: 'integer', minimum: 0 },
  });
schemas.DispatchControlsResponse = envelope({ controls: object({ global: nullable(ref('DispatchPolicy')), providers: array(object({ provider: fromZod(DispatchProvider), policy: nullable(ref('DispatchPolicy')) },undefined,false)), workspace: ref('DispatchPolicy'), dispatch_enabled: { const: false }, notice: string },undefined,false) });
schemas.WebhookEndpointsPage = envelope({data:array(ref('WebhookEndpoint')),has_more:{type:'boolean'},next_cursor:nullable(string),total_count:{type:'integer',minimum:0},configuration:ref('WebhookConfiguration')});
schemas.WebhookEndpointResponse = envelope({endpoint:ref('WebhookEndpoint'),configuration:ref('WebhookConfiguration')});
schemas.WebhookEndpointCommandResponse = envelope({endpoint:ref('WebhookEndpoint'),configuration:ref('WebhookConfiguration'),secret:{type:'string',pattern:'^[0-9a-f]{64}$'},secret_available:{type:'boolean'},issued_secret_version:{type:'integer',minimum:1}},['endpoint','configuration','secret_available']);
for(const [name,item]of Object.entries({WebhookDeliveries:'WebhookDelivery',WebhookAttempts:'WebhookAttempt'}))schemas[name+'Page']=envelope({data:array(ref(item)),has_more:{type:'boolean'},next_cursor:nullable(string),total_count:{type:'integer',minimum:0},configuration:ref('WebhookConfiguration')});
schemas.WebhookDeliveryResponse=envelope({delivery:ref('WebhookDelivery'),configuration:ref('WebhookConfiguration')});
schemas.EventResponse = envelope({event:ref('EventEnvelope')});
schemas.EmailResponse = envelope({ email: ref('Email') });
schemas.EmailTemplateResponse = envelope({template: ref('EmailTemplateView')});
schemas.ConversionProposalResponse=object({request_id:string,proposal:ref('ConversionProposal')},undefined,false);
schemas.ConversionAcceptResponse=object({request_id:string,email:object({id:uuid,title:string,doc_version:{type:'integer',minimum:1},spec:ref('EmailSpec'),updated_at:time},undefined,false)},undefined,false);
const comparisonDraft=object({id:uuid,title:{type:'string',maxLength:160},doc_version:{type:'integer',minimum:1},spec:ref('EmailSourceSpec')},undefined,false);
schemas.LocaleSourceComparison=object({workspace_id:uuid,actor_id:{type:'string',minLength:1},child_id:uuid,parent:comparisonDraft,target:comparisonDraft,baseline:object({revision_id:uuid,revision_no:{type:'integer',minimum:1},source_doc_version:nullable({type:'integer',minimum:1}),spec:ref('EmailSourceSpec')},undefined,false),source_status:{type:'string',enum:['current','outdated','unknown']}},undefined,false);
schemas.LocaleSourceComparison.description='Same-workspace original source/current parent/saved target. Server enforces lineage, child/parent identity and actual versions beyond JSON Schema; the three escaped specs share an8MiB admission bound. No translation, review or approval is implied.';
schemas.LocaleSourceComparisonResponse=envelope({comparison:ref('LocaleSourceComparison')});
schemas.LocaleReviewResponse=envelope({review:ref('LocaleReviewRecord')});
schemas.LocaleReviewHistoryResponse=envelope({context:ref('LocaleReviewContext'),data:array(ref('LocaleReviewHistoryItem')),total_count:{type:'integer',minimum:0},has_more:{type:'boolean'},next_cursor:nullable(string)});
schemas.DerivationResponse = envelope({ email: ref('Email'), revision: json, lineage: json });
schemas.MembershipCommandResponse=envelope({member:ref('Membership'),changes:array(ref('MembershipChange'))});
schemas.MembershipSummaryResponse=envelope({summary:ref('MembershipSummary')});
schemas.BrandSourceResponse=envelope({source:ref('BrandSource')});
schemas.BrandSourceDetailResponse=envelope({source:ref('BrandSource'),chunks:array(ref('BrandMemoryChunk'))});
schemas.BrandMemoryResponse=envelope({context:ref('BrandMemoryContext')});
schemas.BrandSourcesPage=envelope({data:array(ref('BrandSource')),has_more:{type:'boolean'},next_cursor:nullable(string),total_count:{type:'integer',minimum:0}});
schemas.BrandResponse = envelope({ brand: ref('BrandVersion') });
schemas.CurrentBrandResponse = envelope({ brand: nullable(ref('BrandVersion')) });
schemas.OperationResponse = envelope({ operation: ref('Operation') });
schemas.RevisionResponse = envelope({ revision: json });
schemas.KeyResponse = envelope(
  {
    key: ref('Key'),
    secret: { type: 'string', pattern: '^lc_[0-9a-f]{64}$' },
    secret_available: { type: 'boolean' },
  },
  ['key', 'secret_available'],
);
schemas.GenericResponse = envelope({}, []);
schemas.CampaignResponse = envelope({ campaign: ref('Campaign') });
schemas.WorkspacePreferencesResponse=envelope({preferences:ref('WorkspacePreferences')});
schemas.WorkspaceTimezoneResponse=envelope({preferences:ref('WorkspacePreferences'),changed:{type:'boolean'},notice:string});
schemas.CampaignCalendarResponse=envelope({data:array(ref('CalendarEntry')),has_more:{type:'boolean'},next_cursor:nullable(string),total_count:{type:'integer',minimum:0},month:fromZod(CalendarMonth),time_zone:string,timezone_version:{type:'integer',minimum:1},notice:string});
schemas.SubmissionLedgerResponse=fromZod(z.strictObject({request_id:z.uuid(),ledger:SubmissionLedgerView}));
schemas.DeliveryResponse=fromZod(z.strictObject({request_id:z.uuid(),delivery:StagedRecipientView}));
for(const [name,item]of Object.entries({SubmissionLedgers:SubmissionLedgerView,StagedRecipients:StagedRecipientView,DeliveryHistory:DeliveryHistoryView,DeliveryAttempts:DeliveryAttemptView}))
  schemas[name+'Page']=fromZod(z.strictObject({request_id:z.uuid(),data:z.array(item).max(100),has_more:z.boolean(),next_cursor:z.string().min(1).max(4096).nullable(),total_count:z.number().int().min(0).max(10000)}));
schemas.RecipientAssessmentResponse=envelope({assessment:ref('RecipientAssessmentView')});
schemas.CampaignDetailResponse=envelope({campaign:ref('CampaignConfigurationView')});
schemas.CampaignConfigurationResponse=envelope({campaign:ref('CampaignConfigurationView'),changed:{type:'boolean'},notice:string});
schemas.AudienceSnapshotMetadataResponse=envelope({snapshot:ref('AudienceSnapshotMetadata')});
schemas.Health = envelope({
  status: { const: 'ok' },
  release: { const: 'development' },
  dispatch_enabled: { const: false },
});
const pageParameters = [
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
  },
  {
    name: 'after',
    in: 'query',
    schema: { type: 'string', maxLength: 4096 },
    description:
      'Opaque signed cursor bound to account, workspace, resource and filters; expires in15minutes.',
  },
  ...['created_after', 'created_before'].map((name) => ({
    name,
    in: 'query',
    schema: time,
    description:
      'UTC instant; inclusive lower/exclusive upper bound. Keep unchanged while following pages.',
  })),
];
const paths: Record<string, Record<string, unknown>> = {},
  registry: Record<string, unknown> = {};
const errors = Object.fromEntries(
  [400, 401, 403, 404, 405, 409, 412, 413, 422, 428, 429, 500, 503].map((code) => [
    code,
    {
      description: 'Safe error; preserve request ID. Business errors do not automatically retry.',
      content: {
        'application/json': {
          schema: ref('ErrorResponse'),
          example: {
            request_id: 'req-example',
            error: {
              code: code === 429 ? 'RATE_LIMITED' : 'STATE_CONFLICT',
              message: 'Resolve the documented request or setup requirement.',
              retryable: code === 429 || code === 503,
            },
          },
        },
      },
      ...(code === 429
        ? {
            headers: {
              'Retry-After': { schema: string, description: 'Minimum seconds before retry' },
            },
          }
        : {}),
    },
  ]),
);
type Definition = {
  id: string;
  path: string;
  method: string;
  response: string;
  body?: string;
  status?: number;
  keyed?: boolean;
  etag?: boolean | 'asset';
  paged?: boolean;
  pageParameters?: unknown[];
  session?: boolean;
  public?: boolean;
  blocked?: boolean;
  query?: unknown[];
  scope?: string;
  additionalScopes?: string[];
  example?: unknown;
  binary?: boolean;
  binaryBody?: boolean;
  textBody?: boolean;
  sourceCommand?: boolean;
  explicitKey?: boolean;
  sourceJson?: boolean;
  sourceDownload?: boolean;
  destinationDownload?: boolean;
  hubspotDownload?: boolean;
  hubspotBody?: boolean;
  binaryMediaTypes?: string[];
  description?: string;
};
const exampleId = '11111111-1111-4111-8111-111111111111';
const hubspotSettingsExample={company_name:'Example Company',company_street_address_1:'10 Example Road',company_street_address_2:'',company_city:'Example City',company_state:'Example State',company_zip:'12345',company_country:'Example Country'};
const examples: Record<string, unknown> = {
  LocaleReviewInput:{revision_id:exampleId,source_revision_id:exampleId,expected_source_doc_version:1,outcome:'content_reviewed',note:'Manually checked the local wording; sending is not approved.'},
  SubmissionLedgerInput:{expected_version:1,expected_digest:'a'.repeat(64)},
  SaveEmailTemplateInput: {name:'Example template',source_revision_id:exampleId,expected_artifact_hash:'a'.repeat(64)},
  ArchiveEmailTemplateInput: {expected_version:1},
  RemixEmailTemplateInput: {title:'New independent draft',expected_version:1,expected_artifact_hash:'a'.repeat(64)},
  HubSpotReviewInput:{settings:hubspotSettingsExample},
  HubSpotArtifactInput:{settings:hubspotSettingsExample,format:'html',expected_destination_hash:'a'.repeat(64)},
  SourceForkInput:{expected_artifact_hash:'a'.repeat(64)},
  AssetUploadInput: {filename:'example.png',declared_mime:'image/png',byte_size:1024,sha256:'a'.repeat(64),rights:{attested:true,terms_version:MEDIA_LIMITS.rights},alt:'Example product',decorative:false},
  AssetFallbackInput: {selected_frame:0},
  SenderDraftInput:{name:'Example sender draft',provider:'ses',account_label:'Example account label',region:'us-east-1',from_name:'Example brand',from_address:'news@example.test',reply_to:null},
  SenderVersionInput:{name:'Updated sender draft',provider:'ses',account_label:'Example account label',region:'us-east-1',from_name:'Example brand',from_address:'news@example.test',reply_to:null,expected_version:1},
  SenderCheckInput:{expected_version:1},
  RoleChangeInput:{role:'Viewer',expected_version:1},RemoveMemberInput:{expected_version:1,acknowledge:true},TransferOwnerInput:{expected_version:1,expected_owner_version:1,acknowledge:true},
  WebhookReplayInput:{expected_attempt:1,acknowledge_duplicate_effect:true},
  WebhookEndpointInput:{name:'Example paused receiver',url:'https://example.org/webhook',subscriptions:['contact.unsubscribed']},
  WebhookVersionInput:{expected_version:1},
  WebhookRotateInput:{expected_version:1,retire_previous:false,acknowledge_key_cutover:false},
  Empty: {},
  EventEnvelope: fromZod(EventEnvelopeShape),
  DispatchPolicyInput: { expected_version: 0, paused: true, reason: 'incident' },
  RemixInput: { title: 'Remixed example' },
  LocaleDraftInput: { title: 'Arabic draft example', locale: 'ar-SA' },
  WorkspaceInput: { name: 'Example workspace' },
  LocalSessionInput: { secret: 'example-only-never-a-real-secret' },
  Brand: {
    name: 'Example brand',
    website: 'https://example.com',
    description: 'Example description',
    voice: 'Clear',
    accent: '#0B625D',
    background: '#F7F6F2',
    font_stack: 'Arial, sans-serif',
    address: 'Example postal address',
    forbidden_phrases: [],
    approved_claims: [],
    provenance: [],
  },
  EmailInput: { title: 'Example draft' },
  GenerateInput: {
    prompt: 'Write an email using approved facts',
    brand_kit_version_id: exampleId,
    locale: 'en-US',
    mode: 'single',
  },
  DraftInput: { spec: {...blankSpec(exampleId, 'Example brand'),tracking:{utm_source:'newsletter',utm_medium:'email',utm_campaign:'early-access'}} },
  PreviewInput: { spec: {...blankSpec(exampleId, 'Example brand'),tracking:{utm_source:'newsletter',utm_medium:'email',utm_campaign:'early-access'}} },
  RestoreInput: { revision_id: exampleId },
  HtmlInput: { html: '<p>Example</p>' },
  ConversionProposalInput:{expected_version:1},
  ConversionAcceptInput:{expected_version:1,source_hash:'0'.repeat(64),proposal_hash:'1'.repeat(64),acknowledge_layout_change:true},
  UrlInput: { url: 'https://example.com' },
  NamedInput: { name: 'Example list' },
  FieldInput: { key: 'score', label: 'Score', type: 'number' },
  ProfileInput: { expected_version: 1, attrs: { first_name: 'Example' } },
  SegmentInput: {
    name: 'Named contacts',
    rule: { kind: 'attribute', field: 'first_name', op: 'exists' },
  },
  SegmentVersionInput: {
    expected_version: 1,
    rule: { kind: 'attribute', field: 'first_name', op: 'exists' },
  },
  VersionInput: { expected_version: 1 },
  InspectInput: { csv: 'email\nfixture@example.com' },
  ImportInput: { csv: 'email\nfixture@example.com', mapping: { email: 'email', attributes: {} } },
  CampaignInput: { name: 'Example campaign', revision_id: exampleId },
  RecipientAssessmentInput:{expected_version:1,expected_digest:'a'.repeat(64),topic_id:null},
  CampaignConfigurationInput:{expected_version:1,name:'Example planned campaign',revision_id:exampleId,planned_timing:{local_time:'2026-11-01T01:30',time_zone:'America/New_York',utc_offset:'-04:00'}},
  KeyInput: { name: 'Example reader', scopes: ['emails:read'], expires_in_days: 90 },
};
function add(d: Definition) {
  const parameters: unknown[] = [...d.path.matchAll(/\{([^}]+)\}/g)].map((m) => ({
    name: m[1],
    in: 'path',
    required: true,
    schema: uuid,
  }));
  if (!d.public)
    parameters.push({
      name: 'X-Workspace-Id',
      in: 'header',
      required: false,
      schema: uuid,
      description:
        'Required for tenant session requests; bearer keys cannot override their workspace.',
    });
  if (d.keyed)
    parameters.push({
      name: 'Idempotency-Key',
      in: 'header',
      required: true,
      schema: { type: 'string', minLength: d.sourceCommand ? 1 : 8, maxLength: 200 },
      description:
        'Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts.',
    });
  if(d.hubspotBody||d.sourceCommand||d.sourceJson||d.path.startsWith('/v1/sender-identities')||d.path.startsWith('/v1/templates')||['prepareEmailConversion','acceptEmailConversion','getEmail','compareLocaleSource'].includes(d.id))parameters.push({name:'X-Actor-Id',in:'header',required:false,schema:{type:'string',minLength:1},description:'Optional account-change fence compared with the authenticated actor. It grants no delegation and never changes the actor-scoped receipt namespace; mismatch409 ACTOR_CHANGED.'});
  if (d.etag)
    parameters.push({
      name: 'If-Match',
      in: 'header',
      required: true,
      schema: { type: 'string', pattern: d.etag === 'asset' ? '^"asset-[1-9][0-9]*"$' : '^"draft-[1-9][0-9]*"$' },
      description: d.etag === 'asset' ? 'Acknowledged asset version; stale412, absent428.' : 'Acknowledged draft version; stale412, absent428.',
    });
  if (d.binaryBody) parameters.push({name:'X-Upload-Token',in:'header',required:true,schema:{type:'string',pattern:'^[a-f0-9]{64}$'},description:'Actor/workspace-bound upload token from the acknowledged intent. Preserve this token, upload ID and exact bytes for explicit transfer recovery.'});
  if (d.paged) parameters.push(...(d.pageParameters ?? pageParameters));
  if (d.query) parameters.push(...d.query);
  const success = d.destinationDownload || d.hubspotDownload
    ? {
        description:d.hubspotDownload?'Locally prepared HubSpot coded-footer HTML or plaintext UTF-8 attachment. Declared settings are compared locally; account settings, native conformance and client fidelity remain unverified. No remote export.':'Locally prepared frozen Klaviyo, Mailchimp Classic, Omnisend HTML-import or Brevo marketing-draft HTML (format=html) or plaintext (format=txt), encoded as UTF-8 attachment bytes. Integrity receipts bind the source, destination mapping and exact downloaded content. Remote export remains disabled.',
        headers:{
          'X-Request-Id':{schema:string},
          'X-Artifact-Hash':{schema:{type:'string',pattern:'^[a-f0-9]{64}$'},description:d.hubspotDownload?'Destination artifact hash bound to source, mapping/comparison versions, declared settings digest and both prepared formats.':'Destination artifact hash bound to source, mapping, API revision and both prepared formats.'},
          'X-Source-Artifact-Hash':{schema:{type:'string',pattern:'^[a-f0-9]{64}$'},description:'Exact frozen source artifact hash reviewed before download.'},
          'X-Content-SHA256':{schema:{type:'string',pattern:'^[a-f0-9]{64}$'},description:'SHA256 of the exact UTF-8 bytes for the selected format.'},
          'X-Destination-Mapping':{schema:{type:'string',enum:d.hubspotDownload?[HUBSPOT_MAPPING_VERSION]:[KLAVIYO_MAPPING_VERSION,MAILCHIMP_MAPPING_VERSION,OMNISEND_MAPPING_VERSION,BREVO_MAPPING_VERSION]}},
          'X-Remote-Export-Enabled':{schema:{type:'string',const:'false'},description:'Local preparation only; no provider export is enabled.'},
          'Content-Type':{schema:{type:'string',enum:['text/html; charset=utf-8','text/plain; charset=utf-8']}},
          'Content-Disposition':{schema:string,description:d.hubspotDownload?'attachment; filename="hubspot-prepared-{revision_id}.{format}"':'attachment; filename="{destination}-prepared-{revision_id}.{format}"'},
          'Cache-Control':{schema:{type:'string',const:'no-store'}},
          'X-Content-Type-Options':{schema:{type:'string',const:'nosniff'}},
          'Content-Security-Policy':{schema:{type:'string',const:"sandbox; default-src 'none'"}},
          'X-Mailcraft-Notice':{schema:string,description:'Local preparation notice; remote export, live destination and real-client conformance remain unverified.'},
        },
        content:{'text/html':{schema:{type:'string',format:'binary'}},'text/plain':{schema:{type:'string',format:'binary'}}},
      }
    : d.binary
    ? {
        description: d.binaryMediaTypes ? 'Authorized immutable private derivative bytes. No public hosting or original-byte access.' : 'Frozen bytes; browser image/PDF simulations, not real-client evidence.',
        headers: { 'X-Request-Id': { schema: string }, ...(d.binaryMediaTypes ? {'Cache-Control':{schema:{const:'private, no-store'}}} : { 'X-Artifact-Hash': { schema: string } }),...(d.sourceDownload?{'X-Source-SHA256':{schema:{type:'string',pattern:'^[a-f0-9]{64}$'},description:'Present for format=source; exact frozen UTF-8 source hash.'},'X-Source-Profile':{schema:ref('SourceProfile'),description:'Present for format=source; historical storage profile.'},'X-Content-Type-Options':{schema:{const:'nosniff'}},'Content-Disposition':{schema:string,description:'format=source uses attachment; filename="email-vN.source.html.txt".'},'Cache-Control':{schema:{const:'no-store'}}}:{}) },
        content: Object.fromEntries((d.binaryMediaTypes ?? (d.sourceDownload?['application/octet-stream','text/plain']:['application/octet-stream'])).map(mime=>[mime,{schema:{type:'string',format:'binary'}}])),
      }
    : {
        description: d.blocked
          ? 'Reserved shape; the current development command always returns a documented provider/release error.'
          : 'Acknowledged result',
        headers: {
          'X-Request-Id': { schema: string },
          ...(d.hubspotBody?{'Cache-Control':{schema:{type:'string',const:'no-store'}},'X-Content-Type-Options':{schema:{type:'string',const:'nosniff'}}}:{}),
          ...(d.status === 202
            ? { Location: { schema: string }, 'Retry-After': { schema: string } }
            : {}),
        },
        content: { 'application/json': { schema: ref(d.response) } },
      };
  paths[d.path] ??= {};
  paths[d.path][d.method.toLowerCase()] = {
    operationId: d.id,
    summary: d.id.replace(/[A-Z]/g, (x) => ' ' + x.toLowerCase()),
    description:
      d.description ??
      (d.blocked
        ? 'Provider or release gates are unconfigured. No remote success, approval or sending is implied.'
        : 'Implemented development behavior; all full-GA release obligations remain open.'),
    security: d.public ? [] : d.session ? [{ session: [] }] : [{ apiKey: [] }, { session: [] }],
    parameters,
    ...(d.textBody
      ? {requestBody:{required:true,description:'Exact inert UTF-8 source, at most2097152 actual bytes. Preserve BOM, mixed line endings and Unicode without normalization. Empty source is valid. Reject malformed UTF-8, NUL, lone UTF-16 surrogates and Content-Encoding. This does not authorize rendering or distribution.',content:{'text/plain':{schema:{type:'string',maxLength:MAX_RAW_SOURCE_BYTES,'x-max-utf8-bytes':MAX_RAW_SOURCE_BYTES},example:'\uFEFF<!-- authored source -->\r\n<p>Example</p>\r'}}}}
      : d.binaryBody
      ? {requestBody:{required:true,description:'Raw uncompressed bytes, exactly matching the admitted digest and size; 20 MiB maximum. No JSON, base64 or multipart encoding. Transfer retry is explicit and uses the same upload ID/token/bytes.',content:{'application/octet-stream':{schema:{type:'string',format:'binary',minLength:1,maxLength:MEDIA_LIMITS.upload}}}}}
      : d.body
      ? {
          requestBody: {
            required: true,
            ...(d.hubspotBody?{description:'Required strict JSON object with application/json and optional UTF-8 charset only, no Content-Encoding. At most16384 actual bytes; declared byte length must be safe/nonnegative and exact. Fatal UTF-8 validation,30-second deadline and cancellation. Settings stay in the body. Server footer Unicode/delimiter/composed-address refinements remain authoritative.'}:{}),
            content: {
              'application/json': {
                schema: ref(d.body),
                example: d.example ?? examples[d.body],
              },
            },
          },
        }
      : {}),
    responses: { [d.status ?? 200]: success, ...errors, ...(d.binaryBody ? {415:errors[400],499:errors[400]} : {}),...(d.sourceCommand||d.sourceJson?{408:errors[400],415:errors[400]}:{}),...(d.hubspotBody?{408:errors[400],415:errors[400],499:errors[400]}:{}) },
    ...(d.textBody||d.sourceJson?{'x-lettercape-body-max-bytes':d.textBody?MAX_RAW_SOURCE_BYTES:MAX_SOURCE_COMMAND_JSON_BYTES}:{}),
    ...(d.hubspotBody?{'x-lettercape-body-max-bytes':16384}:{}),
    'x-lettercape-scopes': [...(d.scope?[d.scope]:[]),...(d.additionalScopes??[])],
    'x-lettercape-availability': d.blocked ? 'blocked' : 'development',
    'x-lettercape-idempotent-command': !!d.keyed,
  };
  registry[d.id] = {
    method: d.method,
    path: d.path,
    keyed: !!d.keyed,
    paged: !!d.paged,
    binary: !!d.binary,
    binaryBody: !!d.binaryBody,
    textBody: !!d.textBody,
    sourceCommand: !!d.sourceCommand,
    explicitKey: !!d.explicitKey,
    blocked: !!d.blocked,
  };
}
const ID = '11111111-1111-4111-8111-111111111111';
add({id:'listAssets',path:'/v1/assets',method:'GET',response:'AssetsPage',paged:true,pageParameters:pageParameters.slice(0,2),scope:'assets:read',description:'Bounded private library metadata. Hidden assets are omitted. Signed cursors bind the authenticated actor and workspace; no public image URLs are created.'});
add({id:'createAssetUpload',path:'/v1/assets/uploads',method:'POST',body:'AssetUploadInput',response:'AssetUploadResponse',status:202,keyed:true,scope:'assets:write',description:'Reserve a bounded private upload with explicit rights attestation. Preserve the acknowledged token privately. Readiness requires actual clean scanning and isolated decoding; no image is ready merely because an intent was admitted.'});
add({id:'uploadAssetContent',path:'/v1/assets/uploads/{uploadId}/content',method:'PUT',response:'AssetUploadContentResponse',status:202,binaryBody:true,scope:'assets:write',description:'Dedicated streamed binary route with a 20 MiB raw limit, admitted digest/size and actor-bound token. Acknowledgment means durable quarantine/queued processing, not readiness. Explicit recovery uses the same upload ID/token/exact bytes; there is no automatic mutation retry.'});
add({id:'getAsset',path:'/v1/assets/{id}',method:'GET',response:'AssetResponse',scope:'assets:read'});
add({id:'getAssetVariantContent',path:'/v1/assets/{id}/variants/{variantId}/content',method:'GET',response:'AssetResponse',binary:true,binaryMediaTypes:['image/png','image/jpeg','image/gif'],scope:'assets:read'});
add({id:'createAssetFallback',path:'/v1/assets/{id}/fallback',method:'POST',body:'AssetFallbackInput',response:'AssetFallbackResponse',status:202,keyed:true,etag:'asset',scope:'assets:write',description:'Queue a deterministic fully composited GIF frame. Preserve the existing immutable variant until processing succeeds; stale asset versions return412.'});
add({id:'removeAsset',path:'/v1/assets/{id}/remove',method:'POST',body:'Empty',response:'AssetResponse',keyed:true,scope:'assets:write',description:'Hide an asset from the private library while preserving bytes pinned by existing revisions. This is not physical erasure.'});
add({id:'publishAsset',path:'/v1/assets/{id}/publish',method:'POST',body:'Empty',response:'AssetResponse',blocked:true,scope:'assets:write',description:'Always unavailable in this local slice:503 ASSET_PUBLICATION_NOT_CONFIGURED. No public CDN, hosted-image lifetime or production publication is claimed.'});
add({id:'listSenderIdentities',path:'/v1/sender-identities',method:'GET',response:'SenderIdentitiesPage',paged:true,scope:'sender:read',description:'Current Owner/Admin only. Provider-bound drafts have no credentials; connection and sending remain disabled.'});
add({id:'createSenderIdentity',path:'/v1/sender-identities',method:'POST',body:'SenderDraftInput',response:'SenderResponse',status:201,keyed:true,scope:'sender:write'});
add({id:'getSenderIdentity',path:'/v1/sender-identities/{id}',method:'GET',response:'SenderResponse',scope:'sender:read'});
add({id:'listSenderVersions',path:'/v1/sender-identities/{id}/versions',method:'GET',response:'SenderVersionsPage',paged:true,scope:'sender:read'});
add({id:'saveSenderVersion',path:'/v1/sender-identities/{id}/versions',method:'POST',body:'SenderVersionInput',response:'SenderVersionResponse',keyed:true,scope:'sender:write',description:'Exact acknowledged sender version. Provider/account/region/address changes never inherit old DNS evidence or activate sending.'});
add({id:'listSenderDNSChecks',path:'/v1/sender-identities/{id}/dns-checks',method:'GET',response:'SenderDNSChecksPage',paged:true,scope:'sender:read'});
add({id:'checkSenderDNS',path:'/v1/sender-identities/{id}/dns-checks',method:'POST',body:'SenderCheckInput',response:'DNSCheckResponse',keyed:true,scope:'sender:write',description:'Bounded read-only exact-domain SPF/DMARC TXT discovery;5second owned resolver deadline,10checks/minute/workspace excluding replay. No DKIM, full protocol evaluation, ownership, provider acceptance or aligned received-message authentication claim. Sending stays disabled.'});
add({id:'listMemberships',path:'/v1/memberships',method:'GET',response:'MembersPage',paged:true,session:true,description:'Current Owner/Admin session; tenant-bound membership metadata only, no provider identity lookup.'});
add({id:'listMembershipChanges',path:'/v1/membership-changes',method:'GET',response:'MemberChangesPage',paged:true,session:true,description:'Immutable local membership and editing-seat impact; no Stripe reconciliation claim.'});
add({id:'getMembershipSummary',path:'/v1/memberships/summary',method:'GET',response:'MembershipSummaryResponse',session:true});
add({id:'changeMembershipRole',path:'/v1/memberships/{id}/role',method:'POST',body:'RoleChangeInput',response:'MembershipCommandResponse',keyed:true,session:true,description:'Current manager session plus recent verified MFA in production; current member CAS. Admin cannot touch Owner/Billing or grant Billing. Positive editing quantity requires approved capacity; no prices are assigned.'});
add({id:'removeMembership',path:'/v1/memberships/{id}/remove',method:'POST',body:'RemoveMemberInput',response:'MembershipCommandResponse',keyed:true,session:true,description:'Current manager/MFA/CAS and explicit removal acknowledgment; final Owner cannot leave. Revokes issued keys, cancels queued creation and requests running cancellation. In-flight provider context and global identity/collaboration revocation remain separate obligations.'});
add({id:'transferWorkspaceOwnership',path:'/v1/memberships/{id}/transfer-owner',method:'POST',body:'TransferOwnerInput',response:'MembershipCommandResponse',keyed:true,session:true,description:'Current Owner/MFA/target-and-initiator CAS plus explicit acknowledgment. Atomically promotes existing active editing member and demotes initiator to Admin. No approved capacity/billing/provider success implied.'});
add({id:'listWebhookDeliveries',path:'/v1/webhook-deliveries',method:'GET',response:'WebhookDeliveriesPage',paged:true,scope:'webhooks:read',query:[{name:'endpoint_id',in:'query',schema:{type:'string',format:'uuid'}},{name:'state',in:'query',schema:fromZod(WebhookDeliveryState)}],description:'Redacted durable receipts; started/authorized are not HTTP submission or email delivery evidence.'});
add({id:'getWebhookDelivery',path:'/v1/webhook-deliveries/{id}',method:'GET',response:'WebhookDeliveryResponse',scope:'webhooks:read'});
add({id:'listWebhookAttempts',path:'/v1/webhook-deliveries/{id}/attempts',method:'GET',response:'WebhookAttemptsPage',paged:true,scope:'webhooks:read'});
add({id:'replayWebhookDelivery',path:'/v1/webhook-deliveries/{id}/replay',method:'POST',body:'WebhookReplayInput',response:'WebhookDeliveryResponse',keyed:true,scope:'webhooks:write',description:'Explicit duplicate-effect acknowledgment and current attempt CAS. Same logical event/delivery and original24h budget; acknowledged/leased/expired/revoked receipts cannot be replayed. Worker activation remains disabled.'});
add({id:'listWebhookEndpoints',path:'/v1/webhook-endpoints',method:'GET',response:'WebhookEndpointsPage',paged:true,scope:'webhooks:read',description:'Current Owner/Admin and explicit bearer webhook read scope; query credentials and wrapped signing keys are excluded.'});
add({id:'getWebhookEndpoint',path:'/v1/webhook-endpoints/{id}',method:'GET',response:'WebhookEndpointResponse',scope:'webhooks:read'});
add({id:'createWebhookEndpoint',path:'/v1/webhook-endpoints',method:'POST',body:'WebhookEndpointInput',response:'WebhookEndpointCommandResponse',status:201,keyed:true,scope:'webhooks:write',description:'DNS-only public HTTPS target validation, encrypted secret shown once outside replay receipts. Endpoint stays paused; no target availability, external delivery or TLS conformance claim.'});
add({id:'rotateWebhookEndpoint',path:'/v1/webhook-endpoints/{id}/rotate',method:'POST',body:'WebhookRotateInput',response:'WebhookEndpointCommandResponse',keyed:true,scope:'webhooks:write',description:'CAS current endpoint version. Proposed development overlap24h; early retirement requires explicit consumer-cutover acknowledgment. Replay never recovers a secret.'});
add({id:'pauseWebhookEndpoint',path:'/v1/webhook-endpoints/{id}/pause',method:'POST',body:'WebhookVersionInput',response:'WebhookEndpointCommandResponse',keyed:true,scope:'webhooks:write',description:'CAS pause; an already-authorized in-flight request may finish. Delivery worker remains disabled.'});
add({ id: 'listEvents', path: '/v1/events', method: 'GET', response: 'EventsPage', paged: true, scope: 'events:read', query: [{name:'type',in:'query',schema:fromZod(EventType)}], description: 'Current Owner/Admin authority plus explicit events:read bearer scope. Only immutable typed versioned receipts; legacy rows excluded, external webhook delivery unconfigured.' });
add({ id: 'getEvent', path: '/v1/events/{id}', method: 'GET', response: 'EventResponse', scope: 'events:read', description: 'Returns a verified immutable typed event; a receipt is not an external delivery acknowledgment.' });
add({ id: 'getDispatchControls', path: '/v1/dispatch-controls', method: 'GET', response: 'DispatchControlsResponse', session: true, description: 'Current Owner/Admin session only. Missing policy fails closed; this does not activate sending.' });
add({ id: 'setWorkspaceDispatchPolicy', path: '/v1/dispatch-controls/workspace', method: 'POST', body: 'DispatchPolicyInput', response: 'DispatchControlsResponse', keyed: true, session: true, description: 'Current Owner/Admin session, exact workspace policy version. Replays acknowledge the original command and return current controls. Global/provider changes are operator-only and unavailable here.' });
add({ id: 'health', path: '/v1/health', method: 'GET', response: 'Health', public: true });
add({
  id: 'listWorkspaces',
  path: '/v1/workspaces',
  method: 'GET',
  response: 'GenericResponse',
  session: true,
});
add({
  id: 'createWorkspace',
  path: '/v1/workspaces',
  method: 'POST',
  body: 'WorkspaceInput',
  response: 'GenericResponse',
  status: 201,
  session: true,
  example: { name: 'Example workspace' },
});
add({
  id: 'signOutLocalSession',
  path: '/v1/session',
  method: 'DELETE',
  response: 'GenericResponse',
  session: true,
  description:
    'Removes development cookie only. Production identity signout uses the configured identity provider.',
});
add({
  id: 'localSession',
  path: '/v1/local-session',
  method: 'POST',
  body: 'LocalSessionInput',
  response: 'GenericResponse',
  public: true,
  description:
    'Loopback development bootstrap only; disabled in production. Supply private secret through local UI. Not a production authentication mechanism.',
});
add({
  id: 'listIntegrations',
  path: '/v1/integrations',
  method: 'GET',
  response: 'GenericResponse',
  scope: 'integrations:read',
});
for (const [id, path, response, scope, session, query] of [
  ['listBrands', 'brands', 'BrandsPage', 'brands:read', false, undefined],
  ['listEmails', 'emails', 'EmailsPage', 'emails:read', false, undefined],
  ['listContacts', 'contacts', 'ContactsPage', 'audience:read', false, undefined],
  ['listCampaigns', 'campaigns', 'CampaignsPage', 'campaigns:read', false, undefined],
  ['listSegments', 'segments', 'SegmentsPage', 'audience:read', false, undefined],
  ['listApiKeys', 'api-keys', 'KeysPage', '', true, undefined],
  ['listAudit', 'audit', 'AuditPage', '', true, undefined],
  [
    'listRevisions',
    'email-revisions',
    'RevisionsPage',
    'emails:read',
    false,
    [{ name: 'email_id', in: 'query', required: false, schema: uuid }],
  ],
] as const)
  add({
    id,
    path: '/v1/' + path,
    method: 'GET',
    response,
    scope,
    session,
    paged: true,
    query: query ? [...query] : undefined,
  });
add({id:'listBrandSources',path:'/v1/brand-sources',method:'GET',response:'BrandSourcesPage',paged:true,scope:'brands:read',query:[{name:'brand_kit_version_id',in:'query',required:true,schema:uuid}]});
add({id:'getBrandSource',path:'/v1/brand-sources/{id}',method:'GET',response:'BrandSourceDetailResponse',scope:'brands:read'});
add({id:'addBrandSource',path:'/v1/brand-sources',method:'POST',body:'BrandSourceInput',example:{brand_kit_version_id:exampleId,title:'Owned product brief',source_ref:'Approved document',text:'Verified product facts',acknowledge_rights_and_no_private_data:true},response:'BrandSourceResponse',status:201,keyed:true,scope:'brands:write',description:'Manually approved UTF8 text up to64KiB; source rights/no-private-data assertion required. Exact confirmed brand version; no URL fetch or embedding provider.'});
add({id:'removeBrandSource',path:'/v1/brand-sources/{id}/remove',method:'POST',body:'Empty',response:'BrandSourceResponse',keyed:true,scope:'brands:write',description:'Monotonic tombstone excludes new retrieval; historical metadata remains. Does not certify privacy erasure.'});
add({id:'previewBrandMemory',path:'/v1/brands/{id}/memory-preview',method:'POST',body:'MemoryPreviewInput',example:{query:'cotton product facts'},response:'BrandMemoryResponse',scope:'brands:read',description:'Read-only current selected-version lexical context; no provider/model request.'});
add({
  id: 'getCurrentBrand',
  path: '/v1/brands/current',
  method: 'GET',
  response: 'CurrentBrandResponse',
  scope: 'brands:read',
});
add({
  id: 'confirmBrand',
  path: '/v1/brands',
  method: 'POST',
  body: 'Brand',
  response: 'BrandResponse',
  keyed: true,
  status: 201,
  scope: 'brands:write',
});
add({
  id: 'extractBrand',
  path: '/v1/brands/from-url',
  method: 'POST',
  body: 'UrlInput',
  response: 'OperationResponse',
  status: 202,
  keyed: true,
  scope: 'brands:write',
  example: { url: 'https://example.com' },
});
add({
  id: 'createEmail',
  path: '/v1/emails',
  method: 'POST',
  body: 'EmailInput',
  response: 'EmailResponse',
  keyed: true,
  sourceJson: true,
  scope: 'emails:write',
  example: { title: 'Example draft' },
});
const templateNotice='Metadata pins an immutable workspace revision and exact hash. Templates preserve their original brand/source; reuse creates a separate draft under current authority and asset checks. No AI, send or production acceptance is implied.';
add({id:'listEmailTemplates',path:'/v1/templates',method:'GET',response:'EmailTemplatesPage',paged:true,scope:'emails:read',query:[{name:'state',in:'query',required:false,schema:{type:'string',enum:['active','archived'],default:'active'}}],description:templateNotice});
add({id:'saveEmailTemplate',path:'/v1/templates',method:'POST',body:'SaveEmailTemplateInput',response:'EmailTemplateResponse',status:201,keyed:true,explicitKey:true,scope:'emails:write',description:templateNotice});
add({id:'getEmailTemplate',path:'/v1/templates/{id}',method:'GET',response:'EmailTemplateResponse',scope:'emails:read',description:templateNotice});
add({id:'archiveEmailTemplate',path:'/v1/templates/{id}/archive',method:'POST',body:'ArchiveEmailTemplateInput',response:'EmailTemplateResponse',keyed:true,explicitKey:true,scope:'emails:write',description:'Version CAS archives active templates and blocks new reuse while preserving revision and child history. '+templateNotice});
add({id:'remixEmailTemplate',path:'/v1/templates/{id}/remix',method:'POST',body:'RemixEmailTemplateInput',response:'DerivationResponse',status:201,keyed:true,explicitKey:true,scope:'emails:write',description:'Version/hash CAS and same-key original-child recovery. '+templateNotice});
add({
  id: 'getEmail',
  path: '/v1/emails/{id}',
  method: 'GET',
  response: 'EmailResponse',
  scope: 'emails:read',
});
add({
  id: 'generateEmail',
  path: '/v1/emails/generate',
  method: 'POST',
  body: 'GenerateInput',
  response: 'OperationResponse',
  status: 202,
  keyed: true,
  scope: 'emails:write',
  example: {
    prompt: 'Write an email with approved facts',
    brand_kit_version_id: ID,
    locale: 'en-US',
    mode: 'single',
  },
  description:
    'Queues a durable proposal only. Unconfigured AI/finite allowance produces an honest inspectable error; never sends.',
});
add({id:'prepareEmailConversion',path:'/v1/emails/{id}/conversion-proposal',method:'POST',body:'ConversionProposalInput',response:'ConversionProposalResponse',scope:'emails:write',description:'Read-only proposal pinned to the current raw source/version; explicit unsupported cases stay raw, safe complex fragments remain opaque. No Monaco/VML/universal/client-fidelity claim.'});
add({id:'acceptEmailConversion',path:'/v1/emails/{id}/convert-to-blocks',method:'POST',body:'ConversionAcceptInput',response:'ConversionAcceptResponse',keyed:true,etag:true,scope:'emails:write',description:'Explicit layout-change acknowledgment and exact source/proposal hashes. Current authority after receipt/resource waits; atomic original raw checkpoint and new structured head. Historical exact receipts never replace current detail; recover the same body/key and original If-Match.'});
add({id:'compareLocaleSource',path:'/v1/emails/{id}/locale-source',method:'GET',response:'LocaleSourceComparisonResponse',scope:'emails:read',description:'Read-only same-workspace original frozen source/current parent/saved locale-child comparison. Returns exact inert specs and versions; does not translate, checkpoint, review, approve or mutate source lineage.'});
add({id:'listLocaleReviews',path:'/v1/emails/{id}/locale-reviews',method:'GET',response:'LocaleReviewHistoryResponse',scope:'emails:read',paged:true,description:'Manual content-review history and saved locale/source context. Applicability compares the frozen target version and observed source version with current drafts; never implies translation or sending approval.'});
add({id:'recordLocaleReview',path:'/v1/emails/{id}/locale-reviews',method:'POST',body:'LocaleReviewInput',response:'LocaleReviewResponse',scope:'emails:write',keyed:true,etag:true,status:201,description:'Owner/Admin/Editor manual review of an existing checkpoint matching the acknowledged saved locale version. Pins original source revision and observed current parent version; stale context refuses. Replay the exact input/key/If-Match for historical acknowledgment. Does not mutate either draft, source lineage or send approval.'});
add({ id: 'listEmailDerivatives', path: '/v1/emails/{id}/derivatives', method: 'GET', response: 'DerivativesPage', paged: true, scope: 'emails:read' });
for (const [id, command, body] of [['remixRevision', 'remix', 'RemixInput'], ['createLocaleDraft', 'localize', 'LocaleDraftInput']] as const)
  add({ id, path: '/v1/email-revisions/{id}/' + command, method: 'POST', response: 'DerivationResponse', body, keyed: true, status: 201, scope: 'emails:write', description: command === 'localize' ? 'Creates a separately versioned manual locale draft linked to the frozen source. Source text is retained, not translated or reviewed; no AI/provider/send success is implied.' : 'Copies a frozen source into a separately versioned same-workspace remix with immutable source provenance. Source remains intact.' });
add({id:'importEmailSource',path:'/v1/emails/{id}/source-import',method:'POST',response:'SavedEmailResponse',textBody:true,sourceCommand:true,explicitKey:true,keyed:true,etag:true,scope:'emails:write',description:'Preserve exact inert UTF-8 source and checkpoint the previous head atomically. Explicit original key and If-Match bind recovery; SDK never generates a command key or retries this operation automatically. Source fidelity and safe projection are separate.'});
add({id:'forkEmailSource',path:'/v1/emails/{id}/source-fork',method:'POST',body:'SourceForkInput',response:'SavedEmailResponse',sourceJson:true,sourceCommand:true,explicitKey:true,keyed:true,etag:true,scope:'emails:write',description:'Fork the acknowledged structured artifact to raw source on the server, matching expected_artifact_hash and original If-Match. Never accepts browser preview bytes as canonical source. Explicit same-key recovery; no automatic SDK retry.'});
for (const [id, command, method, body, response, keyed, etag] of [
  ['saveDraft', 'draft', 'PATCH', 'DraftInput', 'SavedEmailResponse', true, true],
  ['checkpointEmail', 'revisions', 'POST', 'Empty', 'RevisionResponse', true, true],
  ['restoreEmail', 'restore', 'POST', 'RestoreInput', 'EmailResponse', true, true],
  ['previewEmail', 'preview', 'POST', 'PreviewInput', 'GenericResponse', false, false],
  ['importHtml', 'import-html', 'POST', 'HtmlInput', 'SavedEmailResponse', true, true],
] as const)
  add({
    id,
    path: '/v1/emails/{id}/' + command,
    method,
    body,
    response,
    keyed,
    etag,
    sourceCommand: ['saveDraft','importHtml'].includes(id),
    sourceJson: ['saveDraft','importHtml','previewEmail'].includes(id),
    scope: 'emails:write',
  });
add({
  id: 'downloadRevision',
  path: '/v1/email-revisions/{id}/download',
  method: 'GET',
  response: 'GenericResponse',
  binary: true,
  sourceDownload:true,
  description:'Frozen output bytes. format=source returns exact authored UTF-8 as an inert text/plain attachment with nosniff, no-store, source hash and storage profile; it is not a delivery artifact. Other formats retain projection, media and release checks.',
  scope: 'emails:export',
  query: [
    {
      name: 'format',
      in: 'query',
      schema: { type: 'string', enum: ['html', 'txt', 'png', 'pdf', 'zip', 'source'], default: 'html' },
    },
  ],
});
add({id:'reviewDestinationRevision',path:'/v1/email-revisions/{id}/destination-review',method:'GET',response:'DestinationReviewResponse',scope:'emails:export',description:'Current edit/export authority required. Locally compiled immutable Klaviyo, Mailchimp Classic, Omnisend HTML-import or Brevo marketing-draft preparation, explicit false remote availability and unchanged original source; not real-client or native destination evidence. Raw/custom/personalization/private assets refuse unsupported mapping.',query:[{name:'destination',in:'query',required:true,schema:{type:'string',enum:['klaviyo','mailchimp','omnisend','brevo']}}]});
add({id:'downloadDestinationRevision',path:'/v1/email-revisions/{id}/destination-artifact',method:'GET',response:'GenericResponse',binary:true,destinationDownload:true,scope:'emails:export',description:'Locally prepared frozen selected-destination attachment; no remote effect. Source/destination/content SHA256 headers bind the reviewed version. HTML or plaintext only; unsupported destination mapping fails closed.',query:[{name:'destination',in:'query',required:true,schema:{type:'string',enum:['klaviyo','mailchimp','omnisend','brevo']}},{name:'format',in:'query',schema:{type:'string',enum:['html','txt'],default:'html'}}]});
const hubspotDescription='Current edit/export authority and actor fence required. Locally declared seven-field settings compared with the exact frozen footer; settings stay in the required strict JSON body, never query parameters. Review contains hashes and fixed false readiness flags only. Account settings, entitlement, native/client conformance and remote export remain unverified. No provider call, durable export or idempotent receipt.';
add({id:'reviewHubSpotRevision',path:'/v1/email-revisions/{id}/hubspot-review',method:'POST',body:'HubSpotReviewInput',response:'HubSpotReviewResponse',hubspotBody:true,scope:'emails:export',description:hubspotDescription});
add({id:'downloadHubSpotRevision',path:'/v1/email-revisions/{id}/hubspot-artifact',method:'POST',body:'HubSpotArtifactInput',response:'GenericResponse',hubspotBody:true,hubspotDownload:true,binary:true,scope:'emails:export',description:hubspotDescription+' Recompile with the same declared settings and require expected_destination_hash; changed review409 HUBSPOT_REVIEW_CHANGED before any download audit. Explicit HTML or plaintext format only.'});
for (const [id, command, blocked] of [
  ['preflightRevision', 'preflight', false],
  ['exportRevision', 'export', true],
] as const)
  add({
    id,
    path: '/v1/email-revisions/{id}/' + command,
    method: 'POST',
    body: 'Empty',
    response: 'GenericResponse',
    keyed: true,
    blocked,
    scope: blocked ? 'emails:export' : 'emails:write',
  });
for(const [name,item]of Object.entries({CreationOperations:'CreationSummary',CreationAttempts:'CreationAttempt'}))schemas[name+'Page']=envelope({data:array(ref(item)),has_more:{type:'boolean'},next_cursor:nullable(string),total_count:{type:'integer',minimum:0}});
add({id:'listCreationOperations',path:'/v1/operations',method:'GET',response:'CreationOperationsPage',paged:true,query:[{name:'type',in:'query',required:true,schema:fromZod(CreationType)}],description:'Signed bounded creation history; scope follows required type. No private input or lease token.'});
add({id:'listCreationAttempts',path:'/v1/operations/{id}/attempts',method:'GET',response:'CreationAttemptsPage',paged:true,description:'Immutable redacted creation attempts; scope follows the selected operation.'});
add({
  id: 'getOperation',
  path: '/v1/operations/{id}',
  method: 'GET',
  response: 'OperationResponse',
  description:
    'Scope is determined by operation type (brands, emails or audience); no generic recipient-data access.',
});
add({
  id: 'cancelOperation',
  path: '/v1/operations/{id}/cancel',
  method: 'POST',
  body: 'Empty',
  response: 'OperationResponse',
  description:
    'Durable cancellation; running external reservations remain held until definitive resolution. Not a keyed replay contract.',
});
add({
  id: 'getAudienceSchema',
  path: '/v1/audience-schema',
  method: 'GET',
  response: 'GenericResponse',
  scope: 'audience:read',
  description:
    'Bounded development catalog:200lists/tags and100segments. Dedicated full-GA catalog controls remain required.',
});
for (const [id, path, body] of [
  ['createList', 'lists', 'NamedInput'],
  ['createTag', 'tags', 'NamedInput'],
  ['createContactField', 'contact-fields', 'FieldInput'],
] as const)
  add({
    id,
    path: '/v1/' + path,
    method: 'POST',
    body,
    response: 'GenericResponse',
    keyed: true,
    scope: 'audience:write',
  });
add({
  id: 'updateContactProfile',
  path: '/v1/contacts/{id}/profile',
  method: 'PATCH',
  body: 'ProfileInput',
  response: 'GenericResponse',
  keyed: true,
  scope: 'audience:write',
});
add({
  id: 'suppressContact',
  path: '/v1/contacts/{id}/suppress',
  method: 'POST',
  body: 'Empty',
  response: 'GenericResponse',
  keyed: true,
  scope: 'audience:write',
});
add({
  id: 'createSegment',
  path: '/v1/segments',
  method: 'POST',
  body: 'SegmentInput',
  response: 'GenericResponse',
  keyed: true,
  scope: 'audience:write',
});
add({
  id: 'getSegment',
  path: '/v1/segments/{id}',
  method: 'GET',
  response: 'GenericResponse',
  scope: 'audience:read',
});
for (const [id, command, body, keyed] of [
  ['createSegmentVersion', 'versions', 'SegmentVersionInput', true],
  ['previewSegment', 'preview', 'VersionInput', false],
  ['freezeAudience', 'snapshots', 'VersionInput', true],
] as const)
  add({
    id,
    path: '/v1/segments/{id}/' + command,
    method: 'POST',
    body,
    response: 'GenericResponse',
    keyed,
    scope: 'audience:write',
  });
add({id:'listAudienceSnapshots',path:'/v1/audience-snapshots',method:'GET',response:'AudienceSnapshotsPage',paged:true,scope:'audience:read',query:[{name:'segment_id',in:'query',schema:uuid}],description:'Current audience authority; strict metadata without recipient members or addresses. Signed cursors bind actor, workspace and segment/time filters. No duplicate/unknown/empty query parameters.'});
add({id:'getAudienceSnapshotMetadata',path:'/v1/audience-snapshots/{id}/metadata',method:'GET',response:'AudienceSnapshotMetadataResponse',scope:'audience:read',description:'Strict immutable selection metadata; recipient members remain restricted to the existing audience-authorized full snapshot detail.'});
add({
  id: 'getAudienceSnapshot',
  path: '/v1/audience-snapshots/{id}',
  method: 'GET',
  response: 'GenericResponse',
  scope: 'audience:read',
});
for (const [id, path, body, keyed] of [
  ['inspectImport', 'contact-imports/inspect', 'InspectInput', false],
  ['dryRunImport', 'contact-imports', 'ImportInput', true],
  ['confirmImport', 'contact-imports/{id}/confirm', 'Empty', true],
] as const)
  add({
    id,
    path: '/v1/' + path,
    method: 'POST',
    body,
    response: 'GenericResponse',
    keyed,
    scope: 'audience:write',
  });
add({
  id: 'importErrors',
  path: '/v1/contact-imports/{id}/errors',
  method: 'GET',
  response: 'GenericResponse',
  scope: 'audience:read',
  query: [{ name: 'cursor', in: 'query', schema: { type: 'integer', minimum: 0 } }],
  description:
    'Bounded error rows from one immutable import result; legacy integer cursor is not a resource-page cursor.',
});
add({
  id: 'createCampaign',
  path: '/v1/campaigns',
  method: 'POST',
  body: 'CampaignInput',
  response: 'CampaignResponse',
  keyed: true,
  scope: 'campaigns:write',
});
add({id:'getWorkspacePreferences',path:'/v1/workspace-preferences',method:'GET',response:'WorkspacePreferencesResponse',session:true,description:'Current content-role session; display preference only.'});
add({id:'setWorkspaceTimezone',path:'/v1/workspace-preferences/timezone',method:'POST',body:'WorkspaceTimezoneInput',example:{expected_version:1,time_zone:'UTC'},response:'WorkspaceTimezoneResponse',keyed:true,session:true,description:'Current Owner/Admin session and exact preference version. Replay acknowledges the original command and returns current preference. Campaign intent, hashes and approval remain intact; this does not schedule delivery.'});
add({id:'getCampaignCalendar',path:'/v1/campaigns/calendar',method:'GET',response:'CampaignCalendarResponse',paged:true,scope:'campaigns:read',query:[{name:'month',in:'query',required:true,schema:fromZod(CalendarMonth)}],description:'Complete valid planned timing displayed in saved workspace timezone. Signed cursor binds actor, tenant, month and timezone version. Redacted metadata only; no accepted delivery schedule or audience-performance measurement.'});
const ledgerDescription='Durable staged recipients from one immutable campaign configuration and frozen audience. Pending means unapproved work; authorization_issued and dispatch_enabled remain false. Current Owner/Admin audience authority and campaign+audience API scopes required before every original receipt replay. No provider attempts, send quota/frequency reservation or campaign.sent event. Runtime cannot manufacture submission acceptance/outcomes; production authorizer/provider/service identity remain unconfigured.';
add({id:'stageSubmissionLedger',path:'/v1/campaigns/{id}/submission-ledgers',method:'POST',body:'SubmissionLedgerInput',response:'SubmissionLedgerResponse',status:201,keyed:true,explicitKey:true,scope:'campaigns:write',additionalScopes:['audience:read'],description:ledgerDescription+' Exact version/digest CAS; different verified keys return the same configuration ledger. Original keyed response is historical; retrieve detail for current staging progress. Input16KiB/max10000 sorted captured members, max100 committed rows per worker transaction.'});
add({id:'listSubmissionLedgers',path:'/v1/campaigns/{id}/submission-ledgers',method:'GET',response:'SubmissionLedgersPage',paged:true,scope:'campaigns:read',additionalScopes:['audience:read'],description:ledgerDescription});
add({id:'getSubmissionLedger',path:'/v1/submission-ledgers/{id}',method:'GET',response:'SubmissionLedgerResponse',scope:'campaigns:read',additionalScopes:['audience:read'],description:ledgerDescription});
add({id:'cancelSubmissionLedger',path:'/v1/submission-ledgers/{id}/cancel',method:'POST',body:'Empty',response:'SubmissionLedgerResponse',keyed:true,explicitKey:true,scope:'campaigns:write',additionalScopes:['audience:read'],description:ledgerDescription+' Cancel unapproved staging and only pending deliveries; retain immutable identities and history. Completed materialization can be cancelled without allowing duplicate recreation.'});
add({id:'listStagedRecipients',path:'/v1/submission-ledgers/{id}/recipients',method:'GET',response:'StagedRecipientsPage',paged:true,scope:'campaigns:read',additionalScopes:['audience:read'],query:[{name:'state',in:'query',schema:{type:'string',enum:['pending','skipped','cancelled']}}],description:ledgerDescription+' Contact IDs only; no addresses. Signed cursor binds parent ledger and optional state plus actor/tenant/date filters, default25/max100.'});
add({id:'getStagedDelivery',path:'/v1/deliveries/{id}',method:'GET',response:'DeliveryResponse',scope:'campaigns:read',additionalScopes:['audience:read'],description:ledgerDescription});
add({id:'listDeliveryHistory',path:'/v1/deliveries/{id}/history',method:'GET',response:'DeliveryHistoryPage',paged:true,scope:'campaigns:read',additionalScopes:['audience:read'],description:ledgerDescription+' Append-only captured staging/cancellation transitions; outcome remains independently unknown.'});
add({id:'listDeliveryAttempts',path:'/v1/deliveries/{id}/attempts',method:'GET',response:'DeliveryAttemptsPage',paged:true,scope:'campaigns:read',additionalScopes:['audience:read'],description:ledgerDescription+' Actual attempt history is empty under current SQL admission. Read-only future shape does not imply provider acceptance. No create/update/transport route exists.'});
const assessmentDescription='Historical recipient observations from an exact immutable campaign configuration and verified frozen audience. Current Owner/Admin audience authority and additional audience:read API-key scope required on every request/replay. Selected topic is assessment context only. No approval, dispatch authorization, delivery attempt, provider call, frequency reservation or send quota. Production worker identity remains unqualified; local development worker only.';
add({id:'prepareRecipientAssessment',path:'/v1/campaigns/{id}/recipient-assessments',method:'POST',body:'RecipientAssessmentInput',response:'RecipientAssessmentResponse',status:202,keyed:true,explicitKey:true,scope:'campaigns:write',additionalScopes:['audience:read'],description:assessmentDescription+' Version and digest CAS; original keyed receipt is historical, retrieve detail for current progress. Maximum10,000 members; input16KiB.'});
add({id:'listRecipientAssessments',path:'/v1/campaigns/{id}/recipient-assessments',method:'GET',response:'RecipientAssessmentsPage',paged:true,scope:'campaigns:read',additionalScopes:['audience:read'],description:assessmentDescription});
add({id:'getRecipientAssessment',path:'/v1/recipient-assessments/{id}',method:'GET',response:'RecipientAssessmentResponse',scope:'campaigns:read',additionalScopes:['audience:read'],description:assessmentDescription});
add({id:'listRecipientObservations',path:'/v1/recipient-assessments/{id}/observations',method:'GET',response:'RecipientObservationsPage',paged:true,scope:'campaigns:read',additionalScopes:['audience:read'],description:assessmentDescription+' Contact IDs only; no recipient addresses. Signed cursor binds actor/tenant/assessment and date filters, default25/max100.'});
add({id:'cancelRecipientAssessment',path:'/v1/recipient-assessments/{id}/cancel',method:'POST',body:'Empty',response:'RecipientAssessmentResponse',keyed:true,explicitKey:true,scope:'campaigns:write',additionalScopes:['audience:read'],description:assessmentDescription+' Retains manifest and committed observations. A completed run remains completed.'});
add({id:'getCampaign',path:'/v1/campaigns/{id}',method:'GET',response:'CampaignDetailResponse',scope:'campaigns:read'});
add({id:'listCampaignConfigurations',path:'/v1/campaigns/{id}/configurations',method:'GET',response:'CampaignConfigurationsPage',paged:true,scope:'campaigns:read',description:'Observed immutable configuration metadata only; current-only migration provenance does not invent earlier versions. No raw audience or provider secrets.'});
add({id:'configureCampaign',path:'/v1/campaigns/{id}/configuration',method:'POST',body:'CampaignConfigurationInput',response:'CampaignConfigurationResponse',keyed:true,scope:'campaigns:write',description:'Current draft/review-pending version CAS, exact owned content and explicit planned timing. Optional audience_snapshot_id requires current Owner/Admin audience authority and additional audience:read on a key; omission preserves the existing selection. Exact frozen members/source digest are verified and bound without live re-evaluation. Material changes clear review/approval; no-op does not append history. Original receipts require current authority and do not imply current lifecycle state or accepted delivery.'});
for (const [id, command, blocked, scope] of [
  ['submitCampaignReview', 'submit-review', false, 'campaigns:write'],
  ['approveCampaign', 'approve', true, 'campaigns:approve'],
  ['sendCampaign', 'send', true, 'campaigns:send'],
  ['scheduleCampaign', 'schedule', true, 'campaigns:send'],
  ['pauseCampaign', 'pause', false, 'campaigns:send'],
  ['resumeCampaign', 'resume', true, 'campaigns:send'],
  ['cancelCampaign', 'cancel', false, 'campaigns:send'],
] as const)
  add({
    id,
    path: '/v1/campaigns/{id}/' + command,
    method: 'POST',
    body: 'Empty',
    response: 'CampaignResponse',
    keyed: true,
    blocked,
    scope,
  });
add({
  id: 'createApiKey',
  path: '/v1/api-keys',
  method: 'POST',
  body: 'KeyInput',
  response: 'KeyResponse',
  keyed: true,
  status: 201,
  session: true,
  example: { name: 'Example reader', scopes: ['emails:read'], expires_in_days: 90 },
});
for (const [id, command] of [
  ['rotateApiKey', 'rotate'],
  ['revokeApiKey', 'revoke'],
] as const)
  add({
    id,
    path: '/v1/api-keys/{id}/' + command,
    method: 'POST',
    body: 'Empty',
    response: command === 'revoke' ? 'GenericResponse' : 'KeyResponse',
    keyed: true,
    session: true,
  });
add({
  id: 'getUsage',
  path: '/v1/usage',
  method: 'GET',
  response: 'GenericResponse',
  session: true,
});
const spec = {
  openapi: '3.1.0',
  jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
  info: {
    title: 'Lettercape development API',
    version: '0.1.0',
    description:
      'Implemented development routes. Public launch, all65 baseline requirements and13 gates remain incomplete. Blocked operations do not imply provider/billing/sending success.',
  },
  servers: [
    { url: '/', description: 'Current deployment origin; no production destination is declared' },
  ],
  paths,
  components: {
    schemas,
    securitySchemes: {
      apiKey: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'lc_<256-bit hex>',
        description:
          'Workspace-bound scoped key, current Owner/Admin issuer, shared rolling quota.',
      },
      session: {
        type: 'apiKey',
        in: 'cookie',
        name: '__session',
        description:
          'Configured production identity session; development uses a private loopback cookie. Mutations require approved Origin; tenant header checked against current membership.',
      },
    },
  },
  'x-lettercape-pending-ga-families': [
    'Clerk invites/seats/SSO/MFA',
    'collaboration/media/translation/screenshot import',
    'provider export/status reconciliation',
    'approved delivery/scheduling/recipient ledger/provider events',
    'billing/customer/entitlements/signed webhooks',
    'rights/deletion/retention and operations',
  ],
  'x-lettercape-json-semantics':
    'EmailSpec shape does not encode all server semantic refinements (unique node IDs,200 total nodes, safe URLs/raw sanitizer, tenant references, explicit UTM well-formed Unicode/no controls/nonblank/256UTF8bytes and final2048UTF8bytes, conflicting/duplicate/case-ambiguous managed keys, signed/merge/conditional targets). Optional tracking defaults absent and changes new artifacts only; no collectors or consent/send success is implied. Server validation remains authoritative. HubSpot footer settings additionally require composed address bounds, well-formed Unicode, controls/nonblank and authored delimiter checks; these server refinements are omitted from JSON Schema and remain authoritative.',
};
await mkdir('public', { recursive: true });
await mkdir('sdk', { recursive: true });
const outputs: Record<string, string> = {
  'public/openapi.json': JSON.stringify(spec, null, 2) + '\n',
  'sdk/operations.ts':
    '// Generated by npm run api:generate. Do not edit.\nexport const operationRegistry = ' +
    JSON.stringify(registry, null, 2) +
    ' as const;\n',
};
const require = createRequire(new URL('../tooling/openapi/package.json', import.meta.url));
const { default: openapiTS, astToString } = await import(require.resolve('openapi-typescript'));
outputs['sdk/schema.d.ts'] = astToString(await openapiTS(spec, { defaultNonNullable: false }));
if (process.argv.includes('--check')) {
  for (const [path, value] of Object.entries(outputs))
    if ((await readFile(path, 'utf8')) !== value) throw new Error('Generated API drift: ' + path);
} else for (const [path, value] of Object.entries(outputs)) await writeFile(path, value);
console.log(
  `${Object.keys(registry).length} documented route operations; generated OpenAPI3.1 and SDK types ${process.argv.includes('--check') ? 'match' : 'written'}.`,
);
