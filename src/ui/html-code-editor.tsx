'use client';

import {useEffect,useLayoutEffect,useId,useRef,useState} from 'react';
import type {CodeEditorHandle} from './code-editor-contracts';
import {loadCodeEditor} from './code-editor-loader';
import {applyBasicInput} from '../code-editor/source';

export function HtmlCodeEditor({value,readOnly,label,onChange}:{value:string;readOnly:boolean;label:string;onChange?:(value:string)=>void}){
 const id=useId(),container=useRef<HTMLDivElement>(null),handle=useRef<CodeEditorHandle|null>(null),switchControl=useRef<HTMLButtonElement>(null);
 const latest=useRef({value,readOnly,label,onChange});
 useLayoutEffect(()=>{latest.current={value,readOnly,label,onChange};},[value,readOnly,label,onChange]);
 const [mode,setMode]=useState<'basic'|'enhanced'>('basic'),[ready,setReady]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active&&!window.matchMedia('(max-width: 640px)').matches)setMode('enhanced');});return()=>{active=false;};},[]);
 useEffect(()=>{
  if(mode!=='enhanced')return;
  let cancelled=false;const node=container.current!;
  function fallback(){
   if(cancelled)return;
   const active=latest.current,source=handle.current?.getValue();
   if(!active.readOnly&&source!==undefined&&source!==active.value){latest.current={...active,value:source};active.onChange?.(source);}
   cancelled=true;clearTimeout(timer);handle.current?.dispose();handle.current=null;setReady(false);setError(true);setMode('basic');
  }
  node.addEventListener('code-editor-error',fallback);
  const timer=setTimeout(fallback,20000);
  void loadCodeEditor().then(module=>{
   if(cancelled)return;
   const current=latest.current;
   const editor=module.create(node,{value:current.value,readOnly:current.readOnly,label:current.label},next=>{
    if(cancelled)return;
    const active=latest.current;
    if(active.readOnly){handle.current?.setValue(active.value);return;}
    if(next!==active.value){latest.current={...active,value:next};active.onChange?.(next);}
   });
   if(cancelled){editor.dispose();return;}
   handle.current=editor;clearTimeout(timer);setReady(true);
  }).catch(fallback);
  return()=>{cancelled=true;clearTimeout(timer);node.removeEventListener('code-editor-error',fallback);handle.current?.dispose();handle.current=null;setReady(false);};
 },[mode]);
 useEffect(()=>{handle.current?.setReadOnly(readOnly);if(handle.current&&handle.current.getValue()!==value)handle.current.setValue(value);},[value,readOnly]);
 function switchMode(){setError(false);setMode(mode==='enhanced'?'basic':'enhanced');}
 return <div className="html-code-editor" style={{minWidth:0,maxWidth:'100%'}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
   <span id={id+'-label'}>{label}</span>
   <button ref={switchControl} type="button" onClick={switchMode}>{mode==='enhanced'?'Use basic editor':'Use enhanced editor'}</button>
  </div>
  <p id={id+'-help'} style={{fontSize:12}}>{error?'Enhanced editor unavailable. Basic editor preserves your source.':mode==='enhanced'&&!ready?'Loading enhanced editor. You can edit the basic source now.':ready?'Enhanced editor. Press Escape to reach the editor switch.':'Basic editor.'}</p>
  {!ready&&<textarea aria-label={label} aria-describedby={id+'-help'} readOnly={readOnly} className="raw-code" rows={24} value={value} onChange={event=>{
   const active=latest.current;if(active.readOnly)return;
   const next=applyBasicInput(active.value,event.currentTarget.value);latest.current={...active,value:next};active.onChange?.(next);
  }} style={{width:'100%',boxSizing:'border-box'}}/>}
  <div ref={container} aria-hidden={!ready} inert={!ready} onKeyDownCapture={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();switchControl.current?.focus();}}} style={{height:ready?480:0,overflow:'hidden',width:'100%',minWidth:0,visibility:ready?'visible':'hidden'}}/>
 </div>;
}
