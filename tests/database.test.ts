import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import env from '@next/env';
import {randomUUID} from 'node:crypto';
env.loadEnvConfig(process.cwd());
const admin=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
const runtime=new pg.Pool({connectionString:process.env.DATABASE_URL});
after(async()=>{await admin.end();await runtime.end();});
test('actual runtime role has no RLS bypass and missing tenant context returns no content',async()=>{
 const role=(await runtime.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];assert.equal(role.rolsuper,false);assert.equal(role.rolbypassrls,false);assert.equal((await runtime.query('SELECT * FROM brands')).rowCount,0);await assert.rejects(runtime.query('SELECT * FROM auth_sessions'),/permission denied/);await assert.rejects(runtime.query('UPDATE schema_migrations SET version=version'),/permission denied/);
});
test('forced RLS and composite foreign keys prevent cross tenant reads and references',async()=>{
 const a=randomUUID(),b=randomUUID(),email=randomUUID();const c=await runtime.connect();
 await admin.query('INSERT INTO workspaces(id,name) VALUES($1,$3),($2,$3)',[a,b,'Isolation fixture']);await admin.query("INSERT INTO emails(workspace_id,id,title,spec,created_by) VALUES($1,$2,'private','{}','fixture')",[b,email]);
 try{await c.query('BEGIN');await c.query("SELECT set_config('app.workspace_id',$1,true)",[a]);assert.equal((await c.query('SELECT * FROM emails WHERE id=$1',[email])).rowCount,0);await assert.rejects(c.query("INSERT INTO revisions(workspace_id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by) VALUES($1,$2,1,'{}','','','h','{}','fixture')",[a,email]),/foreign key/);await c.query('ROLLBACK');}finally{c.release();await admin.query('DELETE FROM emails WHERE workspace_id=$1',[b]);await admin.query('DELETE FROM workspaces WHERE id IN($1,$2)',[a,b]);}
});
