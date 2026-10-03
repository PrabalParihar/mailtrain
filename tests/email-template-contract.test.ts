import test from 'node:test';
import assert from 'node:assert/strict';
import { assertRouteMethod } from '../src/server/http';
import { scopeForResource } from '../src/domain/api-keys';

const id = 'e6f9ffdf-22bb-479c-abdd-034fe959fcfa';
test('template routes expose only collection, detail, archive and independent draft commands', () => {
  for (const [path, method] of [
    [['templates'], 'GET'], [['templates'], 'POST'],
    [['templates', id], 'GET'], [['templates', id, 'archive'], 'POST'],
    [['templates', id, 'remix'], 'POST'],
  ] as const) assert.doesNotThrow(() => assertRouteMethod([...path], method));
  for (const [path, method] of [
    [['templates', id], 'DELETE'], [['templates', id], 'PATCH'],
    [['templates', id, 'archive'], 'GET'], [['templates', id, 'remix'], 'GET'],
    [['templates'], 'PUT'],
  ] as const) assert.throws(() => assertRouteMethod([...path], method), /method is not allowed/);
  for (const path of [['templates', 'bad'], ['templates', id, 'edit'], ['templates', id, 'remix', 'extra']])
    assert.throws(() => assertRouteMethod(path, 'POST'), /not found/);
});
test('templates use existing explicit email read and write scopes', () => {
  assert.equal(scopeForResource('templates', 'GET', undefined), 'emails:read');
  for (const command of [undefined, 'archive', 'remix'])
    assert.equal(scopeForResource('templates', 'POST', command), 'emails:write');
});
