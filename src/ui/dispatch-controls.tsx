'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import type { readDispatchControls } from '@/server/dispatch-controls';
type Controls = Awaited<ReturnType<typeof readDispatchControls>>;
export function DispatchControls(props: { workspace: string; role: string }) {
  return <ScopedControls key={props.workspace+':'+props.role} {...props} />;
}
function ScopedControls({ workspace, role }: { workspace: string; role: string }) {
  const [controls,setControls]=useState<Controls|null>(null), [error,setError]=useState(''), [message,setMessage]=useState(''), [busy,setBusy]=useState(false);
  const active=useRef(false), running=useRef(false);
  const manager=['Owner','Admin'].includes(role);
  useEffect(()=>{
    active.current=true;
    if(manager) void api<{controls:Controls}>(workspace,'dispatch-controls').then((result)=>{if(active.current)setControls(result.controls);}).catch((error)=>{if(active.current)setError(error.message);});
    const fence=active;
    return ()=>{fence.current=false;};
  },[workspace,manager]);
  async function reload() {
    if(running.current)return;
    running.current=true;setBusy(true);setError('');
    try {const result=await api<{controls:Controls}>(workspace,'dispatch-controls'); if(active.current)setControls(result.controls);}
    catch(error){if(active.current)setError((error as Error).message);}
    finally {running.current=false;if(active.current)setBusy(false);}
  }
  async function change(paused: boolean) {
    if(running.current || !controls)return;
    running.current=true;setBusy(true);setError('');setMessage('');
    try {
      const result=await api<{controls:Controls}>(workspace,'dispatch-controls/workspace','POST',{expected_version:controls.workspace.version,paused,reason:paused?'incident':'verified_recovery'});
      if(!active.current)return;
      setControls(result.controls);
      setMessage(result.controls.workspace.paused?'Command acknowledged. Workspace stop is engaged; recipient opt-out remains available.':'Command acknowledged. Workspace stop is released; sending remains disabled until all other controls and release gates pass.');
    }catch(error){if(active.current)setError((error as Error).message);}
    finally{running.current=false;if(active.current)setBusy(false);}
  }
  const state=(value:{paused:boolean}|null)=>!value?'Unavailable — stopped':value.paused?'Stop engaged':'Stop released';
  return <section className="panel dispatch-controls-panel">
    <h2>Dispatch safety controls</h2>
    <p className="alert warning">Production sending is disabled. A released workspace stop cannot enable sending or override operator controls.</p>
    {!manager?<p>Owner or Admin access is required to manage this workspace stop.</p>:<>
      {error&&<p role="alert" className="alert danger">{error}</p>}
      {message&&<p role="status" className="alert info">{message}</p>}
      {!controls?<p role="status">{error?'Controls unavailable; dispatch stays stopped.':'Loading dispatch controls…'}</p>:<>
        <p>Global: <strong>{state(controls.global)}</strong></p>
        <p>Workspace: <strong>{state(controls.workspace)}</strong> · version {controls.workspace.version}</p>
        <div className="toolbar">
          <button disabled={busy||controls.workspace.paused} onClick={()=>void change(true)}>Stop workspace dispatch</button>
          <button disabled={busy||!controls.workspace.paused} onClick={()=>void change(false)}>Release workspace stop</button>
        </div>
        <ul>{controls.providers.map(({provider,policy})=><li key={provider}>{provider}: {state(policy)}</li>)}</ul>
        <p className="small muted">Operator stops use separate authority. Drafts, exports, recipient opt-out and retained evidence remain available. A policy change cannot recall a provider call already authorized before the stop committed.</p>
      </>}
      <button disabled={busy} onClick={()=>void reload()}>Reload dispatch controls</button>
    </>}
  </section>;
}
