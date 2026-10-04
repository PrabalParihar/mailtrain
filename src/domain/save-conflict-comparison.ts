import type {EmailSpec} from './email-schema';
import type {SourceProfile} from './email-source-contracts';
import {SavedEmailResponseSchema} from './email-source-contracts';
import {EmailSourceSpecSchema} from './email-schema';
import {canonicalSpecString} from './email-source-values';
import {revisionComparisonRows,type RevisionChange} from './revision-comparison';
import {z} from 'zod';
export type ConflictDocument={id:string;title:string;doc_version:number;spec:EmailSpec;raw_source_profile?:SourceProfile|null};
export type ConflictScope={workspace:string;actor:string;email:string};
export function saveConflictRows(local:ConflictDocument,server:ConflictDocument):RevisionChange[]{
 const metadata=(key:string,label:string,a:unknown,b:unknown):RevisionChange=>({key,label,kind:'metadata',before:a===undefined?'(Absent)':typeof a==='string'?a:canonicalSpecString(a),after:b===undefined?'(Absent)':typeof b==='string'?b:canonicalSpecString(b),changed:a===undefined||b===undefined?a!==b:canonicalSpecString(a)!==canonicalSpecString(b),before_present:a!==undefined,after_present:b!==undefined});
 return [metadata('document_title','Document title',local.title,server.title),metadata('document_source_profile','Source profile',local.raw_source_profile,server.raw_source_profile),...revisionComparisonRows(local.spec,server.spec).map(row=>row.key==='raw_html'||row.key==='stored_sections'?{...row,label:row.label.replace('checkpoints','documents')}:row)];
}
export function conflictComparisonIdentity(scope:ConflictScope,doc:ConflictDocument):string{return canonicalSpecString([scope.workspace,scope.actor,scope.email,doc.id,doc.title,doc.doc_version,doc.raw_source_profile===undefined?[]:[doc.raw_source_profile],doc.spec]);}
export function checkedConflictDocument(input:unknown,email:string,workspace?:string):ConflictDocument{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid conflict document.');const value=input as Record<string,unknown>;
 if(value.workspace_id!==undefined&&workspace&&z.uuid().parse(value.workspace_id).toLowerCase()!==workspace.toLowerCase())throw Error('The refreshed document belongs to a different workspace.');
 const doc=SavedEmailResponseSchema.shape.email.parse({id:value.id,title:value.title,doc_version:value.doc_version,spec:value.spec,...(value.updated_at!==undefined?{updated_at:value.updated_at}:{}),...(value.lineage!==undefined?{lineage:value.lineage}:{}),...(value.raw_source_profile!==undefined?{raw_source_profile:value.raw_source_profile}:{})});if(doc.id!==email)throw Error('The refreshed document belongs to a different email.');
 return {...doc,spec:EmailSourceSpecSchema.parse(doc.spec)};
}
export function conflictExcerpt(value:string,peer:string,source:boolean):{value:string;partial:boolean}{
 let start=0;if(value.length>8192&&value!==peer){let at=0;while(at<Math.min(value.length,peer.length)&&value[at]===peer[at])at++;start=Math.max(0,Math.min(at,value.length-1)-500);}
 if(start>0&&/[\uDC00-\uDFFF]/.test(value[start])&&/[\uD800-\uDBFF]/.test(value[start-1]))start--;
 let sample=value.slice(start,start+8192);if(/[\uD800-\uDBFF]$/.test(sample))sample=sample.slice(0,-1);
 return{value:source?JSON.stringify(sample).replaceAll('\ufeff','\\ufeff'):sample,partial:start>0||start+sample.length<value.length};
}
