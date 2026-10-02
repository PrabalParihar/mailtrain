import test from 'node:test';
import assert from 'node:assert/strict';
import { KeyInput, scopeForResource, operationScope } from '../src/domain/api-keys.js';
test('media credentials separate asset reads, writes and operation recovery', () => {
  assert.equal(KeyInput.safeParse({ name: 'Media', scopes: ['assets:read', 'assets:write'] }).success, true);
  assert.equal(scopeForResource('assets', 'GET', undefined), 'assets:read');
  assert.equal(scopeForResource('assets', 'GET', 'variants'), 'assets:read');
  assert.equal(scopeForResource('assets', 'PUT', 'content'), 'assets:write');
  assert.equal(scopeForResource('assets', 'POST', 'fallback'), 'assets:write');
  for (const type of ['asset.upload', 'asset.process', 'asset.fallback']) {
    assert.equal(operationScope(type), 'assets:read');
    assert.equal(operationScope(type, true), 'assets:write');
  }
  assert.equal(operationScope('asset.unknown'), 'unsupported');
});
test('key grants are explicit bounded scopes and resource access is separate', () => {
  assert.equal(
    KeyInput.safeParse({ name: 'Read', scopes: ['emails:read'], expires_in_days: 90 }).success,
    true,
  );
  assert.equal(
    KeyInput.safeParse({ name: 'Root', scopes: ['*'], expires_in_days: 90 }).success,
    false,
  );
  assert.equal(
    KeyInput.safeParse({
      name: 'Duplicate',
      scopes: ['emails:read', 'emails:read'],
      expires_in_days: 90,
    }).success,
    false,
  );
  assert.equal(
    KeyInput.safeParse({ name: 'Never', scopes: ['emails:read'], expires_in_days: 0 }).success,
    false,
  );
  assert.equal(scopeForResource('contacts', 'GET', undefined), 'audience:read');
  assert.equal(scopeForResource('campaigns', 'POST', 'approve'), 'campaigns:approve');
  assert.equal(scopeForResource('campaigns', 'POST', 'send'), 'campaigns:send');
  assert.equal(scopeForResource('email-revisions', 'GET', 'download'), 'emails:export');
});
