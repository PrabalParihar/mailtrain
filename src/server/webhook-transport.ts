import { Resolver } from 'node:dns/promises';
import { isIP, type TcpNetConnectOpts } from 'node:net';
import https from 'node:https';
import { z } from 'zod';
import { fail } from './errors';
import { publicAddress, validatePublicUrl } from './safe-fetch';
import { signWebhook, webhookOutcome, WEBHOOK_BODY_MAX } from './webhook-protocol';
export function webhookTarget(input:string):URL{
 try{
  z.string().min(1).max(2048).parse(input);const url=validatePublicUrl(input);
  if(url.protocol!=='https:'||(url.port&&url.port!=='443')||input.includes('#'))throw new Error('HTTPS443 required');
  return url;
 }catch{fail(422,'UNSAFE_WEBHOOK_TARGET','Use a public HTTPS443 webhook target without credentials or a fragment.');}
}
export function validateWebhookAnswers(answers:{address:string;family:number}[]){
 if(!answers.length||answers.length>16||answers.some((answer)=>isIP(answer.address)!==answer.family||!publicAddress(answer.address)))fail(422,'UNSAFE_WEBHOOK_TARGET','Every webhook DNS address must be public.');
 return answers[0];
}
const dnsRegistry=Symbol.for('lettercape.webhook-dns-capacity');
const registry=globalThis as unknown as Record<symbol,unknown>;
const dnsCapacity=(registry[dnsRegistry]??={active:0})as{active:number};
export async function resolveWebhookTarget(input:string,signal?:AbortSignal,deadline=Date.now()+10000){
 const url=webhookTarget(input),hostname=url.hostname.replace(/^\[|\]$/g,'');
 if(!Number.isSafeInteger(deadline)||deadline>Date.now()+10000)throw new Error('Invalid webhook DNS deadline');
 if(signal?.aborted)fail(499,'WEBHOOK_ABORTED','Webhook target verification was interrupted.');
 if(isIP(hostname))return{url,pinned:validateWebhookAnswers([{address:hostname,family:isIP(hostname)}]),dns_checked_at:new Date().toISOString()};
 if(dnsCapacity.active>=2)fail(429,'WEBHOOK_DNS_BUSY','Webhook DNS verification capacity is busy. Retry shortly.');
 dnsCapacity.active++;const resolver=new Resolver({timeout:5000,tries:1});let timer:ReturnType<typeof setTimeout>|undefined,abort:(()=>void)|undefined;
 try{
  const answers=await Promise.race([
   Promise.allSettled([resolver.resolve4(hostname),resolver.resolve6(hostname)]).then((results)=>results.flatMap((result,index)=>{
    if(result.status==='fulfilled')return result.value.map((address)=>({address,family:index===0?4:6}));
    if(result.reason?.code==='ENODATA')return[];
    throw new Error('Webhook DNS resolution unavailable');
   })),
   new Promise<never>((_,reject)=>{
    timer=setTimeout(()=>{reject(new Error('Webhook DNS deadline'));resolver.cancel();},Math.max(1,deadline-Date.now()));
    abort=()=>{reject(new Error('Webhook DNS interrupted'));resolver.cancel();};signal?.addEventListener('abort',abort,{once:true});
   }),
  ]);
  return{url,pinned:validateWebhookAnswers(answers),dns_checked_at:new Date().toISOString()};
 }catch(error){
  if(error instanceof Error&&'code'in error&&error.code==='UNSAFE_WEBHOOK_TARGET')throw error;
  if(signal?.aborted)fail(499,'WEBHOOK_ABORTED','Webhook target verification was interrupted.');
  fail(503,'WEBHOOK_DNS_UNAVAILABLE','The webhook target could not be verified within its deadline. Retry or check public DNS.');
 }finally{clearTimeout(timer);if(abort)signal?.removeEventListener('abort',abort);resolver.cancel();dnsCapacity.active--;}
}
const beyondBudget=86401000;
export function webhookRetryAfter(header:string|undefined,now:number):number|null{
 if(header===undefined)return null;
 if(/^\d+$/.test(header))return header.length>10?beyondBudget:Math.min(Number(header)*1000,beyondBudget);
 if(header.length>64||!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(header))return null;
 const time=Date.parse(header);return Number.isFinite(time)?Math.min(Math.max(0,time-now),beyondBudget):null;
}
export type WebhookAttemptDecision={state:'pending'|'acknowledged'|'disabled'|'terminal'|'dead_letter';next_at:number|null;failure_attempts:number;error_class:'rate_deferred'|'transient'|'retry_budget_exhausted'|'http_terminal'|null};
export function nextWebhookAttempt(input:{now:number;deadline:number;failure_attempts:number;status:number|null;retry_after?:string;jitter:number}):WebhookAttemptDecision{
 const {now,deadline,failure_attempts:before,status,jitter}=input;
 if(!Number.isSafeInteger(now)||!Number.isSafeInteger(deadline)||now<0||deadline<0||!Number.isSafeInteger(before)||before<0||before>10||!Number.isFinite(jitter)||jitter<0||jitter>1)throw new Error('Invalid webhook attempt budget');
 const outcome=webhookOutcome(status);
 if(outcome==='acknowledged')return{state:'acknowledged',next_at:null,failure_attempts:before,error_class:null};
 if(outcome==='disable_endpoint')return{state:'disabled',next_at:null,failure_attempts:before,error_class:null};
 if(outcome==='terminal')return{state:'terminal',next_at:null,failure_attempts:before,error_class:'http_terminal'};
 const rate=status===429,failures=before+(rate?0:1),base=Math.min(3600000,30000*2**Math.min(9,Math.max(0,failures-1))),delay=rate?(webhookRetryAfter(input.retry_after,now)??30000):Math.floor(base*(0.5+0.5*jitter));
 const next=now+Math.max(1000,delay);
 if(now>=deadline||next>=deadline||failures>=10)return{state:'dead_letter',next_at:null,failure_attempts:failures,error_class:'retry_budget_exhausted'};
 return{state:'pending',next_at:next,failure_attempts:failures,error_class:rate?'rate_deferred':'transient'};
}
export type WebhookHttpResult={status:number|null;retry_after?:string;error_class:'unsafe_target'|'transport'|'timeout'|'aborted'|'invalid_response'|'capacity'|null};
// No injectable DNS/egress bypass is exposed by this production transport.
export async function postWebhook(input:string,body:Uint8Array,secret:string,keyVersion:number,signal?:AbortSignal):Promise<WebhookHttpResult>{
 if(body.byteLength<1||body.byteLength>WEBHOOK_BODY_MAX||!Number.isSafeInteger(keyVersion)||keyVersion<1||keyVersion>2147483647)throw new Error('Invalid signed webhook input');
 const deadline=Date.now()+10000;
 let timer:ReturnType<typeof setTimeout>|undefined;
 if(signal?.aborted)return{status:null,error_class:'aborted'};
 let target:Awaited<ReturnType<typeof resolveWebhookTarget>>;
 try{
  target=await resolveWebhookTarget(input,signal,deadline);
 }catch(error){return{status:null,error_class:signal?.aborted?'aborted':error instanceof Error&&'code'in error?(error.code==='UNSAFE_WEBHOOK_TARGET'?'unsafe_target':error.code==='WEBHOOK_DNS_BUSY'?'capacity':Date.now()>=deadline?'timeout':'transport'):Date.now()>=deadline?'timeout':'transport'};}finally{clearTimeout(timer);}
 if(signal?.aborted)return{status:null,error_class:'aborted'};
 const {url,pinned}=target;
 const headers=signWebhook(body,secret);
 return new Promise((resolve)=>{
  let completed=false,errorClass:WebhookHttpResult['error_class']='transport';
  const finish=(result:WebhookHttpResult)=>{if(completed)return;completed=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve(result);};
  const hostname=url.hostname.replace(/^\[|\]$/g,'');
  const connection:Pick<TcpNetConnectOpts,'autoSelectFamily'>={autoSelectFamily:false};
  const req=https.request(url,{...connection,method:'POST',agent:false,rejectUnauthorized:true,servername:isIP(hostname)?undefined:hostname,maxHeaderSize:8192,headers:{...headers,'X-Lettercape-Key-Version':String(keyVersion),'User-Agent':'LettercapeWebhook/1.0','Content-Type':'application/json','Content-Length':String(body.byteLength),'Accept-Encoding':'identity'},lookup:(_host,_options,callback)=>callback(null,pinned.address,pinned.family)},(res)=>{
   // Check the actual connected peer as well as the pinned DNS answer.
   const peer=res.socket.remoteAddress?.replace(/^::ffff:/,'');const expected=pinned.address.replace(/^::ffff:/,'');
   if(!peer||peer!==expected||!publicAddress(peer)){errorClass='unsafe_target';finish({status:null,error_class:errorClass});res.destroy();req.destroy();return;}
   let size=0;
   res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>8192){errorClass='invalid_response';finish({status:null,error_class:errorClass});req.destroy();res.destroy();}});
   res.on('end',()=>finish({status:res.statusCode??null,retry_after:typeof res.headers['retry-after']==='string'?res.headers['retry-after']:undefined,error_class:null}));
   res.on('error',()=>finish({status:null,error_class:errorClass}));
   res.on('aborted',()=>finish({status:null,error_class:errorClass}));
  });
  req.on('socket',(socket)=>socket.prependOnceListener('secureConnect',()=>{
   const peer=socket.remoteAddress?.replace(/^::ffff:/,'');
   if(!peer||peer!==pinned.address.replace(/^::ffff:/,'')||!publicAddress(peer)){errorClass='unsafe_target';req.destroy();finish({status:null,error_class:errorClass});}
  }));
  const abort=()=>{errorClass='aborted';req.destroy();finish({status:null,error_class:errorClass});};
  signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>{errorClass='timeout';req.destroy();finish({status:null,error_class:errorClass});},Math.max(1,deadline-Date.now()));
  req.on('error',()=>finish({status:null,error_class:errorClass}));
  req.end(Buffer.from(body));
 });
}
