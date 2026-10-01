import { z } from 'zod';
import { RoleChangeInput,RemoveMemberInput,TransferOwnerInput } from '../domain/memberships';
import { ApiError } from './api';
type RecoveryStorage=Pick<Storage,'length'|'key'|'getItem'|'setItem'|'removeItem'>;
export type MembershipReceipt={slot:string;key:string;input:Record<string,unknown>};
const prefix='lettercape.membership-command.';
function schemaFor(path:string){
 const match=/^memberships\/([0-9a-f-]{36})\/(role|remove|transfer-owner)$/.exec(path);
 if(!match)throw new Error('Invalid member action.');z.uuid().parse(match[1]);
 return match[2]==='role'?RoleChangeInput:match[2]==='remove'?RemoveMemberInput:TransferOwnerInput;
}
async function slotFor(workspace:string,actor:string,path:string){
 z.uuid().parse(workspace);z.uuid().parse(actor);schemaFor(path);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([workspace,actor,path]))))).map(byte=>byte.toString(16).padStart(2,'0')).join('');return prefix+hash;
}
function receiptFor(slot:string,path:string,value:string):MembershipReceipt{
 if(value.length>512)throw new Error('Invalid recovery.');
 const stored=z.object({key:z.uuid(),input:schemaFor(path)}).strict().parse(JSON.parse(value));return{slot,...stored};
}
export async function pendingMembershipCommand(workspace:string,actor:string,path:string,provided?:RecoveryStorage):Promise<MembershipReceipt|null>{
 const slot=await slotFor(workspace,actor,path);
 try{const value=(provided??sessionStorage).getItem(slot);return value===null?null:receiptFor(slot,path,value);}
 catch{throw new Error('Member recovery storage is unavailable. Restore tab storage before retrying.');}
}
export async function beginMembershipCommand(workspace:string,actor:string,path:string,input:unknown,provided?:RecoveryStorage):Promise<MembershipReceipt>{
 const checked=schemaFor(path).parse(input),slot=await slotFor(workspace,actor,path);
 try{
  const storage=provided??sessionStorage,old=storage.getItem(slot);if(old!==null)return receiptFor(slot,path,old);
  let count=0;for(let i=0;i<storage.length;i++)if(storage.key(i)?.startsWith(prefix))count++;
  if(count>=32)throw new Error('There are32 unresolved member commands. Recover them before starting another.');
  const key=crypto.randomUUID(),value=JSON.stringify({key,input:checked});storage.setItem(slot,value);if(storage.getItem(slot)!==value)throw new Error('Recovery is not durable.');return{slot,key,input:checked};
 }catch(error){if(error instanceof Error&&error.message.includes('32 unresolved'))throw error;throw new Error('Member recovery storage is unavailable. Restore tab storage before changing members.');}
}
export function finishMembershipCommand(receipt:MembershipReceipt,provided?:RecoveryStorage){try{(provided??sessionStorage).removeItem(receipt.slot);}catch{}}
export function reconcileMembershipRejection(receipt:MembershipReceipt,error:unknown,provided?:RecoveryStorage):boolean{
 if(!(error instanceof ApiError)||error.status!==409||error.code!=='MEMBERSHIP_VERSION_CONFLICT')return false;
 try{const storage=provided??sessionStorage;storage.removeItem(receipt.slot);if(storage.getItem(receipt.slot)!==null)throw new Error('Receipt remains.');return true;}
 catch{throw new Error('Rejected member command could not be reconciled. Restore tab storage and reload.');}
}
