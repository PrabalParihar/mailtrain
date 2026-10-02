import {createHash} from 'node:crypto';
import {parseFragment,type DefaultTreeAdapterTypes} from 'parse5';
import {EmailSpecSchema,compileEmail,sanitizeRaw,type EmailSpec,type Block} from './email';
import {ConversionProposalInput,ConversionProposalSchema,type ConversionProposal} from './email-conversion-contracts';
export {ConversionProposalInput,ConversionAcceptInput,ConversionProposalSchema,type ConversionProposal} from './email-conversion-contracts';

const POLICY='raw-to-blocks-1';
const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
type Node=DefaultTreeAdapterTypes.ChildNode;
type Note=ConversionProposal['notes'][number];
function stable(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.entries(value).filter(([,item])=>item!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,item])=>JSON.stringify(key)+':'+stable(item)).join(',')+'}';
 return JSON.stringify(value);
}
function digest(value:unknown){return createHash('sha256').update(stable(value)).digest('hex');}
function plain(node:DefaultTreeAdapterTypes.Element) {
 if(node.childNodes.some(child=>child.nodeName!=='#text'))return null;
 return node.childNodes.map(child=>'value'in child?child.value:'').join('');
}
function safeURL(value:string,protocols:string[]) {
 if(value.length>2048||value!==value.trim()||/[\u0000-\u0020\u007f]/.test(value))return false;
 try{const url=new URL(value);return protocols.includes(url.protocol)&&!url.username&&!url.password&&(url.protocol!=='https:'||/^https:\/\/[^/\\]/i.test(value));}catch{return false;}
}
function recognized(node:Node,id:string):Block|null {
 if(!('tagName'in node))return null;
 const text=plain(node);
 if(!node.attrs.length&&text!==null&&text.length<=10000) {
  if(node.tagName==='p')return {id,type:'text',text};
  if(['h1','h2','h3'].includes(node.tagName))return {id,type:'hero',heading:text,text:''};
 }
 if(node.tagName==='a'&&node.attrs.length===1&&node.attrs[0].name==='href'&&text!==null&&text.length>0&&text.length<=200&&safeURL(node.attrs[0].value,['https:','mailto:','tel:']))return {id,type:'button',label:text,href:node.attrs[0].value};
 if(node.tagName==='img'&&node.attrs.length===2&&node.attrs.every(attr=>['src','alt'].includes(attr.name))) {
  const src=node.attrs.find(attr=>attr.name==='src')?.value,alt=node.attrs.find(attr=>attr.name==='alt')?.value;
  if(src!==undefined&&alt!==undefined&&alt.length<=500&&safeURL(src,['https:']))return {id,type:'image',src,alt,...(alt===''?{decorative:true}:{})};
 }
 if(node.tagName==='hr'&&!node.attrs.length)return {id,type:'divider'};
 return null;
}

/** Every parsed node must occupy an unambiguous, ordered interval of the original source. */
function located(nodes:Node[],html:string,start:number,end:number) {
 let position=start;
 for(const node of nodes) {
  const location=node.sourceCodeLocation;
  if(!location||!Number.isInteger(location.startOffset)||!Number.isInteger(location.endOffset)||location.startOffset<position||location.endOffset<=location.startOffset||location.endOffset>end||html.slice(position,location.startOffset).trim())return false;
  position=location.endOffset;
 }
 return !html.slice(position,end).trim();
}
function intact(tree:DefaultTreeAdapterTypes.DocumentFragment,html:string) {
 if(!located(tree.childNodes,html,0,html.length))return false;
 const pending=[...tree.childNodes];
 while(pending.length) {
  const node=pending.pop()!;
  if(node.nodeName==='#text')continue;
  if(!('tagName'in node)||node.namespaceURI!=='http://www.w3.org/1999/xhtml'||node.tagName.includes(':')||node.attrs.some(attr=>attr.namespace||attr.prefix||attr.name.includes(':')))return false;
  const location=node.sourceCodeLocation,startTag=location?.startTag,endTag=location?.endTag;
  if(!location||!startTag||startTag.startOffset!==location.startOffset||startTag.endOffset>location.endOffset)return false;
  if(voidTags.has(node.tagName)) {
   if(node.childNodes.length||endTag||startTag.endOffset!==location.endOffset)return false;
  }else if(!endTag||endTag.endOffset!==location.endOffset||endTag.startOffset<startTag.endOffset||!located(node.childNodes,html,startTag.endOffset,endTag.startOffset))return false;
  for(const child of node.childNodes)pending.push(child);
 }
 return true;
}

/** Produces a review proposal only; it never replaces or decorates the supplied source. */
export async function conversionProposal(spec:EmailSpec,version:number):Promise<ConversionProposal> {
 const source=EmailSpecSchema.parse(spec),sourceVersion=ConversionProposalInput.parse({expected_version:version}).expected_version;
 const original=source.raw_html??'',sourceHash=digest({source_doc_version:sourceVersion,spec:source});
 function finish(status:'available'|'unsupported',proposed:EmailSpec|null,preview:string|null,converted:number,opaque:number,notes:Note[]) {
  const proposal={source_doc_version:sourceVersion,source_hash:sourceHash,status,original_html:original,spec:proposed,preview_html:preview,converted_nodes:converted,opaque_nodes:opaque,notes};
  return ConversionProposalSchema.parse({...proposal,proposal_hash:digest({policy:POLICY,...proposal})});
 }
 function refuse(code:'unsupported_source'|'limit',message:string){return finish('unsupported',null,null,0,0,[{code,message}]);}
 if(source.editing_mode!=='raw_html')return refuse('unsupported_source','Only an existing raw HTML draft can be converted. The source was not changed.');
 if(/<!doctype\b|<!--|<\/?(?:html|head|body)\b|<\/?[a-z][\w.-]*:|\bxmlns(?:\s|:|=)/i.test(original))return refuse('unsupported_source','Document wrappers, comments, VML and namespace constructs need raw-mode review. The source was not changed.');
 if(sanitizeRaw(original).html!==original)return refuse('unsupported_source','The existing sanitizer changes this source. Conversion cannot preserve its exact bytes; keep it in raw mode.');
 let repaired=false;
 const tree=parseFragment(original,{sourceCodeLocationInfo:true,onParseError(){repaired=true;}});
 if(repaired||!intact(tree,original))return refuse('unsupported_source','The parser repaired or could not locate part of this source. Conversion is unavailable; the source was not changed.');
 const nodes=tree.childNodes.filter(node=>node.nodeName!=='#text'||('value'in node&&node.value.trim().length>0));
 if(!nodes.length)return refuse('unsupported_source','No nonblank content is available to convert. The raw source was not changed.');
 if(nodes.length>200)return refuse('limit','The source would exceed200converted or opaque blocks. Nothing was truncated or changed.');
 const sections:Block[]=[],notes:Note[]=[{code:'layout_change',message:'Block rendering can change layout, heading levels, spacing and button styling. Review both previews before explicitly accepting.'}];
 let converted=0,opaque=0;
 for(const [index,node] of nodes.entries()) {
  const id='conversion-'+(index+1),block=recognized(node,id);
  if(block){sections.push(block);converted++;continue;}
  const location=node.sourceCodeLocation!,html=original.slice(location.startOffset,location.endOffset);
  if(html.length>200000)return refuse('limit','An opaque source fragment exceeds200000characters. Nothing was truncated or changed.');
  sections.push({id,type:'custom_html',html});opaque++;
  notes.push({code:'opaque_preserved',message:'Source fragment '+(index+1)+' remains exact opaque safe HTML. Its contents are not represented as editable blocks.'});
 }
 const proposed={...source,editing_mode:'structured' as const,sections};delete proposed.raw_html;
 if(Buffer.byteLength(JSON.stringify(proposed),'utf8')>1048576)return refuse('limit','The proposed structured document exceeds1MiB. Nothing was truncated or changed.');
 const admitted=EmailSpecSchema.safeParse(proposed);
 if(!admitted.success)return refuse('unsupported_source','The proposed blocks do not satisfy the structured document contract. Keep the original in raw mode.');
 const compiled=await compileEmail(admitted.data);
 if(compiled.html.length>2000000)return refuse('limit','The proposed preview exceeds2000000characters. Nothing was truncated or changed.');
 return finish('available',admitted.data,compiled.html,converted,opaque,notes);
}
