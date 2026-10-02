import {z} from 'zod';

export const SENDER_PROVIDERS=['ses','resend','sendgrid','mailgun'] as const;
const boundedText=(max:number)=>z.string().max(max).refine(value=>!/[\u0000-\u001f\u007f]/.test(value),'Use text without control characters.');
export const SenderDraftInput=z.object({
 name:boundedText(100).pipe(z.string().trim().min(1)),provider:z.enum(SENDER_PROVIDERS),
 account_label:boundedText(100).pipe(z.string().trim().min(1)),region:boundedText(40).pipe(z.string().trim().min(1)),
 from_name:boundedText(100).pipe(z.string().trim().min(1)),from_address:boundedText(254).pipe(z.string().trim().min(1)),
 reply_to:boundedText(254).nullable(),
}).strict();
export const SenderVersionInput=SenderDraftInput.extend({expected_version:z.number().int().positive()});
export const SenderCheckInput=z.object({expected_version:z.number().int().positive()}).strict();

/** A mailbox's domain is canonicalized without treating URLs or IPs as DNS names. */
export function canonicalDomain(input:string) {
 if(!/^[\p{L}\p{M}\p{N}.-]+$/u.test(input)||input.length>253)throw new Error('Use a domain name without a URL, IP address or path.');
 const domain=new URL('http://'+input).hostname;
 const labels=domain.split('.');
 if(domain.length>253||labels.length<2||/^\d+(?:\.\d+)*$/.test(domain)||labels.some(label=>label.length>63||!/^([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])$/.test(label))||['local','internal','localhost','home','lan'].includes(labels.at(-1)!))throw new Error('Use a valid public domain name.');
 return domain;
}
function canonicalAddress(address:string) {
 if(/[\u0000-\u001f\u007f]/.test(address))throw new Error('Use one email address without control characters.');
 const parts=address.trim().split('@');if(parts.length!==2)throw new Error('Use one email address.');
 const value=parts[0]+'@'+canonicalDomain(parts[1]);return z.email().max(254).parse(value);
}
export function normalizeSender(input:unknown) {
 const parsed=SenderDraftInput.parse(input),from_address=canonicalAddress(parsed.from_address);
 return {...parsed,from_address,reply_to:parsed.reply_to?.trim()?canonicalAddress(parsed.reply_to):null,domain:from_address.split('@')[1]};
}
const canonicalSender=SenderDraftInput.extend({domain:z.string().max(253),reply_to:z.email().max(254).nullable()});
export const SenderVersionView=z.object({sender_id:z.uuid(),version:z.number().int().positive(),snapshot:canonicalSender.strict(),created_by:z.string(),created_at:z.iso.datetime()}).strict();
export type SenderVersionData=z.infer<typeof SenderVersionView>;
export const SenderView=canonicalSender.extend({id:z.string().uuid(),version:z.number().int().positive(),created_at:z.iso.datetime(),updated_at:z.iso.datetime(),connection_status:z.literal('not_connected'),sending_enabled:z.literal(false)}).strict();
export type SenderData=z.infer<typeof SenderView>;
export const TXTStatus=z.enum(['missing','single_record','multiple_records','unavailable']);
export const TXTDiscovery=z.object({owner:z.string().min(1).max(260),records:z.array(z.string().max(4096)).max(40),status:TXTStatus,error:z.enum(['not_found','timeout','reserved_domain','response_limit','resolver_unavailable']).optional()}).strict();
export const DNSObservation=z.object({domain:z.string().max(253),observed_at:z.iso.datetime(),scope:z.literal('exact_domain_txt'),spf:TXTDiscovery,dmarc:TXTDiscovery,provider_verified:z.literal(false),authentication_verified:z.literal(false),sending_enabled:z.literal(false)}).strict();
export type DNSObservationData=z.infer<typeof DNSObservation>;
export const DNSCheckView=z.object({id:z.string().uuid(),sender_id:z.string().uuid(),sender_version:z.number().int().positive(),created_at:z.iso.datetime(),observation:DNSObservation,created_by:z.string()}).strict();

/** Discovery counts matching records only; this is not protocol/auth evaluation. */
export function summarizeTXT(input:string[][],purpose:'spf'|'dmarc') {
 if(!Array.isArray(input)||input.length>40)throw new Error('DNS response exceeds record bounds.');
 const joined=input.map(parts=>{if(!Array.isArray(parts)||parts.length>4096||parts.some(p=>typeof p!=='string'))throw new Error('Invalid DNS record.');const text=parts.join('');if(text.length>4096)throw new Error('DNS record exceeds text bounds.');return text;});
 if(joined.reduce((sum,text)=>sum+BufferByteLength(text),0)>32768)throw new Error('DNS response exceeds byte bounds.');
 const pattern=purpose==='spf'?/^v=spf1(?:\s|$)/i:/^v=DMARC1(?:;|\s|$)/i;
 const records=joined.filter(text=>pattern.test(text));return {records,status:records.length>1?'multiple_records' as const:records.length?'single_record' as const:'missing' as const};
}
// TextEncoder is available in both the server runtime and browser contract consumers.
function BufferByteLength(text:string){return new TextEncoder().encode(text).byteLength;}
