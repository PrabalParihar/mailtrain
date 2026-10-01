DO $$BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_creation_admin')THEN CREATE ROLE mailcraft_creation_admin NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_creation_worker')THEN CREATE ROLE mailcraft_creation_worker NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_creation_scheduler')THEN CREATE ROLE mailcraft_creation_scheduler NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;END IF;
END$$;
CREATE TABLE creation_jobs(workspace_id uuid NOT NULL,operation_id uuid NOT NULL,policy_version text NOT NULL DEFAULT 'creation-1'CHECK(policy_version='creation-1'),phase text NOT NULL DEFAULT 'pending'CHECK(phase IN('pending','leased','started','settled','unknown')),lease_token uuid,lease_epoch integer NOT NULL DEFAULT 0 CHECK(lease_epoch>=0),lease_until timestamptz,deadline_at timestamptz,next_at timestamptz NOT NULL DEFAULT clock_timestamp(),failure_attempts integer NOT NULL DEFAULT 0 CHECK(failure_attempts BETWEEN 0 AND 3),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,operation_id),FOREIGN KEY(workspace_id,operation_id)REFERENCES operations(workspace_id,id)ON DELETE CASCADE,CHECK((phase IN('leased','started'))=(lease_token IS NOT NULL AND lease_until IS NOT NULL)));
CREATE TABLE creation_attempts(workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),operation_id uuid NOT NULL,lease_epoch integer NOT NULL CHECK(lease_epoch>0),lease_token uuid NOT NULL,phase text NOT NULL CHECK(phase IN('claimed','started','settled','recovered')),outcome_code text CHECK(length(outcome_code)<=80),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,operation_id,lease_epoch,phase),FOREIGN KEY(workspace_id,operation_id)REFERENCES creation_jobs(workspace_id,operation_id)ON DELETE CASCADE);
CREATE TABLE creation_dispatch_state(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),last_workspace uuid);
INSERT INTO creation_dispatch_state(singleton)VALUES(true);
ALTER TABLE creation_jobs ENABLE ROW LEVEL SECURITY;ALTER TABLE creation_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE creation_attempts ENABLE ROW LEVEL SECURITY;ALTER TABLE creation_attempts FORCE ROW LEVEL SECURITY;
CREATE POLICY creation_job_service ON creation_jobs TO mailcraft_creation_admin USING(true)WITH CHECK(true);
CREATE POLICY creation_attempt_service ON creation_attempts TO mailcraft_creation_admin USING(true)WITH CHECK(true);
CREATE POLICY creation_job_read ON creation_jobs FOR SELECT TO mailcraft_runtime USING(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY creation_attempt_read ON creation_attempts FOR SELECT TO mailcraft_runtime USING(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY creation_operation_service ON operations TO mailcraft_creation_admin USING(true)WITH CHECK(true);
GRANT USAGE ON SCHEMA public TO mailcraft_creation_admin,mailcraft_creation_worker,mailcraft_creation_scheduler;
GRANT SELECT,INSERT,UPDATE ON creation_jobs TO mailcraft_creation_admin;
GRANT SELECT,INSERT ON creation_attempts TO mailcraft_creation_admin;
GRANT SELECT,UPDATE ON creation_dispatch_state TO mailcraft_creation_admin;
GRANT SELECT,UPDATE ON operations TO mailcraft_creation_admin;
GRANT SELECT(id,status)ON workspaces TO mailcraft_creation_admin;GRANT UPDATE(status)ON workspaces TO mailcraft_creation_admin;
GRANT SELECT(workspace_id,user_id,role,status)ON memberships TO mailcraft_creation_admin;GRANT UPDATE(version)ON memberships TO mailcraft_creation_admin;
GRANT SELECT(workspace_id,id,scopes,created_by,expires_at,revoked_at)ON api_keys TO mailcraft_creation_admin;GRANT UPDATE(id)ON api_keys TO mailcraft_creation_admin;
GRANT SELECT ON brands,brand_sources,brand_memory_chunks,usage_ledger TO mailcraft_creation_admin;
GRANT INSERT ON usage_ledger,outbox TO mailcraft_creation_admin;
GRANT SELECT(workspace_id,operation_id,policy_version,phase,lease_epoch,lease_until,deadline_at,next_at,failure_attempts,created_at)ON creation_jobs TO mailcraft_runtime;
GRANT SELECT(workspace_id,id,operation_id,lease_epoch,phase,outcome_code,recorded_at)ON creation_attempts TO mailcraft_runtime;
REVOKE DELETE ON operations FROM mailcraft_runtime;
REVOKE UPDATE ON operations FROM mailcraft_runtime;
GRANT UPDATE(state,result,error,started_at,completed_at)ON operations TO mailcraft_runtime;
CREATE INDEX creation_due ON creation_jobs(next_at,workspace_id)WHERE phase IN('pending','leased','started');

CREATE FUNCTION mailcraft_creation_enqueue()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE previous_context text:=current_setting('app.workspace_id',true);
BEGIN
 IF NEW.type NOT IN('brand.extract','email.generate')OR NEW.state<>'queued'THEN RETURN NEW;END IF;
 PERFORM set_config('app.workspace_id',NEW.workspace_id::text,true);
 PERFORM pg_advisory_xact_lock(hashtextextended('lettercape.creation.backlog.'||NEW.workspace_id::text,0));
 IF(SELECT count(*)FROM public.creation_jobs j JOIN public.operations o ON o.workspace_id=j.workspace_id AND o.id=j.operation_id WHERE j.workspace_id=NEW.workspace_id AND(j.phase='unknown'OR o.state IN('queued','running','cancel_requested')))>=1000 THEN RAISE EXCEPTION 'CREATION_BACKLOG_FULL';END IF;
 INSERT INTO public.creation_jobs(workspace_id,operation_id)VALUES(NEW.workspace_id,NEW.id);
 PERFORM set_config('app.workspace_id',coalesce(previous_context,''),true);RETURN NEW;
END$$;
CREATE TRIGGER creation_enqueue AFTER INSERT ON operations FOR EACH ROW EXECUTE FUNCTION mailcraft_creation_enqueue();

CREATE FUNCTION mailcraft_creation_authorized(w uuid,op uuid)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE source record;member record;credential record;workspace_status text;
BEGIN
 PERFORM set_config('app.workspace_id',w::text,true);
 SELECT status INTO workspace_status FROM public.workspaces WHERE id=w FOR SHARE;
 IF workspace_status IS DISTINCT FROM 'active'THEN RETURN false;END IF;
 SELECT created_by,created_api_key_id,type INTO source FROM public.operations WHERE workspace_id=w AND id=op;
 IF NOT FOUND THEN RETURN false;END IF;
 SELECT role,status INTO member FROM public.memberships WHERE workspace_id=w AND user_id=source.created_by FOR SHARE;
 IF NOT FOUND OR member.status<>'active'OR member.role NOT IN('Owner','Admin','Editor')THEN RETURN false;END IF;
 IF source.created_api_key_id IS NOT NULL THEN
  IF member.role NOT IN('Owner','Admin')THEN RETURN false;END IF;
  SELECT scopes,created_by,expires_at,revoked_at INTO credential FROM public.api_keys WHERE workspace_id=w AND id=source.created_api_key_id FOR SHARE;
  IF NOT FOUND OR credential.revoked_at IS NOT NULL OR credential.created_by<>source.created_by OR credential.expires_at<=clock_timestamp()OR NOT(credential.scopes?CASE WHEN source.type='brand.extract'THEN 'brands:write'ELSE 'emails:write'END)THEN RETURN false;END IF;
 END IF;RETURN true;
END$$;

CREATE FUNCTION mailcraft_creation_due()RETURNS TABLE(workspace_id uuid,operation_id uuid)LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH candidates AS(SELECT j.workspace_id,j.operation_id,j.next_at,row_number()OVER(PARTITION BY j.workspace_id ORDER BY j.next_at,j.operation_id)AS position FROM public.creation_jobs j JOIN public.operations o ON o.workspace_id=j.workspace_id AND o.id=j.operation_id WHERE(j.phase='pending'AND o.state='queued'AND j.next_at<=clock_timestamp())OR(j.phase IN('leased','started')AND j.lease_until<=clock_timestamp()))
 SELECT c.workspace_id,c.operation_id FROM candidates c CROSS JOIN public.creation_dispatch_state s ORDER BY c.position,CASE WHEN s.last_workspace IS NULL OR c.workspace_id>s.last_workspace THEN 0 ELSE 1 END,c.workspace_id LIMIT 25;
$$;

CREATE FUNCTION mailcraft_claim_creation(w uuid,op uuid,token uuid)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.creation_jobs;source public.operations;deadline timestamptz;authorized boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('lettercape.creation.capacity.v1',0));
 PERFORM set_config('app.workspace_id',w::text,true);
 authorized:=public.mailcraft_creation_authorized(w,op);
 SELECT * INTO job FROM public.creation_jobs WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR job.phase<>'pending'OR job.next_at>clock_timestamp()OR job.lease_epoch=2147483647 THEN RETURN NULL;END IF;
 SELECT * INTO source FROM public.operations WHERE workspace_id=w AND id=op FOR UPDATE;
 IF source.state<>'queued'THEN RETURN NULL;END IF;
 IF NOT authorized OR NOT public.mailcraft_creation_authorized(w,op)THEN
  UPDATE public.operations SET state='failed',error='{"code":"PERMISSION_REVOKED","message":"Authority changed before creation admission."}',completed_at=clock_timestamp()WHERE workspace_id=w AND id=op;
  UPDATE public.creation_jobs SET phase='settled',lease_token=NULL,lease_until=NULL WHERE workspace_id=w AND operation_id=op;
  INSERT INTO public.usage_ledger(workspace_id,operation_id,metric,kind,units)SELECT workspace_id,operation_id,metric,'release',units FROM public.usage_ledger WHERE workspace_id=w AND operation_id=op AND kind='reserve'ON CONFLICT DO NOTHING;
  RETURN NULL;
 END IF;
 IF(SELECT count(*)FROM public.creation_jobs WHERE phase IN('leased','started')AND lease_until>clock_timestamp())>=2 OR EXISTS(SELECT FROM public.creation_jobs WHERE workspace_id=w AND phase IN('leased','started')AND lease_until>clock_timestamp())THEN RETURN NULL;END IF;
 deadline:=coalesce(job.deadline_at,clock_timestamp()+interval '120 seconds');
 IF deadline<=clock_timestamp()THEN
  UPDATE public.operations SET state='failed',error='{"code":"CREATION_RETRY_WINDOW_EXHAUSTED","message":"Creation execution window ended before another external start."}',completed_at=clock_timestamp()WHERE workspace_id=w AND id=op;
  UPDATE public.creation_jobs SET phase='settled',lease_token=NULL,lease_until=NULL WHERE workspace_id=w AND operation_id=op;
  INSERT INTO public.usage_ledger(workspace_id,operation_id,metric,kind,units)SELECT workspace_id,operation_id,metric,'release',units FROM public.usage_ledger WHERE workspace_id=w AND operation_id=op AND kind='reserve'ON CONFLICT DO NOTHING;
  RETURN NULL;
 END IF;
 UPDATE public.creation_jobs SET phase='leased',lease_token=token,lease_epoch=lease_epoch+1,lease_until=least(clock_timestamp()+interval '30 seconds',deadline),deadline_at=deadline WHERE workspace_id=w AND operation_id=op RETURNING * INTO job;
 UPDATE public.operations SET state='running',started_at=coalesce(started_at,clock_timestamp())WHERE workspace_id=w AND id=op;
 UPDATE public.creation_dispatch_state SET last_workspace=w;
 INSERT INTO public.creation_attempts(workspace_id,operation_id,lease_epoch,lease_token,phase)VALUES(w,op,job.lease_epoch,token,'claimed');
 RETURN jsonb_build_object('workspace_id',w,'operation_id',op,'token',token,'lease_until',job.lease_until,'deadline_at',deadline);
END$$;

CREATE FUNCTION mailcraft_begin_creation(w uuid,op uuid,token uuid)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
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
 UPDATE public.creation_jobs SET phase='started'WHERE workspace_id=w AND operation_id=op;
 INSERT INTO public.creation_attempts(workspace_id,operation_id,lease_epoch,lease_token,phase)VALUES(w,op,job.lease_epoch,token,'started');
 RETURN jsonb_build_object('operation',to_jsonb(source),'brand',brand,'memory_candidates',coalesce(chunks,'[]'),'grant_until',least(clock_timestamp()+interval '5 seconds',job.lease_until));
END$$;

CREATE FUNCTION mailcraft_renew_creation(w uuid,op uuid,token uuid)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM set_config('app.workspace_id',w::text,true);
 IF NOT public.mailcraft_creation_authorized(w,op)THEN RETURN false;END IF;
 UPDATE public.creation_jobs j SET lease_until=least(clock_timestamp()+interval '30 seconds',deadline_at)WHERE workspace_id=w AND operation_id=op AND lease_token=token AND phase IN('leased','started')AND lease_until>clock_timestamp()AND deadline_at>clock_timestamp()AND EXISTS(SELECT FROM public.operations o WHERE o.workspace_id=w AND o.id=op AND o.state='running');
 RETURN FOUND;
END$$;

CREATE FUNCTION mailcraft_settle_creation(w uuid,op uuid,token uuid,outcome text,payload jsonb,retry_after_ms integer DEFAULT NULL)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
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
 ELSIF outcome='terminal'THEN target:='failed';accounting:=CASE WHEN source.type='email.generate'AND job.phase='started'THEN 'retain'ELSE 'release'END;code:='CREATION_TERMINAL';
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

CREATE FUNCTION mailcraft_recover_creation(w uuid,op uuid)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.creation_jobs;source public.operations;target text;accounting text;code text;failures integer;
BEGIN
 PERFORM set_config('app.workspace_id',w::text,true);PERFORM id FROM public.workspaces WHERE id=w FOR SHARE;
 SELECT * INTO job FROM public.creation_jobs WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR job.phase NOT IN('leased','started')OR job.lease_until>clock_timestamp()THEN RETURN false;END IF;
 SELECT * INTO source FROM public.operations WHERE workspace_id=w AND id=op FOR UPDATE;
 target:='queued';accounting:='retain';failures:=least(3,job.failure_attempts+CASE WHEN job.phase='started'AND source.type='brand.extract'THEN 1 ELSE 0 END);
 IF job.phase='started'AND source.type='email.generate'THEN target:='failed';accounting:='retain';code:='AI_RECONCILIATION_REQUIRED';
 ELSIF failures>=3 THEN target:='failed';accounting:='release';code:='CREATION_RETRY_EXHAUSTED';
 ELSIF job.deadline_at<=clock_timestamp()THEN target:='failed';accounting:='release';code:='CREATION_RETRY_WINDOW_EXHAUSTED';END IF;
 IF source.state IN('cancel_requested','cancelled')THEN target:='cancelled';IF job.phase='leased'OR source.type<>'email.generate'THEN accounting:='release';code:='CREATION_CANCELLED';END IF;END IF;
 UPDATE public.operations SET state=target,result=NULL,error=CASE WHEN code IS NULL THEN NULL ELSE jsonb_build_object('code',code,'message',CASE WHEN accounting='retain'THEN 'Provider outcome is unknown after interruption. Usage remains reserved; no retry was issued.'ELSE 'Creation execution window ended.'END,'accounting',accounting)END,completed_at=CASE WHEN target='queued'THEN NULL ELSE clock_timestamp()END WHERE workspace_id=w AND id=op;
 UPDATE public.creation_jobs SET phase=CASE WHEN target='queued'THEN 'pending'WHEN accounting='retain'THEN 'unknown'ELSE 'settled'END,lease_token=NULL,lease_until=NULL,next_at=clock_timestamp(),failure_attempts=failures WHERE workspace_id=w AND operation_id=op;
 INSERT INTO public.creation_attempts(workspace_id,operation_id,lease_epoch,lease_token,phase,outcome_code)VALUES(w,op,job.lease_epoch,job.lease_token,'recovered',code);
 IF target<>'queued'THEN INSERT INTO public.outbox(workspace_id,type,aggregate_id,data)VALUES(w,source.type||CASE WHEN target='cancelled'THEN '.cancelled'ELSE '.failed'END,op,jsonb_build_object('operation_id',op,'error_class',code));END IF;
 IF accounting='release'THEN INSERT INTO public.usage_ledger(workspace_id,operation_id,metric,kind,units)SELECT workspace_id,operation_id,metric,'release',units FROM public.usage_ledger WHERE workspace_id=w AND operation_id=op AND kind='reserve'ON CONFLICT DO NOTHING;END IF;
 RETURN true;
END$$;

GRANT CREATE ON SCHEMA public TO mailcraft_creation_admin;
DO $$DECLARE entry record;BEGIN FOR entry IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN('mailcraft_creation_enqueue','mailcraft_creation_authorized','mailcraft_creation_due','mailcraft_claim_creation','mailcraft_begin_creation','mailcraft_renew_creation','mailcraft_settle_creation','mailcraft_recover_creation')LOOP EXECUTE format('ALTER FUNCTION %s OWNER TO mailcraft_creation_admin',entry.signature);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',entry.signature);END LOOP;END$$;
REVOKE CREATE ON SCHEMA public FROM mailcraft_creation_admin;
GRANT EXECUTE ON FUNCTION mailcraft_creation_due(),mailcraft_recover_creation(uuid,uuid)TO mailcraft_creation_scheduler;
GRANT EXECUTE ON FUNCTION mailcraft_claim_creation(uuid,uuid,uuid),mailcraft_begin_creation(uuid,uuid,uuid),mailcraft_renew_creation(uuid,uuid,uuid),mailcraft_settle_creation(uuid,uuid,uuid,text,jsonb,integer)TO mailcraft_creation_worker;
