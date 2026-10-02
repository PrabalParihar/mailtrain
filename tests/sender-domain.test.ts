import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSender,SenderDraftInput,SenderView,DNSObservation,summarizeTXT,canonicalDomain} from '../src/domain/sender-domain';
const draft={name:'Owned sender',provider:'ses',account_label:'Account reference only',region:'us-east-1',from_name:'Owned',from_address:'Team@EXAMPLE.COM',reply_to:'help@example.com'};
test('sender canonicalization preserves mailbox case and scopes provider/account/region without inventing verification',()=>{
 assert.deepEqual(normalizeSender(draft),{...draft,from_address:'Team@example.com',domain:'example.com'});
 assert.equal(canonicalDomain('BÜCHER.example'),'xn--bcher-kva.example');
 assert.equal(normalizeSender({...draft,from_address:'hello@bücher.example'}).from_address,'hello@xn--bcher-kva.example');
 assert.equal(SenderDraftInput.safeParse({...draft,credential:'secret'}).success,false);
 assert.equal(SenderDraftInput.safeParse({...draft,sending_enabled:true}).success,false);
 for(const input of [{region:''},{provider:'unknown'},{account_label:'x'.repeat(101)},{from_name:'x'.repeat(101)},{from_address:'x'.repeat(255)}])assert.throws(()=>normalizeSender({...draft,...input}));
});
test('domain/email inputs reject URL/control/IP/single-label/private shapes and retain explicit optional reply-to',()=>{
 for(const domain of ['https://example.com','a@b.example','127.0.0.1','2130706433','0x7f000001','localhost','a.local','a.internal','a..example','-a.example','a_.example','example.com/path','x\n.example','[::1]'])assert.throws(()=>canonicalDomain(domain),domain);
 for(const address of ['a@example.com\nBcc:x@y.com','a@example.com/path','a@127.0.0.1','bad address@example.com'])assert.throws(()=>normalizeSender({...draft,from_address:address}));
 assert.equal(normalizeSender({...draft,reply_to:''}).reply_to,null);
 assert.equal(normalizeSender({...draft,reply_to:'Reply@BÜCHER.example'}).reply_to,'Reply@xn--bcher-kva.example');
});
test('TXT records join chunks within a record and distinguish multiple SPF from split strings',()=>{
 assert.deepEqual(summarizeTXT([['v=spf1 include:', 'example.com -all'],['other=public']], 'spf'),{records:['v=spf1 include:example.com -all'],status:'single_record'});
 assert.deepEqual(summarizeTXT([['v=spf1 -all'],['v=spf1 ~all']], 'spf'),{records:['v=spf1 -all','v=spf1 ~all'],status:'multiple_records'});
 assert.deepEqual(summarizeTXT([['unrelated=only']], 'dmarc'),{records:[],status:'missing'});
 assert.equal(summarizeTXT([['v=DMARC1; p=none']], 'dmarc').status,'single_record');
 for(const records of [Array.from({length:41},()=>['x']),[['x'.repeat(4097)]],Array.from({length:9},()=>['x'.repeat(4096)])])assert.throws(()=>summarizeTXT(records,'spf'));
});
test('sender/evidence views cannot claim connected, authentication or sending readiness',()=>{
 const base={...normalizeSender(draft),id:'00000000-0000-4000-8000-000000000001',version:1,created_at:'2026-10-02T11:00:00.000Z',updated_at:'2026-10-02T11:00:00.000Z',connection_status:'not_connected',sending_enabled:false};
 assert.equal(SenderView.safeParse(base).success,true);
 for(const patch of [{connection_status:'connected'},{sending_enabled:true},{provider_account_id:'invented'},{credentials:{secret:'no'}}])assert.equal(SenderView.safeParse({...base,...patch}).success,false);
 const evidence={domain:'example.com',observed_at:'2026-10-02T11:00:00.000Z',scope:'exact_domain_txt',spf:{owner:'example.com',records:[],status:'missing'},dmarc:{owner:'_dmarc.example.com',records:[],status:'missing'},provider_verified:false,authentication_verified:false,sending_enabled:false};
 assert.equal(DNSObservation.safeParse(evidence).success,true);
 assert.equal(DNSObservation.safeParse({...evidence,authentication_verified:true}).success,false);
 assert.equal(DNSObservation.safeParse({...evidence,dkim:'guessed._domainkey'}).success,false);
});
