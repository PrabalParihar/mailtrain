import {build} from 'esbuild';
import {createHash,randomUUID} from 'node:crypto';
import {copyFile,mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import type {CodeEditorManifest} from '../src/ui/code-editor-contracts';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const version='0.57.0' as const;

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
 });
 for(const file of ['LICENSE','ThirdPartyNotices.txt'])await copyFile(join(root,'node_modules/monaco-editor',file),join(output,file));
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
