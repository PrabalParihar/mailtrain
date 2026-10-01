import pg from 'pg';
// Test processes that start the global SQL due-work consumer share this lock
// with fixtures asserting a still-queued state. No production selector bypass.
export async function withCreationQueueFixture<T>(run:()=>Promise<T>):Promise<T>{
 const url=process.env.MIGRATION_DATABASE_URL;
 if(process.env.LOCAL_DEVELOPMENT!=='true'||!url||!['127.0.0.1','localhost','postgres'].includes(new URL(url).hostname))throw new Error('Creation queue fixtures require a local database.');
 const client=new pg.Client({connectionString:url});await client.connect();
 try{await client.query("SELECT pg_advisory_lock(hashtextextended('lettercape.fixture.creation-queue.v1',0))");return await run();}
 finally{await client.query("SELECT pg_advisory_unlock(hashtextextended('lettercape.fixture.creation-queue.v1',0))");await client.end();}
}
