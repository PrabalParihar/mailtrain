import type { LettercapeClient } from './client';
// Compiled only: catches regressions in generated operation/body/path/query types.
export function typeExamples(client: LettercapeClient) {
  void client.call('listEmails', { query: { limit: 25 } });
  void client.call('createEmail', { body: { title: 'Example' } });
  void client.call('remixRevision', { path: { id: 'example' }, body: { title: 'Source copy' } });
  void client.call('createLocaleDraft', { path: { id: 'example' }, body: { title: 'Arabic draft', locale: 'ar-SA' } });
  void client.pages('listEmailDerivatives', { path: { id: 'example' }, query: { limit: 25 } });
  // @ts-expect-error locale drafts cannot claim an unsupported language
  void client.call('createLocaleDraft', { path: { id: 'example' }, body: { title: 'Unsupported', locale: 'xx-ZZ' } });
  // @ts-expect-error immutable source path is required
  void client.call('remixRevision', { body: { title: 'No source' } });
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

  void client.pages('listWebhookEndpoints',{});
  void client.call('createWebhookEndpoint',{body:{name:'Paused',url:'https://example.org/webhook',subscriptions:['contacts.imported']}});
  void client.call('rotateWebhookEndpoint',{path:{id:'example'},body:{expected_version:1}});
  // @ts-expect-error reserved future event cannot be subscribed
  void client.call('createWebhookEndpoint',{body:{name:'Invalid',url:'https://example.org',subscriptions:['campaign.delivered']}});
  void client.pages('listEvents', {query:{type:'contact.unsubscribed'}});
  void client.call('getEvent', {path:{id:'example'}});
  // @ts-expect-error an unimplemented delivery proof is not a supported event filter
  void client.pages('listEvents', {query:{type:'campaign.delivered'}});
  void client.call('getDispatchControls', {});
  void client.call('setWorkspaceDispatchPolicy', { body: { expected_version: 0, paused: true, reason: 'incident' } });
  // @ts-expect-error Unknown dispatch reasons cannot be submitted
  void client.call('setWorkspaceDispatchPolicy', { body: { expected_version: 0, paused: false, reason: 'guess' } });
}
