import { z } from 'zod';
import { RecipientAssessmentInput, RecipientAssessmentView, RecipientObservationView, RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS } from '../domain/recipient-assessments';
import { campaignCanonicalJSON } from '../domain/campaign-configuration';
import type { Tx } from './db';
import type { Principal } from './auth';
import { assertCurrentAuthority } from './current-authority';
import { audienceSnapshotBinding } from './audience-snapshots';
import { keyed } from './commands';
import { fail } from './errors';
import { resourcePage } from './pagination';

const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value;
const from = 'recipient_assessments a JOIN recipient_assessment_jobs j ON j.workspace_id=a.workspace_id AND j.id=a.id';
const fields = 'a.*,j.status,j.processed_count,j.checks_clear_count,j.excluded_count,j.updated_at,j.completed_at';
export async function assertAssessmentAuthority(tx: Tx,p: Principal,write: boolean) {
  await assertCurrentAuthority(tx,p,'audience',p.api_key?'audience:read':undefined);
  await assertCurrentAuthority(tx,p,write?'edit':'read',p.api_key?(write?'campaigns:write':'campaigns:read'):undefined);
}
export function recipientAssessmentView(row: Record<string,unknown>) {
  return RecipientAssessmentView.parse({id:row.id,campaign_id:row.campaign_id,configuration_id:row.configuration_id,
    configuration_version:row.configuration_version,configuration_digest:row.configuration_digest,revision_id:row.revision_id,
    snapshot_id:row.snapshot_id,topic_id:row.topic_id,status:row.status,total_count:row.total_count,
    processed_count:row.processed_count,checks_clear_count:row.checks_clear_count,excluded_count:row.excluded_count,
    created_at:iso(row.created_at),updated_at:iso(row.updated_at),completed_at:iso(row.completed_at),rule_version:row.rule_version,
    authorization_issued:false,global_blockers:RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS,created_by:row.created_by,created_api_key_id:row.created_api_key_id});
}
async function detail(tx: Tx,id: string) {
  const row=(await tx.query(`SELECT ${fields} FROM ${from} WHERE a.id=$1`,[z.uuid().parse(id)])).rows[0];
  if(!row) fail(404,'RESOURCE_NOT_FOUND','Assessment not found.');
  return {assessment:recipientAssessmentView(row)};
}
export async function assessmentDetail(tx: Tx,p: Principal,id: string) {
  await assertAssessmentAuthority(tx,p,false);return detail(tx,id);
}
export async function prepareRecipientAssessment(tx: Tx,p: Principal,campaign: string,body: unknown,key: string|null) {
  const input=RecipientAssessmentInput.parse(body);z.uuid().parse(campaign);
  await assertAssessmentAuthority(tx,p,true);
  return keyed(tx,p,'recipient-assessment.create:'+campaign,key,campaignCanonicalJSON(input),async()=>{
    const c=(await tx.query('SELECT * FROM campaigns WHERE id=$1 FOR UPDATE',[campaign])).rows[0];
    if(!c) fail(404,'RESOURCE_NOT_FOUND','Campaign not found.');
    if(c.version!==input.expected_version) fail(409,'VERSION_CONFLICT','The campaign configuration changed. Reload before creating a new assessment.',{current_version:c.version});
    if(c.digest!==input.expected_digest) fail(409,'DIGEST_CONFLICT','The campaign configuration digest changed. Reload before creating a new assessment.');
    const configuration=(await tx.query('SELECT * FROM campaign_revisions WHERE campaign_id=$1 AND revision_no=$2',[campaign,c.version])).rows[0];
    if(!configuration || configuration.digest!==c.digest || configuration.revision_id!==c.revision_id || campaignCanonicalJSON(configuration.intent)!==campaignCanonicalJSON(c.intent))
      fail(409,'CONFIGURATION_INVALID','The immutable campaign configuration cannot be verified.');
    if(!c.audience_snapshot_id) fail(409,'AUDIENCE_SNAPSHOT_REQUIRED','Choose a frozen audience snapshot before creating an assessment.');
    const binding=await audienceSnapshotBinding(tx,c.audience_snapshot_id);
    if(campaignCanonicalJSON(binding.pointer)!==campaignCanonicalJSON(c.intent.audience_snapshot) || campaignCanonicalJSON(binding.members)!==campaignCanonicalJSON(c.intent.audience))
      fail(409,'SNAPSHOT_INVALID','The campaign audience snapshot cannot be verified.');
    if(input.topic_id && !(await tx.query('SELECT id FROM lists WHERE id=$1',[input.topic_id])).rowCount) fail(404,'RESOURCE_NOT_FOUND','Topic not found.');
    const row=(await tx.query('INSERT INTO recipient_assessments(workspace_id,campaign_id,configuration_id,configuration_version,configuration_digest,revision_id,snapshot_id,topic_id,members,total_count,created_by,created_api_key_id)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)RETURNING id',
      [p.workspace,campaign,configuration.id,c.version,c.digest,c.revision_id,binding.pointer.id,input.topic_id,JSON.stringify(binding.members),binding.members.length,p.api_key?.delegator??p.user,p.api_key?.id??null])).rows[0];
    await tx.query('INSERT INTO recipient_assessment_jobs(workspace_id,id)VALUES($1,$2)',[p.workspace,row.id]);
    return detail(tx,row.id);
  });
}
function pageQuery(req: Request) {
  const seen=new Set<string>();
  for(const [key,value] of new URL(req.url).searchParams) {
    if(!['limit','after','created_after','created_before'].includes(key)||seen.has(key)||!value) fail(422,'QUERY_INVALID','Use supported assessment parameters once with explicit values.');seen.add(key);
  }
}
export async function assessmentHistory(req: Request,tx: Tx,p: Principal,campaign: string) {
  await assertAssessmentAuthority(tx,p,false);pageQuery(req);z.uuid().parse(campaign);
  if(!(await tx.query('SELECT id FROM campaigns WHERE id=$1',[campaign])).rowCount) fail(404,'RESOURCE_NOT_FOUND','Campaign not found.');
  const page=await resourcePage(req,tx,p,{resource:'recipient-assessments',from,fields,created:'a.created_at',id:'a.id',where:'a.campaign_id=$1',values:[campaign],filters:{campaign_id:campaign}});
  return {...page,data:page.data.map(recipientAssessmentView)};
}
export async function assessmentObservations(req: Request,tx: Tx,p: Principal,id: string) {
  await assertAssessmentAuthority(tx,p,false);pageQuery(req);await detail(tx,id);
  const page=await resourcePage(req,tx,p,{resource:'recipient-observations',from:'recipient_observations',fields:'*',created:'observed_at',where:'assessment_id=$1',values:[id],filters:{assessment_id:id}});
  return {...page,data:page.data.map(row=>{const {workspace_id: _workspace,...observation}=row;void _workspace;return RecipientObservationView.parse({...observation,observed_at:iso(row.observed_at)});})};
}
export async function cancelRecipientAssessment(tx: Tx,p: Principal,id: string,key: string|null) {
  await assertAssessmentAuthority(tx,p,true);z.uuid().parse(id);
  return keyed(tx,p,'recipient-assessment.cancel:'+id,key,{},async()=>{
    const row=(await tx.query('SELECT id,status FROM recipient_assessment_jobs WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if(!row) fail(404,'RESOURCE_NOT_FOUND','Assessment not found.');
    if(['queued','running'].includes(row.status)) await tx.query("UPDATE recipient_assessment_jobs SET status='cancelled' WHERE id=$1",[id]);
    return detail(tx,id);
  });
}
