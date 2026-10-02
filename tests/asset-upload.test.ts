import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { readUploadStream } from '../src/server/asset-upload';
import { bytesHash } from '../src/server/asset-store';
import { UploadIntentInput, MEDIA_LIMITS } from '../src/domain/assets';
test('stream counts actual chunks and hashes, rejects false length, compressed and interrupted content', async () => {
  const data = Buffer.from('actual chunked source'),
    digest = bytesHash(data);
  let consumed = 0;
  const request = new Request('http://localhost/content', {
    method: 'PUT',
    duplex: 'half',
    headers: { 'content-type': 'application/octet-stream', 'content-length': '1' },
    body: new ReadableStream({
      start(c) {
        c.enqueue(data.subarray(0, 4));
        c.enqueue(data.subarray(4));
        c.close();
      },
    }),
  } as RequestInit);
  await readUploadStream(request, data.length, digest, async (b) => {
    consumed += b.length;
  });
  assert.equal(consumed, data.length);
  await assert.rejects(
    () =>
      readUploadStream(
        new Request('http://localhost', {
          method: 'PUT',
          headers: { 'content-type': 'application/octet-stream' },
          body: data,
        }),
        3,
        digest,
      ),
    { code: 'ASSET_BYTES_LIMIT' },
  );
  await assert.rejects(
    () =>
      readUploadStream(
        new Request('http://localhost', {
          method: 'PUT',
          headers: { 'content-type': 'application/octet-stream', 'content-encoding': 'gzip' },
          body: data,
        }),
        data.length,
        digest,
      ),
    { code: 'ASSET_ENCODING_UNSUPPORTED' },
  );
  await assert.rejects(
    () =>
      readUploadStream(
        new Request('http://localhost', {
          method: 'PUT',
          headers: { 'content-type': 'application/octet-stream' },
          body: data.subarray(0, 3),
        }),
        data.length,
        digest,
      ),
    { code: 'ASSET_TRANSFER_MISMATCH' },
  );
  const c = new AbortController();
  c.abort();
  await assert.rejects(
    () =>
      readUploadStream(
        new Request('http://localhost', {
          method: 'PUT',
          headers: { 'content-type': 'application/octet-stream' },
          body: data,
          signal: c.signal,
        }),
        data.length,
        digest,
      ),
    { code: 'ASSET_TRANSFER_ABORTED' },
  );
});
test('real HTTP chunked body follows binary stream bound without JSON parser', async () => {
  const source = Buffer.from('HTTP actual binary source ' + randomUUID());
  const server = createServer(async (req, res) => {
    try {
      const request = new Request('http://localhost/content', {
        method: 'PUT',
        duplex: 'half',
        headers: { 'content-type': 'application/octet-stream' },
        body: Readable.toWeb(req) as ReadableStream,
      } as RequestInit);
      const bytes = await readUploadStream(request, source.length, bytesHash(source));
      res.writeHead(200, { 'content-type': 'application/octet-stream' });
      res.end(bytes);
    } catch {
      res.writeHead(413);
      res.end();
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${address.port}`, {
      method: 'PUT',
      duplex: 'half',
      body: new ReadableStream({
        start(c) {
          c.enqueue(source.subarray(0, 8));
          c.enqueue(source.subarray(8));
          c.close();
        },
      }),
    } as RequestInit);
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), source);
  } finally {
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
});
test('rights and finite actual upload declarations reject unknown and over-limit requests', () => {
  const input = {
    filename: 'source.png',
    declared_mime: 'image/png',
    byte_size: 8,
    sha256: 'a'.repeat(64),
    rights: { attested: true, terms_version: MEDIA_LIMITS.rights },
    alt: 'test',
    decorative: false,
  };
  assert.ok(UploadIntentInput.safeParse(input).success);
  for (const invalid of [
    { ...input, byte_size: MEDIA_LIMITS.upload + 1 },
    { ...input, rights: { ...input.rights, attested: false } },
    { ...input, declared_mime: 'image/svg+xml' },
  ])
    assert.equal(UploadIntentInput.safeParse(invalid).success, false);
});
