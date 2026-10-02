import env from '@next/env';
import {z} from 'zod';
import {tenant,closeDb} from '../src/server/db';
import {processRecipientAssessmentBatch} from '../src/server/recipient-assessment-worker';
env.loadEnvConfig(process.cwd());
if(process.env.LOCAL_DEVELOPMENT!=='true'||process.env.NODE_ENV==='production'||!process.env.DATABASE_URL||!['127.0.0.1','localhost'].includes(new URL(process.env.DATABASE_URL).hostname))throw new Error('Local development worker requires owned loopback configuration. Production service identity is not qualified.');
const args=process.argv.slice(2),option=(name:string)=>args[args.indexOf(name)+1];
const workspace=z.uuid().parse(args.includes('--workspace')?option('--workspace'):undefined),user=z.string().min(1).max(200).parse(args.includes('--actor')?option('--actor'):undefined);
if(args.some((a,i)=>i%2===0&&!['--workspace','--actor'].includes(a))||args.length!==4)throw new Error('Use explicit --workspace UUID --actor CURRENT_ACTOR.');
let stopping=false;process.once('SIGINT',()=>{stopping=true;});process.once('SIGTERM',()=>{stopping=true;});
try{
 console.log(JSON.stringify({worker:'recipient-assessment-local',dispatch_enabled:false}));
 while(!stopping){
  try{
   const result=await tenant(workspace,user,tx=>processRecipientAssessmentBatch(tx,{workspace,user,role:'Owner'}));
   if(result)console.log(JSON.stringify(result));
   await new Promise(r=>setTimeout(r,result?100:1000));
  }catch(error){
   const raw=(error as {code?:unknown}).code,code=typeof raw==='string'&&/^[A-Z0-9_]{1,50}$/.test(raw)?raw:'WORKER_FAILURE';
   if(!['40001','40P01','55P03','ECONNREFUSED','ECONNRESET','57P01','57P02','57P03'].includes(code))throw new Error('Local assessment worker stopped: '+code+'. No dispatch occurred.');
   console.error(JSON.stringify({worker:'recipient-assessment-local',error_code:code,retry_in_ms:1000,dispatch_enabled:false}));
   await new Promise(r=>setTimeout(r,1000));
  }
 }
}finally{await closeDb();}
