DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_webhook_maintenance') THEN
  CREATE ROLE mailcraft_webhook_maintenance NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_webhook_maintenance' AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole)) THEN RAISE EXCEPTION 'Webhook maintenance must be a restricted NOLOGIN role';END IF;
END $$;
CREATE FUNCTION mailcraft_webhook_manager(p_workspace uuid,p_scope text)RETURNS boolean LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 SELECT p_workspace::text=current_setting('app.workspace_id',true) AND EXISTS(
  SELECT 1 FROM memberships m WHERE m.workspace_id=p_workspace AND m.status='active' AND m.role IN('Owner','Admin') AND
  (m.user_id=current_setting('app.user_id',true) OR EXISTS(
   SELECT 1 FROM api_keys k WHERE k.workspace_id=p_workspace AND k.id::text=substring(current_setting('app.user_id',true) FROM 9)
    AND current_setting('app.user_id',true) LIKE 'api-key:%' AND k.created_by=m.user_id AND k.revoked_at IS NULL AND k.expires_at>clock_timestamp() AND k.scopes ? p_scope)))
$$;
REVOKE ALL ON FUNCTION mailcraft_webhook_manager(uuid,text)FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_webhook_manager(uuid,text)TO mailcraft_runtime;
CREATE TABLE webhook_endpoints(
 workspace_id uuid NOT NULL REFERENCES workspaces(id),id uuid NOT NULL DEFAULT gen_random_uuid(),name text NOT NULL CHECK(length(name)BETWEEN 1 AND 100),
 target_url text NOT NULL CHECK(length(target_url)BETWEEN 1 AND 2048),subscriptions jsonb NOT NULL CHECK(jsonb_typeof(subscriptions)='array' AND jsonb_array_length(subscriptions)BETWEEN 1 AND 3 AND subscriptions<@'["contact.unsubscribed","contact.topic_unsubscribed","contacts.imported"]'::jsonb),
 status text NOT NULL DEFAULT 'paused' CHECK(status IN('paused','enabled','disabled')),version integer NOT NULL DEFAULT 1 CHECK(version>0),secret_version integer NOT NULL DEFAULT 1 CHECK(secret_version>0),
 created_by text NOT NULL,created_api_key_id uuid,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),dns_checked_at timestamptz NOT NULL,
 PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,created_api_key_id)REFERENCES api_keys(workspace_id,id)
);
CREATE TABLE webhook_signing_keys(
 workspace_id uuid NOT NULL,endpoint_id uuid NOT NULL,secret_version integer NOT NULL CHECK(secret_version>0),wrapped_secret jsonb NOT NULL,
 state text NOT NULL CHECK(state IN('current','previous','retired')),valid_until timestamptz,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),state_changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,endpoint_id,secret_version),FOREIGN KEY(workspace_id,endpoint_id)REFERENCES webhook_endpoints(workspace_id,id),
 CHECK((state='current' AND valid_until IS NULL)OR(state<>'current' AND valid_until IS NOT NULL AND valid_until<=state_changed_at+interval '24 hours'))
);
CREATE UNIQUE INDEX webhook_current_key ON webhook_signing_keys(workspace_id,endpoint_id)WHERE state='current';
CREATE UNIQUE INDEX webhook_previous_key ON webhook_signing_keys(workspace_id,endpoint_id)WHERE state='previous';
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;ALTER TABLE webhook_endpoints FORCE ROW LEVEL SECURITY;
ALTER TABLE webhook_signing_keys ENABLE ROW LEVEL SECURITY;ALTER TABLE webhook_signing_keys FORCE ROW LEVEL SECURITY;
CREATE POLICY webhook_read ON webhook_endpoints FOR SELECT TO mailcraft_runtime USING(mailcraft_webhook_manager(workspace_id,'webhooks:read')OR mailcraft_webhook_manager(workspace_id,'webhooks:write'));
CREATE POLICY webhook_insert ON webhook_endpoints FOR INSERT TO mailcraft_runtime WITH CHECK(mailcraft_webhook_manager(workspace_id,'webhooks:write'));
CREATE POLICY webhook_update ON webhook_endpoints FOR UPDATE TO mailcraft_runtime USING(mailcraft_webhook_manager(workspace_id,'webhooks:write'))WITH CHECK(mailcraft_webhook_manager(workspace_id,'webhooks:write'));
CREATE POLICY webhook_key_read ON webhook_signing_keys FOR SELECT TO mailcraft_runtime USING(mailcraft_webhook_manager(workspace_id,'webhooks:write'));
CREATE POLICY webhook_key_insert ON webhook_signing_keys FOR INSERT TO mailcraft_runtime WITH CHECK(mailcraft_webhook_manager(workspace_id,'webhooks:write'));
CREATE POLICY webhook_key_update ON webhook_signing_keys FOR UPDATE TO mailcraft_runtime USING(mailcraft_webhook_manager(workspace_id,'webhooks:write'))WITH CHECK(mailcraft_webhook_manager(workspace_id,'webhooks:write'));
GRANT SELECT,INSERT,UPDATE ON webhook_endpoints,webhook_signing_keys TO mailcraft_runtime;
GRANT USAGE ON SCHEMA public TO mailcraft_webhook_maintenance;
GRANT SELECT,DELETE ON webhook_endpoints,webhook_signing_keys TO mailcraft_webhook_maintenance;
CREATE POLICY webhook_maintenance_read ON webhook_endpoints FOR SELECT TO mailcraft_webhook_maintenance USING(true);
CREATE POLICY webhook_maintenance_delete ON webhook_endpoints FOR DELETE TO mailcraft_webhook_maintenance USING(true);
CREATE POLICY webhook_key_maintenance_read ON webhook_signing_keys FOR SELECT TO mailcraft_webhook_maintenance USING(true);
CREATE POLICY webhook_key_maintenance_delete ON webhook_signing_keys FOR DELETE TO mailcraft_webhook_maintenance USING(true);
CREATE FUNCTION mailcraft_preserve_webhook_endpoint()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF (NEW.workspace_id,NEW.id,NEW.name,NEW.target_url,NEW.subscriptions,NEW.created_by,NEW.created_api_key_id,NEW.created_at,NEW.dns_checked_at)IS DISTINCT FROM(OLD.workspace_id,OLD.id,OLD.name,OLD.target_url,OLD.subscriptions,OLD.created_by,OLD.created_api_key_id,OLD.created_at,OLD.dns_checked_at)THEN RAISE EXCEPTION 'Webhook target/authority identity is immutable';END IF;
 IF NEW.version<>OLD.version+1 OR NEW.secret_version NOT IN(OLD.secret_version,OLD.secret_version+1)OR(OLD.status='disabled'AND NEW.status<>'disabled')THEN RAISE EXCEPTION 'Webhook version/lifecycle is invalid';END IF;
 NEW.updated_at=clock_timestamp();RETURN NEW;
END $$;
CREATE TRIGGER webhook_preserve_endpoint BEFORE UPDATE ON webhook_endpoints FOR EACH ROW EXECUTE FUNCTION mailcraft_preserve_webhook_endpoint();
CREATE FUNCTION mailcraft_preserve_webhook_key()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF (NEW.workspace_id,NEW.endpoint_id,NEW.secret_version,NEW.wrapped_secret,NEW.created_at)IS DISTINCT FROM(OLD.workspace_id,OLD.endpoint_id,OLD.secret_version,OLD.wrapped_secret,OLD.created_at)THEN RAISE EXCEPTION 'Webhook signing identity is immutable';END IF;
 IF NOT((OLD.state='current'AND NEW.state='previous')OR(OLD.state='previous'AND NEW.state='retired'AND NEW.valid_until<=OLD.valid_until))THEN RAISE EXCEPTION 'Webhook signing key transition is invalid';END IF;
 NEW.state_changed_at=clock_timestamp();RETURN NEW;
END $$;
CREATE TRIGGER webhook_preserve_key BEFORE UPDATE ON webhook_signing_keys FOR EACH ROW EXECUTE FUNCTION mailcraft_preserve_webhook_key();
REVOKE ALL ON FUNCTION mailcraft_preserve_webhook_endpoint(),mailcraft_preserve_webhook_key()FROM PUBLIC;
