import { z } from 'zod';
import { createElement as h } from 'react';
import { render } from '@react-email/render';
import sanitizeHtml from 'sanitize-html';
import { createHash } from 'node:crypto';
import { staticLint } from './preflight';

const str = z.string().max(10000),
  id = z.string().min(1).max(80);
const safeHref = z
  .string()
  .max(2048)
  .refine((v) => {
    try {
      const u = new URL(v);
      return !u.username && !u.password && ['https:', 'mailto:', 'tel:'].includes(u.protocol);
    } catch {
      return false;
    }
  }, 'Use HTTPS, mailto or tel');
const simple = z.discriminatedUnion('type', [
  z.object({ id, type: z.literal('hero'), heading: str, text: str }).strict(),
  z.object({ id, type: z.literal('text'), text: str }).strict(),
  z
    .object({
      id,
      type: z.literal('image'),
      src: safeHref,
      alt: z.string().max(500),
      decorative: z.boolean().optional(),
    })
    .strict(),
  z
    .object({ id, type: z.literal('button'), label: z.string().min(1).max(200), href: safeHref })
    .strict(),
  z.object({ id, type: z.literal('divider') }).strict(),
  z
    .object({
      id,
      type: z.literal('social'),
      links: z.array(z.object({ label: z.string().max(80), href: safeHref }).strict()).max(10),
    })
    .strict(),
  z
    .object({
      id,
      type: z.literal('legal_footer'),
      identity: z.string().max(500),
      address: z.string().max(1000),
      unsubscribe_slot: z.literal(true),
    })
    .strict(),
  z
    .object({
      id,
      type: z.literal('product_card'),
      title: str,
      description: str,
      price: z.string().max(100),
      href: safeHref,
    })
    .strict(),
  z.object({ id, type: z.literal('custom_html'), html: z.string().max(200000) }).strict(),
]);
export const BlockSchema = z.union([
  simple,
  z
    .object({
      id,
      type: z.literal('columns'),
      columns: z.array(z.array(simple).max(20)).min(1).max(2),
    })
    .strict(),
]);
export type Block = z.infer<typeof BlockSchema>;
const locales = [
  'en-US',
  'en-GB',
  'fr-FR',
  'de-DE',
  'es-ES',
  'it-IT',
  'pt-BR',
  'nl-NL',
  'sv-SE',
  'da-DK',
  'no-NO',
  'fi-FI',
  'pl-PL',
  'cs-CZ',
  'tr-TR',
  'ja-JP',
  'ko-KR',
  'zh-CN',
  'zh-TW',
  'hi-IN',
  'ar-SA',
  'he-IL',
] as const;
export const LOCALES = locales;
export const EmailSpecSchema = z
  .object({
    schema_version: z.literal('1.0'),
    editing_mode: z.enum(['structured', 'raw_html']),
    locale: z.enum(locales),
    direction: z.enum(['ltr', 'rtl']),
    subject: z.string().max(200),
    preheader: z.string().max(250),
    brand_kit_version_id: z.string().max(80),
    theme: z
      .object({
        content_width_px: z.number().int().min(320).max(800),
        background: z.string().regex(/^#[\da-fA-F]{6}$/),
        accent: z.string().regex(/^#[\da-fA-F]{6}$/),
        font_stack: z.enum(['Arial, sans-serif', 'Georgia, serif', 'Verdana, sans-serif']),
      })
      .strict(),
    sections: z.array(BlockSchema).max(200),
    raw_html: z.string().max(2000000).optional(),
  })
  .strict()
  .superRefine((s, c) => {
    let count = 0;
    const ids = new Set<string>();
    for (const b of s.sections) {
      const nodes = b.type === 'columns' ? [b, ...b.columns.flat()] : [b];
      for (const n of nodes) {
        count++;
        if (ids.has(n.id))
          c.addIssue({ code: 'custom', message: 'Duplicate node ID', path: ['sections'] });
        ids.add(n.id);
      }
    }
    if (count > 200)
      c.addIssue({ code: 'custom', message: 'Maximum 200 nodes', path: ['sections'] });
    if (s.editing_mode === 'raw_html' && !s.raw_html)
      c.addIssue({ code: 'custom', message: 'Raw HTML required', path: ['raw_html'] });
    if (JSON.stringify(s).length > 1048576 && s.editing_mode === 'structured')
      c.addIssue({ code: 'custom', message: 'Maximum 1 MiB structured document' });
  });
export type EmailSpec = z.infer<typeof EmailSpecSchema>;
export function blankSpec(brand: string, name: string): EmailSpec {
  return {
    schema_version: '1.0',
    editing_mode: 'structured',
    locale: 'en-US',
    direction: 'ltr',
    subject: '',
    preheader: '',
    brand_kit_version_id: brand,
    theme: {
      content_width_px: 600,
      background: '#F7F6F2',
      accent: '#0B625D',
      font_stack: 'Arial, sans-serif',
    },
    sections: [
      {
        id: 'hero',
        type: 'hero',
        heading: 'Your next story starts here',
        text: 'Add the offer, details and approved facts your readers need.',
      },
      { id: 'body', type: 'text', text: 'Write something worth opening.' },
      { id: 'cta', type: 'button', label: 'Explore', href: 'https://example.com' },
      { id: 'footer', type: 'legal_footer', identity: name, address: '', unsubscribe_slot: true },
    ],
  };
}
export function sanitizeRaw(html: string) {
  const clean = sanitizeHtml(html, {
    allowedTags: [
      'html',
      'head',
      'body',
      'title',
      'meta',
      'table',
      'tbody',
      'thead',
      'tr',
      'td',
      'th',
      'p',
      'div',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'br',
      'hr',
      'a',
      'img',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'blockquote',
      'center',
    ],
    allowedAttributes: {
      '*': ['style', 'dir', 'lang', 'align', 'valign', 'width', 'height', 'class', 'id', 'role'],
      a: ['href', 'title'],
      img: ['src', 'alt', 'width', 'height'],
      table: ['cellpadding', 'cellspacing', 'border', 'role'],
      meta: ['name', 'content', 'charset'],
    },
    allowedSchemes: ['https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    allowedSchemesByTag: { img: ['https'] },
    allowedStyles: {
      '*': {
        color: [/^#[\da-f]{3,8}$/i],
        'background-color': [/^#[\da-f]{3,8}$/i],
        'font-size': [/^\d+(px|em|rem|%)$/],
        'font-family': [/^[\w\s,'-]+$/],
        'text-align': [/^(left|right|center)$/],
        padding: [/^[\d\s]+px$/],
        margin: [/^[\d\s]+px$/],
        width: [/^\d+(px|%)$/],
        'max-width': [/^\d+(px|%)$/],
        'line-height': [/^[\d.]+(px|%)?$/],
        border: [/^[\d.]+px solid #[\da-f]{3,8}$/i],
      },
    },
  });
  return {
    html: clean,
    warnings:
      clean !== html
        ? [
            'Active content or unsupported email constructs were removed. VML/conditional-comment fidelity requires review.',
          ]
        : [],
  };
}
export type Finding = {
  code: string;
  severity: 'blocking' | 'warning' | 'info';
  location: string;
  message: string;
};
export function lintEmail(
  spec: EmailSpec,
  forbidden: string[] = [],
  artifact?: { html: string },
): Finding[] {
  return staticLint(spec, forbidden, (source) => sanitizeRaw(source).html, artifact);
}

function block(b: Block, accent: string): ReturnType<typeof h> {
  const props = { key: b.id };
  switch (b.type) {
    case 'hero':
      return h(
        'div',
        props,
        h('h1', { style: { fontSize: 32, lineHeight: 1.2, margin: '0 0 16px' } }, b.heading),
        h('p', {}, b.text),
      );
    case 'text':
      return h('p', { ...props, style: { whiteSpace: 'pre-wrap', lineHeight: 1.6 } }, b.text);
    case 'image':
      return h('img', {
        ...props,
        src: b.src,
        alt: b.decorative ? '' : b.alt,
        width: 600,
        style: { maxWidth: '100%', height: 'auto' },
      });
    case 'button':
      return h(
        'table',
        { ...props, role: 'presentation', cellPadding: 0, cellSpacing: 0 },
        h(
          'tbody',
          {},
          h(
            'tr',
            {},
            h(
              'td',
              { style: { backgroundColor: accent, borderRadius: 8, padding: '14px 24px' } },
              h(
                'a',
                {
                  href: b.href,
                  style: { color: '#ffffff', fontWeight: 700, textDecoration: 'none' },
                },
                b.label,
              ),
            ),
          ),
        ),
      );
    case 'divider':
      return h('hr', {
        ...props,
        style: { border: 0, borderTop: '1px solid #DCE2E0', margin: '24px 0' },
      });
    case 'social':
      return h(
        'p',
        props,
        ...b.links.map((l, i) =>
          h('a', { key: i, href: l.href, style: { marginRight: 12, color: accent } }, l.label),
        ),
      );
    case 'legal_footer':
      return h(
        'div',
        { ...props, style: { fontSize: 12, lineHeight: 1.6, color: '#52656A', marginTop: 32 } },
        h('p', {}, b.identity, h('br'), b.address),
        h(
          'a',
          { href: '{{UNSUBSCRIBE_URL}}', style: { color: '#52656A' } },
          'Unsubscribe / manage preferences',
        ),
      );
    case 'product_card':
      return h(
        'div',
        props,
        h('h2', {}, b.title),
        h('p', {}, b.description),
        h('p', {}, b.price),
        h('a', { href: b.href, style: { color: accent } }, 'View product'),
      );
    case 'custom_html':
      return h('div', { ...props, dangerouslySetInnerHTML: { __html: sanitizeRaw(b.html).html } });
    case 'columns':
      return h(
        'table',
        { ...props, width: '100%', role: 'presentation' },
        h(
          'tbody',
          {},
          h(
            'tr',
            {},
            ...b.columns.map((col, i) =>
              h(
                'td',
                {
                  key: i,
                  width: `${100 / b.columns.length}%`,
                  style: { verticalAlign: 'top', padding: 8 },
                },
                ...col.map((n) => block(n, accent)),
              ),
            ),
          ),
        ),
      );
  }
}
export async function compileEmail(value: EmailSpec) {
  const s = EmailSpecSchema.parse(value);
  const manifest = {
    renderer: 'mailcraft-react-email-1',
    sanitizer: 'allowlist-1',
    schema: s.schema_version,
    brand: s.brand_kit_version_id,
    locale: s.locale,
    mapping: 'html-slots-1',
    spec: s,
  };
  const inner = h(
    'table',
    {
      width: s.theme.content_width_px,
      role: 'presentation',
      style: { maxWidth: '100%', backgroundColor: '#ffffff' },
    },
    h(
      'tbody',
      {},
      h(
        'tr',
        {},
        h('td', { style: { padding: 32 } }, ...s.sections.map((b) => block(b, s.theme.accent))),
      ),
    ),
  );
  const outer = h(
    'table',
    { width: '100%', role: 'presentation', cellPadding: 0, cellSpacing: 0 },
    h(
      'tbody',
      {},
      h('tr', {}, h('td', { align: 'center', style: { padding: '24px 12px' } }, inner)),
    ),
  );
  const document = h(
    'html',
    { lang: s.locale, dir: s.direction },
    h(
      'head',
      {},
      h('meta', { charSet: 'utf-8' }),
      h('meta', { name: 'viewport', content: 'width=device-width,initial-scale=1' }),
      h('title', {}, s.subject),
    ),
    h(
      'body',
      {
        style: {
          margin: 0,
          backgroundColor: s.theme.background,
          fontFamily: s.theme.font_stack,
          color: '#162B30',
        },
      },
      h('div', { style: { display: 'none', maxHeight: 0, overflow: 'hidden' } }, s.preheader),
      outer,
    ),
  );
  const html =
    s.editing_mode === 'raw_html' ? sanitizeRaw(s.raw_html!).html : await render(document);
  const text =
    s.editing_mode === 'raw_html'
      ? sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
      : s.sections
          .flatMap((b) => (b.type === 'columns' ? b.columns.flat() : [b]))
          .map((b) =>
            b.type === 'hero'
              ? b.heading + '\n' + b.text
              : b.type === 'text'
                ? b.text
                : b.type === 'button'
                  ? b.label + ': ' + b.href
                  : b.type === 'legal_footer'
                    ? b.identity + '\n' + b.address + '\nUnsubscribe: {{UNSUBSCRIBE_URL}}'
                    : b.type === 'product_card'
                      ? b.title + '\n' + b.description + '\n' + b.price + '\n' + b.href
                      : b.type === 'image'
                        ? b.alt
                        : b.type === 'custom_html'
                          ? sanitizeHtml(b.html, { allowedTags: [], allowedAttributes: {} })
                          : '',
          )
          .join('\n\n');
  const hash = createHash('sha256')
    .update(JSON.stringify(manifest) + '\n' + html + '\n' + text)
    .digest('hex');
  return { html, text, hash, manifest };
}
