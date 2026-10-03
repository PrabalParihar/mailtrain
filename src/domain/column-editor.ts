import type {Block,EmailSpec} from './email';
export type ColumnChild=Exclude<Block,{type:'columns'}>;
export const MAX_COLUMN_CHILDREN=20;
export const MAX_EMAIL_NODES=200;
export function emailNodeCount(spec:EmailSpec){return spec.sections.reduce((count,block)=>count+1+(block.type==='columns'?block.columns.flat().length:0),0);}
function parent(spec:EmailSpec,id:string){
 if(spec.editing_mode!=='structured')throw Error('Column commands require a structured draft.');
 const block=spec.sections.find(block=>block.id===id);
 if(block?.type!=='columns')throw Error('This column block changed. Select its current content.');
 return block;
}
function column(block:Extract<Block,{type:'columns'}>,index:number){
 if(!Number.isInteger(index)||index<0||index>=block.columns.length)throw Error('This column is no longer available.');
 return block.columns[index];
}
function install(spec:EmailSpec,block:Extract<Block,{type:'columns'}>,columns:ColumnChild[][]):EmailSpec{
 return {...spec,sections:spec.sections.map(section=>section.id===block.id?{...block,columns}:section)};
}
export function addColumnChild(spec:EmailSpec,parentId:string,index:number,child:Block):EmailSpec{
 const block=parent(spec,parentId),children=column(block,index);
 if(child.type==='columns')throw Error('Nested columns are not supported.');
 if(!child.id||child.id.length>80||spec.sections.some(section=>section.id===child.id||section.type==='columns'&&section.columns.flat().some(node=>node.id===child.id)))throw Error('Choose a new stable block identifier.');
 if(children.length>=MAX_COLUMN_CHILDREN)throw Error('Each column supports up to 20 blocks.');
 if(emailNodeCount(spec)>=MAX_EMAIL_NODES)throw Error('This email supports up to 200 blocks including column content.');
 return install(spec,block,block.columns.map((nodes,n)=>n===index?[...nodes,child]:nodes));
}
export function moveColumnChild(spec:EmailSpec,parentId:string,childId:string,targetColumn:number,position:number):EmailSpec{
 const block=parent(spec,parentId),target=column(block,targetColumn),sourceIndex=block.columns.findIndex(nodes=>nodes.some(node=>node.id===childId));
 if(sourceIndex<0)throw Error('This block is no longer in the column draft.');
 const source=block.columns[sourceIndex],sourcePosition=source.findIndex(node=>node.id===childId),child=source[sourcePosition];
 const maximum=target.length-(sourceIndex===targetColumn?1:0);
 if(!Number.isInteger(position)||position<0||position>maximum)throw Error('Invalid column block position.');
 if(sourceIndex===targetColumn&&sourcePosition===position)return spec;
 if(sourceIndex!==targetColumn&&target.length>=MAX_COLUMN_CHILDREN)throw Error('Each column supports up to 20 blocks.');
 const columns=block.columns.map(nodes=>nodes===source||nodes===target?nodes.slice():nodes);
 columns[sourceIndex].splice(sourcePosition,1);columns[targetColumn].splice(position,0,child);
 return install(spec,block,columns);
}
export function replaceColumnChild(spec:EmailSpec,parentId:string,next:Block):EmailSpec{
 const block=parent(spec,parentId),index=block.columns.findIndex(nodes=>nodes.some(node=>node.id===next.id));
 const current=block.columns[index]?.find(node=>node.id===next.id);
 if(!current||next.type==='columns'||current.type!==next.type)throw Error('This block changed. Select its current fields.');
 if(current===next||JSON.stringify(current)===JSON.stringify(next))return spec;
 return install(spec,block,block.columns.map((nodes,n)=>n===index?nodes.map(node=>node.id===next.id?next:node):nodes));
}
export function removeColumnChild(spec:EmailSpec,parentId:string,childId:string):EmailSpec{
 const block=parent(spec,parentId);
 if(!block.columns.some(nodes=>nodes.some(node=>node.id===childId)))return spec;
 return install(spec,block,block.columns.map(nodes=>nodes.some(node=>node.id===childId)?nodes.filter(node=>node.id!==childId):nodes));
}
