import {z} from 'zod';
import {SenderDraftInput,SenderVersionInput,SenderCheckInput,SenderView,normalizeSender,type SenderData} from '../domain/sender-domain';

const working=z.object({name:z.string().max(100),provider:z.enum(['ses','resend','sendgrid','mailgun']),account_label:z.string().max(100),region:z.string().max(40),from_name:z.string().max(100),from_address:z.string().max(254),reply_to:z.string().max(254)}).strict();
const schema=z.object({base:SenderView.nullable(),working,pending:z.object({kind:z.enum(['create','version','dns']),path:z.string().max(100),key:z.string().uuid(),body:z.string().max(16000)}).strict().optional()}).strict();
export type SenderForm=z.infer<typeof schema>;
export function formForSender(base:SenderData|null):SenderForm {
 return {base,working:base?{name:base.name,provider:base.provider,account_label:base.account_label,region:base.region,from_name:base.from_name,from_address:base.from_address,reply_to:base.reply_to??''}:{name:'',provider:'ses',account_label:'',region:'',from_name:'',from_address:'',reply_to:''}};
}
export function senderFormDirty(form:SenderForm){return JSON.stringify(form.working)!==JSON.stringify(formForSender(form.base).working);}
export function parseSenderForm(raw:string):SenderForm|null {
 try {
  if(raw.length>50000)return null;
  const form=schema.parse(JSON.parse(raw)),pending=form.pending;
  if(pending) {
   const body:unknown=JSON.parse(pending.body);
   if(pending.kind==='create') {
    if(form.base||pending.path!=='sender-identities')return null;
    normalizeSender(SenderDraftInput.parse(body));
   }else {
    if(!form.base||pending.path!=='sender-identities/'+form.base.id+(pending.kind==='version'?'/versions':'/dns-checks'))return null;
    const command=pending.kind==='version'?SenderVersionInput.parse(body):SenderCheckInput.parse(body);
    if(command.expected_version!==form.base.version)return null;
    if(pending.kind==='version'){const draft={...SenderVersionInput.parse(body)};Reflect.deleteProperty(draft,'expected_version');normalizeSender(draft);}
   }
  }
  return form;
 }catch{return null;}
}
/** A receipt can clear a command; only matching current truth adopts a new saved base. */
export function acknowledgeSenderSave(form:SenderForm,receipt:SenderData,current:SenderData):SenderForm {
 if(receipt.id!==current.id||current.version<receipt.version||(form.base&&receipt.id!==form.base.id))throw new Error('Sender acknowledgment does not match current truth.');
 if(current.version===receipt.version)return formForSender(current);
 if(!form.base)return {...form};
 const retained={...form};delete retained.pending;return retained;
}
const memory=new Map<string,SenderForm>(),unpersisted=new Set<string>(),selection=new Map<string,string>();let guarded=false;
const slot=(workspace:string,id:string)=>`lettercape.sender-form.${workspace}.${id}`;
function sourceMatches(form:SenderForm|null,id:string){return form&&(id==='new'?form.base===null:form.base?.id===id)?form:null;}
export function readSenderForm(workspace:string,id:string) {
 const key=slot(workspace,id),cached=memory.get(key);
 if(cached)return {form:sourceMatches(structuredClone(cached),id),persisted:!unpersisted.has(key)};
 try{const raw=localStorage.getItem(key);return {form:sourceMatches(raw?parseSenderForm(raw):null,id),persisted:true};}
 catch{return {form:null,persisted:false};}
}
export function rememberSenderForm(workspace:string,id:string,form:SenderForm) {
 const key=slot(workspace,id);memory.set(key,structuredClone(form));let persisted=true;
 try {
  const raw=JSON.stringify(form);if(!sourceMatches(parseSenderForm(raw),id))throw new Error('Recovery exceeds admitted bounds.');
  localStorage.setItem(key,raw);unpersisted.delete(key);
 }catch{persisted=false;if(senderFormDirty(form)||form.pending)unpersisted.add(key);else unpersisted.delete(key);}
 if(!guarded&&typeof window!=='undefined') {
  window.addEventListener('beforeunload',event=>{if(unpersisted.size){event.preventDefault();event.returnValue='';}});guarded=true;
 }
 return persisted;
}
export function clearSenderForm(workspace:string,id:string) {
 const key=slot(workspace,id);memory.delete(key);unpersisted.delete(key);try{localStorage.removeItem(key);}catch{}
}
export function readSenderSelection(workspace:string) {
 if(selection.has(workspace))return selection.get(workspace)!;
 try{const value=localStorage.getItem('lettercape.sender-selection.'+workspace);return value&&(value==='new'||z.uuid().safeParse(value).success)?value:'new';}catch{return 'new';}
}
export function rememberSenderSelection(workspace:string,id:string) {
 selection.set(workspace,id);try{localStorage.setItem('lettercape.sender-selection.'+workspace,id);}catch{}
}
