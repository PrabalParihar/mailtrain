import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { tenant } from './db';
import { fail } from './errors';
const Claim = z.object({
  workspace: z.string().uuid(),
  contact: z.string().uuid(),
  scope: z.literal('marketing'),
});
function key() {
  const secret = process.env.PREFERENCE_SIGNING_SECRET;
  if (!secret || secret.length < 32)
    fail(503, 'PREFERENCE_KEY_UNAVAILABLE', 'Preference service is not configured.');
  return new TextEncoder().encode(secret);
}
export async function issuePreferenceToken(workspace: string, contact: string) {
  return new SignJWT(Claim.parse({ workspace, contact, scope: 'marketing' }))
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('lettercape-preferences')
    .setAudience('marketing-preferences')
    .setIssuedAt()
    .setExpirationTime('60d')
    .sign(key());
}
async function claims(token: string) {
  try {
    const result = await jwtVerify(token, key(), {
      algorithms: ['HS256'],
      issuer: 'lettercape-preferences',
      audience: 'marketing-preferences',
    });
    return Claim.parse(result.payload);
  } catch {
    fail(404, 'PREFERENCE_LINK_INVALID', 'This preference link is invalid or expired.');
  }
}
export async function readPreference(token: string) {
  const c = await claims(token);
  return tenant(c.workspace, 'recipient-preference', async (tx) => {
    const row = (await tx.query('SELECT id,subscription FROM contacts WHERE id=$1', [c.contact]))
      .rows[0];
    if (!row) fail(404, 'PREFERENCE_LINK_INVALID', 'This preference link is invalid or expired.');
    const suppressed = (
      await tx.query('SELECT id FROM suppressions WHERE contact_id=$1 LIMIT 1', [c.contact])
    ).rowCount;
    const brand = (await tx.query('SELECT data FROM brands ORDER BY version DESC LIMIT 1')).rows[0];
    return {
      brand: brand?.data.name ?? 'Sender',
      unsubscribed: row.subscription === 'unsubscribed' || !!suppressed,
      scope: 'marketing',
    };
  });
}
export async function unsubscribe(token: string) {
  const c = await claims(token);
  return tenant(c.workspace, 'recipient-preference', async (tx) => {
    const row = (
      await tx.query('SELECT id,subscription FROM contacts WHERE id=$1 FOR UPDATE', [c.contact])
    ).rows[0];
    if (!row) fail(404, 'PREFERENCE_LINK_INVALID', 'This preference link is invalid or expired.');
    const inserted = await tx.query(
      "INSERT INTO suppressions(workspace_id,contact_id,reason) VALUES($1,$2,'unsubscribe') ON CONFLICT DO NOTHING RETURNING id",
      [c.workspace, c.contact],
    );
    if (inserted.rowCount) {
      await tx.query(
        "UPDATE contacts SET subscription='unsubscribed',consent_version=consent_version+1 WHERE id=$1",
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
