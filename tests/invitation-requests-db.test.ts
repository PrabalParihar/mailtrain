import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID}from'node:crypto';
import {sourceDatabase}from'../scripts/smoke-source-truth';
const feature=await import('../src/server/invitation-requests').catch(()=>null);
const fields={email:'planner@example.test',role:'Editor',notes:'Literal <text> مرحبا é 😀',review_due_at:null};
test('planning persistence replays exact commands and stores immutable lifecycle history without memberships',async()=>{
 assert.ok(feature,'invitation planning persistence missing');await sourceDatabase(async({db,p,tx})=>{
 const members=(await db.query('SELECT * FROM memberships ORDER BY id')).rows,sessions=(await db.query('SELECT * FROM auth_sessions')).rows;
 const input={request_id:randomUUID(),...fields},key=randomUUID();const created=await tx(c=>feature.createInvitationRequest(c,p,input,key));
 assert.equal(created.request.state,'draft');assert.equal(created.request.seats_reserved,0);assert.equal(created.request.credentials_created,false);
 let current=await tx(c=>feature.changeInvitationRequest(c,p,input.request_id,'update',{...fields,notes:'Changed note',expected_version:1},randomUUID()));assert.equal(current.request.version,2);
 const noop=await tx(c=>feature.changeInvitationRequest(c,p,input.request_id,'update',{...fields,notes:'Changed note',expected_version:2},randomUUID()));assert.equal(noop.changed,false);assert.equal(noop.request.version,2);
 current=await tx(c=>feature.changeInvitationRequest(c,p,input.request_id,'withdraw',{expected_version:2},randomUUID()));assert.equal(current.request.state,'withdrawn');assert.equal(current.request.version,3);
 current=await tx(c=>feature.changeInvitationRequest(c,p,input.request_id,'reopen',{expected_version:3},randomUUID()));assert.equal(current.request.version,4);assert.equal(current.request.state,'draft');
 assert.deepEqual(await tx(c=>feature.createInvitationRequest(c,p,input,key)),created);
 const history=await tx(c=>feature.invitationRequestPage(new Request('http://127.0.0.1/v1/invitation-requests/'+input.request_id+'/history'),c,p,input.request_id));
 assert.deepEqual(history.data.map(r=>r.command),['reopened','withdrawn','updated','created']);const original=history.data.at(-1);assert.ok(original);assert.equal(original.snapshot.notes,fields.notes);
 assert.deepEqual((await db.query('SELECT * FROM memberships ORDER BY id')).rows,members);assert.deepEqual((await db.query('SELECT * FROM auth_sessions')).rows,sessions);
 });
});
test('stale versions and duplicate reopen refuse without losing either request or history',async()=>{
 assert.ok(feature);await sourceDatabase(async({db,p,tx})=>{
 const first=await tx(c=>feature.createInvitationRequest(c,p,{request_id:randomUUID(),...fields},randomUUID()));
 await assert.rejects(tx(c=>feature.createInvitationRequest(c,p,{request_id:randomUUID(),...fields,email:'PLANNER@example.test'},randomUUID())),{code:'INVITATION_REQUEST_EXISTS'});
 await assert.rejects(tx(c=>feature.changeInvitationRequest(c,p,first.request.id,'update',{...fields,notes:'Stale',expected_version:2},randomUUID())),{code:'VERSION_CONFLICT'});
 await tx(c=>feature.changeInvitationRequest(c,p,first.request.id,'withdraw',{expected_version:1},randomUUID()));
 const second=await tx(c=>feature.createInvitationRequest(c,p,{request_id:randomUUID(),...fields},randomUUID()));
 await assert.rejects(tx(c=>feature.changeInvitationRequest(c,p,first.request.id,'reopen',{expected_version:2},randomUUID())),{code:'INVITATION_REQUEST_EXISTS'});
 assert.equal((await tx(c=>feature.invitationRequest(c,p,first.request.id))).request.state,'withdrawn');assert.equal((await tx(c=>feature.invitationRequest(c,p,second.request.id))).request.version,1);
 assert.equal((await db.query('SELECT count(*)::int n FROM invitation_request_history')).rows[0].n,3);
 });
});
test('request deadlines normalize to UTC and paged history retains frozen versions',async()=>{
 assert.ok(feature);await sourceDatabase(async({p,tx})=>{
 const input={request_id:randomUUID(),...fields,review_due_at:'2020-01-01T12:30:00+05:30'};
 const created=await tx(c=>feature.createInvitationRequest(c,p,input,randomUUID()));assert.equal(created.request.review_due_at,'2020-01-01T07:00:00.000Z');assert.equal(created.request.planning_status,'review_due');
 await tx(c=>feature.changeInvitationRequest(c,p,input.request_id,'update',{...fields,review_due_at:null,notes:'Later',expected_version:1},randomUUID()));
 const req=new Request('http://127.0.0.1/v1/invitation-requests/'+input.request_id+'/history?limit=1'),page=await tx(c=>feature.invitationRequestPage(req,c,p,input.request_id));assert.equal(page.total_count,2);assert.equal(page.has_more,true);
 const older=await tx(c=>feature.invitationRequestPage(new Request(req.url+'&after='+encodeURIComponent(page.next_cursor!)),c,p,input.request_id));assert.equal(older.data[0].snapshot.review_due_at,'2020-01-01T07:00:00.000Z');assert.equal(older.has_more,false);
 });
});
test('manager planning respects current role and cannot turn requests into access credentials',async()=>{
 assert.ok(feature);await sourceDatabase(async({db,p,tx})=>{
 const admin='fixture-admin';await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Admin')",[p.workspace,admin]);const ap={...p,user:admin,role:'Admin' as const};
 const billing=await tx(c=>feature.createInvitationRequest(c,p,{request_id:randomUUID(),...fields,role:'Billing'},randomUUID()));
 await assert.rejects(tx(c=>feature.createInvitationRequest(c,ap,{request_id:randomUUID(),...fields,email:'other@example.test',role:'Billing'},randomUUID()),admin),{code:'ROLE_PROTECTED'});
 await assert.rejects(tx(c=>feature.changeInvitationRequest(c,ap,billing.request.id,'withdraw',{expected_version:1},randomUUID()),admin),{code:'ROLE_PROTECTED'});
 const context=await tx(c=>feature.invitationPlanningContext(c,p));assert.equal(context.workspace_name,'source fixture');assert.equal(context.acceptance_enabled,false);assert.equal(context.delivery_enabled,false);assert.equal(context.seats_reserved,0);
 });
});
