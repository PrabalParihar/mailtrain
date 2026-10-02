import { z } from 'zod';
import { RuleLeafSchema, type Rule } from '../domain/segments';
import { workingBounds, type WorkingRule } from '../domain/segment-working';

export function normalizeSavedRule(input: unknown): Rule {
  let nodes=0;
  const walk=(value:unknown,depth:number):Rule=>{
    if(++nodes>100||depth>5)throw new Error('Saved rule exceeds editing bounds.');
    if(value&&typeof value==='object'&&'kind' in value&&(value.kind==='all'||value.kind==='any')) {
      const group=z.object({kind:z.enum(['all','any']),children:z.array(z.unknown()).min(1).max(20)}).strict().parse(value);
      return {kind:group.kind,children:group.children.map(v=>walk(v,depth+1))};
    }
    return RuleLeafSchema.parse(value);
  };
  return walk(input,0);
}
const text=z.string().max(2000), nodeId=z.string().min(1).max(100);
// JSON can expand one UTF-16 code unit to six characters. Bound the entire
// admitted 100-node envelope, including both escaped serialized rule copies.
// 256/node covers keys, operators, punctuation and bounded structural metadata.
const ruleJSONLimit=100*((2000+48)*6+256);
const commandJSONLimit=ruleJSONLimit+8192;
const workingJSONLimit=100*((2000*2+100)*6+256);
const recoveryJSONLimit=workingJSONLimit+2*(ruleJSONLimit+commandJSONLimit)+8192;
const tree: z.ZodType<WorkingRule> = z.lazy(()=>z.union([
  z.object({nodeId,kind:z.enum(['all','any']),children:z.array(tree).max(20)}).strict(),
  z.object({nodeId,kind:z.literal('attribute'),field:text,op:z.enum(['eq','neq','contains','gt','gte','lt','lte','exists','not_exists']),value:text}).strict(),
  z.object({nodeId,kind:z.enum(['tag','list']),relationId:text,op:z.enum(['in','not_in'])}).strict(),
  z.object({nodeId,kind:z.literal('engagement'),event:z.enum(['opened','clicked','delivered']),op:z.enum(['observed','not_observed']),within_days:text}).strict(),
]));
const pendingSchema=z.object({kind:z.enum(['create','version','freeze']),path:z.string().max(100),key:z.string().uuid(),body:z.string().max(commandJSONLimit),source_id:z.string().uuid().nullable(),source_version:z.number().int().nonnegative()}).strict();
const recoverySchema=z.object({segment_id:z.string().uuid().nullable(),base_version:z.number().int().nonnegative(),saved_fingerprint:z.string().max(ruleJSONLimit).nullable(),name:z.string().max(100),root:tree,pending:pendingSchema.optional()}).strict();
export type SegmentRecovery=z.infer<typeof recoverySchema>;
export function parseSegmentRecovery(raw:string):SegmentRecovery|null {
  try {
    if(raw.length>recoveryJSONLimit)return null;
    // Bound JSON nesting before recursive validation to avoid a corrupt local record exhausting the stack.
    let depth=0,quoted=false,escaped=false;
    for(const ch of raw){if(escaped){escaped=false;continue;}if(quoted&&ch==='\\'){escaped=true;continue;}if(ch==='"'){quoted=!quoted;continue;}if(!quoted){if(ch==='{'||ch==='['){if(++depth>24)return null;}else if(ch==='}'||ch===']')depth--;}}
    const r=recoverySchema.parse(JSON.parse(raw)); workingBounds(r.root);
    if((r.segment_id===null)!==(r.base_version===0)||(r.segment_id===null)!==(r.saved_fingerprint===null))return null;
    if(r.saved_fingerprint)normalizeSavedRule(JSON.parse(r.saved_fingerprint));
    if(r.pending){const p=r.pending;
      if(p.source_id!==r.segment_id||p.source_version!==r.base_version)return null;
      const path=p.kind==='create'?'segments':`segments/${r.segment_id}/${p.kind==='version'?'versions':'snapshots'}`;
      if(p.path!==path||((p.kind==='create')!==(r.segment_id===null)))return null;
      const b=JSON.parse(p.body);
      if(p.kind==='freeze')z.object({expected_version:z.literal(r.base_version)}).strict().parse(b);
      else {const input=p.kind==='create'?z.object({name:z.string().trim().min(1).max(100),rule:z.unknown()}).strict().parse(b):z.object({expected_version:z.literal(r.base_version),rule:z.unknown()}).strict().parse(b);normalizeSavedRule(input.rule);}
    }
    return r;
  }catch{return null;}
}
const memory=new Map<string,SegmentRecovery>(), unpersisted=new Set<string>();
let unloadInstalled=false;
export function readSegmentRecovery(workspace:string) {
  const cached=memory.get(workspace);if(cached)return {record:structuredClone(cached),persisted:!unpersisted.has(workspace)};
  try{const raw=localStorage.getItem('lettercape.segment-form.'+workspace);return {record:raw?parseSegmentRecovery(raw):null,persisted:true};}catch{return {record:null,persisted:false};}
}
export function rememberSegmentRecovery(workspace:string,record:SegmentRecovery,protect:boolean) {
  memory.set(workspace,structuredClone(record));let persisted=true;
  try{const raw=JSON.stringify(record);if(!parseSegmentRecovery(raw))throw new Error('Recovery record exceeds admitted bounds.');localStorage.setItem('lettercape.segment-form.'+workspace,raw);unpersisted.delete(workspace);}catch{persisted=false;if(protect)unpersisted.add(workspace);else unpersisted.delete(workspace);}
  if(!unloadInstalled&&typeof window!=='undefined'){window.addEventListener('beforeunload',event=>{if(unpersisted.size){event.preventDefault();event.returnValue='';}});unloadInstalled=true;}
  return persisted;
}
