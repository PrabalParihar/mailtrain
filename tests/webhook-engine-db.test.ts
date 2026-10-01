import test from'node:test';import assert from'node:assert/strict';import{runWebhookDelivery}from'../src/server/webhook-engine';
test('disabled webhook engine refuses delivery before accessing durable state or transport',async()=>{
 let accessed=0;await assert.rejects(()=>runWebhookDelivery({enabled:false,transaction:async()=>{accessed++;throw new Error('Should not access');},vault:undefined as never,signal:new AbortController().signal}),/disabled/i);assert.equal(accessed,0);
});

test('standalone webhook worker exits closed without activation or provider access',async()=>{
 const{spawn}=await import('node:child_process');const child=spawn(process.execPath,['--import','tsx','src/server/webhook-worker.ts'],{cwd:process.cwd(),env:{...process.env,WEBHOOK_DELIVERY_ENABLED:'false'},stdio:['ignore','pipe','pipe']});let output='';child.stderr.on('data',(chunk)=>{output+=String(chunk);});const code=await new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});assert.equal(code,1);assert.match(output,/Webhook delivery is disabled/);
});
test('worker activation refuses release evidence with no build binding',async()=>{
 const{spawn}=await import('node:child_process'),{mkdtemp,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join,resolve}=await import('node:path');const root=await mkdtemp(join(tmpdir(),'lettercape-build-gate-'));
 try{const evidencePath=join(root,'fixture-evidence');await writeFile(evidencePath,'Owned test evidence only');const gates:Record<string,string>={},evidence:Record<string,unknown>={};for(let i=1;i<=13;i++){const id='GATE-'+String(i).padStart(2,'0');gates[id]='passed';evidence[id]={environment:'production',owner:'Fixture',time:new Date().toISOString(),path:evidencePath};}await writeFile(join(root,'release-gates.json'),JSON.stringify({baseline:'A-full-GA',environment:'production',gates,evidence}));
 const childEnv={...process.env,WEBHOOK_DELIVERY_ENABLED:'true',WEBHOOK_DATABASE_URL:'postgres://unused.invalid/test',REDIS_URL:'redis://127.0.0.1:1'};for(const name of['DATABASE_URL','MIGRATION_DATABASE_URL','RELEASE_BUILD','WEBHOOK_ENCRYPTION_KEYS_JSON'])delete childEnv[name as keyof typeof childEnv];
 const child=spawn(process.execPath,['--import',resolve('node_modules/tsx/dist/loader.mjs'),resolve('src/server/webhook-worker.ts')],{cwd:root,env:childEnv,stdio:['ignore','pipe','pipe']});let output='';child.stderr.on('data',(chunk)=>{output+=String(chunk);});const code=await new Promise<number|null>((res,rej)=>{child.once('error',rej);child.once('exit',res);});assert.equal(code,1);assert.match(output,/full-GA evidence incomplete/);
 await writeFile(join(root,'server.js'),'process.exit(0)');
 const webEnv:NodeJS.ProcessEnv={...childEnv,APP_ORIGIN:'https://owned-fixture.example',DATABASE_URL:'postgres://unused.invalid/test',CLERK_SECRET_KEY:'fixture',NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:'fixture',PREFERENCE_SIGNING_SECRET:'fixture',LOCAL_DEVELOPMENT:'false'};delete webEnv.LOCAL_BOOTSTRAP_SECRET;
 const web=spawn(process.execPath,[resolve('scripts/start-production.mjs')],{cwd:root,env:webEnv,stdio:['ignore','pipe','pipe']});let webOutput='';web.stderr.on('data',(chunk)=>{webOutput+=String(chunk);});const webCode=await new Promise<number|null>((res,rej)=>{web.once('error',rej);web.once('exit',res);});assert.equal(webCode,1,'Web startup must bind a nonempty build too');assert.match(webOutput,/release evidence is incomplete/);

 }finally{await rm(root,{recursive:true,force:true});}
});
