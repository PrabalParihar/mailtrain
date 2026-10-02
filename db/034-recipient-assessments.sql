-- Preparation evidence only: no delivery, quota or frequency reservation writes.
CREATE FUNCTION mailcraft_assessment_manager(w uuid,scope text) RETURNS boolean LANGUAGE sql SET search_path=pg_catalog,public AS $$
 SELECT w::text=current_setting('app.workspace_id',true)
 AND EXISTS(SELECT FROM public.workspaces WHERE id=w AND status='active')
 AND EXISTS(SELECT FROM public.memberships m WHERE m.workspace_id=w AND m.status='active' AND m.role IN('Owner','Admin') AND
 (m.user_id=current_setting('app.user_id',true) OR EXISTS(SELECT FROM public.api_keys k WHERE k.workspace_id=w AND current_setting('app.user_id',true)='api-key:'||k.id::text AND k.created_by=m.user_id AND k.revoked_at IS NULL AND k.expires_at>clock_timestamp() AND k.scopes?scope AND k.scopes?'audience:read')));
$$;
REVOKE ALL ON FUNCTION mailcraft_assessment_manager(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_assessment_manager(uuid,text) TO mailcraft_runtime;
CREATE TABLE recipient_assessments(
 workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),campaign_id uuid NOT NULL,configuration_id uuid NOT NULL,
 configuration_version integer NOT NULL CHECK(configuration_version>0),configuration_digest text NOT NULL CHECK(configuration_digest~'^[0-9a-f]{64}$'),
 revision_id uuid NOT NULL,snapshot_id uuid NOT NULL,topic_id uuid,members jsonb NOT NULL CHECK(jsonb_typeof(members)='array' AND jsonb_array_length(members)<=10000),
 total_count integer NOT NULL CHECK(total_count BETWEEN 0 AND 10000 AND total_count=jsonb_array_length(members)),
 created_by text NOT NULL,created_api_key_id uuid,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 rule_version text NOT NULL DEFAULT 'recipient-assessment-1' CHECK(rule_version='recipient-assessment-1'),authorization_issued boolean NOT NULL DEFAULT false CHECK(NOT authorization_issued),
 PRIMARY KEY(workspace_id,id),
 FOREIGN KEY(workspace_id,campaign_id) REFERENCES campaigns(workspace_id,id),
 FOREIGN KEY(workspace_id,configuration_id) REFERENCES campaign_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,snapshot_id) REFERENCES audience_snapshots(workspace_id,id),
 FOREIGN KEY(workspace_id,topic_id) REFERENCES lists(workspace_id,id),
 FOREIGN KEY(workspace_id,created_api_key_id) REFERENCES api_keys(workspace_id,id)
);
CREATE TABLE recipient_assessment_jobs(
 workspace_id uuid NOT NULL,id uuid NOT NULL,status text NOT NULL DEFAULT 'queued' CHECK(status IN('queued','running','completed','cancelled','failed')),
 processed_count integer NOT NULL DEFAULT 0 CHECK(processed_count BETWEEN 0 AND 10000),checks_clear_count integer NOT NULL DEFAULT 0 CHECK(checks_clear_count>=0),excluded_count integer NOT NULL DEFAULT 0 CHECK(excluded_count>=0),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),completed_at timestamptz,
 PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,id) REFERENCES recipient_assessments(workspace_id,id),
 CHECK(processed_count=checks_clear_count+excluded_count),CHECK((status IN('completed','cancelled','failed'))=(completed_at IS NOT NULL))
);
CREATE TABLE recipient_observations(
 workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),assessment_id uuid NOT NULL,contact_id uuid NOT NULL,
 captured_reason text NOT NULL CHECK(captured_reason IN('ELIGIBLE','SUPPRESSED','CONTACT_DELETED','CONSENT_NOT_CONFIRMED')),captured_locale text NOT NULL,
 current_locale text,consent_version integer CHECK(consent_version>0),preference_version integer CHECK(preference_version>0),
 current_reason text NOT NULL CHECK(current_reason IN('CHECKS_CLEAR','CONTACT_MISSING','CONTACT_DELETED','CAPTURED_EXCLUDED','SUPPRESSED','CONSENT_NOT_CONFIRMED','TOPIC_NOT_SELECTED','TOPIC_NOT_CONFIRMED','FREQUENCY_LIMIT')),
 reasons jsonb NOT NULL CHECK(jsonb_typeof(reasons)='array'),observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 rule_version text NOT NULL DEFAULT 'recipient-assessment-1' CHECK(rule_version='recipient-assessment-1'),authorization_issued boolean NOT NULL DEFAULT false CHECK(NOT authorization_issued),
 PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,assessment_id,contact_id),FOREIGN KEY(workspace_id,assessment_id) REFERENCES recipient_assessments(workspace_id,id)
 -- Missing contacts are historical facts; deliberately no contact FK.
);
CREATE TABLE recipient_assessment_history(
 workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),assessment_id uuid NOT NULL,status text NOT NULL,
 processed_count integer NOT NULL,checks_clear_count integer NOT NULL,excluded_count integer NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,assessment_id) REFERENCES recipient_assessments(workspace_id,id)
);
DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['recipient_assessments','recipient_assessment_jobs','recipient_observations','recipient_assessment_history'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY assessment_read ON %I FOR SELECT TO mailcraft_runtime USING(mailcraft_assessment_manager(workspace_id,''campaigns:read'') OR mailcraft_assessment_manager(workspace_id,''campaigns:write''))',t);
 EXECUTE format('GRANT SELECT ON %I TO mailcraft_runtime',t);
 END LOOP;
END$$;
CREATE POLICY assessment_create ON recipient_assessments FOR INSERT TO mailcraft_runtime WITH CHECK(mailcraft_assessment_manager(workspace_id,'campaigns:write'));
CREATE POLICY assessment_job_create ON recipient_assessment_jobs FOR INSERT TO mailcraft_runtime WITH CHECK(mailcraft_assessment_manager(workspace_id,'campaigns:write'));
CREATE POLICY assessment_job_progress ON recipient_assessment_jobs FOR UPDATE TO mailcraft_runtime USING(mailcraft_assessment_manager(workspace_id,'campaigns:write')) WITH CHECK(mailcraft_assessment_manager(workspace_id,'campaigns:write'));
CREATE POLICY assessment_observe ON recipient_observations FOR INSERT TO mailcraft_runtime WITH CHECK(mailcraft_assessment_manager(workspace_id,'campaigns:write'));
GRANT INSERT ON recipient_assessments,recipient_assessment_jobs,recipient_observations TO mailcraft_runtime;
GRANT UPDATE(status,processed_count,checks_clear_count,excluded_count,updated_at,completed_at) ON recipient_assessment_jobs TO mailcraft_runtime;
CREATE INDEX recipient_assessment_due ON recipient_assessment_jobs(workspace_id,id) WHERE status IN('queued','running');
CREATE INDEX recipient_assessment_campaign ON recipient_assessments(workspace_id,campaign_id,created_at,id);
CREATE INDEX recipient_observation_page ON recipient_observations(workspace_id,assessment_id,observed_at,id);
CREATE FUNCTION mailcraft_assessment_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$BEGIN RAISE EXCEPTION 'RECIPIENT_ASSESSMENT_IMMUTABLE';END$$;
CREATE TRIGGER assessment_manifest_immutable BEFORE UPDATE OR DELETE ON recipient_assessments FOR EACH ROW EXECUTE FUNCTION mailcraft_assessment_immutable();
CREATE TRIGGER assessment_observation_immutable BEFORE UPDATE OR DELETE ON recipient_observations FOR EACH ROW EXECUTE FUNCTION mailcraft_assessment_immutable();
CREATE TRIGGER assessment_history_immutable BEFORE UPDATE OR DELETE ON recipient_assessment_history FOR EACH ROW EXECUTE FUNCTION mailcraft_assessment_immutable();
CREATE FUNCTION mailcraft_assessment_manifest_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE c public.campaigns;v public.campaign_revisions;s public.audience_snapshots;actor text:=current_setting('app.user_id',true);
BEGIN
 SELECT * INTO c FROM public.campaigns WHERE workspace_id=NEW.workspace_id AND id=NEW.campaign_id FOR SHARE;
 SELECT * INTO v FROM public.campaign_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.configuration_id;
 SELECT * INTO s FROM public.audience_snapshots WHERE workspace_id=NEW.workspace_id AND id=NEW.snapshot_id;
 IF c.id IS NULL OR v.id IS NULL OR s.id IS NULL OR c.version<>NEW.configuration_version OR c.digest<>NEW.configuration_digest OR v.campaign_id<>c.id OR v.revision_no<>c.version OR v.digest<>c.digest OR v.intent<>c.intent OR v.revision_id<>NEW.revision_id OR c.revision_id<>NEW.revision_id OR c.audience_snapshot_id IS DISTINCT FROM s.id OR NEW.members<>s.members OR NEW.total_count<>s.matched_count THEN RAISE EXCEPTION 'RECIPIENT_ASSESSMENT_MANIFEST_INVALID';END IF;
 IF NEW.created_api_key_id IS NULL THEN
  IF NEW.created_by IS DISTINCT FROM actor THEN RAISE EXCEPTION 'RECIPIENT_ASSESSMENT_CREATOR_INVALID';END IF;
 ELSE
  IF actor IS DISTINCT FROM 'api-key:'||NEW.created_api_key_id::text OR NOT EXISTS(SELECT FROM public.api_keys WHERE workspace_id=NEW.workspace_id AND id=NEW.created_api_key_id AND created_by=NEW.created_by AND revoked_at IS NULL AND expires_at>clock_timestamp() AND scopes?'campaigns:write' AND scopes?'audience:read') THEN RAISE EXCEPTION 'RECIPIENT_ASSESSMENT_CREATOR_INVALID';END IF;
 END IF;
 RETURN NEW;
END$$;
CREATE TRIGGER assessment_manifest_guard BEFORE INSERT ON recipient_assessments FOR EACH ROW EXECUTE FUNCTION mailcraft_assessment_manifest_guard();
CREATE FUNCTION mailcraft_assessment_observation_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE m jsonb;job_status text;a public.recipient_assessments;c public.contacts;reasons jsonb:='[]';window_days integer;
BEGIN
 SELECT status INTO job_status FROM public.recipient_assessment_jobs WHERE workspace_id=NEW.workspace_id AND id=NEW.assessment_id FOR UPDATE;
 SELECT * INTO a FROM public.recipient_assessments WHERE workspace_id=NEW.workspace_id AND id=NEW.assessment_id;
 SELECT member INTO m FROM jsonb_array_elements(a.members) member WHERE member->>'id'=NEW.contact_id::text;
 IF job_status NOT IN('queued','running') OR m IS NULL OR NEW.captured_reason IS DISTINCT FROM m->>'reason' OR NEW.captured_locale IS DISTINCT FROM m->>'locale' THEN RAISE EXCEPTION 'RECIPIENT_OBSERVATION_INVALID';END IF;
 IF NOT EXISTS(SELECT FROM public.memberships WHERE workspace_id=NEW.workspace_id AND user_id=a.created_by AND status='active' AND role IN('Owner','Admin')) OR
 -- The worker admits against wall time and holds creator membership/key locks.
 -- Expiry after that admission cannot invalidate historical facts within this batch;
 -- the next batch rechecks wall time and cancels. Direct SQL still requires authority
 -- valid at this transaction's start, with no caller-supplied authorization flag.
 (a.created_api_key_id IS NOT NULL AND NOT EXISTS(SELECT FROM public.api_keys WHERE workspace_id=NEW.workspace_id AND id=a.created_api_key_id AND created_by=a.created_by AND revoked_at IS NULL AND expires_at>transaction_timestamp() AND scopes?'campaigns:write' AND scopes?'audience:read')) THEN RAISE EXCEPTION 'RECIPIENT_OBSERVATION_INVALID';END IF;
 SELECT * INTO c FROM public.contacts WHERE workspace_id=NEW.workspace_id AND id=NEW.contact_id FOR UPDATE;
 -- One database instant owns every time-dependent fact and the persisted timestamp.
 NEW.observed_at:=clock_timestamp();
 IF c.id IS NULL THEN reasons:=reasons||'"CONTACT_MISSING"'::jsonb;
 ELSIF c.deleted THEN reasons:=reasons||'"CONTACT_DELETED"'::jsonb;END IF;
 IF (m->>'eligible')::boolean IS NOT TRUE THEN reasons:=reasons||'"CAPTURED_EXCLUDED"'::jsonb;END IF;
 IF c.id IS NOT NULL THEN
  IF EXISTS(SELECT FROM public.suppressions WHERE workspace_id=NEW.workspace_id AND contact_id=c.id) THEN reasons:=reasons||'"SUPPRESSED"'::jsonb;END IF;
  IF c.subscription<>'subscribed' THEN reasons:=reasons||'"CONSENT_NOT_CONFIRMED"'::jsonb;END IF;
 END IF;
 IF a.topic_id IS NULL THEN reasons:=reasons||'"TOPIC_NOT_SELECTED"'::jsonb;
 ELSIF c.id IS NOT NULL AND NOT EXISTS(SELECT FROM public.topic_subscriptions WHERE workspace_id=NEW.workspace_id AND contact_id=c.id AND topic_id=a.topic_id AND subscription='subscribed') THEN reasons:=reasons||'"TOPIC_NOT_CONFIRMED"'::jsonb;END IF;
 IF c.id IS NOT NULL THEN
  window_days:=CASE c.frequency WHEN 'daily' THEN 1 WHEN 'weekly' THEN 7 WHEN 'monthly' THEN 30 END;
  IF EXISTS(SELECT FROM public.frequency_reservations WHERE workspace_id=NEW.workspace_id AND contact_id=c.id AND (state IN('reserved','uncertain') OR (state='accepted' AND reserved_at>NEW.observed_at-(window_days::double precision*86400000*interval '1 millisecond')))) THEN reasons:=reasons||'"FREQUENCY_LIMIT"'::jsonb;END IF;
 END IF;
 -- Current facts are derived here, never accepted from the caller. Immutable
 -- captured identity/reason/locale above must still match the frozen manifest.
 NEW.current_locale:=c.preferred_locale;NEW.consent_version:=c.consent_version;NEW.preference_version:=c.preference_version;
 NEW.reasons:=reasons;NEW.current_reason:=coalesce(reasons->>0,'CHECKS_CLEAR');
 RETURN NEW;
END$$;
CREATE TRIGGER assessment_observation_guard BEFORE INSERT ON recipient_observations FOR EACH ROW EXECUTE FUNCTION mailcraft_assessment_observation_guard();
-- Only this restricted trigger role can append status history. It cannot rewrite evidence.
GRANT INSERT ON recipient_assessment_history TO mailcraft_campaign_history_admin;
CREATE POLICY assessment_history_capture ON recipient_assessment_history FOR INSERT TO mailcraft_campaign_history_admin WITH CHECK(true);
CREATE FUNCTION mailcraft_assessment_progress_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE total integer;n integer;clear integer;
BEGIN
 SELECT total_count INTO total FROM public.recipient_assessments WHERE workspace_id=NEW.workspace_id AND id=NEW.id;
 SELECT count(*)::int,count(*)FILTER(WHERE current_reason='CHECKS_CLEAR')::int INTO n,clear FROM public.recipient_observations WHERE workspace_id=NEW.workspace_id AND assessment_id=NEW.id;
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'queued' OR NEW.processed_count<>0 THEN RAISE EXCEPTION 'RECIPIENT_PROGRESS_INVALID';END IF;
 ELSE
  IF OLD.status NOT IN('queued','running') OR NEW.processed_count<OLD.processed_count OR NEW.processed_count>OLD.processed_count+100 OR NEW.status='queued' THEN RAISE EXCEPTION 'RECIPIENT_PROGRESS_INVALID';END IF;
 END IF;
 IF NEW.processed_count<>n OR NEW.checks_clear_count<>clear OR NEW.excluded_count<>n-clear OR n>total OR (NEW.status='completed' AND n<>total) THEN RAISE EXCEPTION 'RECIPIENT_PROGRESS_INVALID';END IF;
 NEW.updated_at:=clock_timestamp();NEW.completed_at:=CASE WHEN NEW.status IN('completed','cancelled','failed') THEN NEW.updated_at ELSE NULL END;
 RETURN NEW;
END$$;
CREATE TRIGGER assessment_progress_guard BEFORE INSERT OR UPDATE ON recipient_assessment_jobs FOR EACH ROW EXECUTE FUNCTION mailcraft_assessment_progress_guard();
CREATE FUNCTION mailcraft_assessment_capture_progress() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$BEGIN
 INSERT INTO public.recipient_assessment_history(workspace_id,assessment_id,status,processed_count,checks_clear_count,excluded_count) VALUES(NEW.workspace_id,NEW.id,NEW.status,NEW.processed_count,NEW.checks_clear_count,NEW.excluded_count);RETURN NEW;
END$$;
GRANT CREATE ON SCHEMA public TO mailcraft_campaign_history_admin;
ALTER FUNCTION mailcraft_assessment_capture_progress() OWNER TO mailcraft_campaign_history_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_campaign_history_admin;
CREATE TRIGGER assessment_capture_progress AFTER INSERT OR UPDATE ON recipient_assessment_jobs FOR EACH ROW EXECUTE FUNCTION mailcraft_assessment_capture_progress();
-- An observation cannot commit without its matching atomic progress update.
CREATE FUNCTION mailcraft_assessment_observation_commit() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE progress integer;n integer;
BEGIN
 SELECT processed_count INTO progress FROM public.recipient_assessment_jobs WHERE workspace_id=NEW.workspace_id AND id=NEW.assessment_id;
 SELECT count(*)::int INTO n FROM public.recipient_observations WHERE workspace_id=NEW.workspace_id AND assessment_id=NEW.assessment_id;
 IF progress IS DISTINCT FROM n THEN RAISE EXCEPTION 'RECIPIENT_PROGRESS_INVALID';END IF;
 RETURN NEW;
END$$;
CREATE CONSTRAINT TRIGGER assessment_observation_commit AFTER INSERT ON recipient_observations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION mailcraft_assessment_observation_commit();
REVOKE ALL ON FUNCTION mailcraft_assessment_immutable(),mailcraft_assessment_manifest_guard(),mailcraft_assessment_observation_guard(),mailcraft_assessment_progress_guard(),mailcraft_assessment_capture_progress() FROM PUBLIC;
REVOKE ALL ON FUNCTION mailcraft_assessment_observation_commit() FROM PUBLIC;
