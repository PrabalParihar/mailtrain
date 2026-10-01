ALTER TABLE webhook_attempts ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX webhook_attempt_identity ON webhook_attempts(workspace_id,id);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_webhook_replayer')THEN CREATE ROLE mailcraft_webhook_replayer NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_webhook_replayer' AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole))THEN RAISE EXCEPTION 'Webhook replayer must be restricted NOLOGIN';END IF;
END $$;
GRANT mailcraft_webhook_authorizer TO mailcraft_webhook_replayer;
GRANT USAGE ON SCHEMA public TO mailcraft_webhook_replayer;
GRANT EXECUTE ON FUNCTION mailcraft_webhook_manager(uuid,text),mailcraft_webhook_service_authorized(uuid,uuid)TO mailcraft_webhook_replayer;
GRANT SELECT ON webhook_deliveries TO mailcraft_webhook_replayer;
GRANT SELECT(workspace_id,endpoint_id,secret_version,state)ON webhook_signing_keys TO mailcraft_webhook_replayer;
GRANT UPDATE(state,next_at,error_class)ON webhook_deliveries TO mailcraft_webhook_replayer;
CREATE POLICY webhook_replay_read ON webhook_deliveries FOR SELECT TO mailcraft_webhook_replayer USING(true);
CREATE POLICY webhook_replay_update ON webhook_deliveries FOR UPDATE TO mailcraft_webhook_replayer USING(true)WITH CHECK(true);
CREATE POLICY webhook_replay_key_read ON webhook_signing_keys FOR SELECT TO mailcraft_webhook_replayer USING(state='current');
CREATE FUNCTION mailcraft_replay_webhook(w uuid,d uuid,expected integer,ack boolean)RETURNS SETOF webhook_deliveries LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 DECLARE receipt webhook_deliveries%ROWTYPE;
 BEGIN
 IF NOT coalesce(mailcraft_webhook_manager(w,'webhooks:write'),false)THEN RAISE EXCEPTION 'REPLAY_FORBIDDEN';END IF;
 IF ack IS DISTINCT FROM true THEN RAISE EXCEPTION 'REPLAY_ACK_REQUIRED';END IF;
 IF NOT pg_try_advisory_xact_lock(hashtextextended('lettercape.webhook.queue.capacity.v1',0))THEN RAISE EXCEPTION 'WEBHOOK_QUEUE_BUSY';END IF;
 SELECT * INTO receipt FROM webhook_deliveries WHERE workspace_id=w AND id=d FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'RESOURCE_NOT_FOUND';END IF;
 IF receipt.attempt_number IS DISTINCT FROM expected THEN RAISE EXCEPTION 'REPLAY_VERSION_CONFLICT';END IF;
 IF receipt.state NOT IN('terminal','dead_letter')THEN RAISE EXCEPTION 'REPLAY_STATE_CONFLICT';END IF;
 IF receipt.deadline<=clock_timestamp()OR receipt.failure_attempts>=10 THEN RAISE EXCEPTION 'REPLAY_BUDGET_EXPIRED';END IF;
 IF NOT mailcraft_webhook_service_authorized(w,receipt.endpoint_id)THEN RAISE EXCEPTION 'REPLAY_AUTHORITY_REVOKED';END IF;
 IF NOT EXISTS(SELECT 1 FROM webhook_signing_keys k JOIN webhook_endpoints e ON e.workspace_id=k.workspace_id AND e.id=k.endpoint_id AND e.secret_version=k.secret_version WHERE e.workspace_id=w AND e.id=receipt.endpoint_id AND k.state='current')THEN RAISE EXCEPTION 'REPLAY_KEY_UNAVAILABLE';END IF;
 IF (SELECT count(*)FROM webhook_deliveries WHERE workspace_id=w AND state IN('pending','leased'))>=1000 THEN RAISE EXCEPTION 'WEBHOOK_BACKLOG_FULL';END IF;
 RETURN QUERY UPDATE webhook_deliveries SET state='pending',next_at=clock_timestamp(),error_class=NULL WHERE workspace_id=w AND id=d RETURNING *;
 END;
$$;
GRANT CREATE ON SCHEMA public TO mailcraft_webhook_replayer;
ALTER FUNCTION mailcraft_replay_webhook(uuid,uuid,integer,boolean)OWNER TO mailcraft_webhook_replayer;
REVOKE CREATE ON SCHEMA public FROM mailcraft_webhook_replayer;
REVOKE ALL ON FUNCTION mailcraft_replay_webhook(uuid,uuid,integer,boolean)FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_replay_webhook(uuid,uuid,integer,boolean)TO mailcraft_runtime;
