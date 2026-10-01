import{ApiError}from'./api';
type RecoveryStorage=Pick<Storage,'length'|'key'|'getItem'|'setItem'|'removeItem'>;
export type WebhookCommandReceipt={slot:string;key:string;input?:unknown};
const prefix='lettercape.webhook-command.';
export async function beginWebhookCommand(workspace:string,path:string,input:unknown,provided?:RecoveryStorage):Promise<WebhookCommandReceipt>{
 const replay=/^webhook-deliveries\/[0-9a-f-]{36}\/replay$/.test(path),lifecycle=replay||/^webhook-endpoints\/[0-9a-f-]{36}\/(rotate|pause)$/.test(path);
 const checked=lifecycle?lifecycleInput(input,replay):undefined;
 const identity=JSON.stringify([workspace,path,lifecycle?null:input]),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)))).map((byte)=>byte.toString(16).padStart(2,'0')).join('');
 const slot=prefix+hash;
 try{
  const storage=provided??sessionStorage,existing=storage.getItem(slot);
  if(existing){if(existing.length>512)throw new Error('Recovery identity invalid');if(lifecycle){const receipt=JSON.parse(existing);if(Object.keys(receipt).sort().join(',')!=='input,key'||!validKey(receipt.key))throw new Error('Recovery identity invalid');return{slot,key:receipt.key,input:lifecycleInput(receipt.input,replay)};}if(!validKey(existing))throw new Error('Recovery identity invalid');return{slot,key:existing};}
  let count=0;for(let index=0;index<storage.length;index++)if(storage.key(index)?.startsWith(prefix))count++;
  if(count>=32)throw new Error('There are32 unresolved webhook commands. Recover them before starting another.');
  const key=crypto.randomUUID(),value=lifecycle?JSON.stringify({key,input:checked}):key;storage.setItem(slot,value);if(storage.getItem(slot)!==value)throw new Error('Recovery storage not durable');return{slot,key,...(lifecycle?{input:checked}:{})};
 }catch(error){if(error instanceof Error&&error.message.includes('32 unresolved'))throw error;throw new Error('Webhook recovery storage is unavailable. Enable tab storage before creating or rotating an endpoint.');}
}
export function finishWebhookCommand(receipt:WebhookCommandReceipt,provided?:RecoveryStorage){try{(provided??sessionStorage).removeItem(receipt.slot);}catch{} }

function validKey(value:unknown):value is string{return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);}
function lifecycleInput(input:unknown,replay=false){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid webhook lifecycle recovery');
 const value=input as Record<string,unknown>;
 if(replay){if(Object.keys(value).sort().join(',')!=='acknowledge_duplicate_effect,expected_attempt'||!Number.isSafeInteger(value.expected_attempt)||Number(value.expected_attempt)<1||Number(value.expected_attempt)>2147483647||value.acknowledge_duplicate_effect!==true)throw new Error('Invalid webhook replay recovery');return{expected_attempt:value.expected_attempt,acknowledge_duplicate_effect:true};}
 if(Object.keys(value).some((key)=>!['expected_version','retire_previous','acknowledge_key_cutover'].includes(key))||!Number.isSafeInteger(value.expected_version)||Number(value.expected_version)<1||Number(value.expected_version)>2147483647||['retire_previous','acknowledge_key_cutover'].some((key)=>value[key]!==undefined&&typeof value[key]!=='boolean'))throw new Error('Invalid webhook lifecycle recovery');
 return{expected_version:value.expected_version,...(value.retire_previous===undefined?{}:{retire_previous:value.retire_previous}),...(value.acknowledge_key_cutover===undefined?{}:{acknowledge_key_cutover:value.acknowledge_key_cutover})};
}

export async function pendingWebhookReplay(workspace:string,delivery:string,provided?:RecoveryStorage):Promise<WebhookCommandReceipt|null>{
 const path='webhook-deliveries/'+delivery+'/replay',identity=JSON.stringify([workspace,path,null]),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)))).map((byte)=>byte.toString(16).padStart(2,'0')).join(''),slot=prefix+hash;
 try{const value=(provided??sessionStorage).getItem(slot);if(!value)return null;if(value.length>512)throw new Error('Invalid recovery');const receipt=JSON.parse(value);if(Object.keys(receipt).sort().join(',')!=='input,key'||!validKey(receipt.key))throw new Error('Invalid recovery');return{slot,key:receipt.key,input:lifecycleInput(receipt.input,true)};}catch{throw new Error('Webhook recovery storage is unavailable. Restore tab storage to recover this command.');}
}

// Only a transactional CAS rejection proves this command had no effect. Authentication,
// capacity, network and server failures cannot reconcile an earlier uncertain response.
export function reconcileWebhookReplayRejection(receipt:WebhookCommandReceipt,error:unknown,provided?:RecoveryStorage):boolean{
 if(!(error instanceof ApiError)||error.status!==409||error.code!=='REPLAY_VERSION_CONFLICT')return false;
 try{const storage=provided??sessionStorage;storage.removeItem(receipt.slot);if(storage.getItem(receipt.slot)!==null)throw new Error('Receipt remains');return true;}catch{throw new Error('Rejected replay could not be reconciled in tab storage. Restore storage and reload its receipt.');}
}
