DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['mailcraft_webhook_worker','mailcraft_webhook_authorizer'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r)THEN EXECUTE format('CREATE ROLE %I NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE',r);END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole))THEN RAISE EXCEPTION 'Webhook service roles must be restricted NOLOGIN';END IF;
 END LOOP;
END $$;
GRANT USAGE ON SCHEMA public TO mailcraft_webhook_worker,mailcraft_webhook_authorizer;
GRANT SELECT(id,status)ON workspaces TO mailcraft_webhook_authorizer;
GRANT SELECT(workspace_id,user_id,role,status)ON memberships TO mailcraft_webhook_authorizer;
GRANT SELECT(workspace_id,id,created_by,revoked_at,expires_at,scopes)ON api_keys TO mailcraft_webhook_authorizer;
GRANT SELECT(workspace_id,id,status,created_by,created_api_key_id)ON webhook_endpoints TO mailcraft_webhook_authorizer;
CREATE POLICY webhook_authorizer_workspaces ON workspaces FOR SELECT TO mailcraft_webhook_authorizer USING(true);
CREATE POLICY webhook_authorizer_memberships ON memberships FOR SELECT TO mailcraft_webhook_authorizer USING(true);
CREATE POLICY webhook_authorizer_keys ON api_keys FOR SELECT TO mailcraft_webhook_authorizer USING(true);
CREATE POLICY webhook_authorizer_endpoints ON webhook_endpoints FOR SELECT TO mailcraft_webhook_authorizer USING(true);
CREATE FUNCTION mailcraft_webhook_service_authorized(w uuid,e uuid)RETURNS boolean LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM webhook_endpoints ep JOIN workspaces ws ON ws.id=ep.workspace_id JOIN memberships m ON m.workspace_id=ep.workspace_id AND m.user_id=ep.created_by
 WHERE ep.workspace_id=w AND ep.id=e AND ep.status='enabled' AND ws.status='active' AND m.status='active' AND m.role IN('Owner','Admin') AND
 (ep.created_api_key_id IS NULL OR EXISTS(SELECT 1 FROM api_keys k WHERE k.workspace_id=w AND k.id=ep.created_api_key_id AND k.created_by=ep.created_by AND k.revoked_at IS NULL AND k.expires_at>clock_timestamp() AND k.scopes ? 'webhooks:write')))
$$;
GRANT CREATE ON SCHEMA public TO mailcraft_webhook_authorizer;
ALTER FUNCTION mailcraft_webhook_service_authorized(uuid,uuid)OWNER TO mailcraft_webhook_authorizer;
REVOKE CREATE ON SCHEMA public FROM mailcraft_webhook_authorizer;
REVOKE ALL ON FUNCTION mailcraft_webhook_service_authorized(uuid,uuid)FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_webhook_service_authorized(uuid,uuid)TO mailcraft_webhook_worker;
GRANT SELECT ON webhook_endpoints,webhook_signing_keys TO mailcraft_webhook_worker;
GRANT UPDATE(status,version,updated_at)ON webhook_endpoints TO mailcraft_webhook_worker;
CREATE POLICY webhook_worker_endpoints_read ON webhook_endpoints FOR SELECT TO mailcraft_webhook_worker USING(true);
CREATE POLICY webhook_worker_endpoints_update ON webhook_endpoints FOR UPDATE TO mailcraft_webhook_worker USING(true)WITH CHECK(true);
CREATE POLICY webhook_worker_signing_read ON webhook_signing_keys FOR SELECT TO mailcraft_webhook_worker USING(state='current');
GRANT SELECT(workspace_id,id,type,aggregate_id,recorded_at,event_schema_version,event_body,event_hash)ON outbox TO mailcraft_webhook_worker;
CREATE POLICY webhook_worker_event_read ON outbox FOR SELECT TO mailcraft_webhook_worker USING(event_body IS NOT NULL);
CREATE TABLE webhook_queue_state(workspace_id uuid PRIMARY KEY REFERENCES workspaces(id),last_admitted timestamptz NOT NULL DEFAULT 'epoch',last_claimed timestamptz NOT NULL DEFAULT 'epoch');
CREATE TABLE webhook_deliveries(
 workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),endpoint_id uuid NOT NULL,event_id uuid NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','leased','acknowledged','blocked','terminal','dead_letter','disabled')),
 failure_attempts integer NOT NULL DEFAULT 0 CHECK(failure_attempts BETWEEN 0 AND 10),attempt_number integer NOT NULL DEFAULT 0 CHECK(attempt_number>=0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),deadline timestamptz NOT NULL DEFAULT clock_timestamp()+interval '24 hours',next_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 lease_token uuid,lease_until timestamptz,authorized_until timestamptz,authorized_key_version integer,
 error_class text CHECK(error_class IN('authority_revoked','event_integrity','unsafe_target','capacity','aborted','transient','rate_deferred','retry_budget_exhausted','http_terminal','key_unavailable')),
 policy_version integer NOT NULL DEFAULT 1 CHECK(policy_version=1),
 PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,endpoint_id,event_id),FOREIGN KEY(workspace_id,endpoint_id)REFERENCES webhook_endpoints(workspace_id,id),FOREIGN KEY(workspace_id,event_id)REFERENCES outbox(workspace_id,id),
 CHECK(deadline>created_at AND deadline<=created_at+interval '24 hours'),CHECK((state='leased' AND lease_token IS NOT NULL AND lease_until IS NOT NULL)OR(state<>'leased' AND lease_token IS NULL AND lease_until IS NULL)),
 CHECK((authorized_until IS NULL AND authorized_key_version IS NULL)OR(state='leased' AND authorized_until IS NOT NULL AND authorized_key_version>0 AND authorized_until<=lease_until))
);
CREATE INDEX webhook_pending_due ON webhook_deliveries(next_at,workspace_id)WHERE state='pending';
CREATE UNIQUE INDEX webhook_one_workspace_lease ON webhook_deliveries(workspace_id)WHERE state='leased';
CREATE TABLE webhook_attempts(
 workspace_id uuid NOT NULL,delivery_id uuid NOT NULL,attempt_number integer NOT NULL CHECK(attempt_number>0),phase text NOT NULL CHECK(phase IN('started','authorized','settled','recovered')),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),status_code integer CHECK(status_code BETWEEN 100 AND 599),secret_version integer CHECK(secret_version>0),
 error_class text CHECK(error_class IN('authority_revoked','event_integrity','unsafe_target','capacity','aborted','transient','rate_deferred','retry_budget_exhausted','http_terminal','key_unavailable')),
 PRIMARY KEY(workspace_id,delivery_id,attempt_number,phase),FOREIGN KEY(workspace_id,delivery_id)REFERENCES webhook_deliveries(workspace_id,id),CHECK(status_code IS NULL OR phase='settled')
);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['webhook_queue_state','webhook_deliveries','webhook_attempts']LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY webhook_history ON %I FOR SELECT TO mailcraft_runtime USING(mailcraft_webhook_manager(workspace_id,''webhooks:read'')OR mailcraft_webhook_manager(workspace_id,''webhooks:write''))',t);
 EXECUTE format('CREATE POLICY webhook_worker_read ON %I FOR SELECT TO mailcraft_webhook_worker USING(true)',t);
 EXECUTE format('CREATE POLICY webhook_worker_insert ON %I FOR INSERT TO mailcraft_webhook_worker WITH CHECK(true)',t);
 EXECUTE format('CREATE POLICY webhook_retention_read ON %I FOR SELECT TO mailcraft_webhook_maintenance USING(true)',t);
 EXECUTE format('CREATE POLICY webhook_retention_delete ON %I FOR DELETE TO mailcraft_webhook_maintenance USING(true)',t);
 EXECUTE format('GRANT SELECT ON %I TO mailcraft_runtime',t);
 EXECUTE format('GRANT SELECT,INSERT ON %I TO mailcraft_webhook_worker',t);
 EXECUTE format('GRANT SELECT,DELETE ON %I TO mailcraft_webhook_maintenance',t);
 END LOOP;END $$;
GRANT UPDATE ON webhook_queue_state,webhook_deliveries TO mailcraft_webhook_worker;
CREATE POLICY webhook_worker_state_update ON webhook_queue_state FOR UPDATE TO mailcraft_webhook_worker USING(true)WITH CHECK(true);
CREATE POLICY webhook_worker_delivery_update ON webhook_deliveries FOR UPDATE TO mailcraft_webhook_worker USING(true)WITH CHECK(true);
CREATE FUNCTION mailcraft_preserve_webhook_delivery()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF (NEW.workspace_id,NEW.id,NEW.endpoint_id,NEW.event_id,NEW.created_at,NEW.deadline,NEW.policy_version)IS DISTINCT FROM(OLD.workspace_id,OLD.id,OLD.endpoint_id,OLD.event_id,OLD.created_at,OLD.deadline,OLD.policy_version)THEN RAISE EXCEPTION 'Webhook logical identity/budget is immutable';END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER webhook_preserve_delivery BEFORE UPDATE ON webhook_deliveries FOR EACH ROW EXECUTE FUNCTION mailcraft_preserve_webhook_delivery();
CREATE FUNCTION mailcraft_preserve_webhook_attempt()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF TG_OP='DELETE' AND pg_has_role(current_user,'mailcraft_webhook_maintenance','USAGE')THEN RETURN OLD;END IF;
 RAISE EXCEPTION 'Webhook attempt evidence is append-only';
END $$;
CREATE TRIGGER webhook_preserve_attempt BEFORE UPDATE OR DELETE ON webhook_attempts FOR EACH ROW EXECUTE FUNCTION mailcraft_preserve_webhook_attempt();
CREATE FUNCTION mailcraft_webhook_endpoint_fence()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('lettercape.webhook.endpoint.'||NEW.workspace_id::text||':'||NEW.id::text,0));RETURN NEW;
END $$;
CREATE TRIGGER webhook_endpoint_fence BEFORE INSERT OR UPDATE ON webhook_endpoints FOR EACH ROW EXECUTE FUNCTION mailcraft_webhook_endpoint_fence();
REVOKE ALL ON FUNCTION mailcraft_preserve_webhook_delivery(),mailcraft_preserve_webhook_attempt(),mailcraft_webhook_endpoint_fence()FROM PUBLIC;
