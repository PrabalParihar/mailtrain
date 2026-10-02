import {z} from 'zod';
import type {EmailSpec} from '../domain/email';
import {EmailSpecSchema} from '../domain/email-schema';
import {ConversionAcceptInput} from '../domain/email-conversion-contracts';

const scopeSchema=z.object({workspace:z.string().min(1).max(200),email:z.uuid(),actor:z.string().min(1).max(500)}).strict();
export type ConversionScope=z.infer<typeof scopeSchema>;
export const ConversionContextSchema=z.object({version:z.number().int().positive(),spec:z.string().max(16000000)}).strict();
export type ConversionContext=z.infer<typeof ConversionContextSchema>;
const schema=scopeSchema.extend({schema_version:z.literal(1),context:ConversionContextSchema,command:z.object({body:ConversionAcceptInput,key:z.uuid()}).strict()}).strict();
export type ConversionRecovery=z.infer<typeof schema>;
export function conversionContextMatches(context:ConversionContext,version:number,spec:EmailSpec){return context.version===version&&context.spec===JSON.stringify(spec);}
export function parseConversionRecovery(raw:string,scope:ConversionScope):ConversionRecovery|null {
 try {
  if(raw.length>32000000)return null;
  const value=schema.parse(JSON.parse(raw));scopeSchema.parse(scope);
  if(value.workspace!==scope.workspace||value.email!==scope.email||value.actor!==scope.actor||value.context.version!==value.command.body.expected_version)return null;
  const source=EmailSpecSchema.parse(JSON.parse(value.context.spec));if(source.editing_mode!=='raw_html')return null;
  return value;
 }catch{return null;}
}
const memory=new Map<string,ConversionRecovery|null>(),unpersisted=new Set<string>();let guarded=false;
const slot=(scope:ConversionScope)=>'lettercape.conversion.'+JSON.stringify([scope.workspace,scope.actor,scope.email]);
export function readConversionRecovery(scope:ConversionScope):{pending:ConversionRecovery|null;persisted:boolean} {
 const key=slot(scope);if(memory.has(key))return {pending:structuredClone(memory.get(key)??null),persisted:!unpersisted.has(key)};
 try{const raw=localStorage.getItem(key);return {pending:raw?parseConversionRecovery(raw,scope):null,persisted:true};}catch{return {pending:null,persisted:false};}
}
export function rememberConversionRecovery(scope:ConversionScope,pending:ConversionRecovery) {
 const raw=JSON.stringify(pending),validated=parseConversionRecovery(raw,scope);if(!validated)return false;
 const key=slot(scope);memory.set(key,structuredClone(validated));let persisted=true;
 try{localStorage.setItem(key,raw);unpersisted.delete(key);}catch{persisted=false;unpersisted.add(key);}
 if(!guarded&&typeof window!=='undefined'){window.addEventListener('beforeunload',event=>{if(unpersisted.size){event.preventDefault();event.returnValue='';}});guarded=true;}
 return persisted;
}
export function clearConversionRecovery(scope:ConversionScope){const key=slot(scope);memory.set(key,null);unpersisted.delete(key);try{localStorage.removeItem(key);}catch{}}
