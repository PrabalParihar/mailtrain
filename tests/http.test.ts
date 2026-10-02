import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertRouteMethod, readJson } from '../src/server/http.js';
test('media routes accept only exact metadata, upload and immutable derivative paths', () => {
  const id = 'e6f9ffdf-22bb-479c-abdd-034fe959fcfa';
  for (const [path, method] of [
    [['assets'], 'GET'], [['assets', 'uploads'], 'POST'],
    [['assets', id], 'GET'], [['assets', id, 'fallback'], 'POST'],
    [['assets', id, 'remove'], 'POST'], [['assets', id, 'publish'], 'POST'],
    [['assets', 'uploads', id, 'content'], 'PUT'],
    [['assets', id, 'variants', id, 'content'], 'GET'],
  ] as const) assert.doesNotThrow(() => assertRouteMethod([...path], method));
  for (const path of [
    ['assets', id, 'variants', 'bad', 'content'], ['assets', id, 'variants', id],
    ['assets', id, 'variants', id, 'content', 'extra'], ['assets', 'uploads', id, 'other'],
    ['assets', 'uploads', 'bad', 'content'], ['assets', id, 'fallback', 'extra'],
    ['emails', id, 'variants', id, 'content'],
  ]) assert.throws(() => assertRouteMethod(path, 'GET'), /not found/);
  assert.throws(() => assertRouteMethod(['assets', 'uploads', id, 'content'], 'POST'), /method is not allowed/);
  assert.throws(() => assertRouteMethod(['assets', id, 'variants', id, 'content'], 'PUT'), /method is not allowed/);
  assert.throws(() => assertRouteMethod(['assets', id, 'fallback'], 'GET'), /method is not allowed/);
});
test('command routes reject GET mutation, unexpected suffixes and unsupported methods', () => {
  const id = 'e6f9ffdf-22bb-479c-abdd-034fe959fcfa';
  for (const path of [
    ['operations', id, 'cancel'],
    ['email-revisions', id, 'preflight'],
    ['contact-imports', id, 'confirm'],
    ['campaigns', id, 'approve'],
  ])
    assert.throws(() => assertRouteMethod(path, 'GET'), /method is not allowed/);
  assert.throws(() => assertRouteMethod(['health', 'anything'], 'GET'), /not found/);
  assert.throws(() => assertRouteMethod(['emails', id, 'revisions', 'extra'], 'POST'), /not found/);
  assertRouteMethod(['email-revisions', id, 'download'], 'GET');
  assertRouteMethod(['emails', id, 'draft'], 'PATCH');
});
test('JSON is limited while streaming, without relying on Content-Length', async () => {
  const req = new Request('https://example.test', {
    method: 'POST',
    body: '{"x":"' + 'a'.repeat(64) + '"}',
  });
  await assert.rejects(readJson(req, 32), /exceeds/);
  await assert.rejects(
    readJson(new Request('https://example.test', { method: 'POST', body: '[]' })),
    /JSON object/,
  );
  assert.deepEqual(
    await readJson(new Request('https://example.test', { method: 'POST', body: '{"x":1}' })),
    { x: 1 },
  );
});
