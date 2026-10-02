import{z}from'zod';import type{Finding}from'./email';
export const ToneRules=z.object({max_sentence_words:z.number().int().min(1).max(200).optional(),max_exclamations:z.number().int().min(0).max(100).optional()}).strict();
export type ToneRuleData=z.infer<typeof ToneRules>;
// Mechanical per-field checks. They do not infer semantic tone or rewrite content.
export function toneFindings(text:string,location:string,provided:ToneRuleData):Finding[]{
 const rules=ToneRules.parse(provided),findings:Finding[]=[];
 if(rules.max_sentence_words!==undefined){let longest=0;for(const sentence of text.split(/[.!?。！？؟\n]+/u)){const count=(sentence.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:['’\-][\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*/gu)??[]).length;longest=Math.max(longest,count);}if(longest>rules.max_sentence_words)findings.push({code:'VOICE_SENTENCE_LENGTH',severity:'warning',location,message:`This field has a mechanically counted sentence of ${longest} words; the pinned brand limit is ${rules.max_sentence_words}. Review the copy.`});}
 if(rules.max_exclamations!==undefined){const count=(text.match(/[!！]/gu)??[]).length;if(count>rules.max_exclamations)findings.push({code:'VOICE_EXCLAMATIONS',severity:'warning',location,message:`This field has ${count} exclamation marks; the pinned brand limit is ${rules.max_exclamations}. Review the copy.`});}
 return findings;
}
