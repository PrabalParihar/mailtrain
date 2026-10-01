import pg from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import env from '@next/env';
env.loadEnvConfig(process.cwd());
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:10});
export const orm=drizzle(pool);
export type Tx=pg.PoolClient;
export async function tenant<T>(workspace:string,user:string,fn:(tx:Tx)=>Promise<T>):Promise<T>{
 const c=await pool.connect();try{await c.query('BEGIN');await c.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[workspace,user]);const v=await fn(c);await c.query('COMMIT');return v;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
export async function userQuery<T>(user:string,fn:(tx:Tx)=>Promise<T>){return tenant('',user,fn);}
export async function sessionQuery(sql:string,params:unknown[]){return pool.query(sql,params);}
export function closeDb(){return pool.end();}
