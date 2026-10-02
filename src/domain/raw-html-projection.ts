// Server-only pure projection. It parses text; it never fetches, evaluates or
// persists source. A manifest is already-authorized metadata, not asset bytes.
import {createHash} from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import {parse,type DefaultTreeAdapterTypes} from 'parse5';
import {AssetManifestSchema,privateAssetBinding,type AssetManifest,type AssetManifestEntry} from './assets';
import {validateRawSource} from './email-source-digest';
import {RawProjectionSchema,type RawProjection,type RawDiagnostic} from './email-source-contracts';
import {MAX_RAW_DIAGNOSTICS,MAX_RAW_PROJECTION_BYTES,MAX_RAW_PROJECTION_DEPTH,MAX_RAW_PROJECTION_NODES} from './email-source-values';

const tags=['html','head','body','title','meta','table','tbody','thead','tfoot','tr','td','th','p','div','span','h1','h2','h3','h4','br','hr','a','img','strong','em','b','i','u','ul','ol','li','blockquote','center'];
const allowed=new Set(tags),active=new Set(['script','iframe','frame','frameset','form','input','button','select','option','textarea','object','embed','applet','base','link','template','noscript','audio','video','source','track']);
const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const common=['style','dir','lang','align','valign','width','height','class','id','role'];
const attributes:Record<string,string[]>={'*':common,a:['href','title'],img:['src','alt','width','height'],table:['cellpadding','cellspacing','border','role'],meta:['name','content','charset']};
const styles:sanitizeHtml.IOptions['allowedStyles']={'*':{
  color:[/^#[\da-f]{3,8}$/i], 'background-color':[/^#[\da-f]{3,8}$/i],
  'font-size':[/^\d{1,4}(px|em|rem|%)$/], 'font-family':[/^[\w\s,'-]+$/],
  'font-weight':[/^(normal|bold|[1-9]00)$/], 'text-decoration':[/^(none|underline|line-through)$/],
  'text-align':[/^(left|right|center)$/], padding:[/^[\d\s]{1,24}px$/],margin:[/^[\d\s]{1,24}px$/],
  width:[/^\d{1,4}(px|%)$/],height:[/^\d{1,4}(px|%)$/], 'max-width':[/^\d{1,4}(px|%)$/],
  'line-height':[/^[\d.]{1,8}(px|%)?$/],border:[/^[\d.]{1,8}px solid #[\da-f]{3,8}$/i],
}};
const browserFence='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; font-src \'none\'; base-uri \'none\'; form-action \'none\'">';
function sha256(value:string){return createHash('sha256').update(value,'utf8').digest('hex');}
function safeHref(value:string){
  if(value==='{{UNSUBSCRIBE_URL}}')return true;
  if(value.length>2048||/[\x00-\x20\x7f]/.test(value))return false;
  try{const u=new URL(value);return !u.username&&!u.password&&['https:','mailto:','tel:'].includes(u.protocol)&&(u.protocol!=='https:'||/^https:\/\/[^/\\]/i.test(value));}catch{return false;}
}
function manifestBindings(manifest?:AssetManifest):Map<string,AssetManifestEntry>{
  const result=new Map<string,AssetManifestEntry>();if(!manifest)return result;
  const value=AssetManifestSchema.parse(manifest),identities=new Set<string>();
  for(const e of value.entries){
    const identity=e.asset_id+':'+e.variant_id;if(identities.has(identity))throw Error('RAW_ASSET_MANIFEST_INVALID');identities.add(identity);
    const marker=privateAssetBinding(e);result.set(marker,e);
    if(e.visibility==='public'&&e.public_url){if(!safeHref(e.public_url)||new URL(e.public_url).protocol!=='https:'||result.has(e.public_url))throw Error('RAW_ASSET_MANIFEST_INVALID');result.set(e.public_url,e);}
    if(e.role==='animation'){
      const fallback=value.entries.find(f=>f.asset_id===e.fallback?.asset_id&&f.variant_id===e.fallback?.variant_id);
      if(!fallback||fallback.role!=='fallback'||fallback.asset_id!==e.asset_id)throw Error('RAW_ASSET_MANIFEST_INVALID');
    }
  }
  return result;
}

export function projectRawHtml(source:string,context:{assets?:AssetManifest;workBudget?:{remainingNodes:number}}={}):RawProjection{
  const identity=validateRawSource(source),bindings=manifestBindings(context.assets),diagnostics:RawDiagnostic[]=[];
  let count=0,blocking=false,unavailable=false;
  function add(code:RawDiagnostic['code'],severity:RawDiagnostic['severity'],message:string,start=0,end=source.length){
    count++;if(severity==='blocking')blocking=true;
    if(diagnostics.length<MAX_RAW_DIAGNOSTICS-1)diagnostics.push({code,severity,message,start:Math.max(0,Math.min(source.length,start)),end:Math.max(0,Math.min(source.length,end))});
  }
  function limit(){if(!unavailable)add('RAW_PROJECTION_LIMIT','blocking','Source is preserved, but its projection exceeds a bounded work or output limit.');unavailable=true;}
  function finish(browser:string|null,email:string|null):RawProjection{
    const omitted=count-diagnostics.length;
    if(omitted>0)diagnostics.push({code:'DIAGNOSTICS_TRUNCATED',severity:blocking?'blocking':'info',start:0,end:0,message:'Additional source diagnostics were omitted from this bounded report; source was not truncated.'});
    return RawProjectionSchema.parse({source_hash:identity.sha256,source_bytes:identity.bytes,browser_profile:'raw-browser-1',browser_html:browser,browser_hash:browser===null?null:sha256(browser),email_profile:'raw-email-2',email_html:email,email_hash:email===null?null:sha256(email),delivery_status:unavailable?'unavailable':blocking?'blocked':'eligible_for_checks',diagnostics,omitted_diagnostics:omitted});
  }
  if(source.trim()==='')add('RAW_SOURCE_EMPTY','blocking','Empty source is preserved and can be saved or downloaded; delivery requires nonempty email content.');
  // Conservative lexical budget before allocating a parse tree. This gate is
  // not the sanitizer, and false positives leave the exact source recoverable.
  let tokens=0;
  const tokenPattern=/<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi;
  while(tokenPattern.exec(source)!==null){
    if(++tokens>MAX_RAW_PROJECTION_NODES){limit();return finish(null,null);}
  }
  const tree=parse(source,{sourceCodeLocationInfo:true,onParseError(error){
    if(error.code!=='missing-doctype')add('PARSER_REPAIR','blocking','The browser parser repaired ambiguous source; delivery fidelity requires correction.',error.startOffset,error.endOffset);
  }});
  const pending:Array<{node:DefaultTreeAdapterTypes.Node;depth:number}>=[{node:tree,depth:0}];let nodes=0;
  while(pending.length){
    const {node,depth}=pending.pop()!,location='sourceCodeLocation'in node?node.sourceCodeLocation:undefined;
    const authored=!!location,nextDepth=depth+(authored&&'tagName'in node?1:0);
    if(authored&&(++nodes>MAX_RAW_PROJECTION_NODES||context.workBudget!==undefined&&--context.workBudget.remainingNodes<0)||nextDepth>MAX_RAW_PROJECTION_DEPTH){limit();return finish(null,null);}
    const start=location?.startOffset??0,end=location?.endOffset??source.length;
    if(node.nodeName==='#comment'&&'data'in node){
      if(/\[if\b|\[endif\]/i.test(node.data))add('CONDITIONAL_FIDELITY_UNSUPPORTED','blocking','Conditional email markup remains in exact source; its delivery fidelity is unsupported.',start,end);
      else add('COMMENT_OMITTED','info','An ordinary comment is omitted from the projection and retained in exact source.',start,end);
      if(/<\/?v:|urn:schemas-microsoft-com:vml/i.test(node.data))add('VML_FIDELITY_UNSUPPORTED','blocking','VML remains in exact source; no qualified VML or Outlook delivery fidelity is claimed.',start,end);
    }
    if('tagName'in node&&authored){
      if(node.namespaceURI!=='http://www.w3.org/1999/xhtml'||node.tagName.includes(':')||node.attrs.some(a=>a.name==='xmlns'||a.name.startsWith('xmlns:'))){
        add(/^v:|urn:schemas-microsoft-com:vml/i.test(node.tagName+' '+node.attrs.map(a=>a.value).join(' '))?'VML_FIDELITY_UNSUPPORTED':'NAMESPACE_UNSUPPORTED','blocking','Namespace markup remains in exact source but has no supported delivery projection.',start,end);
      }
      if(active.has(node.tagName)||node.tagName==='meta'&&node.attrs.some(a=>a.name==='http-equiv'))add('ACTIVE_CONTENT_REMOVED','warning','Active or navigational content is removed from the projection and retained only as source text.',start,end);
      else if(node.tagName==='style')add('STYLE_ELEMENT_UNSUPPORTED','blocking','An embedded stylesheet remains in source; its layout fidelity is unsupported by this projection.',start,end);
      else if(!allowed.has(node.tagName))add('TAG_UNSUPPORTED','blocking','An unsupported element remains in source; its delivery fidelity is unavailable.',start,end);
      if(!voidTags.has(node.tagName)&&node.sourceCodeLocation?.startTag&&!node.sourceCodeLocation.endTag)add('PARSER_REPAIR','warning','An omitted closing tag is normalized only in the projection.',start,end);
      for(const attr of node.attrs){
        const attributeLocation=node.sourceCodeLocation?.attrs?.[attr.name],from=attributeLocation?.startOffset??start,to=attributeLocation?.endOffset??end;
        if(/^on/i.test(attr.name)||['srcdoc','ping','action','formaction'].includes(attr.name))add('ACTIVE_CONTENT_REMOVED','warning','An active or navigational attribute is removed from the projection.',from,to);
        else if(attr.name==='style'){
          if(/url\s*\(|@import|expression\s*\(|\\/i.test(attr.value))add('EXTERNAL_RESOURCE_BLOCKED','blocking','An external or executable CSS resource is unavailable; exact source is retained.',from,to);
          const normalized=sanitizeHtml('<p style="'+attr.value.replaceAll('&','&amp;').replaceAll('"','&quot;')+'"></p>',{allowedTags:['p'],allowedAttributes:{p:['style']},allowedStyles:styles});
          if(normalized!=='<p style="'+attr.value.replaceAll('&','&amp;').replaceAll('"','&quot;')+'"></p>')add('STYLE_REMOVED','warning','Unsupported style properties or syntax are removed or normalized in the projection.',from,to);
        }else if(attr.name==='href'&&node.tagName==='a'){
          if(!safeHref(attr.value))add('UNSAFE_LINK_REMOVED','blocking','An unsafe or unsupported destination is removed; source correction is required.',from,to);
          else add('BROWSER_LINKS_DISABLED','info','The browser simulation disables link destinations; email output retains validated links.',from,to);
        }else if(['src','srcset','background','poster','data'].includes(attr.name)){
          if(node.tagName==='img'&&attr.name==='src'&&bindings.has(attr.value)){
            if(bindings.get(attr.value)?.role==='animation')add('ANIMATION_BROWSER_FALLBACK','info','The browser uses the registered static fallback binding; email animation fidelity still needs client review.',from,to);
          }else add(attr.value.startsWith('https://mailcraft-assets.invalid/')?'IMAGE_REFERENCE_UNRESOLVED':'EXTERNAL_RESOURCE_BLOCKED','blocking','An image or resource has no exact authorized manifest binding and is unavailable.',from,to);
        }else if(![...common,...(attributes[node.tagName]??[])].includes(attr.name))add('ATTRIBUTE_REMOVED','warning','An unsupported attribute remains in source and is removed from the projection.',from,to);
      }
    }
    if('childNodes'in node)for(let i=node.childNodes.length-1;i>=0;i--)pending.push({node:node.childNodes[i],depth:nextDepth});
    if('content'in node)pending.push({node:node.content,depth:nextDepth});
  }
  const options:sanitizeHtml.IOptions={allowedTags:tags,allowedAttributes:attributes,allowedSchemes:['https','mailto','tel'],allowedSchemesByTag:{img:['https']},allowProtocolRelative:false,allowedStyles:styles,nonTextTags:['script','style','textarea','option','svg','math','template','noscript','iframe','object','embed'],transformTags:{
    a:(_tag,attrs)=>{const clean={...attrs};if(clean.href!==undefined&&!safeHref(clean.href))delete clean.href;delete clean.target;delete clean.ping;delete clean.download;return {tagName:'a',attribs:clean};},
    img:(_tag,attrs)=>{const clean={...attrs};if(!bindings.has(clean.src))delete clean.src;delete clean.srcset;delete clean['data-raw-asset-binding'];return {tagName:'img',attribs:clean};},
  }};
  const email=sanitizeHtml(source,options);
  if(email!==source)add('SOURCE_TRANSFORMED','warning','Sanitized output differs from exact source; the stored source is not overwritten.');
  const browser=browserFence+sanitizeHtml(email,{...options,allowedAttributes:{...attributes,a:['title','aria-disabled','tabindex','data-raw-inert-link'],img:['alt','width','height','data-raw-asset-binding']},exclusiveFilter:frame=>frame.tag==='meta',transformTags:{
    a:(_tag,attrs)=>{const clean={...attrs};delete clean.href;delete clean.target;delete clean.ping;delete clean.download;delete clean.tabindex;return {tagName:'a',attribs:{...clean,'aria-disabled':'true',tabindex:'-1','data-raw-inert-link':''}};},
    img:(_tag,attrs)=>{const clean={...attrs},entry=bindings.get(clean.src);delete clean.src;delete clean.srcset;delete clean['data-raw-asset-binding'];if(entry){const fallback=entry.role==='animation'?[...bindings.values()].find(e=>e.asset_id===entry.fallback?.asset_id&&e.variant_id===entry.fallback?.variant_id):entry;if(fallback)clean['data-raw-asset-binding']=privateAssetBinding(fallback);}return {tagName:'img',attribs:clean};},
  }});
  if(Buffer.byteLength(email,'utf8')>MAX_RAW_PROJECTION_BYTES||Buffer.byteLength(browser,'utf8')>MAX_RAW_PROJECTION_BYTES){limit();return finish(null,null);}
  return finish(browser,email);
}
