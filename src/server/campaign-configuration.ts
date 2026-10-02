import{z}from'zod';import{CampaignConfigurationInput,CampaignTimingError,ResolvedCampaignTimingSchema,resolveCampaignTiming,campaignCanonicalJSON}from'../domain/campaign-configuration';
import type{Tx}from'./db';import type{Principal}from'./auth';import{assertCurrentAuthority}from'./current-authority';import{audit,digest}from'./audit';import{keyed}from'./commands';import{fail}from'./errors';import{resourcePage}from'./pagination';
export async function campaignDetail(tx:Tx,id:string){const campaign=(await tx.query('SELECT * FROM campaigns WHERE id=$1',[z.uuid().parse(id)])).rows[0];if(!campaign)fail(404,'RESOURCE_NOT_FOUND','Campaign not found.');return{campaign};}
export async function campaignConfigurations(req:Request,tx:Tx,p:Principal,id:string){await campaignDetail(tx,id);const page=await resourcePage(req,tx,p,{resource:'campaign-configurations',from:'campaign_revisions',fields:'*',created:'captured_at',where:'campaign_id=$1',values:[id],filters:{campaign_id:id}});return{...page,data:page.data.map(row=>{
 const intent=row.intent&&typeof row.intent==='object'&&!Array.isArray(row.intent)?row.intent as Record<string,unknown>:{},audience=Array.isArray(intent.audience)?intent.audience:[],timing=ResolvedCampaignTimingSchema.safeParse(intent.planned_timing);
 return{id:row.id,campaign_id:row.campaign_id,revision_no:row.revision_no,name:row.name,revision_id:row.revision_id,artifact_hash:typeof intent.artifact_hash==='string'&&/^[0-9a-f]{64}$/.test(intent.artifact_hash)?intent.artifact_hash:null,planned_timing:timing.success?timing.data:null,audience_count:audience.length,eligible_count:audience.filter(item=>item&&typeof item==='object'&&item.eligible===true).length,digest:row.digest,actor_id:row.actor_id,captured_at:row.captured_at,origin:row.origin};
 })};}
export async function configureCampaign(tx:Tx,p:Principal,id:string,body:unknown,key:string|null){
 const input=CampaignConfigurationInput.parse(body);z.uuid().parse(id);
 const response=await keyed(tx,p,'campaign.configuration:'+id,key,campaignCanonicalJSON(input),async()=>{
  const c=(await tx.query('SELECT * FROM campaigns WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!c)fail(404,'RESOURCE_NOT_FOUND','Campaign not found.');
  // Passive expiry advances while a row lock waits, even though revocation locks are held.
  await assertCurrentAuthority(tx,p,'edit',p.api_key?'campaigns:write':undefined);
  if(c.version!==input.expected_version)fail(409,'VERSION_CONFLICT','The campaign configuration changed. Keep your edits and reload the current version before saving.',{current_version:c.version});
  if(!['draft','review_pending'].includes(c.state))fail(409,'STATE_CONFLICT','Only draft or review-pending campaigns can change configuration.');
  let planned_timing=null;try{planned_timing=input.planned_timing?resolveCampaignTiming(input.planned_timing):null;}catch(error){if(error instanceof CampaignTimingError)fail(422,error.code,error.message,{field:error.field});throw error;}
  const revision=(await tx.query('SELECT id,artifact_hash FROM revisions WHERE id=$1',[input.revision_id])).rows[0];if(!revision)fail(404,'RESOURCE_NOT_FOUND','Revision not found.');
  if(c.name===input.name&&c.revision_id===revision.id&&c.intent.artifact_hash===revision.artifact_hash&&campaignCanonicalJSON(c.intent.planned_timing??null)===campaignCanonicalJSON(planned_timing))return{campaign:c,changed:false,notice:'Configuration is unchanged. Planned timing does not schedule delivery.'};
  const intent={...c.intent,revision_id:revision.id,artifact_hash:revision.artifact_hash,planned_timing},hash=digest(campaignCanonicalJSON({configuration_version:c.version+1,name:input.name,revision_id:revision.id,intent}));
  const campaign=(await tx.query("UPDATE campaigns SET name=$2,revision_id=$3,intent=$4,digest=$5,version=version+1,state='draft',approval=NULL WHERE id=$1 AND version=$6 RETURNING *",[id,input.name,revision.id,JSON.stringify(intent),hash,input.expected_version])).rows[0];
  if(!campaign)fail(409,'VERSION_CONFLICT','The campaign configuration changed. Reload before saving.');
  await audit(tx,p.workspace,p.user,'campaign.configuration_changed',id);
  return{campaign,changed:true,notice:'Draft configuration saved. Review must be requested again. Planned timing does not schedule delivery.'};
 });
 await assertCurrentAuthority(tx,p,'edit',p.api_key?'campaigns:write':undefined);
 return response;
}
