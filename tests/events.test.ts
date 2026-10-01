import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { EventEnvelope } from '../src/domain/events';
import { signWebhook, verifyWebhook, webhookOutcome } from '../src/server/webhook-protocol';
const workspace=randomUUID(),contact=randomUUID();
const fixture=()=>({id:randomUUID(),type:'contact.unsubscribed',schema_version:1,workspace_id:workspace,occurred_at:new Date().toISOString(),recorded_at:new Date().toISOString(),aggregate:{type:'contact',id:contact,version:2},data:{contact_id:contact,scope:'marketing',reason:'recipient_opt_out'},trace_id:randomUUID()});
test('versioned envelopes carry explicit source/version and reject recipient dumps or unknown semantics',()=>{
  assert.ok(EventEnvelope.safeParse(fixture()).success);
  assert.equal(EventEnvelope.safeParse({...fixture(),data:{contact_id:contact,scope:'marketing',reason:'recipient_opt_out',email:'private@example.org'}}).success,false);
  assert.equal(EventEnvelope.safeParse({...fixture(),schema_version:2}).success,false);
  assert.equal(EventEnvelope.safeParse({...fixture(),type:'campaign.delivered'}).success,false);
  assert.equal(EventEnvelope.safeParse({...fixture(),aggregate:{type:'contact',id:randomUUID(),version:2}}).success,false);
});
test('webhook verification binds exact bytes, event/workspace/version and bounded delivery time',()=>{
  const event=EventEnvelope.parse(fixture()),body=Buffer.from(JSON.stringify(event)),secret=randomBytes(32).toString('hex'),now=1790860000;
  const headers=signWebhook(body,secret,now);
  assert.deepEqual(verifyWebhook(body,headers,secret,workspace,now),event);
  assert.deepEqual(verifyWebhook(body,new Headers(headers),secret,workspace,now),event);
  for(const [payload,values,scope,time]of[[Buffer.concat([body,Buffer.from(' ')]),headers,workspace,now],[body,{...headers,'X-Lettercape-Event-Id':randomUUID()},workspace,now],[body,headers,randomUUID(),now],[body,headers,workspace,now+301],[body,headers,workspace,now-301]]as const)assert.throws(()=>verifyWebhook(payload,values,secret,scope,time));
  assert.throws(()=>signWebhook(body,'bad',now));
  assert.throws(()=>verifyWebhook(body,{...headers,'X-Lettercape-Signature':'v2='+ '0'.repeat(64)},secret,workspace,now));
  assert.equal(webhookOutcome(204),'acknowledged');assert.equal(webhookOutcome(410),'disable_endpoint');
  for(const status of[408,429,500,503,599,null])assert.equal(webhookOutcome(status),'retry');
  for(const status of[301,400,401,403,404,422])assert.equal(webhookOutcome(status),'terminal');
});
