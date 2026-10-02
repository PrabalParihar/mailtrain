import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, basename} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {build} from 'esbuild';
import {buildCodeEditor} from '../scripts/build-code-editor';

const run=promisify(execFile);

// A missing worker, remote import, invalid URL, or non-deterministic output must
// fail against actual esbuild output, not a fixture pretending to be Monaco.
test('local Monaco assets are executable ESM with bounded URLs, fonts and upstream notices',async()=>{
 const owned=await mkdtemp(join(tmpdir(),'mailcraft-code-editor-assets-'));
 try{
  const firstDir=join(owned,'first'),secondDir=join(owned,'second');
  const manifest=await buildCodeEditor(firstDir);
  assert.deepEqual(Object.keys(manifest).sort(),['asset_base','editor_worker','html_worker','module','schema_version','stylesheet','version'].sort());
  assert.equal(manifest.schema_version,1);assert.equal(manifest.version,'0.57.0');
  assert.match(manifest.asset_base,/^\/code-editor\/0\.57\.0-[a-f0-9]{12}\/$/);
  const assetDir=join(firstDir,basename(manifest.asset_base));
  for(const [key,file] of [['module','editor.js'],['stylesheet','editor.css'],['editor_worker','editor.worker.js'],['html_worker','html.worker.js']] as const){
   assert.equal(manifest[key],manifest.asset_base+file);
   const url=new URL(manifest[key],'http://127.0.0.1:3000');
   assert.equal(url.origin,'http://127.0.0.1:3000');assert.equal(url.search,'');assert.equal(url.hash,'');
   assert.ok((await stat(join(assetDir,file))).size>100,'asset has real bundled content: '+file);
  }
  assert.deepEqual(JSON.parse(await readFile(join(firstDir,'manifest.json'),'utf8')),manifest);
  for(const file of ['editor.js','editor.worker.js','html.worker.js']){
   await run(process.execPath,['--check',join(assetDir,file)]);
   const source=await readFile(join(assetDir,file),'utf8');
   const parsed=await build({stdin:{contents:source,loader:'js'},bundle:false,write:false,metafile:true,format:'esm',logLevel:'silent'});
   for(const output of Object.values(parsed.metafile!.outputs))assert.deepEqual(output.imports,[],'all runtime imports must be bundled: '+file);
   assert.doesNotMatch(source,/sourceMappingURL=/,'no source-map dependency');
  }
  const editor=await readFile(join(assetDir,'editor.js'),'utf8');
  assert.match(editor,/export\{[^}]*\bcreate\b/,'adapter exports the contracted factory');
  assert.match(editor,/new URL\(["']\.\/editor\.worker\.js["'],import\.meta\.url\)/);
  assert.match(editor,/new URL\(["']\.\/html\.worker\.js["'],import\.meta\.url\)/);
  const css=await readFile(join(assetDir,'editor.css'),'utf8');
  const urls=[...css.matchAll(/url\(([^)]+)\)/g)].map(match=>match[1].replace(/^["']|["']$/g,''));
  assert.ok(urls.some(url=>/fonts\/codicon-/.test(url)),'the local icon font is referenced');
  for(const url of urls){
   if(/^data:image\/(?:png|svg\+xml);base64,[a-zA-Z0-9+/=]+$/.test(url))continue;
   assert.match(url,/^(?:\.\/)?fonts\/codicon-[a-zA-Z0-9]+\.ttf$/);
   assert.ok((await stat(join(assetDir,url))).size>100);
  }
  assert.match(await readFile(join(assetDir,'LICENSE'),'utf8'),/MIT License|Permission is hereby granted/);
  assert.ok((await stat(join(assetDir,'ThirdPartyNotices.txt'))).size>100);
  const duplicate=await buildCodeEditor(secondDir);
  assert.deepEqual(duplicate,manifest,'asset identity excludes the output directory');
  const firstFiles=(await readdir(firstDir,{recursive:true})).sort();
  assert.deepEqual((await readdir(secondDir,{recursive:true})).sort(),firstFiles);
  let totalBytes=0;
  for(const file of firstFiles){
   if(!(await stat(join(firstDir,file))).isFile())continue;
   const bytes=await readFile(join(firstDir,file));totalBytes+=bytes.length;
   assert.deepEqual(await readFile(join(secondDir,file)),bytes,'reproducible bytes: '+file);
  }
  assert.ok(totalBytes<12*1024*1024,'editor, workers, font and notices remain within the local asset budget');
 }finally{await rm(owned,{recursive:true,force:true});}
});
