import test from 'node:test';
import assert from 'node:assert/strict';
import { KeyInput, scopeForResource } from '../src/domain/api-keys.js';
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
