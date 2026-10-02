import type{UTMParameterData}from'@/domain/utm';
export type UTMWorking={base:string;enabled:boolean;form:UTMParameterData};
export function formAtFingerprint(base:string):UTMParameterData{
 if(base==='none')return{utm_source:'',utm_medium:'',utm_campaign:''};
 const values:unknown=JSON.parse(base);if(!Array.isArray(values)||values.length!==3||!values.every(value=>typeof value==='string'&&value.length<=128))throw Error('Invalid UTM recovery fingerprint');
 return{utm_source:values[0],utm_medium:values[1],utm_campaign:values[2]};
}
const memory=new Map<string,UTMWorking>(),unpersisted=new Set<string>();let guarded=false;
const key=(workspace:string,email:string)=>`lettercape.utm-form.${workspace}.${email}`;
function valid(value:unknown):value is UTMWorking{
 if(!value||typeof value!=='object')return false;const v=value as UTMWorking;
 try{if(typeof v.base!=='string'||v.base.length>1024)return false;formAtFingerprint(v.base);return typeof v.enabled==='boolean'&&!!v.form&&(['utm_source','utm_medium','utm_campaign']as const).every(name=>typeof v.form[name]==='string'&&v.form[name].length<=128);}catch{return false;}
}
function guard(){if(guarded||typeof window==='undefined')return;guarded=true;window.addEventListener('beforeunload',event=>{if(unpersisted.size){event.preventDefault();event.returnValue='';}});}
export function readUTMWorking(workspace:string,email:string):{working:UTMWorking;persisted:boolean}|null{
 if(typeof window==='undefined')return null;guard();const id=key(workspace,email);
 if(memory.has(id))return{working:structuredClone(memory.get(id)!),persisted:!unpersisted.has(id)};
 try{const raw=localStorage.getItem(id);if(!raw)return null;const parsed:unknown=JSON.parse(raw);if(valid(parsed)){memory.set(id,parsed);return{working:structuredClone(parsed),persisted:true};}}catch{/* New edits remain protected in memory when storage is unavailable. */}return null;
}
export function rememberUTMWorking(workspace:string,email:string,working:UTMWorking):boolean{
 guard();const id=key(workspace,email);memory.set(id,structuredClone(working));
 try{localStorage.setItem(id,JSON.stringify(working));unpersisted.delete(id);return true;}catch{unpersisted.add(id);return false;}
}
export function clearUTMWorking(workspace:string,email:string):boolean{
 const id=key(workspace,email);memory.delete(id);unpersisted.delete(id);
 try{localStorage.removeItem(id);return true;}catch{return false;}
}
