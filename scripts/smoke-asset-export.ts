import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import pg from 'pg';
import env from '@next/env';
import { unzipSync, strFromU8 } from 'fflate';
import { chromium } from 'playwright';
import {createServer}from'node:http';
import {renderDownload}from'../src/server/render-download';
import {frozenRenderDownload}from'../src/server/render-cache';
import {closeDb}from'../src/server/db';
import {verifyRenderRequest,validateRenderInput,renderResponseHeaders}from'../renderer/protocol.mjs';
import { blankSpec, type EmailSpec } from '../src/domain/email';
import { MEDIA_LIMITS, privateAssetBinding, type AssetMetadata } from '../src/domain/assets';
import { FileAssetStore } from '../src/server/asset-store';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN!, address = new URL(origin);
assert.equal(process.env.LOCAL_DEVELOPMENT, 'true');
assert.equal(address.hostname, '127.0.0.1');
assert.ok(['3002', '3003'].includes(address.port)||(address.port==='3004'&&process.env.SOURCE_TRUTH_FIXTURE==='true'));
const database = new URL(process.env.MIGRATION_DATABASE_URL!);
assert.equal(database.hostname, '127.0.0.1'); assert.equal(database.port, '55439'); assert.ok(database.pathname==='/mailcraft'||(process.env.SOURCE_TRUTH_FIXTURE==='true'&&database.pathname.startsWith('/creation_fixture_')));
const db = new pg.Pool({ connectionString: database.toString() }), workspace = randomUUID(), other = randomUUID(), brand = randomUUID(), user = 'asset-export-' + randomUUID(), cookie = randomBytes(32).toString('hex'), token = hash(Buffer.from(cookie)), workspaces = [workspace, other], evidence: string[] = [];
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
function hash(bytes: Uint8Array) { return createHash('sha256').update(bytes).digest('hex'); }
function note(message: string) { evidence.push(message); console.log(message); }
async function call(path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}, w = workspace) {
  return fetch(origin + '/v1/' + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Workspace-Id': w, 'X-Actor-Id': user, Cookie: 'mailcraft_local_session=' + cookie, 'Idempotency-Key': randomUUID(), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
}
async function successful(response: Response, expected = 200) { assert.equal(response.status, expected, await response.clone().text()); return response.json(); }
async function ready(id: string): Promise<AssetMetadata> {
  const until = Date.now() + 180000;
  for (;;) { const asset: AssetMetadata = (await successful(await call('assets/' + id))).asset; if (asset.state === 'ready_private') return asset; assert.equal(asset.failure_code, null); assert.ok(Date.now() < until, 'Actual media processing exceeded fixture deadline.'); await new Promise(resolve => setTimeout(resolve, 500)); }
}
try {
  await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Owned asset exports'),($2,'Owned crossed asset exports')", workspaces);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$3,'Owner'),($2,$3,'Owner')", [...workspaces, user]);
  await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')", [token, user]);
  await db.query("INSERT INTO brands(workspace_id,id,version,data)VALUES($1,$2,1,'{}')", [workspace, brand]);
  const gif = process.argv.includes('--gif'), source = await readFile(gif ? 'tests/fixtures/media/disposal-1.gif' : 'tests/fixtures/media/source.png'), intent = { filename: gif ? 'source.gif' : 'source.png', declared_mime: gif ? 'image/gif' : 'image/png', byte_size: source.length, sha256: hash(source), rights: { attested: true, terms_version: MEDIA_LIMITS.rights }, alt: 'Upload metadata', decorative: false }, key = randomUUID();
  const accepted = await successful(await call('assets/uploads', 'POST', intent, { 'Idempotency-Key': key }), 202);
  const repeated = await successful(await call('assets/uploads', 'POST', intent, { 'Idempotency-Key': key }), 202); assert.deepEqual(repeated.upload, accepted.upload); assert.equal(repeated.operation.id, accepted.operation.id);
  const put = await fetch(origin + '/v1/assets/uploads/' + accepted.upload.id + '/content', { method: 'PUT', headers: { Origin: origin, Cookie: 'mailcraft_local_session=' + cookie, 'X-Workspace-Id': workspace, 'X-Actor-Id': user, 'X-Upload-Token': accepted.upload.token, 'Content-Type': 'application/octet-stream' }, body: source });
  const transferred = await successful(put, 202), asset = await ready(transferred.asset_id), entry = asset.variants.find(v => v.role === (gif ? 'animation' : 'static'))!, fallback = gif ? asset.variants.find(v => v.variant_id === entry.fallback?.variant_id) : undefined; assert.equal(entry.role, gif ? 'animation' : 'static'); assert.ok(entry.scan_evidence_ids.length >= 2); assert.notEqual(entry.sha256, hash(source));
  const actual = Buffer.from(await (await call('assets/' + asset.id + '/variants/' + entry.variant_id + '/content')).arrayBuffer()); assert.equal(hash(actual), entry.sha256);
  const spec: EmailSpec = { ...blankSpec(brand, 'Actual private exports'), schema_version: '1.1', sections: [{ id: 'own-image', type: 'image', asset_ref: { asset_id: asset.id, variant_id: entry.variant_id }, ...(fallback ? { fallback_ref: { asset_id: asset.id, variant_id: fallback.variant_id } } : {}), alt: 'Current inspector description' }] };
  const created = (await successful(await call('emails', 'POST', { title: 'Owned immutable private exports', spec }))).email;
  const checkpointKey = randomUUID(), headers = { 'If-Match': 'draft-' + created.doc_version, 'Idempotency-Key': checkpointKey };
  const revision = (await successful(await call('emails/' + created.id + '/revisions', 'POST', {}, headers))).revision;
  assert.equal((await successful(await call('emails/' + created.id + '/revisions', 'POST', {}, headers))).revision.id, revision.id);
  assert.deepEqual(revision.manifest.assets.entries.find((v: { variant_id: string }) => v.variant_id === entry.variant_id), entry); assert.equal(revision.spec.sections[0].alt, 'Current inspector description');
  assert.equal((await db.query('SELECT count(*)::int n FROM asset_revision_references WHERE workspace_id=$1 AND revision_id=$2', [workspace, revision.id])).rows[0].n, gif ? 2 : 1);
  const preview = (await successful(await call('emails/' + created.id + '/preview', 'POST', { spec }))).artifact; assert.ok(preview.html.includes(privateAssetBinding(entry))); assert.ok(preview.preview_html.includes('data:image/png;base64,')); assert.equal(preview.preview_html.includes(privateAssetBinding(entry)), false);
  const html = await call('email-revisions/' + revision.id + '/download?format=html'); assert.equal(html.status, 409); assert.equal((await html.json()).error.code, 'ASSET_PUBLICATION_NOT_CONFIGURED');
  const zipResponse = await call('email-revisions/' + revision.id + '/download?format=zip'); assert.equal(zipResponse.status, 200); assert.equal(zipResponse.headers.get('X-Artifact-Hash'), revision.artifact_hash);
  const zip = Buffer.from(await zipResponse.arrayBuffer()), zipAgain = Buffer.from(await (await call('email-revisions/' + revision.id + '/download?format=zip')).arrayBuffer()); assert.deepEqual(zip, zipAgain);
  const files = unzipSync(zip), image = Object.keys(files).find(name => name.startsWith('assets/') && name.includes(entry.variant_id))!; assert.deepEqual(Buffer.from(files[image]), actual); assert.ok(strFromU8(files[gif ? 'email-animated.html' : 'email.html']).includes(image)); assert.equal(strFromU8(files['email.html']).includes('mailcraft-assets.invalid'), false);
  if (fallback) { const staticImage = Object.keys(files).find(name => name.startsWith('assets/') && name.includes(fallback.variant_id))!; assert.ok(strFromU8(files['email.html']).includes(staticImage)); assert.equal(strFromU8(files['email.html']).includes(image), false); assert.equal(hash(files[staticImage]), fallback.sha256); }
  const preflight = (await successful(await call('email-revisions/' + revision.id + '/preflight', 'POST', {}))).report; assert.equal(preflight.rule_set_version, 'static-assets-4'); assert.ok(preflight.findings.some((f: { code: string }) => f.code === 'ASSET_PRIVATE_DELIVERY_UNAVAILABLE'));
  if(process.argv.includes('--settlement')){
    const issued=await successful(await call('api-keys','POST',{name:'Owned output lifecycle',scopes:['emails:export','assets:read'],expires_in_days:1}),201);
    const secret=randomBytes(32).toString('hex'),priorUrl=process.env.RENDER_WORKER_URL,priorSecret=process.env.RENDER_WORKER_SECRET;
    let release!:()=>void,entered!:()=>void;const held=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);let realRenderBytes=0;
    const renderer=createServer(async(req,res)=>{try{const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));const raw=Buffer.concat(chunks),requestId=verifyRenderRequest(raw,new Headers(Object.fromEntries(Object.entries(req.headers).map(([k,v])=>[k,Array.isArray(v)?v.join(','):v??'']))),secret),input=validateRenderInput(JSON.parse(raw.toString('utf8')));const rendered=await renderDownload(input.html,input.format,undefined,input.assets);realRenderBytes=rendered.length;entered();await held;res.writeHead(200,{'Content-Type':input.format==='png'?'image/png':'application/pdf','Content-Length':String(rendered.length),...renderResponseHeaders(rendered,input,secret,requestId)});res.end(rendered);}catch(error){res.writeHead(500);res.end('Owned fixture refused: '+(error as Error).message);}});
    await new Promise<void>(r=>renderer.listen(0,'127.0.0.1',r));process.env.RENDER_WORKER_URL='http://127.0.0.1:'+(renderer.address()as{port:number}).port;process.env.RENDER_WORKER_SECRET=secret;
    try{
      const request=new Request(origin+'/v1/email-revisions/'+revision.id+'/download?format=png',{headers:{Authorization:'Bearer '+issued.secret,'X-Workspace-Id':workspace,'X-Actor-Id':'api-key:'+issued.key.id}});
      const outcome=frozenRenderDownload(request,revision,'png').then(value=>({value}),error=>({error}));
      await Promise.race([started,outcome.then(result=>{if('error'in result)throw result.error;throw Error('Renderer completed without the lifecycle hold.');}),new Promise<never>((_,reject)=>{const timer=setTimeout(()=>reject(Error('Owned render entry deadline')),15000);timer.unref();})]);
      assert.ok(realRenderBytes>0,'The held output must come from actual Chromium rendering.');
      await db.query("UPDATE assets SET state='deleting'WHERE workspace_id=$1 AND id=$2",[workspace,asset.id]);release();
      const result=await outcome;assert.ok('error'in result,'A real render completing after committed takedown must be refused.');assert.equal((result.error as{code:string}).code,'ASSET_NOT_READY');
      assert.equal((await db.query('SELECT count(*)::int n FROM render_downloads WHERE workspace_id=$1 AND revision_id=$2',[workspace,revision.id])).rows[0].n,0,'Refused late render must not attach a cache row.');
      assert.equal((await db.query('SELECT artifact_hash FROM revisions WHERE id=$1',[revision.id])).rows[0].artifact_hash,revision.artifact_hash);
      note('Actual Chromium bytes held during committed asset takedown: final409 ASSET_NOT_READY, zero cache attachment, frozen revision preserved PASS.');
    }finally{release();await new Promise<void>(r=>renderer.close(()=>r()));if(priorUrl===undefined)delete process.env.RENDER_WORKER_URL;else process.env.RENDER_WORKER_URL=priorUrl;if(priorSecret===undefined)delete process.env.RENDER_WORKER_SECRET;else process.env.RENDER_WORKER_SECRET=priorSecret;await db.query("UPDATE assets SET state='ready_private'WHERE workspace_id=$1 AND id=$2",[workspace,asset.id]);}
  }
  const pngResponse = await call('email-revisions/' + revision.id + '/download?format=png'); assert.equal(pngResponse.status, 200, await pngResponse.clone().text()); const png = Buffer.from(await pngResponse.arrayBuffer());
  assert.deepEqual(png, Buffer.from(await (await call('email-revisions/' + revision.id + '/download?format=png')).arrayBuffer()));
  const pdfResponse = await call('email-revisions/' + revision.id + '/download?format=pdf'); assert.equal(pdfResponse.status, 200); assert.equal(Buffer.from(await pdfResponse.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
  browser = await chromium.launch({ headless: true }); const page = await browser.newPage(); await page.setContent(preview.preview_html); const imageLocator = page.locator('img').first(); await imageLocator.evaluate((img: HTMLImageElement) => img.decode());
  assert.deepEqual(await imageLocator.evaluate((img: HTMLImageElement) => { const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; const context = canvas.getContext('2d')!; context.drawImage(img, 0, 0); return Array.from(context.getImageData(0, 0, 1, 1).data); }), [255, 0, 0, 255]); await page.screenshot({ path: '/tmp/lettercape-media-export-preview.png' });
  const remixed = await successful(await call('email-revisions/' + revision.id + '/remix', 'POST', { title: 'Owned managed remix' }), 201); assert.deepEqual(remixed.revision.manifest.assets, revision.manifest.assets);
  const forkArtifact=(await successful(await call('emails/'+remixed.email.id+'/preview','POST',{spec:remixed.email.spec}))).artifact;
  const rawFork = (await successful(await call('emails/' + remixed.email.id + '/source-fork', 'POST', { expected_artifact_hash:forkArtifact.hash }, { 'If-Match': 'draft-' + remixed.email.doc_version }))).email;
  assert.equal(rawFork.spec.editing_mode, 'raw_html'); assert.equal(rawFork.spec.asset_registry.length, gif ? 2 : 1);
  const rawRevision = (await successful(await call('emails/' + rawFork.id + '/revisions', 'POST', {}, { 'If-Match': 'draft-' + rawFork.doc_version }))).revision; assert.deepEqual(rawRevision.manifest.assets, revision.manifest.assets);
  assert.equal(rawFork.spec.raw_html.includes('data:image/'),false,'Transient private preview bytes must not become canonical source');
  const rawPreview=(await successful(await call('emails/'+rawFork.id+'/preview','POST',{spec:rawFork.spec}))).artifact;
  await page.setContent(rawPreview.preview_html);const rawImage=page.locator('img').first();await rawImage.evaluate((img:HTMLImageElement)=>img.decode());assert.deepEqual(await rawImage.evaluate((img:HTMLImageElement)=>{const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const context=canvas.getContext('2d')!;context.drawImage(img,0,0);return Array.from(context.getImageData(0,0,1,1).data);}),[255,0,0,255]);
  note('Actual raw browser projection resolves the registered immutable static fallback pixel; canonical source contains no transient data image PASS.');
  assert.equal((await call('emails/' + created.id + '/draft', 'PATCH', { spec }, { 'If-Match': 'draft-999' })).status, 412);
  assert.equal((await call('assets/' + asset.id, 'GET', undefined, {}, other)).status, 404); assert.equal((await call('email-revisions/' + revision.id + '/download?format=zip', 'GET', undefined, {}, other)).status, 404);
  assert.equal((await call('assets/' + asset.id + '/variants/' + entry.variant_id + '/content', 'GET', undefined, { 'X-Actor-Id': user + '-changed' })).status, 409);
  const legacy = { ...blankSpec(brand, 'Actual private exports'), sections: [] }, savedLegacy = (await successful(await call('emails/' + created.id + '/draft', 'PATCH', { spec: legacy }, { 'If-Match': 'draft-1' }))).email;
  assert.equal((await db.query('SELECT count(*)::int n FROM asset_draft_references WHERE workspace_id=$1 AND email_id=$2', [workspace, created.id])).rows[0].n, 0);
  const restored = (await successful(await call('emails/' + created.id + '/restore', 'POST', { revision_id: revision.id }, { 'If-Match': 'draft-' + savedLegacy.doc_version }))).email; assert.equal(restored.spec.sections[0].asset_ref.variant_id, entry.variant_id);
  await db.query("UPDATE assets SET state='deleting' WHERE workspace_id=$1 AND id=$2", [workspace, asset.id]);
  for (const format of ['zip', 'png', 'pdf']) assert.notEqual((await call('email-revisions/' + revision.id + '/download?format=' + format)).status, 200, 'Current takedown must deny even cached private export.');
  note('Actual ' + (gif ? 'GIF/static fallback' : 'PNG') + ' upload/scans/derivative bytes → draft references → frozen revision/manifest/idempotency → exact static preview pixel → deterministic ZIP/PNG cache/PDF → remix/raw fork/CAS/cross-workspace/actor/ref removal/restore/takedown PASS.');
} finally {
  await browser?.close();
  const objects = (await db.query('SELECT source_key key FROM assets WHERE workspace_id=ANY($1::uuid[]) UNION SELECT object_key FROM asset_variants WHERE workspace_id=ANY($1::uuid[]) UNION SELECT object_key FROM asset_object_staging WHERE workspace_id=ANY($1::uuid[])', [workspaces])).rows, store = new FileAssetStore(process.env.ASSET_STORE_ROOT!);
  for (const object of objects) if (object.key) await store.removeAuthorized(object.key);
  const tx = await db.connect(); try { await tx.query('BEGIN'); for (const table of ['email_source_provenance','api_rate_events','api_keys','asset_revision_references', 'asset_draft_references', 'asset_variants', 'asset_scans', 'media_jobs', 'asset_object_staging', 'asset_rights', 'asset_uploads', 'assets', 'asset_quotas', 'email_lineage', 'render_downloads', 'preflights', 'idempotency', 'audit_events', 'operations', 'revisions', 'emails', 'brands', 'memberships']) await tx.query('DELETE FROM ' + table + ' WHERE workspace_id=ANY($1::uuid[])', [workspaces]); await tx.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])', [workspaces]); await tx.query('DELETE FROM auth_sessions WHERE token_hash=$1 AND user_id=$2', [token, user]); await tx.query('COMMIT'); } catch (error) { await tx.query('ROLLBACK'); throw error; } finally { tx.release(); await db.end();await closeDb(); }
  note('Exact owned export workspace/session/object cleanup PASS.'); await writeFile('/tmp/lettercape-media-export-evidence.log', evidence.join('\n') + '\n');
}
