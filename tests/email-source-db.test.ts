import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceDatabase}from'../scripts/smoke-source-truth';
import { blankSpec } from '../src/domain/email';
import { createEmail, saveDraft, checkpoint, restoreRevision } from '../src/server/emails';
import { deriveEmail } from '../src/server/derivation';
import{randomUUID,createHash}from'node:crypto';

export const exactSource = '\ufeff<!--keep-->\r\n<DIV onclick="bad()">H &amp; X</DIV>\n<script>bad()</script>\r<p>ok</p><!--123456789012345-->';
test('actual restricted DB retains exact inert source across create/save/checkpoint/restore/remix',async()=>sourceDatabase(async({db,p,brand,tx})=>{
  assert.equal(exactSource.length,105);
  const spec={...blankSpec(brand,'Exact fixture'),editing_mode:'raw_html' as const,raw_html:exactSource};
  const created=await tx(c=>createEmail(c,p,'Exact fixture',spec));
  const stored=(await db.query('SELECT spec FROM emails WHERE id=$1',[created.id])).rows[0].spec.raw_html;
  assert.equal(stored,exactSource);
  const frozen=await tx(c=>checkpoint(c,p,created.id,1));assert.equal(frozen.spec.raw_html,exactSource);assert.ok(!frozen.html.includes('<script>'));
  const edited=exactSource+'\n<!--edited-->☃';await tx(c=>saveDraft(c,p,created.id,1,{...spec,raw_html:edited}));
  assert.equal((await db.query('SELECT spec FROM emails WHERE id=$1',[created.id])).rows[0].spec.raw_html,edited);
  const restored=await tx(c=>restoreRevision(c,p,created.id,2,frozen.id));assert.equal(restored.spec.raw_html,exactSource);
  const child=await tx(c=>deriveEmail(c,p,frozen.id,{kind:'remix',title:'Exact child'}));assert.equal(child.email.spec.raw_html,exactSource);
  assert.equal((await db.query('SELECT spec FROM revisions WHERE id=$1',[frozen.id])).rows[0].spec.raw_html,exactSource);
}));
test('empty exact source and ambiguous raw UTM edits remain durable inert documents',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const spec={...blankSpec(brand,'empty'),editing_mode:'raw_html' as const,raw_html:''};
 const empty=await tx(c=>createEmail(c,p,'empty',spec));assert.equal(empty.spec.raw_html,'');assert.equal(empty.raw_source_profile,'exact-utf8-1');
 const value={...spec,raw_html:'<!--[if mso]><a href="https://example.com">Hidden</a><![endif]--><p>x</p>',tracking:{utm_source:'newsletter',utm_medium:'email',utm_campaign:'fixture'}};
 const saved=await tx(c=>saveDraft(c,p,empty.id,1,value));assert.equal(saved.spec.raw_html,value.raw_html);
 assert.equal((await db.query('SELECT spec FROM emails WHERE id=$1',[empty.id])).rows[0].spec.raw_html,value.raw_html);
}));
test('migration profiles available legacy source without rewriting immutable artifact/spec and provenance cannot be forged',async()=>{
 const email=randomUUID(),revision=randomUUID(),legacy='<!--stored legacy-->\r<p>Actual available</p>',artifact='1'.repeat(64);let before:string;
 await sourceDatabase(async({db,p,tx})=>{
  const row=(await db.query('SELECT *FROM revisions WHERE id=$1',[revision])).rows[0];assert.equal(JSON.stringify(row.spec),before);assert.equal(row.artifact_hash,artifact);assert.equal(row.html,'legacy artifact');assert.equal(row.raw_source_profile,'legacy-stored-1');
  const old=(await db.query('SELECT *FROM emails WHERE id=$1',[email])).rows[0];assert.equal(old.raw_source_profile,'legacy-stored-1');
  await assert.rejects(tx(c=>c.query("UPDATE emails SET raw_source_profile='exact-utf8-1' WHERE id=$1",[email])),/SOURCE_PROFILE_SERVER_OWNED/);
  const legacyCheckpoint=await tx(c=>checkpoint(c,p,email,1));assert.equal(legacyCheckpoint.raw_source_profile,'legacy-stored-1');assert.equal(legacyCheckpoint.manifest.source.profile,'legacy-stored-1');
  const saved=await tx(c=>saveDraft(c,p,email,1,old.spec,{origin:'restore',revision}));assert.equal(saved.spec.raw_html,legacy);assert.equal(saved.raw_source_profile,'exact-utf8-1');
  const event=(await db.query('SELECT *FROM email_source_provenance WHERE email_id=$1',[email])).rows[0];assert.equal(event.source_revision_profile,'legacy-stored-1');assert.equal(event.source_sha256,createHash('sha256').update(legacy).digest('hex'));assert.equal(event.actor,p.user);
  await assert.rejects(tx(c=>c.query('UPDATE email_source_provenance SET source_bytes=0')),{code:'42501'});
  await assert.rejects(tx(c=>c.query('DELETE FROM email_source_provenance')),{code:'42501'});
  await assert.rejects(tx(c=>c.query('INSERT INTO email_source_provenance SELECT * FROM email_source_provenance')),{code:'42501'});
  assert.equal((await tx(async c=>{await c.query("SELECT set_config('app.workspace_id','',true)");return c.query('SELECT *FROM email_source_provenance');})).rowCount,0);
 },async({db,p,brand})=>{
  const spec={...blankSpec(brand,'legacy'),editing_mode:'raw_html',raw_html:legacy};
  await db.query('INSERT INTO emails(workspace_id,id,title,spec,created_by)VALUES($1,$2,$3,$4,$5)',[p.workspace,email,'legacy',spec,p.user]);
  await db.query('INSERT INTO revisions(workspace_id,id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by)VALUES($1,$2,$3,1,$4,$5,$6,$7,$8,$9)',[p.workspace,revision,email,spec,'legacy artifact','legacy text',artifact,{},p.user]);
  before=JSON.stringify((await db.query('SELECT spec FROM revisions WHERE id=$1',[revision])).rows[0].spec);
 });
});
