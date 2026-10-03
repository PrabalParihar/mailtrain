import {
  HUBSPOT_COMPARISON_VERSION, HUBSPOT_FOOTER_FIELDS, HUBSPOT_FOOTER_MESSAGES,
  HubSpotFooterSettings, HubSpotArtifactInput, type HubSpotFooterSettingsData,
} from '../domain/hubspot-footer-contracts';
import {api,ApiError} from './api';

export function snapshotHubSpotSettings(value:unknown):Readonly<HubSpotFooterSettingsData> {
  const result=HubSpotFooterSettings.safeParse(value);
  if(!result.success)throw Error('HUBSPOT_SETTINGS_INVALID');
  return Object.freeze(result.data);
}

export async function hubspotSettingsDigest(value:unknown):Promise<string> {
  const settings=snapshotHubSpotSettings(value);
  const bytes=new TextEncoder().encode(JSON.stringify([
    HUBSPOT_COMPARISON_VERSION,...HUBSPOT_FOOTER_FIELDS.map(field=>settings[field]),
  ]));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))
    .map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

export function sameHubSpotSettings(a:Readonly<HubSpotFooterSettingsData>,b:Readonly<HubSpotFooterSettingsData>):boolean {
  return HUBSPOT_FOOTER_FIELDS.every(field=>a[field]===b[field]);
}

export async function requestHubSpotReview(
  scope:{workspace:string;actor:string},revision:string,settings:unknown,signal:AbortSignal,
):Promise<{review:unknown}> {
  const snapshot=snapshotHubSpotSettings(settings);
  // The explicit ephemeral key bypasses api's persisted command identity path.
  return api(scope.workspace,'email-revisions/'+revision+'/hubspot-review','POST',
    {settings:snapshot},undefined,crypto.randomUUID(),signal,scope.actor);
}

export function hubspotArtifactRequest(
  scope:{workspace:string;actor:string},revision:string,settings:unknown,format:'html'|'txt',
  expectedHash:string,signal:AbortSignal,
):{url:string;init:RequestInit} {
  const snapshot=snapshotHubSpotSettings(settings);
  const body=HubSpotArtifactInput.parse({settings:snapshot,format,expected_destination_hash:expectedHash});
  return {url:'/v1/email-revisions/'+revision+'/hubspot-artifact',init:{
    method:'POST',signal,headers:{'Content-Type':'application/json','X-Workspace-Id':scope.workspace,'X-Actor-Id':scope.actor},
    body:JSON.stringify(body),
  }};
}

const messages:Readonly<Record<string,string>>={
  ...HUBSPOT_FOOTER_MESSAGES,
  HUBSPOT_REVIEW_CHANGED:'These settings or the reviewed destination changed. Review HubSpot preparation again.',
  EXPORT_STATIC_BLOCKED:'Blocking static content checks need correction. Use Review and check to inspect the frozen findings.',
  EXPORT_SOURCE_LIMIT:'The frozen source exceeds the bounded destination preparation budget.',
  EXPORT_SOURCE_INTEGRITY:'This frozen artifact does not match its compiler/source. Freeze and review a current revision; the original remains preserved.',
  EXPORT_SOURCE_UNSUPPORTED:'This mapping supports structured blocks. Raw or custom HTML is preserved; use its original source download until destination fidelity is qualified.',
  EXPORT_ASSET_UNPUBLISHED:'Private or registered images cannot be mapped to this destination until public immutable asset delivery is qualified. Your original images remain unchanged.',
  EXPORT_FOOTER_REQUIRED:'Add the sender identity and postal address in a legal footer before preparing this destination.',
  EXPORT_TOKEN_UNSUPPORTED:'Unresolved or unsupported template syntax requires an explicit destination mapping. The original content is preserved.',
};
export function hubspotErrorMessage(error:unknown):string {
  const code=error instanceof ApiError?error.code:error instanceof Error&&error.message==='HUBSPOT_SETTINGS_INVALID'?error.message:'';
  return Object.hasOwn(messages,code)?messages[code]:'HubSpot preparation could not be verified. Review the current version again.';
}
