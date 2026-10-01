import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { BrandSchema } from '../src/domain/brand';
import { EmailSpecSchema, blankSpec } from '../src/domain/email';
import { KeyInput } from '../src/domain/api-keys';
import { MappingSchema } from '../src/domain/contact-import';
import { FieldSchema, RuleLeafSchema } from '../src/domain/segments';
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
  Brand: fromZod(BrandSchema),
  EmailSpec: fromZod(EmailSpecSchema),
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
    { title: { type: 'string', minLength: 1, maxLength: 160 }, spec: ref('EmailSpec') },
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
  DraftInput: object({ spec: ref('EmailSpec') }, undefined, false),
  RestoreInput: object({ revision_id: uuid }, undefined, false),
  PreviewInput: object({ spec: ref('EmailSpec') }, undefined, false),
  HtmlInput: object({ html: { type: 'string', maxLength: 2000000 } }, undefined, false),
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
  Campaign: object({
    id: uuid,
    name: string,
    state: string,
    revision_id: uuid,
    intent: json,
    digest: string,
    created_at: time,
  }),
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
    { id: uuid, type: string, state: string, result: {}, error: {}, created_at: time },
    ['id', 'type', 'state'],
  ),
};
const envelope = (props: Record<string, unknown>, required = Object.keys(props)) =>
  object({ request_id: string, ...props }, ['request_id', ...required]);
for (const [name, item] of Object.entries({
  Emails: 'Email',
  Brands: 'BrandVersion',
  Keys: 'Key',
  Revisions: 'Revision',
  Contacts: 'Contact',
  Campaigns: 'Campaign',
  Segments: 'Segment',
  Audit: 'Audit',
  Derivatives: 'Email',
}))
  schemas[name + 'Page'] = envelope({
    data: array(ref(item)),
    has_more: { type: 'boolean' },
    next_cursor: nullable(string),
    total_count: { type: 'integer', minimum: 0 },
  });
schemas.EmailResponse = envelope({ email: ref('Email') });
schemas.DerivationResponse = envelope({ email: ref('Email'), revision: json, lineage: json });
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
  etag?: boolean;
  paged?: boolean;
  session?: boolean;
  public?: boolean;
  blocked?: boolean;
  query?: unknown[];
  scope?: string;
  example?: unknown;
  binary?: boolean;
  description?: string;
};
const exampleId = '11111111-1111-4111-8111-111111111111';
const examples: Record<string, unknown> = {
  Empty: {},
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
  DraftInput: { spec: blankSpec(exampleId, 'Example brand') },
  PreviewInput: { spec: blankSpec(exampleId, 'Example brand') },
  RestoreInput: { revision_id: exampleId },
  HtmlInput: { html: '<p>Example</p>' },
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
      schema: { type: 'string', minLength: 8, maxLength: 200 },
      description:
        'Keep the same key and exact payload during uncertain recovery; mismatch409. Raw key secret is never stored in receipts.',
    });
  if (d.etag)
    parameters.push({
      name: 'If-Match',
      in: 'header',
      required: true,
      schema: { type: 'string', pattern: '^"draft-[1-9][0-9]*"$' },
      description: 'Acknowledged draft version; stale412, absent428.',
    });
  if (d.paged) parameters.push(...pageParameters);
  if (d.query) parameters.push(...d.query);
  const success = d.binary
    ? {
        description: 'Frozen bytes; browser image/PDF simulations, not real-client evidence.',
        headers: { 'X-Request-Id': { schema: string }, 'X-Artifact-Hash': { schema: string } },
        content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
      }
    : {
        description: d.blocked
          ? 'Reserved shape; the current development command always returns a documented provider/release error.'
          : 'Acknowledged result',
        headers: {
          'X-Request-Id': { schema: string },
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
    ...(d.body
      ? {
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: ref(d.body),
                example: d.example ?? examples[d.body],
              },
            },
          },
        }
      : {}),
    responses: { [d.status ?? 200]: success, ...errors },
    'x-lettercape-scopes': d.scope ? [d.scope] : [],
    'x-lettercape-availability': d.blocked ? 'blocked' : 'development',
    'x-lettercape-idempotent-command': !!d.keyed,
  };
  registry[d.id] = {
    method: d.method,
    path: d.path,
    keyed: !!d.keyed,
    paged: !!d.paged,
    binary: !!d.binary,
    blocked: !!d.blocked,
  };
}
const ID = '11111111-1111-4111-8111-111111111111';
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
  scope: 'emails:write',
  example: { title: 'Example draft' },
});
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
add({ id: 'listEmailDerivatives', path: '/v1/emails/{id}/derivatives', method: 'GET', response: 'DerivativesPage', paged: true, scope: 'emails:read' });
for (const [id, command, body] of [['remixRevision', 'remix', 'RemixInput'], ['createLocaleDraft', 'localize', 'LocaleDraftInput']] as const)
  add({ id, path: '/v1/email-revisions/{id}/' + command, method: 'POST', response: 'DerivationResponse', body, keyed: true, status: 201, scope: 'emails:write', description: command === 'localize' ? 'Creates a separately versioned manual locale draft linked to the frozen source. Source text is retained, not translated or reviewed; no AI/provider/send success is implied.' : 'Copies a frozen source into a separately versioned same-workspace remix with immutable source provenance. Source remains intact.' });
for (const [id, command, method, body, response, keyed, etag] of [
  ['saveDraft', 'draft', 'PATCH', 'DraftInput', 'EmailResponse', false, true],
  ['checkpointEmail', 'revisions', 'POST', 'Empty', 'RevisionResponse', true, true],
  ['restoreEmail', 'restore', 'POST', 'RestoreInput', 'EmailResponse', true, true],
  ['previewEmail', 'preview', 'POST', 'PreviewInput', 'GenericResponse', false, false],
  ['importHtml', 'import-html', 'POST', 'HtmlInput', 'EmailResponse', false, true],
] as const)
  add({
    id,
    path: '/v1/emails/{id}/' + command,
    method,
    body,
    response,
    keyed,
    etag,
    scope: 'emails:write',
  });
add({
  id: 'downloadRevision',
  path: '/v1/email-revisions/{id}/download',
  method: 'GET',
  response: 'GenericResponse',
  binary: true,
  scope: 'emails:export',
  query: [
    {
      name: 'format',
      in: 'query',
      schema: { type: 'string', enum: ['html', 'txt', 'png', 'pdf'], default: 'html' },
    },
  ],
});
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
    'EmailSpec shape does not encode all server semantic refinements (unique node IDs,200 total nodes, safe URLs/raw sanitizer, tenant references). Server validation remains authoritative.',
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
