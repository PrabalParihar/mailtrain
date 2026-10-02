import {z} from 'zod';
import {EmailSourceSpecSchema,type EmailSpec,type Block} from './email-schema';
import {canonicalSpecString} from './email-source-values';

const draft=z.object({id:z.uuid(),title:z.string().max(160),doc_version:z.number().int().positive(),spec:EmailSourceSpecSchema}).strict();
export const LocaleComparisonSchema=z.object({workspace_id:z.uuid(),actor_id:z.string().min(1),child_id:z.uuid(),parent:draft,target:draft,baseline:z.object({revision_id:z.uuid(),revision_no:z.number().int().positive(),source_doc_version:z.number().int().positive().nullable(),spec:EmailSourceSpecSchema}).strict(),source_status:z.enum(['current','outdated','unknown'])}).strict().superRefine((v,c)=>{if(v.target.id!==v.child_id)c.addIssue({code:'custom',message:'Comparison child identity differs'});});
export type LocaleComparison=z.infer<typeof LocaleComparisonSchema>;
export type LocaleRow={key:string;label:string;original:string;source:string;target:string;changed:boolean;selectable:boolean};
const fields:Partial<Record<Block['type'],string[]>>={hero:['heading','text'],text:['text'],button:['label'],product_card:['title','description']};
const display=(value:unknown)=>value===undefined?'(Absent)':typeof value==='string'?value:canonicalSpecString(value);
export function localeComparisonRows(original:EmailSpec,source:EmailSpec,target:EmailSpec):LocaleRow[]{
 const rows:LocaleRow[]=[];const structured=[original,source,target].every(s=>s.editing_mode==='structured');
 function add(key:string,label:string,a:unknown,b:unknown,c:unknown,allowed=false){const before=display(a),now=display(b),local=display(c);rows.push({key,label,original:before,source:now,target:local,changed:before!==now,selectable:allowed&&typeof b==='string'&&before!==now&&now!==local});}
 for(const field of ['subject','preheader']as const)add(field,field==='subject'?'Subject':'Preheader',original[field],source[field],target[field],structured);
 if(!structured){add('raw_html','Raw HTML (read only)',original.raw_html,source.raw_html,target.raw_html);return rows;}
 const old=new Map(original.sections.map(b=>[b.id,b])),current=new Map(source.sections.map(b=>[b.id,b])),local=new Map(target.sections.map(b=>[b.id,b]));
 for(const id of new Set([...old.keys(),...current.keys(),...local.keys()])){
  const a=old.get(id),b=current.get(id),c=local.get(id);const names=b&&a?.type===b.type&&c?.type===b.type?fields[b.type]:undefined;
  if(names)for(const field of names)add(JSON.stringify([id,field]),id+' · '+field,Reflect.get(a!,field),Reflect.get(b!,field),Reflect.get(c!,field),true);
  else add(JSON.stringify([id]),id+' · '+(b?.type??a?.type??c?.type)+' (read only)',a,b,c);
 }
 return rows;
}
export function applyLocaleSourceSelection(original:EmailSpec,source:EmailSpec,target:EmailSpec,selected:string[]):EmailSpec{
 if(!selected.length||selected.length>402||new Set(selected).size!==selected.length)throw Error('Choose distinct source text fields.');
 const eligible=new Set(localeComparisonRows(original,source,target).filter(r=>r.selectable).map(r=>r.key));
 if(selected.some(key=>!eligible.has(key)))throw Error('This field cannot be copied. Refresh the comparison and review structural, raw, image and legal changes manually.');
 const result=structuredClone(target);
 for(const key of selected){if(key==='subject'||key==='preheader')result[key]=source[key];else{const[id,field]=JSON.parse(key)as[string,string];const from=source.sections.find(b=>b.id===id)!,to=result.sections.find(b=>b.id===id)!;Reflect.set(to,field,Reflect.get(from,field));}}
 return EmailSourceSpecSchema.parse(result);
}
