import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
test('template commands canonicalize UUID/name and reject unknown fields, stale shapes and noncanonical hashes',async()=>{
 assert.ok(existsSync('src/domain/email-templates.ts'),'template domain is implemented');
 const {SaveEmailTemplateInput,ArchiveEmailTemplateInput,RemixEmailTemplateInput}=await import('../src/domain/email-templates');
 const id='AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA',hash='a'.repeat(64);
 assert.deepEqual(SaveEmailTemplateInput.parse({name:'  Frozen  ',source_revision_id:id,expected_artifact_hash:hash}),{name:'Frozen',source_revision_id:id.toLowerCase(),expected_artifact_hash:hash});
 for(const value of [{name:' ',source_revision_id:id,expected_artifact_hash:hash},{name:'x'.repeat(161),source_revision_id:id,expected_artifact_hash:hash},{name:'ok',source_revision_id:id,expected_artifact_hash:hash.toUpperCase()},{name:'ok',source_revision_id:id,expected_artifact_hash:hash,body:'secret'}])assert.equal(SaveEmailTemplateInput.safeParse(value).success,false);
 assert.deepEqual(ArchiveEmailTemplateInput.parse({expected_version:1}),{expected_version:1});
 for(const expected_version of [0,-1,1.5,'1'])assert.equal(ArchiveEmailTemplateInput.safeParse({expected_version}).success,false);
 assert.equal(ArchiveEmailTemplateInput.safeParse({expected_version:1,name:'changed'}).success,false);
 assert.equal(RemixEmailTemplateInput.parse({title:'  Child ',expected_version:1,expected_artifact_hash:hash}).title,'Child');
 assert.equal(RemixEmailTemplateInput.safeParse({title:'Child',expected_version:1,expected_artifact_hash:hash,brand_kit_version_id:id}).success,false);
});

test('template metadata view rejects source bodies and validates frozen nullable history',async()=>{
 const {EmailTemplateViewSchema}=await import('../src/domain/email-templates');
 const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',value={id,name:'Frozen',state:'active',version:1,source_revision_id:id,source_email_id:id,source_revision_no:1,source_doc_version:null,source_title:'Original',artifact_hash:'a'.repeat(64),brand_kit_version_id:id,locale:'en-US',direction:'ltr',editing_mode:'structured',created_at:'2026-10-03T00:00:00.000Z',archived_at:null};
 assert.deepEqual(EmailTemplateViewSchema.parse(value),value);
 for(const field of ['spec','html','raw_html','credential','workspace_id'])assert.equal(EmailTemplateViewSchema.safeParse({...value,[field]:'private'}).success,false);
 for(const patch of [{locale:'xx-XX'},{direction:'sideways'},{source_doc_version:0},{editing_mode:'rich-text'},{artifact_hash:'A'.repeat(64)},{archived_at:'tomorrow'}])assert.equal(EmailTemplateViewSchema.safeParse({...value,...patch}).success,false);
});

test('template command and metadata schemas bundle for browser consumers without Node runtime dependencies',async()=>{
 const {build}=await import('esbuild');
 const result=await build({entryPoints:['src/domain/email-templates.ts'],bundle:true,platform:'browser',format:'esm',write:false,logLevel:'silent'});
 assert.equal(result.errors.length,0);assert.ok(result.outputFiles[0].text.includes('source_revision_id'));
});
