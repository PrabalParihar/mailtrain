import {build,type Plugin} from 'esbuild';
import {createHash,randomUUID} from 'node:crypto';
import {copyFile,mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import type {CodeEditorManifest} from '../src/ui/code-editor-contracts';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const version='0.57.0' as const;
const completionSourceHash='2241b54a8634cbbafebbf1eb212884e87415205a214e2602c1c52e1520ab25b9';
const completionNotice='Lettercape local change to Monaco 0.57.0 (MIT): CompletionAdapter checks cancellation and model disposal before requesting and consuming asynchronous HTML completion results. The upstream source is SHA256 '+completionSourceHash+'. This prevents late replies from reading a disposed model. Upstream LICENSE and ThirdPartyNotices.txt are retained.\n';
// Adapt only the exact pinned source during bundling; leave installed dependencies
// intact and refuse an unreviewed upstream change rather than silently mispatch.
const completionCancellationGuard:Plugin={name:'lettercape-completion-cancellation',setup(builder){
 builder.onLoad({filter:/[\\/]monaco-editor[\\/]esm[\\/]vs[\\/]languages[\\/]features[\\/]common[\\/]lspLanguageFeatures\.js$/},async({path})=>{
  const contents=await readFile(path,'utf8');
  if(createHash('sha256').update(contents).digest('hex')!==completionSourceHash)throw new Error('Pinned completion source changed; review cancellation guard before building.');
  const old=`  provideCompletionItems(model, position, context, token) {
    const resource = model.uri;
    return this._worker(resource).then((worker) => {
      return worker.doComplete(resource.toString(), fromPosition(position));
    }).then((info) => {
      if (!info) {`;
  const replacement=`  provideCompletionItems(model, position, context, token) {
    if (token.isCancellationRequested || model.isDisposed()) return;
    const resource = model.uri;
    return this._worker(resource).then((worker) => {
      if (token.isCancellationRequested || model.isDisposed()) return;
      return worker.doComplete(resource.toString(), fromPosition(position));
    }).then((info) => {
      if (!info || token.isCancellationRequested || model.isDisposed()) {`;
  if(contents.split(old).length!==2)throw new Error('Pinned completion guard target is not unique.');
  return{contents:contents.replace(old,replacement),loader:'js',resolveDir:dirname(path)};
 });
}};

export async function buildCodeEditor(outdir=join(root,'public/code-editor')):Promise<CodeEditorManifest>{
 const installed=JSON.parse(await readFile(join(root,'node_modules/monaco-editor/package.json'),'utf8')) as {version:string};
 if(installed.version!==version)throw new Error('The local editor requires pinned monaco-editor '+version);
 const hash=createHash('sha256').update(version);
 for(const path of ['src/code-editor/browser.ts','src/code-editor/source.ts','src/ui/code-editor-contracts.ts','scripts/build-code-editor.ts','package-lock.json']){
  hash.update('\0'+path+'\0').update(await readFile(join(root,path)));
 }
 const directory=version+'-'+hash.digest('hex').slice(0,12);
 const output=join(resolve(outdir),directory);
 await mkdir(output,{recursive:true});
 const assetBase='/code-editor/'+directory+'/';
 await build({
  absWorkingDir:root,
  entryPoints:{
   editor:'src/code-editor/browser.ts',
   'editor.worker':'node_modules/monaco-editor/esm/vs/editor/editor.worker.js',
   'html.worker':'node_modules/monaco-editor/esm/vs/language/html/html.worker.js',
  },
  outdir:output,bundle:true,splitting:false,format:'esm',platform:'browser',target:'es2022',
  minify:true,sourcemap:false,legalComments:'none',
  loader:{'.ttf':'file'},assetNames:'fonts/[name]-[hash]',logLevel:'silent',
  plugins:[completionCancellationGuard],
 });
 for(const file of ['LICENSE','ThirdPartyNotices.txt'])await copyFile(join(root,'node_modules/monaco-editor',file),join(output,file));
 await writeFile(join(output,'LettercapeChanges.txt'),completionNotice);
 const manifest:CodeEditorManifest={
  schema_version:1,version,asset_base:assetBase,
  module:assetBase+'editor.js',stylesheet:assetBase+'editor.css',
  editor_worker:assetBase+'editor.worker.js',html_worker:assetBase+'html.worker.js',
 };
 // Readers see a complete manifest only after every local asset exists.
 const temporary=join(resolve(outdir),'manifest-'+randomUUID()+'.tmp');
 await writeFile(temporary,JSON.stringify(manifest,null,2)+'\n');
 await rename(temporary,join(resolve(outdir),'manifest.json'));
 return manifest;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const manifest=await buildCodeEditor();
 process.stdout.write('Built local Monaco '+manifest.version+' assets at '+manifest.asset_base+'\n');
}
