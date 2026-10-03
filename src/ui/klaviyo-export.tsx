'use client';
import type {KlaviyoReview} from '../domain/esp-export-contracts';
import type {MailchimpReview} from '../domain/mailchimp-export-contracts';
import type {OmnisendReview} from '../domain/omnisend-export-contracts';
import type {BrevoReview} from '../domain/brevo-export-contracts';
type Destination='klaviyo'|'mailchimp'|'omnisend'|'brevo';
export function DestinationExportPanel({destination,onDestination,canEdit,blocked,review,onReview,onDownload}:{destination:Destination;onDestination:(value:Destination)=>void;canEdit:boolean;blocked:boolean;review:KlaviyoReview|MailchimpReview|OmnisendReview|BrevoReview|null;onReview:()=>void;onDownload:(format:'html'|'txt')=>void}){
 const label=destination==='klaviyo'?'Klaviyo':destination==='mailchimp'?'Mailchimp':destination==='omnisend'?'Omnisend':'Brevo';
 return <section className="panel klaviyo-preparation" aria-label={label+' preparation'}>
  <h2>{label} {destination==='mailchimp'?'Classic template ':destination==='omnisend'?'HTML import ':destination==='brevo'?'marketing draft ':'template '}preparation</h2>
  <label>ESP destination<select aria-label="ESP destination" value={destination} onChange={e=>onDestination(e.target.value as Destination)}><option value="klaviyo">Klaviyo HTML template</option><option value="mailchimp">Mailchimp Classic HTML template</option><option value="omnisend">Omnisend HTML import</option><option value="brevo">Brevo marketing draft</option></select></label>
  <p className="small muted">Prepare a saved version with {label}’s unsubscribe link. This is a local download. Your original source stays in history.</p>
  <p className="alert warning">Remote export is disabled. OAuth connection, account permissions, real-client previews and destination verification remain unavailable.</p>
  {destination==='mailchimp'&&<p className="alert warning">Custom HTML requires Mailchimp Standard or higher. Native content fidelity and the template management link still need verification. This prepares Classic HTML with a local plaintext companion; native editable blocks are unavailable.</p>}
  {destination==='omnisend'&&<p className="alert warning">Omnisend HTML import has a 1 MB limit. Template name and encoded HTML count toward it. Native import fidelity and the management link still need verification. Plaintext is a local companion; native editable blocks are unavailable.</p>}
  {destination==='brevo'&&<p className="alert warning">Brevo marketing drafts need a subject and a verified sender. HTML must be below 1 MB. Sender and account access, native fidelity and the campaign management link still need verification. Plaintext is a local companion; no remote draft is created.</p>}
   {!canEdit?<p>Editing permission is required to prepare or download this destination.</p>:<><button type="button" disabled={blocked} onClick={onReview}>{(review?'Refresh ':'Review ')+label+' preparation'}</button>
  {review?<div><p role="status">Locally prepared frozen version. No remote template was created.</p><p className="small muted">Source {review.source_artifact_hash}<br/>Destination {review.destination_hash}</p><ul>{review.transformations.map(t=><li key={t}>{t}</li>)}</ul><div className="toolbar"><button type="button" disabled={blocked} onClick={()=>onDownload('html')}>Download {label} HTML</button><button type="button" disabled={blocked} onClick={()=>onDownload('txt')}>Download {label} plaintext</button></div></div>:<p className="small muted">Review the current version to enable local destination downloads. Raw/custom HTML, unresolved personalization and private images need a qualified mapping.</p>}</>}
 </section>;
}
