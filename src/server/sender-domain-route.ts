import {z} from 'zod';
import {normalizeSender,SenderVersionInput,SenderCheckInput,SenderView,SenderVersionView,DNSCheckView} from '../domain/sender-domain';
import {withPrincipal,type Principal} from './auth';
import type {Tx} from './db';
import {assertCurrentAuthority} from './current-authority';
import {keyed} from './commands';
import {resourcePage} from './pagination';
import {audit} from './audit';
import {fail} from './errors';
import {observeSenderDNS} from './sender-dns';

const iso=(value:unknown)=>value instanceof Date?value.toISOString():value;
function senderView(row:Record<string,unknown>){
 return SenderView.parse({id:row.id,version:row.version,name:row.name,provider:row.provider,account_label:row.account_label,region:row.region,
  from_name:row.from_name,from_address:row.from_address,reply_to:row.reply_to,domain:row.domain,
  connection_status:row.connection_status,sending_enabled:row.sending_enabled,created_at:iso(row.created_at),updated_at:iso(row.updated_at)});
}
function checkView(row:Record<string,unknown>){return DNSCheckView.parse({id:row.id,sender_id:row.sender_id,sender_version:row.sender_version,observation:row.observation,created_by:row.created_by,created_at:iso(row.created_at)});}
function canonical(input:unknown){
 try{return normalizeSender(input);}catch(error){if(error instanceof z.ZodError)throw error;fail(422,'VALIDATION_FAILED','Use a valid public domain and one email address without control characters.');}
}
async function source(tx:Tx,id:string,lock=false){
 const row=(await tx.query('SELECT * FROM sender_identities WHERE id=$1'+(lock?' FOR UPDATE':''),[z.uuid().parse(id)])).rows[0];
 if(!row)fail(404,'RESOURCE_NOT_FOUND','Sender draft not found.');return row;
}
async function authority(tx:Tx,p:Principal,method:string){await assertCurrentAuthority(tx,p,'manage',p.api_key?(method==='GET'?'sender:read':'sender:write'):undefined);}

export async function senderDomainRoute(req:Request,path:string[],body:Record<string,unknown>,key:string|null){
 const [,id,command]=path,method=req.method;
 const parameters=new URL(req.url).searchParams;
 const allowed=method==='GET'&&(!id||command)?['limit','after','created_after','created_before']:[];
 for(const [name,value] of parameters){
  if(!allowed.includes(name)||!value||parameters.getAll(name).length!==1)fail(422,'VALIDATION_FAILED','Use only the documented nonempty query parameters once.');
 }
 return withPrincipal(req,'manage',async(tx,p)=>{
  const expectedActor=req.headers.get('x-actor-id');
  if(expectedActor!==null){z.string().min(1).parse(expectedActor);if(expectedActor!==p.user)fail(409,'ACTOR_CHANGED','Your signed-in account changed. Reload before recovering sender work.');}
  await authority(tx,p,method);
  if(method==='GET'){
   if(!id){const page=await resourcePage(req,tx,p,{resource:'sender-identities',from:'sender_identities',fields:'*'});await authority(tx,p,method);return {...page,data:page.data.map(senderView)};}
   const row=await source(tx,id);await authority(tx,p,method);
   if(!command)return {sender:senderView(row)};
   if(command==='versions'){
    // Version is the immutable key; use a deterministic internal UUID solely for signed paging.
    const position="('00000000-0000-4000-8000-'||lpad(to_hex(version),12,'0'))::uuid";
    const page=await resourcePage(req,tx,p,{resource:'sender-versions',from:'sender_identity_versions',fields:'*, '+position+' AS id',id:position,where:'sender_id=$1',values:[id],filters:{sender_id:id}});
    await authority(tx,p,method);return {...page,data:page.data.map(item=>SenderVersionView.parse({sender_id:item.sender_id,version:item.version,snapshot:item.snapshot,created_by:item.created_by,created_at:iso(item.created_at)}))};
   }
   const page=await resourcePage(req,tx,p,{resource:'sender-dns-checks',from:'domain_checks',fields:'*',where:'sender_id=$1',values:[id],filters:{sender_id:id}});
   await authority(tx,p,method);return {...page,data:page.data.map(checkView)};
  }
  const parsed=!id?canonical(body):command==='versions'?SenderVersionInput.parse(body):SenderCheckInput.parse(body);
  const input=id&&command==='versions'?{...canonical(Object.fromEntries(Object.entries(parsed).filter(([field])=>field!=='expected_version'))),expected_version:(parsed as z.infer<typeof SenderVersionInput>).expected_version}:parsed;
  const response=await keyed(tx,p,!id?'sender.create':'sender.'+command+':'+id,key,input,async()=>{
   await authority(tx,p,method);
   if(!id){
    const draft=input as ReturnType<typeof normalizeSender>;
    const row=(await tx.query('INSERT INTO sender_identities(workspace_id,name,provider,account_label,region,from_name,from_address,reply_to,domain,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',[p.workspace,draft.name,draft.provider,draft.account_label,draft.region,draft.from_name,draft.from_address,draft.reply_to,draft.domain,p.user])).rows[0];
    await audit(tx,p.workspace,p.user,'sender.draft_created',row.id);return {sender:senderView(row)};
   }
   const row=await source(tx,id,true);await authority(tx,p,method);
   if(row.version!==(input as {expected_version:number}).expected_version)fail(409,'VERSION_CONFLICT','The sender draft changed. Keep your edits and reload its current version.',{current_version:row.version});
   if(command==='versions'){
    const draft=input as ReturnType<typeof normalizeSender>;
    const fields=['name','provider','account_label','region','from_name','from_address','reply_to','domain'] as const;
    if(fields.every(field=>row[field]===draft[field]))return {sender:senderView(row),changed:false};
    if(row.version===2147483647)fail(409,'VERSION_LIMIT','Create a new sender draft because this version history reached its supported limit.');
    const updated=(await tx.query('UPDATE sender_identities SET name=$2,provider=$3,account_label=$4,region=$5,from_name=$6,from_address=$7,reply_to=$8,domain=$9,version=version+1 WHERE id=$1 AND version=$10 RETURNING *',[id,draft.name,draft.provider,draft.account_label,draft.region,draft.from_name,draft.from_address,draft.reply_to,draft.domain,row.version])).rows[0];
    await audit(tx,p.workspace,p.user,'sender.draft_changed',id);return {sender:senderView(updated),changed:true};
   }
   await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[p.workspace+':sender-dns-quota']);
   await authority(tx,p,method);
   const count=(await tx.query("SELECT count(*)::int AS count FROM domain_checks WHERE created_at>clock_timestamp()-interval '1 minute'",[])).rows[0].count;
   if(count>=10)fail(429,'RATE_LIMITED','This workspace has reached ten DNS checks per minute. Keep this command and retry later.',{retry_after:60});
   const observation=await observeSenderDNS(row.domain);
   await authority(tx,p,method);
   const check=(await tx.query('INSERT INTO domain_checks(workspace_id,sender_id,sender_version,observation,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *',[p.workspace,id,row.version,JSON.stringify(observation),p.user])).rows[0];
   await audit(tx,p.workspace,p.user,'sender.dns_observed',check.id);return {check:checkView(check)};
  });
  // An old command is only an original receipt; current authority still controls its disclosure.
  await authority(tx,p,method);return response;
 });
}
