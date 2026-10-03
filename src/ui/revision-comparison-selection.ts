import{z}from'zod';
const pair=z.object({before:z.union([z.uuid(),z.literal('')]),after:z.union([z.uuid(),z.literal('')]),open:z.boolean()}).strict();
export type ComparisonSelection=z.infer<typeof pair>;
export type ComparisonScope={workspace:string;actor:string;email:string};
export const comparisonSelectionKey=(scope:ComparisonScope)=>'lettercape.revision-comparison.'+JSON.stringify([scope.workspace,scope.actor,scope.email]);
export function readComparisonSelection(scope:ComparisonScope,storage:Pick<Storage,'getItem'>):ComparisonSelection|null{const text=storage.getItem(comparisonSelectionKey(scope));if(text===null)return null;if(text.length>1000)throw Error('Stored checkpoint selection is invalid. Choose checkpoints again.');const value=pair.safeParse(JSON.parse(text));if(!value.success)throw Error('Stored checkpoint selection is invalid. Choose checkpoints again.');return value.data;}
export function writeComparisonSelection(scope:ComparisonScope,value:ComparisonSelection,storage:Pick<Storage,'setItem'>){storage.setItem(comparisonSelectionKey(scope),JSON.stringify(pair.parse(value)));}
