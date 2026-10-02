import {UTMParameters,UTM_POLICY_VERSION,UTMLinkError,decorateMarketingHref,type UTMParameterData}from'./utm';
import {decorateHtmlMarketingLinks,htmlMarketingTargets}from'./utm-html';
import type{ToneRuleData}from'./voice-guard';
import { createElement as h } from 'react';
import { render } from '@react-email/render';
import sanitizeHtml from 'sanitize-html';
import { createHash } from 'node:crypto';
import { staticLint } from './preflight';

import {EmailSpecSchema as SharedEmailSpecSchema,type EmailSpec,type Block} from './email-schema';
export {BlockSchema,LOCALES} from './email-schema';
export type {EmailSpec,Block} from './email-schema';
export const EmailSpecSchema=SharedEmailSpecSchema.superRefine((s,c)=>{
 if(s.tracking&&UTMParameters.safeParse(s.tracking).success&&(s.editing_mode!=='raw_html'||!!s.raw_html)){
  try{trackedContent(s);}catch(error){if(error instanceof UTMLinkError)c.addIssue({code:'custom',message:error.message,path:['tracking']});else throw error;}
 }
});
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
  toneRules?:ToneRuleData,
): Finding[] {
  return staticLint(spec, forbidden, (source) => sanitizeRaw(source).html, artifact,toneRules);
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
function trackedContent(s:{editing_mode:'structured'|'raw_html';sections:Block[];raw_html?:string;tracking?:UTMParameterData}){
 if(!s.tracking)return s;
 const policy=s.tracking;
 function html(source:string){decorateHtmlMarketingLinks(source,policy);return decorateHtmlMarketingLinks(sanitizeRaw(source).html,policy);}
 function simple(b:Exclude<Block,{type:'columns'}>):Exclude<Block,{type:'columns'}>{
  if(b.type==='button'||b.type==='product_card')return{...b,href:decorateMarketingHref(b.href,policy)};
  if(b.type==='social')return{...b,links:b.links.map(link=>({...link,href:decorateMarketingHref(link.href,policy)}))};
  if(b.type==='custom_html')return{...b,html:html(b.html)};
  return b;
 }
 if(s.editing_mode==='raw_html')return{...s,raw_html:html(s.raw_html!)};
 return{...s,sections:s.sections.map(b=>b.type==='columns'?{...b,columns:b.columns.map(col=>col.map(simple))}:simple(b))};
}
function trackedHtmlText(html:string){return sanitizeHtml(html,{allowedTags:[],allowedAttributes:{}})+'\n'+htmlMarketingTargets(html).join('\n');}
export async function compileEmail(value: EmailSpec) {
  const s = EmailSpecSchema.parse(value);
  const rendered=trackedContent(s);
  const manifest = {
    renderer: s.tracking?'mailcraft-react-email-utm-1':'mailcraft-react-email-1',
    ...(s.tracking?{link_policy:UTM_POLICY_VERSION}:{}),
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
        h('td', { style: { padding: 32 } }, ...rendered.sections.map((b) => block(b, s.theme.accent))),
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
    s.editing_mode === 'raw_html' ? (s.tracking?rendered.raw_html!:sanitizeRaw(s.raw_html!).html) : await render(document);
  const text =
    s.editing_mode === 'raw_html'
      ? (s.tracking?trackedHtmlText(html):sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }))
      : rendered.sections
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
                          ? (s.tracking?trackedHtmlText(b.html):sanitizeHtml(b.html, { allowedTags: [], allowedAttributes: {} }))
                          : b.type==='social'&&s.tracking?b.links.map(link=>link.label+': '+link.href).join('\n'):'',
          )
          .join('\n\n');
  const hash = createHash('sha256')
    .update(JSON.stringify(manifest) + '\n' + html + '\n' + text)
    .digest('hex');
  return { html, text, hash, manifest };
}
