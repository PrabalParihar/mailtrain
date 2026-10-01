import { createHmac, timingSafeEqual } from 'node:crypto';
import { EventEnvelope, type DomainEvent } from '../domain/events';
export const WEBHOOK_BODY_MAX=65536;
function parseBody(body:Uint8Array):DomainEvent {
  if(body.byteLength<1||body.byteLength>WEBHOOK_BODY_MAX)throw new Error('Invalid webhook body size');
  // Fatal decoding prevents signed invalid UTF8 from changing the interpreted event.
  return EventEnvelope.parse(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body)));
}
function checkedSecret(secret:string){if(typeof secret!=='string'||! /^[0-9a-f]{64}$/.test(secret))throw new Error('Webhook secret must be a private256-bit key');return Buffer.from(secret,'hex');}
function checkedTime(timestamp:number){if(!Number.isSafeInteger(timestamp)||timestamp<0||timestamp>99999999999)throw new Error('Invalid webhook timestamp');return String(timestamp);}
function signature(body:Uint8Array,secret:string,timestamp:number){return createHmac('sha256',checkedSecret(secret)).update(checkedTime(timestamp)+'.').update(body).digest('hex');}
export function signWebhook(body:Uint8Array,secret:string,timestamp=Math.floor(Date.now()/1000)) {
  const event=parseBody(body);
  return {'X-Lettercape-Event-Id':event.id,'X-Lettercape-Timestamp':checkedTime(timestamp),'X-Lettercape-Signature':'v1='+signature(body,secret,timestamp)};
}
export function verifyWebhook(body:Uint8Array,headers:Record<string,string>|Headers,secret:string,workspace:string,now=Math.floor(Date.now()/1000)) {
  if(body.byteLength<1||body.byteLength>WEBHOOK_BODY_MAX)throw new Error('Invalid webhook body size');
  const header=(name:string)=>{
    if(headers instanceof Headers)return headers.get(name);
    const keys=Object.keys(headers).filter((key)=>key.toLowerCase()===name.toLowerCase());
    if(keys.length>1)throw new Error('Ambiguous webhook header');
    return keys.length?headers[keys[0]]:null;
  };
  const timestamp=header('X-Lettercape-Timestamp'),provided=header('X-Lettercape-Signature');
  if(typeof timestamp!=='string'||!/^\d{1,11}$/.test(timestamp)||typeof provided!=='string'||!/^v1=[0-9a-f]{64}$/.test(provided))throw new Error('Invalid webhook headers');
  checkedTime(now);const time=Number(timestamp);if(Math.abs(now-time)>300)throw new Error('Webhook delivery timestamp outside tolerance');
  const expected=signature(body,secret,time),actual=provided.slice(3);
  if(!timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex')))throw new Error('Webhook signature mismatch');
  const event=parseBody(body);
  if(event.id!==header('X-Lettercape-Event-Id')||event.workspace_id!==workspace)throw new Error('Webhook event identity mismatch');
  return event;
}
export function webhookOutcome(status:number|null):'acknowledged'|'disable_endpoint'|'retry'|'terminal' {
  if(status!==null&&(!Number.isInteger(status)||status<100||status>599))throw new Error('Invalid webhook response status');
  if(status!==null&&status>=200&&status<300)return 'acknowledged';
  if(status===410)return 'disable_endpoint';
  if(status===null||status===408||status===429||(status>=500&&status<=599))return 'retry';
  return 'terminal';
}
