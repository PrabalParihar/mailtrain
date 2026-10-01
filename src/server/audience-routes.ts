import { z } from 'zod';
import { withPrincipal } from './auth';
import { keyed } from './commands';
import { audit, digest } from './audit';
import { importCommand, readImportErrors } from './contact-imports';
import { fail } from './errors';
import { resourcePage } from './pagination';
import { eligibility } from '../domain/audience';
export async function audienceRoute(
  req: Request,
  path: string[],
  body: Record<string, unknown>,
  key: string | null,
) {
  const [root, id, cmd] = path;
  return withPrincipal(
    req,
    root === 'campaigns'
      ? cmd === 'approve'
        ? 'approve'
        : ['send', 'schedule', 'pause', 'resume', 'cancel'].includes(cmd)
          ? 'send'
          : req.method === 'GET'
            ? 'read'
            : 'edit'
      : 'audience',
    async (tx, p) => {
      if (root === 'contacts') {
        if (req.method === 'GET')
          return resourcePage(req, tx, p, {
            resource: 'contacts',
            from: 'contacts c',
            fields:
              'c.*,EXISTS(SELECT 1 FROM suppressions s WHERE s.contact_id=c.id) AS suppressed,ARRAY(SELECT tag_id FROM contact_tags t WHERE t.contact_id=c.id ORDER BY tag_id) AS tag_ids,ARRAY(SELECT list_id FROM contact_lists l WHERE l.contact_id=c.id ORDER BY list_id) AS list_ids',
            created: 'c.created_at',
            id: 'c.id',
            where: 'NOT c.deleted',
            filters: { deleted: false },
          });
        if (cmd === 'suppress') {
          return keyed(tx, p, 'contact.suppress:' + id, key, body, async () => {
            const c = (await tx.query('SELECT id FROM contacts WHERE id=$1 FOR UPDATE', [id]))
              .rows[0];
            if (!c) fail(404, 'RESOURCE_NOT_FOUND', 'Contact not found.');
            await tx.query(
              "INSERT INTO suppressions(workspace_id,contact_id,reason) VALUES($1,$2,'manual') ON CONFLICT DO NOTHING",
              [p.workspace, id],
            );
            await tx.query('UPDATE contacts SET consent_version=consent_version+1 WHERE id=$1', [
              id,
            ]);
            await tx.query(
              "INSERT INTO consent_events(workspace_id,contact_id,action,evidence) VALUES($1,$2,'manual_block',$3)",
              [p.workspace, id, JSON.stringify({ actor: p.user })],
            );
            await audit(tx, p.workspace, p.user, 'contact.suppressed', id);
            return { suppressed: true };
          });
        }
      }
      if (root === 'contact-imports')
        return cmd === 'errors'
          ? readImportErrors(tx, id, new URL(req.url).searchParams.get('cursor'))
          : importCommand(tx, p, id, cmd, body, key);
      if (root === 'campaigns') {
        if (req.method === 'GET')
          return resourcePage(req, tx, p, {
            resource: 'campaigns',
            from: 'campaigns',
            fields: '*',
          });
        if (!id)
          return keyed(tx, p, 'campaign.create', key, body, async () => {
            const name = z.string().min(1).max(160).parse(body.name),
              revision = z.string().uuid().parse(body.revision_id);
            const r = (
              await tx.query('SELECT artifact_hash FROM revisions WHERE id=$1', [revision])
            ).rows[0];
            if (!r) fail(404, 'RESOURCE_NOT_FOUND', 'Revision not found.');
            const contacts = (
              await tx.query(
                'SELECT c.id,c.subscription,c.deleted,EXISTS(SELECT 1 FROM suppressions s WHERE s.contact_id=c.id) AS suppressed FROM contacts c ORDER BY c.id',
              )
            ).rows;
            const intent = {
              revision_id: revision,
              artifact_hash: r.artifact_hash,
              audience: contacts.map((c) => ({ id: c.id, ...eligibility(c) })),
              provider: null,
              sender: null,
              topic: 'marketing',
              schedule: null,
              tracking: false,
            };
            const c = (
              await tx.query(
                'INSERT INTO campaigns(workspace_id,name,revision_id,intent,digest,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
                [p.workspace, name, revision, JSON.stringify(intent), digest(intent), p.user],
              )
            ).rows[0];
            await audit(tx, p.workspace, p.user, 'campaign.created', c.id);
            return { campaign: c };
          });
        return keyed(tx, p, 'campaign.' + cmd + ':' + id, key, body, async () => {
          const c = (await tx.query('SELECT * FROM campaigns WHERE id=$1 FOR UPDATE', [id]))
            .rows[0];
          if (!c) fail(404, 'RESOURCE_NOT_FOUND', 'Campaign not found.');
          if (cmd === 'submit-review') {
            if (c.state !== 'draft')
              fail(409, 'STATE_CONFLICT', 'Only a draft campaign can request review.');
            const reviewed = (
              await tx.query(
                "UPDATE campaigns SET state='review_pending' WHERE id=$1 AND state='draft' RETURNING *",
                [id],
              )
            ).rows[0];
            if (!reviewed)
              fail(409, 'STATE_CONFLICT', 'The campaign state changed. Reload and try again.');
            await audit(tx, p.workspace, p.user, 'campaign.review_requested', id);
            return {
              campaign: reviewed,
              notice:
                'Review requested. Sender, real-client preflight and delivery gates remain incomplete.',
            };
          }
          if (cmd === 'approve') {
            const preflight = (
              await tx.query(
                'SELECT state,artifact_hash FROM preflights WHERE revision_id=$1 ORDER BY created_at DESC LIMIT 1',
                [c.revision_id],
              )
            ).rows[0];
            if (
              !preflight ||
              preflight.state !== 'passed' ||
              preflight.artifact_hash !== c.intent.artifact_hash
            )
              fail(
                422,
                'PREFLIGHT_BLOCKED',
                'Critical and real-client checks must pass for this exact artifact before send approval.',
              );
            if (!c.intent.provider || !c.intent.sender)
              fail(409, 'PROVIDER_NOT_READY', 'Select and verify a provider-bound sender first.');
            fail(
              409,
              'RELEASE_GATES_INCOMPLETE',
              'Production delivery gates have not been verified. No approval was issued.',
            );
          }
          if (cmd === 'send' || cmd === 'schedule' || cmd === 'resume')
            fail(
              409,
              'PROVIDER_NOT_READY',
              'Sending is disabled until identity, consent, preview, spend and delivery gates are verified. No mail was submitted.',
            );
          if (cmd === 'cancel' || cmd === 'pause') {
            const state = cmd === 'cancel' ? 'cancelled' : 'paused';
            await tx.query('UPDATE campaigns SET state=$1 WHERE id=$2', [state, id]);
            await audit(tx, p.workspace, p.user, 'campaign.' + state, id);
            return {
              campaign: { ...c, state },
              accepted: 0,
              uncertain: 0,
              notice: 'No provider submissions exist for this campaign.',
            };
          }
          fail(404, 'RESOURCE_NOT_FOUND', 'Campaign command not found.');
        });
      }
      fail(404, 'RESOURCE_NOT_FOUND', 'Audience command not found.');
    },
  );
}
