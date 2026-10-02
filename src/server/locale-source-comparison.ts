import type {Tx} from './db';import type {Principal} from './auth';
import {assertCurrentAuthority} from './current-authority';import {fail} from './errors';import {emailLineage} from './emails';
import {LocaleComparisonSchema} from '../domain/locale-source-comparison';
export async function localeSourceComparison(tx:Tx,p:Principal,id:string){
 await assertCurrentAuthority(tx,p,'read',p.api_key?'emails:read':undefined);
 const target=(await tx.query('SELECT id,title,doc_version,spec FROM emails WHERE id=$1 FOR SHARE',[id])).rows[0];if(!target)fail(404,'RESOURCE_NOT_FOUND','Locale draft not found.');
 const lineage=await emailLineage(tx,id);if(lineage?.kind!=='locale')fail(409,'LOCALE_DRAFT_REQUIRED','Choose a linked locale draft for source comparison.');
 const parent=(await tx.query('SELECT id,title,doc_version,spec FROM emails WHERE id=$1 FOR SHARE',[lineage.source_email_id])).rows[0];if(!parent)fail(404,'RESOURCE_NOT_FOUND','Parent source not found.');
 const baseline=(await tx.query('SELECT id AS revision_id,revision_no,source_doc_version,spec FROM revisions WHERE id=$1 AND email_id=$2',[lineage.source_revision_id,parent.id])).rows[0];if(!baseline)fail(404,'RESOURCE_NOT_FOUND','Original source revision not found.');
 // Bound the three full inert documents before response serialization. This is
 // comparison admission only; it never limits durable source storage or erases it.
 if([baseline.spec,parent.spec,target.spec].reduce((bytes,spec)=>bytes+Buffer.byteLength(JSON.stringify(spec)),0)>8*1024*1024)fail(413,'LOCALE_COMPARISON_TOO_LARGE','The three source documents exceed the comparison budget. Exact source and your draft remain intact; review their source separately.');
 await assertCurrentAuthority(tx,p,'read',p.api_key?'emails:read':undefined);
 return LocaleComparisonSchema.parse({workspace_id:p.workspace,actor_id:p.user,child_id:id,parent,target,baseline,source_status:baseline.source_doc_version===null?'unknown':baseline.source_doc_version===parent.doc_version?'current':'outdated'});
}
