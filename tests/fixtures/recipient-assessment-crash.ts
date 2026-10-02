// Isolated process-boundary test only; no production worker bypass.
import {tenant} from '../../src/server/db';
import {processRecipientAssessmentBatch} from '../../src/server/recipient-assessment-worker';
const connection=new URL(process.env.DATABASE_URL??'http://invalid');
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['127.0.0.1','localhost'].includes(connection.hostname)||!/^\/creation_fixture_[a-f0-9]{32}$/.test(connection.pathname)||!process.send)throw Error('Owned disposable database and parent IPC required.');
const [workspace,user]=process.argv.slice(2);
await tenant(workspace,user,async tx=>{
 const result=await processRecipientAssessmentBatch(tx,{workspace,user,role:'Owner'});
 if(!result)throw Error('Expected owned assessment batch.');
 process.send?.({staged:true,processed_count:result.processed_count});
 await new Promise(()=>{setInterval(()=>{},1000);});
});
