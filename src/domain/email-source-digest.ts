// Server-only SHA256. Browser callers import values/contracts and use Web Crypto.
import {createHash} from 'node:crypto';
import {canonicalSpecString,rawSourceBytes} from './email-source-values';
export function validateRawSource(source:string):{sha256:string;bytes:number}{
  const bytes=rawSourceBytes(source);return {sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};
}
export function canonicalSpecHash(spec:unknown):string{return createHash('sha256').update(canonicalSpecString(spec),'utf8').digest('hex');}
