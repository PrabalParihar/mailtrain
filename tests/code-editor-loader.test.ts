import assert from 'node:assert/strict';
import {test} from 'node:test';
import {validateCodeEditorManifest} from '../src/ui/code-editor-loader';

const base='/code-editor/0.57.0-0123456789ab/';
const manifest={schema_version:1,version:'0.57.0',asset_base:base,module:base+'editor.js',stylesheet:base+'editor.css',editor_worker:base+'editor.worker.js',html_worker:base+'html.worker.js'};
test('accepts only the pinned local editor manifest',()=>{
 assert.deepEqual(validateCodeEditorManifest(manifest),manifest);
});
test('rejects remote, traversing, encoded, alternate and mixed-base runtime assets before loading',()=>{
 for(const field of ['module','stylesheet','editor_worker','html_worker'] as const){
  for(const value of ['https://evil.example/editor.js','//evil.example/editor.js',base+'../editor.js',base+'%65ditor.js',base+'editor.js?remote=1',base+'editor.js#x','/code-editor/0.57.0-ffffffffffff/'+manifest[field].split('/').at(-1)]){
   assert.throws(()=>validateCodeEditorManifest({...manifest,[field]:value}),/manifest/i,field+': '+value);
  }
 }
});
test('rejects wrong schema, version, shape and noncanonical asset directories',()=>{
 for(const value of [null,[],{}, {...manifest,schema_version:2},{...manifest,version:'0.58.0'},{...manifest,extra:'surprise'}, {...manifest,asset_base:'/code-editor/0.57.0-ABCDEF012345/'},{...manifest,asset_base:'/code-editor/0.57.0-0123456789ab/../'},{...manifest,asset_base:'https://evil.example/'}])assert.throws(()=>validateCodeEditorManifest(value),/manifest/i);
});
