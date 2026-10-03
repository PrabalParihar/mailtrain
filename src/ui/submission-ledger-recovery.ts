import {z} from 'zod';
import {SubmissionLedgerInput,SubmissionLedgerView,StagedRecipientView,DeliveryHistoryView,DeliveryAttemptView} from '../domain/submission-ledgers';
import {CampaignConfigurationView} from '../domain/campaign-configuration';
import {ApiError} from './api';

const uuid=z.uuid().regex(/^[0-9a-f-]+$/);
const scopeSchema=z.strictObject({workspace:z.string().min(1).max(160),actor:z.string().min(1).max(160),campaign:uuid});
const rejectionSchema=z.strictObject({code:z.enum(['VERSION_CONFLICT','DIGEST_CONFLICT','STATE_CONFLICT']),status:z.literal(409)});
const commandSchema=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('create'),key:uuid,body:z.string().max(2048),rejection:rejectionSchema.optional()}),
 z.strictObject({kind:z.literal('cancel'),key:uuid,ledger_id:uuid,body:z.literal('{}')}),
]);
const recordSchema=scopeSchema.extend({command:commandSchema});
const prefix='lettercape.submission-ledger.';
const originLock=prefix+'commands';
export type LedgerScope=z.infer<typeof scopeSchema>;
export type LedgerCommand=z.infer<typeof commandSchema>;
export type LedgerStore=Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>;
export type LedgerLocks={request<T>(name:string,options:{mode:'exclusive';ifAvailable:true},callback:(lock:object|null)=>T|PromiseLike<T>):Promise<T>};

export function ledgerRecoverySlot(scope:LedgerScope):string {
 const admitted=scopeSchema.parse(scope);
 return prefix+JSON.stringify([admitted.workspace,admitted.actor,admitted.campaign]);
}
function validateCommand(command:LedgerCommand):LedgerCommand {
 const admitted=commandSchema.parse(command);
 if(admitted.kind==='create'){
  const input=SubmissionLedgerInput.parse(JSON.parse(admitted.body));
  if(JSON.stringify(input)!==admitted.body)throw Error('The original staging command is not canonical.');
 }
 return admitted;
}
export function readLedgerCommand(store:LedgerStore,scope:LedgerScope):LedgerCommand|null {
 const raw=store.getItem(ledgerRecoverySlot(scope));
 if(raw===null)return null;
 try{
  if(raw.length>8192)throw Error('Recovery exceeds bounds.');
  const record=recordSchema.parse(JSON.parse(raw));
  if(record.workspace!==scope.workspace||record.actor!==scope.actor||record.campaign!==scope.campaign)throw Error('Recovery scope mismatch.');
  return validateCommand(record.command);
 }catch{throw Error('The original ledger command could not be read. Restore durable browser recovery before continuing.');}
}
const sameCommand=(a:LedgerCommand|null,b:LedgerCommand)=>JSON.stringify(a)===JSON.stringify(b);
function remember(store:LedgerStore,scope:LedgerScope,command:LedgerCommand):LedgerCommand {
 const original=readLedgerCommand(store,scope);
 if(original){if(!sameCommand(original,command))throw Error('Resolve the original ledger command first.');return original;}
 let count=0;
 for(let index=0;index<store.length;index++)if(store.key(index)?.startsWith(prefix))count++;
 if(count>=32)throw Error('Too many unresolved ledger commands. Retry an original command first.');
 const admitted=validateCommand(command);
 store.setItem(ledgerRecoverySlot(scope),JSON.stringify({...scope,command:admitted}));
 if(!sameCommand(readLedgerCommand(store,scope),admitted))throw Error('The original ledger command could not be stored durably. No request was sent.');
 return admitted;
}
function acknowledge(store:LedgerStore,scope:LedgerScope,command:LedgerCommand):void {
 if(!sameCommand(readLedgerCommand(store,scope),command))throw Error('Ledger recovery changed. Retry the original command.');
 store.removeItem(ledgerRecoverySlot(scope));
 if(readLedgerCommand(store,scope)!==null)throw Error('The acknowledged ledger command could not be cleared durably. Retry its original command.');
}
function browserLocks():LedgerLocks|null {
 try{return typeof navigator!=='undefined'&&typeof navigator.locks?.request==='function'?navigator.locks:null;}
 catch{return null;}
}
const metadata={request_id:z.string().min(1).max(160).optional()};
const pageFields={total_count:z.number().int().min(0).max(10000),has_more:z.boolean(),next_cursor:z.string().min(1).max(4096).nullable(),...metadata};
function pageSchema<T extends z.ZodType>(item:T){
 return z.strictObject({data:z.array(item).max(100),...pageFields}).refine(page=>page.has_more===(page.next_cursor!==null),'Pagination cursor must agree with has_more.');
}
export function parseLedgerDetail(value:unknown,campaign:string,id?:string):SubmissionLedgerView {
 const ledger=z.strictObject({ledger:SubmissionLedgerView,...metadata}).parse(value).ledger;
 if(ledger.campaign_id!==campaign||(id&&ledger.id!==id))throw Error('Ledger response does not match the requested campaign and ledger.');
 return ledger;
}
export function parseLedgerPage(value:unknown,campaign:string){
 const page=pageSchema(SubmissionLedgerView).parse(value);
 if(page.data.some(row=>row.campaign_id!==campaign))throw Error('Ledger history belongs to another campaign.');
 return page;
}
export function parseRecipientPage(value:unknown,ledger:string){
 const page=pageSchema(StagedRecipientView).parse(value);
 if(page.data.some(row=>row.ledger_id!==ledger))throw Error('Recipients belong to another ledger.');
 return page;
}
export function parseDeliveryDetail(value:unknown,ledger:string,delivery:string):StagedRecipientView {
 const row=z.strictObject({delivery:StagedRecipientView,...metadata}).parse(value).delivery;
 if(row.ledger_id!==ledger||row.delivery_id!==delivery)throw Error('Delivery response does not match the requested ledger and delivery.');
 return row;
}
export function parseHistoryPage(value:unknown,delivery:string){
 const page=pageSchema(DeliveryHistoryView).parse(value);
 if(page.data.some(row=>row.delivery_id!==delivery))throw Error('State history belongs to another delivery.');
 return page;
}
export function parseAttemptPage(value:unknown,delivery:string){
 const page=pageSchema(DeliveryAttemptView).parse(value);
 if(page.data.some(row=>row.delivery_id!==delivery))throw Error('Attempts belong to another delivery.');
 return page;
}
export function parseLedgerConfiguration(value:unknown,campaign:string,current:{version:number;digest:string}){
 const row=z.strictObject({campaign:CampaignConfigurationView,...metadata}).parse(value).campaign;
 if(row.id!==campaign||row.version<current.version||(row.version===current.version&&row.digest!==current.digest))throw Error('Configuration reload did not match the current campaign.');
 SubmissionLedgerInput.parse({expected_version:row.version,expected_digest:row.digest});
 return {version:row.version,digest:row.digest};
}
export function validateLedgerAcknowledgment(value:unknown,scope:LedgerScope,command:LedgerCommand):SubmissionLedgerView {
 const ledger=parseLedgerDetail(value,scope.campaign,command.kind==='cancel'?command.ledger_id:undefined);
 if(command.kind==='create'){
  const input=SubmissionLedgerInput.parse(JSON.parse(command.body));
  if(ledger.configuration_version!==input.expected_version||ledger.configuration_digest!==input.expected_digest)throw Error('The ledger receipt does not match the original staging command.');
 }else if(ledger.status!=='cancelled')throw Error('Cancellation receipt must describe a cancelled ledger.');
 return ledger;
}
export function validateFreshLedger(receipt:SubmissionLedgerView,current:SubmissionLedgerView):SubmissionLedgerView {
 for(const field of ['id','campaign_id','configuration_id','configuration_version','configuration_digest','revision_id','artifact_hash','snapshot_id','snapshot_digest'] as const){
  if(receipt[field]!==current[field])throw Error('Fresh ledger detail does not match the immutable receipt.');
 }
 return current;
}
// stageSubmissionLedger checks current authority, then keyed() looks up the exact
// historical success before invoking its create callback. Only these three409
// callback errors prove this original create did not execute. GET/authorization
// errors and cancellation conflicts never acquire this classification.
function originalCreateRejection(command:LedgerCommand,error:unknown){
 if(command.kind!=='create'||!(error instanceof ApiError))return null;
 const parsed=rejectionSchema.safeParse({code:error.code,status:error.status});
 return parsed.success?parsed.data:null;
}
export type LedgerMutationSnapshot={pending:LedgerCommand|null;error:string;busy:boolean;ready:boolean};
export const initialLedgerMutationSnapshot:LedgerMutationSnapshot={pending:null,error:'',busy:false,ready:false};
export class SubmissionLedgerCoordinator {
 private snapshot:LedgerMutationSnapshot=initialLedgerMutationSnapshot;
 private listeners=new Set<()=>void>();
 private readonly scope:LedgerScope;
 private storageChanged=(event:StorageEvent)=>{
  if(event.storageArea===this.store&&(event.key===null||event.key===ledgerRecoverySlot(this.scope)))this.reconcile();
 };
 constructor(private store:LedgerStore,scope:LedgerScope,private locks:LedgerLocks|null=browserLocks()){
  this.scope=scopeSchema.parse(scope);
 }
 getSnapshot=()=>this.snapshot;
 subscribe=(listener:()=>void)=>{
  this.listeners.add(listener);
  if(this.listeners.size===1&&typeof window!=='undefined')window.addEventListener('storage',this.storageChanged);
  return()=>{this.listeners.delete(listener);if(!this.listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',this.storageChanged);};
 };
 private publish(update:Partial<LedgerMutationSnapshot>){
  this.snapshot={...this.snapshot,...update};
  for(const listener of this.listeners)listener();
 }
 private read():LedgerCommand|null {
  const pending=readLedgerCommand(this.store,this.scope);
  this.publish({pending,ready:!!this.locks,error:this.locks?'':'Browser origin locks are required for durable ledger recovery.'});
  return pending;
 }
 reconcile(){
  try{this.read();}catch(error){this.publish({ready:false,error:error instanceof Error?error.message:'Ledger recovery unavailable.'});}
 }
 async run(input:LedgerCommand|undefined,request:(command:LedgerCommand)=>Promise<unknown>,isCurrent:()=>boolean,readFresh?:(id:string)=>Promise<unknown>):Promise<SubmissionLedgerView|null> {
  if(this.snapshot.busy)return null;
  this.publish({busy:true,error:''});
  try{
   if(!this.locks)throw Error('Browser origin locks are required. No request was sent.');
   return await this.locks.request(originLock,{mode:'exclusive',ifAvailable:true},async lock=>{
    if(!lock)throw Error('Another tab is processing a ledger command. Retry when it finishes.');
    if(!isCurrent())return null;
    const original=this.read();
    if(input&&original){this.publish({error:'Resolve the original ledger command before creating another command.'});return null;}
    const command=input?remember(this.store,this.scope,input):original;
    if(!command||!isCurrent())return null;
    this.publish({pending:command});
    let response:unknown;
    try{response=await request(command);}
    catch(error){
     const rejection=originalCreateRejection(command,error);
     if(command.kind==='create'&&rejection&&isCurrent()&&sameCommand(readLedgerCommand(this.store,this.scope),command)){
      const rejected=validateCommand({...command,rejection});
      this.store.setItem(ledgerRecoverySlot(this.scope),JSON.stringify({...this.scope,command:rejected}));
      if(!sameCommand(readLedgerCommand(this.store,this.scope),rejected))throw Error('The rejected ledger command could not be preserved durably. Retry the original command.');
      this.publish({pending:rejected});
     }
     throw error;
    }
    const receipt=validateLedgerAcknowledgment(response,this.scope,command);
    if(!isCurrent())return null;
    const truth=readFresh?validateFreshLedger(receipt,parseLedgerDetail(await readFresh(receipt.id),this.scope.campaign,receipt.id)):receipt;
    if(!isCurrent())return null;
    acknowledge(this.store,this.scope,command);
    this.read();
    return truth;
   });
  }catch(error){this.publish({error:error instanceof Error?error.message:'Ledger command failed. Retry its original command.'});return null;}
  finally{this.publish({busy:false});}
 }
 async dismiss(expected:LedgerCommand,isCurrent:()=>boolean=()=>true):Promise<boolean> {
  if(this.snapshot.busy)return false;
  this.publish({busy:true,error:''});
  try{
   if(!this.locks)throw Error('Browser origin locks are required to dismiss a rejected command.');
   return await this.locks.request(originLock,{mode:'exclusive',ifAvailable:true},async lock=>{
    if(!lock)throw Error('Another tab is processing a ledger command. Retry when it finishes.');
    if(!isCurrent())return false;
    const current=this.read();
    if(current?.kind!=='create'||!current.rejection||!sameCommand(current,expected))return false;
    acknowledge(this.store,this.scope,current);
    this.read();return true;
   });
  }catch(error){this.publish({error:error instanceof Error?error.message:'The rejected ledger command could not be dismissed.'});return false;}
  finally{this.publish({busy:false});}
 }
}
const coordinators=new WeakMap<LedgerStore,Map<string,SubmissionLedgerCoordinator>>();
export function getSubmissionLedgerCoordinator(store:LedgerStore,scope:LedgerScope,locks?:LedgerLocks|null):SubmissionLedgerCoordinator {
 let scopes=coordinators.get(store);
 if(!scopes){scopes=new Map();coordinators.set(store,scopes);}
 const slot=ledgerRecoverySlot(scope);
 let coordinator=scopes.get(slot);
 if(!coordinator){coordinator=new SubmissionLedgerCoordinator(store,scope,locks);scopes.set(slot,coordinator);}
 return coordinator;
}
export type LedgerRequest={identity:string;generation:number;signal:AbortSignal};
export class LedgerFence {
 private identity:string|null=null;
 private generation=0;
 private controller:AbortController|null=null;
 activate(identity:string){if(this.identity!==identity){this.invalidate();this.identity=identity;}}
 begin():LedgerRequest|null {
  if(this.identity===null||this.controller)return null;
  this.controller=new AbortController();
  return {identity:this.identity,generation:++this.generation,signal:this.controller.signal};
 }
 current(request:LedgerRequest){return this.identity===request.identity&&this.generation===request.generation&&!request.signal.aborted&&this.controller?.signal===request.signal;}
 finish(request:LedgerRequest){if(this.current(request))this.controller=null;}
 invalidate(){this.controller?.abort();this.controller=null;this.generation++;this.identity=null;}
}
