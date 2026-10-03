import {z} from 'zod';
import {EmailTemplateViewSchema} from '../domain/email-templates';
import {ApiError} from './api';
const uuid=z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),hash=z.string().regex(/^[0-9a-f]{64}$/),name=z.string().trim().min(1).max(160);
const register=z.object({name,source_revision_id:uuid,expected_artifact_hash:hash}).strict();
const archive=z.object({expected_version:z.literal(1)}).strict();
const remix=z.object({title:name,expected_version:z.literal(1),expected_artifact_hash:hash}).strict();
const rejectionSchema=z.discriminatedUnion('code',[
 z.object({code:z.literal('TEMPLATE_ARCHIVED'),status:z.literal(409)}).strict(),
 z.object({code:z.literal('VERSION_MISMATCH'),status:z.literal(412)}).strict(),
 z.object({code:z.literal('ASSET_NOT_READY'),status:z.literal(409)}).strict(),
]);
const schema=z.object({workspace:z.string().min(1),actor:z.string().min(1),key:uuid,path:z.string(),body:z.union([register,archive,remix]),sourceRevision:uuid.optional(),rejection:rejectionSchema.optional()}).strict().superRefine((v,c)=>{const parts=v.path.split('/'),validId=parts.length===3&&parts[0]==='templates'&&uuid.safeParse(parts[1]).success;const mutation=validId&&(parts[2]==='archive'||parts[2]==='remix');if(!(v.path==='templates'&&register.safeParse(v.body).success)&&!(validId&&parts[2]==='archive'&&archive.safeParse(v.body).success)&&!(validId&&parts[2]==='remix'&&remix.safeParse(v.body).success&&v.sourceRevision))c.addIssue({code:'custom',message:'Invalid original command'});if(v.rejection&&(!mutation||(v.rejection.code==='ASSET_NOT_READY'&&parts[2]!=='remix')))c.addIssue({code:'custom',message:'Rejection does not match an eligible original command'});});
export type TemplateCommand=z.infer<typeof schema>;
export type TemplateScope={workspace:string;actor:string};
export type TemplateStore=Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>;
export const templateSlot=(s:TemplateScope)=>'lettercape.template.'+JSON.stringify([s.workspace,s.actor]);
export function readTemplateCommand(store:TemplateStore,scope:TemplateScope):TemplateCommand|null {
 const raw=store.getItem(templateSlot(scope));if(raw===null)return null;
 try {if(raw.length>4000)throw Error();const value=schema.parse(JSON.parse(raw));if(value.workspace!==scope.workspace||value.actor!==scope.actor)throw Error();return value;}catch{throw Error('The original template receipt could not be read. Restore browser storage before continuing.');}
}
export function rememberTemplateCommand(store:TemplateStore,scope:TemplateScope,path:string,body:unknown,sourceRevision?:string):TemplateCommand {
 const existing=readTemplateCommand(store,scope);if(existing)return existing;
 let count=0;for(let i=0;i<store.length;i++)if(store.key(i)?.startsWith('lettercape.template.'))count++;
 if(count>=32)throw Error('Too many unresolved template commands. Retry an original command first.');
 const value=schema.parse({workspace:scope.workspace,actor:scope.actor,path,body,key:crypto.randomUUID(),...(sourceRevision?{sourceRevision}:{})});
 store.setItem(templateSlot(scope),JSON.stringify(value));if(JSON.stringify(readTemplateCommand(store,scope))!==JSON.stringify(value))throw Error('Browser storage could not preserve this command.');return value;
}
export function acknowledgeTemplateCommand(store:TemplateStore,scope:TemplateScope,command:TemplateCommand){if(JSON.stringify(readTemplateCommand(store,scope))!==JSON.stringify(command))throw Error('The template receipt changed. Retry the original command.');store.removeItem(templateSlot(scope));if(readTemplateCommand(store,scope)!==null)throw Error('The acknowledged receipt could not be cleared.');}
// A malformed success is ambiguous: callers must retain the original command.
export function validateTemplateResult(command:TemplateCommand,value:unknown):string|null {
 const envelope=z.object({template:z.record(z.string(),z.unknown()).optional(),email:z.object({id:uuid,title:z.string()}).passthrough().optional(),revision:z.object({id:uuid,email_id:uuid}).passthrough().optional(),lineage:z.object({source_revision_id:uuid}).passthrough().optional()}).passthrough().parse(value);
 if(command.path.endsWith('/remix')){if(!envelope.email||!envelope.revision||!envelope.lineage||envelope.revision.email_id!==envelope.email.id||envelope.lineage.source_revision_id!==command.sourceRevision||!('title'in command.body)||envelope.email.title!==command.body.title)throw Error('The draft receipt did not match the original command.');return envelope.email.id;}
 const t=EmailTemplateViewSchema.parse(envelope.template);
 if(command.path==='templates'){if(!('name'in command.body)||t.name!==command.body.name||t.source_revision_id!==command.body.source_revision_id||t.artifact_hash!==command.body.expected_artifact_hash||t.state!=='active'||t.version!==1)throw Error('The saved template receipt did not match the frozen revision.');}
 else if(t.id!==command.path.split('/')[1]||t.state!=='archived'||t.version!==2)throw Error('The archive receipt did not match the original command.');
 return null;
}

// Only around the original POST: keyed service callbacks emit these after successful
// historical receipts have been checked. Neither authority errors nor arbitrary4xx
// establish nonexecution. The exact command must still occupy the persisted slot.
// Remix asset refusal rolls back the enclosing tenant transaction; save/archive
// have no equivalent asset-check contract and must not acquire this classification.
function originalRejection(command:TemplateCommand,error:unknown){
 if(!(error instanceof ApiError)||!(/\/(archive|remix)$/.test(command.path)))return null;
 const parsed=rejectionSchema.safeParse({code:error.code,status:error.status});
 if(!parsed.success)return null;
 if(parsed.data.code==='ASSET_NOT_READY'&&!command.path.endsWith('/remix'))return null;
 return parsed.data;
}
const sameCommand=(a:TemplateCommand|null,b:TemplateCommand)=>JSON.stringify(a)===JSON.stringify(b);
export type TemplateMutationSnapshot={pending:TemplateCommand|null;error:string;busy:boolean;ready:boolean};
export const initialTemplateMutationSnapshot:TemplateMutationSnapshot={pending:null,error:'',busy:false,ready:false};
export type TemplateMutationInput={path:string;body:unknown;sourceRevision?:string};
export type TemplateLock=<T>(scope:TemplateScope,action:()=>Promise<T>)=>Promise<T>;
export const claimTemplateLock:TemplateLock=async(scope,action)=>{
 if(typeof navigator==='undefined'||!navigator.locks)return action();
 // ifAvailable never queues behind an abandoned/slow response in another tab.
 // Holding the lock through response validation protects both persistence and ACK.
 return navigator.locks.request(templateSlot(scope),{ifAvailable:true},async lock=>{
  if(!lock)throw Error('Another tab is processing this template command. Retry when it finishes.');
  return action();
 });
};
export class TemplateMutationCoordinator {
 private snapshot:TemplateMutationSnapshot=initialTemplateMutationSnapshot;
 private listeners=new Set<()=>void>();
 private storageChanged=(event:StorageEvent)=>{
  if(event.storageArea===this.store&&(event.key===null||event.key===templateSlot(this.scope)))this.reconcile();
 };
 constructor(private store:TemplateStore,private scope:TemplateScope,private claim:TemplateLock=claimTemplateLock){}
 getSnapshot=()=>this.snapshot;
 subscribe=(listener:()=>void)=>{
  this.listeners.add(listener);
  if(this.listeners.size===1&&typeof window!=='undefined')window.addEventListener('storage',this.storageChanged);
  return()=>{this.listeners.delete(listener);if(!this.listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',this.storageChanged);};
 };
 private publish(update:Partial<TemplateMutationSnapshot>){
  this.snapshot={...this.snapshot,...update};
  for(const listener of this.listeners)listener();
 }
 private read(){
  try{
   const pending=readTemplateCommand(this.store,this.scope);
   this.publish({pending,ready:true,error:''});return pending;
  }catch(error){this.publish({ready:false,error:(error as Error).message});throw error;}
 }
 reconcile(){try{this.read();}catch{/* Keep mutations disabled until storage is usable. */}}
 async run(input:TemplateMutationInput|undefined,request:(command:TemplateCommand)=>Promise<unknown>,isCurrent:()=>boolean):Promise<{command:TemplateCommand;emailId:string|null}|null>{
  // Scope-wide synchronous guard covers every mounted control before any await.
  if(this.snapshot.busy)return null;
  this.publish({busy:true,error:''});
  try{
   return await this.claim(this.scope,async()=>{
    const existing=this.read();
    if(input&&existing)return null; // Reconcile and expose its original retry/dismiss.
    const command=input?rememberTemplateCommand(this.store,this.scope,input.path,input.body,input.sourceRevision):existing;
    if(!command)return null; // Another control/tab already resolved it.
    this.publish({pending:command});
    try{
     const response=await request(command);
     if(!isCurrent())return null; // Navigation/authority change preserves ambiguity.
     const emailId=validateTemplateResult(command,response);
     const current=this.read();
     if(!sameCommand(current,command))return null; // Never clear a newer command.
     acknowledgeTemplateCommand(this.store,this.scope,command);
     this.read();return {command,emailId};
    }catch(error){
     const rejection=originalRejection(command,error);
     if(rejection){
      const current=this.read();
      if(sameCommand(current,command)){
       const rejected=schema.parse({...command,rejection});
       this.store.setItem(templateSlot(this.scope),JSON.stringify(rejected));
       if(!sameCommand(readTemplateCommand(this.store,this.scope),rejected))throw Error('The rejected command could not be preserved.');
       this.publish({pending:rejected});
      }
     }
     throw error;
    }
   });
  }catch(error){this.publish({error:error instanceof Error?error.message:'The template command could not be completed.'});return null;}
  finally{this.publish({busy:false});}
 }
 async dismiss(expected:TemplateCommand):Promise<boolean>{
  if(this.snapshot.busy)return false;
  this.publish({busy:true,error:''});
  try{
   return await this.claim(this.scope,async()=>{
    const current=this.read();
    if(!current?.rejection||!sameCommand(current,expected))return false;
    acknowledgeTemplateCommand(this.store,this.scope,current);
    this.read();return true;
   });
  }catch(error){this.publish({error:error instanceof Error?error.message:'The rejected command could not be dismissed.'});return false;}
  finally{this.publish({busy:false});}
 }
}
const coordinators=new WeakMap<TemplateStore,Map<string,TemplateMutationCoordinator>>();
export function getTemplateCoordinator(store:TemplateStore,scope:TemplateScope,claim?:TemplateLock){
 let scopes=coordinators.get(store);if(!scopes){scopes=new Map();coordinators.set(store,scopes);}
 const key=templateSlot(scope);let coordinator=scopes.get(key);
 if(!coordinator){coordinator=new TemplateMutationCoordinator(store,{workspace:scope.workspace,actor:scope.actor},claim);scopes.set(key,coordinator);}
 return coordinator;
}
