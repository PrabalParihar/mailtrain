import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ApiError} from '../src/ui/api';
import {
  snapshotHubSpotSettings, hubspotSettingsDigest, sameHubSpotSettings,
  requestHubSpotReview, hubspotArtifactRequest, hubspotErrorMessage,
} from '../src/ui/hubspot-preparation';

const fixture=()=>({
  company_name:'  Café 東京 📨  ', company_street_address_1:' 123 Main Road ',
  company_street_address_2:'', company_city:'Montréal', company_state:'QC',
  company_zip:'0', company_country:'Canada',
});
const scope={workspace:'workspace-fixture',actor:'actor-fixture'};
const revision='00000000-0000-4000-8000-000000000001';

test('snapshot retains exact seven values, rejects extras and cannot be changed by its caller',()=>{
  const input=fixture(),snapshot=snapshotHubSpotSettings(input);
  assert.deepEqual(snapshot,input);assert.notEqual(snapshot,input);
  input.company_name='Changed';assert.equal(snapshot.company_name,'  Café 東京 📨  ');
  assert.throws(()=>{(snapshot as {company_city:string}).company_city='Changed';},TypeError);
  assert.equal(snapshot.company_city,'Montréal');
  assert.throws(()=>snapshotHubSpotSettings({...fixture(),extra:'private'}),/^Error: HUBSPOT_SETTINGS_INVALID$/);
  const incomplete:Partial<ReturnType<typeof fixture>>=fixture();delete incomplete.company_country;
  assert.throws(()=>snapshotHubSpotSettings(incomplete),/^Error: HUBSPOT_SETTINGS_INVALID$/);
});

test('browser SHA binds exact UTF-8 ordered values including whitespace, optional empties and zero',async()=>{
  const input=fixture();
  const ordered='["hubspot-footer-comparison-1","  Café 東京 📨  "," 123 Main Road ","","Montréal","QC","0","Canada"]';
  assert.equal(await hubspotSettingsDigest(input),createHash('sha256').update(ordered,'utf8').digest('hex'));
  assert.equal(await hubspotSettingsDigest(Object.fromEntries(Object.entries(input).reverse())),await hubspotSettingsDigest(input));
  for(const change of [{company_name:input.company_name.trim()},{company_street_address_2:'Unit 1'},{company_zip:''},{company_city:'Montre\u0301al'},{company_country:' canada '}]){
    const changed={...input,...change};
    assert.notEqual(await hubspotSettingsDigest(changed),await hubspotSettingsDigest(input));
    assert.equal(sameHubSpotSettings(input,changed),false);
  }
  assert.equal(sameHubSpotSettings(input,{...input}),true);
  const pending=hubspotSettingsDigest(input);input.company_name='Changed after capture';
  assert.equal(await pending,createHash('sha256').update(ordered,'utf8').digest('hex'));
});

test('invalid control/delimiter/surrogate/blank/oversized values are refused with a fixed private-safe code',async()=>{
  for(const value of ['',' ','a\u0000b','a\nb','a\u0085b','a\ud800b','{{ account }}','x'.repeat(501)]){
    const input={...fixture(),company_name:value};
    assert.throws(()=>snapshotHubSpotSettings(input),/^Error: HUBSPOT_SETTINGS_INVALID$/);
    await assert.rejects(()=>hubspotSettingsDigest(input),/^Error: HUBSPOT_SETTINGS_INVALID$/);
  }
  for(const value of [' ','\t',null,0])assert.throws(()=>snapshotHubSpotSettings({...fixture(),company_zip:value}),/^Error: HUBSPOT_SETTINGS_INVALID$/);
});

test('review uses a body-only POST and ephemeral key without reading or writing browser storage',async()=>{
  const input=fixture(),controller=new AbortController();
  const previousFetch=globalThis.fetch;
  const storageDescriptors=['localStorage','sessionStorage'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
  let storageTouches=0;
  for(const [key] of storageDescriptors)Object.defineProperty(globalThis,key,{configurable:true,get(){storageTouches++;throw Error('Storage must not be touched');}});
  let calls=0;
  globalThis.fetch=async(url,init)=>{
    calls++;assert.equal(url,'/v1/email-revisions/'+revision+'/hubspot-review');
    assert.equal(init?.method,'POST');assert.deepEqual(JSON.parse(init?.body as string),{settings:input});
    const headers=new Headers(init?.headers);assert.equal(headers.get('Content-Type'),'application/json');
    assert.equal(headers.get('X-Workspace-Id'),scope.workspace);assert.equal(headers.get('X-Actor-Id'),scope.actor);
    assert.match(headers.get('Idempotency-Key')??'',/^[a-f0-9-]{36}$/);assert.equal(init?.signal,controller.signal);
    return Response.json({review:{settings_origin:'locally_declared'}});
  };
  try{
    assert.deepEqual(await requestHubSpotReview(scope,revision,input,controller.signal),{review:{settings_origin:'locally_declared'}});
    assert.equal(calls,1);assert.equal(storageTouches,0);
    await assert.rejects(()=>requestHubSpotReview(scope,revision,{...input,extra:'private'},controller.signal),/^Error: HUBSPOT_SETTINGS_INVALID$/);
    assert.equal(calls,1);assert.equal(storageTouches,0);
  }finally{
    globalThis.fetch=previousFetch;
    for(const [key,descriptor] of storageDescriptors){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
  }
});

test('artifact request sends reviewed values, format and expected hash only in strict JSON body',()=>{
  const controller=new AbortController(),hash='a'.repeat(64);
  for(const format of ['html','txt'] as const){
    const input=fixture();
    const request=hubspotArtifactRequest(scope,revision,input,format,hash,controller.signal);
    assert.equal(request.url,'/v1/email-revisions/'+revision+'/hubspot-artifact');
    assert.equal(request.init.method,'POST');assert.equal(request.init.signal,controller.signal);
    assert.deepEqual(JSON.parse(request.init.body as string),{settings:input,format,expected_destination_hash:hash});
    const headers=new Headers(request.init.headers);
    assert.equal(headers.get('Content-Type'),'application/json');assert.equal(headers.get('X-Workspace-Id'),scope.workspace);assert.equal(headers.get('X-Actor-Id'),scope.actor);
    input.company_name='Caller edit';assert.notEqual(JSON.parse(request.init.body as string).settings.company_name,input.company_name);
  }
  assert.throws(()=>hubspotArtifactRequest(scope,revision,fixture(),'html','bad',controller.signal));
});

test('mismatch recovery uses fixed code copy and never reflects raw server error text',()=>{
  const message=hubspotErrorMessage(new ApiError('HUBSPOT_FOOTER_MISMATCH','private raw account value',409));
  assert.match(message,/saved footer remains unchanged/i);assert.match(message,/matching values/i);
  assert.doesNotMatch(message,/private raw/);
  assert.doesNotMatch(hubspotErrorMessage(new ApiError('UNKNOWN','private raw value',500)),/private raw/);
  assert.doesNotMatch(hubspotErrorMessage(Error('private raw value')),/private raw/);
});

// Actual panel SSR semantics; this is not a substitute for Task 5 mounted tests.
test('HubSpot panel exposes all explicit fields and keeps inputs and destination editable during review',async()=>{
  const {createElement}=await import('react');
  const {renderToStaticMarkup}=await import('react-dom/server');
  const {load}=await import('cheerio');
  const {DestinationExportPanel}=await import('../src/ui/klaviyo-export');
  const props={destination:'hubspot',onDestination:()=>{},canEdit:true,blocked:true,review:null,onReview:()=>{},onDownload:()=>{},hubspotSettings:fixture(),onHubSpotSettings:()=>{}};
  const html=renderToStaticMarkup(createElement(DestinationExportPanel,props as unknown as Parameters<typeof DestinationExportPanel>[0]));
  const $=load(html);
  assert.equal($('section[aria-label="HubSpot preparation"]').length,1);
  assert.equal($('option[value="hubspot"]').text(),'HubSpot coded HTML template');
  assert.equal($('input[type="text"]').length,7);
  for(const label of ['HubSpot company name','HubSpot street address 1','HubSpot street address 2','HubSpot city','HubSpot state','HubSpot ZIP','HubSpot country'])assert.equal($('label').filter((_,element)=>$(element).text().trim()===label).length,1,label);
  assert.equal($('input[required]').length,4);assert.equal($('input[disabled]').length,0);assert.equal($('select[disabled]').length,0);
  assert.equal($('button').text(),'Review HubSpot preparation');assert.equal($('button[disabled]').length,1);
  assert.equal($('input').first().attr('value'),'  Café 東京 📨  ');
  assert.match($('section').text(),/locally declared/i);assert.match($('section').text(),/account settings access has not been verified/i);
  assert.match($('section').text(),/saved footer remains unchanged/i);assert.match($('section').text(),/comma/i);
  const viewer=load(renderToStaticMarkup(createElement(DestinationExportPanel,{...props,canEdit:false} as unknown as Parameters<typeof DestinationExportPanel>[0])));
  assert.equal(viewer('input[disabled]').length,7);assert.equal(viewer('button').length,0);
  assert.match(viewer('section').text(),/account settings access has not been verified/i);
});
