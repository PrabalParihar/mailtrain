import {z} from 'zod';
import {withPrincipal} from './auth';
import {fail} from './errors';
import {localeReviewHistory,recordLocaleReview} from './locale-content-review';

export async function localeContentReviewRoute(req:Request,id:string,body:Record<string,unknown>,key:string|null){
  const parameters=new URL(req.url).searchParams;
  const allowed=req.method==='GET'?['limit','after','created_after','created_before']:[];
  for(const [name,value]of parameters)
    if(!allowed.includes(name)||!value||parameters.getAll(name).length!==1)fail(422,'VALIDATION_FAILED','Use only documented nonempty review parameters once.');
  return withPrincipal(req,req.method==='GET'?'read':'edit',async(tx,p)=>{
    const actor=req.headers.get('x-actor-id');
    if(actor!==null&&actor!==p.user)fail(409,'ACTOR_CHANGED','The signed-in account changed. Reload the locale review.');
    if(req.method==='GET')return localeReviewHistory(req,tx,p,id);
    const raw=req.headers.get('if-match');
    if(!raw||!/^(?:"draft-[1-9][0-9]*"|draft-[1-9][0-9]*)$/.test(raw))fail(428,'VERSION_REQUIRED','Supply the acknowledged If-Match draft version.');
    const version=z.number().int().min(1).max(2147483647).parse(Number(raw.replaceAll('"','').slice(6)));
    return recordLocaleReview(tx,p,id,version,body,key);
  });
}
