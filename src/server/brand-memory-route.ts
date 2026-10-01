import{z}from'zod';import{withPrincipal}from'./auth';import{keyed}from'./commands';import{audit}from'./audit';import{resourcePage}from'./pagination';import{fail}from'./errors';import{addBrandSource,getBrandSource,readSourceChunks,removeBrandSource,retrieveBrandMemory,sourceRecord,sourceFields}from'./brand-memory';import{BrandSourceInput,MemoryPreviewInput}from'../domain/brand-memory';
export async function brandMemoryRoute(req:Request,path:string[],body:Record<string,unknown>,key:string|null){const[root,id]=path;return withPrincipal(req,req.method==='GET'||root==='brands'?'read':'edit',async(tx,p)=>{
 if(root==='brands'){const input=MemoryPreviewInput.parse(body);return{context:await retrieveBrandMemory(tx,id,input.query)};}
 if(req.method==='GET'){
  if(id){const source=await getBrandSource(tx,id);return{source,chunks:await readSourceChunks(tx,id)};}
  const brand=z.uuid().parse(new URL(req.url).searchParams.get('brand_kit_version_id'));if(!(await tx.query('SELECT id FROM brands WHERE id=$1',[brand])).rowCount)fail(404,'RESOURCE_NOT_FOUND','Brand version not found.');const page=await resourcePage(req,tx,p,{resource:'brand-sources',from:'brand_sources',fields:sourceFields,where:'brand_kit_version_id=$1',values:[brand],filters:{brand_kit_version_id:brand}});return{...page,data:page.data.map(sourceRecord)};
 }
 const input=id?z.object({}).strict().parse(body):BrandSourceInput.parse(body);
 const result=await keyed(tx,p,id?'brand.source.remove:'+id:'brand.source.add',key,input,async()=>{
  if(id){const before=await getBrandSource(tx,id),source=await removeBrandSource(tx,id);if(!before.deleted_at)await audit(tx,p.workspace,p.user,'brand.source.removed',id);return{source};}
  const source=await addBrandSource(tx,p.workspace,input);await audit(tx,p.workspace,p.user,'brand.source.added',source.id);return{source};
 });
 // Replayed creation cannot resurrect a source or expose stale active status.
 return{source:await getBrandSource(tx,result.source.id)};
});}
