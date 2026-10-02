export type AiResponseFailure={outcome:'rate_limited'|'terminal'|'ambiguous';retry_after_ms?:number;code?:'AI_QUOTA_EXHAUSTED'|'AI_PROVIDER_ERROR'};
export function aiResponseFailure(status:number,body:unknown,retryAfter:string|null,now:number):AiResponseFailure{
 const error=body&&typeof body==='object'&&'error'in body?(body as{error?:{type?:unknown;code?:unknown}}).error:undefined;
 if(status===429){
  if(error?.type==='insufficient_quota'||error?.code==='insufficient_quota')return{outcome:'terminal',code:'AI_QUOTA_EXHAUSTED'};
  if(error?.type==='rate_limit_error'||['rate_limit_exceeded','slow_down'].includes(String(error?.code))){
   const seconds=retryAfter!==null&&/^\d+(?:\.\d+)?$/.test(retryAfter)?Number(retryAfter)*1000:retryAfter?Date.parse(retryAfter)-now:NaN;
   if(Number.isFinite(seconds)&&seconds>86400000)return{outcome:'terminal',code:'AI_PROVIDER_ERROR'};
   return{outcome:'rate_limited',retry_after_ms:Number.isFinite(seconds)?Math.max(1000,Math.ceil(seconds)):1000};
  }
  return{outcome:'terminal',code:'AI_PROVIDER_ERROR'};
 }
 return status>=500?{outcome:'ambiguous'}:{outcome:'terminal',code:'AI_PROVIDER_ERROR'};
}
