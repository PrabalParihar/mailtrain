import {Resolver} from 'node:dns/promises';
import {canonicalDomain,summarizeTXT,type DNSObservationData} from '../domain/sender-domain';

/** This port performs read-only TXT discovery. Each factory call must own its resolver. */
export interface SenderDNSResolver {
 resolveTxt(owner:string):Promise<string[][]>;
 cancel():void;
}
export type SenderDNSResolverFactory=()=>SenderDNSResolver;

const DEADLINE_MS=5000;
const RESERVED_SUFFIXES=['test','example','invalid','onion','home.arpa','example.com','example.net','example.org'];
type Discovery=DNSObservationData['spf'];
type ErrorCategory=NonNullable<Discovery['error']>;
type QueryResult={kind:'records';records:string[][]}|{kind:'error';error:ErrorCategory};

function failed(owner:string,error:ErrorCategory):Discovery {
 return {owner,records:[],status:error==='not_found'?'missing':'unavailable',error};
}
function observation(domain:string,spf:Discovery,dmarc:Discovery):DNSObservationData {
 return {domain,observed_at:new Date().toISOString(),scope:'exact_domain_txt',spf,dmarc,provider_verified:false,authentication_verified:false,sending_enabled:false};
}
function unavailable(domain:string,error:ErrorCategory) {
 return observation(domain,failed(domain,error),failed('_dmarc.'+domain,error));
}
function errorCategory(error:unknown):ErrorCategory {
 const code=error!==null&&typeof error==='object'&&'code' in error?error.code:undefined;
 if(code==='ENOTFOUND'||code==='ENODATA')return 'not_found';
 return code==='ETIMEOUT'?'timeout':'resolver_unavailable';
}
async function query(resolver:SenderDNSResolver,owner:string):Promise<QueryResult> {
 try{return {kind:'records',records:await resolver.resolveTxt(owner)};}
 catch(error){return {kind:'error',error:errorCategory(error)};}
}

/** Count every TXT string, including unrelated records, before retaining any evidence. */
function responseBytes(records:string[][]) {
 if(!Array.isArray(records)||records.length>40)throw new Error('response_limit');
 let bytes=0;
 for(const chunks of records) {
  if(!Array.isArray(chunks)||chunks.length>4096)throw new Error('response_limit');
  let characters=0;
  for(const chunk of chunks) {
   if(typeof chunk!=='string'||(characters+=chunk.length)>4096)throw new Error('response_limit');
  }
  bytes+=new TextEncoder().encode(chunks.join('')).byteLength;
  if(bytes>32768)throw new Error('response_limit');
 }
 return bytes;
}
function discovery(owner:string,result:QueryResult,purpose:'spf'|'dmarc'):Discovery {
 return result.kind==='error'?failed(owner,result.error):{owner,...summarizeTXT(result.records,purpose)};
}

/** Exact-owner TXT discovery only; the result never authorizes authentication or sending. */
export async function observeSenderDNS(input:string,resolverFactory:SenderDNSResolverFactory=()=>new Resolver({timeout:DEADLINE_MS,tries:1})):Promise<DNSObservationData> {
 const domain=canonicalDomain(input);
 if(RESERVED_SUFFIXES.some(suffix=>domain===suffix||domain.endsWith('.'+suffix)))return unavailable(domain,'reserved_domain');
 let resolver:SenderDNSResolver;
 try{resolver=resolverFactory();}catch{return unavailable(domain,'resolver_unavailable');}

 // Race every query against the same owned deadline. cancel() need not settle its promises.
 let timer:ReturnType<typeof setTimeout>;
 const deadline=new Promise<QueryResult>(resolve=>{
  timer=setTimeout(()=>{
   try{resolver.cancel();}catch{/* Cancellation failure still releases the caller. */}
   resolve({kind:'error',error:'timeout'});
  },DEADLINE_MS);
 });
 try {
  const [spf,dmarc]=await Promise.all([
   Promise.race([query(resolver,domain),deadline]),
   Promise.race([query(resolver,'_dmarc.'+domain),deadline]),
  ]);
  try {
   const bytes=[spf,dmarc].reduce((sum,result)=>sum+(result.kind==='records'?responseBytes(result.records):0),0);
   if(bytes>32768)return unavailable(domain,'response_limit');
   return observation(domain,discovery(domain,spf,'spf'),discovery('_dmarc.'+domain,dmarc,'dmarc'));
  }catch{return unavailable(domain,'response_limit');}
 }finally{clearTimeout(timer!);}
}
