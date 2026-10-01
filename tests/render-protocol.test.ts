import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  renderRequestHeaders,
  verifyRenderRequest,
  validateRenderInput,
  RENDERER_VERSION,
  MAX_RENDER_INPUT,
} from '../renderer/protocol.mjs';
const secret = randomBytes(32).toString('hex');
const input = {
  schema_version: 1 as const,
  workspace_id: randomUUID(),
  revision_id: randomUUID(),
  artifact_hash: 'a'.repeat(64),
  renderer_version: RENDERER_VERSION,
  format: 'png' as const,
  html: '<p>Fixture</p>',
};
test('render signature binds exact bytes/id/time; rejects tamper, stale/future and invalid key', () => {
  const raw = Buffer.from(JSON.stringify(input)),
    id = randomUUID(),
    headers = renderRequestHeaders(raw, secret, id, 1000);
  assert.equal(verifyRenderRequest(raw, headers, secret, 1001), id);
  assert.throws(() => verifyRenderRequest(Buffer.from('{}'), headers, secret, 1001));
  assert.throws(() =>
    verifyRenderRequest(raw, { ...headers, 'X-Render-Request-Id': randomUUID() }, secret, 1001),
  );
  assert.throws(() => verifyRenderRequest(raw, headers, secret, 1301));
  assert.throws(() => verifyRenderRequest(raw, headers, secret, 600));
  assert.throws(() => renderRequestHeaders(raw, 'weak', id, 1000));
});
test('render input has strict bounded tenant/artifact/version/format, no ambient provider or recipient authority', () => {
  assert.deepEqual(validateRenderInput(input), input);
  for (const invalid of [
    { ...input, workspace_id: 'other' },
    { ...input, artifact_hash: 'bad' },
    { ...input, renderer_version: 'unknown' },
    { ...input, format: 'html' },
    { ...input, api_key: 'secret' },
    { ...input, html: 'x'.repeat(MAX_RENDER_INPUT + 1) },
  ])
    assert.throws(() => validateRenderInput(invalid));
});
