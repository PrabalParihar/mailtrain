import {z} from 'zod';
import type {Tx} from './db';
import type {Principal} from './auth';
import {SaveEmailTemplateInput,ArchiveEmailTemplateInput,RemixEmailTemplateInput,EmailTemplateViewSchema,type EmailTemplateView} from '../domain/email-templates';
import {assertCurrentAuthority} from './current-authority';
import {keyed} from './commands';
import {resourcePage} from './pagination';
import {deriveEmail} from './derivation';
import {audit} from './audit';
import {fail} from './errors';
const identity=z.uuid().transform(value=>value.toLowerCase());
const fields='id,name,state,version,source_revision_id,source_email_id,source_revision_no,source_doc_version,source_title,artifact_hash,brand_kit_version_id,locale,direction,editing_mode,created_at,archived_at';
function view(row:Record<string,unknown>):EmailTemplateView{
 return EmailTemplateViewSchema.parse({...row,created_at:row.created_at instanceof Date?row.created_at.toISOString():row.created_at,archived_at:row.archived_at instanceof Date?row.archived_at.toISOString():row.archived_at});
}
async function authority(tx:Tx,p:Principal,write=false){return assertCurrentAuthority(tx,p,write?'edit':'read',write?'emails:write':'emails:read');}
async function read(tx:Tx,id:string,lock=false){
 const row=(await tx.query(`SELECT ${fields} FROM email_templates WHERE id=$1${lock?' FOR UPDATE':''}`,[id])).rows[0];
 if(!row)fail(404,'RESOURCE_NOT_FOUND','Template not found in this workspace.');
 return view(row);
}
export async function listEmailTemplates(req:Request,tx:Tx,p:Principal){
 await authority(tx,p);
 const state=z.enum(['active','archived']).parse(new URL(req.url).searchParams.get('state')??'active');
 const page=await resourcePage(req,tx,p,{resource:'email-templates',from:'email_templates',fields,where:'state=$1',values:[state],filters:{state}});
 return {...page,data:page.data.map(view)};
}
export async function getEmailTemplate(tx:Tx,p:Principal,id:string){await authority(tx,p);return {template:await read(tx,identity.parse(id))};}
export async function saveEmailTemplate(tx:Tx,p:Principal,input:unknown,key:string|null){
 const value=SaveEmailTemplateInput.parse(input);await authority(tx,p,true);
 return keyed(tx,p,'template.save',key,value,async()=>{
  const source=(await tx.query('SELECT artifact_hash FROM revisions WHERE id=$1',[value.source_revision_id])).rows[0];
  if(!source)fail(404,'RESOURCE_NOT_FOUND','Source revision not found in this workspace.');
  if(source.artifact_hash!==value.expected_artifact_hash)fail(409,'TEMPLATE_ARTIFACT_MISMATCH','The selected artifact does not match this revision.');
  const row=(await tx.query(`INSERT INTO email_templates(workspace_id,name,source_revision_id,artifact_hash,created_by)VALUES($1,$2,$3,$4,$5)RETURNING ${fields}`,[p.workspace,value.name,value.source_revision_id,value.expected_artifact_hash,p.user])).rows[0];
  const template=view(row);await audit(tx,p.workspace,p.user,'email.template_saved',template.id);return {template};
 });
}
export async function archiveEmailTemplate(tx:Tx,p:Principal,id:string,input:unknown,key:string|null){
 const templateId=identity.parse(id),value=ArchiveEmailTemplateInput.parse(input);await authority(tx,p,true);
 return keyed(tx,p,'template.archive:'+templateId,key,value,async()=>{
  const old=await read(tx,templateId,true);
  if(old.version!==value.expected_version)fail(412,'VERSION_MISMATCH','The template changed. Refresh its metadata.');
  if(old.state!=='active')fail(409,'TEMPLATE_ARCHIVED','This template is already archived.');
  const row=(await tx.query(`UPDATE email_templates SET state='archived',version=2,archived_at=clock_timestamp() WHERE id=$1 RETURNING ${fields}`,[templateId])).rows[0];
  const template=view(row);await audit(tx,p.workspace,p.user,'email.template_archived',templateId);return {template};
 });
}
export async function remixEmailTemplate(tx:Tx,p:Principal,id:string,input:unknown,key:string|null){
 const templateId=identity.parse(id),value=RemixEmailTemplateInput.parse(input);await authority(tx,p,true);
 return keyed(tx,p,'template.remix:'+templateId,key,value,async()=>{
  const template=await read(tx,templateId,true);
  if(template.state!=='active')fail(409,'TEMPLATE_ARCHIVED','Archived templates cannot create new drafts.');
  if(template.version!==value.expected_version)fail(412,'VERSION_MISMATCH','The template changed. Refresh its metadata.');
  if(template.artifact_hash!==value.expected_artifact_hash)fail(409,'TEMPLATE_ARTIFACT_MISMATCH','The selected artifact does not match this template.');
  const result=await deriveEmail(tx,p,template.source_revision_id,{kind:'remix',title:value.title});
  // The initial response uses the same JSON representation as its durable receipt.
  return JSON.parse(JSON.stringify(result)) as Awaited<ReturnType<typeof deriveEmail>>;
 });
}
