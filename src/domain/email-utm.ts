import type{EmailSpec,Block}from'./email';
import{decorateMarketingHref,type UTMParameterData}from'./utm';import{decorateHtmlMarketingLinks}from'./utm-html';
export function trackingFingerprint(policy:UTMParameterData|undefined){return policy?JSON.stringify([policy.utm_source,policy.utm_medium,policy.utm_campaign]):'none';}
// This shared, browser-safe boundary checks only active marketing targets. The
// server schema/compiler remains authoritative for stored and frozen content.
export function assertEmailUTMTargets(spec:Pick<EmailSpec,'editing_mode'|'sections'|'raw_html'|'tracking'>,options:{skipOpaque?:boolean}={}){
 const policy=spec.tracking;if(!policy)return;const selectedPolicy:UTMParameterData=policy;
 if(spec.editing_mode==='raw_html'){decorateHtmlMarketingLinks(spec.raw_html??'',policy);return;}
 function check(block:Block){if(block.type==='columns')for(const child of block.columns.flat())check(child);else if(block.type==='button'||block.type==='product_card')decorateMarketingHref(block.href,selectedPolicy);else if(block.type==='social')for(const link of block.links)decorateMarketingHref(link.href,selectedPolicy);else if(block.type==='custom_html'&&!options.skipOpaque)decorateHtmlMarketingLinks(block.html,selectedPolicy);}
 for(const block of spec.sections)check(block);
}
export function copyProposalWithCurrentUTM(current:EmailSpec,proposal:EmailSpec):EmailSpec{
 const result=structuredClone(proposal);if(current.tracking)result.tracking=structuredClone(current.tracking);else delete result.tracking;
 assertEmailUTMTargets(result);return result;
}
