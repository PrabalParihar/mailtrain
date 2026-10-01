import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z, ZodError } from 'zod';
import { compileEmail, blankSpec, EmailSpecSchema, lintEmail, sanitizeRaw } from '@/domain/email';
import { BrandSchema } from '@/domain/brand';
import { identity, localBootstrap, checkOrigin, withPrincipal } from '@/server/auth';
import { userQuery, tenant } from '@/server/db';
import { AppError, fail } from '@/server/errors';
import { audit } from '@/server/audit';
import { keyed } from '@/server/commands';
import { createEmail, getEmail, saveDraft, checkpoint, restoreRevision } from '@/server/emails';
import { operation, cancelOperation } from '@/server/operations';
import { integrations } from '@/server/adapters';
import { audienceRoute } from '@/server/audience-routes';
import { assertRouteMethod, readJson } from '@/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
async function handle(req: Request, ctx: Context) {
  const request_id = randomUUID();
  const { path } = await ctx.params;
  const [root, id, command] = path;
  const method = req.method;
  const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
    NextResponse.json(
      { request_id, ...(data as object) },
      { status, headers: { 'Cache-Control': 'no-store', ...headers } },
    );
  try {
    assertRouteMethod(path, method);
    checkOrigin(req);
    const body = await readJson(req);
    const key = req.headers.get('idempotency-key');
    const version = () => {
      const raw = req.headers.get('if-match');
      const v = Number(raw?.replaceAll('"', '').replace('draft-', ''));
      if (!Number.isSafeInteger(v) || v < 1)
        fail(428, 'VERSION_REQUIRED', 'Supply the acknowledged If-Match draft version.');
      return v;
    };
    if (root === 'health')
      return json({ status: 'ok', release: 'development', dispatch_enabled: false });
    if (root === 'local-session' && method === 'POST') {
      const local = await localBootstrap(String(body.secret ?? ''));
      const res = json({ workspace_id: local.workspace });
      res.cookies.set('mailcraft_local_session', local.token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
        path: '/',
        maxAge: 28800,
      });
      return res;
    }
    if (root === 'session' && method === 'DELETE') {
      const res = json({ signed_out: true });
      res.cookies.delete('mailcraft_local_session');
      return res;
    }
    if (root === 'workspaces') {
      const user = await identity();
      if (!user) fail(401, 'AUTH_REQUIRED', 'Sign in to continue.');
      if (method === 'POST') {
        const name = z.string().min(1).max(100).parse(body.name);
        const row = await userQuery(
          user,
          async (tx) =>
            (await tx.query('SELECT mailcraft_create_workspace($1,$2) AS id', [name, user]))
              .rows[0],
        );
        return json({ workspace: row }, 201);
      }
      const memberships = await userQuery(
        user,
        async (tx) =>
          (await tx.query("SELECT * FROM memberships WHERE user_id=$1 AND status='active'", [user]))
            .rows,
      );
      const data = await Promise.all(
        memberships.map((m) =>
          tenant(m.workspace_id, user, async (tx) => ({
            ...(
              await tx.query('SELECT id,name,status,timezone FROM workspaces WHERE id=$1', [
                m.workspace_id,
              ])
            ).rows[0],
            role: m.role,
          })),
        ),
      );
      return json({ data });
    }
    if (root === 'integrations')
      return json(await withPrincipal(req, 'read', async () => ({ data: integrations })));
    if (root === 'brands')
      return json(
        await withPrincipal(req, method === 'GET' ? 'read' : 'edit', async (tx, p) => {
          if (method === 'GET')
            return { data: (await tx.query('SELECT * FROM brands ORDER BY version DESC')).rows };
          if (id === 'from-url') {
            const url = z.string().url().max(2048).parse(body.url);
            return {
              operation: await keyed(tx, p, 'brand.extract', key, body, () =>
                operation(tx, p, 'brand.extract', { url }),
              ),
            };
          }
          return keyed(tx, p, 'brand.confirm', key, body, async () => {
            const data = BrandSchema.parse(body);
            await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [p.workspace + ':brand']);
            const v = (await tx.query('SELECT coalesce(max(version),0)+1 AS n FROM brands')).rows[0]
              .n;
            const brand = (
              await tx.query(
                'INSERT INTO brands(workspace_id,version,data) VALUES($1,$2,$3) RETURNING *',
                [p.workspace, v, JSON.stringify(data)],
              )
            ).rows[0];
            await audit(tx, p.workspace, p.user, 'brand.confirmed', brand.id);
            return { brand };
          });
        }),
        method === 'POST' ? (id === 'from-url' ? 202 : 201) : 200,
      );
    if (root === 'emails') {
      if (method === 'GET')
        return json(
          await withPrincipal(req, 'read', async (tx) =>
            id
              ? { email: await getEmail(tx, id) }
              : {
                  data: (
                    await tx.query(
                      'SELECT id,title,doc_version,spec,updated_at FROM emails ORDER BY updated_at DESC LIMIT 100',
                    )
                  ).rows,
                },
          ),
        );
      return json(
        await withPrincipal(req, command === 'preview' ? 'read' : 'edit', async (tx, p) => {
          if (id === 'generate') {
            const input = z
              .object({
                prompt: z.string().min(5).max(8000),
                brand_kit_version_id: z.string().uuid(),
                base_email_id: z.string().uuid().optional(),
                base_version: z.number().int().optional(),
                locale: EmailSpecSchema.shape.locale.default('en-US'),
                mode: z.enum(['single', 'series']).default('single'),
                count: z.number().int().min(2).max(10).optional(),
              })
              .strict()
              .parse(body);
            const brand = (
              await tx.query('SELECT id FROM brands WHERE id=$1', [input.brand_kit_version_id])
            ).rows[0];
            if (!brand) fail(404, 'RESOURCE_NOT_FOUND', 'Brand version not found.');
            return {
              operation: await keyed(tx, p, 'email.generate', key, input, () =>
                operation(
                  tx,
                  p,
                  'email.generate',
                  input,
                  input.mode === 'series' ? (input.count ?? 2) : 1,
                ),
              ),
            };
          }
          if (!id) {
            return keyed(tx, p, 'email.create', key, body, async () => {
              const title = z.string().min(1).max(160).parse(body.title);
              const brand = (await tx.query('SELECT * FROM brands ORDER BY version DESC LIMIT 1'))
                .rows[0];
              if (!brand) fail(409, 'BRAND_REQUIRED', 'Confirm a brand kit first.');
              const spec = body.spec
                ? EmailSpecSchema.parse(body.spec)
                : blankSpec(brand.id, brand.data.name);
              if (!body.spec) {
                spec.theme.accent = brand.data.accent;
                spec.theme.background = brand.data.background;
                spec.theme.font_stack = brand.data.font_stack;
                const footer = spec.sections.find((b) => b.type === 'legal_footer');
                if (footer?.type === 'legal_footer') footer.address = brand.data.address;
              }
              return { email: await createEmail(tx, p, title, spec) };
            });
          }
          if (command === 'draft' && method === 'PATCH') {
            const saved = await saveDraft(tx, p, id, version(), body.spec);
            return { email: saved };
          }
          if (command === 'revisions')
            return keyed(tx, p, 'email.checkpoint:' + id, key, body, async () => ({
              revision: await checkpoint(tx, p, id, version()),
            }));
          if (command === 'restore')
            return keyed(tx, p, 'email.restore:' + id, key, body, async () => ({
              email: await restoreRevision(
                tx,
                p,
                id,
                version(),
                z.string().uuid().parse(body.revision_id),
              ),
            }));
          if (command === 'preview') {
            const s = EmailSpecSchema.parse(body.spec);
            return { artifact: await compileEmail(s) };
          }
          if (command === 'import-html') {
            const sanitized = sanitizeRaw(z.string().max(2000000).parse(body.html));
            const e = await getEmail(tx, id);
            await checkpoint(tx, p, id, version());
            const updated = await saveDraft(tx, p, id, version(), {
              ...e.spec,
              editing_mode: 'raw_html',
              raw_html: sanitized.html,
            });
            return { email: updated, warnings: sanitized.warnings };
          }
          fail(404, 'RESOURCE_NOT_FOUND', 'Command not found.');
        }),
        id === 'generate' ? 202 : 200,
      );
    }
    if (root === 'email-revisions') {
      if (method === 'GET' && !command)
        return json(
          await withPrincipal(req, 'read', async (tx) => ({
            data: (
              await tx.query(
                "SELECT id,email_id,revision_no,subject,artifact_hash,created_at FROM (SELECT *,spec->>'subject' AS subject FROM revisions) r WHERE email_id=$1 ORDER BY revision_no DESC LIMIT 50",
                [new URL(req.url).searchParams.get('email_id')],
              )
            ).rows,
          })),
        );
      if (command === 'download') {
        const row = await withPrincipal(req, 'edit', async (tx, p) => {
          const r = (await tx.query('SELECT * FROM revisions WHERE id=$1', [id])).rows[0];
          if (!r) fail(404, 'RESOURCE_NOT_FOUND', 'Revision not found.');
          await audit(tx, p.workspace, p.user, 'revision.downloaded', id);
          return r;
        });
        const format = new URL(req.url).searchParams.get('format') ?? 'html';
        if (!['html', 'txt', 'png', 'pdf'].includes(format))
          fail(422, 'VALIDATION_FAILED', 'Choose HTML, plaintext, PNG or PDF.');
        let data: Buffer | string = format === 'txt' ? row.plaintext : row.html;
        let mime = format === 'txt' ? 'text/plain' : 'text/html';
        if (format === 'png' || format === 'pdf') {
          const { renderDownload } = await import('@/server/render-download');
          data = await renderDownload(row.html, format);
          mime = format === 'png' ? 'image/png' : 'application/pdf';
        }
        return new Response(data as BodyInit, {
          headers: {
            'Content-Type': mime,
            'Content-Disposition': `attachment; filename="mailcraft-v${row.revision_no}.${format}"`,
            'X-Artifact-Hash': row.artifact_hash,
            'Cache-Control': 'no-store',
            'X-Mailcraft-Notice':
              'Frozen revision. Browser exports are simulations. Configure destination unsubscribe and merge slots before sending.',
          },
        });
      }
      return json(
        await withPrincipal(req, 'edit', async (tx, p) => {
          const r = (await tx.query('SELECT * FROM revisions WHERE id=$1', [id])).rows[0];
          if (!r) fail(404, 'RESOURCE_NOT_FOUND', 'Revision not found.');
          if (command === 'preflight') {
            return keyed(tx, p, 'preflight:' + id, key, body, async () => {
              const brand = (
                await tx.query('SELECT data FROM brands WHERE id=$1', [r.spec.brand_kit_version_id])
              ).rows[0];
              const findings = lintEmail(r.spec, brand?.data.forbidden_phrases ?? []);
              const state = findings.some((x) => x.severity === 'blocking')
                ? 'blocked'
                : 'incomplete';
              const report = (
                await tx.query(
                  'INSERT INTO preflights(workspace_id,revision_id,artifact_hash,state,findings) VALUES($1,$2,$3,$4,$5) RETURNING *',
                  [
                    p.workspace,
                    id,
                    r.artifact_hash,
                    state,
                    JSON.stringify([
                      ...findings,
                      {
                        code: 'REAL_CLIENT_UNAVAILABLE',
                        severity: 'info',
                        location: 'clients',
                        message:
                          '20-profile real-client service has not been procured. This is incomplete evidence.',
                      },
                    ]),
                  ],
                )
              ).rows[0];
              return { report };
            });
          }
          if (command === 'export')
            fail(
              409,
              'PROVIDER_NOT_READY',
              'Connect and verify the selected ESP account and destination capabilities first. No remote export was attempted.',
            );
          fail(404, 'RESOURCE_NOT_FOUND', 'Command not found.');
        }),
      );
    }
    if (root === 'operations')
      return json(
        await withPrincipal(req, method === 'GET' ? 'read' : 'edit', async (tx, p) => {
          const row = (await tx.query('SELECT * FROM operations WHERE id=$1', [id])).rows[0];
          if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Operation not found.');
          if (command === 'cancel') return { operation: await cancelOperation(tx, p, id) };
          return { operation: row };
        }),
      );
    if (root === 'contacts' || root === 'contact-imports' || root === 'campaigns')
      return json(await audienceRoute(req, path, body, key));
    if (root === 'usage')
      return json(
        await withPrincipal(req, 'billing', async (tx) => ({
          data: (
            await tx.query(
              'SELECT metric,kind,sum(units)::int AS units FROM usage_ledger GROUP BY metric,kind',
            )
          ).rows,
          generation_allowance: Number(process.env.AI_GENERATION_ALLOWANCE ?? 0),
          billing_status: 'unconfigured',
          prices_approved: false,
        })),
      );
    if (root === 'audit')
      return json(
        await withPrincipal(req, 'manage', async (tx) => ({
          data: (
            await tx.query(
              'SELECT id,actor,action,resource_id,event_hash,created_at FROM audit_events ORDER BY event_sequence DESC LIMIT 100',
            )
          ).rows,
        })),
      );
    fail(404, 'RESOURCE_NOT_FOUND', 'Route not found.');
  } catch (e) {
    if (e instanceof ZodError)
      return json(
        {
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Check the highlighted input fields.',
            details: e.issues.map((x) => ({ path: x.path, message: x.message })),
            retryable: false,
          },
        },
        422,
      );
    if (e instanceof AppError)
      return json(
        {
          error: {
            code: e.code,
            message: e.message,
            details: e.details,
            retryable: e.status === 503,
          },
        },
        e.status,
      );
    console.error('mailcraft_error', request_id, e instanceof Error ? e.name : 'Unknown');
    return json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'The operation could not be completed. Your acknowledged work is preserved.',
          retryable: false,
        },
      },
      500,
    );
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
