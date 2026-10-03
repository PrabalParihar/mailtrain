import test from 'node:test';
import assert from 'node:assert/strict';
const contracts = await import('../src/domain/locale-content-review').catch(() => null);
const id='11111111-1111-4111-8111-111111111111';
const input={revision_id:id,source_revision_id:id,expected_source_doc_version:2,outcome:'content_reviewed',note:'Checked the local copy.'};

test('manual review requires an explicit outcome and a nonblank bounded note',()=>{
  assert.ok(contracts,'manual locale review contracts are missing');
  assert.equal(contracts.LocaleReviewInput.parse(input).note,input.note);
  for(const note of [' ', 'x'.repeat(4001), '\u0000', '\ud800'])
    assert.equal(contracts.LocaleReviewInput.safeParse({...input,note}).success,false);
  assert.equal(contracts.LocaleReviewInput.safeParse({...input,outcome:'send_approved'}).success,false);
  assert.equal(contracts.LocaleReviewInput.safeParse({...input,reviewer:'someone-else'}).success,false);
});
test('applicability distinguishes saved target changes from observed source changes',()=>{
  assert.ok(contracts);
  assert.equal(contracts.reviewApplicability(2,3,2,3),'current');
  assert.equal(contracts.reviewApplicability(2,3,4,3),'target_changed');
  assert.equal(contracts.reviewApplicability(2,3,2,4),'source_changed');
  assert.equal(contracts.reviewApplicability(2,3,4,4),'both_changed');
});
