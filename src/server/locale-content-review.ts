import {z} from 'zod';
import type {Tx} from './db';
import type {Principal} from './auth';
import {assertCurrentAuthority} from './current-authority';
import {emailLineage} from './emails';
import {keyed} from './commands';
import {audit} from './audit';
import {resourcePage} from './pagination';
import {fail} from './errors';
import {LocaleReviewInput,LocaleReviewContext,LocaleReviewRecord,reviewApplicability} from '../domain/locale-content-review';

const fields='h.id,h.email_id,h.revision_id,r.revision_no,r.source_doc_version AS target_doc_version,h.source_revision_id,s.revision_no AS source_revision_no,h.observed_source_doc_version,h.outcome,h.note,h.created_by,h.created_at';
const from='locale_content_reviews h JOIN revisions r ON r.workspace_id=h.workspace_id AND r.id=h.revision_id JOIN revisions s ON s.workspace_id=h.workspace_id AND s.id=h.source_revision_id';
function view(row:Record<string,unknown>){return LocaleReviewRecord.parse({...row,created_at:row.created_at instanceof Date?row.created_at.toISOString():row.created_at});}

export async function localeReviewContext(tx:Tx,p:Principal,id:string,write=false){
  await assertCurrentAuthority(tx,p,write?'edit':'read',p.api_key?(write?'emails:write':'emails:read'):undefined);
  const emailId=z.uuid().parse(id).toLowerCase();
  const target=(await tx.query('SELECT id,doc_version FROM emails WHERE id=$1 FOR SHARE',[emailId])).rows[0];
  if(!target)fail(404,'RESOURCE_NOT_FOUND','Locale draft not found.');
  const lineage=await emailLineage(tx,emailId);
  if(lineage?.kind!=='locale')fail(409,'LOCALE_DRAFT_REQUIRED','Choose a linked locale draft for language review.');
  const parent=(await tx.query('SELECT doc_version FROM emails WHERE id=$1 FOR SHARE',[lineage.source_email_id])).rows[0];
  if(!parent)fail(404,'RESOURCE_NOT_FOUND','Source draft not found.');
  const revision=(await tx.query('SELECT id,revision_no,source_doc_version FROM revisions WHERE email_id=$1 AND source_doc_version=$2 ORDER BY revision_no DESC LIMIT 1',[emailId,target.doc_version])).rows[0]??null;
  return LocaleReviewContext.parse({workspace_id:p.workspace,actor_id:p.user,email_id:emailId,doc_version:target.doc_version,
    source_email_id:lineage.source_email_id,source_revision_id:lineage.source_revision_id,source_revision_no:lineage.source_revision_no,
    source_doc_version:lineage.source_doc_version,current_source_doc_version:parent.doc_version,target_revision:revision});
}

export async function recordLocaleReview(tx:Tx,p:Principal,id:string,version:number,input:unknown,key:string|null){
  const emailId=z.uuid().parse(id).toLowerCase(),value=LocaleReviewInput.parse(input);
  await assertCurrentAuthority(tx,p,'edit',p.api_key?'emails:write':undefined);
  return keyed(tx,p,'email.locale_review:'+emailId,key,{version,...value},async()=>{
    const context=await localeReviewContext(tx,p,emailId,true);
    if(context.doc_version!==version)fail(412,'VERSION_MISMATCH','The locale draft changed. Save and checkpoint its current version before reviewing.');
    if(context.source_revision_id!==value.source_revision_id||context.current_source_doc_version!==value.expected_source_doc_version)
      fail(409,'LOCALE_SOURCE_CHANGED','The source changed. Refresh the review history and compare the source before recording this review.');
    const revision=(await tx.query('SELECT id FROM revisions WHERE id=$1 AND email_id=$2 AND source_doc_version=$3',[value.revision_id,emailId,version])).rows[0];
    if(!revision)fail(409,'LOCALE_CHECKPOINT_REQUIRED','Create a checkpoint of the current saved locale draft before recording a review.');
    const row=(await tx.query(`INSERT INTO locale_content_reviews(workspace_id,email_id,revision_id,source_revision_id,observed_source_doc_version,outcome,note,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,[p.workspace,emailId,value.revision_id,value.source_revision_id,value.expected_source_doc_version,value.outcome,value.note,p.user])).rows[0];
    const review=view((await tx.query(`SELECT ${fields} FROM ${from} WHERE h.id=$1`,[row.id])).rows[0]);
    await audit(tx,p.workspace,p.user,'email.locale_content_review_recorded',review.id);
    return {review};
  });
}

export async function localeReviewHistory(req:Request,tx:Tx,p:Principal,id:string){
  const context=await localeReviewContext(tx,p,id);
  const page=await resourcePage(req,tx,p,{resource:'locale-reviews',from,fields,created:'h.created_at',id:'h.id',where:'h.email_id=$1',values:[context.email_id],filters:{email:context.email_id}});
  return {...page,context,data:page.data.map(row=>{const item=view(row);return {...item,applicability:reviewApplicability(item.target_doc_version,item.observed_source_doc_version,context.doc_version,context.current_source_doc_version)};})};
}
