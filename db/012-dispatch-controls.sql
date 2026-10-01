DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_dispatch_operator') THEN
  CREATE ROLE mailcraft_dispatch_operator NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_policy_evidence') THEN
  CREATE ROLE mailcraft_policy_evidence NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname IN('mailcraft_dispatch_operator','mailcraft_policy_evidence') AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole)) THEN
  RAISE EXCEPTION 'Policy authority roles must be restricted NOLOGIN roles';
 END IF;
END $$;
CREATE TABLE dispatch_controls(
 scope text NOT NULL CHECK(scope IN('global','provider','workspace')),
 target text NOT NULL,
 workspace_id uuid REFERENCES workspaces(id),
 paused boolean NOT NULL DEFAULT true,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 reason text NOT NULL CHECK(reason IN('incident','abuse_review','maintenance','verified_recovery')),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(scope,target),
 CHECK((scope='global' AND target='global' AND workspace_id IS NULL) OR
       (scope='provider' AND target IN('ses','resend','sendgrid','mailgun') AND workspace_id IS NULL) OR
       (scope='workspace' AND workspace_id IS NOT NULL AND target=workspace_id::text)),
 CHECK(paused OR reason='verified_recovery')
);
CREATE TABLE dispatch_policy_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),scope text NOT NULL,target text NOT NULL,
 workspace_id uuid REFERENCES workspaces(id),version integer NOT NULL,paused boolean NOT NULL,
 reason text NOT NULL,actor text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(scope,target,version)
);
ALTER TABLE dispatch_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_controls FORCE ROW LEVEL SECURITY;
CREATE POLICY policy_read ON dispatch_controls FOR SELECT TO mailcraft_runtime USING(scope<>'workspace' OR workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY policy_workspace_insert ON dispatch_controls FOR INSERT TO mailcraft_runtime WITH CHECK(scope='workspace' AND workspace_id::text=current_setting('app.workspace_id',true) AND EXISTS(SELECT 1 FROM memberships m WHERE m.workspace_id=dispatch_controls.workspace_id AND m.user_id=current_setting('app.user_id',true) AND m.status='active' AND m.role IN('Owner','Admin')));
CREATE POLICY policy_workspace_update ON dispatch_controls FOR UPDATE TO mailcraft_runtime USING(scope='workspace' AND workspace_id::text=current_setting('app.workspace_id',true) AND EXISTS(SELECT 1 FROM memberships m WHERE m.workspace_id=dispatch_controls.workspace_id AND m.user_id=current_setting('app.user_id',true) AND m.status='active' AND m.role IN('Owner','Admin'))) WITH CHECK(scope='workspace' AND workspace_id::text=current_setting('app.workspace_id',true) AND EXISTS(SELECT 1 FROM memberships m WHERE m.workspace_id=dispatch_controls.workspace_id AND m.user_id=current_setting('app.user_id',true) AND m.status='active' AND m.role IN('Owner','Admin')));
CREATE POLICY policy_operator ON dispatch_controls TO mailcraft_dispatch_operator USING(scope IN('global','provider')) WITH CHECK(scope IN('global','provider'));
ALTER TABLE dispatch_policy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_policy_events FORCE ROW LEVEL SECURITY;
CREATE POLICY event_tenant_read ON dispatch_policy_events FOR SELECT TO mailcraft_runtime USING(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY event_operator_read ON dispatch_policy_events FOR SELECT TO mailcraft_dispatch_operator USING(scope IN('global','provider'));
CREATE POLICY event_writer ON dispatch_policy_events FOR INSERT TO mailcraft_policy_evidence WITH CHECK(true);
GRANT USAGE ON SCHEMA public TO mailcraft_dispatch_operator,mailcraft_policy_evidence;
GRANT SELECT,INSERT,UPDATE ON dispatch_controls TO mailcraft_runtime;
GRANT SELECT,UPDATE ON dispatch_controls TO mailcraft_dispatch_operator;
GRANT SELECT ON dispatch_policy_events TO mailcraft_runtime,mailcraft_dispatch_operator;
GRANT INSERT ON dispatch_policy_events TO mailcraft_policy_evidence;
CREATE FUNCTION mailcraft_lock_dispatch_policy() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF TG_OP='UPDATE' AND (NEW.scope,NEW.target,NEW.workspace_id) IS DISTINCT FROM (OLD.scope,OLD.target,OLD.workspace_id) THEN
  RAISE EXCEPTION 'Dispatch policy identity is immutable';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('lettercape.dispatch.'||NEW.scope||'.'||NEW.target,0));
 NEW.version:=CASE WHEN TG_OP='INSERT' THEN 1 ELSE OLD.version+1 END;
 NEW.updated_at:=clock_timestamp();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION mailcraft_lock_dispatch_policy() FROM PUBLIC;
CREATE TRIGGER dispatch_policy_lock BEFORE INSERT OR UPDATE ON dispatch_controls FOR EACH ROW EXECUTE FUNCTION mailcraft_lock_dispatch_policy();
CREATE FUNCTION mailcraft_record_dispatch_policy() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
 INSERT INTO dispatch_policy_events(scope,target,workspace_id,version,paused,reason,actor)
 VALUES(NEW.scope,NEW.target,NEW.workspace_id,NEW.version,NEW.paused,NEW.reason,coalesce(nullif(current_setting('app.user_id',true),''),session_user));
 RETURN NEW;
END $$;
GRANT CREATE ON SCHEMA public TO mailcraft_policy_evidence;
ALTER FUNCTION mailcraft_record_dispatch_policy() OWNER TO mailcraft_policy_evidence;
REVOKE CREATE ON SCHEMA public FROM mailcraft_policy_evidence;
REVOKE ALL ON FUNCTION mailcraft_record_dispatch_policy() FROM PUBLIC;
CREATE TRIGGER dispatch_policy_record AFTER INSERT OR UPDATE ON dispatch_controls FOR EACH ROW EXECUTE FUNCTION mailcraft_record_dispatch_policy();
INSERT INTO dispatch_controls(scope,target,paused,reason) VALUES('global','global',true,'maintenance');
INSERT INTO dispatch_controls(scope,target,paused,reason) SELECT 'provider',provider,true,'maintenance' FROM unnest(ARRAY['ses','resend','sendgrid','mailgun']) provider;
INSERT INTO dispatch_controls(scope,target,workspace_id,paused,reason) SELECT 'workspace',id::text,id,true,'maintenance' FROM workspaces;
