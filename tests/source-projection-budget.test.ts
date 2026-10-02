import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

async function isolatedProjection(kind:'tag'|'comment'|'fragment'|'ordinary'){
 const code=`import {createHash} from 'node:crypto';import {projectRawHtml} from './src/domain/raw-html-projection.ts';import {compileEmail,blankSpec} from './src/domain/email.ts';const kind=${JSON.stringify(kind)},source=kind==='ordinary'?'x'.repeat(2097152):kind==='tag'?'<a'.repeat(1048576):'<!--'.repeat(kind==='comment'?524288:50000);const result=kind==='fragment'?await compileEmail({...blankSpec('owned','Owned'),sections:[{id:'opaque',type:'custom_html',html:source}]}):projectRawHtml(source);const projection=kind==='fragment'?result.manifest.fragment_projection:result;console.log(JSON.stringify({status:projection.delivery_status,sourceRetained:kind!=='fragment'||result.manifest.spec.sections[0].html===source,sourceHash:kind==='fragment'?projection.sources[0].source_sha256:projection.source_hash,expectedHash:createHash('sha256').update(source).digest('hex'),html:kind==='ordinary'?null:kind==='fragment'?result.html:result.email_html,htmlMatchesSource:kind==='ordinary'&&result.email_html===source}));`;
 return new Promise<Record<string,unknown>>((resolve,reject)=>{
  const child=spawn(process.execPath,['--import','tsx','--input-type=module','-e',code],{cwd:process.cwd(),env:{PATH:process.env.PATH,NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});let stdout='',stderr='',expired=false;
  const timer=setTimeout(()=>{expired=true;child.kill('SIGKILL');},5000);
  child.stdout.on('data',data=>stdout+=data);child.stderr.on('data',data=>stderr+=data);
  child.once('error',error=>{clearTimeout(timer);reject(error);});
  child.once('exit',status=>{clearTimeout(timer);if(expired)return reject(Error('Owned projection child exceeded its five-second deadline; child exit confirmed.'));if(status!==0)return reject(Error('Owned projection failed: '+stderr.slice(0,1000)));try{resolve(JSON.parse(stdout));}catch(error){reject(error);}});
 });
}
for(const kind of ['tag','comment','fragment']as const)test('bounded projection retains incomplete '+kind+' source without failed-match stalls',async()=>{
 const result=await isolatedProjection(kind);assert.equal(result.status,'unavailable');assert.equal(result.sourceRetained,true);assert.equal(result.sourceHash,result.expectedHash);assert.equal(result.html,kind==='fragment'?'':null);
});
test('unavailable source projection stops conversion and retains exact original preview facts',async()=>{
 const {conversionProposal}=await import('../src/domain/email-conversion');const{blankSpec}=await import('../src/domain/email');const source='<br />'.repeat(20001),result=await conversionProposal({...blankSpec('owned','Owned'),editing_mode:'raw_html',raw_html:source},1);
 assert.equal(result.status,'unsupported');assert.equal(result.original_html,source);assert.equal(result.original_preview_html,null);assert.equal(result.spec,null);assert.equal(result.preview_html,null);assert.ok(result.notes.some(n=>n.code==='limit'&&n.message.includes('projection')));
});

test('ordinary maximum-size source still has an eligible byte-exact email projection within the owned deadline',async()=>{const result=await isolatedProjection('ordinary');assert.equal(result.status,'eligible_for_checks');assert.equal(result.sourceHash,result.expectedHash);assert.equal(result.htmlMatchesSource,true);});
test('effective projection status retains legacy behavior and never loses an explicit fragment failure',async()=>{const{effectiveProjectionStatus}=await import('../src/domain/projection-status');assert.equal(effectiveProjectionStatus({}),'eligible_for_checks');assert.equal(effectiveProjectionStatus({raw_projection:{delivery_status:'eligible_for_checks'},fragment_projection:{delivery_status:'blocked'}}),'blocked');assert.equal(effectiveProjectionStatus({raw_projection:{delivery_status:'blocked'},fragment_projection:{delivery_status:'unavailable'}}),'unavailable');assert.equal(effectiveProjectionStatus({fragment_projection:{delivery_status:'unknown'}}),'blocked');});
