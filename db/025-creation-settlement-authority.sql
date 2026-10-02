-- Recheck current authority in lock order and after waits; known charges settle once, revoked proposals are suppressed.
CREATE OR REPLACE FUNCTION mailcraft_settle_creation(w uuid,op uuid,token uuid,outcome text,payload jsonb,retry_after_ms integer DEFAULT NULL)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.creation_jobs;source public.operations;target text;accounting text;code text;failures integer;next_time timestamptz;delay_ms integer;authorized boolean;
BEGIN
 IF outcome IS NULL OR outcome NOT IN('success','not_started','safe_transient','rate_limited','terminal','ambiguous')OR(outcome='success'AND(payload IS NULL OR jsonb_typeof(payload)<>'object'))OR retry_after_ms<0 OR retry_after_ms>86400000 OR octet_length(payload::text)>1048576 THEN RAISE EXCEPTION 'CREATION_OUTCOME_INVALID';END IF;
 PERFORM set_config('app.workspace_id',w::text,true);PERFORM id FROM public.workspaces WHERE id=w FOR SHARE;authorized:=public.mailcraft_creation_authorized(w,op);
 SELECT * INTO job FROM public.creation_jobs WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR job.phase NOT IN('leased','started')OR job.lease_token<>token OR job.lease_until<=clock_timestamp()THEN RETURN false;END IF;
 IF(job.phase='leased'AND outcome IN('success','ambiguous'))OR(job.phase='started'AND outcome='not_started')THEN RAISE EXCEPTION 'CREATION_OUTCOME_INVALID';END IF;
 SELECT * INTO source FROM public.operations WHERE workspace_id=w AND id=op FOR UPDATE;
 authorized:=authorized AND public.mailcraft_creation_authorized(w,op);
 failures:=least(3,job.failure_attempts+CASE WHEN outcome IN('safe_transient','ambiguous')AND NOT(source.type='email.generate'AND outcome='ambiguous')THEN 1 ELSE 0 END);
 IF outcome='success'THEN target:='succeeded';accounting:='consume';
 ELSIF source.type='email.generate'AND outcome='ambiguous'THEN target:='failed';accounting:='retain';code:='AI_RECONCILIATION_REQUIRED';
 ELSIF outcome='terminal'THEN target:='failed';accounting:=CASE WHEN source.type='email.generate'AND job.phase='started'THEN 'retain'ELSE 'release'END;code:=CASE WHEN payload->>'failure_code'IN('PROVIDER_NOT_READY','CREATION_CONTEXT_INVALID','UNSAFE_URL','REDIRECT_LIMIT','AI_REFUSAL','AI_TRUNCATED','AI_SCHEMA_INVALID','AI_PROVIDER_ERROR','AI_QUOTA_EXHAUSTED')THEN payload->>'failure_code'ELSE 'CREATION_TERMINAL'END;
 ELSE
  delay_ms:=CASE WHEN outcome='rate_limited'THEN greatest(1000,coalesce(retry_after_ms,1000))WHEN outcome='not_started'THEN 1000 ELSE ceil(1000*power(2,greatest(0,failures-1))*(0.5+random()*0.5))::int END;
  next_time:=clock_timestamp()+delay_ms*interval '1 millisecond';target:='queued';accounting:='retain';
  IF failures>=3 THEN target:='failed';accounting:='release';code:='CREATION_RETRY_EXHAUSTED';
  ELSIF next_time>=job.deadline_at THEN target:='failed';accounting:='release';code:='CREATION_RETRY_WINDOW_EXHAUSTED';END IF;
 END IF;
 IF NOT authorized THEN target:='cancelled';IF outcome<>'success'AND NOT(source.type='email.generate'AND job.phase='started'AND outcome IN('ambiguous','terminal'))THEN accounting:='release';END IF;code:=CASE WHEN accounting='retain'THEN 'AI_RECONCILIATION_REQUIRED'ELSE 'PERMISSION_REVOKED'END;END IF;
 IF source.state IN('cancel_requested','cancelled')THEN target:='cancelled';IF outcome<>'success'AND NOT(source.type='email.generate'AND job.phase='started'AND outcome IN('ambiguous','terminal'))THEN accounting:='release';END IF;code:=CASE WHEN accounting='retain'THEN 'AI_RECONCILIATION_REQUIRED'ELSE 'CREATION_CANCELLED'END;END IF;
 UPDATE public.operations SET state=target,result=CASE WHEN target='succeeded'THEN payload ELSE NULL END,error=CASE WHEN code IS NULL THEN NULL ELSE jsonb_build_object('code',code,'message',CASE WHEN accounting='retain'THEN 'Provider accounting remains unresolved. No automatic retry was issued.'ELSE 'Creation ended without applying a proposal.'END,'accounting',accounting)END,completed_at=CASE WHEN target='queued'THEN NULL ELSE clock_timestamp()END WHERE workspace_id=w AND id=op;
 UPDATE public.creation_jobs SET phase=CASE WHEN target='queued'THEN 'pending'WHEN accounting='retain'THEN 'unknown'ELSE 'settled'END,lease_token=NULL,lease_until=NULL,next_at=CASE WHEN target='queued'THEN next_time ELSE next_at END,failure_attempts=failures WHERE workspace_id=w AND operation_id=op;
 INSERT INTO public.creation_attempts(workspace_id,operation_id,lease_epoch,lease_token,phase,outcome_code)VALUES(w,op,job.lease_epoch,token,'settled',code);
 IF target<>'queued'THEN INSERT INTO public.outbox(workspace_id,type,aggregate_id,data)VALUES(w,source.type||CASE WHEN target='succeeded'THEN '.completed'WHEN target='cancelled'THEN '.cancelled'ELSE '.failed'END,op,jsonb_build_object('operation_id',op,'error_class',code));END IF;
 IF accounting IN('consume','release')THEN INSERT INTO public.usage_ledger(workspace_id,operation_id,metric,kind,units)SELECT workspace_id,operation_id,metric,accounting,units FROM public.usage_ledger WHERE workspace_id=w AND operation_id=op AND kind='reserve'ON CONFLICT DO NOTHING;END IF;
 RETURN true;
END$$;
