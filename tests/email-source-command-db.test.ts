import test from'node:test';import assert from'node:assert/strict';import{randomUUID}from'node:crypto';
import{sourceDatabase}from'../scripts/smoke-source-truth';import{blankSpec}from'../src/domain/email';import{createEmail,checkpoint}from'../src/server/emails';
import{saveSourceDraft,importEmailSource,forkEmailToRaw,downloadRevisionSource}from'../src/server/email-source';
test('source command receipt replays exact saved bytes once and changed original command denies',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const created=await tx(c=>createEmail(c,p,'receipt',blankSpec(brand,'Receipt'))),key=randomUUID(),source='\ufeff<!--exact-->\r\n<p onclick="x()">🧑‍💻 &amp;</p>\r';
 const spec={...created.spec,editing_mode:'raw_html',raw_html:source};
 const saved=await tx(c=>saveSourceDraft(c,p,created.id,1,spec,key));assert.equal(saved.email.spec.raw_html,source);assert.equal(saved.receipt.saved_doc_version,2);assert.equal(saved.receipt.source?.bytes,Buffer.byteLength(source));
 const storedCommand=(await db.query('SELECT response FROM idempotency WHERE key=$1',[key])).rows[0].response;assert.equal(storedCommand.email.spec,undefined,'durable replay response must not become another raw autosave blob');
 const replay=await tx(c=>saveSourceDraft(c,p,created.id,1,spec,key));assert.deepEqual(replay,saved);
 await assert.rejects(tx(c=>saveSourceDraft(c,p,created.id,1,{...spec,raw_html:source+'x'},key)),{code:'IDEMPOTENCY_MISMATCH'});
 await assert.rejects(tx(c=>saveSourceDraft(c,p,created.id,2,spec,key)),{code:'IDEMPOTENCY_MISMATCH'});
 assert.equal((await db.query('SELECT count(*)FROM email_source_provenance WHERE email_id=$1',[created.id])).rows[0].count,'1');
 const importKey=randomUUID(),imported=await tx(c=>importEmailSource(c,p,created.id,2,source+'<!--import-->',importKey));assert.equal(imported.email.doc_version,3);
 const importedCommand=(await db.query('SELECT response FROM idempotency WHERE key=$1',[importKey])).rows[0].response;assert.equal(importedCommand.metadata.raw_html,undefined);
 assert.deepEqual(await tx(c=>saveSourceDraft(c,p,created.id,1,spec,key)),saved);assert.equal((await db.query('SELECT doc_version FROM emails WHERE id=$1',[created.id])).rows[0].doc_version,3);
 const revisions=(await db.query('SELECT * FROM revisions WHERE email_id=$1 ORDER BY revision_no',[created.id])).rows;assert.equal(revisions.length,1);assert.equal(revisions[0].spec.raw_html,source);
 const download=await tx(c=>downloadRevisionSource(c,p,revisions[0].id));assert.deepEqual(download.bytes,Buffer.from(source));
 await tx(c=>saveSourceDraft(c,p,created.id,3,{...imported.email.spec,subject:'newer subject',raw_html:'<p>newer source</p>'},randomUUID()));
 assert.deepEqual(await tx(c=>importEmailSource(c,p,created.id,2,source+'<!--import-->',importKey)),imported);assert.equal((await db.query('SELECT doc_version FROM emails WHERE id=$1',[created.id])).rows[0].doc_version,4);
}));
test('actual full-size raw source writes exact bytes and rejected encodings/overflow leave no source version',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const created=await tx(c=>createEmail(c,p,'boundary',blankSpec(brand,'Boundary'))),source='a'.repeat(2*1024*1024),spec={...created.spec,editing_mode:'raw_html',raw_html:source};
 const saved=await tx(c=>saveSourceDraft(c,p,created.id,1,spec,randomUUID()));assert.equal(saved.receipt.source?.bytes,2*1024*1024);
 assert.equal((await db.query("SELECT octet_length(spec->>'raw_html')AS bytes,spec->>'raw_html'AS source FROM emails WHERE id=$1",[created.id])).rows[0].source,source);
 for(const value of [source+'x','☃'.repeat(800000),'\ud800','\u0000'])await assert.rejects(tx(c=>saveSourceDraft(c,p,created.id,2,{...spec,raw_html:value},randomUUID())));
 assert.equal((await db.query('SELECT doc_version FROM emails WHERE id=$1',[created.id])).rows[0].doc_version,2);assert.equal((await db.query('SELECT count(*)FROM email_source_provenance WHERE email_id=$1',[created.id])).rows[0].count,'1');
}));
test('server raw fork pins actual artifact and retries without duplicating checkpoint',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const created=await tx(c=>createEmail(c,p,'fork',blankSpec(brand,'Fork'))),frozen=await tx(c=>checkpoint(c,p,created.id,1)),key=randomUUID();
 await assert.rejects(tx(c=>forkEmailToRaw(c,p,created.id,1,'0'.repeat(64),randomUUID())),{code:'SOURCE_ARTIFACT_CHANGED'});
 const saved=await tx(c=>forkEmailToRaw(c,p,created.id,1,frozen.artifact_hash,key));assert.equal(saved.email.spec.raw_html,frozen.html);assert.equal(saved.email.spec.editing_mode,'raw_html');
 const compact=(await db.query('SELECT response FROM idempotency WHERE key=$1',[key])).rows[0].response;assert.equal(compact.email.spec,undefined);assert.ok(compact.source_revision);assert.equal(compact.metadata,undefined);
 await tx(c=>saveSourceDraft(c,p,created.id,2,{...saved.email.spec,raw_html:'<p>newer raw head</p>'},randomUUID()));
 assert.deepEqual(await tx(c=>forkEmailToRaw(c,p,created.id,1,frozen.artifact_hash,key)),saved);
 assert.equal((await db.query('SELECT count(*)FROM revisions WHERE email_id=$1',[created.id])).rows[0].count,'2');
 const event=(await db.query('SELECT *FROM email_source_provenance WHERE email_id=$1',[created.id])).rows[0];assert.equal(event.origin,'structured_fork');assert.ok(event.source_revision_id);
}));
