// Pure server projection: canonical custom HTML is never replaced by these maps.
import {createHash} from 'node:crypto';
import type {AssetManifest} from './assets';
import type {Block} from './email-schema';
import {projectRawHtml} from './raw-html-projection';
import type {RawDiagnostic,RawProjection} from './email-source-contracts';
import {decorateHtmlMarketingLinks} from './utm-html';
import {UTMLinkError,type UTMParameterData} from './utm';

type Fragment=Extract<Block,{type:'custom_html'}>;
type Diagnostic=RawDiagnostic&{node_id?:string};
export function projectHtmlFragments(fragments:Fragment[],context:{assets?:AssetManifest;tracking?:UTMParameterData}){
 const email=new Map<string,string>(),browser=new Map<string,string>();
 const manifest:{profile:string;browser_profile:string;email_profile:string;browser_hash:string|null;email_hash:string|null;delivery_status:RawProjection['delivery_status'];diagnostics:Diagnostic[];omitted_diagnostics:number;sources:{node_id:string;source_sha256:string;source_bytes:number}[]}={profile:'custom-html-source-1',browser_profile:'raw-browser-1',email_profile:'raw-email-2',browser_hash:null,email_hash:null,delivery_status:'eligible_for_checks',diagnostics:[],omitted_diagnostics:0,sources:[]};
 let tokens=0,bytes=0;const workBudget={remainingNodes:20000};
 function add(d:Diagnostic){if(manifest.diagnostics.length<99)manifest.diagnostics.push(d);else manifest.omitted_diagnostics++;}
 function limit(){manifest.delivery_status='unavailable';add({code:'RAW_PROJECTION_LIMIT',severity:'blocking',start:0,end:0,message:'The aggregate fragment projection exceeds a bounded work or output limit. Exact source remains stored.'});}
 // Account for all fragments before creating any tree. False positives preserve
 // source and make the projection explicitly unavailable rather than truncating it.
 for(const fragment of fragments){
  manifest.sources.push({node_id:fragment.id,source_sha256:createHash('sha256').update(fragment.html).digest('hex'),source_bytes:Buffer.byteLength(fragment.html)});
  const pattern=/<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi;while(pattern.exec(fragment.html)!==null)if(++tokens>20000)break;
 }
 if(tokens>20000)limit();
 else for(const fragment of fragments){
  const p=projectRawHtml(fragment.html,{assets:context.assets,workBudget});
  for(const diagnostic of p.diagnostics)add({...diagnostic,node_id:fragment.id});manifest.omitted_diagnostics+=p.omitted_diagnostics;
  if(p.delivery_status==='unavailable')manifest.delivery_status='unavailable';
  else if(p.delivery_status==='blocked'&&manifest.delivery_status!=='unavailable')manifest.delivery_status='blocked';
  let emitted=p.email_html??'';
  if(context.tracking&&p.delivery_status==='eligible_for_checks')try{emitted=decorateHtmlMarketingLinks(emitted,context.tracking);}catch(error){
   if(!(error instanceof UTMLinkError))throw error;
   if(manifest.delivery_status!=='unavailable')manifest.delivery_status='blocked';
   add({code:'UNSAFE_LINK_REMOVED',severity:'blocking',start:0,end:fragment.html.length,node_id:fragment.id,message:'Tracking cannot be applied to this fragment: '+error.message});
  }
  bytes+=Buffer.byteLength(emitted)+Buffer.byteLength(p.browser_html??'');
  if(bytes>4194304){limit();break;}
  email.set(fragment.id,emitted);browser.set(fragment.id,p.browser_html??'');
 }
 if(manifest.delivery_status==='unavailable'){email.clear();browser.clear();for(const fragment of fragments){email.set(fragment.id,'');browser.set(fragment.id,'');}}
 if(manifest.omitted_diagnostics)manifest.diagnostics.push({code:'DIAGNOSTICS_TRUNCATED',severity:manifest.delivery_status==='eligible_for_checks'?'info':'blocking',start:0,end:0,message:'Additional fragment diagnostics were omitted; exact source was not truncated.'});
 return {email,browser,manifest};
}
