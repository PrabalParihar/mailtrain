import test from 'node:test';
import assert from 'node:assert/strict';
import { blankSpec, lintEmail, compileEmail } from '../src/domain/email';
function ready() {
  const s = blankSpec('brand', 'Fixture');
  s.subject = 'Reviewed offer';
  s.preheader = 'Grounded details';
  s.sections = [
    { id: 'cta', type: 'button', label: 'Explore', href: 'https://example.org/offer' },
    {
      id: 'footer',
      type: 'legal_footer',
      identity: 'Fixture',
      address: 'Fixture address',
      unsubscribe_slot: true,
    },
  ];
  return s;
}
test('voice rules inspect located rendered copy, including decoded/split HTML, not URLs or identifiers', () => {
  const s = ready();
  s.sections[0] = {
    id: 'prohibited',
    type: 'button',
    label: 'Explore',
    href: 'https://example.org/prohibited',
  };
  assert.equal(
    lintEmail(s, ['prohibited']).some((f) => f.code === 'VOICE_FORBIDDEN'),
    false,
  );
  s.sections.unshift({
    id: 'raw-part',
    type: 'custom_html',
    html: '<p>Risk<strong> free</strong> &amp; simple</p>',
  });
  const voice = lintEmail(s, ['risk free', '& simple']).filter((f) => f.code === 'VOICE_FORBIDDEN');
  assert.deepEqual(
    voice.map((f) => f.location),
    ['raw-part', 'raw-part'],
  );
  s.subject = 'Risk free';
  assert.ok(lintEmail(s, ['risk free']).some((f) => f.location === 'subject'));
});
test('static preflight locates opaque link and image defects without fetching them', () => {
  const s = ready();
  s.sections.unshift({
    id: 'opaque',
    type: 'custom_html',
    html: '<a href="javascript:alert(1)">Buy</a><a>Missing</a><img src="mailto:hello@example.org"><a href="{{UNSUBSCRIBE_URL}}">Leave</a>',
  });
  const findings = lintEmail(s);
  assert.ok(
    findings.some(
      (f) =>
        f.code === 'UNSAFE_LINK' && f.location.startsWith('opaque') && f.severity === 'blocking',
    ),
  );
  assert.ok(findings.some((f) => f.code === 'LINK_DESTINATION_REQUIRED'));
  assert.ok(findings.some((f) => f.code === 'ALT_REQUIRED' && f.location.startsWith('opaque')));
  assert.ok(findings.some((f) => f.code === 'UNSAFE_IMAGE_URL'));
  assert.ok(!findings.some((f) => f.code === 'UNSAFE_LINK' && f.message.includes('UNSUBSCRIBE')));
  assert.ok(findings.some((f) => f.code === 'LINK_CHECK_UNAVAILABLE'));
  assert.ok(findings.some((f) => f.code === 'IMAGE_WEIGHT_UNAVAILABLE'));
});
test('contrast warnings cover actual normal-text/button colors and ignore unused accent', () => {
  const s = ready();
  s.theme.accent = '#ffffff';
  const f = lintEmail(s);
  assert.ok(
    f.some((f) => f.code === 'LOW_CONTRAST' && f.location === 'cta' && f.severity === 'warning'),
  );
  s.sections = s.sections.filter((b) => b.id !== 'cta');
  assert.ok(!lintEmail(s).some((f) => f.code === 'LOW_CONTRAST'));
});
test('HTML size uses exact frozen UTF8 bytes and spam is advisory; artifacts stay immutable', async () => {
  const s = ready();
  s.subject = 'BUY NOW!!!';
  const artifact = await compileEmail(s),
    before = structuredClone(artifact);
  const html = 'é'.repeat(51201);
  const findings = lintEmail(s, [], { html });
  assert.ok(
    findings.some(
      (f) => f.code === 'HTML_WEIGHT' && f.message.includes('102402') && f.severity === 'warning',
    ),
  );
  assert.ok(findings.some((f) => f.code === 'SPAM_ADVISORY' && f.severity === 'info'));
  assert.deepEqual(artifact, before);
  assert.deepEqual(await compileEmail(s), before);
  const unknown = lintEmail(s);
  assert.ok(unknown.some((f) => f.code === 'HTML_WEIGHT_UNAVAILABLE'));
  assert.ok(unknown.some((f) => f.code === 'DARK_MODE_UNAVAILABLE'));
});

test('raw unsubscribe marker must be a usable link, not a text-only or image marker', () => {
  const s = ready();
  s.editing_mode = 'raw_html';
  s.raw_html = '<p>{{UNSUBSCRIBE_URL}}</p>';
  assert.ok(
    lintEmail(s).some((f) => f.code === 'UNSUBSCRIBE_REQUIRED' && f.severity === 'blocking'),
  );
  s.raw_html = '<a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a>';
  assert.ok(!lintEmail(s).some((f) => f.code === 'UNSUBSCRIBE_REQUIRED'));
});

test('review: meaningful opaque image alt copy obeys voice rules in raw and structured modes', () => {
  const s = ready();
  s.sections.unshift({
    id: 'opaque',
    type: 'custom_html',
    html: '<img src="https://example.org/x.png" alt="risk free">',
  });
  assert.ok(
    lintEmail(s, ['risk free']).some(
      (f) => f.code === 'VOICE_FORBIDDEN' && f.location === 'opaque/image[1]',
    ),
  );
  s.editing_mode = 'raw_html';
  s.raw_html =
    '<img src="https://example.org/x.png" alt="risk free"><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a>';
  assert.ok(
    lintEmail(s, ['risk free']).some(
      (f) => f.code === 'VOICE_FORBIDDEN' && f.location === 'raw_html/image[1]',
    ),
  );
});
test('review: sanitized-away textarea and metadata do not create recipient-copy voice blockers', () => {
  const s = ready();
  s.sections.unshift({
    id: 'opaque',
    type: 'custom_html',
    html: '<textarea>risk free</textarea><title>risk free</title><p>Ordinary</p>',
  });
  assert.ok(!lintEmail(s, ['risk free']).some((f) => f.code === 'VOICE_FORBIDDEN'));
});
test('review: malformed mail and phone links block, syntactically valid destinations remain usable', () => {
  const s = ready();
  s.sections.unshift({
    id: 'opaque',
    type: 'custom_html',
    html: '<a href="mailto:not-an-email-address">Contact</a><a href="tel:hello">Call</a>',
  });
  assert.equal(lintEmail(s).filter((f) => f.code === 'UNSAFE_LINK').length, 2);
  s.sections[0] = {
    id: 'opaque',
    type: 'custom_html',
    html: '<a href="mailto:hello%2Boffers@example.org?subject=Question">Contact</a><a href="tel:+1-555-0100">Call</a>',
  };
  assert.ok(!lintEmail(s).some((f) => f.code === 'UNSAFE_LINK'));
});
test('review: empty or inaccessible unsubscribe anchors cannot satisfy the required control', () => {
  const s = ready();
  s.editing_mode = 'raw_html';
  for (const anchor of [
    '<a href="{{UNSUBSCRIBE_URL}}"></a>',
    '<a href="{{UNSUBSCRIBE_URL}}"> </a>',
    '<a href="{{UNSUBSCRIBE_URL}}"><img src="https://example.org/x.png" alt=""></a>',
  ]) {
    s.raw_html = '<p>Ordinary</p>' + anchor;
    assert.ok(lintEmail(s).some((f) => f.code === 'UNSUBSCRIBE_REQUIRED'));
  }
  for (const anchor of [
    '<a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a>',
    '<a href="{{UNSUBSCRIBE_URL}}"><img src="https://example.org/x.png" alt="Unsubscribe"></a>',
  ]) {
    s.raw_html = '<p>Ordinary</p>' + anchor;
    assert.ok(!lintEmail(s).some((f) => f.code === 'UNSUBSCRIBE_REQUIRED'));
  }
});
