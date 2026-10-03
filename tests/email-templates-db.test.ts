import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceDatabase} from '../scripts/smoke-source-truth';
test('restricted template storage exists with forced tenant RLS',async()=>sourceDatabase(async({db,tx})=>{
 const row=(await db.query("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid=to_regclass('public.email_templates')")).rows[0];
 assert.ok(row,'email_templates migration exists');assert.equal(row.relrowsecurity,true);assert.equal(row.relforcerowsecurity,true);
 assert.equal((await tx(c=>c.query('SELECT * FROM email_templates'))).rowCount,0);
}));

test('frozen templates preserve pins, isolate tenants and reuse original receipts after archive',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const {existsSync}=await import('node:fs');assert.ok(existsSync('src/server/email-templates.ts'),'template services exist');
 const {saveEmailTemplate,remixEmailTemplate,archiveEmailTemplate,getEmailTemplate,listEmailTemplates}=await import('../src/server/email-templates');
 const {blankSpec}=await import('../src/domain/email');const {createEmail,checkpoint,saveDraft}=await import('../src/server/emails');const {randomUUID}=await import('node:crypto');
 const source=await tx(c=>createEmail(c,p,'Original source',blankSpec(brand,'Frozen'))),revision=await tx(c=>checkpoint(c,p,source.id,1));
 const input={name:' Original ',source_revision_id:revision.id,expected_artifact_hash:revision.artifact_hash};
 await assert.rejects(tx(c=>saveEmailTemplate(c,p,{...input,expected_artifact_hash:'0'.repeat(64)},randomUUID())),{code:'TEMPLATE_ARTIFACT_MISMATCH'});
 const key=randomUUID(),saved=await tx(c=>saveEmailTemplate(c,p,input,key)),id=saved.template.id;
 assert.deepEqual(await tx(c=>saveEmailTemplate(c,p,input,key)),saved);
 await assert.rejects(tx(c=>saveEmailTemplate(c,p,{...input,name:'Changed command'},key)),{code:'IDEMPOTENCY_MISMATCH'});
 assert.equal(saved.template.source_title,'Original source');assert.equal(saved.template.source_doc_version,1);
 assert.equal('spec' in saved.template,false);assert.equal('html' in saved.template,false);
 await tx(c=>saveDraft(c,p,source.id,1,{...source.spec,subject:'Changed head'}));
 await assert.rejects(tx(c=>c.query('UPDATE email_templates SET source_revision_id=$1 WHERE id=$2',[revision.id,id])),{code:'42501'});
 await assert.rejects(tx(c=>c.query('DELETE FROM email_templates WHERE id=$1',[id])),{code:'42501'});
 const remix={title:'Separate draft',expected_version:1,expected_artifact_hash:revision.artifact_hash},remixKey=randomUUID();
 const children=await Promise.all([tx(c=>remixEmailTemplate(c,p,id,remix,remixKey)),tx(c=>remixEmailTemplate(c,p,id,remix,remixKey))]);
 assert.deepEqual(children[0],children[1]);assert.deepEqual(children[0].email.spec,revision.spec);assert.equal(children[0].lineage.source_revision_id,revision.id);
 assert.equal((await db.query('SELECT count(*) FROM email_lineage WHERE source_revision_id=$1',[revision.id])).rows[0].count,'1');
 await assert.rejects(tx(c=>archiveEmailTemplate(c,p,id,{expected_version:2},randomUUID())),{code:'VERSION_MISMATCH'});
 const archived=await tx(c=>archiveEmailTemplate(c,p,id,{expected_version:1},randomUUID()));assert.equal(archived.template.version,2);
 assert.deepEqual(await tx(c=>remixEmailTemplate(c,p,id,remix,remixKey)),children[0]);
 await assert.rejects(tx(c=>remixEmailTemplate(c,p,id,remix,randomUUID())),{code:'TEMPLATE_ARCHIVED'});
 assert.equal((await tx(c=>getEmailTemplate(c,p,id))).template.source_revision_id,revision.id);
 assert.equal((await tx(c=>listEmailTemplates(new Request('http://local/v1/templates'),c,p))).data.length,0);
 assert.equal((await tx(c=>listEmailTemplates(new Request('http://local/v1/templates?state=archived'),c,p))).data.length,1);
 const other=randomUUID();await db.query("INSERT INTO workspaces(id,name)VALUES($1,'other')",[other]);await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[other,p.user]);
 await assert.rejects(tx(async c=>{await c.query("SELECT set_config('app.workspace_id',$1,true)",[other]);return getEmailTemplate(c,{...p,workspace:other},id);}),{code:'RESOURCE_NOT_FOUND'});
 await assert.rejects(tx(async c=>{await c.query("SELECT set_config('app.workspace_id',$1,true)",[other]);return saveEmailTemplate(c,{...p,workspace:other},input,randomUUID());}),{code:'RESOURCE_NOT_FOUND'});
}));

test('template admission rechecks current role, membership, workspace and API key before receipt replay',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const {existsSync}=await import('node:fs');assert.ok(existsSync('src/server/email-templates.ts'),'template services exist');
 const {saveEmailTemplate,getEmailTemplate}=await import('../src/server/email-templates');const {blankSpec}=await import('../src/domain/email');const {createEmail,checkpoint}=await import('../src/server/emails');const {randomUUID,createHash}=await import('node:crypto');
 const source=await tx(c=>createEmail(c,p,'Authority',blankSpec(brand,'Authority'))),r=await tx(c=>checkpoint(c,p,source.id,1)),input={name:'Authority',source_revision_id:r.id,expected_artifact_hash:r.artifact_hash},key=randomUUID(),saved=await tx(c=>saveEmailTemplate(c,p,input,key));
 for(const role of ['Viewer','Billing']){await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3',[role,p.workspace,p.user]);await assert.rejects(tx(c=>saveEmailTemplate(c,p,input,key)),{code:'INSUFFICIENT_SCOPE'});if(role==='Viewer')assert.equal((await tx(c=>getEmailTemplate(c,p,saved.template.id))).template.id,saved.template.id);else await assert.rejects(tx(c=>getEmailTemplate(c,p,saved.template.id)),{code:'INSUFFICIENT_SCOPE'});}
 await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1",[p.workspace]);await db.query("UPDATE workspaces SET status='locked' WHERE id=$1",[p.workspace]);await assert.rejects(tx(c=>saveEmailTemplate(c,p,input,key)),{code:'WORKSPACE_LOCKED'});await db.query("UPDATE workspaces SET status='active' WHERE id=$1",[p.workspace]);
 for(const role of ['Admin','Editor']){await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2',[role,p.workspace]);assert.ok((await tx(c=>saveEmailTemplate(c,p,input,randomUUID()))).template.id);}
 await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1",[p.workspace]);
 const token_hash=createHash('sha256').update(randomUUID()).digest('hex');await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[token_hash,p.user]);
 const session={...p,local_session:{token_hash}},sessionKey=randomUUID();await tx(c=>saveEmailTemplate(c,session,input,sessionKey));await db.query('DELETE FROM auth_sessions WHERE token_hash=$1',[token_hash]);await assert.rejects(tx(c=>saveEmailTemplate(c,session,input,sessionKey)),{code:'AUTH_REQUIRED'});
 const apiId=randomUUID();await db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'fixture','[\"emails:write\",\"emails:read\"]',$4,clock_timestamp()+interval '1 hour')",[p.workspace,apiId,createHash('sha256').update(apiId).digest('hex'),p.user]);
 const api={...p,user:'api-key:'+apiId,api_key:{id:apiId,delegator:p.user,scopes:['emails:write','emails:read']}},apiKey=randomUUID();await tx(c=>saveEmailTemplate(c,api,input,apiKey),api.user);
 await db.query("UPDATE api_keys SET scopes='[\"emails:read\"]' WHERE id=$1",[apiId]);await assert.rejects(tx(c=>saveEmailTemplate(c,api,input,apiKey),api.user),{code:'INSUFFICIENT_SCOPE'});
 await db.query("UPDATE api_keys SET scopes='[\"emails:write\"]' WHERE id=$1",[apiId]);await assert.rejects(tx(c=>getEmailTemplate(c,api,saved.template.id),api.user),{code:'INSUFFICIENT_SCOPE'});
 await db.query('UPDATE api_keys SET revoked_at=clock_timestamp() WHERE id=$1',[apiId]);await assert.rejects(tx(c=>saveEmailTemplate(c,api,input,apiKey),api.user),{code:'AUTH_REQUIRED'});
 await db.query("UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[p.workspace]);await assert.rejects(tx(c=>saveEmailTemplate(c,p,input,key)),{code:'RESOURCE_NOT_FOUND'});
}));

test('template reuse preserves exact raw/custom content and frozen brand while removed assets deny new children',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const {saveEmailTemplate,remixEmailTemplate}=await import('../src/server/email-templates');const {blankSpec}=await import('../src/domain/email');const {createEmail,checkpoint,saveDraft}=await import('../src/server/emails');const {randomUUID}=await import('node:crypto');
 const exact='\ufeff<!--Original-->\r\n<DIV onclick="bad()">H &amp; ☃ é</DIV>\r<script>bad()</script>';
 for(const mode of ['raw_html','structured'] as const){
  const base=blankSpec(brand,'Frozen brand'),spec=mode==='raw_html'?{...base,editing_mode:mode,raw_html:exact}:{...base,sections:[...base.sections,{id:randomUUID(),type:'custom_html' as const,html:exact}]};
  const source=await tx(c=>createEmail(c,p,'Exact '+mode,spec)),r=await tx(c=>checkpoint(c,p,source.id,1)),saved=await tx(c=>saveEmailTemplate(c,p,{name:mode,source_revision_id:r.id,expected_artifact_hash:r.artifact_hash},randomUUID()));
  const newBrand=randomUUID();await db.query("INSERT INTO brands(workspace_id,id,version,data)VALUES($1,$2,$3,'{}')",[p.workspace,newBrand,mode==='raw_html'?2:3]);
  await tx(c=>saveDraft(c,p,source.id,1,{...source.spec,brand_kit_version_id:newBrand,subject:'New head'}));
  const child=await tx(c=>remixEmailTemplate(c,p,saved.template.id,{title:'Independent '+mode,expected_version:1,expected_artifact_hash:r.artifact_hash},randomUUID()));
  assert.deepEqual(child.email.spec,r.spec);assert.equal(child.email.spec.brand_kit_version_id,brand);assert.equal(saved.template.brand_kit_version_id,brand);
  if(mode==='raw_html')assert.equal(child.email.spec.raw_html,exact);else {const custom=child.email.spec.sections.at(-1);assert.equal(custom?.type,'custom_html');assert.equal(custom?.type==='custom_html'?custom.html:undefined,exact);}
 }
 const asset=randomUUID(),variant=randomUUID(),op=randomUUID(),upload=randomUUID(),rights=randomUUID(),scan=randomUUID(),hash='a'.repeat(64);
 await db.query("INSERT INTO assets(workspace_id,id,created_by,source_sha256,state)VALUES($1,$2,$3,$4,'ready_private')",[p.workspace,asset,p.user,hash]);
 await db.query("INSERT INTO operations(workspace_id,id,type,input,created_by)VALUES($1,$2,'asset.upload','{}',$3)",[p.workspace,op,p.user]);
 await db.query("INSERT INTO asset_uploads(workspace_id,id,asset_id,operation_id,created_by,principal,token_hash,expected_sha256,expected_bytes,intent)VALUES($1,$2,$3,$4,$5,'{}','fixture',$6,8,'{}')",[p.workspace,upload,asset,op,p.user,hash]);
 await db.query("INSERT INTO asset_rights(workspace_id,id,asset_id,upload_id,actor,terms_version,attested,source_sha256)VALUES($1,$2,$3,$4,$5,'local-upload-attestation-v1',true,$6)",[p.workspace,rights,asset,upload,p.user,hash]);
 await db.query("INSERT INTO asset_scans(workspace_id,id,asset_id,operation_id,sha256,status,engine,database_sha256,database_built_at,completed_at,receipt)VALUES($1,$2,$3,$4,$5,'clean','fixture',$5,clock_timestamp(),clock_timestamp(),'{}')",[p.workspace,scan,asset,op,hash]);
 await db.query("INSERT INTO asset_variants(workspace_id,id,asset_id,object_key,sha256,bytes,mime,width,height,frames,role,processing_profile,storage_profile,rights_id,source_scan_id,scan_id,receipt)VALUES($1,$2,$3,$4,$5,8,'image/png',1,1,1,'static','fixture','local-private-v1',$6,$7,$7,'{}')",[p.workspace,variant,asset,p.workspace+'_'+variant+'_variant',hash,rights,scan]);
 const spec={...blankSpec(brand,'Asset'),schema_version:'1.1' as const,editing_mode:'raw_html' as const,raw_html:'<p>Private source</p>',asset_registry:[{asset_id:asset,variant_id:variant}]};
 const source=await tx(c=>createEmail(c,p,'Asset source',spec)),r=await tx(c=>checkpoint(c,p,source.id,1)),saved=await tx(c=>saveEmailTemplate(c,p,{name:'Asset pin',source_revision_id:r.id,expected_artifact_hash:r.artifact_hash},randomUUID()));
 const input={title:'Asset child',expected_version:1,expected_artifact_hash:r.artifact_hash},key=randomUUID(),child=await tx(c=>remixEmailTemplate(c,p,saved.template.id,input,key));assert.deepEqual(child.email.spec.asset_registry,spec.asset_registry);
 await db.query("UPDATE assets SET state='deleted' WHERE id=$1",[asset]);
 await assert.rejects(tx(c=>remixEmailTemplate(c,p,saved.template.id,input,randomUUID())),{code:'ASSET_NOT_READY'});
 assert.deepEqual(await tx(c=>remixEmailTemplate(c,p,saved.template.id,input,key)),child);
 assert.equal((await db.query('SELECT count(*) FROM email_lineage WHERE source_revision_id=$1',[r.id])).rows[0].count,'1');
}));

test('archive and reuse wait on the same row; an archive commit prevents a waiting new child',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const {saveEmailTemplate,archiveEmailTemplate,remixEmailTemplate}=await import('../src/server/email-templates');const {blankSpec}=await import('../src/domain/email');const {createEmail,checkpoint}=await import('../src/server/emails');const {randomUUID}=await import('node:crypto');
 const source=await tx(c=>createEmail(c,p,'Race',blankSpec(brand,'Race'))),r=await tx(c=>checkpoint(c,p,source.id,1));
 const saved=await tx(c=>saveEmailTemplate(c,p,{name:'Race',source_revision_id:r.id,expected_artifact_hash:r.artifact_hash},randomUUID())),id=saved.template.id;
 let release!:()=>void,held!:()=>void;const barrier=new Promise<void>(resolve=>release=resolve),locked=new Promise<void>(resolve=>held=resolve);
 const archiving=tx(async c=>{const archived=await archiveEmailTemplate(c,p,id,{expected_version:1},randomUUID());held();await barrier;return archived;});await locked;
 const pending=tx(c=>remixEmailTemplate(c,p,id,{title:'Must not appear',expected_version:1,expected_artifact_hash:r.artifact_hash},randomUUID()));
 const rejection=assert.rejects(pending,{code:'TEMPLATE_ARCHIVED'});
 try{
  // PostgreSQL evidence, rather than a timer, proves the second transaction is waiting.
  let waiting=false;for(let i=0;i<100&&!waiting;i++){waiting=(await db.query("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE 'SELECT id,name,state,version,%email_templates%FOR UPDATE') AS waiting")).rows[0].waiting;if(!waiting)await new Promise(resolve=>setTimeout(resolve,10));}
  assert.equal(waiting,true,'reuse waits for the archive row lock');
 }finally{release();}
 await archiving;await rejection;
 assert.equal((await db.query('SELECT count(*) FROM email_lineage WHERE source_revision_id=$1',[r.id])).rows[0].count,'0');
}));

test('database canonicalizes source pins, rejects forged bindings and permits only active-to-archived history',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const {saveEmailTemplate}=await import('../src/server/email-templates');const {blankSpec}=await import('../src/domain/email');const {createEmail,checkpoint}=await import('../src/server/emails');const {randomUUID}=await import('node:crypto');
 const source=await tx(c=>createEmail(c,p,'Pins',blankSpec(brand,'Pins'))),r=await tx(c=>checkpoint(c,p,source.id,1)),saved=await tx(c=>saveEmailTemplate(c,p,{name:'Pins',source_revision_id:r.id,expected_artifact_hash:r.artifact_hash},randomUUID()));
 for(const column of ['name','source_revision_id','source_email_id','source_revision_no','source_doc_version','source_title','artifact_hash','brand_kit_version_id','locale','direction','editing_mode','created_by','created_at'])assert.equal((await db.query('SELECT has_column_privilege($1,$2,$3,$4) AS allowed',['mailcraft_runtime','email_templates',column,'UPDATE'])).rows[0].allowed,false,column+' is immutable to runtime');
 await assert.rejects(db.query("UPDATE email_templates SET name='Rebound' WHERE id=$1",[saved.template.id]),/TEMPLATE_IMMUTABLE/);
 await assert.rejects(db.query('DELETE FROM email_templates WHERE id=$1',[saved.template.id]),/TEMPLATE_IMMUTABLE/);
 await assert.rejects(db.query('TRUNCATE email_templates'),/TEMPLATE_IMMUTABLE/);
 const forged=(await tx(c=>c.query('INSERT INTO email_templates(workspace_id,name,source_revision_id,artifact_hash,created_by,source_email_id,source_revision_no,source_doc_version,source_title,locale,direction,editing_mode,brand_kit_version_id)VALUES($1,$2,$3,$4,$5,$6,99,99,$7,$8,$9,$10,$11) RETURNING *',[p.workspace,'Canonical pins',r.id,r.artifact_hash,p.user,randomUUID(),'Fake','xx-XX','rtl','raw_html',randomUUID()]))).rows[0];
 assert.equal(forged.source_email_id,source.id);assert.equal(forged.source_revision_no,1);assert.equal(forged.source_doc_version,1);assert.equal(forged.source_title,'Pins');assert.equal(forged.locale,'en-US');assert.equal(forged.direction,'ltr');assert.equal(forged.editing_mode,'structured');assert.equal(forged.brand_kit_version_id,brand);
 await assert.rejects(tx(c=>c.query('INSERT INTO email_templates(workspace_id,name,source_revision_id,artifact_hash,created_by)VALUES($1,$2,$3,$4,$5)',[p.workspace,'Invalid',r.id,'f'.repeat(64),p.user])),/TEMPLATE_SOURCE_MISMATCH/);
 await assert.rejects(tx(c=>c.query("UPDATE email_templates SET state='archived',version=1,archived_at=clock_timestamp() WHERE id=$1",[saved.template.id])),/TEMPLATE_IMMUTABLE/);
}));

test('template signed pages default to 25 and fence active/archived filters and current read authority',async()=>sourceDatabase(async({db,p,brand,tx})=>{
 const {saveEmailTemplate,listEmailTemplates,archiveEmailTemplate}=await import('../src/server/email-templates');const {blankSpec}=await import('../src/domain/email');const {createEmail,checkpoint}=await import('../src/server/emails');const {randomUUID}=await import('node:crypto');
 const source=await tx(c=>createEmail(c,p,'Paging',blankSpec(brand,'Paging'))),r=await tx(c=>checkpoint(c,p,source.id,1));
 for(let i=0;i<27;i++)await tx(c=>saveEmailTemplate(c,p,{name:'Page '+i,source_revision_id:r.id,expected_artifact_hash:r.artifact_hash},randomUUID()));
 const first=await tx(c=>listEmailTemplates(new Request('http://local/v1/templates'),c,p));assert.equal(first.total_count,27);assert.equal(first.data.length,25);assert.equal(first.has_more,true);assert.ok(first.next_cursor);
 const second=await tx(c=>listEmailTemplates(new Request('http://local/v1/templates?after='+first.next_cursor),c,p));assert.equal(second.data.length,2);assert.equal(second.has_more,false);assert.equal(new Set([...first.data,...second.data].map(v=>v.id)).size,27);
 await assert.rejects(tx(c=>listEmailTemplates(new Request('http://local/v1/templates?state=archived&after='+first.next_cursor),c,p)),{code:'INVALID_CURSOR'});
 await assert.rejects(tx(c=>listEmailTemplates(new Request('http://local/v1/templates?limit=101'),c,p)));
 await assert.rejects(tx(c=>listEmailTemplates(new Request('http://local/v1/templates?state=all'),c,p)));
 await tx(c=>archiveEmailTemplate(c,p,first.data[0].id,{expected_version:1},randomUUID()));
 assert.equal((await tx(c=>listEmailTemplates(new Request('http://local/v1/templates?state=archived'),c,p))).data.length,1);
 for(const role of ['Admin','Editor','Viewer']){await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2',[role,p.workspace]);assert.equal((await tx(c=>listEmailTemplates(new Request('http://local/v1/templates?limit=100'),c,p))).data.length,26);}
 await db.query("UPDATE memberships SET role='Billing' WHERE workspace_id=$1",[p.workspace]);await assert.rejects(tx(c=>listEmailTemplates(new Request('http://local/v1/templates'),c,p)),{code:'INSUFFICIENT_SCOPE'});
}));
