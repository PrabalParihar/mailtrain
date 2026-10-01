import { z } from 'zod';
export const KEY_SCOPES = [
  'brands:read',
  'brands:write',
  'emails:read',
  'emails:write',
  'emails:export',
  'audience:read',
  'audience:write',
  'campaigns:read',
  'campaigns:write',
  'campaigns:approve',
  'campaigns:send',
  'integrations:read',
  'events:read',
  'webhooks:read',
  'webhooks:write',
] as const;
export const KeyInput = z
  .object({
    name: z.string().trim().min(1).max(100),
    scopes: z
      .array(z.enum(KEY_SCOPES))
      .min(1)
      .max(KEY_SCOPES.length)
      .refine((values) => new Set(values).size === values.length),
    expires_in_days: z.number().int().min(1).max(365).default(90),
  })
  .strict();
export function scopeForResource(
  root: string,
  method: string,
  command: string | undefined,
): string | undefined {
  const read = method === 'GET';
  if (root === 'brands'||root==='brand-sources') return read||command==='memory-preview' ? 'brands:read' : 'brands:write';
  if (root === 'emails') return read ? 'emails:read' : 'emails:write';
  if (root === 'email-revisions')
    return command === 'download' || command === 'export'
      ? 'emails:export'
      : read
        ? 'emails:read'
        : 'emails:write';
  if (
    [
      'contacts',
      'contact-imports',
      'audience-schema',
      'lists',
      'tags',
      'contact-fields',
      'segments',
      'audience-snapshots',
    ].includes(root)
  )
    return read ? 'audience:read' : 'audience:write';
  if (root === 'campaigns')
    return read
      ? 'campaigns:read'
      : command === 'approve'
        ? 'campaigns:approve'
        : ['send', 'schedule', 'pause', 'resume', 'cancel'].includes(command ?? '')
          ? 'campaigns:send'
          : 'campaigns:write';
  if (root === 'events') return read ? 'events:read' : 'unsupported';
  if (root === 'webhook-endpoints'||root==='webhook-deliveries') return read ? 'webhooks:read' : 'webhooks:write';
  if (root === 'integrations') return 'integrations:read';
  if (root === 'operations') return undefined; // checked against the fetched operation type
  return 'unsupported';
}
export function operationScope(type: string, write = false) {
  const resource =
    type === 'contacts.import'
      ? 'audience'
      : type === 'brand.extract'
        ? 'brands'
        : type === 'email.generate'
          ? 'emails'
          : undefined;
  return resource ? resource + ':' + (write ? 'write' : 'read') : 'unsupported';
}
