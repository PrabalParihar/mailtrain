import test from 'node:test';
import assert from 'node:assert/strict';
const membershipPolicy=await import('../src/domain/memberships').catch(()=>null);
test('membership inputs use explicit version, role and destructive acknowledgment',()=>{
 assert.ok(membershipPolicy?.RoleChangeInput,'Membership policy must exist.');
 assert.equal(membershipPolicy.RoleChangeInput.safeParse({role:'Editor',expected_version:1}).success,true);
 for(const input of [{role:'Owner',expected_version:1},{role:'Editor',expected_version:0},{role:'Editor',expected_version:1,workspace:'foreign'}])assert.equal(membershipPolicy.RoleChangeInput.safeParse(input).success,false);
 assert.equal(membershipPolicy.RemoveMemberInput.safeParse({expected_version:1,acknowledge:true}).success,true);
 assert.equal(membershipPolicy.RemoveMemberInput.safeParse({expected_version:1,acknowledge:false}).success,false);
 assert.equal(membershipPolicy.TransferOwnerInput.safeParse({expected_version:2,expected_owner_version:1,acknowledge:true}).success,true);
});
test('editing seats follow the PRD roles and positive capacity changes fail closed',()=>{
 assert.ok(membershipPolicy?.editingSeat,'Membership policy must exist.');
 assert.deepEqual(['Owner','Admin','Editor','Viewer','Billing'].map(role=>membershipPolicy.editingSeat(role as 'Owner')), [1,1,1,0,0]);
 const decide=membershipPolicy.decideMembershipChange;
 assert.deepEqual(decide({actor:'Owner',target:'Editor',status:'active',command:'role',next_role:'Admin',active_owners:1,self:false}),{ok:true,editing_seat_delta:0});
 assert.deepEqual(decide({actor:'Owner',target:'Editor',status:'active',command:'role',next_role:'Viewer',active_owners:1,self:false}),{ok:true,editing_seat_delta:-1});
 assert.deepEqual(decide({actor:'Owner',target:'Viewer',status:'active',command:'role',next_role:'Editor',active_owners:1,self:false}),{ok:false,code:'SEAT_POLICY_REQUIRED'});
});
test('current actor matrix forbids privilege escalation and revoked membership revival',()=>{
 assert.ok(membershipPolicy?.decideMembershipChange,'Membership policy must exist.');
 const decide=membershipPolicy.decideMembershipChange;
 for(const actor of ['Editor','Viewer','Billing'] as const)assert.deepEqual(decide({actor,target:'Editor',status:'active',command:'remove',active_owners:1,self:false}),{ok:false,code:'INSUFFICIENT_SCOPE'});
 for(const target of ['Owner','Billing'] as const)assert.deepEqual(decide({actor:'Admin',target,status:'active',command:'remove',active_owners:2,self:false}),{ok:false,code:'ROLE_PROTECTED'});
 assert.deepEqual(decide({actor:'Admin',target:'Viewer',status:'active',command:'role',next_role:'Billing',active_owners:1,self:false}),{ok:false,code:'ROLE_PROTECTED'});
 assert.deepEqual(decide({actor:'Owner',target:'Editor',status:'revoked',command:'role',next_role:'Viewer',active_owners:1,self:false}),{ok:false,code:'MEMBERSHIP_INACTIVE'});
});
test('the final Owner survives role/removal and explicit transfer preserves editing quantity',()=>{
 assert.ok(membershipPolicy?.decideMembershipChange,'Membership policy must exist.');
 const decide=membershipPolicy.decideMembershipChange;
 for(const command of ['role','remove'] as const)assert.deepEqual(decide({actor:'Owner',target:'Owner',status:'active',command,next_role:'Viewer',active_owners:1,self:true}),{ok:false,code:'LAST_OWNER_REQUIRED'});
 assert.deepEqual(decide({actor:'Owner',target:'Owner',status:'active',command:'remove',active_owners:2,self:false}),{ok:true,editing_seat_delta:-1});
 assert.deepEqual(decide({actor:'Owner',target:'Editor',status:'active',command:'transfer-owner',active_owners:1,self:false}),{ok:true,editing_seat_delta:0});
 assert.deepEqual(decide({actor:'Admin',target:'Editor',status:'active',command:'transfer-owner',active_owners:1,self:false}),{ok:false,code:'OWNER_REQUIRED'});
 assert.deepEqual(decide({actor:'Owner',target:'Editor',status:'active',command:'transfer-owner',active_owners:1,self:true}),{ok:false,code:'SELF_TRANSFER_DENIED'});
 assert.deepEqual(decide({actor:'Owner',target:'Viewer',status:'active',command:'transfer-owner',active_owners:1,self:false}),{ok:false,code:'SEAT_POLICY_REQUIRED'});
});
test('recent MFA requires real first and second factors without downgrade or malformed ages',()=>{
 assert.ok(membershipPolicy?.recentMfa,'Membership policy must exist.');
 assert.equal(membershipPolicy.recentMfa([0,0]),true);assert.equal(membershipPolicy.recentMfa([10,10]),false);
 for(const age of [null,undefined,[],[0],[0,0,0],[-1,0],[0,-1],[0,11],[11,0],[0,Infinity],[NaN,0],['0',0],{first:0,second:0}])assert.equal(membershipPolicy.recentMfa(age),false);
});
test('recent MFA expires at the Clerk ten-minute factor-age boundary',()=>{
 assert.ok(membershipPolicy?.recentMfa,'Membership policy must exist.');
 assert.equal(membershipPolicy.recentMfa([9,9]),true);
 assert.equal(membershipPolicy.recentMfa([10,0]),false);
 assert.equal(membershipPolicy.recentMfa([0,10]),false);
});
