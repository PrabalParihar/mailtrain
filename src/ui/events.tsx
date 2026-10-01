'use client';
import type { DomainEvent } from '@/domain/events';
import { useResourcePage } from './paged';
export function EventHistory({workspace,role}:{workspace:string;role:string}){
 const manager=['Owner','Admin'].includes(role);
 const events=useResourcePage<DomainEvent>(manager?workspace:'','events');
 return <section className="panel events-panel">
  <h2>Versioned event history</h2>
  <p className="muted">Recover immutable resource events by ID and source version. New unsubscribe/topic changes and confirmed imports are recorded; older unversioned entries are excluded.</p>
  <p className="alert warning">Outbound webhook delivery is unconfigured. These receipts do not prove external acknowledgment or email delivery.</p>
  {!manager?<p>Owner or Admin access is required to read workspace event history.</p>:<>
   {events.error&&<p role="alert" className="alert danger">{events.error}</p>}
   {!events.loaded&&!events.error&&<p role="status">Loading versioned events…</p>}
   <div className="toolbar"><p>{events.total} versioned events</p><button disabled={events.busy}onClick={()=>void events.reload()}>Reload event history</button></div>
   {events.loaded&&!events.total&&<p className="muted">No new versioned event yet.</p>}
   {events.data.map((event)=><details key={event.id}className="event-receipt"style={{overflowWrap:'anywhere'}}>
    <summary>{event.type} · source version {event.aggregate.version}</summary>
    <p className="small muted">Recorded {event.recorded_at} · Event {event.id}</p>
    <pre className="code-view"style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(event,null,2)}</pre>
   </details>)}
   {events.hasMore&&<button disabled={events.busy}onClick={()=>void events.loadMore()}>Load older events</button>}
  </>}
 </section>;
}
