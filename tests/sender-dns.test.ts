import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DNSObservation} from '../src/domain/sender-domain';
import {observeSenderDNS,type SenderDNSResolver} from '../src/server/sender-dns';

const domain='mail.public-domain.com';
function port(answer:(owner:string)=>Promise<string[][]>) {
 const owners:string[]=[];let cancellations=0;
 const resolver:SenderDNSResolver={resolveTxt(owner){owners.push(owner);return answer(owner);},cancel(){cancellations++;}};
 return {resolver,owners,get cancellations(){return cancellations;}};
}
function deferred<T>() {
 let resolve!:(value:T)=>void,reject!:(reason:unknown)=>void;
 const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};
}

test('observes only the canonical from owner and exact DMARC owner, joining chunks within each RR',async()=>{
 const source=port(async owner=>owner.startsWith('_dmarc.')?[['v=DMARC1; ', 'p=none']]:[['v=spf1 include:', 'spf.public-domain.com -all'],['unrelated=public']]);
 const observation=await observeSenderDNS('MAIL.PUBLIC-DOMAIN.COM',()=>source.resolver);
 assert.deepEqual(source.owners,[domain,'_dmarc.'+domain]);
 assert.equal(observation.domain,domain);
 assert.deepEqual(observation.spf,{owner:domain,records:['v=spf1 include:spf.public-domain.com -all'],status:'single_record'});
 assert.deepEqual(observation.dmarc,{owner:'_dmarc.'+domain,records:['v=DMARC1; p=none'],status:'single_record'});
 assert.equal(observation.scope,'exact_domain_txt');
 assert.equal(observation.provider_verified,false);assert.equal(observation.authentication_verified,false);assert.equal(observation.sending_enabled,false);
 assert.equal(DNSObservation.safeParse(observation).success,true);assert.equal(source.cancellations,0);
});

test('retains multiple matching records without evaluating SPF or DMARC policy',async()=>{
 const source=port(async owner=>owner.startsWith('_dmarc.')?[['v=DMARC1; p=none'],['v=DMARC1; p=reject']]:[['v=spf1 broken include:'],['V=SPF1 ~all']]);
 const observation=await observeSenderDNS(domain,()=>source.resolver);
 assert.deepEqual(observation.spf.records,['v=spf1 broken include:','V=SPF1 ~all']);assert.equal(observation.spf.status,'multiple_records');
 assert.deepEqual(observation.dmarc.records,['v=DMARC1; p=none','v=DMARC1; p=reject']);assert.equal(observation.dmarc.status,'multiple_records');
});

test('NXDOMAIN and no matching TXT distinguish missing records from resolver failure',async()=>{
 for(const code of ['ENOTFOUND','ENODATA']) {
  const source=port(async owner=>{if(owner===domain)throw Object.assign(new Error('private resolver details'),{code});return [['other=value']];});
  const observation=await observeSenderDNS(domain,()=>source.resolver);
  assert.deepEqual(observation.spf,{owner:domain,records:[],status:'missing',error:'not_found'});
  assert.deepEqual(observation.dmarc,{owner:'_dmarc.'+domain,records:[],status:'missing'});
  assert.equal(JSON.stringify(observation).includes('private resolver details'),false);
 }
});

test('resolver creation, synchronous errors and transport errors expose fixed safe categories',async()=>{
 const creation=await observeSenderDNS(domain,()=>{throw new Error('private credential-like detail');});
 assert.equal(creation.spf.error,'resolver_unavailable');assert.equal(creation.dmarc.error,'resolver_unavailable');
 for(const code of ['ETIMEOUT','ECANCELLED','ESERVFAIL',undefined]) {
  const source=port(()=>{throw Object.assign(new Error('private resolver detail'),{code});});
  const observation=await observeSenderDNS(domain,()=>source.resolver);
  assert.equal(observation.spf.error,code==='ETIMEOUT'?'timeout':'resolver_unavailable');
  assert.equal(observation.spf.status,'unavailable');assert.equal(observation.dmarc.status,'unavailable');
  assert.equal(JSON.stringify(observation).includes('private'),false);
 }
});

test('admitted reserved suffixes return unavailable without constructing a resolver',async()=>{
 for(const reserved of ['a.test','a.example','a.invalid','a.home.arpa','a.onion','example.com','sub.example.net','example.org']) {
  const observation=await observeSenderDNS(reserved,()=>{assert.fail('Reserved names must not query DNS');});
  assert.equal(observation.domain,reserved);assert.equal(observation.spf.error,'reserved_domain');assert.equal(observation.dmarc.error,'reserved_domain');
  assert.equal(observation.spf.status,'unavailable');assert.equal(DNSObservation.safeParse(observation).success,true);
 }
});

test('URL, IP, private, single-label and control-shaped names fail validation without a resolver',async()=>{
 for(const invalid of ['https://public-domain.com','127.0.0.1','0x7f000001','[::1]','localhost','a.localhost','a.local','a.internal','a.home','a.lan','a..local','a.local/path','a\n.local','a\u0000.test']) {
  await assert.rejects(observeSenderDNS(invalid,()=>{assert.fail('Invalid inputs must not query DNS');}));
 }
});

test('IDNA is canonicalized before exact owner lookup',async()=>{
 const source=port(async()=>[]);const observation=await observeSenderDNS('MAIL.BÜCHER.COM',()=>source.resolver);
 assert.equal(observation.domain,'mail.xn--bcher-kva.com');
 assert.deepEqual(source.owners,['mail.xn--bcher-kva.com','_dmarc.mail.xn--bcher-kva.com']);
});

test('record count and per-RR joined character limits refuse the entire observation',async()=>{
 for(const records of [Array.from({length:41},()=>['x']),[['x'.repeat(2048),'x'.repeat(2049)]]]) {
  const source=port(async owner=>owner===domain?records:[['v=DMARC1; p=none']]);
  const observation=await observeSenderDNS(domain,()=>source.resolver);
  assert.equal(observation.spf.error,'response_limit');assert.equal(observation.dmarc.error,'response_limit');
  assert.deepEqual(observation.spf.records,[]);assert.deepEqual(observation.dmarc.records,[]);
 }
});

test('combined UTF-8 byte limit counts unrelated records across both owner queries',async()=>{
 const source=port(async()=>Array.from({length:5},()=>['é'.repeat(2048)]));
 const observation=await observeSenderDNS(domain,()=>source.resolver);
 assert.equal(observation.spf.error,'response_limit');assert.equal(observation.dmarc.error,'response_limit');
});

test('accepts exactly 32KiB combined bytes and bounded matching records',async()=>{
 const source=port(async()=>Array.from({length:4},()=>['x'.repeat(4096)]));
 const observation=await observeSenderDNS(domain,()=>source.resolver);
 assert.equal(observation.spf.status,'missing');assert.equal(observation.dmarc.status,'missing');
 assert.equal(observation.spf.error,undefined);assert.equal(observation.dmarc.error,undefined);
});

test('byte accounting joins split UTF-16 characters within an RR before encoding',async()=>{
 const source=port(async owner=>owner===domain?
  [['x'.repeat(4094)+'\uD83D','\uDE00'],...Array.from({length:3},()=>['x'.repeat(4096)])]:
  [...Array.from({length:3},()=>['x'.repeat(4096)]),['x'.repeat(4094)]]);
 const observation=await observeSenderDNS(domain,()=>source.resolver);
 assert.equal(observation.spf.status,'missing');assert.equal(observation.dmarc.status,'missing');
 assert.equal(observation.spf.error,undefined);assert.equal(observation.dmarc.error,undefined);
});

test('accepts forty RRs per owner and exactly 4096 joined characters per RR',async()=>{
 const record='v=spf1 '+'x'.repeat(4089);
 const source=port(async owner=>owner===domain?[[record.slice(0,2000),record.slice(2000)],...Array.from({length:39},()=>[''])]:[]);
 const observation=await observeSenderDNS(domain,()=>source.resolver);
 assert.deepEqual(observation.spf.records,[record]);assert.equal(observation.spf.status,'single_record');assert.equal(observation.dmarc.status,'missing');
});

test('fixed five-second deadline cancels its resolver and releases callers even when cancel does not settle queries',async context=>{
 context.mock.timers.enable({apis:['setTimeout','Date'],now:Date.parse('2026-10-02T12:00:00Z')});
 const late=deferred<string[][]>();const source=port(()=>late.promise);
 const pending=observeSenderDNS(domain,()=>source.resolver);
 context.mock.timers.tick(4999);assert.equal(source.cancellations,0);
 context.mock.timers.tick(1);const observation=await pending;
 assert.equal(source.cancellations,1);assert.equal(observation.spf.error,'timeout');assert.equal(observation.dmarc.error,'timeout');
 assert.equal(observation.observed_at,'2026-10-02T12:00:05.000Z');
 late.reject(new Error('late cancellation rejection'));
 await Promise.resolve();
});

test('a completed owner keeps its evidence when the other owner reaches the deadline',async context=>{
 context.mock.timers.enable({apis:['setTimeout','Date'],now:0});
 const source=port(owner=>owner===domain?Promise.resolve([['v=spf1 -all']]):new Promise(()=>{}));
 const pending=observeSenderDNS(domain,()=>source.resolver);await Promise.resolve();await Promise.resolve();
 context.mock.timers.tick(5000);const observation=await pending;
 assert.equal(observation.spf.status,'single_record');assert.equal(observation.dmarc.error,'timeout');assert.equal(source.cancellations,1);
});

test('simultaneous observations own independent resolvers and cancellation cannot cross calls',async context=>{
 context.mock.timers.enable({apis:['setTimeout','Date'],now:0});
 const first=port(()=>new Promise(()=>{}));const secondTXT=deferred<string[][]>();const second=port(()=>secondTXT.promise);
 const firstPending=observeSenderDNS(domain,()=>first.resolver);
 context.mock.timers.tick(1000);const secondPending=observeSenderDNS('another.public-domain.com',()=>second.resolver);
 context.mock.timers.tick(4000);const firstObservation=await firstPending;
 assert.equal(firstObservation.spf.error,'timeout');assert.equal(first.cancellations,1);assert.equal(second.cancellations,0);
 secondTXT.resolve([['v=spf1 -all']]);const secondObservation=await secondPending;
 assert.equal(secondObservation.spf.status,'single_record');assert.equal(secondObservation.observed_at,'1970-01-01T00:00:05.000Z');
 context.mock.timers.tick(1000);assert.equal(second.cancellations,0);
});

test('cancellation failures cannot prevent timeout observation completion',async context=>{
 context.mock.timers.enable({apis:['setTimeout'],now:0});
 const resolver:SenderDNSResolver={resolveTxt:()=>new Promise(()=>{}),cancel:()=>{throw new Error('private cancel failure');}};
 const pending=observeSenderDNS(domain,()=>resolver);context.mock.timers.tick(5000);
 const observation=await pending;assert.equal(observation.spf.error,'timeout');assert.equal(observation.dmarc.error,'timeout');
});
