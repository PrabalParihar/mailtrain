import {prepareRecipientAssessment,assessmentDetail,assessmentHistory,assessmentObservations,cancelRecipientAssessment} from '@/server/recipient-assessments';
import {RecipientAssessmentInput} from '@/domain/recipient-assessments';
import {localeSourceComparison} from '@/server/locale-source-comparison';
import type {Block} from '@/domain/email-schema';
import {emailConversionRoute}from'@/server/email-conversion';
import {workspacePreferenceRoute} from '@/server/workspace-calendar';
import{creationPage,creationView,creationAttempts}from'@/server/creation-history';
import { membershipRoute } from '@/server/membership-route';
import { EventType } from '@/domain/events';
import { readEventBody } from '@/server/events';
import { LINT_RULES_VERSION,RAW_LINT_RULES_VERSION } from '@/domain/preflight';
import { resourcePage } from '@/server/pagination';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z, ZodError } from 'zod';
import { compileEmail, blankSpec, EmailSpecSchema, lintEmail } from '@/domain/email';
import { BrandSchema } from '@/domain/brand';
import{brandMemoryRoute}from'@/server/brand-memory-route';
import { identity, localBootstrap, checkOrigin, withPrincipal } from '@/server/auth';
import { userQuery, tenant } from '@/server/db';
import { AppError, fail } from '@/server/errors';
import { audit } from '@/server/audit';
import { keyed } from '@/server/commands';
import { createEmail, getEmail, saveDraft, checkpoint, restoreRevision } from '@/server/emails';
import { operation, cancelOperation } from '@/server/operations';
import { integrations } from '@/server/adapters';
import { audienceRoute } from '@/server/audience-routes';
import { organizationRoute } from '@/server/organization-routes';
import { allowed } from '@/domain/permissions';
import { assertRouteMethod, readJson } from '@/server/http';
import { keyRoute, requireKeyScope } from '@/server/api-keys';
import { operationScope } from '@/domain/api-keys';
import { RemixInput, LocaleDraftInput } from '@/domain/derivation';
import { readDispatchControls, setWorkspaceDispatchPolicy } from '@/server/dispatch-controls';
import { DispatchPolicyInput } from '@/domain/dispatch-controls';
import { deriveEmail } from '@/server/derivation';
import{webhookHistoryRoute}from'@/server/webhook-history';
import { webhookRoute } from '@/server/webhook-route';
import{assetRoute}from'@/server/asset-route';
import{assetReferences,resolveAssetManifest,readAssetVariantsVerified}from'@/server/assets';
import{privatePreviewHtml,frozenPrivateImageBundle}from'@/server/asset-output';
import type{AssetManifest}from'@/domain/assets';
import {senderDomainRoute} from '@/server/sender-domain-route';
import {EmailSourceSpecSchema}from'@/domain/email-schema';
import {emailSourceRoute,revisionSourceResponse}from'@/server/email-source-route';
import {readEmailSourceJson}from'@/server/email-source-body';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
async function handle(req: Request, ctx: Context) {
  const request_id = randomUUID();
  const { path } = await ctx.params;
  const [root, id, command] = path;
  const method = req.method;
  const json = (data: unknown, status = 200, headers: Record<string, string> = {}) => {
    const op = (data as { operation?: { id?: string } })?.operation;
    if (status === 202 && op?.id)
      headers = { Location: '/v1/operations/' + op.id, 'Retry-After': '2', ...headers };
    return NextResponse.json(
      { request_id, ...(data as object) },
      { status, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': request_id, ...headers } },
    );
  };
  try {
    assertRouteMethod(path, method);
    checkOrigin(req);
    if(root==='emails'&&id&&['draft','source-import','import-html','source-fork'].includes(command))return json(await emailSourceRoute(req,id,command as 'draft'|'source-import'|'import-html'|'source-fork'));
    if(root==='email-revisions'&&command==='download'&&new URL(req.url).searchParams.get('format')==='source'){
      const response=await revisionSourceResponse(req,id);response.headers.set('X-Request-Id',request_id);return response;
    }
    const sourceBody=root==='emails'&&method==='POST'&&(!id||command==='preview');
    if(sourceBody)await withPrincipal(req,command==='preview'?'read':'edit',async tx=>{if(id)await getEmail(tx,id);});
    const recipientBody=root==='recipient-assessments'||(root==='campaigns'&&command==='recipient-assessments');
    const body=recipientBody?await readJson(req,16*1024):sourceBody?await readEmailSourceJson(req):await readJson(req);
    const key = req.headers.get('idempotency-key');
    const version = () => {
      const raw = req.headers.get('if-match');
      const v = Number(raw?.replaceAll('"', '').replace('draft-', ''));
      if (!Number.isSafeInteger(v) || v < 1)
        fail(428, 'VERSION_REQUIRED', 'Supply the acknowledged If-Match draft version.');
      return v;
    };
    if(root==='emails'&&id&&['conversion-proposal','convert-to-blocks'].includes(command))return json(await emailConversionRoute(req,id,command,body,key));
    if(recipientBody){
      const result=await withPrincipal(req,'audience',async(tx,p)=>{
        if(root==='campaigns')return method==='POST'?prepareRecipientAssessment(tx,p,id,RecipientAssessmentInput.parse(body),key):assessmentHistory(req,tx,p,id);
        if(command==='cancel'){z.object({}).strict().parse(body);return cancelRecipientAssessment(tx,p,id,key);}
        return command==='observations'?assessmentObservations(req,tx,p,id):assessmentDetail(tx,p,id);
      });
      const assessment=(result as {assessment?:{id:string}}).assessment;
      return json(result,root==='campaigns'&&method==='POST'?202:200,root==='campaigns'&&method==='POST'&&assessment?{Location:'/v1/recipient-assessments/'+assessment.id,'Retry-After':'2'}:{});
    }
    if (root === 'health')
      return json({ status: 'ok', release: 'development', dispatch_enabled: false });
    if(root==='assets'){const result=await assetRoute(req,path,body,key);if(result instanceof Response){result.headers.set('X-Request-Id',request_id);return result;}return json(result,method==='POST'&&(id==='uploads'||command==='fallback')?202:200);}
    if(root==='emails'&&command==='preview'){const prepared=await withPrincipal(req,'read',async(tx,p)=>{const spec=EmailSourceSpecSchema.parse(body.spec),assets=assetReferences(spec).length?await resolveAssetManifest(tx,p,spec,'preview'):undefined;return{p,artifact:await compileEmail(spec,{assets}),assets};});if(prepared.assets?.entries.length){const values=await readAssetVariantsVerified(prepared.p,prepared.assets,undefined,4*1024*1024);return json({artifact:{...prepared.artifact,preview_html:privatePreviewHtml(prepared.artifact.preview_html??prepared.artifact.html,prepared.assets,values)}});}return json({artifact:prepared.artifact});}
    if(root==='sender-identities')return json(await senderDomainRoute(req,path,body,key),method==='POST'&&!id?201:200);
    if(root==='workspace-preferences')return json(await workspacePreferenceRoute(req,body,key));
    if(root==='memberships'||root==='membership-changes')return json(await membershipRoute(req,path,body,key));
    if(root==='brand-sources'||(root==='brands'&&command==='memory-preview'))return json(await brandMemoryRoute(req,path,body,key),root==='brand-sources'&&method==='POST'&&!id?201:200);
    if(root==='webhook-deliveries')return json(await webhookHistoryRoute(req,path,body,key));
    if (root === 'webhook-endpoints')
      return json(await webhookRoute(req,path,body,key),method==='POST'&&!id?201:200);
    if (root === 'events')
      return json(await withPrincipal(req,'manage',async(tx,p)=>{
        if(id){
          const row=(await tx.query('SELECT * FROM outbox WHERE id=$1 AND event_schema_version=1 AND event_body IS NOT NULL',[id])).rows[0];
          if(!row)fail(404,'RESOURCE_NOT_FOUND','Versioned event not found.');
          return {event:readEventBody(row)};
        }
        const requested=new URL(req.url).searchParams.get('type');
        const type=requested===null?null:EventType.parse(requested);
        const page=await resourcePage(req,tx,p,{resource:'events',from:'outbox',fields:'id,workspace_id,type,aggregate_id,event_schema_version,event_body,event_hash,recorded_at',created:'recorded_at',where:'event_schema_version=1 AND event_body IS NOT NULL'+(type?' AND type=$1':''),values:type?[type]:[],filters:{event_type:type}});
        return {...page,data:page.data.map((row)=>readEventBody(row))};
      }));
    if (root === 'dispatch-controls')
      return json(await withPrincipal(req, 'manage', async (tx,p) => {
        if (method !== 'GET') await keyed(tx,p,'dispatch.workspace_policy',key,body,() => setWorkspaceDispatchPolicy(tx,p,DispatchPolicyInput.parse(body)));
        return { controls: await readDispatchControls(tx,p.workspace) };
      }));
    if (root === 'api-keys')
      return json(await keyRoute(req, path, body, key), method === 'POST' && !id ? 201 : 200);
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
          tenant(m.workspace_id, user, async (tx) => (
            await tx.query(
              "SELECT w.id,w.name,w.status,w.timezone,m.role FROM workspaces w JOIN memberships m ON m.workspace_id=w.id WHERE w.id=$1 AND m.user_id=$2 AND m.status='active' FOR SHARE OF w,m",
              [m.workspace_id,user],
            )
          ).rows[0]),
        ),
      );
      return json({ data: data.filter(Boolean),actor_id:user });
    }
    if (root === 'integrations')
      return json(await withPrincipal(req, 'read', async () => ({ data: integrations })));
    if (root === 'brands')
      return json(
        await withPrincipal(req, method === 'GET' ? 'read' : 'edit', async (tx, p) => {
          if (method === 'GET') {
            if (id === 'current')
              return {
                brand:
                  (await tx.query('SELECT * FROM brands ORDER BY version DESC LIMIT 1')).rows[0] ??
                  null,
              };
            return resourcePage(req, tx, p, { resource: 'brands', from: 'brands', fields: '*' });
          }
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
          await withPrincipal(req, 'read', async (tx, p) => {
            const expectedActor=req.headers.get('x-actor-id');if(expectedActor!==null){z.string().min(1).parse(expectedActor);if(expectedActor!==p.user)fail(409,'ACTOR_CHANGED','Your signed-in account changed. Reload before recovering email work.');}
            if(id&&command==='locale-source')return {comparison:await localeSourceComparison(tx,p,id)};
            if (id && command === 'derivatives') {
              await getEmail(tx, id);
              return resourcePage(req, tx, p, {
                resource: 'derivatives',
                from: `(SELECT e.id,e.title,e.doc_version,e.spec,e.updated_at,e.created_at,l.kind,l.target_locale,l.source_revision_id,l.source_doc_version,r.email_id AS source_email_id,
                  CASE WHEN l.source_doc_version IS NULL THEN 'unknown' WHEN l.source_doc_version=parent.doc_version THEN 'current' ELSE 'outdated' END AS source_status
                  FROM email_lineage l JOIN emails e ON e.workspace_id=l.workspace_id AND e.id=l.email_id
                  JOIN revisions r ON r.workspace_id=l.workspace_id AND r.id=l.source_revision_id
                  JOIN emails parent ON parent.workspace_id=r.workspace_id AND parent.id=r.email_id) AS derived`,
                fields: 'id,title,doc_version,spec,kind,target_locale,source_revision_id,source_doc_version,source_status,updated_at,created_at',
                where: 'source_email_id=$1::uuid', values: [id], filters: { source_email_id: id },
              });
            }
            return id
              ? { email: await getEmail(tx, id) }
              : resourcePage(req, tx, p, {
                  resource: 'emails',
                  from: 'emails',
                  fields: 'id,title,doc_version,spec,updated_at,created_at',
                });
          }),
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
                ? EmailSourceSpecSchema.parse(body.spec)
                : blankSpec(brand.id, brand.data.name);
              if (!body.spec) {
                spec.theme.accent = brand.data.accent;
                spec.theme.background = brand.data.background;
                spec.theme.font_stack = brand.data.font_stack;
                const footer = spec.sections.find((b) => b.type === 'legal_footer');
                if (footer?.type === 'legal_footer') footer.address = brand.data.address;
              }
              return { email: await createEmail(tx,p,title,spec,{commandId:key??undefined,requestId:request_id}) };
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
          fail(404, 'RESOURCE_NOT_FOUND', 'Command not found.');
        }),
        id === 'generate' ? 202 : 200,
      );
    }
    if (root === 'email-revisions') {
      if (command === 'remix' || command === 'localize') {
        const input = command === 'remix' ? { ...RemixInput.parse(body), kind: 'remix' as const } : { ...LocaleDraftInput.parse(body), kind: 'locale' as const };
        return json(await withPrincipal(req, 'edit', (tx, p) => keyed(tx, p, 'email.' + command + ':' + id, key, input, () => deriveEmail(tx, p, id, input))), 201);
      }
      if (method === 'GET' && !command)
        return json(
          await withPrincipal(req, 'read', async (tx, p) => {
            const rawEmail = new URL(req.url).searchParams.get('email_id');
            const email_id = rawEmail === null ? null : z.uuid().parse(rawEmail);
            return resourcePage(req, tx, p, {
              resource: 'revisions',
              from: 'revisions',
              fields:
                "id,email_id,revision_no,spec->>'subject' AS subject,artifact_hash,created_at",
              where: '($1::uuid IS NULL OR email_id=$1::uuid)',
              values: [email_id],
              filters: { email_id },
            });
          }),
        );
      if (command === 'download') {
        const row = await withPrincipal(req, 'edit', async (tx, p) => {
          const r = (await tx.query('SELECT * FROM revisions WHERE id=$1', [id])).rows[0];
          if (!r) fail(404, 'RESOURCE_NOT_FOUND', 'Revision not found.');
          await audit(tx, p.workspace, p.user, 'revision.downloaded', id);
          return r;
        });
        const format = new URL(req.url).searchParams.get('format') ?? 'html';
        if (!['html', 'txt', 'png', 'pdf','zip'].includes(format))
          fail(422, 'VALIDATION_FAILED', 'Choose HTML, plaintext, PNG, PDF or an image ZIP bundle.');
        if((row.manifest?.raw_projection??row.manifest?.fragment_projection)&&(row.manifest.raw_projection??row.manifest.fragment_projection).delivery_status!=='eligible_for_checks')fail(409,'RAW_DELIVERY_BLOCKED','Exact source is preserved. Correct the blocking source diagnostics before rendered exports, or download format=source.');
        const frozenAssets=row.manifest?.assets as AssetManifest|undefined;
        if(format==='html'&&frozenAssets?.entries.length)fail(409,'ASSET_PUBLICATION_NOT_CONFIGURED','Private images cannot be delivered as hosted HTML. Download the image ZIP bundle.');
        let data: Buffer | string = format === 'txt' ? row.plaintext : row.html;
        let mime = format === 'txt' ? 'text/plain' : 'text/html';
        if(format==='zip'){data=await frozenPrivateImageBundle(req,row,frozenAssets??{version:'asset-manifest-1',entries:[]});mime='application/zip';}
        if (format === 'png' || format === 'pdf') {
          const { frozenRenderDownload } = await import('@/server/render-cache');
          data = await frozenRenderDownload(req, row, format);
          mime = format === 'png' ? 'image/png' : 'application/pdf';
        }
        return new Response(data as BodyInit, {
          headers: {
            'Content-Type': mime,
            'Content-Disposition': `attachment; filename="mailcraft-v${row.revision_no}.${format}"`,
            'X-Artifact-Hash': row.artifact_hash,
            'X-Request-Id': request_id,
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
              const projection=r.manifest?.raw_projection??r.manifest?.fragment_projection;
              const sourceUnavailable=projection?.delivery_status==='unavailable';
              const lintSpec=sourceUnavailable?{...r.spec,raw_html:'',sections:r.spec.sections.map((b:Block)=>b.type==='custom_html'?{...b,html:''}:b.type==='columns'?{...b,columns:b.columns.map(col=>col.map(n=>n.type==='custom_html'?{...n,html:''}:n))}:b)}:r.spec;
              const findings = lintEmail(lintSpec, brand?.data.forbidden_phrases ?? [], {
                html: r.html,assets:r.manifest?.assets,
              },brand?.data.tone_rules);
              if(sourceUnavailable)findings.push({code:'RAW_LINT_LIMIT',severity:'info',location:'raw_html',message:'Detailed source lint was omitted because the bounded projection is unavailable. The exact source remains stored; projection diagnostics block delivery.'});
              if(projection){for(const d of projection.diagnostics??[])findings.push({code:d.code,severity:d.severity,location:(d.node_id??'raw_html')+':'+d.start+'-'+d.end,message:d.message});if(projection.delivery_status!=='eligible_for_checks'&&!findings.some(x=>x.severity==='blocking'))findings.push({code:'RAW_DELIVERY_BLOCKED',severity:'blocking',location:'raw_html',message:'The authored source is preserved but this projection is not eligible for delivery.'});}
              const state = findings.some((x) => x.severity === 'blocking')
                ? 'blocked'
                : 'incomplete';
              const report = (
                await tx.query(
                  'INSERT INTO preflights(workspace_id,revision_id,artifact_hash,state,findings,rule_set_version) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
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
                    projection?RAW_LINT_RULES_VERSION:LINT_RULES_VERSION,
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
          if(!id)return creationPage(req,tx,p);
          const row = (await tx.query('SELECT * FROM operations WHERE id=$1', [id])).rows[0];
          if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Operation not found.');
          requireKeyScope(p, operationScope(row.type, command === 'cancel'));
          if (row.type === 'contacts.import' && !allowed(p.role, 'audience'))
            fail(403, 'INSUFFICIENT_SCOPE', 'Your role cannot access recipient import data.');
          if(command==='attempts')return creationAttempts(req,tx,p,id,row.type);
          if (command === 'cancel') {const cancelled=await cancelOperation(tx,p,id);return {operation:['brand.extract','email.generate'].includes(row.type)?await creationView(tx,cancelled):cancelled};}
          return { operation: ['brand.extract','email.generate'].includes(row.type)?await creationView(tx,row):row };
        }),
      );
    if (
      [
        'audience-schema',
        'lists',
        'tags',
        'contact-fields',
        'segments',
        'audience-snapshots',
      ].includes(root) ||
      (root === 'contacts' && command === 'profile')
    )
      return json(await organizationRoute(req, path, body, key));
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
        await withPrincipal(req, 'manage', async (tx, p) =>
          resourcePage(req, tx, p, {
            resource: 'audit',
            from: 'audit_events',
            fields: 'id,actor,action,resource_id,event_hash,created_at',
          }),
        ),
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
            retryable: e.status === 503 || e.status === 429,
          },
        },
        e.status,
        e.status === 429
          ? { 'Retry-After': String((e.details as { retry_after?: number })?.retry_after ?? 60) }
          : {},
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
