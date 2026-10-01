import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { fail } from './errors';
const KeyId=z.string().regex(/^[a-zA-Z0-9_-]{1,32}$/);
const HexKey=z.string().regex(/^[0-9a-f]{64}$/);
const Context=z.object({workspace_id:z.uuid(),endpoint_id:z.uuid(),secret_version:z.number().int().min(1).max(2147483647)}).strict();
const Envelope=z.object({key_version:KeyId,nonce:z.string().regex(/^[0-9a-f]{24}$/),tag:z.string().regex(/^[0-9a-f]{32}$/),ciphertext:z.string().regex(/^[0-9a-f]{64}$/)}).strict();
export type WebhookSecretContext=z.infer<typeof Context>;
export type WrappedWebhookSecret=z.infer<typeof Envelope>;
export type WebhookVault={active:string;keys:ReadonlyMap<string,Buffer>};
// Never return this inventory or a decrypted signing key through resource serializers.
export function parseWebhookVault(raw:string|undefined,active:string|undefined):WebhookVault{
 try{
  if(!raw||raw.length>1024)throw new Error('Missing bounded inventory');
  const id=KeyId.parse(active),inventory=z.record(KeyId,HexKey).parse(JSON.parse(raw));
  const names=Object.keys(inventory);if(names.length<1||names.length>3||!Object.hasOwn(inventory,id))throw new Error('Invalid inventory');
  return {active:id,keys:new Map(names.map((name)=>[name,Buffer.from(inventory[name],'hex')]))};
 }catch{fail(503,'WEBHOOK_KEYS_UNCONFIGURED','Private versioned webhook encryption keys are required.');}
}
function aad(context:WebhookSecretContext,keyVersion:string){
 const checked=Context.parse(context);
 return Buffer.from(JSON.stringify(['lettercape.webhook-signing-secret.v1',checked.workspace_id,checked.endpoint_id,checked.secret_version,keyVersion]));
}
export function sealWebhookSecret(context:WebhookSecretContext,secret:string,vault:WebhookVault):WrappedWebhookSecret{
 const key=vault.keys.get(vault.active);if(!key||key.length!==32)fail(503,'WEBHOOK_KEY_UNAVAILABLE','The configured webhook wrapping key is unavailable.');
 const plaintext=Buffer.from(HexKey.parse(secret),'hex'),nonce=randomBytes(12);
 try{
  const cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(aad(context,vault.active));
  const ciphertext=Buffer.concat([cipher.update(plaintext),cipher.final()]);
  return {key_version:vault.active,nonce:nonce.toString('hex'),tag:cipher.getAuthTag().toString('hex'),ciphertext:ciphertext.toString('hex')};
 }finally{plaintext.fill(0);}
}
export function openWebhookSecret(context:WebhookSecretContext,wrapped:unknown,vault:WebhookVault):string{
 try{
  const envelope=Envelope.parse(wrapped),key=vault.keys.get(envelope.key_version);if(!key||key.length!==32)throw new Error('Key unavailable');
  const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.nonce,'hex'));decipher.setAAD(aad(context,envelope.key_version));decipher.setAuthTag(Buffer.from(envelope.tag,'hex'));
  const plaintext=Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'hex')),decipher.final()]);
  try{if(plaintext.length!==32)throw new Error('Invalid key length');return plaintext.toString('hex');}finally{plaintext.fill(0);}
 }catch{fail(503,'WEBHOOK_KEY_UNAVAILABLE','The webhook signing key failed private integrity checks.');}
}
export function selectWebhookSigningKey<T extends {secret_version:number;valid_until:string|null}>(keys:T[],version:string,now=Date.now()):T{
 if(!Number.isSafeInteger(now)||now<0||!/^[1-9]\d{0,9}$/.test(version)||keys.length<1||keys.length>2)fail(401,'WEBHOOK_SIGNATURE_INVALID','Webhook signing key version is invalid.');
 const versions=new Set<number>();
 for(const key of keys){
  if(!Number.isSafeInteger(key.secret_version)||key.secret_version<1||key.secret_version>2147483647||versions.has(key.secret_version)||key.valid_until!==null&&!z.iso.datetime({offset:true}).safeParse(key.valid_until).success)fail(401,'WEBHOOK_SIGNATURE_INVALID','Webhook signing key inventory is invalid.');
  versions.add(key.secret_version);
 }
 const current=keys.filter((key)=>key.valid_until===null);
 if(current.length!==1||keys.some((key)=>key.valid_until!==null&&key.secret_version>=current[0].secret_version))fail(401,'WEBHOOK_SIGNATURE_INVALID','Webhook signing key inventory is invalid.');
 const key=keys.find((key)=>key.secret_version===Number(version));
 if(!key||(key.valid_until!==null&&now>=Date.parse(key.valid_until)))fail(401,'WEBHOOK_SIGNATURE_INVALID','Webhook signing key is unknown or expired.');
 return key;
}
