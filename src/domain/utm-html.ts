import {parseFragment,type DefaultTreeAdapterTypes}from'parse5';
import {decorateMarketingHref,UTMLinkError,type UTMParameterData}from'./utm';
function nodes(html:string){return parseFragment(html,{sourceCodeLocationInfo:true,onParseError(error){if(['duplicate-attribute','eof-in-tag','unexpected-character-in-unquoted-attribute-value','missing-attribute-value','surrogate-in-input-stream','unexpected-null-character'].includes(error.code))throw new UTMLinkError('UTM_LINK_UNSUPPORTED','Ambiguous HTML attributes need correction before UTM can be applied.');}});}
function walk(node:DefaultTreeAdapterTypes.Node,visit:(node:DefaultTreeAdapterTypes.Element)=>void){if('tagName'in node)visit(node);if('childNodes'in node)for(const child of node.childNodes)walk(child,visit);if('content'in node)walk(node.content,visit);}
function escape(value:string){return value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
// Patch only an explicitly located anchor attribute. Do not serialize the DOM:
// existing tables, styles, comments, image sources and surrounding bytes stay exact.
export function decorateHtmlMarketingLinks(html:string,policy:UTMParameterData):string{
 const tree=nodes(html),patches=new Map<string,{start:number;end:number;text:string}>();
 function comments(node:DefaultTreeAdapterTypes.Node){if(node.nodeName==='#comment'&&'data'in node&&/<[^>]+\bhref\s*=/i.test(node.data))throw new UTMLinkError('UTM_LINK_UNSUPPORTED','Links hidden in conditional/comment markup need destination review before UTM can be applied.');if('childNodes'in node)for(const child of node.childNodes)comments(child);}
 comments(tree);
 walk(tree,node=>{
  if(node.tagName!=='a')return;const attr=node.attrs.find(a=>a.name==='href');if(!attr)return;
  const decorated=decorateMarketingHref(attr.value,policy);if(decorated===attr.value)return;
  const location=node.sourceCodeLocation?.attrs?.href;if(!location)throw new UTMLinkError('UTM_LINK_UNSUPPORTED','This anchor has no unambiguous source attribute location.');
  const source=html.slice(location.startOffset,location.endOffset),match=/^([^\s=]+\s*=\s*)(["']?)/.exec(source);if(!match)throw new UTMLinkError('UTM_LINK_UNSUPPORTED','This link attribute needs explicit source correction.');
  const quote=match[2]||'"',patch={start:location.startOffset,end:location.endOffset,text:match[1]+quote+escape(decorated)+quote},key=patch.start+':'+patch.end,previous=patches.get(key);
  if(previous&&previous.text!==patch.text)throw new UTMLinkError('UTM_LINK_UNSUPPORTED','Reconstructed anchors disagree about the same source attribute. Correct the HTML before applying UTM.');
  patches.set(key,patch);
 });
 const ordered=[...patches.values()].sort((a,b)=>a.start-b.start);let end=-1;
 for(const patch of ordered){if(patch.start<end||patch.start<0||patch.end<=patch.start||patch.end>html.length)throw new UTMLinkError('UTM_LINK_UNSUPPORTED','Overlapping source attributes need correction before UTM can be applied.');end=patch.end;}
 let result=html;for(const patch of ordered.reverse())result=result.slice(0,patch.start)+patch.text+result.slice(patch.end);
 if(patches.size)walk(nodes(result),node=>{if(node.tagName==='a'){const attr=node.attrs.find(a=>a.name==='href');if(attr&&decorateMarketingHref(attr.value,policy)!==attr.value)throw new UTMLinkError('UTM_LINK_UNSUPPORTED','The transformed target did not retain the explicit policy. Correct the source HTML.');}});
 return result;
}
export function htmlMarketingTargets(html:string):string[]{const targets:string[]=[];walk(nodes(html),node=>{if(node.tagName==='a'){const attr=node.attrs.find(a=>a.name==='href');if(attr)targets.push(attr.value);}});return targets;}
