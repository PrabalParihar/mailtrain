export type SourceChange={rangeOffset:number;rangeLength:number;text:string};

function sourceOffset(source:string,modelEol:string,offset:number,projectionPrefixLength:number):number{
 let rendered=0,index=projectionPrefixLength;
 while(index<source.length&&rendered<offset){
  const character=source[index++];
  if(character==='\r'||character==='\n'){
   if(character==='\r'&&source[index]==='\n')index++;
   rendered+=modelEol.length;
  }else rendered++;
 }
 return index;
}

// Changes use Monaco's UTF16 offsets. Existing source keeps its original line
// endings; newly inserted line breaks use the EOL supplied by Monaco's change.
export function applySourceChanges(source:string,modelEol:string,changes:readonly SourceChange[],projectionPrefixLength=0):string{
 for(const change of [...changes].sort((a,b)=>b.rangeOffset-a.rangeOffset)){
  const start=sourceOffset(source,modelEol,change.rangeOffset,projectionPrefixLength);
  const end=sourceOffset(source,modelEol,change.rangeOffset+change.rangeLength,projectionPrefixLength);
  source=source.slice(0,start)+change.text+source.slice(end);
 }
 return source;
}

// Textareas expose LF regardless of their controlled source. Compare that view
// and apply only the changed hunk to the original bytes. Inserted EOLs are LF.
export function applyBasicInput(source:string,value:string):string{
 const previous=source.replace(/\r\n|\r/g,'\n');
 if(previous===value)return source;
 let start=0,endPrevious=previous.length,endValue=value.length;
 while(start<endPrevious&&start<endValue&&previous[start]===value[start])start++;
 while(endPrevious>start&&endValue>start&&previous[endPrevious-1]===value[endValue-1]){endPrevious--;endValue--;}
 return applySourceChanges(source,'\n',[{rangeOffset:start,rangeLength:endPrevious-start,text:value.slice(start,endValue)}]);
}

export class SourceHistory{
 private entries=new Map<number,string>();
 private retainedBytes=0;
 constructor(private readonly maxBytes=32*1024*1024){}
 retain(version:number,source:string):boolean{
  const previous=this.entries.get(version);
  // Count UTF16 storage and a conservative per-entry allowance, including
  // empty values, so repeated versions cannot grow an unbounded registry.
  const next=this.retainedBytes-(previous===undefined?0:previous.length*2+64)+source.length*2+64;
  if(next>this.maxBytes)return false;
  this.entries.set(version,source);this.retainedBytes=next;return true;
 }
 get(version:number):string|undefined{return this.entries.get(version);}
 clear(){this.entries.clear();this.retainedBytes=0;}
}
