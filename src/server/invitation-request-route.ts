import {z}from'zod';import {withPrincipal}from'./auth';import {fail}from'./errors';
import {createInvitationRequest,changeInvitationRequest,invitationRequest,invitationRequestPage,invitationPlanningContext}from'./invitation-requests';import{invitationRefusal}from'../domain/invitation-requests';
export async function invitationRequestRoute(req:Request,path:string[],body:Record<string,unknown>,key:string|null){
 if(req.headers.has('authorization'))fail(403,'SESSION_REQUIRED','Manage invitation planning with a signed-in manager session.');
 const [,id,command]=path,parameters=new URL(req.url).searchParams,allowed=req.method==='GET'&&(!id||command==='history')?['limit','after','created_after','created_before']:[];
 for(const [name,value]of parameters)if(!allowed.includes(name)||!value||parameters.getAll(name).length!==1)fail(422,'VALIDATION_FAILED','Use documented nonempty planning parameters once.');
 return withPrincipal(req,'manage',async(tx,p)=>{
  const actor=req.headers.get('x-actor-id');if(actor!==null&&actor!==p.user)fail(409,'ACTOR_CHANGED','The signed-in account changed. Reload planning before continuing.');
  if(req.method==='GET'){
   if(id==='readiness')return{context:await invitationPlanningContext(tx,p)};
   if(!id)return invitationRequestPage(req,tx,p);
   if(command==='history')return invitationRequestPage(req,tx,p,id);
   return invitationRequest(tx,p,id);
  }
  if(!id)return createInvitationRequest(tx,p,body,key);
  if(command==='send'||command==='accept'){z.object({}).strict().parse(body);await invitationRequest(tx,p,id);const refused=invitationRefusal(command);fail(409,refused.code,refused.message);}
  return changeInvitationRequest(tx,p,id,command as'update'|'withdraw'|'reopen',body,key);
 },{workspaceLock:req.method==='GET'?'shared':'exclusive'});
}
