import assert from 'node:assert/strict';
import type pg from 'pg';
import type {Page} from 'playwright';
/** Owned test seeding must carry the actual actor/workspace provenance context. */
export async function sourceFixtureQuery(db:pg.Pool,workspace:string,actor:string,sql:string,values:unknown[]){
 assert.equal(process.env.LOCAL_DEVELOPMENT,'true');assert.ok(actor&&/^[a-f0-9-]{36}$/.test(workspace));
 const url=new URL(db.options.connectionString!);assert.ok(['127.0.0.1','localhost'].includes(url.hostname));
 const c=await db.connect();try{await c.query('BEGIN');await c.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[workspace,actor]);const result=await c.query(sql,values);await c.query('COMMIT');return result;}catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
}
export async function waitSourceDraft(page:Page,scope:{workspace:string;actor:string;email:string},field:'raw_html'|'subject',expected:string){
 await page.waitForFunction(async({key,field,expected})=>new Promise<boolean>(resolve=>{const request=indexedDB.open('lettercape-source-recovery-1',1);request.onerror=()=>resolve(false);request.onsuccess=()=>{const db=request.result;if(!db.objectStoreNames.contains('slots')){db.close();resolve(false);return;}const tx=db.transaction('slots','readonly'),get=tx.objectStore('slots').get(key);get.onsuccess=()=>{const equal=get.result?.draft?.spec?.[field]===expected;db.close();resolve(equal);};get.onerror=()=>{db.close();resolve(false);};};}),{key:JSON.stringify([scope.workspace,scope.actor,scope.email]),field,expected});
}
