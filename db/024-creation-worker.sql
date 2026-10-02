-- Prepare validated context before recording an irreversible external start.
DROP FUNCTION mailcraft_begin_creation(uuid,uuid,uuid);
CREATE FUNCTION mailcraft_creation_context(w uuid,op uuid,token uuid,record_start boolean)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.creation_jobs;source public.operations;authorized boolean;brand jsonb;chunks jsonb;
BEGIN
 PERFORM set_config('app.workspace_id',w::text,true);authorized:=public.mailcraft_creation_authorized(w,op);
 SELECT * INTO job FROM public.creation_jobs WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR job.phase<>'leased'OR job.lease_token<>token OR job.lease_until<=clock_timestamp()THEN RETURN NULL;END IF;
 SELECT * INTO source FROM public.operations WHERE workspace_id=w AND id=op FOR UPDATE;
 IF NOT authorized OR NOT public.mailcraft_creation_authorized(w,op)OR source.state<>'running'THEN
  UPDATE public.operations SET state=CASE WHEN state='cancel_requested'THEN 'cancelled'ELSE 'failed'END,error='{"code":"PERMISSION_REVOKED","message":"Authority or cancellation changed before the external start."}',completed_at=clock_timestamp()WHERE workspace_id=w AND id=op;
  UPDATE public.creation_jobs SET phase='settled',lease_token=NULL,lease_until=NULL WHERE workspace_id=w AND operation_id=op;
  INSERT INTO public.usage_ledger(workspace_id,operation_id,metric,kind,units)SELECT workspace_id,operation_id,metric,'release',units FROM public.usage_ledger WHERE workspace_id=w AND operation_id=op AND kind='reserve'ON CONFLICT DO NOTHING;
  RETURN NULL;
 END IF;
 IF source.type='email.generate'THEN
  SELECT data INTO brand FROM public.brands WHERE workspace_id=w AND id=(source.input->>'brand_kit_version_id')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'CREATION_CONTEXT_INVALID';END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(c)),'[]')INTO chunks FROM(SELECT c.id,c.source_id,s.title AS source_title,s.source_ref,c.content,c.content_digest,c.ordinal FROM public.brand_memory_chunks c JOIN public.brand_sources s ON s.workspace_id=c.workspace_id AND s.id=c.source_id WHERE c.workspace_id=w AND s.brand_kit_version_id=(source.input->>'brand_kit_version_id')::uuid AND s.deleted_at IS NULL ORDER BY c.id)c;
 END IF;
 IF record_start THEN
 UPDATE public.creation_jobs SET phase='started'WHERE workspace_id=w AND operation_id=op;
 INSERT INTO public.creation_attempts(workspace_id,operation_id,lease_epoch,lease_token,phase)VALUES(w,op,job.lease_epoch,token,'started');
 END IF;
 RETURN jsonb_build_object('operation',to_jsonb(source),'brand',brand,'memory_candidates',coalesce(chunks,'[]'),'grant_until',least(clock_timestamp()+interval '5 seconds',job.lease_until));
END$$;

CREATE FUNCTION mailcraft_prepare_creation(w uuid,op uuid,token uuid)RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$SELECT public.mailcraft_creation_context(w,op,token,false)$$;
CREATE FUNCTION mailcraft_begin_creation(w uuid,op uuid,token uuid)RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$SELECT public.mailcraft_creation_context(w,op,token,true)$$;
CREATE OR REPLACE FUNCTION mailcraft_settle_creation(w uuid,op uuid,token uuid,outcome text,payload jsonb,retry_after_ms integer DEFAULT NULL)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.creation_jobs;source public.operations;target text;accounting text;code text;failures integer;next_time timestamptz;delay_ms integer;
BEGIN
 IF outcome IS NULL OR outcome NOT IN('success','not_started','safe_transient','rate_limited','terminal','ambiguous')OR(outcome='success'AND(payload IS NULL OR jsonb_typeof(payload)<>'object'))OR retry_after_ms<0 OR retry_after_ms>86400000 OR octet_length(payload::text)>1048576 THEN RAISE EXCEPTION 'CREATION_OUTCOME_INVALID';END IF;
 PERFORM set_config('app.workspace_id',w::text,true);PERFORM id FROM public.workspaces WHERE id=w FOR SHARE;
 SELECT * INTO job FROM public.creation_jobs WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR job.phase NOT IN('leased','started')OR job.lease_token<>token OR job.lease_until<=clock_timestamp()THEN RETURN false;END IF;
 IF(job.phase='leased'AND outcome IN('success','ambiguous'))OR(job.phase='started'AND outcome='not_started')THEN RAISE EXCEPTION 'CREATION_OUTCOME_INVALID';END IF;
 SELECT * INTO source FROM public.operations WHERE workspace_id=w AND id=op FOR UPDATE;
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
 IF source.state IN('cancel_requested','cancelled')THEN target:='cancelled';IF outcome<>'success'AND NOT(source.type='email.generate'AND job.phase='started'AND outcome IN('ambiguous','terminal'))THEN accounting:='release';END IF;code:=CASE WHEN accounting='retain'THEN 'AI_RECONCILIATION_REQUIRED'ELSE 'CREATION_CANCELLED'END;END IF;
 UPDATE public.operations SET state=target,result=CASE WHEN target='succeeded'THEN payload ELSE NULL END,error=CASE WHEN code IS NULL THEN NULL ELSE jsonb_build_object('code',code,'message',CASE WHEN accounting='retain'THEN 'Provider accounting remains unresolved. No automatic retry was issued.'ELSE 'Creation ended without applying a proposal.'END,'accounting',accounting)END,completed_at=CASE WHEN target='queued'THEN NULL ELSE clock_timestamp()END WHERE workspace_id=w AND id=op;
 UPDATE public.creation_jobs SET phase=CASE WHEN target='queued'THEN 'pending'WHEN accounting='retain'THEN 'unknown'ELSE 'settled'END,lease_token=NULL,lease_until=NULL,next_at=CASE WHEN target='queued'THEN next_time ELSE next_at END,failure_attempts=failures WHERE workspace_id=w AND operation_id=op;
 INSERT INTO public.creation_attempts(workspace_id,operation_id,lease_epoch,lease_token,phase,outcome_code)VALUES(w,op,job.lease_epoch,token,'settled',code);
 IF target<>'queued'THEN INSERT INTO public.outbox(workspace_id,type,aggregate_id,data)VALUES(w,source.type||CASE WHEN target='succeeded'THEN '.completed'WHEN target='cancelled'THEN '.cancelled'ELSE '.failed'END,op,jsonb_build_object('operation_id',op,'error_class',code));END IF;
 IF accounting IN('consume','release')THEN INSERT INTO public.usage_ledger(workspace_id,operation_id,metric,kind,units)SELECT workspace_id,operation_id,metric,accounting,units FROM public.usage_ledger WHERE workspace_id=w AND operation_id=op AND kind='reserve'ON CONFLICT DO NOTHING;END IF;
 RETURN true;
END$$;

GRANT CREATE ON SCHEMA public TO mailcraft_creation_admin;
DO $$DECLARE entry record;BEGIN FOR entry IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN('mailcraft_creation_context','mailcraft_prepare_creation','mailcraft_begin_creation')LOOP EXECUTE format('ALTER FUNCTION %s OWNER TO mailcraft_creation_admin',entry.signature);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',entry.signature);END LOOP;END$$;
REVOKE CREATE ON SCHEMA public FROM mailcraft_creation_admin;
GRANT EXECUTE ON FUNCTION mailcraft_prepare_creation(uuid,uuid,uuid),mailcraft_begin_creation(uuid,uuid,uuid)TO mailcraft_creation_worker;
REVOKE EXECUTE ON FUNCTION mailcraft_due_operations()FROM mailcraft_runtime;
-- Migration boundary adopts older durable SQL work. Never infer safety for a legacy AI start.
INSERT INTO creation_jobs(workspace_id,operation_id,phase,lease_epoch)SELECT workspace_id,id,CASE WHEN type='email.generate'AND state IN('running','cancel_requested')THEN 'unknown'ELSE 'pending'END,CASE WHEN state IN('running','cancel_requested')THEN 1 ELSE 0 END FROM operations WHERE type IN('brand.extract','email.generate')AND state IN('queued','running','cancel_requested')ON CONFLICT DO NOTHING;
INSERT INTO creation_attempts(workspace_id,operation_id,lease_epoch,lease_token,phase,outcome_code)SELECT j.workspace_id,j.operation_id,1,gen_random_uuid(),'recovered','AI_RECONCILIATION_REQUIRED'FROM creation_jobs j JOIN operations o ON o.workspace_id=j.workspace_id AND o.id=j.operation_id WHERE j.phase='unknown'AND o.state IN('running','cancel_requested')ON CONFLICT DO NOTHING;
UPDATE operations o SET state=CASE WHEN state='cancel_requested'THEN 'cancelled'ELSE 'failed'END,error='{"code":"AI_RECONCILIATION_REQUIRED","message":"Legacy provider start has no definitive acknowledgment. Usage remains reserved; no retry was issued.","accounting":"retain"}',completed_at=clock_timestamp()WHERE type='email.generate'AND state IN('running','cancel_requested')AND EXISTS(SELECT FROM creation_jobs j WHERE j.workspace_id=o.workspace_id AND j.operation_id=o.id AND j.phase='unknown');
UPDATE operations o SET state=CASE WHEN state='cancel_requested'THEN 'cancelled'ELSE 'queued'END WHERE type='brand.extract'AND state IN('running','cancel_requested')AND EXISTS(SELECT FROM creation_jobs j WHERE j.workspace_id=o.workspace_id AND j.operation_id=o.id AND j.phase='pending');
CREATE FUNCTION mailcraft_creation_route(w uuid,op uuid)RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$SELECT o.type FROM public.operations o JOIN public.creation_jobs j ON j.workspace_id=o.workspace_id AND j.operation_id=o.id WHERE o.workspace_id=w AND o.id=op$$;
GRANT CREATE ON SCHEMA public TO mailcraft_creation_admin;
ALTER FUNCTION mailcraft_creation_route(uuid,uuid)OWNER TO mailcraft_creation_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_creation_admin;
REVOKE ALL ON FUNCTION mailcraft_creation_route(uuid,uuid)FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_creation_route(uuid,uuid)TO mailcraft_creation_scheduler;
CREATE OR REPLACE FUNCTION mailcraft_renew_creation(w uuid,op uuid,token uuid)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.creation_jobs;
BEGIN
 PERFORM set_config('app.workspace_id',w::text,true);
 IF NOT public.mailcraft_creation_authorized(w,op)THEN RETURN false;END IF;
 SELECT * INTO job FROM public.creation_jobs WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR job.lease_token<>token OR job.phase NOT IN('leased','started')OR job.lease_until<=clock_timestamp()OR job.deadline_at<=clock_timestamp()OR NOT public.mailcraft_creation_authorized(w,op)THEN RETURN false;END IF;
 UPDATE public.creation_jobs SET lease_until=least(clock_timestamp()+interval '30 seconds',deadline_at)WHERE workspace_id=w AND operation_id=op AND EXISTS(SELECT FROM public.operations o WHERE o.workspace_id=w AND o.id=op AND o.state='running');
 RETURN FOUND;
END$$;
