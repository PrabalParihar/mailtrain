import {z} from 'zod';
export const UTM_POLICY_VERSION='utm-explicit-1';
const control=/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u;
function wellFormed(text:string){return Array.from(text).every(character=>{const point=character.codePointAt(0)!;return point<0xd800||point>0xdfff;});}
const value=z.string().min(1).max(128).refine(text=>text.length<=128&&text.trim().length>0&&!control.test(text)&&wellFormed(text)&&new TextEncoder().encode(text).byteLength<=256,'Use nonblank well-formed Unicode UTM text without control characters, at most128characters and256UTF8bytes.');
export const UTMParameters=z.object({utm_source:value,utm_medium:value,utm_campaign:value}).strict();
export type UTMParameterData=z.infer<typeof UTMParameters>;
export class UTMLinkError extends Error{
 constructor(readonly code:'UTM_LINK_CONFLICT'|'UTM_LINK_UNSUPPORTED'|'UTM_LINK_TOO_LONG',message:string){super(message);}
}
const managed=['utm_source','utm_medium','utm_campaign'] as const;
// Only explicitly selected marketing targets enter this function. It never
// walks image sources, invents recipient values, or calls an external service.
export function decorateMarketingHref(href:string,provided:UTMParameterData):string{
 const policy=UTMParameters.parse(provided);
 if(href==='{{UNSUBSCRIBE_URL}}')return href;
 if(href!==href.trim()||control.test(href)||!wellFormed(href)||href.includes('{{')||href.includes('}}'))throw new UTMLinkError('UTM_LINK_UNSUPPORTED','Use a well-formed literal marketing link without unresolved merge slots or control characters.');
 let url:URL;try{url=new URL(href);}catch{throw new UTMLinkError('UTM_LINK_UNSUPPORTED','UTM requires a valid literal HTTPS marketing link.');}
 if(url.protocol==='mailto:'||url.protocol==='tel:')return href;
 if(url.protocol!=='https:'||url.username||url.password)throw new UTMLinkError('UTM_LINK_UNSUPPORTED','UTM requires HTTPS without embedded credentials.');
 for(const key of url.searchParams.keys()){
  const lower=key.toLowerCase();
  if(['x-amz-signature','x-goog-signature','key-pair-id'].includes(lower))throw new UTMLinkError('UTM_LINK_UNSUPPORTED','This signed target needs destination validation before UTM can be applied.');
  if(managed.some(name=>name===lower)&&key!==lower)throw new UTMLinkError('UTM_LINK_CONFLICT','A differently cased UTM key makes this target ambiguous. Correct the source link explicitly.');
 }
 const additions:string[]=[];
 for(const key of managed){
  const existing=url.searchParams.getAll(key);
  if(existing.length>1||existing.length===1&&existing[0]!==policy[key])throw new UTMLinkError('UTM_LINK_CONFLICT','Existing UTM values conflict with this policy. Correct the source link explicitly.');
  if(!existing.length)additions.push(key+'='+encodeURIComponent(policy[key]));
 }
 // Do not serialize URL/searchParams: doing so would rewrite original percent
 // escapes, empty query values and space encoding in otherwise unrelated data.
 const fragmentAt=href.indexOf('#'),base=fragmentAt<0?href:href.slice(0,fragmentAt),fragment=fragmentAt<0?'':href.slice(fragmentAt);
 const separator=base.includes('?')?(base.endsWith('?')||base.endsWith('&')?'':'&'):'?';
 const result=additions.length?base+separator+additions.join('&')+fragment:href;
 if(new TextEncoder().encode(result).byteLength>2048)throw new UTMLinkError('UTM_LINK_TOO_LONG','The decorated link exceeds2048UTF8bytes. Shorten the source link or UTM values.');
 return result;
}
