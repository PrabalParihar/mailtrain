-- A 429 dead-letter inside an open budget means its deferral cannot fit that budget.
-- Replay may not shorten that deferral; extending the immutable budget requires a new approved policy.
GRANT SELECT(workspace_id,delivery_id,attempt_number,phase,status_code)ON webhook_attempts TO mailcraft_webhook_replayer;
CREATE POLICY webhook_replay_attempt_read ON webhook_attempts FOR SELECT TO mailcraft_webhook_replayer USING(true);
CREATE OR REPLACE FUNCTION mailcraft_replay_webhook(w uuid,d uuid,expected integer,ack boolean)RETURNS SETOF webhook_deliveries LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
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
 IF EXISTS(SELECT 1 FROM webhook_attempts WHERE workspace_id=w AND delivery_id=d AND attempt_number=receipt.attempt_number AND phase='settled' AND status_code=429)THEN RAISE EXCEPTION 'REPLAY_RATE_DEFERRED';END IF;
 IF NOT mailcraft_webhook_service_authorized(w,receipt.endpoint_id)THEN RAISE EXCEPTION 'REPLAY_AUTHORITY_REVOKED';END IF;
 IF NOT EXISTS(SELECT 1 FROM webhook_signing_keys k JOIN webhook_endpoints e ON e.workspace_id=k.workspace_id AND e.id=k.endpoint_id AND e.secret_version=k.secret_version WHERE e.workspace_id=w AND e.id=receipt.endpoint_id AND k.state='current')THEN RAISE EXCEPTION 'REPLAY_KEY_UNAVAILABLE';END IF;
 IF (SELECT count(*)FROM webhook_deliveries WHERE workspace_id=w AND state IN('pending','leased'))>=1000 THEN RAISE EXCEPTION 'WEBHOOK_BACKLOG_FULL';END IF;
 RETURN QUERY UPDATE webhook_deliveries SET state='pending',next_at=clock_timestamp(),error_class=NULL WHERE workspace_id=w AND id=d RETURNING *;
 END;
$$;
