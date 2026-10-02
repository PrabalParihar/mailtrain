'use client';
import { replaceWorkingNode, workingBounds, type WorkingRule } from '../domain/segment-working';
export type SegmentField={key:string;label:string;type:'string'|'number'|'boolean'|'date'};
export type SegmentNamed={id:string;name:string};
export function defaultWorkingRule():WorkingRule{return {nodeId:'root',kind:'all',children:[{nodeId:'initial',kind:'attribute',field:'first_name',op:'exists',value:''}]};}
export function RuleBuilder({value,fields,lists,tags,disabled,onChange}:{value:WorkingRule;fields:SegmentField[];lists:SegmentNamed[];tags:SegmentNamed[];disabled:boolean;onChange:(r:WorkingRule)=>void}) {
  const bounds=workingBounds(value);
  const leaf=(nodeId=crypto.randomUUID()):WorkingRule=>({nodeId,kind:'attribute',field:'first_name',op:'exists',value:''});
  const update=(id:string,change:(r:WorkingRule)=>WorkingRule|null)=>onChange(replaceWorkingNode(value,id,change));
  const render=(node:WorkingRule,path:string,depth:number):React.ReactNode=>{
    const label=path?'Rule '+path:'Root';
    if('children' in node)return <fieldset className="segment-rule-group" key={node.nodeId} disabled={disabled}><legend>{label} group</legend>
      <label>{label} group match<select aria-label={label+' group match'} value={node.kind} onChange={e=>update(node.nodeId,r=>'children' in r?{...r,kind:e.target.value as 'all'|'any'}:r)}><option value="all">All conditions</option><option value="any">Any condition</option></select></label>
      {node.children.map((c,i)=>render(c,path?path+'.'+(i+1):String(i+1),depth+1))}
      <div className="button-row"><button type="button" disabled={depth>=5||node.children.length>=20||bounds.nodes>=100} onClick={()=>update(node.nodeId,r=>'children' in r?{...r,children:[...r.children,leaf()]}:r)}>Add condition to {label}</button>
      <button type="button" disabled={depth>=4||node.children.length>=20||bounds.nodes>98} onClick={()=>update(node.nodeId,r=>'children' in r?{...r,children:[...r.children,{nodeId:crypto.randomUUID(),kind:'all',children:[leaf()]}]}:r)}>Add group to {label}</button>
      {path&&<button type="button" onClick={()=>update(node.nodeId,()=>null)}>Remove {label} group</button>}</div>
      {!node.children.length&&<p className="small">Add a condition before saving this group.</p>}</fieldset>;
    const relations=node.kind==='tag'?tags:lists;
    return <fieldset className="segment-rule-leaf" key={node.nodeId} disabled={disabled}><legend>{label} condition</legend>
      <label>{label} condition type<select aria-label={label+' condition type'} value={node.kind} onChange={e=>{const kind=e.target.value;update(node.nodeId,()=>kind==='attribute'?leaf(node.nodeId):kind==='engagement'?{nodeId:node.nodeId,kind,event:'clicked',op:'observed',within_days:'30'}:{nodeId:node.nodeId,kind:kind as 'tag'|'list',relationId:'',op:'in'});}}><option value="attribute">Contact field</option><option value="tag">Tag</option><option value="list">List</option><option value="engagement">Observed engagement</option></select></label>
      {node.kind==='attribute'?<><label>{label} field<select aria-label={label+' field'} value={node.field} onChange={e=>update(node.nodeId,()=>({...node,field:e.target.value}))}>
        {!fields.some(f=>f.key===node.field)&&<option value={node.field}>Unavailable field · {node.field}</option>}{fields.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select></label>
        <label>{label} comparison<select aria-label={label+' comparison'} value={node.op} onChange={e=>update(node.nodeId,()=>({...node,op:e.target.value as typeof node.op}))}>{['exists','not_exists','eq','neq','contains','gt','gte','lt','lte'].map(op=><option key={op} value={op}>{op.replaceAll('_',' ')}</option>)}</select></label>
        {!['exists','not_exists'].includes(node.op)&&<label>{label} comparison value<input aria-label={label+' comparison value'} value={node.value} maxLength={2000} inputMode={fields.find(f=>f.key===node.field)?.type==='number'?'decimal':undefined} onChange={e=>update(node.nodeId,()=>({...node,value:e.target.value}))}/></label>}</>
      :node.kind==='engagement'?<><label>{label} event<select aria-label={label+' event'} value={node.event} onChange={e=>update(node.nodeId,()=>({...node,event:e.target.value as typeof node.event}))}>{['clicked','opened','delivered'].map(event=><option key={event}>{event}</option>)}</select></label>
      <label>{label} observation<select aria-label={label+' observation'} value={node.op} onChange={e=>update(node.nodeId,()=>({...node,op:e.target.value as typeof node.op}))}><option value="observed">Observed</option><option value="not_observed">Not observed</option></select></label>
      <label>{label} within days<input aria-label={label+' within days'} value={node.within_days} inputMode="numeric" maxLength={2000} onChange={e=>update(node.nodeId,()=>({...node,within_days:e.target.value}))}/></label></>
      :'relationId' in node?<><label>{label} {node.kind}<select aria-label={label+' '+node.kind} value={node.relationId} onChange={e=>update(node.nodeId,()=>({...node,relationId:e.target.value}))}>
        <option value="">Choose {node.kind}</option>{node.relationId&&!relations.some(r=>r.id===node.relationId)&&<option value={node.relationId}>Unavailable in this catalog · {node.relationId}</option>}{relations.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
        <label>{label} membership<select aria-label={label+' membership'} value={node.op} onChange={e=>update(node.nodeId,()=>({...node,op:e.target.value as typeof node.op}))}><option value="in">Is in</option><option value="not_in">Is not in</option></select></label></>:null}
      {path?<button type="button" onClick={()=>update(node.nodeId,()=>null)}>Remove {label} condition</button>:<button type="button" disabled={bounds.depth>=5||bounds.nodes>=100} onClick={()=>onChange({nodeId:crypto.randomUUID(),kind:'all',children:[node]})}>Wrap root in all group</button>}</fieldset>;
  };
  return <div className="segment-rule-builder">{render(value,'',0)}<p className="small muted">{bounds.nodes}/100 rules · depth {bounds.depth}/5 · at most 20 conditions per group.</p></div>;
}
