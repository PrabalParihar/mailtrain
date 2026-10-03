import {z} from 'zod';
import {withPrincipal} from './auth';
import {fail} from './errors';
import {
  stageSubmissionLedger,submissionLedgerDetail,submissionLedgerList,
  submissionLedgerRecipients,cancelSubmissionLedger,
  deliveryDetail,deliveryHistory,deliveryAttempts,
} from './submission-ledgers';

export async function submissionLedgerRoute(
  req:Request,path:string[],body:Record<string,unknown>,key:string|null,
) {
  const [root,rawId,command]=path;
  const id=z.uuid().parse(rawId).toLowerCase();
  const paged=req.method==='GET'&&(
    root==='campaigns'||command==='recipients'||command==='history'||command==='attempts'
  );
  const allowed=paged?['limit','after','created_after','created_before',...(command==='recipients'?['state']:[])]:[];
  const parameters=new URL(req.url).searchParams;
  for(const [name,value]of parameters)
    if(!allowed.includes(name)||!value||parameters.getAll(name).length!==1)
      fail(422,'VALIDATION_FAILED','Use only the documented nonempty ledger parameters once.');
  return withPrincipal(req,'audience',async(tx,p)=>{
    const actor=req.headers.get('x-actor-id');
    if(actor!==null&&actor!==p.user)
      fail(409,'ACTOR_CHANGED','Your signed-in account changed. Reload before recovering staged work.');
    if(root==='campaigns')
      return req.method==='POST'
        ?stageSubmissionLedger(tx,p,id,body,key)
        :submissionLedgerList(req,tx,p,id);
    if(root==='submission-ledgers'){
      if(command==='cancel'){
        z.strictObject({}).parse(body);
        return cancelSubmissionLedger(tx,p,id,key);
      }
      return command==='recipients'
        ?submissionLedgerRecipients(req,tx,p,id)
        :submissionLedgerDetail(tx,p,id);
    }
    if(command==='history')return deliveryHistory(req,tx,p,id);
    if(command==='attempts')return deliveryAttempts(req,tx,p,id);
    return deliveryDetail(tx,p,id);
  });
}
