import{RevisionComparisonQuery}from'../domain/revision-comparison';import{withPrincipal}from'./auth';import{fail}from'./errors';import{compareRevisions}from'./revision-comparison';
export async function revisionComparisonRoute(req:Request){
 const params=new URL(req.url).searchParams,values:Record<string,string>={};
 for(const[key,value]of params){if(!['email_id','before','after'].includes(key)||Object.hasOwn(values,key))fail(422,'VALIDATION_FAILED','Choose email_id, before and after once each.');values[key]=value;}
 const input=RevisionComparisonQuery.parse(values);return withPrincipal(req,'read',async(tx,p)=>({comparison:await compareRevisions(tx,p,input)}));
}
