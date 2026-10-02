import {UTMParameters,UTM_POLICY_VERSION,UTMLinkError,decorateMarketingHref,type UTMParameterData}from'./utm';
import {decorateHtmlMarketingLinks,htmlMarketingTargets}from'./utm-html';
import type{ToneRuleData}from'./voice-guard';
import { createElement as h } from 'react';
import { render } from '@react-email/render';
import sanitizeHtml from 'sanitize-html';
import { createHash } from 'node:crypto';
import { staticLint } from './preflight';
import {load}from'cheerio';
import{privateAssetBinding,AssetManifestSchema,type AssetManifest,type AssetManifestEntry}from'./assets';

import {EmailSpecSchema as SharedEmailSpecSchema,EmailSourceSpecSchema,type EmailSpec,type Block} from './email-schema';
import {projectRawHtml} from './raw-html-projection';
import {projectHtmlFragments} from './html-fragment-projection';
import type {SourceProfile} from './email-source-contracts';
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
  artifact?: { html: string;assets?:AssetManifest },
  toneRules?:ToneRuleData,
): Finding[] {
  return staticLint(spec, forbidden, (source) => sanitizeRaw(source).html, artifact,toneRules);
}

function block(b: Block, accent: string, assets:AssetManifestEntry[],fragments?:ReadonlyMap<string,string>): ReturnType<typeof h> {
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
        src: b.asset_ref?privateAssetBinding(resolveImage(b.asset_ref,assets)):b.src,
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
      return h('div', { ...props, dangerouslySetInnerHTML: { __html: fragments?.get(b.id)??sanitizeRaw(b.html).html } });
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
                ...col.map((n) => block(n, accent,assets,fragments)),
              ),
            ),
          ),
        ),
      );
  }
}
function trackedContent(s:{editing_mode:'structured'|'raw_html';sections:Block[];raw_html?:string;tracking?:UTMParameterData},skipOpaque=false){
 if(!s.tracking)return s;
 const policy=s.tracking;
 function html(source:string){decorateHtmlMarketingLinks(source,policy);return decorateHtmlMarketingLinks(sanitizeRaw(source).html,policy);}
 function simple(b:Exclude<Block,{type:'columns'}>):Exclude<Block,{type:'columns'}>{
  if(b.type==='button'||b.type==='product_card')return{...b,href:decorateMarketingHref(b.href,policy)};
  if(b.type==='social')return{...b,links:b.links.map(link=>({...link,href:decorateMarketingHref(link.href,policy)}))};
  if(b.type==='custom_html'&&!skipOpaque)return{...b,html:html(b.html)};
  return b;
 }
 if(s.editing_mode==='raw_html')return{...s,raw_html:html(s.raw_html!)};
 return{...s,sections:s.sections.map(b=>b.type==='columns'?{...b,columns:b.columns.map(col=>col.map(simple))}:simple(b))};
}
function trackedHtmlText(html:string){return sanitizeHtml(html,{allowedTags:[],allowedAttributes:{}})+'\n'+htmlMarketingTargets(html).join('\n');}
function resolveImage(ref:{asset_id:string;variant_id:string},entries:AssetManifestEntry[]){const entry=entries.find(e=>e.asset_id===ref.asset_id&&e.variant_id===ref.variant_id);if(!entry)throw new Error('ASSET_REFERENCE_UNRESOLVED');return entry;}
export async function compileEmail(value: EmailSpec, options:{assets?:AssetManifest;sourceProfile?:SourceProfile|null}={}) {
  const hasFragments=value.sections.some(b=>b.type==='custom_html'||b.type==='columns'&&b.columns.flat().some(n=>n.type==='custom_html'));
  const s = value.editing_mode==='raw_html'||hasFragments?EmailSourceSpecSchema.parse(value):EmailSpecSchema.parse(value);
  const nodes=s.sections.flatMap(b=>b.type==='columns'?b.columns.flat():[b]);
  const refs=[...nodes.flatMap(b=>b.type==='image'&&b.asset_ref?[b.asset_ref,...(b.fallback_ref?[b.fallback_ref]:[])]:[]),...(s.asset_registry??[])];
  if(refs.length&&!options.assets)throw new Error('ASSET_MANIFEST_REQUIRED');
  if(options.assets)AssetManifestSchema.parse(options.assets);
  const entries=options.assets?.entries??[];
  if(new Set(entries.map(e=>e.asset_id+':'+e.variant_id)).size!==entries.length)throw new Error('ASSET_MANIFEST_DUPLICATE');
  for(const ref of refs)resolveImage(ref,entries);
  for(const node of nodes){if(node.type!=='image'||!node.asset_ref)continue;const entry=resolveImage(node.asset_ref,entries);if(entry.role==='animation'){if(!node.fallback_ref||!entry.fallback||node.fallback_ref.asset_id!==entry.fallback.asset_id||node.fallback_ref.variant_id!==entry.fallback.variant_id||resolveImage(node.fallback_ref,entries).role!=='fallback')throw new Error('ASSET_FALLBACK_REQUIRED');}else if(node.fallback_ref)throw new Error('ASSET_FALLBACK_INVALID');}
  if(s.editing_mode==='raw_html'){
    const projected=projectRawHtml(s.raw_html!,{assets:options.assets});
    let html=projected.email_html??'',delivery_status=projected.delivery_status;
    const diagnostics=[...projected.diagnostics];
    if(s.tracking&&delivery_status==='eligible_for_checks'){
      try{html=decorateHtmlMarketingLinks(html,s.tracking);}
      catch(error){
        if(!(error instanceof UTMLinkError))throw error;
        delivery_status='blocked';
        const issue={code:'UNSAFE_LINK_REMOVED' as const,severity:'blocking' as const,start:0,end:s.raw_html!.length,message:'Tracking cannot be applied to this source: '+error.message};
        if(diagnostics.length>=100)diagnostics[diagnostics.length-1]=issue;else diagnostics.push(issue);
      }
    }
    const manifest={renderer:'mailcraft-raw-email-2',sanitizer:'raw-email-2',schema:s.schema_version,brand:s.brand_kit_version_id,locale:s.locale,mapping:'html-slots-1',spec:s,...(s.tracking?{link_policy:UTM_POLICY_VERSION}:{}),...(entries.length?{assets:options.assets}:{}),source:{profile:options.sourceProfile??'exact-utf8-1',sha256:projected.source_hash,bytes:projected.source_bytes},raw_projection:{browser_profile:projected.browser_profile,browser_hash:projected.browser_hash,email_profile:projected.email_profile,email_hash:projected.email_html===null?null:createHash('sha256').update(html).digest('hex'),delivery_status,diagnostics,omitted_diagnostics:projected.omitted_diagnostics}};
    const text=projected.email_html===null?'':s.tracking?trackedHtmlText(html):sanitizeHtml(html,{allowedTags:[],allowedAttributes:{}});
    const hash=createHash('sha256').update(JSON.stringify(manifest)+'\n'+html+'\n'+text).digest('hex');
    return {html,text,hash,manifest,preview_html:projected.browser_html};
  }
  const fragments=hasFragments?projectHtmlFragments(nodes.filter(n=>n.type==='custom_html'),{assets:options.assets,tracking:s.tracking}):null;
  const rendered=trackedContent(s,hasFragments);
  const manifest = {
    renderer: fragments?'mailcraft-react-email-fragments-1':s.tracking?'mailcraft-react-email-utm-1':'mailcraft-react-email-1',
    ...(s.tracking?{link_policy:UTM_POLICY_VERSION}:{}),
    sanitizer: fragments?'raw-email-2':'allowlist-1',
    ...(fragments?{fragment_projection:fragments.manifest}:{}),
    schema: s.schema_version,
    brand: s.brand_kit_version_id,
    locale: s.locale,
    mapping: 'html-slots-1',
    spec: s,
    ...(entries.length?{assets:options.assets}:{}),
  };
  function documentFor(fragmentHtml?:ReadonlyMap<string,string>){
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
        h('td', { style: { padding: 32 } }, ...rendered.sections.map((b) => block(b, s.theme.accent,entries,fragmentHtml))),
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
  return document;
  }
  let html = fragments?.manifest.delivery_status==='unavailable'?'':await render(documentFor(fragments?.email));
  let preview_html=fragments?(fragments.manifest.delivery_status==='unavailable'?null:await render(documentFor(fragments.browser))):undefined;
  if(fragments&&(Buffer.byteLength(html)>4194304||preview_html!==null&&preview_html!==undefined&&Buffer.byteLength(preview_html)>4194304)){
    fragments.manifest.delivery_status='unavailable';fragments.manifest.diagnostics=[{code:'RAW_PROJECTION_LIMIT',severity:'blocking',start:0,end:0,message:'The document projection exceeds its output limit; exact fragments remain stored.'}];html='';preview_html=null;
  }
  const allowedBindings=new Set(refs.map(ref=>privateAssetBinding(resolveImage(ref,entries))));
  const parsed=load(html);
  parsed('img[src]').each((_,image)=>{const url=parsed(image).attr('src')!;let host:string;try{host=new URL(url).hostname;}catch{return;}if(host==='mailcraft-assets.invalid'&&!allowedBindings.has(url))throw new Error('ASSET_BINDING_UNREGISTERED');});
  const text = fragments?.manifest.delivery_status==='unavailable'?'':rendered.sections
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
                          ? (s.tracking?trackedHtmlText(fragments?.email.get(b.id)??b.html):sanitizeHtml(fragments?.email.get(b.id)??b.html, { allowedTags: [], allowedAttributes: {} }))
                          : b.type==='social'&&s.tracking?b.links.map(link=>link.label+': '+link.href).join('\n'):'',
          )
          .join('\n\n');
  if(fragments){fragments.manifest.email_hash=html?createHash('sha256').update(html).digest('hex'):null;fragments.manifest.browser_hash=preview_html===null||preview_html===undefined?null:createHash('sha256').update(preview_html).digest('hex');}
  const hash = createHash('sha256')
    .update(JSON.stringify(manifest) + '\n' + html + '\n' + text)
    .digest('hex');
  return { html, text, hash, manifest,...(fragments?{preview_html}: {}) };
}
