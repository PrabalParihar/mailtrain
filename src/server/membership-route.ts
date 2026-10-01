import { auth } from '@clerk/nextjs/server';
import { localMode,withPrincipal,type Principal } from './auth';
import { fail } from './errors';
import { resourcePage } from './pagination';
import { keyed } from './commands';
import { changeMembership,readMembershipSummary } from './memberships';
import { recentMfa } from '../domain/memberships';
async function requireMembershipMfa(p:Principal){
 if(localMode())return; // Guarded loopback development only, never real MFA evidence.
 const verified=await auth();
 if(verified.userId!==p.user||verified.actor||!recentMfa(verified.factorVerificationAge))
  fail(403,'RECENT_MFA_REQUIRED','Verify both authentication factors recently before changing members.');
}
export async function membershipRoute(req:Request,path:string[],body:Record<string,unknown>,key:string|null){
 if(req.headers.has('authorization'))fail(403,'SESSION_REQUIRED','Manage members with a signed-in session.');
 const[root,id,command]=path;
 return withPrincipal(req,'manage',async(tx,p)=>{
  if(req.method==='GET'){
   if(id==='summary')return{summary:{...await readMembershipSummary(tx,p),mfa_mode:localMode()?'local-development':'verified-session-required'}};
   return resourcePage(req,tx,p,root==='membership-changes'?{resource:'membership-changes',from:'membership_changes',fields:'*'}:{resource:'memberships',from:'memberships',fields:'workspace_id,id,user_id,role,status,version,created_at,revoked_at',where:'workspace_id=$1',values:[p.workspace]});
  }
  if(!id||!['role','remove','transfer-owner'].includes(command))fail(404,'RESOURCE_NOT_FOUND','Member action not found.');
  await requireMembershipMfa(p);
  return keyed(tx,p,'membership.'+command+':'+id,key,body,()=>changeMembership(tx,p,id,command as'role'|'remove'|'transfer-owner',body));
 },{workspaceLock:req.method==='GET'?'shared':'exclusive'});
}
