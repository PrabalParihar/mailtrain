import { z } from 'zod';
import { tenant } from './db';
import { fail } from './errors';
import { PreferenceInput } from '../domain/preferences';
import { signPreferenceClaims, verifyPreferenceClaims } from './preference-tokens';
const Claim = z.object({
  workspace: z.string().uuid(),
  contact: z.string().uuid(),
  scope: z.literal('marketing'),
  topic: z.string().uuid().optional(),
});
export async function issuePreferenceToken(workspace: string, contact: string, topic?: string) {
  return signPreferenceClaims(
    Claim.parse({ workspace, contact, scope: 'marketing', topic }),
    'marketing-preferences',
    '60d',
  );
}
async function claims(token: string) {
  const parsed = Claim.safeParse(await verifyPreferenceClaims(token, 'marketing-preferences'));
  if (!parsed.success) {
    fail(404, 'PREFERENCE_LINK_INVALID', 'This preference link is invalid or expired.');
  }
  return parsed.data;
}
export async function readPreference(token: string) {
  const c = await claims(token);
  return tenant(c.workspace, 'recipient-preference', async (tx) => {
    const row = (
      await tx.query(
        'SELECT id,subscription,frequency,preference_version FROM contacts WHERE id=$1 AND NOT deleted',
        [c.contact],
      )
    ).rows[0];
    if (!row) fail(404, 'PREFERENCE_LINK_INVALID', 'This preference link is invalid or expired.');
    const suppressed = (
      await tx.query('SELECT id FROM suppressions WHERE contact_id=$1 LIMIT 1', [c.contact])
    ).rowCount;
    const brand = (await tx.query('SELECT data FROM brands ORDER BY version DESC LIMIT 1')).rows[0];
    const topics = (
      await tx.query(
        "SELECT l.id,l.name,COALESCE(t.subscription,'unsubscribed') AS subscription FROM lists l LEFT JOIN topic_subscriptions t ON t.topic_id=l.id AND t.contact_id=$1 ORDER BY l.name,l.id LIMIT 101",
        [c.contact],
      )
    ).rows;
    return {
      brand: brand?.data.name ?? 'Sender',
      unsubscribed: row.subscription === 'unsubscribed',
      safety_blocked: !!suppressed,
      scope: 'marketing',
      global_unsubscribed: row.subscription === 'unsubscribed',
      frequency: row.frequency as 'daily' | 'weekly' | 'monthly',
      version: row.preference_version as number,
      topics: topics.slice(0, 100) as { id: string; name: string; subscription: string }[],
      topics_unavailable: topics.length > 100,
      confirmation_delivery: 'not_configured' as const,
    };
  });
}
export async function savePreference(token: string, input: unknown) {
  const c = await claims(token),
    data = PreferenceInput.parse(input);
  return tenant(c.workspace, 'recipient-preference', async (tx) => {
    const contact = (
      await tx.query('SELECT * FROM contacts WHERE id=$1 AND NOT deleted FOR UPDATE', [c.contact])
    ).rows[0];
    if (!contact)
      fail(404, 'PREFERENCE_LINK_INVALID', 'This preference link is invalid or expired.');
    if (contact.preference_version !== data.expected_version)
      fail(409, 'PREFERENCE_CHANGED', 'Your preferences changed. Reload before saving.');
    const all = (await tx.query('SELECT id FROM lists ORDER BY id')).rows.map(
      (r) => r.id as string,
    );
    if (all.length > 100 || data.topics.some((t) => !all.includes(t)))
      fail(422, 'TOPIC_INVALID', 'A selected topic is unavailable.');
    const prior = (
      await tx.query('SELECT topic_id,subscription FROM topic_subscriptions WHERE contact_id=$1', [
        c.contact,
      ])
    ).rows;
    const wanted = new Set(data.topics),
      newlyPending = all.filter(
        (t) => wanted.has(t) && prior.find((p) => p.topic_id === t)?.subscription !== 'subscribed',
      );
    let changed = false;
    for (const topic of all) {
      const previous = prior.find((p) => p.topic_id === topic)?.subscription ?? 'unsubscribed';
      const subscription = wanted.has(topic)
        ? previous === 'subscribed'
          ? 'subscribed'
          : 'pending_confirmation'
        : 'unsubscribed';
      if (subscription !== previous) {
        changed = true;
        await tx.query(
          'INSERT INTO topic_subscriptions(workspace_id,contact_id,topic_id,subscription) VALUES($1,$2,$3,$4) ON CONFLICT(workspace_id,contact_id,topic_id) DO UPDATE SET subscription=$4,updated_at=now()',
          [c.workspace, c.contact, topic, subscription],
        );
        await tx.query(
          'INSERT INTO consent_events(workspace_id,contact_id,action,evidence) VALUES($1,$2,$3,$4)',
          [
            c.workspace,
            c.contact,
            subscription === 'unsubscribed' ? 'topic_unsubscribe' : 'topic_confirmation_requested',
            JSON.stringify({ topic_id: topic, source: 'signed_preference_link', verified: false }),
          ],
        );
      }
    }
    const updated = (
      await tx.query(
        'UPDATE contacts SET frequency=$1,preference_version=preference_version+1,consent_version=consent_version+$2 WHERE id=$3 RETURNING *',
        [data.frequency, changed ? 1 : 0, c.contact],
      )
    ).rows[0];
    let confirmationRequested = false;
    if (newlyPending.length || data.reactivate_global) {
      if (!data.topics.length)
        fail(422, 'TOPIC_REQUIRED', 'Choose at least one topic for confirmation.');
      const request = (
        await tx.query(
          'INSERT INTO opt_in_requests(workspace_id,contact_id,topic_ids,reactivate_global,expected_consent_version,expected_preference_version) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',
          [
            c.workspace,
            c.contact,
            data.reactivate_global ? data.topics : newlyPending,
            data.reactivate_global,
            updated.consent_version,
            updated.preference_version,
          ],
        )
      ).rows[0];
      await tx.query(
        "INSERT INTO outbox(workspace_id,type,aggregate_id,data) VALUES($1,'contact.confirmation_requested',$2,$3)",
        [
          c.workspace,
          c.contact,
          JSON.stringify({ request_id: request.id, delivery_state: 'not_configured' }),
        ],
      );
      confirmationRequested = true;
    }
    await tx.query(
      "INSERT INTO consent_events(workspace_id,contact_id,action,evidence) VALUES($1,$2,'preference_saved',$3)",
      [
        c.workspace,
        c.contact,
        JSON.stringify({ frequency: data.frequency, source: 'signed_preference_link' }),
      ],
    );
    return {
      version: updated.preference_version as number,
      topic_statuses: (
        await tx.query(
          'SELECT topic_id AS id,subscription FROM topic_subscriptions WHERE contact_id=$1',
          [c.contact],
        )
      ).rows as { id: string; subscription: string }[],
      confirmation_requested: confirmationRequested,
      confirmation_delivery: 'not_configured' as const,
      opt_in_granted: 0,
    };
  });
}
export async function unsubscribe(token: string, global = false) {
  const c = await claims(token);
  return tenant(c.workspace, 'recipient-preference', async (tx) => {
    const row = (
      await tx.query('SELECT id,subscription FROM contacts WHERE id=$1 FOR UPDATE', [c.contact])
    ).rows[0];
    if (!row) fail(404, 'PREFERENCE_LINK_INVALID', 'This preference link is invalid or expired.');
    if (c.topic && !global) {
      if (!(await tx.query('SELECT 1 FROM lists WHERE id=$1', [c.topic])).rowCount)
        fail(404, 'PREFERENCE_LINK_INVALID', 'This preference link is invalid or expired.');
      const changed = await tx.query(
        "INSERT INTO topic_subscriptions(workspace_id,contact_id,topic_id,subscription) VALUES($1,$2,$3,'unsubscribed') ON CONFLICT(workspace_id,contact_id,topic_id) DO UPDATE SET subscription='unsubscribed',updated_at=now() WHERE topic_subscriptions.subscription<>'unsubscribed' RETURNING topic_id",
        [c.workspace, c.contact, c.topic],
      );
      if (changed.rowCount) {
        await tx.query(
          'UPDATE contacts SET consent_version=consent_version+1,preference_version=preference_version+1 WHERE id=$1',
          [c.contact],
        );
        await tx.query(
          "INSERT INTO consent_events(workspace_id,contact_id,action,evidence) VALUES($1,$2,'topic_unsubscribe',$3)",
          [
            c.workspace,
            c.contact,
            JSON.stringify({ topic_id: c.topic, source: 'one_click_signed_link' }),
          ],
        );
        await tx.query(
          "INSERT INTO outbox(workspace_id,type,aggregate_id,data) VALUES($1,'contact.topic_unsubscribed',$2,$3)",
          [c.workspace, c.contact, JSON.stringify({ topic_id: c.topic })],
        );
      }
      return { unsubscribed: true };
    }
    const inserted = await tx.query(
      "INSERT INTO suppressions(workspace_id,contact_id,reason) VALUES($1,$2,'unsubscribe') ON CONFLICT DO NOTHING RETURNING id",
      [c.workspace, c.contact],
    );
    const pendingReOptIn = (
      await tx.query(
        "SELECT 1 FROM opt_in_requests WHERE contact_id=$1 AND status='pending' AND expires_at>now() AND expected_consent_version=(SELECT consent_version FROM contacts WHERE id=$1) LIMIT 1",
        [c.contact],
      )
    ).rowCount;
    if (inserted.rowCount || pendingReOptIn) {
      await tx.query(
        "UPDATE contacts SET subscription='unsubscribed',consent_version=consent_version+1,preference_version=preference_version+1 WHERE id=$1",
        [c.contact],
      );
      await tx.query(
        "INSERT INTO consent_events(workspace_id,contact_id,action,evidence) VALUES($1,$2,'unsubscribe',$3)",
        [
          c.workspace,
          c.contact,
          JSON.stringify({ scope: c.scope, source: 'signed_preference_link' }),
        ],
      );
      await tx.query(
        'INSERT INTO outbox(workspace_id,type,aggregate_id,data) VALUES($1,$2,$3,$4)',
        [
          c.workspace,
          'contact.unsubscribed',
          c.contact,
          JSON.stringify({ contact_id: c.contact, scope: c.scope }),
        ],
      );
    }
    return { unsubscribed: true };
  });
}
