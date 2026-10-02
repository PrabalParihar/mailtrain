import {z} from 'zod';
import {RecipientAssessmentInput,RecipientAssessmentView,RecipientObservationView} from '../domain/recipient-assessments';
import {CampaignConfigurationView} from '../domain/campaign-configuration';

const scopeSchema=z.object({workspace:z.string().min(1).max(160),campaign:z.uuid(),actor:z.string().min(1).max(160)}).strict();
const commandSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('create'),key:z.uuid(),body:z.string().max(2048)}).strict(),
 z.object({kind:z.literal('cancel'),key:z.uuid(),assessment_id:z.uuid(),body:z.string().max(2048)}).strict(),
]);
const recordSchema=scopeSchema.extend({command:commandSchema}).strict();
export type AssessmentRecoveryScope=z.infer<typeof scopeSchema>;
export type AssessmentCommand=z.infer<typeof commandSchema>;
type RecoveryStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type AssessmentRecoveryLocks={request<T>(name:string,options:{mode:'exclusive';signal?:AbortSignal},callback:()=>T|PromiseLike<T>):Promise<T>};
type AtomicRecoveryOptions={store?:RecoveryStorage;locks?:AssessmentRecoveryLocks|null;signal?:AbortSignal};
export function assessmentRecoverySlot(scope:AssessmentRecoveryScope){
 const admitted=scopeSchema.parse(scope);
 return 'lettercape.recipient-assessment.'+JSON.stringify([admitted.workspace,admitted.actor,admitted.campaign]);
}
function parseRecord(raw:string,scope:AssessmentRecoveryScope){
 if(raw.length>8192)throw Error('Recovery exceeds admitted bounds.');
 const record=recordSchema.parse(JSON.parse(raw));
 if(record.workspace!==scope.workspace||record.actor!==scope.actor||record.campaign!==scope.campaign)throw Error('Recovery scope mismatch.');
 if(record.command.kind==='create')RecipientAssessmentInput.parse(JSON.parse(record.command.body));
 else z.object({}).strict().parse(JSON.parse(record.command.body));
 return record.command;
}
export function readAssessmentCommand(scope:AssessmentRecoveryScope,store?:RecoveryStorage):{command:AssessmentCommand|null;available:boolean;error:string}{
 try{
  const raw=(store??localStorage).getItem(assessmentRecoverySlot(scope));
  return {command:raw===null?null:parseRecord(raw,scope),available:true,error:''};
 }catch{return {command:null,available:false,error:'Assessment recovery is unavailable or invalid. Enable durable browser storage before creating or cancelling an assessment.'};}
}
/** Internal synchronous critical section; browser mutations must use the atomic wrapper. */
export function rememberAssessmentCommand(scope:AssessmentRecoveryScope,command:AssessmentCommand,store?:RecoveryStorage):boolean{
 try{
  const storage=store??localStorage,slot=assessmentRecoverySlot(scope),prior=readAssessmentCommand(scope,storage);
  if(!prior.available)return false;
  const raw=JSON.stringify({...scope,command});parseRecord(raw,scope);
  if(prior.command&&JSON.stringify(prior.command)!==JSON.stringify(command))return false;
  storage.setItem(slot,raw);
  return storage.getItem(slot)===raw;
 }catch{return false;}
}
/** Internal synchronous critical section; browser mutations must use the atomic wrapper. */
export function clearAssessmentCommand(scope:AssessmentRecoveryScope,key:string,store?:RecoveryStorage):boolean{
 try{
  const storage=store??localStorage,prior=readAssessmentCommand(scope,storage);
  if(!prior.available||(prior.command&&prior.command.key!==key))return false;
  const slot=assessmentRecoverySlot(scope);storage.removeItem(slot);return storage.getItem(slot)===null;
 }catch{return false;}
}
function browserRecoveryLocks():AssessmentRecoveryLocks|null{
 try{return typeof navigator!=='undefined'&&typeof navigator.locks?.request==='function'?navigator.locks:null;}
 catch{return null;}
}
export function assessmentRecoveryLocksAvailable(){return browserRecoveryLocks()!==null;}
async function atomicRecoveryMutation(scope:AssessmentRecoveryScope,options:AtomicRecoveryOptions,mutate:()=>boolean):Promise<boolean>{
 try{
  const locks=options.locks===undefined?browserRecoveryLocks():options.locks;
  if(!locks||options.signal?.aborted)return false;
  return await locks.request(assessmentRecoverySlot(scope),{mode:'exclusive',signal:options.signal},()=>options.signal?.aborted?false:mutate());
 }catch{return false;}
}
/** Origin-scoped admission keeps the entire compare/write/readback indivisible across tabs. */
export function rememberAssessmentCommandAtomic(scope:AssessmentRecoveryScope,command:AssessmentCommand,options:AtomicRecoveryOptions={}):Promise<boolean>{
 return atomicRecoveryMutation(scope,options,()=>rememberAssessmentCommand(scope,command,options.store));
}
/** The matching-key compare/remove/readback runs under the same origin-scoped lock. */
export function clearAssessmentCommandAtomic(scope:AssessmentRecoveryScope,key:string,options:AtomicRecoveryOptions={}):Promise<boolean>{
 return atomicRecoveryMutation(scope,options,()=>clearAssessmentCommand(scope,key,options.store));
}

const requestMetadata={request_id:z.string().min(1).max(160).optional()};
const envelope=z.strictObject({assessment:RecipientAssessmentView,...requestMetadata});
const configurationEnvelope=z.strictObject({campaign:CampaignConfigurationView,...requestMetadata});
const pageFields={has_more:z.boolean(),next_cursor:z.string().min(1).max(4096).nullable(),total_count:z.number().int().nonnegative(),...requestMetadata};
const assessmentPage=z.strictObject({data:z.array(RecipientAssessmentView).max(100),...pageFields}).refine(page=>page.has_more===(page.next_cursor!==null),'Pagination cursor must agree with has_more.');
const observationPage=z.strictObject({data:z.array(RecipientObservationView).max(100),...pageFields}).refine(page=>page.has_more===(page.next_cursor!==null),'Pagination cursor must agree with has_more.');
export function parseAssessmentDetail(value:unknown,campaign:string){
 const assessment=envelope.parse(value).assessment;
 if(assessment.campaign_id!==campaign)throw Error('Assessment response belongs to a different campaign.');
 return assessment;
}
export function parseAssessmentConfiguration(value:unknown,campaign:string,current?:{version:number;digest:string}){
 const saved=configurationEnvelope.parse(value).campaign;
 if(saved.id!==campaign)throw Error('Configuration response belongs to a different campaign.');
 RecipientAssessmentInput.parse({expected_version:saved.version,expected_digest:saved.digest,topic_id:null});
 if(current&&saved.version<current.version)throw Error('Configuration reload returned an older version.');
 if(current&&saved.version===current.version&&saved.digest!==current.digest)throw Error('Configuration digest changed without a new version.');
 return {version:saved.version,digest:saved.digest};
}
export function parseAssessmentPage(value:unknown,campaign:string){
 const page=assessmentPage.parse(value);
 if(page.data.some(item=>item.campaign_id!==campaign))throw Error('Assessment history belongs to a different campaign.');
 return page;
}
export function parseObservationPage(value:unknown,assessment:string){
 const page=observationPage.parse(value);
 if(page.data.some(item=>item.assessment_id!==assessment))throw Error('Observations belong to a different assessment.');
 return page;
}
/** An idempotent receipt identifies the assessment. Only a fresh read supplies its status. */
export async function resolveAssessmentAcknowledgment(value:unknown,scope:AssessmentRecoveryScope,command:AssessmentCommand,read:(id:string)=>Promise<unknown>){
 const receipt=parseAssessmentDetail(value,scope.campaign);
 if(command.kind==='create'){
  const input=RecipientAssessmentInput.parse(JSON.parse(command.body));
  if(receipt.configuration_version!==input.expected_version||receipt.configuration_digest!==input.expected_digest||receipt.topic_id!==input.topic_id||receipt.created_by!==scope.actor)throw Error('Assessment receipt does not match the original command.');
 }else if(receipt.id!==command.assessment_id)throw Error('Cancellation receipt does not match the original command.');
 const current=parseAssessmentDetail(await read(receipt.id),scope.campaign);
 if(current.id!==receipt.id||current.configuration_id!==receipt.configuration_id||current.configuration_digest!==receipt.configuration_digest||current.snapshot_id!==receipt.snapshot_id||current.revision_id!==receipt.revision_id||current.topic_id!==receipt.topic_id)throw Error('Fresh assessment detail does not match the original receipt.');
 return current;
}

export type AssessmentRequest={generation:number;signal:AbortSignal;identity:string};
/** Shared synchronous guard for reads and commands, fenced by actor/configuration/lifecycle. */
export class RecipientAssessmentFence {
 private identity:string|null=null;
 private generation=0;
 private controller:AbortController|null=null;
 activate(identity:string){if(this.identity!==identity){this.invalidate();this.identity=identity;}}
 begin():AssessmentRequest|null {
  if(this.identity===null||this.controller)return null;
  this.controller=new AbortController();
  return {identity:this.identity,generation:++this.generation,signal:this.controller.signal};
 }
 current(request:AssessmentRequest){return this.identity===request.identity&&this.generation===request.generation&&!request.signal.aborted&&this.controller?.signal===request.signal;}
 finish(request:AssessmentRequest){if(this.current(request))this.controller=null;}
 invalidate(){this.controller?.abort();this.controller=null;this.generation++;this.identity=null;}
}
