import type { LettercapeClient } from './client';
// Compiled only: catches regressions in generated operation/body/path/query types.
export function typeExamples(client: LettercapeClient) {
  void client.call('listEmails', { query: { limit: 25 } });
  void client.call('createEmail', { body: { title: 'Example' } });
  void client.call('createApiKey', { body: { name: 'Reader', scopes: ['emails:read'] } });
  // @ts-expect-error unsupported resource scope cannot be delegated
  void client.call('createApiKey', { body: { name: 'Invalid', scopes: ['billing:delete'] } });
  // @ts-expect-error unknown command body field
  void client.call('createEmail', { body: { title: 'Example', sendImmediately: true } });
  // @ts-expect-error resource path is required
  void client.call('getEmail');
  // @ts-expect-error unknown operation is not part of this contract
  void client.call('unverifiedSendSuccess');
  // @ts-expect-error only documented cursor pages can be iterated
  void client.pages('getEmail', { path: { id: 'example' } });
}
