import type { Tx } from './db';
import type { Principal } from './auth';
import { DerivationInput, derivativeSpec, type Derivation } from '../domain/derivation';
import { createEmail, checkpoint, getEmail, emailLineage } from './emails';
import { fail } from './errors';
import { audit } from './audit';
export async function deriveEmail(tx: Tx, p: Principal, revisionId: string, input: Derivation) {
  const value = DerivationInput.parse(input);
  const source = (await tx.query('SELECT * FROM revisions WHERE id=$1', [revisionId])).rows[0];
  if (!source) fail(404, 'RESOURCE_NOT_FOUND', 'Source revision not found in this workspace.');
  if (value.kind === 'locale' && value.locale === source.spec.locale)
    fail(422, 'LOCALE_UNCHANGED', 'Choose a locale different from the source.');
  const copied = derivativeSpec(source.spec, value);
  const created = await createEmail(tx, p, value.title, copied);
  await tx.query('INSERT INTO email_lineage(workspace_id,email_id,source_revision_id,source_doc_version,kind,target_locale,created_by)VALUES($1,$2,$3,$4,$5,$6,$7)',
    [p.workspace, created.id, source.id, source.source_doc_version, value.kind, value.kind === 'locale' ? value.locale : null, p.user]);
  const revision = await checkpoint(tx, p, created.id, 1);
  await audit(tx, p.workspace, p.user, value.kind === 'locale' ? 'email.locale_draft_created' : 'email.remixed', created.id);
  return { email: await getEmail(tx, created.id), revision, lineage: (await emailLineage(tx, created.id))! };
}
