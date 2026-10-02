import {parseFragment,type DefaultTreeAdapterTypes}from'parse5';
import {decorateMarketingHref,UTMLinkError,type UTMParameterData}from'./utm';
function nodes(html:string){return parseFragment(html,{sourceCodeLocationInfo:true,onParseError(error){if(['duplicate-attribute','eof-in-tag','unexpected-character-in-unquoted-attribute-value','missing-attribute-value','surrogate-in-input-stream','unexpected-null-character'].includes(error.code))throw new UTMLinkError('UTM_LINK_UNSUPPORTED','Ambiguous HTML attributes need correction before UTM can be applied.');}});}
function walk(node:DefaultTreeAdapterTypes.Node,visit:(node:DefaultTreeAdapterTypes.Element)=>void){if('tagName'in node)visit(node);if('childNodes'in node)for(const child of node.childNodes)walk(child,visit);if('content'in node)walk(node.content,visit);}
function escape(value:string){return value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
// Patch only an explicitly located anchor attribute. Do not serialize the DOM:
// existing tables, styles, comments, image sources and surrounding bytes stay exact.
export function decorateHtmlMarketingLinks(html:string,policy:UTMParameterData):string{
 const tree=nodes(html),patches:{start:number;end:number;text:string}[]=[];
 function comments(node:DefaultTreeAdapterTypes.Node){if(node.nodeName==='#comment'&&'data'in node&&/<[^>]+\bhref\s*=/i.test(node.data))throw new UTMLinkError('UTM_LINK_UNSUPPORTED','Links hidden in conditional/comment markup need destination review before UTM can be applied.');if('childNodes'in node)for(const child of node.childNodes)comments(child);}
 comments(tree);
 walk(tree,node=>{
  if(node.tagName!=='a')return;const attr=node.attrs.find(a=>a.name==='href');if(!attr)return;
  const decorated=decorateMarketingHref(attr.value,policy);if(decorated===attr.value)return;
  const location=node.sourceCodeLocation?.attrs?.href;if(!location)throw new UTMLinkError('UTM_LINK_UNSUPPORTED','This anchor has no unambiguous source attribute location.');
  const source=html.slice(location.startOffset,location.endOffset),match=/^([^\s=]+\s*=\s*)(["']?)/.exec(source);if(!match)throw new UTMLinkError('UTM_LINK_UNSUPPORTED','This link attribute needs explicit source correction.');
  const quote=match[2]||'"';patches.push({start:location.startOffset,end:location.endOffset,text:match[1]+quote+escape(decorated)+quote});
 });
 let result=html;for(const patch of patches.sort((a,b)=>b.start-a.start))result=result.slice(0,patch.start)+patch.text+result.slice(patch.end);return result;
}
export function htmlMarketingTargets(html:string):string[]{const targets:string[]=[];walk(nodes(html),node=>{if(node.tagName==='a'){const attr=node.attrs.find(a=>a.name==='href');if(attr)targets.push(attr.value);}});return targets;}
