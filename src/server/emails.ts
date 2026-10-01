import { EmailSpecSchema, compileEmail, sanitizeRaw, type EmailSpec } from '../domain/email';
import type { Principal } from './auth';
import type { Tx } from './db';
import { audit } from './audit';
import { fail } from './errors';
export async function getEmail(tx: Tx, id: string) {
  const row = (await tx.query('SELECT * FROM emails WHERE id=$1', [id])).rows[0];
  if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Email not found.');
  return row as {
    id: string;
    title: string;
    doc_version: number;
    spec: EmailSpec;
    updated_at: string;
  };
}
async function verifyBrand(tx: Tx, spec: EmailSpec) {
  if (!(await tx.query('SELECT id FROM brands WHERE id=$1', [spec.brand_kit_version_id])).rowCount)
    fail(404, 'RESOURCE_NOT_FOUND', 'Brand version not found in this workspace.');
}
export async function createEmail(tx: Tx, p: Principal, title: string, spec: EmailSpec) {
  const s = EmailSpecSchema.parse(spec);
  await verifyBrand(tx, s);
  if (s.editing_mode === 'raw_html') s.raw_html = sanitizeRaw(s.raw_html!).html;
  const row = (
    await tx.query(
      'INSERT INTO emails(workspace_id,title,spec,created_by) VALUES($1,$2,$3,$4) RETURNING *',
      [p.workspace, title, JSON.stringify(s), p.user],
    )
  ).rows[0];
  await audit(tx, p.workspace, p.user, 'email.created', row.id);
  return row;
}
export async function saveDraft(tx: Tx, p: Principal, id: string, version: number, value: unknown) {
  const spec = EmailSpecSchema.parse(value);
  await verifyBrand(tx, spec);
  if (spec.editing_mode === 'raw_html') spec.raw_html = sanitizeRaw(spec.raw_html!).html;
  const row = (
    await tx.query(
      'UPDATE emails SET spec=$1,doc_version=doc_version+1,updated_at=now() WHERE id=$2 AND doc_version=$3 RETURNING *',
      [JSON.stringify(spec), id, version],
    )
  ).rows[0];
  if (!row) {
    await getEmail(tx, id);
    fail(
      412,
      'VERSION_MISMATCH',
      'This draft changed. Compare, reload newer or keep your work as a copy.',
    );
  }
  await audit(tx, p.workspace, p.user, 'email.saved', id);
  return row;
}
export async function checkpoint(tx: Tx, p: Principal, id: string, version: number) {
  await tx.query('SELECT id FROM emails WHERE id=$1 FOR UPDATE', [id]);
  const email = await getEmail(tx, id);
  if (email.doc_version !== version)
    fail(412, 'VERSION_MISMATCH', 'Save or reload the latest draft before creating a checkpoint.');
  const artifact = await compileEmail(email.spec);
  const no = (
    await tx.query('SELECT coalesce(max(revision_no),0)+1 AS no FROM revisions WHERE email_id=$1', [
      id,
    ])
  ).rows[0].no;
  const row = (
    await tx.query(
      'INSERT INTO revisions(workspace_id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [
        p.workspace,
        id,
        no,
        JSON.stringify(email.spec),
        artifact.html,
        artifact.text,
        artifact.hash,
        JSON.stringify(artifact.manifest),
        p.user,
      ],
    )
  ).rows[0];
  await audit(tx, p.workspace, p.user, 'email.checkpoint', row.id);
  return row;
}
export async function restoreRevision(
  tx: Tx,
  p: Principal,
  id: string,
  version: number,
  revision: string,
) {
  const row = (
    await tx.query('SELECT spec FROM revisions WHERE id=$1 AND email_id=$2', [revision, id])
  ).rows[0];
  if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Revision not found.');
  await checkpoint(tx, p, id, version);
  return saveDraft(tx, p, id, version, row.spec);
}
