DO $$BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_campaign_history_admin')THEN
  CREATE ROLE mailcraft_campaign_history_admin NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
 END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_campaign_history_admin'AND(rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole))THEN
  RAISE EXCEPTION 'CAMPAIGN_HISTORY_ROLE_UNSAFE';
 END IF;
END$$;

CREATE TABLE campaign_revisions(
 workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),campaign_id uuid NOT NULL,
 revision_no integer NOT NULL CHECK(revision_no>0),name text NOT NULL,revision_id uuid NOT NULL,
 intent jsonb NOT NULL,digest text NOT NULL,actor_id text,captured_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 origin text NOT NULL CHECK(origin IN('migration_current','runtime_change')),
 PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,campaign_id,revision_no),
 FOREIGN KEY(workspace_id,campaign_id)REFERENCES campaigns(workspace_id,id)ON DELETE CASCADE,
 FOREIGN KEY(workspace_id,revision_id)REFERENCES revisions(workspace_id,id)
);
-- Observe only the existing current row. Earlier versions and their actors are unknown.
INSERT INTO campaign_revisions(workspace_id,campaign_id,revision_no,name,revision_id,intent,digest,origin)
 SELECT workspace_id,id,version,name,revision_id,intent,digest,'migration_current'FROM campaigns;
ALTER TABLE campaign_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_revisions FORCE ROW LEVEL SECURITY;
CREATE POLICY campaign_history_read ON campaign_revisions FOR SELECT TO mailcraft_runtime
 USING(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY campaign_history_capture ON campaign_revisions FOR INSERT TO mailcraft_campaign_history_admin WITH CHECK(true);
GRANT USAGE ON SCHEMA public TO mailcraft_campaign_history_admin;
GRANT INSERT ON campaign_revisions TO mailcraft_campaign_history_admin;
REVOKE ALL ON campaign_revisions FROM mailcraft_runtime;
GRANT SELECT ON campaign_revisions TO mailcraft_runtime;

CREATE FUNCTION mailcraft_campaign_history_immutable()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);
BEGIN
 -- FK cascades run as the parent table owner. Inspect the session's actual role,
 -- so a runtime parent DELETE cannot acquire migration cleanup authority.
 IF TG_OP='DELETE'AND(invoker='mailcraft_migration'OR EXISTS(SELECT FROM pg_roles WHERE rolname=invoker AND rolsuper))THEN RETURN OLD;END IF;
 RAISE EXCEPTION 'CAMPAIGN_HISTORY_IMMUTABLE';
END$$;
CREATE TRIGGER campaign_history_immutable BEFORE UPDATE OR DELETE ON campaign_revisions
 FOR EACH ROW EXECUTE FUNCTION mailcraft_campaign_history_immutable();

CREATE FUNCTION mailcraft_capture_campaign_configuration()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);
 actor text:=nullif(current_setting('app.user_id',true),'');observed_origin text:='runtime_change';
BEGIN
 IF TG_OP='UPDATE'AND ROW(NEW.name,NEW.revision_id,NEW.intent,NEW.digest)IS NOT DISTINCT FROM ROW(OLD.name,OLD.revision_id,OLD.intent,OLD.digest)THEN
  IF NEW.version IS DISTINCT FROM OLD.version THEN RAISE EXCEPTION 'CAMPAIGN_CONFIGURATION_VERSION_REQUIRED';END IF;
  RETURN NEW;
 END IF;
 IF invoker='mailcraft_runtime'THEN
  IF NEW.workspace_id::text IS DISTINCT FROM current_setting('app.workspace_id',true)OR actor IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_CONFIGURATION_CONTEXT_REQUIRED';END IF;
  IF TG_OP='INSERT'THEN
   IF NEW.version<>1 OR NEW.created_by IS DISTINCT FROM actor THEN RAISE EXCEPTION 'CAMPAIGN_CONFIGURATION_VERSION_REQUIRED';END IF;
  ELSE
   IF OLD.state NOT IN('draft','review_pending')THEN RAISE EXCEPTION 'CAMPAIGN_CONFIGURATION_LOCKED';END IF;
   IF OLD.version=2147483647 OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'CAMPAIGN_CONFIGURATION_VERSION_REQUIRED';END IF;
  END IF;
  IF NEW.state<>'draft'OR NEW.approval IS NOT NULL THEN RAISE EXCEPTION 'CAMPAIGN_CONFIGURATION_REVIEW_RESET_REQUIRED';END IF;
 ELSE
  -- Operator fixture inserts are observations, not inferred user actions.
  actor:=NULL;observed_origin:='migration_current';
 END IF;
 INSERT INTO public.campaign_revisions(workspace_id,campaign_id,revision_no,name,revision_id,intent,digest,actor_id,origin)
  VALUES(NEW.workspace_id,NEW.id,NEW.version,NEW.name,NEW.revision_id,NEW.intent,NEW.digest,actor,observed_origin);
 RETURN NEW;
END$$;
CREATE TRIGGER campaign_configuration_capture AFTER INSERT OR UPDATE ON campaigns
 FOR EACH ROW EXECUTE FUNCTION mailcraft_capture_campaign_configuration();
GRANT CREATE ON SCHEMA public TO mailcraft_campaign_history_admin;
ALTER FUNCTION mailcraft_capture_campaign_configuration()OWNER TO mailcraft_campaign_history_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_campaign_history_admin;
REVOKE ALL ON FUNCTION mailcraft_capture_campaign_configuration()FROM PUBLIC;
REVOKE ALL ON FUNCTION mailcraft_campaign_history_immutable()FROM PUBLIC;
