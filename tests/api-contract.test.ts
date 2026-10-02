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
        .replace(/\{id\}/g, '11111111-1111-4111-8111-111111111111')
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
  const ids = ['', '{id}', 'generate', 'from-url', 'inspect', 'current', 'workspace', 'summary', 'calendar', 'timezone'];
  const commands = [
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
        for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
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
