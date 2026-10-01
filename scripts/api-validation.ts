import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { operationRegistry } from '../sdk/operations';
export const apiSpec = JSON.parse(readFileSync('public/openapi.json', 'utf8'));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(apiSpec, 'https://lettercape.test/contract');
export function absoluteSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(absoluteSchema);
  if (schema && typeof schema === 'object')
    return Object.fromEntries(
      Object.entries(schema).map(([k, v]) => [
        k,
        k === '$ref' && typeof v === 'string' && v.startsWith('#')
          ? 'https://lettercape.test/contract' + v
          : absoluteSchema(v),
      ]),
    );
  return schema;
}
export function validateSchema(schema: unknown, value: unknown) {
  const validator = ajv.compile(absoluteSchema(schema) as object);
  assert.ok(validator(value), JSON.stringify(validator.errors));
}
export function validateApiResponse(
  operation: keyof typeof operationRegistry,
  status: number,
  body: unknown,
) {
  const registry = operationRegistry[operation];
  const definition = apiSpec.paths[registry.path][registry.method.toLowerCase()];
  const schema = definition.responses[status]?.content?.['application/json']?.schema;
  assert.ok(schema, 'Undocumented response ' + operation + ':' + status);
  validateSchema(schema, body);
}
