-- Additive correction: migration031 remains immutable.
-- Local conservative reconciliation barrier; no automated recovery is asserted.
CREATE OR REPLACE FUNCTION mailcraft_claim_media()RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE j public.media_jobs;token uuid;src public.assets;operation_state text;
BEGIN
 PERFORM pg_advisory_xact_lock(103103031);
 -- Lease expiry is not proof that a daemon child or paused writer stopped.
 -- Retain durable operation/token identity and every reservation until explicit
 -- operator reconciliation. No automatic crash retry or cleanup is admitted.
 FOR j IN SELECT * FROM public.media_jobs WHERE phase='leased'AND lease_until<=clock_timestamp()FOR UPDATE LOOP
  PERFORM set_config('app.workspace_id',j.workspace_id::text,true);
  UPDATE public.media_jobs SET phase='blocked' WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id;
  UPDATE public.operations SET state='failed',error='{"code":"MEDIA_RECONCILIATION_REQUIRED","message":"Worker ownership expired. Native child and writer termination are unproven; processing and accounting remain blocked."}',completed_at=clock_timestamp()WHERE workspace_id=j.workspace_id AND id=j.operation_id;
  UPDATE public.assets SET failure_code='MEDIA_RECONCILIATION_REQUIRED' WHERE workspace_id=j.workspace_id AND id=j.asset_id;
 END LOOP;
 IF EXISTS(SELECT FROM public.media_jobs WHERE phase IN('leased','blocked'))THEN RETURN NULL;END IF;
 SELECT * INTO j FROM public.media_jobs WHERE phase='pending'ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1;IF NOT FOUND THEN RETURN NULL;END IF;
 PERFORM set_config('app.workspace_id',j.workspace_id::text,true);
 IF j.attempts>=3 OR j.deadline_at<=clock_timestamp()OR NOT public.mailcraft_media_authorized(j.workspace_id,j.principal)OR EXISTS(SELECT FROM public.operations WHERE workspace_id=j.workspace_id AND id=j.operation_id AND state IN('cancel_requested','cancelled'))OR EXISTS(SELECT FROM public.assets WHERE workspace_id=j.workspace_id AND id=j.asset_id AND state IN('deleting','deleted'))THEN
  UPDATE public.media_jobs SET phase='settled'WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id;
  UPDATE public.operations SET state=CASE WHEN state IN('cancel_requested','cancelled')THEN 'cancelled'ELSE 'failed'END,error='{"code":"MEDIA_AUTHORITY_OR_DEADLINE","message":"Media admission expired or authority changed."}',completed_at=clock_timestamp()WHERE workspace_id=j.workspace_id AND id=j.operation_id;
  IF NOT EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id)THEN
   UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes FROM public.asset_uploads u WHERE asset_quotas.workspace_id=j.workspace_id AND u.workspace_id=j.workspace_id AND u.id=j.upload_id;
   UPDATE public.asset_uploads SET reserved_bytes=0 WHERE workspace_id=j.workspace_id AND id=j.upload_id;
  END IF;
  UPDATE public.assets SET state=CASE WHEN state='processing'THEN 'quarantined'ELSE state END,failure_code='MEDIA_AUTHORITY_OR_DEADLINE'WHERE workspace_id=j.workspace_id AND id=j.asset_id;
  RETURN NULL;
 END IF;
 SELECT * INTO src FROM public.assets WHERE workspace_id=j.workspace_id AND id=j.asset_id FOR SHARE;
 IF src.state IN('deleting','deleted')THEN RETURN NULL;END IF;
 SELECT state INTO operation_state FROM public.operations WHERE workspace_id=j.workspace_id AND id=j.operation_id FOR UPDATE;
 IF operation_state<>'queued'OR NOT public.mailcraft_media_authorized(j.workspace_id,j.principal)THEN
  UPDATE public.media_jobs SET phase='settled'WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id;
  IF NOT EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id)THEN
   UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes FROM public.asset_uploads u WHERE asset_quotas.workspace_id=j.workspace_id AND u.workspace_id=j.workspace_id AND u.id=j.upload_id;
   UPDATE public.asset_uploads SET reserved_bytes=0 WHERE workspace_id=j.workspace_id AND id=j.upload_id;
  END IF;
  RETURN NULL;
 END IF;
 token:=gen_random_uuid();UPDATE public.media_jobs SET phase='leased',lease_token=token,lease_until=least(clock_timestamp()+interval '30 seconds',deadline_at),attempts=attempts+1 WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id;
 UPDATE public.operations SET state='running',started_at=coalesce(started_at,clock_timestamp())WHERE workspace_id=j.workspace_id AND id=j.operation_id;
 UPDATE public.assets SET state=CASE WHEN state='ready_private'THEN state ELSE 'processing'END WHERE workspace_id=j.workspace_id AND id=j.asset_id;
 RETURN jsonb_build_object('workspace',j.workspace_id,'operation_id',j.operation_id,'asset_id',j.asset_id,'upload_id',j.upload_id,'principal',j.principal,'selected_frame',j.selected_frame,'token',token,'source_key',src.source_key,'source_sha256',src.source_sha256,'source_bytes',src.source_bytes);
END$$;

CREATE OR REPLACE FUNCTION mailcraft_media_object_cleanup_candidates(wanted_workspace uuid DEFAULT NULL,wanted_operation uuid DEFAULT NULL,proof_token uuid DEFAULT NULL)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE object public.asset_object_staging;o public.operations;u public.asset_uploads;result jsonb:='[]';invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);original_workspace text:=current_setting('app.workspace_id',true);
BEGIN
 IF invoker NOT IN('mailcraft_runtime','mailcraft_media_worker','mailcraft_media_scheduler')THEN
  IF pg_has_role(invoker,'mailcraft_runtime','USAGE')THEN invoker:='mailcraft_runtime';ELSIF pg_has_role(invoker,'mailcraft_media_worker','USAGE')THEN invoker:='mailcraft_media_worker';ELSIF pg_has_role(invoker,'mailcraft_media_scheduler','USAGE')THEN invoker:='mailcraft_media_scheduler';ELSE RETURN result;END IF;
 END IF;
 FOR object IN SELECT * FROM public.asset_object_staging WHERE(wanted_workspace IS NULL OR workspace_id=wanted_workspace)AND(wanted_operation IS NULL OR operation_id=wanted_operation)ORDER BY created_at LIMIT 200 LOOP
  IF EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=object.workspace_id AND operation_id=object.operation_id AND (phase='blocked'OR phase='leased'AND(invoker<>'mailcraft_media_worker'OR lease_token IS DISTINCT FROM proof_token OR lease_until<=clock_timestamp())))THEN CONTINUE;END IF;
  IF invoker='mailcraft_media_worker'AND NOT EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=object.workspace_id AND operation_id=object.operation_id AND lease_token=proof_token AND phase='leased')THEN CONTINUE;END IF;
  IF invoker='mailcraft_runtime'AND(object.workspace_id::text IS DISTINCT FROM original_workspace OR wanted_operation IS NULL)THEN CONTINUE;END IF;
  PERFORM set_config('app.workspace_id',object.workspace_id::text,true);
  SELECT * INTO o FROM public.operations WHERE workspace_id=object.workspace_id AND id=object.operation_id;SELECT * INTO u FROM public.asset_uploads WHERE workspace_id=object.workspace_id AND id=object.upload_id;
  IF invoker='mailcraft_runtime'AND u.created_by IS DISTINCT FROM current_setting('app.user_id',true)THEN CONTINUE;END IF;
  IF invoker='mailcraft_media_scheduler'AND NOT(o.state IN('failed','cancelled')OR u.expires_at<=clock_timestamp()OR u.status IN('failed','expired')OR EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=object.workspace_id AND operation_id=object.operation_id AND phase='leased'AND lease_until<=clock_timestamp()))THEN CONTINUE;END IF;
  IF EXISTS(SELECT FROM public.assets WHERE workspace_id=object.workspace_id AND source_key=object.object_key)OR EXISTS(SELECT FROM public.asset_variants WHERE workspace_id=object.workspace_id AND object_key=object.object_key)THEN CONTINUE;END IF;
  result:=result||jsonb_build_array(jsonb_build_object('workspace',object.workspace_id,'operation_id',object.operation_id,'upload_id',object.upload_id,'object_key',object.object_key,'bytes',object.bytes));
 END LOOP;RETURN result;
END$$;

CREATE OR REPLACE FUNCTION mailcraft_forget_media_object(w uuid,op uuid,key_name text,proof_token uuid DEFAULT NULL)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE u public.asset_uploads;invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);original_workspace text:=current_setting('app.workspace_id',true);
BEGIN
 IF invoker NOT IN('mailcraft_runtime','mailcraft_media_worker','mailcraft_media_scheduler')THEN
  IF pg_has_role(invoker,'mailcraft_runtime','USAGE')THEN invoker:='mailcraft_runtime';ELSIF pg_has_role(invoker,'mailcraft_media_worker','USAGE')THEN invoker:='mailcraft_media_worker';ELSIF pg_has_role(invoker,'mailcraft_media_scheduler','USAGE')THEN invoker:='mailcraft_media_scheduler';ELSE RETURN false;END IF;
 END IF;
 IF EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=w AND operation_id=op AND (phase='blocked'OR phase='leased'AND(invoker<>'mailcraft_media_worker'OR lease_token IS DISTINCT FROM proof_token OR lease_until<=clock_timestamp())))THEN RETURN false;END IF;
 IF invoker='mailcraft_media_worker'AND NOT EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=w AND operation_id=op AND lease_token=proof_token AND phase='leased')THEN RETURN false;END IF;
 IF invoker='mailcraft_runtime'AND w::text IS DISTINCT FROM original_workspace THEN RETURN false;END IF;
 PERFORM set_config('app.workspace_id',w::text,true);SELECT * INTO u FROM public.asset_uploads WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR(invoker='mailcraft_runtime'AND u.created_by IS DISTINCT FROM current_setting('app.user_id',true))THEN RETURN false;END IF;
 IF invoker='mailcraft_media_scheduler'AND NOT(u.expires_at<=clock_timestamp()OR u.status IN('failed','expired')OR EXISTS(SELECT FROM public.operations WHERE workspace_id=w AND id=op AND state IN('failed','cancelled'))OR EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=w AND operation_id=op AND phase='leased'AND lease_until<=clock_timestamp()))THEN RETURN false;END IF;
 IF EXISTS(SELECT FROM public.assets WHERE workspace_id=w AND source_key=key_name)OR EXISTS(SELECT FROM public.asset_variants WHERE workspace_id=w AND object_key=key_name)THEN RETURN false;END IF;
 DELETE FROM public.asset_object_staging WHERE workspace_id=w AND operation_id=op AND object_key=key_name;
 IF NOT EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=w AND operation_id=op)AND NOT EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=w AND operation_id=op AND phase IN('leased','blocked'))AND EXISTS(SELECT FROM public.operations WHERE workspace_id=w AND id=op AND state IN('failed','cancelled'))THEN
  UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes WHERE workspace_id=w;UPDATE public.asset_uploads SET reserved_bytes=0 WHERE workspace_id=w AND id=u.id;
 END IF;RETURN true;
END$$;
