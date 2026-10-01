import type { Tx } from './db';
import { frequencyWindowMs, Frequency } from '../domain/preferences';
export async function reserveFrequency(
  tx: Tx,
  workspace: string,
  contact: string,
  topic: string,
  delivery: string,
) {
  const deny = (reason: string) => ({ reserved: false, reason, delivery_id: delivery });
  const c = (await tx.query('SELECT * FROM contacts WHERE id=$1 FOR UPDATE', [contact])).rows[0];
  if (!c || c.deleted) return deny('CONTACT_DELETED');
  if (
    (await tx.query('SELECT 1 FROM suppressions WHERE contact_id=$1 LIMIT 1', [contact])).rowCount
  )
    return deny('SUPPRESSED');
  if (c.subscription !== 'subscribed') return deny('CONSENT_NOT_CONFIRMED');
  if (
    !(
      await tx.query(
        "SELECT 1 FROM topic_subscriptions WHERE contact_id=$1 AND topic_id=$2 AND subscription='subscribed'",
        [contact, topic],
      )
    ).rowCount
  )
    return deny('TOPIC_NOT_CONFIRMED');
  const existing = (
    await tx.query('SELECT * FROM frequency_reservations WHERE delivery_id=$1', [delivery])
  ).rows[0];
  if (existing)
    return existing.contact_id === contact &&
      existing.topic_id === topic &&
      ['reserved', 'accepted', 'uncertain'].includes(existing.state)
      ? { reserved: true, reason: 'ALREADY_RESERVED', delivery_id: delivery }
      : deny('RESERVATION_CONFLICT');
  const duration = frequencyWindowMs(Frequency.parse(c.frequency));
  const count = await tx.query(
    "SELECT 1 FROM frequency_reservations WHERE contact_id=$1 AND (state IN('reserved','uncertain') OR (state='accepted' AND reserved_at>clock_timestamp()-($2::double precision*interval '1 millisecond'))) LIMIT 1",
    [contact, duration],
  );
  if (count.rowCount) return deny('FREQUENCY_CAP');
  await tx.query(
    'INSERT INTO frequency_reservations(workspace_id,contact_id,topic_id,delivery_id) VALUES($1,$2,$3,$4)',
    [workspace, contact, topic, delivery],
  );
  return { reserved: true, reason: 'RESERVED', delivery_id: delivery };
}
