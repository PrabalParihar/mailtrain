import { CalendarMonth, CalendarEntry, WorkspacePreferences, WorkspaceTimezoneInput, validateDisplayTimeZone, formatCalendarInstant } from '../domain/workspace-calendar';
import { campaignCanonicalJSON } from '../domain/campaign-configuration';
import type { Tx } from './db';
import type { Principal } from './auth';
import { withPrincipal } from './auth';
import { fail } from './errors';
import { keyed } from './commands';
import { resourcePage } from './pagination';
import { audit } from './audit';
import { assertCurrentAuthority } from './current-authority';

export async function workspacePreferences(tx:Tx,p:Principal){
 const row=(await tx.query('SELECT id,timezone,timezone_version FROM workspaces WHERE id=$1',[p.workspace])).rows[0];
 if(!row)fail(404,'RESOURCE_NOT_FOUND','Workspace not found.');
 try{validateDisplayTimeZone(row.timezone);}catch{fail(422,'WORKSPACE_TIMEZONE_INVALID','The saved display timezone requires correction by a workspace manager.');}
 return WorkspacePreferences.parse({workspace_id:row.id,time_zone:row.timezone,version:row.timezone_version});
}
export async function workspacePreferenceRoute(req:Request,body:unknown,key:string|null){
 return withPrincipal(req,req.method==='GET'?'read':'manage',async(tx,p)=>{
  if(req.method==='GET')return{preferences:await workspacePreferences(tx,p)};
  const input=WorkspaceTimezoneInput.parse(body);
  try{validateDisplayTimeZone(input.time_zone);}catch{fail(422,'WORKSPACE_TIMEZONE_INVALID','Choose a supported named IANA time zone.');}
  const result=await keyed(tx,p,'workspace.timezone',key,campaignCanonicalJSON(input),async()=>{
   const current=(await tx.query('SELECT timezone,timezone_version FROM workspaces WHERE id=$1',[p.workspace])).rows[0];
   if(current.timezone_version!==input.expected_version)fail(409,'VERSION_CONFLICT','The saved timezone changed. Keep your input and reload the current version before saving.',{current_version:current.timezone_version});
   if(current.timezone===input.time_zone)return{changed:false,notice:'Display timezone is unchanged. Planned campaign timing is preserved.'};
   const zoneSupported=(await tx.query('SELECT EXISTS(SELECT FROM pg_timezone_names WHERE lower(name)=lower($1)) AS supported',[input.time_zone])).rows[0].supported;
   if(!zoneSupported)fail(422,'WORKSPACE_TIMEZONE_INVALID','This time zone is unsupported by the calendar database.');
   await tx.query('UPDATE workspaces SET timezone=$2,timezone_version=timezone_version+1 WHERE id=$1 AND timezone_version=$3',[p.workspace,input.time_zone,input.expected_version]);
   await audit(tx,p.workspace,p.user,'workspace.timezone_changed',p.workspace);
   return{changed:true,notice:'Display timezone saved. Original planned timing is preserved; no delivery was scheduled.'};
  });
  await assertCurrentAuthority(tx,p,'manage');
  return{...result,preferences:await workspacePreferences(tx,p)};
 },{workspaceLock:req.method==='GET'?'shared':'exclusive'});
}
export async function campaignCalendar(req:Request,tx:Tx,p:Principal){
 const query=new URL(req.url).searchParams;
 for(const key of query.keys())if(!['month','limit','after'].includes(key)||query.getAll(key).length!==1)fail(422,'VALIDATION_FAILED','Choose one month, page size and optional calendar cursor.');
 const month=CalendarMonth.parse(query.get('month')),preferences=await workspacePreferences(tx,p);
 const page=await resourcePage(req,tx,p,{resource:'campaign-calendar',from:'campaigns',fields:'id,name,state,version,revision_id,intent,planned_at',created:'planned_at',where:"planned_at IS NOT NULL AND (planned_at AT TIME ZONE $2)>=($1||'-01')::timestamp AND (planned_at AT TIME ZONE $2)<(($1||'-01')::timestamp+interval '1 month')",values:[month,preferences.time_zone],filters:{month,time_zone:preferences.time_zone,timezone_version:preferences.version}});
 const data=page.data.map(row=>CalendarEntry.parse({id:row.id,name:row.name,state:row.state,version:row.version,revision_id:row.revision_id,planned_timing:(row.intent as Record<string,unknown>).planned_timing,display:formatCalendarInstant((row.planned_at as Date).toISOString(),preferences.time_zone)}));
 await assertCurrentAuthority(tx,p,'read',p.api_key?'campaigns:read':undefined);
 return{...page,data,month,time_zone:preferences.time_zone,timezone_version:preferences.version,notice:'Planned campaign timing only. No accepted delivery schedule or audience performance measurement.'};
}
