import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {sourceDatabase} from '../scripts/smoke-source-truth';
import {blankSpec} from '../src/domain/email';
import {createEmail,checkpoint,saveDraft} from '../src/server/emails';
import {deriveEmail} from '../src/server/derivation';
const feature=await import('../src/server/locale-content-review').catch(()=>null);

test('manual review pins immutable checkpoints, replays the original command and preserves draft contents',async()=>{
  assert.ok(feature,'manual locale review persistence is missing');
  await sourceDatabase(async({db,p,brand,tx})=>{
    const parent=await tx(c=>createEmail(c,p,'Review source',blankSpec(brand,'Source')));
    const original=await tx(c=>checkpoint(c,p,parent.id,1));
    const child=(await tx(c=>deriveEmail(c,p,original.id,{kind:'locale',title:'Manual Hebrew',locale:'he-IL'}))).email;
    const state=await tx(c=>feature.localeReviewContext(c,p,child.id));
    assert.equal(state.target_revision?.source_doc_version,1);
    const input={revision_id:state.target_revision!.id,source_revision_id:original.id,expected_source_doc_version:1,outcome:'content_reviewed',note:'בדקתי את הנוסח המקומי.'};
    const key=randomUUID();
    const before=(await db.query('SELECT id,doc_version,spec FROM emails ORDER BY id')).rows;
    const recorded=await tx(c=>feature.recordLocaleReview(c,p,child.id,1,input,key));
    assert.equal(recorded.review.created_by,p.user);
    assert.equal(recorded.review.source_revision_id,original.id);
    assert.deepEqual(await tx(c=>feature.recordLocaleReview(c,p,child.id,1,input,key)),recorded);
    assert.deepEqual((await db.query('SELECT id,doc_version,spec FROM emails ORDER BY id')).rows,before);
    const req=new Request('http://127.0.0.1/v1/emails/'+child.id+'/locale-reviews?limit=1');
    let history=await tx(c=>feature.localeReviewHistory(req,c,p,child.id));
    assert.equal(history.total_count,1);assert.equal(history.data[0].applicability,'current');
    await tx(c=>saveDraft(c,p,child.id,1,{...child.spec,subject:'Updated Hebrew copy'}));
    history=await tx(c=>feature.localeReviewHistory(req,c,p,child.id));
    assert.equal(history.data[0].applicability,'target_changed');assert.equal(history.context.target_revision,null);
    const next=await tx(c=>checkpoint(c,p,child.id,2));
    await assert.rejects(tx(c=>feature.recordLocaleReview(c,p,child.id,1,input,randomUUID())),{code:'VERSION_MISMATCH'});
    await tx(c=>saveDraft(c,p,parent.id,1,{...parent.spec,subject:'Changed source'}));
    history=await tx(c=>feature.localeReviewHistory(req,c,p,child.id));
    assert.equal(history.data[0].applicability,'both_changed');
    const newInput={...input,revision_id:next.id,outcome:'changes_requested'};
    await assert.rejects(tx(c=>feature.recordLocaleReview(c,p,child.id,2,newInput,randomUUID())),{code:'LOCALE_SOURCE_CHANGED'});
    await tx(c=>feature.recordLocaleReview(c,p,child.id,2,{...newInput,expected_source_doc_version:2},randomUUID()));
    history=await tx(c=>feature.localeReviewHistory(req,c,p,child.id));
    assert.equal(history.total_count,2);assert.equal(history.data[0].outcome,'changes_requested');
    assert.equal(history.data[0].applicability,'current');assert.ok(history.has_more);
    const nextRequest=new Request(req.url+'&after='+encodeURIComponent(history.next_cursor!));
    assert.equal((await tx(c=>feature.localeReviewHistory(nextRequest,c,p,child.id))).data[0].id,recorded.review.id);
    assert.deepEqual(await tx(c=>feature.recordLocaleReview(c,p,child.id,1,input,key)),recorded);
    assert.equal((await db.query('SELECT count(*)::int n FROM locale_content_reviews')).rows[0].n,2);
  });
});
test('a saved draft without a checkpoint cannot be reviewed as a frozen revision',async()=>{
  assert.ok(feature);
  await sourceDatabase(async({p,brand,tx})=>{
    const parent=await tx(c=>createEmail(c,p,'Source',blankSpec(brand,'Source'))),frozen=await tx(c=>checkpoint(c,p,parent.id,1));
    const child=(await tx(c=>deriveEmail(c,p,frozen.id,{kind:'locale',title:'French',locale:'fr-FR'}))).email;
    const previous=await tx(c=>feature.localeReviewContext(c,p,child.id));
    await tx(c=>saveDraft(c,p,child.id,1,{...child.spec,subject:'Texte manuel'}));
    await assert.rejects(tx(c=>feature.recordLocaleReview(c,p,child.id,2,{revision_id:previous.target_revision!.id,source_revision_id:frozen.id,expected_source_doc_version:1,outcome:'content_reviewed',note:'Manual note'},randomUUID())),{code:'LOCALE_CHECKPOINT_REQUIRED'});
  });
});
