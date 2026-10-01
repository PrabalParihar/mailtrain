import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { blankSpec } from '../src/domain/email';
import { DerivationInput, derivativeSpec, sourceStatus } from '../src/domain/derivation';
test('derived drafts retain pinned source structure and facts; locale changes are explicit and source is unchanged', () => {
  const source = blankSpec(randomUUID(), 'Fixture'), before = structuredClone(source);
  source.sections.splice(1, 0, { id: 'opaque', type: 'custom_html', html: '<p>SKU100 {{FIRST_NAME}}</p>' });
  const preserved = structuredClone(source);
  const remix = derivativeSpec(source, { kind: 'remix', title: 'A new remix' });
  assert.deepEqual(remix, source);
  remix.subject = 'Different child copy';
  assert.deepEqual(source, preserved);
  const locale = derivativeSpec(source, { kind: 'locale', title: 'Arabic draft', locale: 'ar-SA' });
  assert.equal(locale.locale, 'ar-SA'); assert.equal(locale.direction, 'rtl');
  assert.deepEqual(locale.sections, source.sections);
  assert.equal(locale.brand_kit_version_id, before.brand_kit_version_id);
  assert.throws(() => derivativeSpec(source, { kind: 'locale', title: 'Same locale', locale: 'en-US' }));
  assert.throws(() => DerivationInput.parse({ kind: 'locale', title: 'Unknown locale', locale: 'xx-ZZ' }));
  assert.throws(() => DerivationInput.parse({ kind: 'remix', title: 'No extra authority', workspace_id: randomUUID() }));
  const raw = { ...source, editing_mode: 'raw_html' as const, raw_html: '<p>SKU100 {{FIRST_NAME}} <a href="https://example.org">Source copy</a></p>' };
  const rawChild = derivativeSpec(raw, { kind: 'locale', title: 'Hebrew raw draft', locale: 'he-IL' });
  assert.equal(rawChild.editing_mode, 'raw_html'); assert.equal(rawChild.raw_html, raw.raw_html); assert.equal(rawChild.direction, 'rtl');
});
test('source drift and unknown legacy provenance cannot appear current or rewrite children', () => {
  assert.equal(sourceStatus(4, 4), 'current');
  assert.equal(sourceStatus(4, 5), 'outdated');
  assert.equal(sourceStatus(null, 4), 'unknown');
});
