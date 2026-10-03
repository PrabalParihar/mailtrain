import type {Block, EmailSpec} from './email';

function structured(spec:EmailSpec){
  if(spec.editing_mode!=='structured')throw Error('Outline block commands require a structured draft.');
}

/** Reorder one existing section without regenerating content or identifiers. */
export function moveEmailSection(spec:EmailSpec,id:string,position:number):EmailSpec{
  structured(spec);
  if(!Number.isInteger(position)||position<0||position>=spec.sections.length)throw Error('Invalid block position.');
  const index=spec.sections.findIndex(block=>block.id===id);
  if(index<0)throw Error('This block is no longer in the draft.');
  if(index===position)return spec;
  const sections=spec.sections.slice(),[block]=sections.splice(index,1);
  sections.splice(position,0,block);
  return {...spec,sections};
}

/** Keep partial field input locally; the existing save boundary validates it. */
export function replaceEmailSection(spec:EmailSpec,next:Block):EmailSpec{
  structured(spec);
  const current=spec.sections.find(block=>block.id===next.id);
  if(!current||current.type!==next.type)throw Error('This block changed. Select its current fields before editing.');
  if(current===next||JSON.stringify(current)===JSON.stringify(next))return spec;
  return {...spec,sections:spec.sections.map(block=>block.id===next.id?next:block)};
}

/** Stable identifiers make repeated delete commands harmless. */
export function removeEmailSection(spec:EmailSpec,id:string):EmailSpec{
  structured(spec);
  if(!spec.sections.some(block=>block.id===id))return spec;
  return {...spec,sections:spec.sections.filter(block=>block.id!==id)};
}
