import type {CodeEditorManifest,CodeEditorModule} from './code-editor-contracts';

export function validateCodeEditorManifest(input:unknown):CodeEditorManifest{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid code editor manifest.');
 const value=input as Record<string,unknown>;
 const keys=['schema_version','version','asset_base','module','stylesheet','editor_worker','html_worker'];
 if(Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key))||value.schema_version!==1||value.version!=='0.57.0'||typeof value.asset_base!=='string'||!/^\/code-editor\/0\.57\.0-[a-f0-9]{12}\/$/.test(value.asset_base))throw Error('Invalid code editor manifest.');
 for(const [key,file] of Object.entries({module:'editor.js',stylesheet:'editor.css',editor_worker:'editor.worker.js',html_worker:'html.worker.js'}))if(value[key]!==value.asset_base+file)throw Error('Invalid code editor manifest asset.');
 return value as CodeEditorManifest;
}

let pending:Promise<CodeEditorModule>|undefined;
function stylesheet(url:string):Promise<void>{
 return new Promise((resolve,reject)=>{
  const link=document.createElement('link');link.rel='stylesheet';link.href=url;
  const timer=setTimeout(()=>fail(),15000);
  function fail(){clearTimeout(timer);link.remove();reject(Error('Code editor stylesheet unavailable.'));}
  link.onload=()=>{clearTimeout(timer);resolve();};link.onerror=fail;document.head.append(link);
 });
}
async function load():Promise<CodeEditorModule>{
 const response=await fetch('/code-editor/manifest.json',{cache:'no-store',credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Code editor manifest unavailable.');
 const manifest=validateCodeEditorManifest(await response.json());
 // Workers are executable assets too; fail before replacing the usable source field.
 await Promise.all([manifest.editor_worker,manifest.html_worker].map(async url=>{
  const response=await fetch(url,{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Code editor worker unavailable.');
  await response.arrayBuffer();
 }));
 await stylesheet(manifest.stylesheet);
 const url=new URL(manifest.module,window.location.origin).href;
 const runtime=await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url) as CodeEditorModule;
 if(typeof runtime.create!=='function')throw Error('Code editor runtime unavailable.');
 return runtime;
}
export function loadCodeEditor():Promise<CodeEditorModule>{
 if(!pending)pending=load().catch(error=>{pending=undefined;throw error;});
 return pending;
}
