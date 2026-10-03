import {z} from 'zod';

export const HUBSPOT_MAPPING_VERSION='hubspot-coded-footer-1' as const;
export const HUBSPOT_COMPARISON_VERSION='hubspot-footer-comparison-1' as const;
export const HUBSPOT_SOURCE_LIMIT=2*1024*1024;

export const HUBSPOT_FOOTER_FIELDS=[
  'company_name',
  'company_street_address_1',
  'company_street_address_2',
  'company_city',
  'company_state',
  'company_zip',
  'company_country',
] as const;

const authoredDelimiters=/\{\{|\}\}|\{%|%\}|\{#|#\}|\*\||\|\*|\[\[|\]\]|\[%|%\]/;
function wellFormedText(value:string):boolean {
  if(/[\u0000-\u001f\u007f-\u009f]/.test(value)||authoredDelimiters.test(value))return false;
  for(let index=0;index<value.length;index++){
    const unit=value.charCodeAt(index);
    if(unit>=0xd800&&unit<=0xdbff){
      const next=value.charCodeAt(index+1);
      if(!(next>=0xdc00&&next<=0xdfff))return false;
      index++;
    }else if(unit>=0xdc00&&unit<=0xdfff)return false;
  }
  return true;
}

const field=(max:number,required:boolean)=>z.string().max(max).refine(value=>wellFormedText(value),'Invalid footer text').refine(
  value=>required?value.trim().length>0:value===''||value.trim().length>0,
  required?'A value is required':'Use an empty value or nonblank text',
);
const footerSettingsShape={
  company_name:field(500,true),
  company_street_address_1:field(200,true),
  company_street_address_2:field(200,false),
  company_city:field(200,true),
  company_state:field(200,true),
  company_zip:field(50,false),
  company_country:field(200,false),
};

function composeAddressValues(settings:HubSpotFooterSettingsData):string {
  const locality=settings.company_state+(settings.company_zip?' '+settings.company_zip:'');
  return [settings.company_street_address_1,settings.company_street_address_2,settings.company_city,locality,settings.company_country]
    .filter(value=>value!=='')
    .join(', ');
}

export const HubSpotFooterSettings=z.strictObject(footerSettingsShape).superRefine((settings,context)=>{
  if(composeAddressValues(settings).length>1000)context.addIssue({code:'custom',path:['company_street_address_1'],message:'Composed address exceeds the local limit'});
});
export type HubSpotFooterSettingsData=z.infer<typeof HubSpotFooterSettings>;

function parseSettings(value:unknown):HubSpotFooterSettingsData {
  const result=HubSpotFooterSettings.safeParse(value);
  if(!result.success)throw new Error('HUBSPOT_SETTINGS_INVALID');
  return result.data;
}

export function composeHubSpotAddress(settings:unknown):string {
  return composeAddressValues(parseSettings(settings));
}

const footerPair=z.strictObject({
  identity:field(500,true),
  address:field(1000,true),
});
export function checkHubSpotFooterComparison(
  footers:readonly {identity:string;address:string}[],
  settings:unknown,
):{matches:true;settings_origin:'locally_declared';account_settings_verified:false} {
  const parsedSettings=parseSettings(settings);
  if(!Array.isArray(footers)||footers.length===0||footers.some(footer=>!footerPair.safeParse(footer).success)){
    throw new Error('EXPORT_FOOTER_REQUIRED');
  }
  const address=composeAddressValues(parsedSettings);
  if(footers.some(footer=>footer.identity!==parsedSettings.company_name||footer.address!==address)){
    throw new Error('HUBSPOT_FOOTER_MISMATCH');
  }
  return {matches:true,settings_origin:'locally_declared',account_settings_verified:false};
}

export const HUBSPOT_FOOTER_MESSAGES=Object.freeze({
  HUBSPOT_SETTINGS_INVALID:'Add all required HubSpot account footer values for local comparison. Account settings access has not been verified.',
  HUBSPOT_FOOTER_MISMATCH:'The saved footer company name or address differs from these HubSpot values. The saved footer remains unchanged; use matching values to continue.',
} as const);

const digest=z.string().regex(/^[a-f0-9]{64}$/);
const transformations=z.array(z.string().min(1).max(500).refine(value=>value.trim().length>0)).min(1).max(10);
export const HubSpotReview=z.strictObject({
  destination:z.literal('hubspot'),
  mapping_version:z.literal(HUBSPOT_MAPPING_VERSION),
  comparison_version:z.literal(HUBSPOT_COMPARISON_VERSION),
  revision_id:z.uuid(),
  source_artifact_hash:digest,
  destination_hash:digest,
  html_sha256:digest,
  text_sha256:digest,
  settings_digest:digest,
  settings_origin:z.literal('locally_declared'),
  remote_export_enabled:z.literal(false),
  account_settings_verified:z.literal(false),
  native_conformance_verified:z.literal(false),
  management_link_verified:z.literal(false),
  transformations,
  blockers:z.tuple([
    z.literal('CONNECTION_AUTH_MODE_UNAPPROVED'),
    z.literal('HUBSPOT_ACCOUNT_SETTINGS_UNVERIFIED'),
    z.literal('ACCOUNT_ENTITLEMENT_UNVERIFIED'),
    z.literal('REAL_CLIENT_PREFLIGHT_UNAVAILABLE'),
    z.literal('DESTINATION_CONFORMANCE_UNVERIFIED'),
    z.literal('DURABLE_REMOTE_EXPORT_UNAVAILABLE'),
    z.literal('MANAGEMENT_LINK_UNVERIFIED'),
  ]),
});
export type HubSpotReview=z.infer<typeof HubSpotReview>;

export const HubSpotReviewInput=z.strictObject({settings:HubSpotFooterSettings});
export type HubSpotReviewInput=z.infer<typeof HubSpotReviewInput>;

export const HubSpotArtifactInput=z.strictObject({
  settings:HubSpotFooterSettings,
  format:z.enum(['html','txt']),
  expected_destination_hash:digest,
});
export type HubSpotArtifactInput=z.infer<typeof HubSpotArtifactInput>;
