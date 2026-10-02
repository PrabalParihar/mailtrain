import test from 'node:test';
import assert from 'node:assert/strict';
import {UTMParameters,UTM_POLICY_VERSION,UTMLinkError,decorateMarketingHref} from '../src/domain/utm';
const policy={utm_source:'newsletter',utm_medium:'email',utm_campaign:'early access'};
test('UTM is an explicit strict three-field bounded policy, never inferred tracking',()=>{
 assert.equal(UTM_POLICY_VERSION,'utm-explicit-1');assert.deepEqual(UTMParameters.parse(policy),policy);
 for(const invalid of[{},null,{...policy,utm_term:'hidden'},{...policy,tracking:true},{...policy,utm_source:''},{...policy,utm_source:'   '},{...policy,utm_source:'x'.repeat(129)},{...policy,utm_campaign:'界'.repeat(86)}])assert.equal(UTMParameters.safeParse(invalid).success,false);
});
test('Unicode values preserve exact identity but line and control characters are forbidden',()=>{
 const value={...policy,utm_campaign:'été 日本 & sale'};assert.deepEqual(UTMParameters.parse(value),value);
 for(const control of['\0','\n','\r','\t','\u007f','\u0085','\u2028','\u2029'])assert.equal(UTMParameters.safeParse({...policy,utm_campaign:'sale'+control}).success,false);
});
test('decoration preserves original non-UTM query bytes and fragment without rewriting the source URL',()=>{
 const original='https://example.com/a%2fb?x=a%20b&flag=&encoded=%2f#chapter%202',result=decorateMarketingHref(original,policy);
 assert.equal(result,'https://example.com/a%2fb?x=a%20b&flag=&encoded=%2f&utm_source=newsletter&utm_medium=email&utm_campaign=early%20access#chapter%202');assert.equal(original,'https://example.com/a%2fb?x=a%20b&flag=&encoded=%2f#chapter%202');
 assert.equal(decorateMarketingHref('https://example.com/path?',policy),'https://example.com/path?utm_source=newsletter&utm_medium=email&utm_campaign=early%20access');assert.equal(decorateMarketingHref('https://example.com/path?x=1&',policy),'https://example.com/path?x=1&utm_source=newsletter&utm_medium=email&utm_campaign=early%20access');
});
test('exact existing managed values are idempotent; absent values append once in deterministic order',()=>{
 const existing='https://example.com/?ut%6D_source=newsletter&utm_medium=email&utm_campaign=early+access#x';assert.equal(decorateMarketingHref(existing,policy),existing);const once=decorateMarketingHref('https://example.com/?utm_source=newsletter',policy);assert.equal(decorateMarketingHref(once,policy),once);assert.equal(new URL(once).searchParams.getAll('utm_source').length,1);
});
test('conflicting duplicate and case-ambiguous managed keys never silently override campaign attribution',()=>{
 for(const query of['utm_source=other','utm_source=newsletter&utm_source=newsletter','utm_source=newsletter&utm_source=other','UTM_SOURCE=newsletter','utm_campaign=early%2520access'])assert.throws(()=>decorateMarketingHref('https://example.com/?'+query,policy),(error:unknown)=>error instanceof UTMLinkError&&error.code==='UTM_LINK_CONFLICT');
});
test('mailto tel and the mandatory unsubscribe slot are preserved without marketing decoration',()=>{
 for(const link of['mailto:help@example.com?subject=Help','tel:+15555550123','{{UNSUBSCRIBE_URL}}'])assert.equal(decorateMarketingHref(link,policy),link);
});
test('only literal HTTPS without credentials is decorated; unsafe and unresolved targets fail explicitly',()=>{
 for(const link of['http://example.com','javascript:alert(1)','data:text/html,hi','/relative','https://user:password@example.com',' https://example.com','https://example.com/a\nb','https://example.com/\ud800','{{PRODUCT_URL}}','https://example.com/{{product}}','https://example.com/?X-Amz-Signature=owned-fixture','https://example.com/?X-Goog-Signature=owned-fixture'])assert.throws(()=>decorateMarketingHref(link,policy),UTMLinkError);
});
test('UTF8 values percent-encode deterministically and final target bounds fail rather than truncate',()=>{
 const unicode={...policy,utm_campaign:'été 日本 & sale'};const url=decorateMarketingHref('https://example.com/?x=1#part',unicode);assert.equal(new URL(url).searchParams.get('utm_campaign'),unicode.utm_campaign);assert.equal(decorateMarketingHref('https://example.com/?x=1#part',unicode),url);assert.throws(()=>decorateMarketingHref('https://example.com/'+ 'a'.repeat(2020),policy),(error:unknown)=>error instanceof UTMLinkError&&error.code==='UTM_LINK_TOO_LONG');
});

test('Malformed Unicode cannot normalize silently or escape as an encoder exception',()=>{for(const text of['sale\ud800','sale\udc00'])assert.equal(UTMParameters.safeParse({...policy,utm_campaign:text}).success,false);assert.equal(new URL(decorateMarketingHref('https://example.com',{...policy,utm_campaign:'sale 😀'})).searchParams.get('utm_campaign'),'sale 😀');});
