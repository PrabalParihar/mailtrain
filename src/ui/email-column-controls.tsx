'use client';
import {useState} from 'react';
import type {Block} from '@/domain/email';
import {MAX_COLUMN_CHILDREN,type ColumnChild} from '@/domain/column-editor';
export type ColumnEditorActions={
 canAdd:boolean;
 onAdd:(parent:string,column:number,type:ColumnChild['type'])=>void;
 onMove:(parent:string,child:string,column:number,position:number)=>void;
 onRemove:(parent:string,child:string)=>void;
 onChange:(parent:string,child:ColumnChild)=>void;
};
export function AddColumnBlock({parent,column,count,readOnly,actions}:{parent:string;column:number;count:number;readOnly:boolean;actions:ColumnEditorActions}){
 const [type,setType]=useState<ColumnChild['type']>('text'),label='column '+(column+1),disabled=readOnly||count>=MAX_COLUMN_CHILDREN||!actions.canAdd;
 return <div className="column-child-controls">
  <label>Block type<select aria-label={'Block type for '+label} value={type} disabled={disabled} onChange={event=>setType(event.target.value as ColumnChild['type'])}>{(['hero','text','image','button','divider','social','legal_footer','product_card','custom_html'] as const).map(type=><option key={type} value={type}>{type.replaceAll('_',' ')}</option>)}</select></label>
  <button type="button" disabled={disabled} aria-label={'Add block to '+label} onClick={()=>{if(!disabled)actions.onAdd(parent,column,type);}}>Add block</button>
  {count>=MAX_COLUMN_CHILDREN?<p className="small">This column has reached its 20-block limit.</p>:!actions.canAdd?<p className="small">This email has reached its 200-block limit.</p>:null}
 </div>;
}
export function ColumnChildControls({parent,column,index,child,readOnly,actions}:{parent:Extract<Block,{type:'columns'}>;column:number;index:number;child:ColumnChild;readOnly:boolean;actions:ColumnEditorActions}){
 const children=parent.columns[column],label=`${child.type} ${index+1} in column ${column+1}`;
 return <div className="column-child-controls">
  <button type="button" aria-label={'Move '+label+' up'} disabled={readOnly||index===0} onClick={()=>{if(!readOnly&&index>0)actions.onMove(parent.id,child.id,column,index-1);}}>Move up</button>
  <button type="button" aria-label={'Move '+label+' down'} disabled={readOnly||index===children.length-1} onClick={()=>{if(!readOnly&&index<children.length-1)actions.onMove(parent.id,child.id,column,index+1);}}>Move down</button>
  <label>Move to position<select aria-label={'Position of '+label} value={index} disabled={readOnly} onChange={event=>{if(!readOnly)actions.onMove(parent.id,child.id,column,Number(event.target.value));}}>{children.map((_,position)=><option key={position} value={position}>{position+1}</option>)}</select></label>
  {parent.columns.length>1&&<label>Move to column<select data-column-parent={parent.id} data-column-destination={child.id} aria-label={'Column for '+label} value={column} disabled={readOnly} onChange={event=>{if(!readOnly){const target=Number(event.target.value);if(target!==column)actions.onMove(parent.id,child.id,target,parent.columns[target].length);}}}>{parent.columns.map((nodes,target)=><option key={target} value={target} disabled={target!==column&&nodes.length>=MAX_COLUMN_CHILDREN}>Column {target+1}{target!==column&&nodes.length>=MAX_COLUMN_CHILDREN?' (full)':''}</option>)}</select></label>}
  <button type="button" aria-label={'Delete '+label} disabled={readOnly} onClick={()=>{if(!readOnly)actions.onRemove(parent.id,child.id);}}>Delete block</button>
 </div>;
}
