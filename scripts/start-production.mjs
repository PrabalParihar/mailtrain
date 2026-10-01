import {readFileSync,existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
const release=JSON.parse(readFileSync('release-gates.json','utf8'));
const ids=Array.from({length:13},(_,i)=>'GATE-'+String(i+1).padStart(2,'0'));
const valid=release.baseline==='A-full-GA'&&release.environment==='production'&&ids.every(id=>{
 const e=release.evidence[id];return release.gates[id]==='passed'&&e?.build===process.env.RELEASE_BUILD&&e?.environment==='production'&&e?.owner&&e?.time&&e?.path&&existsSync(e.path);
});
if(!valid){console.error('Production startup refused: full GA release evidence is incomplete for this build.');process.exit(1);}
for(const name of ['APP_ORIGIN','DATABASE_URL','CLERK_SECRET_KEY','NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY','PREFERENCE_SIGNING_SECRET'])if(!process.env[name]){console.error('Production startup refused: required configuration missing ('+name+').');process.exit(1);}
if(process.env.LOCAL_DEVELOPMENT==='true'||process.env.MIGRATION_DATABASE_URL||process.env.LOCAL_BOOTSTRAP_SECRET){console.error('Production startup refused: local or migration credentials must not reach the web service.');process.exit(1);}
if(new URL(process.env.APP_ORIGIN).protocol!=='https:'){console.error('Production startup refused: HTTPS origin required.');process.exit(1);}
const child=spawn(process.execPath,['server.js'],{stdio:'inherit',env:{...process.env,NODE_ENV:'production',HOSTNAME:'0.0.0.0'}});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??1));
