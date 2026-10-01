import test from'node:test';import assert from'node:assert/strict';import{normalizeMemoryText,chunkMemoryText,selectMemoryChunks,BrandSourceInput}from'../src/domain/brand-memory';
test('brand source approval, UTF8 limits and Unicode chunks are explicit and bounded',()=>{
 const input={brand_kit_version_id:'11111111-1111-4111-8111-111111111111',title:'Approved facts',source_ref:'Product brief',text:'Verified product facts',acknowledge_rights_and_no_private_data:true};assert.equal(BrandSourceInput.parse(input).text,input.text);assert.equal(BrandSourceInput.safeParse({...input,acknowledge_rights_and_no_private_data:false}).success,false);assert.equal(BrandSourceInput.safeParse({...input,text:'🚀'.repeat(20000)}).success,false);
 assert.equal(normalizeMemoryText('  One\r\nTwo  '),'One\nTwo');const text='🚀'.repeat(1501),chunks=chunkMemoryText(text);assert.equal(chunks.length,2);assert.equal(Array.from(chunks[0]).length,1500);assert.equal(chunks.join(''),text);
});
test('lexical retrieval is deterministic, selected without instructions and bounded to8 chunks',()=>{
 const rows=Array.from({length:12},(_,i)=>({id:String(i).padStart(2,'0'),source_id:'source',source_title:'Facts',source_ref:'Manual brief',content:i===10?'sneaker cotton sustainability':'cotton',content_digest:'a'.repeat(64),ordinal:i}));const result=selectMemoryChunks(rows,'sneaker sustainability');assert.equal(result[0].id,'10');assert.equal(result.length,8);assert.deepEqual(selectMemoryChunks([...rows].reverse(),'sneaker sustainability'),result);assert.deepEqual(selectMemoryChunks([],''),[]);
});
