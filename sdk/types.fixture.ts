import type { LettercapeClient } from './client';
// Compiled only: catches regressions in generated operation/body/path/query types.
export function typeExamples(client: LettercapeClient) {
  void client.call('importEmailSource',{path:{id:'example'},body:'\uFEFF<p>Exact</p>\r\n',idempotencyKey:'source-command',ifMatch:'"draft-1"'});
  void client.call('forkEmailSource',{path:{id:'example'},body:{expected_artifact_hash:'a'.repeat(64)},idempotencyKey:'fork-command',ifMatch:'"draft-1"',actorId:'actor'});
  void client.call('downloadRevision',{path:{id:'example'},query:{format:'source'}});
  // @ts-expect-error source import is exact text rather than JSON
  void client.call('importEmailSource',{path:{id:'example'},body:{html:'<p>Source</p>'},idempotencyKey:'source-command',ifMatch:'"draft-1"'});
  // @ts-expect-error source fork requires the reviewed artifact digest
  void client.call('forkEmailSource',{path:{id:'example'},body:{},idempotencyKey:'fork-command',ifMatch:'"draft-1"'});
  void client.call('uploadAssetContent',{path:{uploadId:'example'},body:new Uint8Array([1]),uploadToken:'a'.repeat(64)});
  void client.call('getAssetVariantContent',{path:{id:'example',variantId:'variant'}});
  void client.pages('listAssets',{query:{limit:25}});
  // @ts-expect-error the acknowledged upload token is required for binary transfer
  void client.call('uploadAssetContent',{path:{uploadId:'example'},body:new Uint8Array([1])});
  // @ts-expect-error upload body is raw binary, never a JSON object
  void client.call('uploadAssetContent',{path:{uploadId:'example'},body:{bytes:'base64'},uploadToken:'a'.repeat(64)});
  // @ts-expect-error derivative bytes cannot be addressed without an immutable variant
  void client.call('getAssetVariantContent',{path:{id:'example'}});
  // @ts-expect-error asset pages do not support undocumented date filters
  void client.pages('listAssets',{query:{created_before:'2026-10-02T00:00:00Z'}});
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

  void client.pages('listBrandSources',{query:{brand_kit_version_id:'example'}});
  void client.call('previewBrandMemory',{path:{id:'example'},body:{query:'cotton'}});
  void client.call('addBrandSource',{body:{brand_kit_version_id:'example',title:'Owned brief',source_ref:'Document',text:'Facts',acknowledge_rights_and_no_private_data:true}});
  // @ts-expect-error sources require explicit approval
  void client.call('addBrandSource',{body:{brand_kit_version_id:'example',title:'Owned brief',source_ref:'Document',text:'Facts',acknowledge_rights_and_no_private_data:false}});
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
