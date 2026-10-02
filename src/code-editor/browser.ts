// Register contribution dependencies before standalone services initialize.
import 'monaco-editor/editor/contrib/codelens/browser/codeLensCache.js';
import 'monaco-editor/editor/common/services/treeViewsDndService.js';
import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/languages/definitions/html/register.js';
import 'monaco-editor/editor/contrib/suggest/browser/suggestController.js';
import 'monaco-editor/features/hover/register.js';
import {htmlDefaults} from 'monaco-editor/languages/features/html/register.js';
import type {CodeEditorHandle, CodeEditorOptions} from '../ui/code-editor-contracts';
import {applySourceChanges,SourceHistory} from './source';

const containers=new Set<HTMLElement>();
globalThis.MonacoEnvironment={
 globalAPI:false,
 getWorker(_moduleId,label){
  const url=label==='html'||label==='handlebars'||label==='razor'
   ?new URL('./html.worker.js',import.meta.url)
   :new URL('./editor.worker.js',import.meta.url);
  const worker=new Worker(url,{type:'module',name:label});
  const failed=()=>{for(const container of containers)container.dispatchEvent(new CustomEvent('code-editor-error',{bubbles:true}));};
  worker.addEventListener('error',failed);
  worker.addEventListener('messageerror',failed);
  return worker;
 },
};
htmlDefaults.setModeConfiguration({...htmlDefaults.modeConfiguration,links:false});

// Read-only lifecycle diagnostics expose counts, never source or model identity.
export function getActiveModelCount():number{return monaco.editor.getModels().length;}

export function create(container:HTMLElement,options:CodeEditorOptions,onChange:(value:string)=>void):CodeEditorHandle{
 let source=options.value,readOnly=options.readOnly,updating=false,disposed=false;
 let projectionPrefixLength=source.startsWith('\uFEFF')?1:0;
 const history=new SourceHistory();
 if(!history.retain(0,source))throw new Error('Exact source exceeds the enhanced editor history budget');
 const model=monaco.editor.createModel(source,'html',monaco.Uri.parse('inmemory://code-editor/'+crypto.randomUUID()+'.html'));
 let instance:monaco.editor.IStandaloneCodeEditor;
 try{
  instance=monaco.editor.create(container,{
   model,readOnly,ariaLabel:options.label,automaticLayout:true,
   minimap:{enabled:false},links:false,wordWrap:'on',scrollBeyondLastLine:false,
   autoSurround:'never',autoClosingBrackets:'never',autoClosingQuotes:'never',
   formatOnPaste:false,formatOnType:false,
   tabSize:2,insertSpaces:true,renderWhitespace:'selection',
   accessibilitySupport:'on',contextmenu:false,
   // Tab can leave the source field without trapping keyboard navigation.
   tabFocusMode:true,
  });
 }catch(error){model.dispose();throw error;}
 containers.add(container);
 const syncReadOnly=()=>{
  for(const input of container.querySelectorAll('.native-edit-context[role="textbox"], textarea.inputarea[role="textbox"]'))input.setAttribute('aria-readonly',String(readOnly));
 };
 syncReadOnly();
 const configurationListener=instance.onDidChangeConfiguration(syncReadOnly);
 let previousEol=model.getEOL();
 history.clear();history.retain(model.getAlternativeVersionId(),source);
 const listener=model.onDidChangeContent(event=>{
  const priorEol=previousEol;previousEol=model.getEOL();
  if(disposed||updating)return;
  const restored=history.get(model.getAlternativeVersionId());
  if((event.isUndoing||event.isRedoing)&&restored!==undefined)source=restored;
  else{
   source=applySourceChanges(source,priorEol,event.changes,projectionPrefixLength);
  }
  const retained=history.retain(model.getAlternativeVersionId(),source);
  if(!readOnly)onChange(source);
  if(!retained&&!disposed)container.dispatchEvent(new CustomEvent('code-editor-error',{bubbles:true}));
 });
 return{
  getValue:()=>source,
  setValue(value){
   if(disposed||value===source)return;
   updating=true;
   try{
    source=value;projectionPrefixLength=value.startsWith('\uFEFF')?1:0;model.setValue(value);history.clear();
    if(!history.retain(model.getAlternativeVersionId(),source))container.dispatchEvent(new CustomEvent('code-editor-error',{bubbles:true}));
   }
   finally{updating=false;}
  },
  setReadOnly(value){if(!disposed){readOnly=value;instance.updateOptions({readOnly:value});syncReadOnly();}},
  focus(){if(!disposed)instance.focus();},
  dispose(){
   if(disposed)return;
   disposed=true;containers.delete(container);listener.dispose();configurationListener.dispose();instance.dispose();model.dispose();history.clear();
  },
 };
}
