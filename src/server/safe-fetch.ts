import { lookup } from 'node:dns/promises';
import { isIP, BlockList } from 'node:net';
import https from 'node:https';
import http from 'node:http';
import { fail } from './errors';
const blocked = new BlockList();
for (const [a, p] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['100.64.0.0', 10],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  blocked.addSubnet(a, p, 'ipv4');
const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
for (const [address, prefix] of [
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
] as const)
  blocked.addSubnet(address, prefix, 'ipv6');
export function publicAddress(ip: string) {
  const v = isIP(ip);
  if (v === 4) return !blocked.check(ip, 'ipv4');
  if (v === 6) return globalV6.check(ip, 'ipv6') && !blocked.check(ip, 'ipv6');
  return false;
}
export function validatePublicUrl(input: string) {
  const u = new URL(input);
  const hostname = u.hostname.replace(/^\[|\]$/g, '');
  if (
    !['http:', 'https:'].includes(u.protocol) ||
    u.username ||
    u.password ||
    (u.port && !['80', '443'].includes(u.port)) ||
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    (isIP(hostname) && !publicAddress(hostname))
  )
    fail(
      422,
      'UNSAFE_URL',
      'Use a public HTTP/HTTPS URL without credentials or private addresses.',
    );
  return u;
}
async function withinDeadline<T>(promise: Promise<T>, deadline: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Brand fetch deadline exceeded')),
          Math.max(1, deadline - Date.now()),
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export async function safeFetchHtml(input: string,signal?:AbortSignal): Promise<{ html: string; url: string }> {
  const deadline = Date.now() + 15000;
  let u = validatePublicUrl(input);
  for (let redirects = 0; redirects <= 5; redirects++) {
    signal?.throwIfAborted();
    const hostname = u.hostname.replace(/^\[|\]$/g, '');
    const answers = await withinDeadline(lookup(hostname, { all: true }), deadline);
    signal?.throwIfAborted();
    if (!answers.length || answers.some((a) => !publicAddress(a.address)))
      fail(422, 'UNSAFE_URL', 'The URL resolves to a private or reserved network.');
    const pinned = answers[0];
    const response = await new Promise<{
      status: number;
      location?: string;
      mime: string;
      html: string;
    }>((resolve, reject) => {
      const req = (u.protocol === 'https:' ? https : http).get(
        u,
        {
          signal,
          headers: {
            'User-Agent': 'LettercapeBrandReview/1.0',
            Accept: 'text/html',
            'Accept-Encoding': 'identity',
          },
          lookup: (_host, _options, cb) => cb(null, pinned.address, pinned.family),
        },
        (res) => {
          const status = res.statusCode ?? 0,
            mime = String(res.headers['content-type'] ?? '');
          if ([301, 302, 303, 307, 308].includes(status)) {
            res.destroy();
            resolve({ status, location: res.headers.location, mime, html: '' });
            return;
          }
          if (!mime.toLowerCase().includes('text/html')) {
            res.destroy();
            reject(new Error('Expected HTML content'));
            return;
          }
          let size = 0;
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => {
            size += chunk.length;
            if (size > 5 * 1024 * 1024) req.destroy(new Error('Response exceeds 5 MiB'));
            else chunks.push(chunk);
          });
          res.on('end', () =>
            resolve({
              status,
              location: res.headers.location,
              mime,
              html: Buffer.concat(chunks).toString('utf8'),
            }),
          );
          res.on('error', reject);
        },
      );
      const timer = setTimeout(
        () => req.destroy(new Error('Brand fetch deadline exceeded')),
        Math.max(1, deadline - Date.now()),
      );
      req.on('close', () => clearTimeout(timer));
      req.setTimeout(10000, () => req.destroy(new Error('Brand fetch timed out')));
      req.on('error', reject);
    });
    if ([301, 302, 303, 307, 308].includes(response.status) && response.location) {
      u = validatePublicUrl(new URL(response.location, u).href);
      continue;
    }
    if (response.status < 200 || response.status >= 300)
      fail(
        503,
        'BRAND_FETCH_FAILED',
        'The public website could not be fetched. Manual brand setup remains available.',
      );
    return { html: response.html, url: u.href };
  }
  fail(422, 'REDIRECT_LIMIT', 'The website redirects too many times.');
}
