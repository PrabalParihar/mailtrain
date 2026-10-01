import{spawn}from'node:child_process';import{randomBytes}from'node:crypto';import{createServer}from'node:net';import env from'@next/env';
env.loadEnvConfig(process.cwd());if(process.env.LOCAL_DEVELOPMENT!=='true')throw new Error('Owned local fixture server only');
const probe=createServer();await new Promise<void>((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});const address=probe.address();if(!address||typeof address==='string')throw new Error('Fixture port unavailable');const port=address.port;await new Promise<void>((resolve,reject)=>probe.close((error)=>error?reject(error):resolve()));
const origin='http://127.0.0.1:'+port,fixtureEnv={...process.env,APP_ORIGIN:origin,OPENAI_API_KEY:'',DISPATCH_ENABLED:'false',WEBHOOK_ENCRYPTION_KEYS_JSON:JSON.stringify({fixture:randomBytes(32).toString('hex')}),WEBHOOK_ENCRYPTION_ACTIVE_KEY:'fixture'};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(port)],{cwd:process.cwd(),env:fixtureEnv,detached:true,stdio:['ignore','pipe','pipe']});let logs='';server.stdout.on('data',(chunk)=>{logs=(logs+chunk.toString()).slice(-16000);});server.stderr.on('data',(chunk)=>{logs=(logs+chunk.toString()).slice(-16000);});
try{
 let ready=false;for(let attempt=0;attempt<60;attempt++){if(server.exitCode!==null)throw new Error('Owned fixture server exited');try{const response=await fetch(origin+'/v1/health',{signal:AbortSignal.timeout(1000)});if(response.ok){ready=true;break;}}catch{}await new Promise((resolve)=>setTimeout(resolve,200));}
 if(!ready)throw new Error('Owned fixture server did not become healthy');
 const smoke=spawn(process.execPath,['--import','tsx','scripts/smoke-webhooks.ts'],{cwd:process.cwd(),env:fixtureEnv,stdio:'inherit'});const code=await new Promise<number|null>((resolve,reject)=>{smoke.once('error',reject);smoke.once('exit',resolve);});if(code!==0)throw new Error('Configured webhook fixture failed with exit '+code);
 console.log('Ephemeral private wrapping key existed only in the owned fixture process; no environment file or external endpoint activation.');
}catch(error){console.error(logs.slice(-1200).replace(/[0-9a-f]{64}/g,'[redacted]'));throw error;}
finally{
 if(server.pid){try{process.kill(-server.pid,'SIGTERM');}catch{}await Promise.race([new Promise<void>((resolve)=>server.once('exit',()=>resolve())),new Promise<void>((resolve)=>setTimeout(resolve,3000))]);if(server.exitCode===null)try{process.kill(-server.pid,'SIGKILL');}catch{}}
}
