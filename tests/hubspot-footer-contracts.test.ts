import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {blankSpec} from '../src/domain/email';
import {
  HUBSPOT_COMPARISON_VERSION,
  HUBSPOT_FOOTER_FIELDS,
  HUBSPOT_FOOTER_MESSAGES,
  HUBSPOT_MAPPING_VERSION,
  HUBSPOT_SOURCE_LIMIT,
  HubSpotArtifactInput,
  HubSpotFooterSettings,
  HubSpotReview,
  HubSpotReviewInput,
  checkHubSpotFooterComparison,
  composeHubSpotAddress,
} from '../src/domain/hubspot-footer-contracts';

const settings = {
  company_name: 'Fixture Books',
  company_street_address_1: ' 42 Main Street ',
  company_street_address_2: 'Suite 7',
  company_city: 'New York',
  company_state: 'NY',
  company_zip: '10001',
  company_country: 'US',
};
const expectedAddress = ' 42 Main Street , Suite 7, New York, NY 10001, US';
const digest = 'a'.repeat(64);
const reviewInput = {
  destination: 'hubspot',
  mapping_version: HUBSPOT_MAPPING_VERSION,
  comparison_version: HUBSPOT_COMPARISON_VERSION,
  revision_id: randomUUID(),
  source_artifact_hash: digest,
  destination_hash: digest,
  html_sha256: digest,
  text_sha256: digest,
  settings_digest: digest,
  settings_origin: 'locally_declared',
  remote_export_enabled: false,
  account_settings_verified: false,
  native_conformance_verified: false,
  management_link_verified: false,
  transformations: ['Map company name and address to documented HubL settings variables.'],
  blockers: [
    'CONNECTION_AUTH_MODE_UNAPPROVED',
    'HUBSPOT_ACCOUNT_SETTINGS_UNVERIFIED',
    'ACCOUNT_ENTITLEMENT_UNVERIFIED',
    'REAL_CLIENT_PREFLIGHT_UNAVAILABLE',
    'DESTINATION_CONFORMANCE_UNVERIFIED',
    'DURABLE_REMOTE_EXPORT_UNAVAILABLE',
    'MANAGEMENT_LINK_UNVERIFIED',
  ],
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

test('strict settings preserve exact values and compose the documented local address grammar', () => {
  assert.equal(HUBSPOT_MAPPING_VERSION, 'hubspot-coded-footer-1');
  assert.equal(HUBSPOT_COMPARISON_VERSION, 'hubspot-footer-comparison-1');
  assert.equal(HUBSPOT_SOURCE_LIMIT, 2 * 1024 * 1024);
  assert.deepEqual(HUBSPOT_FOOTER_FIELDS, [
    'company_name', 'company_street_address_1', 'company_street_address_2',
    'company_city', 'company_state', 'company_zip', 'company_country',
  ]);
  const parsed = HubSpotFooterSettings.parse(settings);
  assert.deepEqual(parsed, settings);
  assert.equal(composeHubSpotAddress(settings), expectedAddress);
  assert.equal(composeHubSpotAddress({...settings, company_street_address_2: '', company_zip: '', company_country: ''}), ' 42 Main Street , New York, NY');
});

test('settings reject missing, unknown, blank required, whitespace optional, overlong and unsafe authored values', () => {
  assert.equal(HubSpotFooterSettings.safeParse({...settings, unknown: 'extra'}).success, false);
  assert.equal(HubSpotFooterSettings.safeParse({...settings, company_zip: undefined}).success, false);
  for (const field of ['company_name', 'company_street_address_1', 'company_city', 'company_state'] as const) {
    assert.equal(HubSpotFooterSettings.safeParse({...settings, [field]: ' \t\n'}).success, false, field);
  }
  for (const field of ['company_street_address_2', 'company_zip', 'company_country'] as const) {
    assert.equal(HubSpotFooterSettings.safeParse({...settings, [field]: '  '}).success, false, field);
    assert.equal(HubSpotFooterSettings.safeParse({...settings, [field]: ''}).success, true, field);
  }
  for (const [field, value] of [
    ['company_name', 'x'.repeat(501)], ['company_street_address_1', 'x'.repeat(201)],
    ['company_street_address_2', 'x'.repeat(201)], ['company_city', 'x'.repeat(201)],
    ['company_state', 'x'.repeat(201)], ['company_zip', 'x'.repeat(51)], ['company_country', 'x'.repeat(201)],
    ['company_name', 'bad\u0000value'], ['company_city', 'bad\u0085value'],
    ['company_name', 'broken\uD800'], ['company_name', '{{ authored }}'],
    ['company_city', '{% if true %}'], ['company_state', '{# comment #}'],
    ['company_country', '*|MERGE|*'], ['company_zip', '|*merge*|'],
    ['company_street_address_2', '[[foreign]]'], ['company_state', '[% raw %]'],
  ] as const) {
    assert.equal(HubSpotFooterSettings.safeParse({...settings, [field]: value}).success, false, field);
  }
  assert.equal(HubSpotFooterSettings.safeParse({...settings, company_name: 'Books 📚'}).success, true);
});

test('invalid composed-address length is refused without recursively parsing the schema', () => {
  const value = {...settings, company_street_address_1: 's'.repeat(200), company_street_address_2: 'a'.repeat(200), company_city: 'c'.repeat(200), company_state: 't'.repeat(200), company_zip: 'z'.repeat(50), company_country: 'q'.repeat(200)};
  assert.equal(HubSpotFooterSettings.safeParse(value).success, false);
  assert.throws(() => composeHubSpotAddress(value), /^Error: HUBSPOT_SETTINGS_INVALID$/);
});

test('comparison accepts every exact footer and returns only a local unverified receipt', () => {
  const receipt = checkHubSpotFooterComparison([
    {identity: 'Fixture Books', address: expectedAddress},
    {identity: 'Fixture Books', address: expectedAddress},
  ], settings);
  assert.deepEqual(receipt, {matches: true, settings_origin: 'locally_declared', account_settings_verified: false});
  assert.deepEqual(Object.keys(receipt).sort(), ['account_settings_verified', 'matches', 'settings_origin']);
});

test('comparison rejects empty, malformed, unbounded, or any mismatching footer with fixed errors', () => {
  const cases: [unknown, unknown, string][] = [
    [[], settings, 'EXPORT_FOOTER_REQUIRED'],
    [[{identity: 'Fixture Books', address: expectedAddress}, {identity: 'Other Books', address: expectedAddress}], settings, 'HUBSPOT_FOOTER_MISMATCH'],
    [[{identity: 'Fixture Books', address: expectedAddress}, {identity: 'Fixture Books', address: 'Different address'}], settings, 'HUBSPOT_FOOTER_MISMATCH'],
    [[{identity: 'Fixture Books', address: expectedAddress}, {identity: '', address: expectedAddress}], settings, 'EXPORT_FOOTER_REQUIRED'],
    [[{identity: 'Fixture Books', address: expectedAddress, private: 'NO LEAK'}], settings, 'EXPORT_FOOTER_REQUIRED'],
    [[{identity: 'Fixture Books', address: 'a'.repeat(1001)}], settings, 'EXPORT_FOOTER_REQUIRED'],
    [[{identity: 'Fixture Books', address: expectedAddress}], {...settings, company_name: 'PRIVATE VALUE'}, 'HUBSPOT_FOOTER_MISMATCH'],
    [[{identity: 'Fixture Books', address: expectedAddress}], {...settings, private: 'SECRET'}, 'HUBSPOT_SETTINGS_INVALID'],
    [[{identity: 'Fixture Books', address: expectedAddress}], null, 'HUBSPOT_SETTINGS_INVALID'],
  ];
  for (const [footers, suppliedSettings, code] of cases) {
    let thrown: unknown;
    try { checkHubSpotFooterComparison(footers as never, suppliedSettings); } catch (error) { thrown = error; }
    assert.ok(thrown instanceof Error);
    assert.equal(thrown.message, code);
    assert.deepEqual(Object.keys(thrown).sort(), []);
    assert.doesNotMatch(JSON.stringify({message: thrown.message, stack: thrown.stack}), /PRIVATE VALUE|SECRET|NO LEAK|42 Main Street/);
  }
});

test('comparison reads frozen EmailSpec footer values and never mutates the saved source', () => {
  const source = blankSpec('fixture-brand', 'Fixture Books');
  source.sections = source.sections.map(block => block.type === 'legal_footer'
    ? {...block, address: '42 Main Street, Suite 7, New York, NY 10001, US'}
    : block);
  const frozenSource = deepFreeze(structuredClone(source));
  const before = JSON.stringify(frozenSource);
  const sourceBefore = JSON.stringify(source);
  const extracted = frozenSource.sections.flatMap(block => block.type === 'legal_footer'
    ? [{identity: block.identity, address: block.address}]
    : []);
  assert.deepEqual(checkHubSpotFooterComparison(extracted, {
    ...settings,
    company_street_address_1: '42 Main Street',
  }), {matches: true, settings_origin: 'locally_declared', account_settings_verified: false});
  assert.equal(JSON.stringify(frozenSource), before);
  assert.equal(JSON.stringify(source), sourceBefore);
});

test('comparison errors identify missing footer and preserve exact address whitespace semantics', () => {
  assert.throws(() => checkHubSpotFooterComparison([], settings), /^Error: EXPORT_FOOTER_REQUIRED$/);
  assert.throws(() => checkHubSpotFooterComparison([{identity: 'Fixture Books', address: expectedAddress.trim()}], settings), /^Error: HUBSPOT_FOOTER_MISMATCH$/);
});

test('browser copy explains local settings and mismatch without exposing submitted values', () => {
  assert.equal(typeof HUBSPOT_FOOTER_MESSAGES.HUBSPOT_SETTINGS_INVALID, 'string');
  assert.equal(typeof HUBSPOT_FOOTER_MESSAGES.HUBSPOT_FOOTER_MISMATCH, 'string');
  assert.match(HUBSPOT_FOOTER_MESSAGES.HUBSPOT_SETTINGS_INVALID, /account|HubSpot/i);
  assert.match(HUBSPOT_FOOTER_MESSAGES.HUBSPOT_SETTINGS_INVALID, /not been verified|unverified/i);
  assert.match(HUBSPOT_FOOTER_MESSAGES.HUBSPOT_FOOTER_MISMATCH, /company|address/i);
  assert.match(HUBSPOT_FOOTER_MESSAGES.HUBSPOT_FOOTER_MISMATCH, /unchanged|remains unchanged/i);
  assert.doesNotMatch(JSON.stringify(HUBSPOT_FOOTER_MESSAGES), /42 Main Street|Fixture Books/);
});

test('review and request bodies enforce the strict browser-only HubSpot contract', () => {
  assert.deepEqual(HubSpotReview.parse(reviewInput), reviewInput);
  assert.deepEqual(HubSpotReviewInput.parse({settings}), {settings});
  assert.deepEqual(HubSpotArtifactInput.parse({settings, format: 'html', expected_destination_hash: digest}), {settings, format: 'html', expected_destination_hash: digest});
  for (const extra of [
    {subject: 'PRIVATE'}, {html: '<p>PRIVATE</p>'}, {text: 'PRIVATE'},
    {api_revision: 'invented'}, {management_url: 'https://private.test'}, {access_token: 'SECRET'},
    {ready: true}, {account_settings_verified: true}, {provider: {verified: true}},
  ]) {
    assert.equal(HubSpotReview.safeParse({...reviewInput, ...extra}).success, false);
    assert.equal(HubSpotReviewInput.safeParse({settings, ...extra}).success, false);
    assert.equal(HubSpotArtifactInput.safeParse({settings, format: 'html', expected_destination_hash: digest, ...extra}).success, false);
  }
  for (const change of [
    {remote_export_enabled: true}, {account_settings_verified: true}, {native_conformance_verified: true},
    {management_link_verified: true}, {settings_origin: 'account_verified'}, {source_artifact_hash: 'A'.repeat(64)},
    {destination_hash: 'bad'}, {blockers: reviewInput.blockers.slice(1)}, {transformations: []},
  ]) assert.equal(HubSpotReview.safeParse({...reviewInput, ...change}).success, false);
  assert.equal(HubSpotArtifactInput.safeParse({settings, format: 'txt', expected_destination_hash: digest}).success, true);
  assert.equal(HubSpotArtifactInput.safeParse({settings, format: 'pdf', expected_destination_hash: digest}).success, false);
});
