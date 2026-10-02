// Owned local lifecycle proof: an ordinary isolated daemon child outlives its
// host owner. Lease expiry must retain the processing/accounting barrier.
import assert from 'node:assert/strict';
import {randomUUID}from'node:crypto';
import {spawn,execFile}from'node:child_process';
import {promisify}from'node:util';
import pg from'pg';
import env from'@next/env';
import {withCreationDatabase}from'../tests/fixtures/creation-database';
import {mediaRuntimeIdentity}from'../src/server/media-supervisor';
env.loadEnvConfig(process.cwd());
assert.equal(process.env.LOCAL_DEVELOPMENT,'true');
const base=new URL(process.env.MIGRATION_DATABASE_URL!);
assert.equal(base.hostname,'127.0.0.1');assert.equal(base.port,'55439');assert.equal(base.pathname,'/mailcraft');
const image=process.env.MEDIA_DECODER_IMAGE!;
assert.match(image,/^sha256:[a-f0-9]{64}$/);
const docker=promisify(execFile);
await withCreationDatabase(async connection=>{
 const db=new pg.Pool({connectionString:connection}),scheduler=new pg.Pool({connectionString:connection,options:'-c role=mailcraft_media_scheduler'});
 const w=randomUUID(),op=randomUUID(),asset=randomUUID(),upload=randomUUID(),user='media-expiry-'+randomUUID(),proof={workspace:w,user,role:'Owner'};
 let container:string|undefined,owner:ReturnType<typeof spawn>|undefined;
 try{
  await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Owned media expiry')",[w]);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[w,user]);
  await db.query("INSERT INTO asset_quotas(workspace_id,allowance,reserved,profile)VALUES($1,268435456,41943040,'local-private-v1')",[w]);
  await db.query("INSERT INTO assets(workspace_id,id,source_key,source_sha256,source_bytes,mime,created_by)VALUES($1,$2,$3,$4,10,'image/png',$5)",[w,asset,w+'_'+upload+'_source','a'.repeat(64),user]);
  await db.query("INSERT INTO operations(workspace_id,id,type,input,created_by)VALUES($1,$2,'asset.upload','{}',$3)",[w,op,user]);
  await db.query("INSERT INTO asset_uploads(workspace_id,id,asset_id,operation_id,created_by,principal,token_hash,expected_sha256,expected_bytes,intent,status,reserved_bytes)VALUES($1,$2,$3,$4,$5,$6,'fixture',$7,10,'{}','finalized',41943040)",[w,upload,asset,op,user,proof,'a'.repeat(64)]);
  await db.query('INSERT INTO media_jobs(workspace_id,operation_id,asset_id,upload_id,principal)VALUES($1,$2,$3,$4,$5)',[w,op,asset,upload,proof]);
  const job=(await scheduler.query('SELECT mailcraft_claim_media() job')).rows[0].job;
  assert.equal(job.operation_id,op);container=mediaRuntimeIdentity(job).containers[0];
  const args=['run','--detach','--rm','--name',container,'--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','64m','--cpus','1','--pids-limit','16','--user','1001:1001','--entrypoint','node',image,'-e','setTimeout(()=>{},120000)'];
  const launcher="const{spawnSync}=require('node:child_process');const r=spawnSync('docker',JSON.parse(process.argv[1]),{encoding:'utf8'});if(r.status!==0)process.exit(2);process.stdout.write('launched\\n');setInterval(()=>{},1000);";
  const launched=spawn(process.execPath,['-e',launcher,JSON.stringify(args)],{env:{PATH:process.env.PATH,NODE_ENV:'development'},stdio:['ignore','pipe','ignore']});owner=launched;
  const exited=new Promise<void>(r=>owner!.once('exit',()=>r()));
  await new Promise<void>((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Owned child launch deadline')),15000);timer.unref();owner!.stdout!.on('data',chunk=>{output+=String(chunk);if(output.includes('launched\n')){clearTimeout(timer);resolve();}});owner!.once('error',reject);owner!.once('exit',()=>reject(Error('Owner exited before launch proof')));});
  launched.kill('SIGKILL');await exited;
  assert.equal((await docker('docker',['inspect','--format','{{.State.Running}}',container],{timeout:5000})).stdout.trim(),'true','Actual daemon child must survive killed owner.');
  await db.query("UPDATE media_jobs SET lease_until=clock_timestamp()-interval '1 second'WHERE workspace_id=$1 AND operation_id=$2",[w,op]);
  assert.equal((await scheduler.query('SELECT mailcraft_claim_media() job')).rows[0].job,null);
  const row=(await db.query('SELECT phase,lease_token FROM media_jobs WHERE workspace_id=$1 AND operation_id=$2',[w,op])).rows[0];
  assert.equal(row.phase,'blocked');assert.equal(row.lease_token,job.token);
  assert.equal((await scheduler.query('SELECT mailcraft_media_object_cleanup_candidates() objects')).rows[0].objects.length,0);
  assert.equal((await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1',[w])).rows[0].reserved,'41943040');
  assert.equal((await docker('docker',['inspect','--format','{{.State.Running}}',container],{timeout:5000})).stdout.trim(),'true');
  console.log('Actual killed owner + surviving isolated daemon child + expired SQL lease: no reclaim, blocked durable identity, reserved allowance retained PASS. No automatic reconciliation claimed.');
 }finally{
  owner?.kill('SIGKILL');
  if(container){await docker('docker',['rm','--force',container],{timeout:15000});await assert.rejects(docker('docker',['inspect',container],{timeout:5000}));console.log('Exact owned child force removal verified PASS.');}
  await Promise.all([scheduler.end(),db.end()]);
 }
});
console.log('Only generated lifecycle fixture database dropped PASS.');
