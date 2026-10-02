// Run inside the dedicated fixture container. No provider or application credentials.
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import {
  RENDERER_VERSION, MAX_RENDER_INPUT, bytesDigest,
  renderRequestHeaders, verifyRenderResponse,
} from '/app/protocol.mjs';
assert.equal(process.getuid(), 1001);
const secret = randomBytes(32).toString('hex');
let outbound = 0;
const trap = createServer((_req, res) => { outbound++; res.end('External resource must not load'); });
await new Promise((resolve) => trap.listen(3089, '127.0.0.1', resolve));
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: '/app', stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    PATH: process.env.PATH,
    PLAYWRIGHT_BROWSERS_PATH: '/ms-playwright',
    NODE_ENV: 'test', RENDER_LOCAL_FIXTURES_ONLY: 'true',
    RENDER_WORKER_SECRET: secret, HOST: '127.0.0.1', PORT: '3088',
  },
});
let errors = '';
child.stderr.on('data', (chunk) => { errors += chunk; });
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Renderer fixture startup deadline')), 10000);
    child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Renderer startup ${code}: ${errors}`)); });
    child.stdout.once('data', () => { clearTimeout(timer); resolve(); });
  });
  const origin = 'http://127.0.0.1:3088/render';
  const input = {
    schema_version: 1, workspace_id: randomUUID(), revision_id: randomUUID(),
    artifact_hash: bytesDigest(Buffer.from('Fixture frozen artifact')),
    renderer_version: RENDERER_VERSION, format: 'png',
    html: '<html><body><h1>Lettercape frozen fixture</h1><p>Sandboxed export</p><img src="http://127.0.0.1:3089/image"><style>@font-face{font-family:trap;src:url(http://127.0.0.1:3089/font)}body{font-family:trap,Arial}</style><script>fetch("http://127.0.0.1:3089/script")</script><iframe src="http://127.0.0.1:3089/frame"></iframe></body></html>',
  };
  async function post(value, id = randomUUID()) {
    const body = JSON.stringify(value);
    const response = await fetch(origin, {
      method: 'POST', body, headers: renderRequestHeaders(Buffer.from(body), secret, id),
      signal: AbortSignal.timeout(30000), redirect: 'error',
    });
    return { response, id };
  }
  assert.equal((await fetch(origin)).status, 404);
  assert.equal((await fetch(origin, { method: 'POST', body: '{}' })).status, 401);
  assert.equal((await post({ ...input, session: 'must-not-accept' })).response.status, 422);
  const signed = await post(input);
  assert.equal(signed.response.status, 200);
  const png = Buffer.from(await signed.response.arrayBuffer());
  verifyRenderResponse(png, signed.response.headers, input, secret, signed.id);
  assert.ok(png.length > 1000);
  writeFileSync('/evidence/renderer.png', png);
  assert.equal((await post(input, signed.id)).response.status, 409);
  const pdfInput = { ...input, format: 'pdf' };
  const pdfResult = await post(pdfInput);
  assert.equal(pdfResult.response.status, 200);
  const pdf = Buffer.from(await pdfResult.response.arrayBuffer());
  verifyRenderResponse(pdf, pdfResult.response.headers, pdfInput, secret, pdfResult.id);
  assert.ok(pdf.length > 1000);
  writeFileSync('/evidence/renderer.pdf', pdf);
  const oversized = await fetch(origin, { method: 'POST', body: 'x'.repeat(MAX_RENDER_INPUT + 1) });
  assert.equal(oversized.status, 413);
  assert.equal((await post({ ...input, html: '<div style="height:25000px">Oversize</div>' })).response.status, 422);
  const concurrent = await Promise.all([post(input), post(input), post(input)]);
  assert.deepEqual(concurrent.map((x) => x.response.status).sort(), [200, 200, 429]);
  await Promise.all(concurrent.map((x) => x.response.arrayBuffer()));
  const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFElEQVQImWP4z8DwH4YZ4AwGBgYAloMJ96/bNGoAAAAASUVORK5CYII=','base64'),url=`https://mailcraft-assets.invalid/${randomUUID()}/${randomUUID()}/${bytesDigest(image)}`;
  const mediaInput={...input,schema_version:2,html:`<html><body style="margin:0"><img src="${url}" width="3" height="2" style="display:block"><img src="http://127.0.0.1:3089/media-unbound"></body></html>`,assets:[{url,mime:'image/png',sha256:bytesDigest(image),base64:image.toString('base64')}]};
  const mediaResult=await post(mediaInput);assert.equal(mediaResult.response.status,200);const mediaPng=Buffer.from(await mediaResult.response.arrayBuffer());verifyRenderResponse(mediaPng,mediaResult.response.headers,mediaInput,secret,mediaResult.id);writeFileSync('/evidence/renderer-private-assets.png',mediaPng);
  const {chromium}=await import('/app/node_modules/playwright/index.mjs');const inspector=await chromium.launch({headless:true,chromiumSandbox:true});try{const page=await inspector.newPage();await page.setContent(`<img src="data:image/png;base64,${mediaPng.toString('base64')}">`);await page.locator('img').evaluate(img=>img.decode());assert.deepEqual(await page.locator('img').evaluate(img=>{const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const context=canvas.getContext('2d');context.drawImage(img,0,0);return Array.from(context.getImageData(0,0,1,1).data);}),[255,0,0,255]);}finally{await inspector.close();}
  const mediaPdfInput={...mediaInput,format:'pdf'},mediaPdfResult=await post(mediaPdfInput);assert.equal(mediaPdfResult.response.status,200);const mediaPdf=Buffer.from(await mediaPdfResult.response.arrayBuffer());verifyRenderResponse(mediaPdf,mediaPdfResult.response.headers,mediaPdfInput,secret,mediaPdfResult.id);writeFileSync('/evidence/renderer-private-assets.pdf',mediaPdf);
  assert.equal((await post({...mediaInput,assets:[{...mediaInput.assets[0],sha256:'b'.repeat(64)}]})).response.status,422);
  assert.equal((await post({...mediaInput,assets:[{...mediaInput.assets[0],url:'https://example.com/fake.png'}]})).response.status,422);
  assert.equal(outbound, 0);
  console.log(JSON.stringify({ uid: process.getuid(), version: RENDERER_VERSION, png: png.length, pdf: pdf.length,
    checks: 'sandbox enabled; Docker network none; signed real PNG/PDF; replay/tamper/shape/size/dimensions/capacity denied; image/font/script/frame tripwire zero; signed exact private PNG pixel and PDF; wrong private hash/URL denied', outbound }));
} finally {
  child.kill('SIGTERM');
  trap.close();
  await new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once('exit', resolve);
    setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 5000).unref();
  });
}
