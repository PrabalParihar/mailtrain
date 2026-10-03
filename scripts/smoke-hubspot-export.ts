/** Actual owned HTTP/Chromium acceptance. No provider account, generation or delivery. */
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { open, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { chromium, type Page, type Route, type Request as BrowserRequest } from 'playwright';
import { sourceDatabase } from './smoke-source-truth';
import { blankSpec, type EmailSpec } from '../src/domain/email';
import { createEmail, checkpoint } from '../src/server/emails';
import { digest } from '../src/server/audit';
import { LettercapeClient } from '../sdk/client';
import type { HubSpotFooterSettingsData, HubSpotReview } from '../src/domain/hubspot-footer-contracts';
type LateDownloadGate = {
    phase: 'armed' | 'chunk' | 'digest' | 'released';
    bytes: Uint8Array; pulls: number; digestCalls: number;
    release: () => void; restore: () => void;
};
const origin = 'http://127.0.0.1:3004';
const scratch = '/tmp/lettercape-hubspot-footer-task5-' + Date.now();
const settings: HubSpotFooterSettingsData = { company_name: 'Owned Fixture Company', company_street_address_1: '123 Fixture Road', company_street_address_2: 'Suite 7', company_city: 'Fixture City', company_state: 'CA', company_zip: '90210', company_country: 'US' };
const address = '123 Fixture Road, Suite 7, Fixture City, CA 90210, US';
const labels = ['HubSpot company name', 'HubSpot street address 1', 'HubSpot street address 2', 'HubSpot city', 'HubSpot state', 'HubSpot ZIP', 'HubSpot country'];
const keys = Object.keys(settings) as (keyof HubSpotFooterSettingsData)[];
const sha = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const invalid = 'Add all required HubSpot account footer values for local comparison. Account settings access has not been verified.';
const mismatch = 'The saved footer company name or address differs from these HubSpot values. The saved footer remains unchanged; use matching values to continue.';
const unavailable = 'HubSpot preparation could not be verified. Review the current version again.';
let group = 'guards', groups = 0;
function pass(name: string) { groups++; console.log('PASS ' + groups + ' ' + name); group = name; }
async function bounded<T>(pending: Promise<T>, name: string): Promise<T> { let timer: ReturnType<typeof setTimeout> | undefined; try {
    return await Promise.race([pending, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('Timed out: ' + name)), 20000); })]);
}
finally {
    clearTimeout(timer);
} }
type DownloadEventEvidence = {filename:string;url:string;phase:string;actor:string;workspace:string};
function forbidHubSpotDownloads(page:Page, context:()=>Omit<DownloadEventEvidence,'filename'|'url'>) {
    const events:DownloadEventEvidence[]=[];
    const forbidden:DownloadEventEvidence[]=[];
    const listener=(download:import('playwright').Download)=>{
        const event={filename:download.suggestedFilename(),url:page.url(),...context()};
        events.push(event);
        if(event.filename.startsWith('hubspot-prepared-'))forbidden.push(event);
    };
    page.on('download',listener);
    return {events,forbidden,check:()=>assert.equal(forbidden.length,0,'Forbidden delayed HubSpot download: '+JSON.stringify(forbidden)),close:()=>page.off('download',listener)};
}
async function vacant() { const s = createServer(); await new Promise<void>((resolve, reject) => { s.once('error', () => reject(Error('Owned app port 3004 is occupied; no existing process touched.'))); s.listen(3004, '127.0.0.1', () => s.close(() => resolve())); }); }
await mkdir(scratch, { recursive: true });
console.log('Artifacts ' + scratch);
await vacant();
const started = performance.now();
try {
    await sourceDatabase(async ({ db, p, brand, tx }) => {
        assert.equal(process.env.LOCAL_DEVELOPMENT, 'true');
        const fixture = new URL(db.options.connectionString!);
        assert.ok(['localhost', '127.0.0.1'].includes(fixture.hostname));
        assert.match(fixture.pathname, /^\/creation_fixture_[a-f0-9]{32}$/);
        const runtime = new URL(process.env.DATABASE_URL!);
        assert.ok(['localhost', '127.0.0.1'].includes(runtime.hostname));
        runtime.pathname = fixture.pathname;
        const spec = blankSpec(brand, settings.company_name);
        spec.subject = 'Owned frozen subject';
        spec.sections = spec.sections.map(b => b.type === 'button' ? { ...b, href: 'https://example.org/offer' } : b.type === 'legal_footer' ? { ...b, address } : b.type === 'text' ? { ...b, text: 'Nonfooter repeated: ' + settings.company_name + ' — ' + address } : b);
        const email = await tx(c => createEmail(c, p, 'Owned HubSpot acceptance', spec)), frozen = await tx(c => checkpoint(c, p, email.id, 1));
        const other = await tx(c => createEmail(c, p, 'Owned second email', { ...spec, subject: 'Other owned subject' }));
        const viewer = 'fixture-viewer-' + randomUUID(), secondActor = 'fixture-owner-' + randomUUID(), foreign = randomUUID();
        await db.query("INSERT INTO workspaces(id,name) VALUES($1,'Owned second workspace')", [foreign]);
        await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Viewer'),($1,$3,'Owner'),($4,$5,'Owner')", [p.workspace, viewer, secondActor, foreign, p.user]);
        const cookies = [p.user, viewer, secondActor].map(user => ({ user, value: randomBytes(32).toString('hex') }));
        for (const c of cookies)
            await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,clock_timestamp()+interval '1 hour')", [digest(c.value), c.user]);
        async function key(scopes: string[]) { const token = 'lc_' + randomBytes(32).toString('hex'), id = randomUUID(); await db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at) VALUES($1,$2,$3,'owned fixture',$4,$5,clock_timestamp()+interval '1 hour')", [p.workspace, id, digest(token), JSON.stringify(scopes), p.user]); return { token, id }; }
        const exportKey = await key(['emails:export']), readKey = await key(['emails:read']);
        const baseline = async () => Object.fromEntries(await Promise.all(['operations', 'outbox', 'usage_ledger'].map(async (t) => [t, (await db.query('SELECT count(*)::int n FROM ' + t)).rows[0].n])));
        const counts = await baseline();
        const original = (await tx(c => c.query('SELECT spec,html,plaintext,artifact_hash,manifest FROM revisions WHERE id=$1', [frozen.id]))).rows[0];
        await writeFile(scratch + '/source-manifest.json', JSON.stringify({ revision: frozen.id, html_sha256: sha(original.html), text_sha256: sha(original.plaintext), artifact_hash: original.artifact_hash }));
        const log = await open(scratch + '/app.log', 'w');
        let app: ChildProcess | undefined, browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
        let finalScopeDownloadCheck:(()=>Promise<void>)|undefined;
        try {
            app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3004'], { env: { PATH: process.env.PATH, NODE_ENV: 'development', LOCAL_DEVELOPMENT: 'true', APP_ORIGIN: origin, DATABASE_URL: runtime.toString(), MIGRATION_DATABASE_URL: fixture.toString(), PREFERENCE_SIGNING_SECRET: randomBytes(32).toString('hex'), NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', log.fd, log.fd] });
            for (let n = 0; n < 120; n++) {
                if (app.exitCode !== null)
                    throw Error('Owned app exited');
                try {
                    if ((await fetch(origin)).ok)
                        break;
                }
                catch { }
                if (n === 119)
                    throw Error('Owned app unavailable');
                await new Promise(r => setTimeout(r, 250));
            }
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
            context.setDefaultTimeout(20000);
            const cookie = async (user: string) => { await context.addCookies([{ name: 'mailcraft_local_session', value: cookies.find(c => c.user === user)!.value, url: origin, sameSite: 'Strict' }]); };
            await cookie(p.user);
            // Playwright's built-in worker blocker throws on opaque sandbox frames.
            // Deny registration without requiring allow-same-origin on the real preview.
            await context.addInitScript(w => { try {
                if (navigator.serviceWorker)
                    navigator.serviceWorker.register = async () => { throw Error('Owned fixture blocks worker registration'); };
            }
            catch (error) {
                if (!(error instanceof DOMException && error.name === 'SecurityError'))
                    throw error;
            } if (top === window)
                localStorage.setItem('mailcraft.workspace', w); }, p.workspace);
            let external = 0;
            await context.route(url => url.origin !== origin && !['blob:', 'data:', 'about:'].includes(url.protocol), r => { external++; return r.abort(); });
            const page = await context.newPage(), pageerrors: string[] = [];
            page.on('pageerror', e => pageerrors.push(e.stack ?? e.message));
            page.on('dialog', d => d.accept());
            let downloads = 0;
            page.on('download', () => downloads++);
            const requests: {
                path: string;
                method: string;
                settingsBody: boolean;
            }[] = [];
            page.on('request', r => { const u = new URL(r.url()); if (u.pathname.includes('hubspot-')) {
                assert.equal(u.search, '');
                assert.ok(!u.href.includes(settings.company_name));
                requests.push({ path: u.pathname, method: r.method(), settingsBody: !!r.postData()?.includes('company_name') });
            } });
            const headers = { 'X-Workspace-Id': p.workspace, 'X-Actor-Id': p.user, Origin: origin };
            const endpoint = (id = frozen.id, operation = 'review') => origin + '/v1/email-revisions/' + id + '/hubspot-' + operation;
            const post = (body: unknown, id = frozen.id, operation = 'review', extra: Record<string, string> = {}) => context.request.post(endpoint(id, operation), { headers: { ...headers, ...extra }, data: body });
            async function error(r: Awaited<ReturnType<typeof post>>, status: number, code?: string, message?: string) { assert.equal(r.status(), status); const body = await r.json(); assert.deepEqual(Object.keys(body).sort(), ['error', 'request_id']); assert.equal(typeof body.request_id, 'string'); if (code)
                assert.equal(body.error.code, code); if (message)
                assert.equal(body.error.message, message); const text = JSON.stringify(body); for (const marker of [settings.company_name, address, 'PRIVATE_BODY_MARKER'])
                assert.ok(!text.includes(marker)); }
            const response = await post({ settings });
            assert.equal(response.status(), 200);
            const review: HubSpotReview = (await response.json()).review;
            assert.equal(review.revision_id, frozen.id);
            assert.equal(review.source_artifact_hash, frozen.artifact_hash);
            assert.equal(review.settings_digest, sha(JSON.stringify(['hubspot-footer-comparison-1', ...keys.map(k => settings[k])])));
            assert.deepEqual(review.blockers, ['CONNECTION_AUTH_MODE_UNAPPROVED', 'HUBSPOT_ACCOUNT_SETTINGS_UNVERIFIED', 'ACCOUNT_ENTITLEMENT_UNVERIFIED', 'REAL_CLIENT_PREFLIGHT_UNAVAILABLE', 'DESTINATION_CONFORMANCE_UNVERIFIED', 'DURABLE_REMOTE_EXPORT_UNAVAILABLE', 'MANAGEMENT_LINK_UNVERIFIED']);
            for (const k of ['remote_export_enabled', 'account_settings_verified', 'native_conformance_verified', 'management_link_verified'] as const)
                assert.equal(review[k], false);
            for (const k of ['html', 'text', 'subject', 'settings', 'api_revision', 'url'])
                assert.equal(Object.hasOwn(review, k), false);
            assert.ok(!JSON.stringify(review).includes(settings.company_name));
            for (const format of ['html', 'txt'] as const) {
                const r = await post({ settings, format, expected_destination_hash: review.destination_hash }, frozen.id, 'artifact');
                assert.equal(r.status(), 200);
                const bytes = await r.body();
                assert.equal(sha(bytes), format === 'html' ? review.html_sha256 : review.text_sha256);
                assert.equal(r.headers()['x-artifact-hash'], review.destination_hash);
                assert.equal(r.headers()['x-source-artifact-hash'], review.source_artifact_hash);
                assert.equal(r.headers()['x-content-sha256'], sha(bytes));
                assert.equal(r.headers()['x-destination-mapping'], 'hubspot-coded-footer-1');
                assert.equal(r.headers()['x-remote-export-enabled'], 'false');
                assert.equal(r.headers()['cache-control'], 'no-store');
                assert.equal(r.headers()['x-content-type-options'], 'nosniff');
                assert.equal(r.headers()['content-security-policy'], "sandbox; default-src 'none'");
                assert.ok(r.headers()['content-disposition'].includes(frozen.id + '.' + format));
                assert.ok(r.headers()['x-mailcraft-notice'].includes('unverified'));
                const text = bytes.toString();
                for (const field of keys)
                    assert.ok(text.includes('{{ site_settings.' + field + (format === 'html' ? '|escape_html' : '') + ' }}'));
                assert.ok(r.headers()['x-request-id']);
                assert.equal(r.headers()['content-type'], format === 'html' ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8');
                assert.ok(text.includes(format === 'html' ? '{{ unsubscribe_link|escape_url }}' : '{{ unsubscribe_link }}'));
                assert.ok(!text.includes('{{UNSUBSCRIBE_URL}}'));
                assert.ok(text.includes('Nonfooter repeated: ' + settings.company_name));
                assert.ok(text.includes(address));
                if (format === 'html')
                    assert.ok(text.includes('class="hubspot-mergetag" data-unsubscribe="true"'));
                await writeFile(scratch + '/http.' + format, bytes);
            }
            assert.deepEqual((await tx(c => c.query('SELECT spec,html,plaintext,artifact_hash,manifest FROM revisions WHERE id=$1', [frozen.id]))).rows[0], original);
            pass('HTTP metadata, both native artifacts, byte hashes, privacy and RLS source preservation');
            // Dropping the digest from destination identity would allow the ambiguous same-address input.
            const ambiguous = { ...settings, company_street_address_1: '123 Fixture Road, Suite 7', company_street_address_2: '' };
            const ambiguousReview = await post({ settings: ambiguous });
            assert.equal(ambiguousReview.status(), 200);
            const ar = (await ambiguousReview.json()).review;
            assert.notEqual(ar.settings_digest, review.settings_digest);
            assert.notEqual(ar.destination_hash, review.destination_hash);
            const audits = async () => (await db.query("SELECT action,resource_id FROM audit_events WHERE action LIKE 'revision.destination_%' ORDER BY event_sequence")).rows;
            const auditBefore = await audits();
            await error(await post({ settings, format: 'html', expected_destination_hash: '0'.repeat(64) }, frozen.id, 'artifact'), 409, 'HUBSPOT_REVIEW_CHANGED');
            await error(await post({ settings: ambiguous, format: 'html', expected_destination_hash: review.destination_hash }, frozen.id, 'artifact'), 409, 'HUBSPOT_REVIEW_CHANGED');
            assert.deepEqual(await audits(), auditBefore);
            assert.ok(auditBefore.every(a => ['revision.destination_reviewed', 'revision.destination_downloaded'].includes(a.action) && a.resource_id === frozen.id));
            assert.ok(!JSON.stringify((await db.query('SELECT * FROM audit_events')).rows).includes(settings.company_name));
            const sdkRequests: {
                path: string;
                body: unknown;
            }[] = [];
            const sdk = new LettercapeClient({ baseUrl: origin, apiKey: exportKey.token, maxRetries: 0, fetch: async (req) => { const u = new URL(req.url); assert.equal(u.origin, origin); assert.equal(u.search, ''); sdkRequests.push({ path: u.pathname, body: JSON.parse(await req.clone().text()) }); return fetch(req); } });
            const sr = await sdk.call('reviewHubSpotRevision', { path: { id: frozen.id }, body: { settings } });
            assert.equal(sr.status, 200);
            assert.equal(sr.data.review.destination_hash, review.destination_hash);
            for (const format of ['html', 'txt'] as const) {
                const r = await sdk.call('downloadHubSpotRevision', { path: { id: frozen.id }, body: { settings, format, expected_destination_hash: review.destination_hash } });
                assert.equal(sha(r.data), format === 'html' ? review.html_sha256 : review.text_sha256);
                assert.equal(r.headers.get('x-artifact-hash'), review.destination_hash);
                assert.equal(r.headers.get('x-content-sha256'), sha(r.data));
            }
            assert.equal(sdkRequests.length, 3);
            assert.deepEqual(sdkRequests[0].body, { settings });
            const abort = new AbortController();
            abort.abort();
            await assert.rejects(sdk.call('reviewHubSpotRevision', { path: { id: frozen.id }, body: { settings }, signal: abort.signal }));
            assert.equal(sdkRequests.length, 3);
            let releaseSdk!: () => void, arriveSdk!: () => void;
            const holdSdk = new Promise<void>(r => releaseSdk = r), fetchedSdk = new Promise<void>(r => arriveSdk = r), signal = new AbortController();
            const interrupted = new LettercapeClient({ baseUrl: origin, apiKey: exportKey.token, maxRetries: 0, fetch: async (req) => { const actual = await fetch(req); arriveSdk(); await holdSdk; return actual; } });
            const sdkPending = interrupted.call('reviewHubSpotRevision', { path: { id: frozen.id }, body: { settings }, signal: signal.signal });
            const sdkRejected = assert.rejects(sdkPending);
            await bounded(fetchedSdk, 'SDK actual held response');
            signal.abort();
            releaseSdk();
            await sdkRejected;
            pass('SDK actual POST/binary receipts, digest hash fences, private audit and pre/held abort');
            for (const [data, status, code, message] of [['{}', 409, 'HUBSPOT_SETTINGS_INVALID', invalid], ['[]', 400, 'MALFORMED_JSON', 'Use a JSON object.'], ['{PRIVATE_BODY_MARKER', 400, 'MALFORMED_JSON', 'Use valid JSON.'], ['', 400, 'JSON_BODY_REQUIRED', 'Provide a JSON object body.']] as const)
                await error(await context.request.post(endpoint(), { headers: { ...headers, 'Content-Type': 'application/json' }, data: Buffer.from(data) }), status, code, message);
            for (const body of [{ settings: { ...settings, company_name: 'PRIVATE_BODY_MARKER\n' } }, { settings, unknown: 'PRIVATE_BODY_MARKER' }, { settings, account_settings_verified: true }, { settings: { ...settings, extra: true } }])
                await error(await post(body), 409, 'HUBSPOT_SETTINGS_INVALID', invalid);
            await error(await post({ settings, format: 'pdf', expected_destination_hash: review.destination_hash }, frozen.id, 'artifact'), 409, 'HUBSPOT_SETTINGS_INVALID', invalid);
            await error(await context.request.post(endpoint(), { headers: { ...headers, 'Content-Type': 'text/plain' }, data: 'PRIVATE_BODY_MARKER' }), 415, 'JSON_CONTENT_TYPE_UNSUPPORTED', 'Use application/json with UTF-8.');
            await error(await context.request.post(endpoint(), { headers: { ...headers, 'Content-Type': 'application/json', 'Content-Encoding': 'identity' }, data: '{}' }), 415, 'JSON_ENCODING_UNSUPPORTED', 'Compressed JSON requests are not supported.');
            await error(await context.request.post(endpoint(), { headers: { ...headers, 'Content-Type': 'application/json' }, data: Buffer.from([123, 34, 120, 34, 58, 34, 255, 34, 125]) }), 400, 'MALFORMED_JSON', 'Use valid JSON.');
            const oversized = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array(9000).fill(32)); c.enqueue(new Uint8Array(9000).fill(32)); c.close(); } });
            const streamResponse = await fetch(endpoint(), { method: 'POST', headers: { Authorization: 'Bearer ' + exportKey.token, 'Content-Type': 'application/json' }, body: oversized, duplex: 'half' } as RequestInit);
            assert.equal(streamResponse.status, 413);
            const streamError = await streamResponse.json();
            assert.equal(streamError.error.code, 'PAYLOAD_TOO_LARGE');
            assert.equal(streamError.error.message, 'Request exceeds 16384 bytes.');
            for (const operation of ['review', 'artifact']) {
                await error(await context.request.get(endpoint(frozen.id, operation), { headers }), 405, 'METHOD_NOT_ALLOWED');
                await error(await context.request.post(endpoint(frozen.id, operation) + '?PRIVATE_BODY_MARKER=1', { headers, data: { settings } }), 422, 'VALIDATION_FAILED');
            }
            await error(await post({ settings }, 'invalid-id'), 404, 'RESOURCE_NOT_FOUND');
            await error(await post({ settings }, randomUUID()), 404, 'RESOURCE_NOT_FOUND');
            await error(await post({ settings }, frozen.id, 'review', { 'X-Workspace-Id': foreign }), 404, 'RESOURCE_NOT_FOUND');
            await error(await post({ settings }, frozen.id, 'review', { 'X-Actor-Id': viewer }), 409, 'ACTOR_CHANGED');
            for (const operation of ['review', 'artifact']) {
                const data = operation === 'review' ? { settings } : { settings, format: 'html', expected_destination_hash: review.destination_hash };
                await error(await context.request.post(endpoint(frozen.id, operation), { headers: { Authorization: 'Bearer ' + readKey.token }, data }), 403);
            }
            await db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1 AND user_id=$2", [p.workspace, p.user]);
            await error(await post({ settings }), 403);
            await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2", [p.workspace, p.user]);
            const revoked = await key(['emails:export']);
            await db.query('UPDATE api_keys SET scopes=$2 WHERE id=$1', [revoked.id, JSON.stringify(['emails:read'])]);
            await error(await context.request.post(endpoint(), { headers: { Authorization: 'Bearer ' + revoked.token }, data: { settings } }), 403);
            await db.query('UPDATE api_keys SET revoked_at=clock_timestamp() WHERE id=$1', [revoked.id]);
            await error(await context.request.post(endpoint(), { headers: { Authorization: 'Bearer ' + revoked.token }, data: { settings } }), 401);
            pass('Strict actual bodies/stream budget, methods/query/id/tenant/actor, scopes/current role/key revocation');
            // Actual server compiler fixtures: empty optional components, Unicode and two nested footers.
            for (const variant of ['empty-optionals', 'unicode', 'nested'] as const) {
                const declared = variant === 'empty-optionals' ? { ...settings, company_street_address_2: '', company_zip: '', company_country: '' } : variant === 'unicode' ? { ...settings, company_name: 'Owned café 雪 é', company_city: 'Cité 雪' } : settings;
                const fixtureAddress = variant === 'empty-optionals' ? '123 Fixture Road, Fixture City, CA' : variant === 'unicode' ? '123 Fixture Road, Suite 7, Cité 雪, CA 90210, US' : address;
                let sections: EmailSpec['sections'] = spec.sections.map(b => b.type === 'legal_footer' ? { ...b, identity: declared.company_name, address: fixtureAddress } : b);
                if (variant === 'nested') {
                    const footer = sections.find(b => b.type === 'legal_footer')!;
                    assert.equal(footer.type, 'legal_footer');
                    sections = sections.filter(b => b.type !== 'legal_footer').concat({ id: 'nested-footers', type: 'columns', columns: [[{ ...footer, id: 'nested-one' }], [{ ...footer, id: 'nested-two' }]] });
                }
                const e = await tx(c => createEmail(c, p, 'Owned ' + variant, { ...spec, sections })), r = await tx(c => checkpoint(c, p, e.id, 1));
                const rr = await post({ settings: declared }, r.id);
                assert.equal(rr.status(), 200);
                const receipt = (await rr.json()).review;
                const mapped = await post({ settings: declared, format: 'html', expected_destination_hash: receipt.destination_hash }, r.id, 'artifact');
                assert.equal(mapped.status(), 200);
                const bytes = await mapped.body();
                assert.equal(sha(bytes), receipt.html_sha256);
                if (variant === 'nested')
                    assert.equal(bytes.toString().split('data-unsubscribe="true"').length - 1, 2);
                if (variant === 'empty-optionals') {
                    assert.ok(!bytes.toString().includes('site_settings.company_zip'));
                    assert.ok(!bytes.toString().includes('site_settings.company_street_address_2'));
                }
            }
            pass('Actual checkpoint compiler optional-empty/Unicode/nested two-footer variants');
            const panel = () => page.getByRole('region', { name: 'HubSpot preparation' }), subject = () => page.getByRole('textbox', { name: 'Subject', exact: true });
            const reviews = () => requests.filter(r => r.path.endsWith('/hubspot-review')).length;
            const revisionCount = async (id: string) => (await db.query('SELECT count(*)::int n FROM revisions WHERE email_id=$1', [id])).rows[0].n;
            async function fill(declared: HubSpotFooterSettingsData = settings) { for (let n = 0; n < keys.length; n++)
                await page.getByLabel(labels[n], { exact: true }).fill(declared[keys[n]]); }
            async function goto(id = email.id) { await page.goto(origin + '/app/emails/' + id); await subject().waitFor(); await page.getByLabel('ESP destination').selectOption('hubspot'); await panel().waitFor(); }
            async function ready() { await panel().getByRole('button', { name: /^(Review|Refresh) HubSpot preparation$/ }).waitFor(); await page.waitForFunction(() => { const b = document.querySelector<HTMLButtonElement>('section[aria-label="HubSpot preparation"] button'); return !!b && !b.disabled; }); }
            async function reviewUI() { await ready(); await panel().getByRole('button', { name: /^(Review|Refresh) HubSpot preparation$/ }).click(); await panel().getByRole('status').waitFor(); }
            async function noReceipt() { assert.equal(await panel().getByRole('status').count(), 0); assert.equal(await panel().getByRole('button', { name: 'Download HubSpot HTML', exact: true }).count(), 0); }
            async function downloadUI(format: 'HTML' | 'plaintext') { const pending = page.waitForEvent('download'); await panel().getByRole('button', { name: 'Download HubSpot ' + format, exact: true }).click(); const d = await pending, path = await d.path(); assert.ok(path); assert.equal(await d.failure(), null); return readFile(path); }
            async function hold(pattern: string, mutate?: (r: Awaited<ReturnType<Route['fetch']>>) => Promise<Parameters<Route['fulfill']>[0]>) { let release!: () => void, arrived!: () => void, done!: () => void; const gate = new Promise<void>(r => release = r), seen = new Promise<void>(r => arrived = r), finished = new Promise<void>(r => done = r); await page.route(pattern, async (route) => { try {
                const actual = await route.fetch();
                assert.equal(actual.status(), 200);
                arrived();
                await gate;
                try {
                    await route.fulfill(mutate ? await mutate(actual) : { response: actual });
                }
                catch { /* Browser cancellation may close the real response interception. */ }
            }
            finally {
                done();
            } }); return { seen: () => bounded(seen, 'actual held ' + pattern), release: async () => { release(); await bounded(finished, 'released ' + pattern); await page.unroute(pattern); } }; }
            const reviewPattern = '**/hubspot-review', artifactPattern = '**/hubspot-artifact';
            await goto();
            for (const label of labels)
                assert.equal(await page.getByLabel(label, { exact: true }).inputValue(), '');
            assert.ok((await panel().innerText()).includes('has not been verified'));
            const beforeInvalid = await revisionCount(email.id), beforeRequests = reviews();
            await panel().getByRole('button', { name: 'Review HubSpot preparation', exact: true }).click();
            await page.getByRole('alert').filter({ hasText: invalid }).waitFor();
            assert.equal(await revisionCount(email.id), beforeInvalid);
            assert.equal(reviews(), beforeRequests);
            await noReceipt();
            const admission = await tx(c => createEmail(c, p, 'Owned fresh matching double-click', spec));
            await goto(admission.id);
            await fill();
            const admissionReviews = reviews();
            assert.equal(await revisionCount(admission.id), 0);
            await panel().getByRole('button', { name: 'Review HubSpot preparation', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
            await panel().getByRole('status').waitFor();
            assert.equal(await revisionCount(admission.id), 1);
            assert.equal(reviews(), admissionReviews + 1);
            await goto();
            await fill({ ...settings, company_name: 'Wrong owned company' });
            await panel().getByRole('button', { name: 'Review HubSpot preparation', exact: true }).click();
            await page.getByRole('alert').filter({ hasText: mismatch }).waitFor();
            await noReceipt();
            assert.deepEqual((await db.query('SELECT spec FROM emails WHERE id=$1', [email.id])).rows[0].spec, spec);
            await fill();
            const beforeDouble = reviews(), beforeFreeze = await revisionCount(email.id);
            await panel().getByRole('button', { name: 'Review HubSpot preparation', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
            await panel().getByRole('status').waitFor();
            assert.equal(reviews(), beforeDouble + 1);
            assert.equal(await revisionCount(email.id), beforeFreeze);
            const currentRevision = (await db.query('SELECT id FROM revisions WHERE email_id=$1 ORDER BY created_at DESC LIMIT 1', [email.id])).rows[0].id;
            const actualReview = await post({ settings }, currentRevision);
            assert.equal(actualReview.status(), 200);
            const actualReceipt = (await actualReview.json()).review;
            assert.equal(sha(await downloadUI('HTML')), actualReceipt.html_sha256);
            assert.equal(sha(await downloadUI('plaintext')), actualReceipt.text_sha256);
            await page.getByLabel(labels[0], { exact: true }).fill(settings.company_name + ' changed');
            await noReceipt();
            await fill();
            await reviewUI();
            pass('Browser blank seven-field form, invalid zero I/O, mismatch/source preservation, correction/single admission/native two-format downloads');
            await page.route(reviewPattern, r => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'OWNED_UNAVAILABLE', message: 'PRIVATE_BODY_MARKER' } }) }));
            await panel().getByRole('button', { name: 'Refresh HubSpot preparation', exact: true }).click();
            await page.getByRole('alert').filter({ hasText: unavailable }).waitFor();
            await noReceipt();
            await page.unroute(reviewPattern);
            await reviewUI();
            await page.route(reviewPattern, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
            await panel().getByRole('button', { name: 'Refresh HubSpot preparation', exact: true }).click();
            await page.getByRole('alert').filter({ hasText: unavailable }).waitFor();
            await noReceipt();
            await page.unroute(reviewPattern);
            await reviewUI();
            async function settingsABA() { await page.getByLabel(labels[0], { exact: true }).fill(settings.company_name + ' B'); await page.getByLabel(labels[0], { exact: true }).fill(settings.company_name); }
            async function destinationABA() { for (const destination of ['klaviyo', 'mailchimp', 'omnisend', 'brevo', 'hubspot'])
                await page.getByLabel('ESP destination').selectOption(destination); }
            for (const transition of [settingsABA, destinationABA])
                for (const fail of [false, true]) {
                    const held = await hold(reviewPattern, fail ? async () => ({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'OWNED_UNAVAILABLE', message: 'PRIVATE_BODY_MARKER' } }) }) : undefined);
                    await panel().getByRole('button', { name: 'Refresh HubSpot preparation', exact: true }).click();
                    await held.seen();
                    await transition();
                    await held.release();
                    await ready();
                    await noReceipt();
                    assert.equal(await page.locator('.alert[role="alert"]').count(), 0);
                    await reviewUI();
                }
            const edited = await hold(reviewPattern);
            await panel().getByRole('button', { name: 'Refresh HubSpot preparation', exact: true }).click();
            await edited.seen();
            await subject().fill('Newer local owned subject');
            await edited.release();
            await ready();
            await noReceipt();
            assert.equal(await subject().inputValue(), 'Newer local owned subject');
            await page.getByRole('button', { name: 'Save', exact: true }).click();
            await page.getByRole('status').filter({ hasText: 'Saved · v2' }).waitFor();
            await reviewUI();
            pass('Browser 503/empty retry, failed receipt clearance, held review settings/destination ABA and newer edit');
            for (const transition of ['settings', 'destination'] as const)
                for (const fail of [false, true]) {
                    const fresh = await tx(c => createEmail(c, p, 'Owned initial freeze ' + transition + ' ' + fail, spec));
                    await goto(fresh.id);
                    await fill();
                    const initialReviews = reviews();
                    const h = await hold('**/emails/' + fresh.id + '/revisions', fail ? async () => ({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'OWNED_FREEZE_UNAVAILABLE', message: 'PRIVATE_BODY_MARKER' } }) }) : undefined);
                    await panel().getByRole('button', { name: 'Review HubSpot preparation', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
                    await h.seen();
                    await (transition === 'settings' ? settingsABA() : destinationABA());
                    await h.release();
                    await ready();
                    await noReceipt();
                    assert.equal(reviews(), initialReviews);
                    assert.equal(await page.locator('.alert[role="alert"]').count(), 0);
                    assert.equal(await revisionCount(fresh.id), 1);
                    let freezes = 0;
                    const counter = (r: BrowserRequest) => { if (r.method() === 'POST' && new URL(r.url()).pathname === '/v1/emails/' + fresh.id + '/revisions')
                        freezes++; };
                    page.on('request', counter);
                    try {
                        await reviewUI();
                        assert.equal(freezes, fail ? 1 : 0);
                        assert.equal(await revisionCount(fresh.id), 1);
                    }
                    finally {
                        page.off('request', counter);
                    }
                }
            pass('Initial real freeze settings/destination ABA success and 503, zero stale dispatch/error, history/idempotent ack reuse');
            for (const transition of [settingsABA, destinationABA]) {
                const count = downloads, h = await hold(artifactPattern);
                await panel().getByRole('button', { name: 'Download HubSpot HTML', exact: true }).click();
                await h.seen();
                await transition();
                await h.release();
                await ready();
                await noReceipt();
                assert.equal(downloads, count);
                await reviewUI();
            }
            for (const corruption of ['missing', 'forged', 'bytes'] as const) {
                const count = downloads;
                await page.route(artifactPattern, async (r) => { const actual = await r.fetch(); assert.equal(actual.status(), 200); const h = { ...actual.headers() }; if (corruption === 'missing')
                    delete h['x-content-sha256']; if (corruption === 'forged')
                    h['x-artifact-hash'] = '0'.repeat(64); await r.fulfill({ response: actual, headers: h, ...(corruption === 'bytes' ? { body: Buffer.concat([await actual.body(), Buffer.from('owned corruption')]) } : {}) }); });
                await panel().getByRole('button', { name: 'Download HubSpot HTML', exact: true }).click();
                await page.getByRole('alert').filter({ hasText: unavailable }).waitFor();
                await noReceipt();
                assert.equal(downloads, count);
                await page.unroute(artifactPattern);
                await reviewUI();
                await downloadUI('HTML');
            }
            pass('Held download settings/destination ABA, missing/forged metadata and corrupt actual bytes prevent file adoption, retry works');
            // Schedule only actual owned server bytes. These hooks preserve the real
            // editor, real receipts and cryptographic result while holding two late awaits.
            const lateEvidence: object[] = [];
            for (const mode of ['chunk', 'digest'] as const) {
                // Static JS avoids tsx/esbuild's Node-only __name helper in a
                // serialized browser function with nested scheduling callbacks.
                await page.evaluate(`(() => {
                    const mode = ${JSON.stringify(mode)}, origin = ${JSON.stringify(origin)};
                    const scope = window;
                    if (scope.__ownedHubSpotLateDownload) throw Error('Owned late-download hook already active');
                    const originalFetch = window.fetch, originalDigest = crypto.subtle.digest;
                    let release;
                    const held = new Promise(resolve => {release = resolve;});
                    const gate = {
                        phase: 'armed', bytes: new Uint8Array(), pulls: 0, digestCalls: 0,
                        release: () => {gate.phase = 'released'; release();},
                        restore: () => {
                            gate.release(); window.fetch = originalFetch;
                            crypto.subtle.digest = originalDigest;
                            delete scope.__ownedHubSpotLateDownload;
                        },
                    };
                    scope.__ownedHubSpotLateDownload = gate;
                    window.fetch = async (input, init) => {
                        const response = await originalFetch.call(window, input, init);
                        const url = new URL(input instanceof Request ? input.url : String(input), location.href);
                        if (url.origin !== origin || !url.pathname.endsWith('/hubspot-artifact') || !response.ok) return response;
                        gate.bytes = new Uint8Array(await response.clone().arrayBuffer());
                        if (gate.bytes.length < 2) throw Error('Actual owned artifact is too short for late-body qualification');
                        if (mode === 'digest') return response;
                        const split = Math.floor(gate.bytes.length / 2);
                        const body = new ReadableStream({
                            async pull(controller) {
                                gate.pulls++;
                                if (gate.pulls === 1) {controller.enqueue(gate.bytes.slice(0, split)); return;}
                                if (gate.pulls !== 2) throw Error('Unexpected owned artifact pull');
                                gate.phase = 'chunk';
                                await held;
                                controller.enqueue(gate.bytes.slice(split)); controller.close();
                            },
                        }, {highWaterMark: 0});
                        return new Response(body, {status: response.status, statusText: response.statusText, headers: response.headers});
                    };
                    if (mode === 'digest') crypto.subtle.digest = async (algorithm, data) => {
                        const bytes = ArrayBuffer.isView(data)
                            ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
                            : new Uint8Array(data);
                        const actualDownload = gate.bytes.length > 0 && bytes.length === gate.bytes.length
                            && bytes.every((value, index) => value === gate.bytes[index]);
                        const actualDigest = originalDigest.call(crypto.subtle, algorithm, data);
                        if (actualDownload) {
                            gate.digestCalls++; gate.phase = 'digest';
                            await held;
                        }
                        return actualDigest;
                    };
                })()`);
                const count = downloads;
                try {
                    await panel().getByRole('button', {name: 'Download HubSpot HTML', exact: true}).click();
                    await page.waitForFunction(expected => {
                        const gate = (window as unknown as {__ownedHubSpotLateDownload?: LateDownloadGate}).__ownedHubSpotLateDownload;
                        return gate?.phase === expected;
                    }, mode);
                    const observed = await page.evaluate(() => {
                        const gate = (window as unknown as {__ownedHubSpotLateDownload: LateDownloadGate}).__ownedHubSpotLateDownload;
                        return {phase: gate.phase, pulls: gate.pulls, digestCalls: gate.digestCalls, bytes: Array.from(gate.bytes)};
                    });
                    assert.equal(observed.phase, mode);
                    assert.equal(observed.pulls, mode === 'chunk' ? 2 : 0);
                    assert.equal(observed.digestCalls, mode === 'digest' ? 1 : 0);
                    const actualBytes = new Uint8Array(observed.bytes);
                    assert.ok(Buffer.from(actualBytes).toString().includes('{{ unsubscribe_link|escape_url }}'));
                    await settingsABA(); await noReceipt();
                    await page.evaluate(() => (window as unknown as {__ownedHubSpotLateDownload: LateDownloadGate}).__ownedHubSpotLateDownload.release());
                    await ready(); await noReceipt();
                    assert.equal(downloads, count, 'Late '+mode+' result must create no file');
                    assert.equal(await page.locator('.alert[role="alert"]').count(), 0, 'Late '+mode+' result must adopt no stale error');
                    lateEvidence.push({mode, phase: observed.phase, pulls: observed.pulls, digestCalls: observed.digestCalls, actual_bytes_sha256: sha(actualBytes), downloads_before: count, downloads_after: downloads});
                } finally {
                    await page.evaluate(() => (window as unknown as {__ownedHubSpotLateDownload?: LateDownloadGate}).__ownedHubSpotLateDownload?.restore());
                }
                assert.equal(await page.evaluate(() => '__ownedHubSpotLateDownload' in window), false);
                await reviewUI();
                const retry = await downloadUI('HTML');
                const evidence = lateEvidence.at(-1) as {actual_bytes_sha256: string};
                assert.equal(sha(retry), evidence.actual_bytes_sha256, 'Fresh retry must download the same real server artifact');
            }
            await writeFile(scratch+'/late-download-manifest.json', JSON.stringify(lateEvidence, null, 2));
            pass('Actual later reader chunk and downloaded-byte SHA promise awaits: settings ABA suppresses stale file/error, hooks restored and fresh retries succeed');
            // Sensitivity: a real browser file event deliberately arrives after the
            // old producer-side count assertion would have passed. This uses real
            // owned HTTP artifact bytes, not an editor/generation-state simulation.
            const sensitivityEmail=new URL(page.url()).pathname.split('/').at(-1)!;
            const sensitivityRevision=(await db.query('SELECT id FROM revisions WHERE email_id=$1 ORDER BY created_at DESC LIMIT 1',[sensitivityEmail])).rows[0].id;
            const sensitivityReview=await post({settings},sensitivityRevision);
            assert.equal(sensitivityReview.status(),200);
            const sensitivityReceipt=(await sensitivityReview.json()).review;
            const sensitivityGuard=forbidHubSpotDownloads(page,()=>({phase:'delayed-adoption-sensitivity',actor:p.user,workspace:p.workspace}));
            let sensitivityEvidence:object;
            try {
                const baseline=downloads;
                const actualSHA=await page.evaluate(`(async()=>{
                    const response=await fetch(${JSON.stringify(endpoint(sensitivityRevision,'artifact'))},{method:'POST',headers:${JSON.stringify({...headers,'Content-Type':'application/json'})},body:JSON.stringify(${JSON.stringify({settings,format:'html',expected_destination_hash:sensitivityReceipt.destination_hash})})});
                    if(!response.ok)throw Error('Owned delayed sensitivity artifact unavailable');
                    const blob=await response.blob();
                    window.__ownedDelayedHubSpotFile={release:()=>setTimeout(()=>{
                        const url=URL.createObjectURL(blob),link=document.createElement('a');
                        link.href=url;link.download='hubspot-prepared-delayed-sensitivity.html';link.click();
                        delete window.__ownedDelayedHubSpotFile;setTimeout(()=>URL.revokeObjectURL(url),1000);
                    },50)};
                    return response.headers.get('x-content-sha256');
                })()`);
                assert.equal(actualSHA,sensitivityReceipt.html_sha256);
                const pending=page.waitForEvent('download');
                await page.evaluate('window.__ownedDelayedHubSpotFile.release()');
                // Reproduces the reviewed race: the immediate producer-side test passes.
                assert.equal(downloads,baseline);
                const delayed=await pending,path=await delayed.path();assert.ok(path);
                assert.equal(await delayed.failure(),null);
                assert.equal(sha(await readFile(path)),actualSHA);
                assert.throws(()=>sensitivityGuard.check(),/Forbidden delayed HubSpot download/);
                assert.equal(sensitivityGuard.forbidden.length,1);
                sensitivityEvidence={baseline,immediate_count:baseline,delayed_count:downloads,guard_rejected:true,actual_bytes_sha256:actualSHA,events:sensitivityGuard.events};
            } finally {
                sensitivityGuard.close();
            }
            // One immutable baseline spans every transition and fresh recovery.
            // The guard remains installed through later legitimate other-provider
            // downloads and browser shutdown; HubSpot downloads stay forbidden.
            const scopeBaseline=downloads;
            let scopeContext={phase:'scope-group-start',actor:p.user,workspace:p.workspace};
            const scopeGuard=forbidHubSpotDownloads(page,()=>scopeContext);
            const scopeBoundaries:object[]=[];
            const checkScope=(phase:string)=>{
                scopeGuard.check();assert.equal(downloads,scopeBaseline,'Scope-group baseline changed at '+phase);
                scopeBoundaries.push({phase,baseline:scopeBaseline,count:downloads});
            };
            finalScopeDownloadCheck=async()=>{
                await writeFile(scratch+'/scope-download-manifest.json',JSON.stringify({sensitivity:sensitivityEvidence,baseline:scopeBaseline,boundaries:scopeBoundaries,events:scopeGuard.events,forbidden:scopeGuard.forbidden,guard_active_through_browser_close:true},null,2));
                scopeGuard.check();
            };
            for (const transition of ['email', 'workspace', 'actor'] as const) {
                scopeContext={phase:transition+'-prepare',actor:p.user,workspace:p.workspace};
                await goto();await fill();await reviewUI();await ready();checkScope(transition+'-before-hold');
                const h = await hold(artifactPattern);
                await panel().getByRole('button', { name: 'Download HubSpot HTML', exact: true }).click();
                await h.seen();
                scopeContext={phase:transition+'-transition',actor:transition==='actor'?secondActor:p.user,workspace:transition==='workspace'?foreign:p.workspace};
                if (transition === 'email')await goto(other.id);
                else if (transition === 'workspace') {
                    await page.getByLabel('Active brand workspace').selectOption(foreign);
                    await page.waitForURL(origin + '/app');
                } else {
                    await cookie(secondActor);await page.reload();await subject().waitFor();
                }
                await h.release();checkScope(transition+'-producer-released');
                if (transition === 'actor')await cookie(p.user);
                scopeContext={phase:transition+'-fresh-recovery',actor:p.user,workspace:p.workspace};
                await goto();await fill();await reviewUI();await ready();
                // Fresh editor acknowledgment + explicit review is complete, while
                // persistent browser-event observation still rejects delayed files.
                checkScope(transition+'-consumer-recovery-complete');
            }
            checkScope('scope-group-end-before-legitimate-downloads');
            scopeContext={phase:'later-other-provider-journeys',actor:p.user,workspace:p.workspace};
            pass('Actual email/workspace/actor transitions keep constant forbidden-file guard through recovery/group end; delayed real-byte event sensitivity rejects reviewed race');
            const native = { klaviyo: '{% unsubscribe_link %}', mailchimp: '*|UNSUB|*', omnisend: '[[unsubscribe_link]]', brevo: '{{ unsubscribe }}' };
            for (const [destination, expression] of Object.entries(native)) {
                const name = destination === 'mailchimp' ? 'Mailchimp' : destination === 'klaviyo' ? 'Klaviyo' : destination === 'omnisend' ? 'Omnisend' : 'Brevo';
                await page.getByLabel('ESP destination').selectOption(destination);
                const p = page.getByRole('region', { name: name + ' preparation' });
                await p.getByRole('button', { name: 'Review ' + name + ' preparation', exact: true }).click();
                await p.getByRole('status').waitFor();
                const pending = page.waitForEvent('download');
                await p.getByRole('button', { name: 'Download ' + name + ' HTML', exact: true }).click();
                const d = await pending, path = await d.path();
                assert.ok(path);
                const text = (await readFile(path)).toString();
                assert.ok(text.includes(expression));
                for (const other of Object.values(native).filter(x => x !== expression))
                    assert.ok(!text.includes(other));
                assert.ok(!text.includes('site_settings.company_name'));
                const r = await context.request.get(origin + '/v1/email-revisions/' + frozen.id + '/destination-review?destination=' + destination, { headers });
                assert.equal(r.status(), 200);
            }
            await page.getByLabel('ESP destination').selectOption('hubspot');
            await reviewUI();
            const storage = await page.evaluate(() => ({ local: Object.entries(localStorage), session: Object.entries(sessionStorage), url: location.href }));
            const stored = JSON.stringify(storage);
            assert.ok(!stored.includes('company_street_address_1'));
            assert.ok(!stored.includes('company_name'));
            assert.ok(!storage.url.includes(settings.company_name));
            assert.ok(requests.every(r => r.method === 'POST' && r.settingsBody));
            pass('All five mounted journeys, distinct four GET mappings and body-only ephemeral settings storage/URL privacy');
            await page.setViewportSize({ width: 390, height: 844 });
            for (const label of labels) {
                const box = await page.getByLabel(label, { exact: true }).boundingBox();
                assert.ok(box && box.width > 0 && box.x >= 0 && box.x + box.width <= 390);
            }
            assert.ok(await panel().getByRole('button', { name: 'Refresh HubSpot preparation', exact: true }).isVisible());
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            await page.screenshot({ path: '/tmp/lettercape-hubspot-footer-mobile.png', fullPage: true });
            await panel().screenshot({path: '/tmp/lettercape-hubspot-footer-mobile-panel.png'});
            await writeFile(scratch+'/mobile-panel-sha256.txt', sha(await readFile('/tmp/lettercape-hubspot-footer-mobile-panel.png'))+'\n');
            await writeFile(scratch + '/mobile-sha256.txt', sha(await readFile('/tmp/lettercape-hubspot-footer-mobile.png')) + '\n');
            await cookie(viewer);
            await page.reload();
            await subject().waitFor();
            await page.getByLabel('ESP destination').selectOption('hubspot');
            await panel().waitFor();
            assert.equal(await panel().getByRole('button').count(), 0);
            for (const label of labels)
                assert.ok(await page.getByLabel(label, { exact: true }).isDisabled());
            await error(await context.request.post(endpoint(), { headers: { ...headers, 'X-Actor-Id': viewer }, data: { settings } }), 403);
            assert.deepEqual(await baseline(), counts);
            assert.deepEqual((await tx(c => c.query('SELECT spec,html,plaintext,artifact_hash,manifest FROM revisions WHERE id=$1', [frozen.id]))).rows[0], original);
            scopeGuard.check();
            assert.equal(external, 0);
            assert.deepEqual(pageerrors, []);
            await writeFile(scratch + '/request-manifest.json', JSON.stringify(requests, null, 2));
            pass('390px seven-field/control visibility/no overflow screenshot, Viewer disabled/403, no new operations/outbox/usage, no instrumented browser external requests/pageerrors');
        }
        finally {
            await browser?.close();
            if (app && app.exitCode === null) {
                app.kill('SIGTERM');
                await new Promise<void>((resolve, reject) => { const timer = setTimeout(() => { app!.kill('SIGKILL'); reject(Error('Owned app required forced termination')); }, 10000); app!.once('exit', () => { clearTimeout(timer); resolve(); }); });
            }
            await log.close();
            await finalScopeDownloadCheck?.();
        }
    });
    pass('Owned browser/app/fixture cleanup');
    console.log('COMPLETE ' + groups + ' groups ' + Math.round(performance.now() - started) + 'ms');
}
catch (error) {
    await writeFile(scratch + '/failure.txt', String(error instanceof Error ? error.stack : error));
    console.error('FAIL group=' + group + ' evidence=' + scratch + '/failure.txt');
    throw error;
}
