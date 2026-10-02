import pg from 'pg';
import env from '@next/env';
import {randomUUID}from'node:crypto';
import{withCreationDatabase}from'../tests/fixtures/creation-database';
import{readFile,readdir}from'node:fs/promises';
import{basename}from'node:path';import{fileURLToPath}from'node:url';
import{canonicalSpecString}from'../src/domain/email-source-values';
type Fixture={db:pg.Pool;p:{workspace:string;user:string;role:'Owner'};brand:string;tx:<R>(fn:(c:pg.PoolClient)=>Promise<R>,actor?:string)=>Promise<R>};
export async function sourceDatabase<T>(run:(f:Fixture)=>Promise<T>,beforeMigration?:(f:Fixture)=>Promise<void>){
  // Only this guarded test runtime may load the already-owned mirror environment.
  if(!process.env.MIGRATION_DATABASE_URL)env.loadEnvConfig('/Users/prabalpratapsingh/Documents/Codex/2026-10-01/task/mailcraft',false,undefined,true);
  if(process.env.LOCAL_DEVELOPMENT!=='true'||!process.env.MIGRATION_DATABASE_URL||!['localhost','127.0.0.1'].includes(new URL(process.env.MIGRATION_DATABASE_URL).hostname))throw new Error('Owned loopback test database required');
  return withCreationDatabase(async connection=>{
    const db=new pg.Pool({connectionString:connection}),app=new pg.Pool({connectionString:connection,options:'-c role=mailcraft_runtime'}),p={workspace:randomUUID(),user:'source-'+randomUUID(),role:'Owner' as const},brand=randomUUID();
    const tx=async<R>(fn:(c:pg.PoolClient)=>Promise<R>,actor=p.user)=>{const c=await app.connect();try{await c.query('BEGIN');await c.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[p.workspace,actor]);const r=await fn(c);await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}};
    try{
      if(beforeMigration)for(const file of(await readdir('db')).filter(f=>/^\d+.*\.sql$/.test(f)&&f>'023-creation-queue.sql'&&f<'033-email-source-contract.sql').sort())await db.query(await readFile('db/'+file,'utf8'));
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'source fixture')",[p.workspace]);await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[p.workspace,p.user]);await db.query("INSERT INTO brands(workspace_id,id,version,data)VALUES($1,$2,1,'{}')",[p.workspace,brand]);
      const f={db,p,brand,tx};if(beforeMigration){await beforeMigration(f);await db.query(await readFile('db/033-email-source-contract.sql','utf8'));}return await run(f);
    }finally{await Promise.all([app.end(),db.end()]);}
  },beforeMigration?'023-creation-queue':undefined);
}
export async function smokeSourceTruth(){
 const{blankSpec}=await import('../src/domain/email'),{createEmail,checkpoint,restoreRevision}=await import('../src/server/emails'),{importEmailSource,saveSourceDraft,downloadRevisionSource}=await import('../src/server/email-source'),{deriveEmail}=await import('../src/server/derivation');
 const source='\ufeff<!--fixture-->\r\n<DIV onclick="bad()">H &amp; X</DIV>\n<script>globalThis.__sourceFixtureExecuted=true</script>\r<!--[if mso]><v:roundrect>Retained VML</v:roundrect><![endif]--><p>☃ é 🧑‍💻</p>';
 const started=performance.now();
 return sourceDatabase(async({db,p,brand,tx})=>{
  const created=await tx(c=>createEmail(c,p,'Source truth smoke',blankSpec(brand,'Fixture'))),key=randomUUID(),imported=await tx(c=>importEmailSource(c,p,created.id,1,source,key));
  const replay=await tx(c=>importEmailSource(c,p,created.id,1,source,key));
  if(canonicalSpecString(replay)!==canonicalSpecString(imported))throw new Error('Receipt replay mismatch');
  const exact=(await db.query("SELECT spec->>'raw_html'AS source FROM emails WHERE id=$1",[created.id])).rows[0].source;if(exact!==source)throw new Error('Database source mismatch');
  const revision=await tx(c=>checkpoint(c,p,created.id,2)),download=await tx(c=>downloadRevisionSource(c,p,revision.id));if(!download.bytes.equals(Buffer.from(source)))throw new Error('Source download bytes mismatch');
  const edited=source+'\r\n<!--newer exact source-->',saved=await tx(c=>saveSourceDraft(c,p,created.id,2,{...imported.email.spec,raw_html:edited},randomUUID()));
  const restored=await tx(c=>restoreRevision(c,p,created.id,3,revision.id)),child=await tx(c=>deriveEmail(c,p,revision.id,{kind:'remix',title:'Exact smoke child'}));if(restored.spec.raw_html!==source||child.email.spec.raw_html!==source)throw new Error('Restore/remix source mismatch');
  if(revision.html.includes('<script>')||revision.html.includes('onclick=')||(globalThis as{__sourceFixtureExecuted?:unknown}).__sourceFixtureExecuted!==undefined)throw new Error('Active source was executed/emitted');
  const provenance=(await db.query('SELECT count(*)FROM email_source_provenance WHERE email_id=$1',[created.id])).rows[0].count;
  return {kind:'actual-isolated-db-source-proof',source_bytes:download.bytes.length,source_sha256:download.sha256,source_profile:download.profile,imported_version:imported.email.doc_version,edited_version:saved.email.doc_version,restored_version:restored.doc_version,replay_identical:true,provenance:Number(provenance),delivery_status:revision.manifest.raw_projection?.delivery_status,elapsed_ms:Math.round(performance.now()-started),rss_bytes:process.memoryUsage().rss};
 });
}
if(process.argv[1]&&basename(process.argv[1])===basename(fileURLToPath(import.meta.url))){
 if(process.argv.includes('--suite')){
  const{spawn}=await import('node:child_process');
  await sourceDatabase(async({db})=>{
   const migration=db.options.connectionString!;const runtime=new URL(process.env.DATABASE_URL!);runtime.pathname=new URL(migration).pathname;
   const code=await new Promise<number>(resolve=>{const child=spawn('npm',['test'],{stdio:'inherit',env:{...process.env,DATABASE_URL:runtime.toString(),MIGRATION_DATABASE_URL:migration}});child.once('error',()=>resolve(1));child.once('exit',code=>resolve(code??1));});
   if(code!==0)process.exitCode=code;
  });
 }else console.log(JSON.stringify(await smokeSourceTruth()));
}
