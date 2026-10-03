import type{Tx}from'./db';import type{Principal}from'./auth';import type{z}from'zod';
import{RevisionComparisonQuery,RevisionComparisonSchema}from'../domain/revision-comparison';import{assertCurrentAuthority}from'./current-authority';import{fail}from'./errors';
export async function compareRevisions(tx:Tx,p:Principal,value:z.infer<typeof RevisionComparisonQuery>){
 const parsed=RevisionComparisonQuery.parse(value),input={email_id:parsed.email_id.toLowerCase(),before:parsed.before.toLowerCase(),after:parsed.after.toLowerCase()};
 await assertCurrentAuthority(tx,p,'read',p.api_key?'emails:read':undefined);
 const rows=(await tx.query('SELECT id,email_id,revision_no,source_doc_version,artifact_hash,created_at,raw_source_profile,spec FROM revisions WHERE workspace_id=$1 AND email_id=$2 AND id=ANY($3::uuid[])',[p.workspace,input.email_id,[input.before,input.after]])).rows;
 const before=rows.find(r=>r.id===input.before),after=rows.find(r=>r.id===input.after);if(!before||!after)fail(404,'RESOURCE_NOT_FOUND','Choose two available checkpoints from this email.');
 if(Buffer.byteLength(JSON.stringify([before,after]))>8*1024*1024)fail(413,'REVISION_COMPARISON_TOO_LARGE','The two checkpoint documents exceed the comparison budget. Exact source and your current draft remain intact.');
 await assertCurrentAuthority(tx,p,'read',p.api_key?'emails:read':undefined);
 const normalized=(r:typeof before)=>({...r,created_at:new Date(r.created_at).toISOString()});
 return RevisionComparisonSchema.parse({workspace_id:p.workspace,actor_id:p.user,email_id:input.email_id,before:normalized(before),after:normalized(after)});
}
