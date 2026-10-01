import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/ui/api.js';
test('a lost command response retries the same key and acknowledged next intent gets a new key', async () => {
  const original = globalThis.fetch,
    storage = new Map<string, string>(),
    keys: string[] = [];
  let attempt = 0;
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
      removeItem: (k: string) => storage.delete(k),
    },
  });
  globalThis.fetch = async (_url, init) => {
    keys.push((init?.headers as Record<string, string>)['Idempotency-Key']);
    if (attempt++ === 0) throw new TypeError('Committed response was lost');
    return new Response(JSON.stringify({ email: { id: 'same-logical-command' } }), { status: 200 });
  };
  try {
    await assert.rejects(api('fixture', 'emails', 'POST', { title: 'Same intent' }));
    await api('fixture', 'emails', 'POST', { title: 'Same intent' });
    assert.equal(keys[0], keys[1]);
    await api('fixture', 'emails', 'POST', { title: 'Same intent' });
    assert.notEqual(keys[1], keys[2]);
  } finally {
    globalThis.fetch = original;
    Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
