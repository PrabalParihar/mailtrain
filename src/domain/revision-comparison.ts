import {z} from 'zod';
import {canonicalSpecString} from './email-source-values';
import {EmailSourceSpecSchema,type EmailSpec,type Block} from './email-schema';
export const RevisionComparisonQuery=z.object({email_id:z.uuid(),before:z.uuid(),after:z.uuid()}).strict();
const checkpoint=z.object({id:z.uuid(),email_id:z.uuid(),revision_no:z.number().int().positive(),source_doc_version:z.number().int().positive().nullable(),artifact_hash:z.string().regex(/^[a-f0-9]{64}$/),created_at:z.iso.datetime({offset:true}),raw_source_profile:z.enum(['legacy-stored-1','exact-utf8-1']).nullable(),spec:EmailSourceSpecSchema}).strict();
export const RevisionComparisonSchema=z.object({workspace_id:z.uuid(),actor_id:z.string().min(1),email_id:z.uuid(),before:checkpoint,after:checkpoint}).strict().superRefine((v,c)=>{if(v.before.email_id!==v.email_id||v.after.email_id!==v.email_id)c.addIssue({code:'custom',message:'Checkpoint email differs'});});
export type RevisionComparison=z.infer<typeof RevisionComparisonSchema>;
export type RevisionChange={key:string;label:string;kind:'metadata'|'structure'|'content'|'source';before:string;after:string;changed:boolean;before_present:boolean;after_present:boolean};
const display=(value:unknown)=>value===undefined?'(Absent)':typeof value==='string'?value:canonicalSpecString(value);
export function revisionComparisonRows(before:EmailSpec,after:EmailSpec):RevisionChange[]{
 const rows:RevisionChange[]=[];
 const add=(key:string,label:string,kind:RevisionChange['kind'],a:unknown,b:unknown)=>{const first=display(a),second=display(b);rows.push({key,label,kind,before:first,after:second,changed:a===undefined||b===undefined?a!==b:canonicalSpecString(a)!==canonicalSpecString(b),before_present:a!==undefined,after_present:b!==undefined});};
 const labels:Record<string,string>={subject:'Subject',preheader:'Preheader',editing_mode:'Editing mode',locale:'Email locale',direction:'Email direction',theme:'Theme',brand_kit_version_id:'Brand kit version',tracking:'UTM policy',asset_registry:'Pinned assets',schema_version:'Schema version'};
 for(const key of new Set([...Object.keys(before),...Object.keys(after)]))if(!['sections','raw_html'].includes(key))add(key,labels[key]??key,'metadata',Reflect.get(before,key),Reflect.get(after,key));
 const rawMode=before.editing_mode==='raw_html'||after.editing_mode==='raw_html';
 if(rawMode||before.raw_html!==undefined||after.raw_html!==undefined)add('raw_html',rawMode?'Exact raw HTML source':'Retained raw HTML source (inactive in structured checkpoints)','source',before.raw_html,after.raw_html);
 if(rawMode){
  add('stored_sections','Stored blocks (inactive in raw checkpoints)','structure',before.sections,after.sections);return rows;
 }
 function flatten(spec:EmailSpec){const map=new Map<string,{node:Block;position:string}>();let duplicate=false;const visit=(node:Block,position:string)=>{if(map.has(node.id))duplicate=true;map.set(node.id,{node,position});if(node.type==='columns')node.columns.forEach((col,c)=>col.forEach((child,n)=>visit(child,`Columns ${node.id}, column ${c+1}, position ${n+1}`)));};spec.sections.forEach((node,n)=>visit(node,`Root position ${n+1}`));return{map,duplicate};}
 const first=flatten(before),second=flatten(after);
 if(first.duplicate||second.duplicate){add('ambiguous_sections','Stored blocks with repeated IDs (whole structure comparison)','structure',before.sections,after.sections);return rows;}
 for(const id of new Set([...first.map.keys(),...second.map.keys()])){
  const a=first.map.get(id),b=second.map.get(id),label=`Block ${id}`;
  if(!a||!b){add('node:'+id,label+(a?' removed':' added'),'structure',a?.node,b?.node);continue;}
  add('position:'+id,label+' placement','structure',a.position,b.position);
  for(const field of new Set([...Object.keys(a.node),...Object.keys(b.node)]))if(field!=='id'&&field!=='columns')add(`node:${id}:${field}`,label+' · '+field,field==='html'?'source':'content',Reflect.get(a.node,field),Reflect.get(b.node,field));
  if(a.node.type==='columns'||b.node.type==='columns')add(`node:${id}:column_count`,label+' column count','structure',a.node.type==='columns'?a.node.columns.length:undefined,b.node.type==='columns'?b.node.columns.length:undefined);
 }
 return rows;
}
