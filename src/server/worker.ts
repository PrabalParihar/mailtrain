import env from '@next/env';
env.loadEnvConfig(process.cwd());
import { load } from 'cheerio';
import { tenant, sessionQuery, closeDb } from './db';
import { safeFetchHtml } from './safe-fetch';
import { generateProposal } from './ai';
import { queuedAuthorized } from './queue-authorization';
import { AppError } from './errors';
let stopped = false;
process.on('SIGTERM', () => (stopped = true));
process.on('SIGINT', () => (stopped = true));
async function tick() {
  const due = (await sessionQuery('SELECT * FROM mailcraft_due_operations()', [])).rows;
  for (const job of due) {
    if (stopped) return;
    const operation = await tenant(job.workspace_id, job.created_by, async (tx) => {
      const queued = (
        await tx.query("SELECT * FROM operations WHERE id=$1 AND state='queued' FOR UPDATE", [
          job.id,
        ])
      ).rows[0];
      if (!queued) return null;
      if (!(await queuedAuthorized(tx, queued))) {
        await tx.query(
          "UPDATE operations SET state='failed',error=$1,completed_at=now() WHERE id=$2 AND state='queued'",
          [
            JSON.stringify({
              code: 'PERMISSION_REVOKED',
              message: 'Permission changed before operation execution.',
            }),
            job.id,
          ],
        );
        await tx.query(
          "INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units) SELECT workspace_id,operation_id,metric,'release',units FROM usage_ledger WHERE operation_id=$1 AND kind='reserve' ON CONFLICT DO NOTHING",
          [job.id],
        );
        return null;
      }
      return (
        await tx.query(
          "UPDATE operations SET state='running',started_at=now() WHERE id=$1 AND state='queued' RETURNING *",
          [job.id],
        )
      ).rows[0];
    });
    if (!operation) continue;
    let externalAttempt = false;
    try {
      let result: unknown;
      if (operation.type === 'brand.extract') {
        const fetched = await safeFetchHtml(operation.input.url);
        const $ = load(fetched.html);
        $('script,style,nav,footer').remove();
        const colors = [...new Set(fetched.html.match(/#[\da-f]{6}\b/gi) ?? [])].slice(0, 8);
        result = {
          proposal: {
            name:
              $('meta[property="og:site_name"]').attr('content') ?? $('title').text().slice(0, 100),
            website: fetched.url,
            description: (
              $('meta[name="description"]').attr('content') ??
              $('body').text().replace(/\s+/g, ' ').trim()
            ).slice(0, 3000),
            voice: 'Review the source and describe your brand voice.',
            accent: colors[0] ?? '#0B625D',
            background: '#F7F6F2',
            font_stack: 'Arial, sans-serif',
            address: '',
            forbidden_phrases: [],
            approved_claims: [],
            provenance: [
              { source: fetched.url, captured_at: new Date().toISOString(), status: 'suggested' },
            ],
          },
          subjects: [
            $('title').text().slice(0, 60),
            'A closer look at what is new',
            'Something worth sharing',
          ],
          warnings: [
            'Extracted fields are suggestions. Confirm facts, brand colors, voice and postal address.',
          ],
        };
      } else if (operation.type === 'email.generate') {
        const brand = await tenant(
          job.workspace_id,
          job.created_by,
          async (tx) =>
            (
              await tx.query('SELECT data FROM brands WHERE id=$1', [
                operation.input.brand_kit_version_id,
              ])
            ).rows[0],
        );
        if (!brand)
          throw new AppError(
            404,
            'RESOURCE_NOT_FOUND',
            'The selected brand version is unavailable.',
          );
        externalAttempt = !!process.env.OPENAI_API_KEY && !!process.env.OPENAI_MODEL;
        result = await generateProposal(operation.input, brand.data);
      } else
        throw new AppError(
          422,
          'UNSUPPORTED_OPERATION',
          'This worker cannot execute this operation.',
        );
      await tenant(job.workspace_id, job.created_by, async (tx) => {
        const changed = await tx.query(
          "UPDATE operations SET state=CASE WHEN state='cancel_requested' THEN 'cancelled' ELSE 'succeeded' END,result=CASE WHEN state='cancel_requested' THEN NULL ELSE $1::jsonb END,completed_at=now() WHERE id=$2 AND state IN('running','cancel_requested') RETURNING id,state",
          [JSON.stringify(result), job.id],
        );
        if (changed.rowCount) {
          await tx.query(
            "INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units) SELECT workspace_id,operation_id,metric,'consume',units FROM usage_ledger WHERE operation_id=$1 AND kind='reserve' ON CONFLICT DO NOTHING",
            [job.id],
          );
          await tx.query(
            'INSERT INTO outbox(workspace_id,type,aggregate_id,data) VALUES($1,$2,$3,$4)',
            [
              job.workspace_id,
              operation.type +
                (changed.rows[0].state === 'cancelled' ? '.cancelled' : '.completed'),
              job.id,
              JSON.stringify({ operation_id: job.id }),
            ],
          );
        }
      });
    } catch (e) {
      await tenant(job.workspace_id, job.created_by, async (tx) => {
        await tx.query(
          "UPDATE operations SET state=CASE WHEN state='cancel_requested' THEN 'cancelled' ELSE 'failed' END,error=$1,completed_at=now() WHERE id=$2 AND state IN('running','cancel_requested')",
          [
            JSON.stringify({
              code: e instanceof AppError ? e.code : 'DEPENDENCY_UNAVAILABLE',
              message:
                e instanceof AppError
                  ? e.message
                  : 'The dependency failed. No proposal was applied.',
            }),
            job.id,
          ],
        );
        if (!externalAttempt)
          await tx.query(
            "INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units) SELECT workspace_id,operation_id,metric,'release',units FROM usage_ledger WHERE operation_id=$1 AND kind='reserve' ON CONFLICT DO NOTHING",
            [job.id],
          );
      });
    }
  }
}
console.log('Mailcraft creation worker active. Sending is unavailable.');
while (!stopped) {
  await tick().catch(() => console.error('worker_tick_failed'));
  await new Promise((resolve) => setTimeout(resolve, 1500));
}
await closeDb();
