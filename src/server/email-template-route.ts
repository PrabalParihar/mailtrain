import { z } from 'zod';
import { withPrincipal } from './auth';
import { fail } from './errors';
import {
  SaveEmailTemplateInput, ArchiveEmailTemplateInput, RemixEmailTemplateInput,
} from '../domain/email-templates';
import {
  listEmailTemplates, getEmailTemplate, saveEmailTemplate,
  archiveEmailTemplate, remixEmailTemplate,
} from './email-templates';

export async function emailTemplateRoute(
  req: Request, path: string[], body: Record<string, unknown>, key: string | null,
) {
  const [, rawId, command] = path;
  const id = rawId ? z.uuid().parse(rawId).toLowerCase() : undefined;
  const parameters = new URL(req.url).searchParams;
  const allowed = req.method === 'GET' && !id ? ['state', 'limit', 'after', 'created_after', 'created_before'] : [];
  for (const [name, value] of parameters)
    if (!allowed.includes(name) || !value || parameters.getAll(name).length !== 1)
      fail(422, 'VALIDATION_FAILED', 'Use only the documented nonempty template query parameters once.');
  return withPrincipal(req, req.method === 'GET' ? 'read' : 'edit', async (tx, p) => {
    const actor = req.headers.get('x-actor-id');
    if (actor !== null && actor !== p.user)
      fail(409, 'ACTOR_CHANGED', 'Your signed-in account changed. Reload before recovering template work.');
    if (req.method === 'GET')
      return id ? getEmailTemplate(tx, p, id) : listEmailTemplates(req, tx, p);
    if (!id) return saveEmailTemplate(tx, p, SaveEmailTemplateInput.parse(body), key);
    if (command === 'archive') return archiveEmailTemplate(tx, p, id, ArchiveEmailTemplateInput.parse(body), key);
    return remixEmailTemplate(tx, p, id, RemixEmailTemplateInput.parse(body), key);
  });
}
