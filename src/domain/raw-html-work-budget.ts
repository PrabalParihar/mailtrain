import {MAX_RAW_PROJECTION_NODES} from './email-source-values';

// Linear, constant work per character. Incomplete starts count before parsing;
// '<' inside text/quotes/comments may conservatively exhaust this budget. Exact
// source is still admitted and retained when its projection is unavailable.
export function countMarkupStarts(source:string,maximum=MAX_RAW_PROJECTION_NODES):number{
 let count=0;
 for(let index=0;index<source.length;index++)if(source.charCodeAt(index)===60&&++count>maximum)return count;
 return count;
}
