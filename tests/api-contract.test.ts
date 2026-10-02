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
  const ids = ['', '{id}', 'uploads', 'generate', 'from-url', 'inspect', 'current', 'workspace', 'summary', 'calendar', 'timezone'];
  const commands = [
    'source-import','source-fork',
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
    'derivatives',
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
