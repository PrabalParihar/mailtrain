# Lettercape TypeScript SDK — development source

Exact-source commands use separate transport and recovery rules. `importEmailSource` sends a string as `text/plain; charset=utf-8`, preserving BOM, mixed line endings and valid Unicode up to 2 MiB of actual UTF-8 bytes. `forkEmailSource` sends `{expected_artifact_hash}`. Both require the original explicit `idempotencyKey` and `ifMatch`; optional `actorId` fences account changes without granting authority. They never generate keys or automatically retry. Preserve the command key, original version and exact body for explicit recovery after loss or interruption.

`saveDraft` and the compatible JSON `importHtml` return `{email, receipt}` and are now keyed. Their initial call may generate a key for compatibility; failures expose that same key. They also do not automatically retry. The receipt includes the actual committed spec hash, source hash/UTF-8 size/storage profile (or `source:null` for structured mode), email/workspace identity and acknowledged CAS versions. These hashes describe stored data; they do not certify delivery eligibility. Source-bearing JSON routes have a separate 13,697,024-byte transport bound while canonical raw source remains at most 2 MiB and non-source metadata at most 1 MiB. Generic JSON endpoints retain their existing 2 MiB ceiling.

`downloadRevision` with `query:{format:'source'}` returns exact frozen source as `Uint8Array`. Inspect `X-Source-SHA256` and `X-Source-Profile`; the server uses an inert `text/plain` attachment with `nosniff` and `no-store`. Safe rendered output and exact authored source remain separate artifacts. Legacy source is only the historical stored text; discarded originals are not recovered.

This source consumes the generated OpenAPI3.1 types and 114 documented route operations. It is not an npm publication or a GA promise. The contract explicitly marks provider/release-blocked commands; invoking them returns a real error. Remaining full-baseline families are listed in `public/openapi.json` and CAPABILITIES.md.

Generate/check with `npm --prefix tooling/openapi ci`, then `npm run api:generate`/`npm run api:check`. The isolated generator has its own compatible TypeScript5 lock; application and SDK compile with TypeScript6. [Generator documentation](https://openapi-ts.dev/cli) supports OpenAPI3.1 generation/validation. [Ajv2020](https://ajv.js.org/json-schema.html) validates the JSON Schema2020-12 examples. Some domain semantic constraints remain server-only and are disclosed in the contract.

For a server-side consumer:

```ts
import { LettercapeClient, LettercapeError } from './sdk/client';
const client = new LettercapeClient({
  baseUrl: process.env.APP_ORIGIN!, // approved HTTPS origin; loopback permitted for development
  apiKey: process.env.LETTERCAPE_API_KEY!, // privately configured; never browser storage/logs
});
for await (const page of client.pages('listEmails', {query: {limit:25}})) {
  console.log(page.requestId, page.data.data.map(row => row.id));
}
const key=crypto.randomUUID(); // persist alongside your logical command before issuing it
try {
  const result=await client.call('createEmail',{body:{title:'Reviewed offer'},idempotencyKey:key});
  console.log(result.requestId, result.data.email.id);
} catch(error) {
  if(error instanceof LettercapeError) {
    // For uncertain acknowledgment recover with error.idempotencyKey (or key) and EXACT payload.
    // Business errors such as412/409 need reconciliation, never blind overwrite or a new key.
  }
}
```

Verified browser sessions use `workspace` with session cookies and approved Origin; no client-provided role is accepted. Do not expose long-lived server bearer secrets in a frontend. Caller-provided transport adapters must preserve redirect rejection and abort signals.

The client retries bounded safe reads and eligible server-keyed commands after transport loss,429or explicitly retryable503, preserving the key/body/workspace/credential within recovery. Source mutations described above and nonkeyed mutations (including local/workspace session commands) do not auto-retry. Maximum2retries by default, configurable0–5; Retry-After is honored or recovery is deferred if it exceeds the waiting budget. No blind provider transport retry or send-success fabrication occurs. Failed uncertain keyed requests expose their existing key; raw bearer secrets are never included in errors or logs.

Every JSON acknowledgment returns its request ID; frozen downloads return Uint8Array and request/artifact headers. Streamed bodies are bounded (16MiBdefault/64MiBmaximum); abort cancels a stalled read. Pages preserve filters and reject missing/repeated cursors, with an explicit maximum page budget. Iterate pages incrementally rather than accumulating recipient data unnecessarily. Date filters are UTC instants, stable order is created_at/id descending, default25/max100, signed cursor expiry15minutes. Total counts reflect the queried collection, not only loaded rows.

Open obligations: full-GA command families/adapters/conformance, expanded typed response models for GenericResponse operations, package owner/name availability before npm publication, production auth/MFA/anti-abuse, commercial quotas, independent review/signoff and deployment evidence. No public package or service is claimed.

Deferred review issue: when Retry-After exceeds the wait budget, RETRY_DEFERRED currently omits the originating request ID/status. Recover using the existing command key; preserve these diagnostics before GA.

`compareLocaleSource` reads original frozen parent/current parent/saved locale-child source through the same tenant and actor scope. It does not translate, review, approve or advance source lineage. The three escaped specs share an8MiB server comparison budget;413 preserves the saved source/draft. Read responses can be cancelled. Copied manual text still uses explicit original-command draft save and CAS recovery.

Recipient assessment commands require an explicit original idempotency key, current Owner/Admin audience authority, and campaigns plus audience:read scopes. Selected topic is assessment context only. Retrieve current detail after a historical receipt replay. Observations never authorize sending or reserve frequency; production dispatch remains unavailable.
