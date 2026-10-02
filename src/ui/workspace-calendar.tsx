'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {z} from 'zod';
import {CalendarMonth,CalendarEntry,WorkspacePreferences,WorkspaceTimezoneInput,calendarDayCells,moveCalendarMonth,formatCalendarInstant,validateDisplayTimeZone} from '../domain/workspace-calendar';
import {api,ApiError} from './api';
import {CampaignConfiguration} from './campaign-configuration';
type Preferences=z.infer<typeof WorkspacePreferences>;
type Entry=z.infer<typeof CalendarEntry>;
type Command=z.infer<typeof WorkspaceTimezoneInput>;
type Page={data:Entry[];month:string;time_zone:string;timezone_version:number;total_count:number;has_more:boolean;next_cursor:string|null};
export function WorkspaceCalendar({workspace,role,currentCampaigns,onUpdate}:{workspace:string;role:string;currentCampaigns:{id:string;version:number;state:string}[];onUpdate:()=>Promise<void>}){
 const [preferences,setPreferences]=useState<Preferences|null>(null),[zone,setZone]=useState(''),[preferenceBusy,setPreferenceBusy]=useState(false),[preferenceError,setPreferenceError]=useState(''),[notice,setNotice]=useState(''),[pending,setPending]=useState<Command|null>(null);
 const [month,setMonth]=useState(''),[frame,setFrame]=useState<Page|null>(null),[calendarBusy,setCalendarBusy]=useState(false),[calendarError,setCalendarError]=useState(''),[refresh,setRefresh]=useState(0);
 const [selected,setSelected]=useState<Entry|null>(null);
 const selectedRegion=useRef<HTMLElement|null>(null),selectedId=selected?.id;
 useEffect(()=>{if(selectedId){selectedRegion.current?.scrollIntoView({block:'start'});selectedRegion.current?.focus();}},[selectedId]);
 const preferenceEpoch=useRef(0),preferenceRunning=useRef(false),pendingCommand=useRef<Command|null>(null),pendingKey=useRef<string|null>(null),calendarEpoch=useRef(0),calendarRunning=useRef(false),snapshot=useRef<Page|null>(null),monthRef=useRef('');
 const manager=['Owner','Admin'].includes(role),stale=!!preferences&&!!frame&&frame.timezone_version>preferences.version;
 const hydrate=useCallback((current:Preferences)=>{setPreferences(current);setZone(current.time_zone);if(!monthRef.current){const first=formatCalendarInstant(new Date().toISOString(),current.time_zone).local_date.slice(0,7);monthRef.current=first;setMonth(first);}},[]);
 const reloadPreferences=useCallback(async()=>{
  if(preferenceRunning.current)return;preferenceRunning.current=true;const generation=++preferenceEpoch.current;setPreferenceBusy(true);setPreferenceError('');
  try{const response=await api<{preferences:Preferences}>(workspace,'workspace-preferences');if(preferenceEpoch.current!==generation)return;hydrate(WorkspacePreferences.parse(response.preferences));pendingCommand.current=null;pendingKey.current=null;setPending(null);setNotice('Saved timezone loaded. Unsaved timezone input was replaced.');setRefresh(value=>value+1);}
  catch(error){if(preferenceEpoch.current===generation)setPreferenceError((error as Error).message);}
  finally{if(preferenceEpoch.current===generation){preferenceRunning.current=false;setPreferenceBusy(false);}}
 },[workspace,hydrate]);
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(active)void reloadPreferences();});const fence=preferenceEpoch;return()=>{active=false;fence.current++;};},[reloadPreferences]);
 const loadCalendar=useCallback(async()=>{
  if(!month)return;const generation=++calendarEpoch.current;calendarRunning.current=true;setCalendarBusy(true);setCalendarError('');snapshot.current=null;setFrame(null);
  try{const response=await api<Page>(workspace,'campaigns/calendar?month='+month+'&limit=5');if(calendarEpoch.current!==generation)return;if(response.month!==month)throw new Error('Calendar selection changed. Refresh the calendar.');const current={...response,data:response.data.map(row=>CalendarEntry.parse(row))};snapshot.current=current;setFrame(current);}
  catch(error){if(calendarEpoch.current===generation)setCalendarError((error as Error).message);}
  finally{if(calendarEpoch.current===generation){calendarRunning.current=false;setCalendarBusy(false);}}
 },[workspace,month]);
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(active)void loadCalendar();});const fence=calendarEpoch;return()=>{active=false;fence.current++;};},[loadCalendar,refresh]);
 function chooseMonth(value:string){if(value===month||!CalendarMonth.safeParse(value).success)return;calendarEpoch.current++;snapshot.current=null;setFrame(null);monthRef.current=value;setMonth(value);}
 async function loadMore(){
  const before=snapshot.current;if(calendarRunning.current||!before?.next_cursor||before.month!==month)return;calendarRunning.current=true;const generation=calendarEpoch.current;setCalendarBusy(true);setCalendarError('');
  try{const response=await api<Page>(workspace,'campaigns/calendar?month='+month+'&limit=5&after='+encodeURIComponent(before.next_cursor));if(calendarEpoch.current!==generation)return;if(response.month!==before.month||response.time_zone!==before.time_zone||response.timezone_version!==before.timezone_version)throw new Error('Calendar timezone changed. Refresh before viewing another page.');const current={...response,data:[...before.data,...response.data.map(row=>CalendarEntry.parse(row)).filter(row=>!before.data.some(old=>old.id===row.id))]};snapshot.current=current;setFrame(current);}
  catch(error){if(calendarEpoch.current===generation)setCalendarError((error as Error).message);}
  finally{if(calendarEpoch.current===generation){calendarRunning.current=false;setCalendarBusy(false);}}
 }
 let invalid='';if(zone){try{validateDisplayTimeZone(zone);}catch{invalid='Choose a supported named IANA time zone.';}}
 async function save(retry=false){
  if(preferenceRunning.current||!manager||!preferences||(!retry&&(stale||pendingCommand.current)))return;
  let command=retry?pendingCommand.current:null;
  if(!command){try{command=WorkspaceTimezoneInput.parse({expected_version:preferences.version,time_zone:zone});validateDisplayTimeZone(command.time_zone);}catch{setPreferenceError('Choose a supported named IANA time zone.');return;}}
  preferenceRunning.current=true;const generation=++preferenceEpoch.current;pendingCommand.current=command;pendingKey.current??=crypto.randomUUID();setPending(command);setPreferenceBusy(true);setPreferenceError('');setNotice('');let acknowledged=false;
  try{const receipt=await api<{notice:string}>(workspace,'workspace-preferences/timezone','POST',command,undefined,pendingKey.current);acknowledged=true;if(preferenceEpoch.current!==generation)return;const current=await api<{preferences:Preferences}>(workspace,'workspace-preferences');if(preferenceEpoch.current!==generation)return;hydrate(WorkspacePreferences.parse(current.preferences));pendingCommand.current=null;pendingKey.current=null;setPending(null);setNotice(receipt.notice);setRefresh(value=>value+1);}
  catch(error){if(preferenceEpoch.current!==generation)return;setPreferenceError((error as Error).message);if(!acknowledged&&error instanceof ApiError&&error.status<500){pendingCommand.current=null;pendingKey.current=null;setPending(null);}}
  finally{if(preferenceEpoch.current===generation){preferenceRunning.current=false;setPreferenceBusy(false);}}
 }
 return <section className="panel workspace-calendar" aria-label="Planned campaign calendar" data-workspace-calendar>
  <h2>Planned campaign calendar</h2>
  <p className="muted">Plans shown in your workspace display timezone. Saving a plan does not schedule delivery.</p>
  <section aria-label="Workspace display timezone">
   <h3>Workspace display timezone</h3>
   {preferenceError&&<p className="alert danger" role="alert">{preferenceError}</p>}
   {notice&&<p className="small" role="status">{notice}</p>}
   {!preferences&&<p role="status">{preferenceBusy?'Loading saved timezone…':'Saved timezone unavailable. Reload before editing.'}</p>}
   {preferences&&<p className="small" data-saved-timezone>Saved {preferences.time_zone} · preference v{preferences.version}</p>}
   {stale&&<p role="status" className="alert warning">Calendar uses preference v{frame!.timezone_version}; this form keeps base v{preferences!.version} and your input. Reload saved timezone before saving.</p>}
   <form onSubmit={event=>{event.preventDefault();void save();}}>
    <fieldset disabled={preferenceBusy||!!pending||!manager||!preferences}><legend>Display preference</legend><label>Display IANA time zone<input required maxLength={100} value={zone} onChange={event=>setZone(event.target.value)} placeholder="America/New_York"/></label></fieldset>
    {invalid&&<p className="small">{invalid}</p>}
    <button className="primary" disabled={preferenceBusy||!!pending||!manager||!preferences||stale||!zone||!!invalid}>Save display timezone</button>
   </form>
   {pending&&<p className="small">Timezone acknowledgment is unresolved. Retry the original command or reload saved timezone to replace your input.</p>}
   <div className="toolbar">{pending&&<button disabled={preferenceBusy||!manager} onClick={()=>void save(true)}>Retry original timezone</button>}<button disabled={preferenceBusy} onClick={()=>void reloadPreferences()}>Reload saved timezone</button></div>
   {!manager&&<p className="small muted">An Owner or Admin can change the display timezone.</p>}
  </section>
  <div className="toolbar calendar-navigation"><button disabled={!month||month==='0001-01'} onClick={()=>chooseMonth(moveCalendarMonth(month,-1))}>Previous month</button><label>Calendar month<input type="month" min="0001-01" max="9999-12" value={month} onChange={event=>chooseMonth(event.target.value)}/></label><button disabled={!month||month==='9999-12'} onClick={()=>chooseMonth(moveCalendarMonth(month,1))}>Next month</button><button disabled={calendarBusy||!month} onClick={()=>void loadCalendar()}>Refresh calendar</button></div>
  {calendarError&&<p className="alert danger" role="alert">{calendarError}</p>}
  {!frame?<p role="status">{calendarBusy?'Loading planned calendar…':'Calendar is unavailable. Refresh to try again.'}</p>:<>
   <p className="small" data-calendar-summary>{frame.month} · {frame.time_zone} · preference v{frame.timezone_version} · Showing {frame.data.length} of {frame.total_count} planned campaigns</p>
   <div className="calendar-grid" role="table" aria-label={'Planned dates for '+frame.month}>
    <div className="calendar-week" role="row">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><span role="columnheader" key={day}>{day}</span>)}</div>
    {Array.from({length:calendarDayCells(frame.month).length/7},(_,week)=><div className="calendar-week" role="row" key={week}>{calendarDayCells(frame.month).slice(week*7,week*7+7).map((day,index)=><div role="cell" key={day??'blank'+index} data-calendar-date={day??undefined}>{day&&<><span>{Number(day.slice(8))}</span>{frame.data.some(row=>row.display.local_date===day)&&<span className="calendar-dot" aria-label="Loaded planned campaigns on this date"/>}</>}</div>)}</div>)}
   </div>
   {!frame.data.length?<p data-calendar-empty>No planned campaigns in this month.</p>:<ol className="calendar-events">{frame.data.map(row=><li key={row.id} data-calendar-entry={row.id}><button className="calendar-open" aria-label={'Open plan for '+row.name} onClick={()=>{setSelected(row);}}>{row.name}</button><span className="badge neutral">Planned · {row.state.replaceAll('_',' ')}</span><p className="small">Display: {row.display.local_date} {row.display.local_time} {row.display.time_zone} ({row.display.utc_offset})</p><p className="small break-word">Original plan: {row.planned_timing.local_time} {row.planned_timing.time_zone} ({row.planned_timing.utc_offset}) → {row.planned_timing.utc}</p></li>)}</ol>}
   {frame.has_more&&<button disabled={calendarBusy} onClick={()=>void loadMore()}>Load more planned campaigns</button>}
  </>}
  {selected&&<section aria-label="Selected planned campaign" ref={selectedRegion} tabIndex={-1}>
   <div className="section-heading"><h3>{selected.name}</h3><button onClick={()=>setSelected(null)}>Close selected plan</button></div>
   <p className="small">Selected campaign configuration loads independently of the campaign list. Opening another plan, closing this plan or leaving the workspace replaces this view and its unsaved edits.</p>
   <CampaignConfiguration key={selected.id} workspace={workspace} id={selected.id} role={role} savedState={currentCampaigns.find(row=>row.id===selected.id&&row.version>=selected.version)?.state??selected.state} savedVersion={currentCampaigns.find(row=>row.id===selected.id&&row.version>=selected.version)?.version??selected.version} onUpdate={async()=>{await loadCalendar();await onUpdate();}}/>
  </section>}
  <p className="small muted">A weekday midmorning slot can be a working-hours starting point. This is an unmeasured planning heuristic, not audience behavior or a delivery recommendation. Choose timing explicitly in campaign configuration.</p>
 </section>;
}
