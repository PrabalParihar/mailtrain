import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allowed} from '../src/domain/permissions.js';
import {publicAddress, validatePublicUrl} from '../src/server/safe-fetch.js';
import {normalizeEmail, eligibility} from '../src/domain/audience.js';
test('Editor cannot approve/send and Billing cannot read email/contact content',()=>{
 assert.equal(allowed('Editor','approve'),false);assert.equal(allowed('Editor','send'),false);assert.equal(allowed('Billing','read'),false);assert.equal(allowed('Billing','audience'),false);assert.equal(allowed('Owner','approve'),true);
});
test('fetch rejects private, mapped IPv6 and metadata addresses',()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.1.1','192.168.1.1','::1','fc00::1','::ffff:127.0.0.1','fe80::1','100.64.1.1','0.0.0.0','2002:7f00:1::','2001:db8::1','3fff::1','0:0:0:0:0:ffff:7f00:1']) assert.equal(publicAddress(ip),false,ip);
 assert.equal(publicAddress('93.184.216.34'),true);assert.equal(publicAddress('2606:4700::1111'),true);assert.throws(()=>validatePublicUrl('file:///etc/passwd'));assert.throws(()=>validatePublicUrl('https://user:password@example.com'));assert.throws(()=>validatePublicUrl('http://127.0.0.1'));
});
test('email normalization preserves original local part semantics and suppression wins',()=>{
 assert.equal(normalizeEmail(' Jane+Tag@EXAMPLE.COM ').lookup,'jane+tag@example.com');assert.equal(normalizeEmail('Jane+Tag@EXAMPLE.COM').original,'Jane+Tag@example.com');
 assert.equal(eligibility({subscription:'subscribed',suppressed:true,deleted:false}).eligible,false);assert.equal(eligibility({subscription:'pending_confirmation',suppressed:false,deleted:false}).eligible,false);
});
