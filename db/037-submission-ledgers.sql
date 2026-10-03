-- Durable staging only. No send authority, provider attempts, quota or frequency writes.
CREATE TABLE submission_ledgers (
 workspace_id uuid NOT NULL REFERENCES workspaces(id), id uuid NOT NULL DEFAULT gen_random_uuid(),
 campaign_id uuid NOT NULL, configuration_id uuid NOT NULL, configuration_version integer NOT NULL CHECK(configuration_version>0),
 configuration_digest text NOT NULL CHECK(configuration_digest~'^[0-9a-f]{64}$'), revision_id uuid NOT NULL,
 artifact_hash text NOT NULL CHECK(artifact_hash~'^[0-9a-f]{64}$'), snapshot_id uuid NOT NULL,
 snapshot_digest text NOT NULL CHECK(snapshot_digest~'^[0-9a-f]{64}$'),
 members jsonb NOT NULL CHECK(jsonb_typeof(members)='array' AND jsonb_array_length(members)<=10000),
 total_count integer NOT NULL CHECK(total_count BETWEEN 0 AND 10000 AND total_count=jsonb_array_length(members)),
 created_by text NOT NULL, created_api_key_id uuid, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 authorization_issued boolean NOT NULL DEFAULT false CHECK(NOT authorization_issued),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,configuration_id), UNIQUE(workspace_id,id,configuration_id),
 FOREIGN KEY(workspace_id,campaign_id) REFERENCES campaigns(workspace_id,id),
 FOREIGN KEY(workspace_id,configuration_id) REFERENCES campaign_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,snapshot_id) REFERENCES audience_snapshots(workspace_id,id),
 FOREIGN KEY(workspace_id,created_api_key_id) REFERENCES api_keys(workspace_id,id)
);
CREATE TABLE submission_ledger_jobs (
 workspace_id uuid NOT NULL, id uuid NOT NULL, status text NOT NULL DEFAULT 'queued' CHECK(status IN('queued','running','completed','cancelled','failed')),
 processed_count integer NOT NULL DEFAULT 0 CHECK(processed_count BETWEEN 0 AND 10000),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), completed_at timestamptz,
 batch_xid bigint, batch_start integer NOT NULL DEFAULT 0,
 PRIMARY KEY(workspace_id,id), FOREIGN KEY(workspace_id,id) REFERENCES submission_ledgers(workspace_id,id),
 CHECK((status IN('completed','cancelled','failed'))=(completed_at IS NOT NULL))
);
CREATE TABLE campaign_recipients (
 workspace_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), ledger_id uuid NOT NULL, configuration_id uuid NOT NULL,
 contact_id uuid NOT NULL, captured_locale text NOT NULL, captured_reason text NOT NULL CHECK(captured_reason IN('ELIGIBLE','SUPPRESSED','CONTACT_DELETED','CONSENT_NOT_CONFIRMED')),
 captured_consent_version integer NOT NULL CHECK(captured_consent_version>0),
 logical_send_key text NOT NULL CHECK(logical_send_key~'^[0-9a-f]{64}$'), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,configuration_id,contact_id), UNIQUE(workspace_id,logical_send_key),
 UNIQUE(workspace_id,id,ledger_id), FOREIGN KEY(workspace_id,ledger_id,configuration_id) REFERENCES submission_ledgers(workspace_id,id,configuration_id)
 -- Contacts can be historical or missing. Identity never depends on a live contact FK.
);
CREATE TABLE deliveries (
 workspace_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), recipient_id uuid NOT NULL, ledger_id uuid NOT NULL,
 submission_state text NOT NULL CHECK(submission_state IN('pending','skipped','cancelled')),
 outcome text NOT NULL DEFAULT 'unknown' CHECK(outcome='unknown'), authorization_issued boolean NOT NULL DEFAULT false CHECK(NOT authorization_issued),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,recipient_id),
 FOREIGN KEY(workspace_id,recipient_id,ledger_id) REFERENCES campaign_recipients(workspace_id,id,ledger_id)
);
CREATE TABLE delivery_state_history (
 workspace_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), delivery_id uuid NOT NULL,
 submission_state text NOT NULL CHECK(submission_state IN('pending','skipped','cancelled')),
 outcome text NOT NULL CHECK(outcome='unknown'), reason text NOT NULL CHECK(reason IN('ELIGIBLE','SUPPRESSED','CONTACT_DELETED','CONSENT_NOT_CONFIRMED','STAGING_CANCELLED')),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), PRIMARY KEY(workspace_id,id),
 FOREIGN KEY(workspace_id,delivery_id) REFERENCES deliveries(workspace_id,id)
);
CREATE TABLE delivery_attempts (
 workspace_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), delivery_id uuid NOT NULL, attempt_no integer NOT NULL CHECK(attempt_no>0),
 submission_state text NOT NULL CHECK(submission_state IN('submitting','accepted','uncertain','failed_permanent')),
 request_started_at timestamptz NOT NULL, accepted_at timestamptz, error_class text CHECK(error_class IN('transport','provider_rejected','unknown')),
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,delivery_id,attempt_no),
 FOREIGN KEY(workspace_id,delivery_id) REFERENCES deliveries(workspace_id,id),
 CHECK(false) -- A future qualified migration must supply real admission before an attempt can exist.
);
DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['submission_ledgers','submission_ledger_jobs','campaign_recipients','deliveries','delivery_state_history','delivery_attempts'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON %I FROM PUBLIC,mailcraft_runtime',t);
  EXECUTE format('GRANT SELECT ON %I TO mailcraft_runtime',t);
  EXECUTE format('CREATE POLICY submission_read ON %I FOR SELECT TO mailcraft_runtime USING(mailcraft_assessment_manager(workspace_id,''campaigns:read'') OR mailcraft_assessment_manager(workspace_id,''campaigns:write''))',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['submission_ledgers','submission_ledger_jobs','campaign_recipients','deliveries'] LOOP
  EXECUTE format('GRANT INSERT ON %I TO mailcraft_runtime',t);
  EXECUTE format('CREATE POLICY submission_insert ON %I FOR INSERT TO mailcraft_runtime WITH CHECK(mailcraft_assessment_manager(workspace_id,''campaigns:write''))',t);
 END LOOP;
END$$;
GRANT UPDATE(status,processed_count) ON submission_ledger_jobs TO mailcraft_runtime;
GRANT UPDATE(submission_state) ON deliveries TO mailcraft_runtime;
CREATE POLICY submission_job_update ON submission_ledger_jobs FOR UPDATE TO mailcraft_runtime USING(mailcraft_assessment_manager(workspace_id,'campaigns:write')) WITH CHECK(mailcraft_assessment_manager(workspace_id,'campaigns:write'));
CREATE POLICY submission_delivery_update ON deliveries FOR UPDATE TO mailcraft_runtime USING(mailcraft_assessment_manager(workspace_id,'campaigns:write')) WITH CHECK(mailcraft_assessment_manager(workspace_id,'campaigns:write'));
CREATE INDEX submission_ledger_campaign_page ON submission_ledgers(workspace_id,campaign_id,created_at,id);
CREATE INDEX submission_ledger_due ON submission_ledger_jobs(workspace_id,id) WHERE status IN('queued','running');
CREATE INDEX staged_recipient_page ON campaign_recipients(workspace_id,ledger_id,created_at,id);
CREATE INDEX delivery_history_page ON delivery_state_history(workspace_id,delivery_id,recorded_at,id);
CREATE INDEX delivery_attempt_page ON delivery_attempts(workspace_id,delivery_id,request_started_at,id);

CREATE FUNCTION mailcraft_submission_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN RAISE EXCEPTION 'SUBMISSION_IMMUTABLE';END$$;
DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['submission_ledgers','campaign_recipients','delivery_state_history','delivery_attempts'] LOOP
  EXECUTE format('CREATE TRIGGER submission_immutable BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_immutable()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['submission_ledgers','submission_ledger_jobs','campaign_recipients','deliveries','delivery_state_history','delivery_attempts'] LOOP
  EXECUTE format('CREATE TRIGGER submission_no_truncate BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION mailcraft_submission_immutable()',t);
 END LOOP;
END$$;
CREATE TRIGGER submission_job_no_delete BEFORE DELETE ON submission_ledger_jobs FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_immutable();
CREATE TRIGGER submission_delivery_no_delete BEFORE DELETE ON deliveries FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_immutable();

CREATE FUNCTION mailcraft_submission_manifest_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE c public.campaigns;v public.campaign_revisions;s public.audience_snapshots;r public.revisions;actor text:=current_setting('app.user_id',true);previous text;m jsonb;
BEGIN
 SELECT * INTO c FROM public.campaigns WHERE workspace_id=NEW.workspace_id AND id=NEW.campaign_id FOR SHARE;
 SELECT * INTO v FROM public.campaign_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.configuration_id;
 SELECT * INTO s FROM public.audience_snapshots WHERE workspace_id=NEW.workspace_id AND id=NEW.snapshot_id;
 SELECT * INTO r FROM public.revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 IF c.id IS NULL OR v.id IS NULL OR s.id IS NULL OR r.id IS NULL OR c.state NOT IN('draft','review_pending')
 OR c.version<>NEW.configuration_version OR c.digest<>NEW.configuration_digest OR v.campaign_id<>c.id OR v.revision_no<>c.version
 OR v.digest<>c.digest OR v.intent<>c.intent OR v.revision_id<>r.id OR c.revision_id<>r.id OR c.audience_snapshot_id IS DISTINCT FROM s.id
 OR NEW.members<>s.members OR NEW.total_count<>s.matched_count OR NEW.snapshot_digest<>s.digest OR NEW.artifact_hash<>r.artifact_hash
 THEN RAISE EXCEPTION 'SUBMISSION_MANIFEST_INVALID';END IF;
 FOR m IN SELECT value FROM jsonb_array_elements(NEW.members) LOOP
  IF jsonb_typeof(m) IS DISTINCT FROM 'object' OR (SELECT count(*) FROM jsonb_object_keys(m))<>5
  OR coalesce(m->>'id','')!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR (previous IS NOT NULL AND previous>=m->>'id') OR coalesce(m->>'locale','')!~'^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' OR length(m->>'locale')>35
  OR jsonb_typeof(m->'consent_version') IS DISTINCT FROM 'number' OR coalesce(m->>'consent_version','')!~'^[1-9][0-9]*$'
  OR (m->>'consent_version')::numeric>2147483647 OR jsonb_typeof(m->'eligible') IS DISTINCT FROM 'boolean'
  OR coalesce(m->>'reason','') NOT IN('ELIGIBLE','SUPPRESSED','CONTACT_DELETED','CONSENT_NOT_CONFIRMED')
  OR (m->>'eligible')::boolean IS DISTINCT FROM (m->>'reason'='ELIGIBLE') THEN RAISE EXCEPTION 'SUBMISSION_MEMBERS_INVALID';END IF;
  previous:=m->>'id';
 END LOOP;
 IF NEW.created_api_key_id IS NULL THEN
  IF NEW.created_by IS DISTINCT FROM actor THEN RAISE EXCEPTION 'SUBMISSION_CREATOR_INVALID';END IF;
 ELSE
  IF actor IS DISTINCT FROM 'api-key:'||NEW.created_api_key_id::text OR NOT EXISTS(SELECT FROM public.api_keys WHERE workspace_id=NEW.workspace_id AND id=NEW.created_api_key_id AND created_by=NEW.created_by AND revoked_at IS NULL AND expires_at>clock_timestamp() AND scopes?'campaigns:write' AND scopes?'audience:read') THEN RAISE EXCEPTION 'SUBMISSION_CREATOR_INVALID';END IF;
 END IF;
 NEW.created_at:=clock_timestamp();RETURN NEW;
END$$;
CREATE TRIGGER submission_manifest_guard BEFORE INSERT ON submission_ledgers FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_manifest_guard();

CREATE FUNCTION mailcraft_submission_recipient_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE a public.submission_ledgers;j public.submission_ledger_jobs;m jsonb;n integer;start_count integer;
BEGIN
 SELECT * INTO j FROM public.submission_ledger_jobs WHERE workspace_id=NEW.workspace_id AND id=NEW.ledger_id FOR UPDATE;
 SELECT * INTO a FROM public.submission_ledgers WHERE workspace_id=NEW.workspace_id AND id=NEW.ledger_id;
 SELECT count(*)::integer INTO n FROM public.campaign_recipients WHERE workspace_id=NEW.workspace_id AND ledger_id=NEW.ledger_id;
 start_count:=CASE WHEN j.batch_xid=txid_current() THEN j.batch_start ELSE j.processed_count END;
 m:=a.members->n;
 IF j.id IS NULL OR j.status NOT IN('queued','running') OR m IS NULL OR n>=start_count+100
 OR NEW.configuration_id<>a.configuration_id OR NEW.contact_id::text IS DISTINCT FROM m->>'id'
 OR NOT EXISTS(SELECT FROM public.campaigns WHERE workspace_id=a.workspace_id AND id=a.campaign_id AND state NOT IN('paused','cancelled'))
 OR NOT EXISTS(SELECT FROM public.memberships WHERE workspace_id=a.workspace_id AND user_id=a.created_by AND status='active' AND role IN('Owner','Admin'))
 OR (a.created_api_key_id IS NOT NULL AND NOT EXISTS(SELECT FROM public.api_keys WHERE workspace_id=a.workspace_id AND id=a.created_api_key_id AND created_by=a.created_by AND revoked_at IS NULL AND expires_at>clock_timestamp() AND scopes?'campaigns:write' AND scopes?'audience:read'))
 THEN RAISE EXCEPTION 'SUBMISSION_RECIPIENT_INVALID';END IF;
 NEW.captured_locale:=m->>'locale';NEW.captured_reason:=m->>'reason';NEW.captured_consent_version:=(m->>'consent_version')::integer;
 -- UUIDs have fixed canonical bytes. This exactly matches JSON.stringify([workspace,configuration,contact]); no jsonb whitespace ambiguity.
 NEW.logical_send_key:=encode(sha256(convert_to('["'||NEW.workspace_id::text||'","'||NEW.configuration_id::text||'","'||NEW.contact_id::text||'"]','UTF8')),'hex');
 NEW.created_at:=clock_timestamp();RETURN NEW;
END$$;
CREATE TRIGGER submission_recipient_guard BEFORE INSERT ON campaign_recipients FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_recipient_guard();

CREATE FUNCTION mailcraft_submission_delivery_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE r public.campaign_recipients;state text;
BEGIN
 SELECT * INTO r FROM public.campaign_recipients WHERE workspace_id=NEW.workspace_id AND id=NEW.recipient_id;
 SELECT status INTO state FROM public.submission_ledger_jobs WHERE workspace_id=NEW.workspace_id AND id=NEW.ledger_id FOR UPDATE;
 IF TG_OP='INSERT' THEN
  IF r.id IS NULL OR r.ledger_id<>NEW.ledger_id OR state NOT IN('queued','running') OR NEW.submission_state IS DISTINCT FROM (CASE WHEN r.captured_reason='ELIGIBLE' THEN 'pending' ELSE 'skipped' END) THEN RAISE EXCEPTION 'SUBMISSION_STATE_INVALID';END IF;
  NEW.created_at:=clock_timestamp();
 ELSE
  IF ROW(NEW.workspace_id,NEW.id,NEW.recipient_id,NEW.ledger_id,NEW.outcome,NEW.authorization_issued,NEW.created_at) IS DISTINCT FROM ROW(OLD.workspace_id,OLD.id,OLD.recipient_id,OLD.ledger_id,OLD.outcome,OLD.authorization_issued,OLD.created_at)
  OR OLD.submission_state<>'pending' OR NEW.submission_state<>'cancelled' OR state<>'cancelled' THEN RAISE EXCEPTION 'SUBMISSION_STATE_INVALID';END IF;
 END IF;
 NEW.updated_at:=clock_timestamp();RETURN NEW;
END$$;
CREATE TRIGGER submission_delivery_guard BEFORE INSERT OR UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_delivery_guard();

CREATE FUNCTION mailcraft_submission_progress_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE total integer;n integer;d integer;
BEGIN
 SELECT total_count INTO total FROM public.submission_ledgers WHERE workspace_id=NEW.workspace_id AND id=NEW.id;
 SELECT count(*)::integer INTO n FROM public.campaign_recipients WHERE workspace_id=NEW.workspace_id AND ledger_id=NEW.id;
 SELECT count(*)::integer INTO d FROM public.deliveries WHERE workspace_id=NEW.workspace_id AND ledger_id=NEW.id;
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'queued' OR NEW.processed_count<>0 OR n<>0 THEN RAISE EXCEPTION 'SUBMISSION_PROGRESS_INVALID';END IF;
  NEW.batch_xid:=NULL;NEW.batch_start:=0;
 ELSE
  IF OLD.status NOT IN('queued','running','completed') OR (OLD.status='completed' AND NEW.status<>'cancelled')
  OR NEW.status NOT IN('running','completed','cancelled','failed') OR NEW.processed_count<OLD.processed_count
  OR NEW.processed_count>OLD.processed_count+100 THEN RAISE EXCEPTION 'SUBMISSION_PROGRESS_INVALID';END IF;
  NEW.batch_xid:=txid_current();NEW.batch_start:=CASE WHEN OLD.batch_xid=txid_current() THEN OLD.batch_start ELSE OLD.processed_count END;
  IF NEW.processed_count>NEW.batch_start+100 THEN RAISE EXCEPTION 'SUBMISSION_PROGRESS_INVALID';END IF;
 END IF;
 IF NEW.processed_count<>n OR n<>d OR n>total OR (NEW.status='completed' AND n<>total) THEN RAISE EXCEPTION 'SUBMISSION_PROGRESS_INVALID';END IF;
 NEW.updated_at:=clock_timestamp();NEW.completed_at:=CASE WHEN NEW.status IN('completed','cancelled','failed') THEN NEW.updated_at ELSE NULL END;
 RETURN NEW;
END$$;
CREATE TRIGGER submission_progress_guard BEFORE INSERT OR UPDATE ON submission_ledger_jobs FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_progress_guard();

-- Only a NOLOGIN, non-bypass trigger role appends delivery history.
GRANT INSERT ON delivery_state_history TO mailcraft_campaign_history_admin;
GRANT SELECT ON campaign_recipients TO mailcraft_campaign_history_admin;
CREATE POLICY submission_history_capture ON delivery_state_history FOR INSERT TO mailcraft_campaign_history_admin WITH CHECK(true);
CREATE POLICY submission_history_source ON campaign_recipients FOR SELECT TO mailcraft_campaign_history_admin USING(true);
CREATE FUNCTION mailcraft_submission_capture_state() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE reason text;
BEGIN
 SELECT captured_reason INTO reason FROM public.campaign_recipients WHERE workspace_id=NEW.workspace_id AND id=NEW.recipient_id;
 INSERT INTO public.delivery_state_history(workspace_id,delivery_id,submission_state,outcome,reason,recorded_at)
 VALUES(NEW.workspace_id,NEW.id,NEW.submission_state,NEW.outcome,CASE WHEN NEW.submission_state='cancelled' THEN 'STAGING_CANCELLED' ELSE reason END,NEW.updated_at);
 RETURN NEW;
END$$;
GRANT CREATE ON SCHEMA public TO mailcraft_campaign_history_admin;
ALTER FUNCTION mailcraft_submission_capture_state() OWNER TO mailcraft_campaign_history_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_campaign_history_admin;
CREATE TRIGGER submission_capture_state AFTER INSERT OR UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_capture_state();

-- No recipient, delivery or job may commit partial progress or cancellation.
CREATE FUNCTION mailcraft_submission_commit_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE ledger uuid;j public.submission_ledger_jobs;n integer;d integer;pending integer;
BEGIN
 IF TG_TABLE_NAME IN('submission_ledger_jobs','submission_ledgers') THEN ledger:=NEW.id;ELSE ledger:=NEW.ledger_id;END IF;
 SELECT * INTO j FROM public.submission_ledger_jobs WHERE workspace_id=NEW.workspace_id AND id=ledger;
 SELECT count(*)::integer INTO n FROM public.campaign_recipients WHERE workspace_id=NEW.workspace_id AND ledger_id=ledger;
 SELECT count(*)::integer,count(*) FILTER(WHERE submission_state='pending')::integer INTO d,pending FROM public.deliveries WHERE workspace_id=NEW.workspace_id AND ledger_id=ledger;
 IF j.id IS NULL OR j.processed_count<>n OR n<>d OR (j.status='cancelled' AND pending<>0) THEN RAISE EXCEPTION 'SUBMISSION_PROGRESS_INVALID';END IF;
 RETURN NEW;
END$$;
CREATE CONSTRAINT TRIGGER submission_manifest_commit AFTER INSERT ON submission_ledgers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_commit_guard();
CREATE CONSTRAINT TRIGGER submission_recipient_commit AFTER INSERT ON campaign_recipients DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_commit_guard();
CREATE CONSTRAINT TRIGGER submission_delivery_commit AFTER INSERT OR UPDATE ON deliveries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_commit_guard();
CREATE CONSTRAINT TRIGGER submission_job_commit AFTER INSERT OR UPDATE ON submission_ledger_jobs DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION mailcraft_submission_commit_guard();
REVOKE ALL ON FUNCTION mailcraft_submission_immutable(),mailcraft_submission_manifest_guard(),mailcraft_submission_recipient_guard(),mailcraft_submission_delivery_guard(),mailcraft_submission_progress_guard(),mailcraft_submission_capture_state(),mailcraft_submission_commit_guard() FROM PUBLIC;
