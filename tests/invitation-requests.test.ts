import test from 'node:test';
import assert from 'node:assert/strict';
import {InvitationRequestInput,InvitationCreateInput,InvitationPlanningContext,invitationPlanningStatus,invitationRefusal} from '../src/domain/invitation-requests';
const id='11111111-1111-4111-8111-111111111111';
test('planning inputs preserve bounded notes and require unverified email and proposed role without grant fields',()=>{
 const v=InvitationRequestInput.parse({email:'  Planner@Example.test  ',role:'Editor',notes:'مرحبا <literal> é 😀',review_due_at:'2026-10-03T18:00:00+02:00'});
 assert.equal(v.email,'Planner@Example.test');assert.equal(v.notes,'مرحبا <literal> é 😀');assert.equal(v.review_due_at,'2026-10-03T18:00:00+02:00');
 assert.deepEqual(InvitationCreateInput.parse({request_id:id,email:'one@example.test',role:'Viewer'}),{request_id:id,email:'one@example.test',role:'Viewer',notes:'',review_due_at:null});
 for(const value of [{email:'bad',role:'Editor'},{email:'one@example.test',role:'Owner'},{email:'one@example.test',role:'Editor',token:'credential'},{email:'one@example.test',role:'Editor',acceptance_enabled:true},{email:'one@example.test',role:'Editor',notes:'x'.repeat(4001)},{email:'one@example.test',role:'Editor',review_due_at:'tomorrow'}])assert.equal(InvitationRequestInput.safeParse(value).success,false);
});
test('review deadlines are planning-only and withdrawn requests remain withdrawn at all times',()=>{
 const draft={state:'draft' as const,review_due_at:'2026-10-03T18:00:00Z'};
 assert.equal(invitationPlanningStatus(draft,new Date('2026-10-03T17:59:59Z')),'draft');assert.equal(invitationPlanningStatus(draft,new Date('2026-10-03T18:00:00Z')),'review_due');
 assert.equal(invitationPlanningStatus({...draft,state:'withdrawn'},new Date('2030-01-01T00:00:00Z')),'withdrawn');assert.equal(invitationPlanningStatus({...draft,review_due_at:null},new Date()),'draft');
});
test('option2 cannot advertise sent accepted reserved or credential-enabled planning context',()=>{
 const ctx={workspace_id:id,workspace_name:'Fixture',actor_id:'fixture',actor_role:'Owner',delivery_enabled:false,acceptance_enabled:false,credentials_created:false,seats_reserved:0,prerequisites:['Approved commercial entitlements']};
 assert.deepEqual(InvitationPlanningContext.parse(ctx),ctx);
 for(const patch of [{acceptance_enabled:true},{delivery_enabled:true},{seats_reserved:1},{credentials_created:true}])assert.equal(InvitationPlanningContext.safeParse({...ctx,...patch}).success,false);
 assert.equal(invitationRefusal('accept').code,'INVITATION_ACCEPTANCE_DISABLED');assert.equal(invitationRefusal('send').code,'INVITATION_DELIVERY_DISABLED');
});
