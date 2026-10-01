import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { tenant } from './db';
import { fail } from './errors';
import { digest } from './audit';
import { signPreferenceClaims, verifyPreferenceClaims } from './preference-tokens';
const Claim = z.object({
  workspace: z.string().uuid(),
  contact: z.string().uuid(),
  request: z.string().uuid(),
  nonce: z.string().length(64),
});
async function claim(token: string) {
  const value = Claim.safeParse(await verifyPreferenceClaims(token, 'double-opt-in'));
  if (!value.success)
    fail(404, 'PREFERENCE_LINK_INVALID', 'This confirmation link is invalid or expired.');
  return value.data;
}
// Internal delivery boundary only. No public HTTP route returns this token or claims delivery.
export async function issueConfirmationToken(workspace: string, request: string) {
  return tenant(workspace, 'confirmation-delivery', async (tx) => {
    const row = (
      await tx.query(
        "SELECT * FROM opt_in_requests WHERE id=$1 AND status='pending' AND expires_at>now() FOR UPDATE",
        [request],
      )
    ).rows[0];
    if (!row)
      fail(404, 'PREFERENCE_LINK_INVALID', 'This confirmation request is invalid or expired.');
    const nonce = randomBytes(32).toString('hex');
    await tx.query('UPDATE opt_in_requests SET token_hash=$1 WHERE id=$2', [
      digest(nonce),
      request,
    ]);
    return signPreferenceClaims(
      { workspace, contact: row.contact_id, request, nonce },
      'double-opt-in',
      '24h',
    );
  });
}
export async function readOptIn(token: string) {
  const c = await claim(token);
  return tenant(c.workspace, 'recipient-confirmation', async (tx) => {
    const row = (
      await tx.query('SELECT * FROM opt_in_requests WHERE id=$1 AND contact_id=$2', [
        c.request,
        c.contact,
      ])
    ).rows[0];
    if (
      !row ||
      row.token_hash !== digest(c.nonce) ||
      new Date(row.expires_at).getTime() <= Date.now()
    )
      fail(404, 'PREFERENCE_LINK_INVALID', 'This confirmation link is invalid or expired.');
    const brand = (await tx.query('SELECT data FROM brands ORDER BY version DESC LIMIT 1')).rows[0];
    return {
      brand: brand?.data.name ?? 'Sender',
      confirmed: row.status === 'confirmed',
      reactivate_global: row.reactivate_global,
    };
  });
}
export async function confirmOptIn(token: string) {
  const c = await claim(token);
  return tenant(c.workspace, 'recipient-confirmation', async (tx) => {
    // Every consent/cap operation takes this lock first, including dispatch reservations.
    const contact = (await tx.query('SELECT * FROM contacts WHERE id=$1 FOR UPDATE', [c.contact]))
      .rows[0];
    const row = (
      await tx.query('SELECT * FROM opt_in_requests WHERE id=$1 AND contact_id=$2 FOR UPDATE', [
        c.request,
        c.contact,
      ])
    ).rows[0];
    if (
      !contact ||
      contact.deleted ||
      !row ||
      row.token_hash !== digest(c.nonce) ||
      new Date(row.expires_at).getTime() <= Date.now()
    )
      fail(404, 'PREFERENCE_LINK_INVALID', 'This confirmation link is invalid or expired.');
    if (row.status === 'confirmed') return { confirmed: true, repeated: true };
    if (
      contact.consent_version !== row.expected_consent_version ||
      contact.preference_version !== row.expected_preference_version
    )
      fail(409, 'CONSENT_CHANGED', 'Your preferences changed. Request a new confirmation link.');
    if (contact.subscription === 'unsubscribed' && !row.reactivate_global)
      fail(
        409,
        'GLOBAL_OPT_OUT',
        'Global marketing is unsubscribed. Deliberate re-opt-in is required.',
      );
    const available = await tx.query('SELECT id FROM lists WHERE id=ANY($1)', [row.topic_ids]);
    if (available.rowCount !== row.topic_ids.length)
      fail(409, 'TOPIC_CHANGED', 'A requested topic is unavailable.');
    for (const topic of row.topic_ids)
      await tx.query(
        "INSERT INTO topic_subscriptions(workspace_id,contact_id,topic_id,subscription,confirmed_request_id) VALUES($1,$2,$3,'subscribed',$4) ON CONFLICT(workspace_id,contact_id,topic_id) DO UPDATE SET subscription='subscribed',confirmed_request_id=$4,updated_at=now()",
        [c.workspace, c.contact, topic, c.request],
      );
    if (row.reactivate_global)
      await tx.query(
        "DELETE FROM suppressions WHERE contact_id=$1 AND reason IN('unsubscribe','import_unsubscribe')",
        [c.contact],
      );
    await tx.query(
      "UPDATE contacts SET subscription='subscribed',consent_version=consent_version+1,preference_version=preference_version+1 WHERE id=$1",
      [c.contact],
    );
    await tx.query("UPDATE opt_in_requests SET status='confirmed',confirmed_at=now() WHERE id=$1", [
      c.request,
    ]);
    const evidence = {
      source: 'signed_double_opt_in',
      request_id: c.request,
      topics: row.topic_ids,
      reactivate_global: row.reactivate_global,
      confirmed_at: new Date().toISOString(),
      proof: 'explicit_post_of_unforgeable_confirmation_token',
    };
    await tx.query(
      "INSERT INTO consent_events(workspace_id,contact_id,action,evidence) VALUES($1,$2,'double_opt_in_confirmed',$3)",
      [c.workspace, c.contact, JSON.stringify(evidence)],
    );
    await tx.query(
      "INSERT INTO outbox(workspace_id,type,aggregate_id,data) VALUES($1,'contact.consent_confirmed',$2,$3)",
      [c.workspace, c.contact, JSON.stringify({ request_id: c.request })],
    );
    return { confirmed: true, repeated: false };
  });
}
