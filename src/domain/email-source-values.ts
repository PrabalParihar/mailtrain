// Browser-safe source identity and limits. No parser, sanitizer or Node imports.
export const MAX_RAW_SOURCE_BYTES=2*1024*1024;
export const MAX_SOURCE_METADATA_BYTES=1024*1024;
export const MAX_SOURCE_COMMAND_JSON_BYTES=13*1024*1024+64*1024;
export const MAX_RAW_PROJECTION_BYTES=4*1024*1024;
export const MAX_RAW_PROJECTION_NODES=20000;
export const MAX_RAW_PROJECTION_DEPTH=64;
export const MAX_RAW_DIAGNOSTICS=100;

export class SourceValueError extends Error{
  constructor(public readonly code:'RAW_SOURCE_INVALID'|'RAW_SOURCE_TOO_LARGE'|'RAW_SOURCE_ENCODING_INVALID'|'SOURCE_VALUES_INVALID'|'SOURCE_METADATA_TOO_LARGE',message:string){super(message);this.name='SourceValueError';}
}
function representable(value:string){
  for(let i=0;i<value.length;i++){
    const n=value.charCodeAt(i);
    if(n===0)throw new SourceValueError('RAW_SOURCE_ENCODING_INVALID','NUL cannot be stored as exact source.');
    if(n>=0xD800&&n<=0xDBFF){const next=value.charCodeAt(++i);if(!(next>=0xDC00&&next<=0xDFFF))throw new SourceValueError('RAW_SOURCE_ENCODING_INVALID','Unpaired UTF16 surrogate cannot be stored as exact source.');}
    else if(n>=0xDC00&&n<=0xDFFF)throw new SourceValueError('RAW_SOURCE_ENCODING_INVALID','Unpaired UTF16 surrogate cannot be stored as exact source.');
  }
}
export function rawSourceBytes(source:string):Uint8Array{
  if(typeof source!=='string')throw new SourceValueError('RAW_SOURCE_INVALID','Raw source must be a string.');
  if(source.length>MAX_RAW_SOURCE_BYTES)throw new SourceValueError('RAW_SOURCE_TOO_LARGE','Raw source exceeds 2 MiB of UTF8 bytes.');
  representable(source);const bytes=new TextEncoder().encode(source);
  if(bytes.length>MAX_RAW_SOURCE_BYTES)throw new SourceValueError('RAW_SOURCE_TOO_LARGE','Raw source exceeds 2 MiB of UTF8 bytes.');
  return bytes;
}
export function decodeRawSource(bytes:Uint8Array):string{
  if(!(bytes instanceof Uint8Array))throw new SourceValueError('RAW_SOURCE_INVALID','Raw source bytes must be a Uint8Array.');
  if(bytes.byteLength>MAX_RAW_SOURCE_BYTES)throw new SourceValueError('RAW_SOURCE_TOO_LARGE','Raw source exceeds 2 MiB of UTF8 bytes.');
  let source:string;
  try{source=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw new SourceValueError('RAW_SOURCE_ENCODING_INVALID','Use valid UTF8 source without replacement decoding.');}
  rawSourceBytes(source);return source;
}
export function canonicalSpecString(value:unknown):string{
  const active=new Set<object>();
  const invalid=()=>{throw new SourceValueError('SOURCE_VALUES_INVALID','Use own JSON data without accessors, coercion, unsupported values or cycles.');};
  function visit(item:unknown,depth:number):string{
    if(depth>256)return invalid();
    if(item===null)return 'null';
    if(typeof item==='string'){representable(item);return JSON.stringify(item);}
    if(typeof item==='boolean')return String(item);
    if(typeof item==='number')return Number.isFinite(item)?JSON.stringify(item):invalid();
    if(typeof item!=='object')return invalid();
    if(active.has(item))return invalid();
    const array=Array.isArray(item),prototype=Object.getPrototypeOf(item);
    if(array?prototype!==Array.prototype:prototype!==Object.prototype&&prototype!==null)return invalid();
    const descriptors=Object.getOwnPropertyDescriptors(item),keys=Reflect.ownKeys(descriptors);
    if(keys.some(k=>typeof k!=='string'))return invalid();
    active.add(item);
    try{
      if(array){
        if(keys.length!==item.length+1||!Object.hasOwn(descriptors,'length'))return invalid();
        const entries:string[]=[];
        for(let i=0;i<item.length;i++){const d=descriptors[String(i)];if(!d||!d.enumerable||!Object.hasOwn(d,'value'))return invalid();entries.push(visit(d.value,depth+1));}
        return '['+entries.join(',')+']';
      }
      return '{'+(keys as string[]).sort().map(key=>{const d=descriptors[key];if(!d.enumerable||!Object.hasOwn(d,'value'))return invalid();representable(key);return JSON.stringify(key)+':'+visit(d.value,depth+1);}).join(',')+'}';
    }finally{active.delete(item);}
  }
  return visit(value,0);
}
export function validateSourceMetadata(spec:unknown):{bytes:number}{
  if(!spec||typeof spec!=='object'||Array.isArray(spec)||![Object.prototype,null].includes(Object.getPrototypeOf(spec)))throw new SourceValueError('SOURCE_VALUES_INVALID','Source metadata must be an own JSON object.');
  const descriptors=Object.getOwnPropertyDescriptors(spec),metadata=Object.create(null) as Record<string,unknown>;
  for(const key of Reflect.ownKeys(descriptors)){
    if(typeof key!=='string')throw new SourceValueError('SOURCE_VALUES_INVALID','Source metadata has a symbol property.');
    const d=descriptors[key];if(!d.enumerable||!Object.hasOwn(d,'value'))throw new SourceValueError('SOURCE_VALUES_INVALID','Source metadata must contain own data properties.');
    if(key==='raw_html'){rawSourceBytes(d.value);continue;}metadata[key]=d.value;
  }
  const bytes=new TextEncoder().encode(canonicalSpecString(metadata)).length;
  if(bytes>MAX_SOURCE_METADATA_BYTES)throw new SourceValueError('SOURCE_METADATA_TOO_LARGE','Non-source metadata exceeds 1 MiB.');
  return {bytes};
}
