import {z} from 'zod';
import {UTMParameters,UTMLinkError} from './utm';
import {assertEmailUTMTargets} from './email-utm';
import {MAX_RAW_SOURCE_BYTES,rawSourceBytes,validateSourceMetadata} from './email-source-values';
const assetRef=z.object({asset_id:z.uuid(),variant_id:z.uuid()}).strict();

// Browser-safe document shape. Server compiler adds sanitized-render validation.
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
      src: safeHref.optional(),
      asset_ref:assetRef.optional(),
      fallback_ref:assetRef.optional(),
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
const emailShape = {
    schema_version: z.enum(['1.0','1.1']),
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
    tracking: UTMParameters.optional(),
    asset_registry:z.array(assetRef).max(200).optional(),
  };
const documentSchema=z.object(emailShape).strict();
type EmailDocument=z.infer<typeof documentSchema>;
function validateDocument(s:EmailDocument,c:z.RefinementCtx,sourceAdmission=false){
    if(s.schema_version==='1.0'&&s.asset_registry!==undefined)c.addIssue({code:'custom',message:'An asset registry requires explicit schema 1.1',path:['schema_version']});
    let count = 0;
    const ids = new Set<string>();
    for (const b of s.sections) {
      const nodes = b.type === 'columns' ? [b, ...b.columns.flat()] : [b];
      for (const n of nodes) {
        count++;
        if(n.type==='image'){
          if((n.src!==undefined)===(n.asset_ref!==undefined))c.addIssue({code:'custom',message:'Choose exactly one remote URL or immutable asset reference',path:['sections']});
          if(n.fallback_ref&&!n.asset_ref)c.addIssue({code:'custom',message:'A static fallback requires a managed image',path:['sections']});
          if(s.schema_version==='1.0'&&(n.asset_ref||n.fallback_ref))c.addIssue({code:'custom',message:'Managed images require explicit schema 1.1',path:['schema_version']});
          if(n.fallback_ref&&n.fallback_ref.asset_id!==n.asset_ref?.asset_id)c.addIssue({code:'custom',message:'Fallback must belong to the same image',path:['sections']});
        }
        if (ids.has(n.id))
          c.addIssue({ code: 'custom', message: 'Duplicate node ID', path: ['sections'] });
        ids.add(n.id);
      }
    }
    if (count > 200)
      c.addIssue({ code: 'custom', message: 'Maximum 200 nodes', path: ['sections'] });
    if (s.editing_mode === 'raw_html' && (sourceAdmission?s.raw_html===undefined:!s.raw_html))
      c.addIssue({ code: 'custom', message: 'Raw HTML required', path: ['raw_html'] });
    if((!sourceAdmission||s.editing_mode!=='raw_html')&&s.tracking&&UTMParameters.safeParse(s.tracking).success&&(s.editing_mode!=='raw_html'||!!s.raw_html)){try{assertEmailUTMTargets(s,{skipOpaque:sourceAdmission});}catch(error){if(error instanceof UTMLinkError)c.addIssue({code:'custom',message:error.message,path:['tracking']});else throw error;}}
    if (JSON.stringify(s).length > 1048576 && s.editing_mode === 'structured')
      c.addIssue({ code: 'custom', message: 'Maximum 1 MiB structured document' });
  }
export const EmailSpecSchema=documentSchema.superRefine((s,c)=>validateDocument(s,c));
// Saving source validates the same document structure while retaining inert raw
// bytes. Delivery target validation belongs to the separately derived projection.
export const EmailSourceSpecSchema=z.object({...emailShape,raw_html:z.string().max(MAX_RAW_SOURCE_BYTES).optional()}).strict().superRefine((s,c)=>{
  validateDocument(s,c,true);
  try{if(s.raw_html!==undefined)rawSourceBytes(s.raw_html);validateSourceMetadata(s);}
  catch(error){c.addIssue({code:'custom',message:error instanceof Error?error.message:'Invalid exact source values',path:['raw_html']});}
});
export type EmailSpec = z.infer<typeof EmailSpecSchema>;
