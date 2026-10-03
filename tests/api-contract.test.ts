import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apiSpec as spec,
  absoluteSchema as absolute,
  validateSchema as validate,
} from '../scripts/api-validation';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { assertRouteMethod } from '../src/server/http';
import { DispatchPolicyInput } from '../src/domain/dispatch-controls';
import { BrandSchema } from '../src/domain/brand';
import { EmailSpecSchema } from '../src/domain/email';
import { validateRule } from '../src/domain/segments';
import { operationRegistry } from '../sdk/operations';
import {HubSpotReviewInput,HubSpotArtifactInput} from '../src/domain/hubspot-footer-contracts';
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(spec, 'https://lettercape.test/contract');
test('OpenAPI3.1 documents every enabled method, all request examples validate and semantic domain examples pass', () => {
  assert.equal(spec.openapi, '3.1.0');
  const covered = new Set<string>();
  for (const [path, methods] of Object.entries(spec.paths))
    for (const [method, value] of Object.entries(
      methods as Record<
        string,
        {
          operationId: string;
          requestBody?: { content: Record<string, { schema: unknown; example?: unknown }> };
        }
      >,
    )) {
      const segments = path
        .replace(/\{[^}]+\}/g, '11111111-1111-4111-8111-111111111111')
        .split('/')
        .slice(2);
      assertRouteMethod(segments, method.toUpperCase());
      covered.add(method.toUpperCase() + ' ' + path);
      const media = value.requestBody?.content['application/json'];
      if (media) {
        assert.notEqual(media.example, undefined);
        validate(absolute(media.schema), media.example);
      }
    }
  const roots = [
    'assets',
    'sender-identities',
    'workspace-preferences','memberships','membership-changes',
    'brand-sources',
    'webhook-deliveries',
    'webhook-endpoints',
    'events',
    'dispatch-controls',
    'health',
    'workspaces',
    'session',
    'local-session',
    'integrations',
    'brands',
    'emails',
    'templates',
    'submission-ledgers',
    'deliveries',
    'email-revisions',
    'operations',
    'contacts',
    'audience-schema',
    'lists',
    'tags',
    'contact-fields',
    'segments',
    'audience-snapshots',
    'contact-imports',
    'campaigns',
    'api-keys',
    'usage',
    'audit',
  ];
  const ids = ['', '{id}', 'uploads', 'generate', 'from-url', 'inspect', 'current', 'workspace', 'summary', 'calendar', 'timezone', 'report'];
  const commands = [
    'source-import','source-fork',
    'archive',
    'submission-ledgers',
    'recipients',
    'history',
    'fallback', 'publish',
    'dns-checks','conversion-proposal','convert-to-blocks',
    'role','transfer-owner',
    '',
    'memory-preview',
    'remove',
    'attempts',
    'replay',
    'draft',
    'revisions',
    'restore',
    'preview',
    'import-html',
    'download',
    'preflight',
    'export',
    'cancel',
    'profile',
    'suppress',
    'versions',
    'snapshots',
    'metadata',
    'errors',
    'confirm',
    'submit-review',
    'approve',
    'send',
    'schedule',
    'pause',
    'resume',
    'rotate',
    'revoke',
    'remix',
    'localize',
    'derivatives','locale-source',
  ];
  for (const root of roots)
    for (const id of ids)
      for (const command of commands) {
        if (command && !id) continue;
        const path = '/v1/' + [root, id, command].filter(Boolean).join('/');
        for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
          try {
            assertRouteMethod(
              path.replace('{id}', '11111111-1111-4111-8111-111111111111').split('/').slice(2),
              method,
            );
          } catch {
            continue;
          }
          assert.ok(covered.has(method + ' ' + path), 'Missing ' + method + ' ' + path);
        }
      }
  const sample = (path: string, method = 'post') =>
    spec.paths[path][method].requestBody.content['application/json'].example;
  DispatchPolicyInput.parse(sample('/v1/dispatch-controls/workspace'));
  BrandSchema.parse(sample('/v1/brands'));
  EmailSpecSchema.parse(sample('/v1/emails/{id}/draft', 'patch').spec);
  validateRule(sample('/v1/segments').rule, []);
  assert.equal(covered.size, Object.keys(operationRegistry).length);
  assert.ok(covered.has('PUT /v1/assets/uploads/{uploadId}/content'));
  assert.ok(covered.has('GET /v1/assets/{id}/variants/{variantId}/content'));
});
test('source contracts distinguish exact text bytes, replay receipts and inert source download',()=>{
  const input=spec.paths['/v1/emails/{id}/source-import']?.post;
  assert.ok(input,'source text import must be documented');
  assert.deepEqual(Object.keys(input.requestBody.content),['text/plain']);
  assert.equal(input['x-lettercape-body-max-bytes'],2097152);
  for(const name of ['If-Match','Idempotency-Key'])assert.equal(input.parameters.find((p:{name:string})=>p.name===name).required,true);
  assert.equal(input.parameters.find((p:{name:string})=>p.name==='X-Actor-Id').required,false);
  const draft=spec.paths['/v1/emails/{id}/draft'].patch;
  assert.equal(draft['x-lettercape-body-max-bytes'],13697024);
  assert.equal(draft.responses[200].content['application/json'].schema.$ref,'#/components/schemas/SavedEmailResponse');
  const fork=ajv.compile(absolute(spec.components.schemas.SourceForkInput) as object);
  assert.equal(fork({expected_artifact_hash:'a'.repeat(64)}),true);
  assert.equal(fork({expected_artifact_hash:'bad'}),false);
  assert.equal(fork({expected_artifact_hash:'a'.repeat(64),html:'untrusted'}),false);
  const receipt=ajv.compile(absolute(spec.components.schemas.SaveReceipt) as object),id='11111111-1111-4111-8111-111111111111';
  const value={receipt_version:1,workspace_id:id,email_id:id,request_base_version:1,saved_doc_version:2,command_id:'source-1',spec_hash:'a'.repeat(64),source:null};
  assert.equal(receipt(value),true);
  assert.equal(receipt({...value,source:{profile:'exact-utf8-1',sha256:'b'.repeat(64),bytes:2097152}}),true);
  assert.equal(receipt({...value,source:{profile:'claimed-safe',sha256:'b'.repeat(64),bytes:1}}),false);
  assert.equal(receipt({...value,source:{profile:'exact-utf8-1',sha256:'bad',bytes:1}}),false);
  const download=spec.paths['/v1/email-revisions/{id}/download'].get;
  assert.ok(download.parameters.find((p:{name:string})=>p.name==='format').schema.enum.includes('source'));
  assert.ok(download.responses[200].content['text/plain']);
  for(const name of ['X-Source-SHA256','X-Source-Profile','X-Content-Type-Options','Content-Disposition'])assert.ok(download.responses[200].headers[name]);
});
test('media contracts bind rights and bounded raw upload bodies without JSON coercion', () => {
  const schema = spec.components.schemas.AssetUploadInput;
  assert.ok(schema, 'asset upload intent must be documented');
  const check = ajv.compile(absolute(schema) as object);
  const input = { filename: 'example.png', declared_mime: 'image/png', byte_size: 4, sha256: 'a'.repeat(64), rights: { attested: true, terms_version: 'local-upload-attestation-v1' } };
  assert.equal(check(input), true);
  for (const invalid of [{...input, byte_size: 20971521}, {...input, rights:{...input.rights,attested:false}}, {...input, declared_mime:'image/svg+xml'}, {...input, public_url:'https://example.test'}]) assert.equal(check(invalid), false);
  const transfer = spec.paths['/v1/assets/uploads/{uploadId}/content'].put;
  assert.deepEqual(Object.keys(transfer.requestBody.content), ['application/octet-stream']);
  assert.equal(transfer.requestBody.content['application/octet-stream'].schema.maxLength, 20971520);
  assert.ok(transfer.parameters.some((p: {name:string;required?:boolean}) => p.name === 'X-Upload-Token' && p.required));
  assert.equal(transfer.parameters.some((p: {name:string}) => p.name === 'Idempotency-Key'), false);
  assert.deepEqual(spec.paths['/v1/assets'].get.parameters.filter((p: {in:string}) => p.in === 'query').map((p: {name:string})=>p.name), ['limit','after']);
  const fallback=ajv.compile(absolute(spec.components.schemas.AssetFallbackInput) as object);
  assert.equal(fallback({selected_frame:199}),true);
  assert.equal(fallback({selected_frame:200}),false);
  assert.equal(fallback({selected_frame:0,source:'remote'}),false);
  const id='11111111-1111-4111-8111-111111111111';
  const asset={id,state:'quarantined',version:1,mime:'image/png',bytes:4,source_sha256:'a'.repeat(64),alt:'Example',decorative:false,failure_code:null,variants:[]};
  for(const [name,value] of Object.entries({
    AssetUploadResponse:{request_id:'r',upload:{id,token:'a'.repeat(64),expires_at:'2026-10-02T12:00:00Z'},operation:{id,state:'queued'}},
    AssetUploadContentResponse:{request_id:'r',upload:{id,status:'finalized'},operation:{id,state:'queued'},asset_id:id},
    AssetResponse:{request_id:'r',asset},
    AssetFallbackResponse:{request_id:'r',operation:{id,state:'queued'},asset},
    AssetsPage:{request_id:'r',data:[asset],has_more:false,next_cursor:null},
  })) validate(absolute(spec.components.schemas[name]),value);
});
test('Contract examples reject executable/unknown email shapes and required error/page omissions', () => {
  const check = ajv.compile(absolute({ $ref: '#/components/schemas/EmailSpec' }) as object);
  const example = structuredClone(
    spec.paths['/v1/emails/{id}/draft'].patch.requestBody.content['application/json'].example.spec,
  );
  example.sections = [{ id: 'x', type: 'script', html: '<script>x</script>' }];
  assert.equal(check(example), false);
  const page = ajv.compile(absolute({ $ref: '#/components/schemas/ContactsPage' }) as object);
  assert.equal(page({ request_id: 'r', data: [] }), false);
  const error = ajv.compile(absolute({ $ref: '#/components/schemas/ErrorResponse' }) as object);
  assert.equal(error({ error: { message: 'failure' } }), false);
});
test('HubSpot POST contracts are private strict bounded bodies with honest receipts and attachment headers',()=>{
 const review=spec.paths['/v1/email-revisions/{id}/hubspot-review']?.post,download=spec.paths['/v1/email-revisions/{id}/hubspot-artifact']?.post;
 assert.ok(review);assert.ok(download);
 for(const [operation,id,input] of [[review,'reviewHubSpotRevision','HubSpotReviewInput'],[download,'downloadHubSpotRevision','HubSpotArtifactInput']] as const){
  assert.equal(operation.operationId,id);assert.equal(operation['x-lettercape-idempotent-command'],false);assert.equal(operation['x-lettercape-availability'],'development');assert.deepEqual(operation['x-lettercape-scopes'],['emails:export']);
  assert.equal(operation['x-lettercape-body-max-bytes'],16384);assert.equal(operation.requestBody.required,true);assert.deepEqual(Object.keys(operation.requestBody.content),['application/json']);
  assert.equal(operation.parameters.some((p:{in:string})=>p.in==='query'),false);assert.equal(operation.parameters.find((p:{name:string})=>p.name==='X-Actor-Id').required,false);
  for(const status of [408,415,499])assert.ok(operation.responses[status]);
  const example=operation.requestBody.content['application/json'].example,check=ajv.compile(absolute(spec.components.schemas[input]) as object);assert.equal(check(example),true);
  for(const extra of ['revision_id','readiness','remote_export_enabled'])assert.equal(check({...example,[extra]:true}),false);
  assert.equal(check({...example,settings:{...example.settings,unknown:'marker'}}),false);
  assert.equal(Object.keys(example.settings).length,7);
  (input==='HubSpotReviewInput'?HubSpotReviewInput:HubSpotArtifactInput).parse(example);
 }
 const example=download.requestBody.content['application/json'].example,check=ajv.compile(absolute(spec.components.schemas.HubSpotArtifactInput) as object);
 assert.equal(check({...example,format:'pdf'}),false);assert.equal(check({...example,expected_destination_hash:'bad'}),false);
 const missing={...example};delete missing.expected_destination_hash;assert.equal(check(missing),false);
 assert.equal(review.responses[200].content['application/json'].schema.$ref,'#/components/schemas/HubSpotReviewResponse');
 const receipt=spec.components.schemas.HubSpotReviewResponse;assert.equal(receipt.additionalProperties,false);assert.equal(receipt.properties.review.additionalProperties,false);
 for(const flag of ['remote_export_enabled','account_settings_verified','native_conformance_verified','management_link_verified'])assert.equal(receipt.properties.review.properties[flag].const,false);
 const value={request_id:'11111111-1111-4111-8111-111111111111',review:{destination:'hubspot',mapping_version:'hubspot-coded-footer-1',comparison_version:'hubspot-footer-comparison-1',revision_id:'11111111-1111-4111-8111-111111111111',source_artifact_hash:'a'.repeat(64),destination_hash:'b'.repeat(64),html_sha256:'c'.repeat(64),text_sha256:'d'.repeat(64),settings_digest:'e'.repeat(64),settings_origin:'locally_declared',remote_export_enabled:false,account_settings_verified:false,native_conformance_verified:false,management_link_verified:false,transformations:['Local comparison'],blockers:['CONNECTION_AUTH_MODE_UNAPPROVED','HUBSPOT_ACCOUNT_SETTINGS_UNVERIFIED','ACCOUNT_ENTITLEMENT_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','MANAGEMENT_LINK_UNVERIFIED']}};
 const validateReceipt=ajv.compile(absolute(receipt) as object);assert.equal(validateReceipt(value),true);
 for(const flag of ['remote_export_enabled','account_settings_verified','native_conformance_verified','management_link_verified'])assert.equal(validateReceipt({...value,review:{...value.review,[flag]:true}}),false);
 for(const extra of ['settings','html','text','api_revision','url'])assert.equal(validateReceipt({...value,review:{...value.review,[extra]:'marker'}}),false);
 assert.equal(validateReceipt({...value,review:{...value.review,settings_digest:'bad'}}),false);
 for(const absent of ['settings','html','text','api_revision','url'])assert.equal(Object.hasOwn(receipt.properties.review.properties,absent),false);
 assert.deepEqual(Object.keys(download.responses[200].content),['text/html','text/plain']);
 const headers=download.responses[200].headers;
 for(const name of ['X-Artifact-Hash','X-Source-Artifact-Hash','X-Content-SHA256','X-Request-Id','Content-Disposition','Content-Type','Cache-Control','X-Content-Type-Options','Content-Security-Policy','X-Mailcraft-Notice'])assert.ok(headers[name]);
 assert.deepEqual(headers['X-Destination-Mapping'].schema.enum,['hubspot-coded-footer-1']);assert.equal(headers['X-Remote-Export-Enabled'].schema.const,'false');assert.equal(headers['X-Artifact-Hash'].description.includes('API revision'),false);
 assert.equal(spec.components.schemas.DestinationReviewResponse.properties.review.oneOf.length,4);
 assert.equal(Object.keys(operationRegistry).length,140);
 assert.match(spec['x-lettercape-json-semantics'],/HubSpot.*composed address.*Unicode.*delimiter.*authoritative/);
});
