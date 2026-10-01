import {randomBytes} from 'node:crypto';
import pg from 'pg';
import {cookies} from 'next/headers';
import {auth} from '@clerk/nextjs/server';
import {digest} from './audit';
import {sessionQuery,userQuery,tenant,type Tx} from './db';
import {fail} from './errors';
import {allowed,type Role,type Action} from '../domain/permissions';
export type Principal={user:string,workspace:string,role:Role};
export function localMode(){return process.env.LOCAL_DEVELOPMENT==='true'&&process.env.NODE_ENV!=='production'&&['localhost','127.0.0.1'].includes(new URL(process.env.APP_ORIGIN??'http://invalid').hostname);}
export function checkOrigin(request:Request){if(!['GET','HEAD'].includes(request.method)){const origin=request.headers.get('origin');if(origin!==process.env.APP_ORIGIN)fail(403,'ORIGIN_DENIED','The request origin is not authorized.');}}
export async function identity(){
 if(localMode()){const value=(await cookies()).get('mailcraft_local_session')?.value;if(!value)return null;const row=(await sessionQuery('SELECT mailcraft_local_identity($1) AS user_id',[digest(value)])).rows[0];return row?.user_id??null;}
 if(!process.env.CLERK_SECRET_KEY||!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)return null;
 return (await auth()).userId;
}
export async function principal(request:Request,action:Action):Promise<Principal>{
 const user=await identity();if(!user)fail(401,'AUTH_REQUIRED','Sign in to continue.');const workspace=request.headers.get('x-workspace-id');if(!workspace||!/^[-\da-f]{36}$/i.test(workspace))fail(400,'WORKSPACE_REQUIRED','Select a valid workspace.');
 const membership=await userQuery(user,async tx=>(await tx.query('SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2 AND status=$3',[workspace,user,'active'])).rows[0]);if(!membership)fail(404,'RESOURCE_NOT_FOUND','Workspace not found.');if(!allowed(membership.role,action))fail(403,'INSUFFICIENT_SCOPE','Your role cannot perform this action.');
 const active=await tenant(workspace,user,async tx=>(await tx.query('SELECT status FROM workspaces WHERE id=$1',[workspace])).rows[0]);if(active?.status!=='active')fail(409,'WORKSPACE_LOCKED','This workspace cannot accept new work.');return {user,workspace,role:membership.role};
}
export async function withPrincipal<T>(request:Request,action:Action,fn:(tx:Tx,p:Principal)=>Promise<T>){const p=await principal(request,action);return tenant(p.workspace,p.user,tx=>fn(tx,p));}
export async function localBootstrap(secret:string){
 if(!localMode()||!process.env.LOCAL_BOOTSTRAP_SECRET||digest(secret)!==digest(process.env.LOCAL_BOOTSTRAP_SECRET))fail(403,'LOCAL_SETUP_DENIED','Local setup is disabled or the local access key is incorrect.');
 const c=new pg.Client({connectionString:process.env.MIGRATION_DATABASE_URL});await c.connect();try{await c.query('BEGIN');let w=(await c.query("SELECT w.id FROM workspaces w JOIN memberships m ON m.workspace_id=w.id WHERE m.user_id='local-owner' ORDER BY w.created_at LIMIT 1")).rows[0];if(!w){w=(await c.query("INSERT INTO workspaces(name) VALUES('My brand workspace') RETURNING id")).rows[0];await c.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,'local-owner','Owner')",[w.id]);}const token=randomBytes(32).toString('hex');await c.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,'local-owner',now()+interval '8 hours')",[digest(token)]);await c.query('COMMIT');return {token,workspace:w.id};}catch(e){await c.query('ROLLBACK');throw e;}finally{await c.end();}
}
