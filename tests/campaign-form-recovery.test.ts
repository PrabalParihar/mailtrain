import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCampaignForm,formForCampaign} from '../src/ui/campaign-form-recovery';
const id='00000000-0000-4000-8000-000000000001',timestamp='2026-10-02T11:00:00.000Z';
test('campaign recovery retains incomplete source ID and the exact original command',()=>{
 const base={id,name:'Owned',version:1,state:'draft',revision_id:id,intent:{artifact_hash:null,planned_timing:null},audience_snapshot:null,audience_count:0,eligible_count:0,excluded_count:0,digest:'owned',created_at:timestamp};
 const form={...formForCampaign(base),audience_id:'incomplete',name:'',pending:{key:id,body:JSON.stringify({expected_version:1,name:'Owned',revision_id:id,planned_timing:null})}};
 assert.deepEqual(parseCampaignForm(JSON.stringify(form)),form);
 assert.equal(parseCampaignForm(JSON.stringify({...form,pending:{...form.pending,body:JSON.stringify({expected_version:2,name:'Owned',revision_id:id,planned_timing:null})}})),null);
 assert.equal(parseCampaignForm(JSON.stringify({...form,base:{...base,intent:{...base.intent,audience:[{private:'no'}]}}})),null);
});
