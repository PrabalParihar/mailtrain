import {createHash} from 'node:crypto';
import {parse,parseFragment,type DefaultTreeAdapterTypes} from 'parse5';
import {validateFrozenExportSource,type FrozenExportRevision} from './frozen-export-source';
import {
 HUBSPOT_COMPARISON_VERSION,HUBSPOT_MAPPING_VERSION,HUBSPOT_SOURCE_LIMIT,HUBSPOT_FOOTER_FIELDS,
 HubSpotFooterSettings,HubSpotReview,checkHubSpotFooterComparison,type HubSpotFooterSettingsData,
} from './hubspot-footer-contracts';

export type HubSpotArtifact=HubSpotReview & {html:string;text:string};
type Node=DefaultTreeAdapterTypes.Node;
type Element=DefaultTreeAdapterTypes.Element;
type Footer={identity:string;address:string};
type Replacement={start:number;end:number;raw:string;value:string};
const canonicalSlot='{{UNSUBSCRIBE_URL}}';
const unsupportedDelimiters=/\{\{|\}\}|\{%|%\}|\{#|#\}|\*\||\|\*|\[\[|\]\]|\[%|%\]/;
const blockers:HubSpotReview['blockers']=[
 'CONNECTION_AUTH_MODE_UNAPPROVED','HUBSPOT_ACCOUNT_SETTINGS_UNVERIFIED','ACCOUNT_ENTITLEMENT_UNVERIFIED',
 'REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','MANAGEMENT_LINK_UNVERIFIED',
];
const transformations=[
 'Verified visible footer company and address text mapped to native site_settings variables with HTML escaping.',
 'Verified canonical unsubscribe hrefs mapped to unsubscribe_link with URL escaping and HubSpot unsubscribe attributes.',
 'Verified footer plaintext mapped to bare native expressions as a local companion; native plaintext handoff remains unverified.',
];
function integrity():never{throw new Error('EXPORT_SOURCE_INTEGRITY');}
const sha256=(value:string)=>createHash('sha256').update(value,'utf8').digest('hex');
function isElement(node:Node|undefined,tag:string):node is Element{
 return !!node&&'tagName' in node&&node.tagName===tag&&node.namespaceURI==='http://www.w3.org/1999/xhtml';
}
function nativeFooter(settings:HubSpotFooterSettingsData,html:boolean):Footer{
 const variable=(name:string)=>`{{ ${name}${html?'|escape_html':''} }}`;
 const company=(field:typeof HUBSPOT_FOOTER_FIELDS[number])=>variable('site_settings.'+field);
 const state=company('company_state')+(settings.company_zip?' '+company('company_zip'):'');
 return {
  identity:company('company_name'),
  address:[company('company_street_address_1'),settings.company_street_address_2?company('company_street_address_2'):'',company('company_city'),state,settings.company_country?company('company_country'):''].filter(Boolean).join(', '),
 };
}
// Locations use UTF-16 offsets into the original source, never a DOM serialization.
function textReplacement(source:string,node:Node|undefined,expected:string,value:string):Replacement{
 if(!node||node.nodeName!=='#text'||!('value' in node)||node.value!==expected)integrity();
 const location=node.sourceCodeLocation;if(!location)integrity();
 const raw=source.slice(location.startOffset,location.endOffset);
 const decoded=parseFragment(raw).childNodes;
 if(decoded.length!==1||decoded[0].nodeName!=='#text'||!('value' in decoded[0])||decoded[0].value!==expected)integrity();
 return {start:location.startOffset,end:location.endOffset,raw,value};
}
function applyReplacements(source:string,replacements:Replacement[]):string{
 const ordered=[...replacements].sort((a,b)=>a.start-b.start);
 let previousEnd=0;
 for(const span of ordered){
  if(!Number.isInteger(span.start)||!Number.isInteger(span.end)||span.start<previousEnd||span.end<=span.start||span.end>source.length||source.slice(span.start,span.end)!==span.raw)integrity();
  previousEnd=span.end;
 }
 // Collect from the end and join once, avoiding repeated whole-source copies.
 const pieces:string[]=[];let end=source.length;
 for(let index=ordered.length-1;index>=0;index--){const span=ordered[index];pieces.push(source.slice(span.end,end),span.value);end=span.start;}
 pieces.push(source.slice(0,end));return pieces.reverse().join('');
}
function mapHtml(source:string,footers:Footer[],mapped:Footer):string{
 const document=parse(source,{sourceCodeLocationInfo:true}),anchors:Element[]=[];
 const pending:Node[]=[document];
 while(pending.length){
  const node=pending.pop()!;
  if(isElement(node,'a')&&node.attrs.some(attr=>attr.name==='href'&&attr.value===canonicalSlot))anchors.push(node);
  if('childNodes' in node)for(let index=node.childNodes.length-1;index>=0;index--)pending.push(node.childNodes[index]);
 }
 if(anchors.length!==footers.length)integrity();
 const replacements:Replacement[]=[];
 anchors.forEach((anchor,index)=>{
  const parent=anchor.parentNode,footer=footers[index];
  if(!parent||!isElement(parent,'div')||parent.childNodes.length!==2||parent.childNodes[1]!==anchor)integrity();
  const paragraph=parent.childNodes[0];
  if(!isElement(paragraph,'p')||paragraph.childNodes.length!==3||!isElement(paragraph.childNodes[1],'br')||paragraph.childNodes[1].childNodes.length!==0)integrity();
  if(anchor.childNodes.length!==1||anchor.childNodes[0].nodeName!=='#text'||!('value' in anchor.childNodes[0])||anchor.childNodes[0].value!=='Unsubscribe / manage preferences')integrity();
  if(anchor.attrs.some(attr=>attr.name==='class'||attr.name==='data-unsubscribe'))integrity();
  replacements.push(textReplacement(source,paragraph.childNodes[0],footer.identity,mapped.identity),textReplacement(source,paragraph.childNodes[2],footer.address,mapped.address));
  const href=anchor.sourceCodeLocation?.attrs?.href;if(!href)integrity();
  const raw='href="'+canonicalSlot+'"';
  replacements.push({start:href.startOffset,end:href.endOffset,raw,value:'href="{{ unsubscribe_link|escape_url }}" class="hubspot-mergetag" data-unsubscribe="true"'});
 });
 return applyReplacements(source,replacements);
}
function mapText(source:string,footers:Footer[],mapped:Footer):string{
 const replacements:Replacement[]=[];let cursor=0;
 for(const footer of footers){
  const slotStart=source.indexOf(canonicalSlot,cursor);if(slotStart<0)integrity();
  const prefix=footer.identity+'\n'+footer.address+'\nUnsubscribe: ';
  const start=slotStart-prefix.length,end=slotStart+canonicalSlot.length;
  if(start<cursor||source.slice(start,slotStart)!==prefix)integrity();
  replacements.push({start,end,raw:prefix+canonicalSlot,value:mapped.identity+'\n'+mapped.address+'\nUnsubscribe: {{ unsubscribe_link }}'});
  cursor=end;
 }
 if(source.indexOf(canonicalSlot,cursor)!==-1)integrity();
 return applyReplacements(source,replacements);
}
export function hubspotReview(artifact:HubSpotArtifact):HubSpotReview{
 const {html,text,...metadata}=artifact;void html;void text;
 return HubSpotReview.parse(metadata);
}
export async function compileHubSpotArtifact(r:FrozenExportRevision,settings:unknown):Promise<HubSpotArtifact>{
 const {footerCount}=await validateFrozenExportSource(r);
 const footers=r.spec.sections.flatMap(block=>block.type==='columns'?block.columns.flat():[block]).flatMap(block=>block.type==='legal_footer'?[{identity:block.identity,address:block.address}]:[]);
 const parsed=HubSpotFooterSettings.safeParse(settings);if(!parsed.success)throw new Error('HUBSPOT_SETTINGS_INVALID');
 const declared=parsed.data;
 checkHubSpotFooterComparison(footers,declared);
 for(const source of [r.html,r.plaintext]){
  if(unsupportedDelimiters.test(source.replaceAll(canonicalSlot,''))||source.split(canonicalSlot).length-1!==footerCount)throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 }
 const html=mapHtml(r.html,footers,nativeFooter(declared,true)),text=mapText(r.plaintext,footers,nativeFooter(declared,false));
 // Conservative local artifact budgets, not a claim about provider limits.
 if(Buffer.byteLength(html,'utf8')>HUBSPOT_SOURCE_LIMIT||Buffer.byteLength(text,'utf8')>HUBSPOT_SOURCE_LIMIT)throw new Error('EXPORT_SOURCE_LIMIT');
 const settings_digest=sha256(JSON.stringify([HUBSPOT_COMPARISON_VERSION,...HUBSPOT_FOOTER_FIELDS.map(field=>declared[field])]));
 const review=HubSpotReview.parse({
  destination:'hubspot',mapping_version:HUBSPOT_MAPPING_VERSION,comparison_version:HUBSPOT_COMPARISON_VERSION,
  revision_id:r.id,source_artifact_hash:r.artifact_hash,settings_digest,
  destination_hash:sha256(JSON.stringify([HUBSPOT_MAPPING_VERSION,HUBSPOT_COMPARISON_VERSION,r.artifact_hash,settings_digest,html,text])),
  html_sha256:sha256(html),text_sha256:sha256(text),settings_origin:'locally_declared',
  remote_export_enabled:false,account_settings_verified:false,native_conformance_verified:false,management_link_verified:false,
  transformations:[...transformations],blockers:[...blockers],
 });
 return {...review,html,text};
}
