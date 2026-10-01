import {domainToASCII} from 'node:url';
export function normalizeEmail(value:string){
 const at=value.trim().lastIndexOf('@');if(at<1)throw new Error('Invalid email');const local=value.trim().slice(0,at);const domain=domainToASCII(value.trim().slice(at+1)).toLowerCase();
 if(!domain.includes('.')||/[\s<>]/.test(local)||!local||local.length>64)throw new Error('Invalid email');const original=local+'@'+domain;if(original.length>254)throw new Error('Invalid email');return {original,lookup:original.toLowerCase()};
}
export function eligibility(c:{subscription:string,suppressed:boolean,deleted:boolean}){if(c.deleted)return {eligible:false,reason:'CONTACT_DELETED'};if(c.suppressed)return {eligible:false,reason:'SUPPRESSED'};if(c.subscription!=='subscribed')return {eligible:false,reason:'CONSENT_NOT_CONFIRMED'};return {eligible:true,reason:'ELIGIBLE'};}
