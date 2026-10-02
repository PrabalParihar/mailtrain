import{privateAssetBinding,type AssetManifest}from'./assets';
import{ToneRules,toneFindings,type ToneRuleData}from'./voice-guard';
import { load } from 'cheerio';
import { z } from 'zod';
import type { EmailSpec, Finding } from './email';
// A safety-rule change creates a new version even when compilation bytes are unchanged.
export const LINT_RULES_VERSION = 'static-assets-4';
export const RAW_LINT_RULES_VERSION = 'static-source-5';
export const HTML_WARNING_BYTES = 100 * 1024;
function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
export function contrastRatio(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function supportedLink(value: string, image = false) {
  if (!image && value === '{{UNSUBSCRIBE_URL}}') return true;
  try {
    const u = new URL(value);
    if (u.username || u.password) return false;
    if (image) return u.protocol === 'https:';
    if (u.protocol === 'https:') return true;
    if (u.protocol === 'mailto:') {
      if (u.hash) return false;
      // Deliberately bounded single-mailbox syntax; headers must not inject new lines.
      const mailbox = decodeURIComponent(u.pathname);
      return (
        z.email().safeParse(mailbox).success &&
        ![...u.searchParams.entries()].some(([key, value]) => /[\r\n\0]/.test(key + value))
      );
    }
    if (u.protocol === 'tel:') {
      const number = decodeURIComponent(u.pathname);
      return (
        /^\+?[0-9][0-9(). -]*[0-9]$/.test(number) &&
        !u.search &&
        !u.hash &&
        number.replace(/\D/g, '').length <= 15
      );
    }
    return false;
  } catch {
    return false;
  }
}
export function staticLint(
  spec: EmailSpec,
  forbidden: string[],
  sanitize: (source: string) => string,
  artifact?: { html: string;assets?:AssetManifest },
  toneRules?:ToneRuleData,
): Finding[] {
  const findings: Finding[] = [],configuredTone=ToneRules.parse(toneRules??{});
  const add = (code: string, severity: Finding['severity'], location: string, message: string) =>
    findings.push({ code, severity, location, message });
  const measured=(ref:{asset_id:string;variant_id:string},location:string)=>{const entry=artifact?.assets?.entries.find(e=>e.asset_id===ref.asset_id&&e.variant_id===ref.variant_id);if(!entry){add('ASSET_EVIDENCE_MISSING','blocking',location,'Image evidence is missing from this frozen revision.');return;}if(entry.bytes>200*1024)add('IMAGE_WEIGHT_ADVISORY','warning',location,`Measured immutable image is ${entry.bytes} bytes, above the proposed 200 KiB advisory.`);if(entry.role==='animation'&&!entry.fallback)add('ASSET_FALLBACK_REQUIRED','blocking',location,'Choose an immutable static fallback.');add('ASSET_PRIVATE_DELIVERY_UNAVAILABLE','warning',location,'Private preview and ZIP bundle are available. Public image delivery is not configured.');};
  const forbiddenCopy = (text: string, location: string) => {
    const content = text.toLowerCase();
    for (const phrase of forbidden.filter((p) => p.trim()))
      if (content.includes(phrase.toLowerCase()))
        add('VOICE_FORBIDDEN', 'blocking', location, `Brand rule prohibits “${phrase}”.`);
  };
  const voice = (text: string, location: string) => {
    findings.push(...toneFindings(text,location,configuredTone));
    forbiddenCopy(text,location);
  };
  const fields = (values:Record<string,string>,location:string) => {
    for(const [name,text]of Object.entries(values))findings.push(...toneFindings(text,location+'/'+name,configuredTone));
    // Keep existing node-level literal blockers and their locations unchanged.
    forbiddenCopy(Object.values(values).join('\n'),location);
  };
  const link = (href: string | undefined, location: string, image = false) => {
    if (!href?.trim())
      add(
        image ? 'IMAGE_SOURCE_REQUIRED' : 'LINK_DESTINATION_REQUIRED',
        'blocking',
        location,
        image ? 'Provide an HTTPS image source.' : 'Provide a link destination.',
      );
    else if (!supportedLink(href, image))
      add(
        image ? 'UNSAFE_IMAGE_URL' : 'UNSAFE_LINK',
        'blocking',
        location,
        image
          ? 'Images require HTTPS without credentials.'
          : 'Use HTTPS, mailto, tel or the explicit unsubscribe slot; unsafe/unsupported destinations must be replaced.',
      );
    else if (!image && href === 'https://example.com')
      add('CTA_PLACEHOLDER', 'blocking', location, 'Replace the placeholder CTA.');
  };
  const contrast = (a: string, b: string, location: string) => {
    const ratio = contrastRatio(a, b);
    if (ratio < 4.5)
      add(
        'LOW_CONTRAST',
        'warning',
        location,
        `Normal text contrast ${ratio.toFixed(2)}:1 is below the proposed 4.5:1 warning threshold. Verify actual client appearance.`,
      );
  };
  const html = (source: string, location: string) => {
    const $ = load(source);
    const emitted = load(sanitize(source));
    emitted('head,title,meta,script,style').remove();
    forbiddenCopy(emitted.root().text(), location);
    // Only rendered block/line breaks delimit sentences. Inline formatting
    // retains the original text adjacency, including deliberate split words.
    emitted('br,hr').replaceWith('\n');
    emitted('p,div,h1,h2,h3,h4,h5,h6,li,ul,ol,table,thead,tbody,tfoot,tr,td,th,caption,blockquote,pre,address').before('\n').after('\n');
    findings.push(...toneFindings(emitted.root().text(),location,configuredTone));
    emitted('img').each((i, el) =>
      voice(emitted(el).attr('alt') ?? '', `${location}/image[${i + 1}]`),
    );
    $('a').each((i, el) => link($(el).attr('href'), `${location}/link[${i + 1}]`));
    $('img').each((i, el) => {
      const loc = `${location}/image[${i + 1}]`,
        image = $(el);
      link(image.attr('src'), loc, true);
      if (
        !image.attr('alt')?.trim() &&
        !(image.attr('alt') === '' && image.attr('role') === 'presentation')
      )
        add(
          'ALT_REQUIRED',
          'blocking',
          loc,
          'Provide alt text or explicit empty alt with presentation role.',
        );
      const binding=artifact?.assets?.entries.find(e=>privateAssetBinding(e)===image.attr('src'));
      if(binding)measured(binding,loc);else add(
        'ASSET_NOT_SNAPSHOTTED',
        'warning',
        loc,
        'External image is not an immutable published asset.',
      );
    });
    add(
      'RAW_CONTRAST_REVIEW',
      'info',
      location,
      'Opaque HTML color/cascade contrast needs client review; structured token checks do not cover this markup.',
    );
  };
  if (!spec.subject.trim()) add('SUBJECT_REQUIRED', 'blocking', 'subject', 'Add a subject.');
  if (!spec.preheader.trim())
    add('PREHEADER_EMPTY', 'warning', 'preheader', 'Add a useful preheader.');
  if (spec.subject.length > 70)
    add('SUBJECT_LENGTH', 'warning', 'subject', 'Long subject may be truncated.');
  if (spec.preheader.length > 150)
    add(
      'PREHEADER_LENGTH',
      'warning',
      'preheader',
      'Long preheader may be truncated;150 characters is a proposed warning threshold.',
    );
  voice(spec.subject, 'subject');
  voice(spec.preheader, 'preheader');
  if (/[!]{3,}/.test(spec.subject) || /\b(?:buy now|act now|guaranteed)\b/i.test(spec.subject))
    add(
      'SPAM_ADVISORY',
      'info',
      'subject',
      'Promotional wording or repeated punctuation merits review. This heuristic is not a spam score or inbox guarantee.',
    );
  const nodes = spec.sections.flatMap((b) =>
    b.type === 'columns' ? [b, ...b.columns.flat()] : [b],
  );
  if (spec.editing_mode === 'structured') {
    if (!nodes.some((b) => b.type === 'legal_footer'))
      add(
        'FOOTER_REQUIRED',
        'blocking',
        'sections',
        'A sender identity, address and unsubscribe footer are required.',
      );
    for (const b of nodes) {
      switch (b.type) {
        case 'hero':
          fields({heading:b.heading,text:b.text},b.id);
          break;
        case 'text':
          voice(b.text, b.id);
          break;
        case 'legal_footer':
          fields({identity:b.identity,address:b.address},b.id);
          if (!b.identity.trim() || !b.address.trim())
            add(
              'SENDER_ADDRESS_REQUIRED',
              'blocking',
              b.id,
              'Confirm sender identity and postal address.',
            );
          break;
        case 'image':
          voice(b.decorative ? '' : b.alt, b.id);
          if(b.src)link(b.src, b.id, true);
          if (!b.alt.trim() && !b.decorative)
            add('ALT_REQUIRED', 'blocking', b.id, 'Provide alt text or mark decorative.');
          if(b.asset_ref)measured(b.asset_ref,b.id);else add(
            'ASSET_NOT_SNAPSHOTTED',
            'warning',
            b.id,
            'External image is not an immutable published asset.',
          );
          break;
        case 'button':
          voice(b.label, b.id);
          link(b.href, b.id);
          contrast('#ffffff', spec.theme.accent, b.id);
          break;
        case 'product_card':
          fields({title:b.title,description:b.description,price:b.price},b.id);
          link(b.href, b.id);
          contrast(spec.theme.accent, '#ffffff', b.id);
          break;
        case 'social':
          b.links.forEach((l, i) => {
            voice(l.label, `${b.id}/link[${i + 1}]`);
            link(l.href, `${b.id}/link[${i + 1}]`);
            contrast(spec.theme.accent, '#ffffff', `${b.id}/link[${i + 1}]`);
          });
          break;
        case 'custom_html':
          html(b.html, b.id);
          break;
      }
    }
  } else {
    html(spec.raw_html ?? '', 'raw_html');
    const emitted = load(sanitize(spec.raw_html ?? ''));
    const usableUnsubscribe = emitted('a')
      .toArray()
      .some((el) => {
        const anchor = emitted(el);
        const imageNames = anchor
          .find('img')
          .toArray()
          .filter((img) => img.attribs.role !== 'presentation')
          .map((img) => emitted(img).attr('alt') ?? '')
          .join(' ');
        return el.attribs.href === '{{UNSUBSCRIBE_URL}}' && !!(anchor.text() + imageNames).trim();
      });
    if (!usableUnsubscribe)
      add(
        'UNSUBSCRIBE_REQUIRED',
        'blocking',
        'raw_html',
        'Include the explicit {{UNSUBSCRIBE_URL}} slot.',
      );
    add(
      'RAW_REVIEW',
      'warning',
      'raw_html',
      'Review raw HTML sender identity/address, legal footer, VML and conversion limits manually.',
    );
  }
  if (artifact) {
    const bytes = Buffer.byteLength(artifact.html, 'utf8');
    if (bytes > HTML_WARNING_BYTES)
      add(
        'HTML_WEIGHT',
        'warning',
        'artifact.html',
        `Frozen HTML is ${bytes} UTF8 bytes, above the proposed ${HTML_WARNING_BYTES}-byte warning threshold. Clipping behavior depends on the destination/client.`,
      );
  } else
    add(
      'HTML_WEIGHT_UNAVAILABLE',
      'info',
      'artifact.html',
      'Exact frozen HTML byte measurement is unavailable.',
    );
  const parsedArtifact=artifact?load(artifact.html):null,imageSources=parsedArtifact?parsedArtifact('img').map((_,img)=>parsedArtifact(img).attr('src')??'').get():[],knownBindings=new Set(artifact?.assets?.entries.map(privateAssetBinding)??[]),allImagesMeasured=imageSources.length>0&&imageSources.every(src=>knownBindings.has(src));
  if (!allImagesMeasured&&(
    (spec.editing_mode === 'structured' &&
      nodes.some((b) => b.type === 'image' || b.type === 'custom_html')) ||
    spec.editing_mode === 'raw_html'
  ))
    add(
      'IMAGE_WEIGHT_UNAVAILABLE',
      'info',
      'assets',
      knownBindings.size?'Some image bytes/dimensions remain unavailable; verified private variants are recorded separately and no remote image was fetched.':'Image bytes/dimensions have not been measured from immutable assets; no remote image was fetched.',
    );
  add(
    'LINK_CHECK_UNAVAILABLE',
    'info',
    'links',
    'Network link validation has not run; static URL checks do not prove destination availability.',
  );
  add(
    'DARK_MODE_UNAVAILABLE',
    'info',
    'clients',
    'Client dark-mode appearance is unverified; static color checks are not real-client captures.',
  );
  if (findings.length > 500) {
    const priority = { blocking: 0, warning: 1, info: 2 };
    findings.sort((a, b) => priority[a.severity] - priority[b.severity]);
    const omitted = findings.length - 500;
    return [
      ...findings.slice(0, 500),
      {
        code: 'FINDINGS_TRUNCATED',
        severity: 'info',
        location: 'report',
        message: `${omitted} additional findings omitted. Blocking findings take precedence; simplify and rerun for complete detail.`,
      },
    ];
  }
  return findings;
}
