DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_event_maintenance') THEN
  CREATE ROLE mailcraft_event_maintenance NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_event_maintenance' AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole)) THEN
  RAISE EXCEPTION 'Event maintenance authority must be a restricted NOLOGIN role';
 END IF;
END $$;
ALTER TABLE outbox ADD COLUMN event_schema_version integer;
ALTER TABLE outbox ADD COLUMN event_body text;
ALTER TABLE outbox ADD COLUMN event_hash text;
ALTER TABLE outbox ADD CONSTRAINT versioned_event_shape CHECK(
 (event_schema_version IS NULL AND event_body IS NULL AND event_hash IS NULL) OR
 (event_schema_version IS NOT NULL AND event_schema_version=1 AND event_body IS NOT NULL AND event_hash IS NOT NULL AND
  octet_length(event_body) BETWEEN 1 AND 65536 AND event_hash=encode(sha256(convert_to(event_body,'UTF8')),'hex') AND
  coalesce((event_body::jsonb->>'id')=id::text AND (event_body::jsonb->>'workspace_id')=workspace_id::text AND
    (event_body::jsonb->>'type')=type AND (event_body::jsonb->>'schema_version')='1' AND
    jsonb_typeof(event_body::jsonb->'schema_version')='number' AND
    (event_body::jsonb->'aggregate'->>'id')=aggregate_id::text AND
    jsonb_typeof(event_body::jsonb->'aggregate'->'version')='number' AND
    (event_body::jsonb->'aggregate'->>'version')::integer>0 AND
    ((type IN('contact.unsubscribed','contact.topic_unsubscribed') AND event_body::jsonb->'aggregate'->>'type'='contact' AND event_body::jsonb->'data'->>'contact_id'=aggregate_id::text) OR
     (type='contacts.imported' AND event_body::jsonb->'aggregate'->>'type'='operation' AND event_body::jsonb->'data'->>'operation_id'=aggregate_id::text)),false))
);
CREATE UNIQUE INDEX outbox_versioned_transition ON outbox(workspace_id,type,aggregate_id,((event_body::jsonb->'aggregate'->>'version')::integer)) WHERE event_body IS NOT NULL;
GRANT USAGE ON SCHEMA public TO mailcraft_event_maintenance;
GRANT SELECT,DELETE ON outbox TO mailcraft_event_maintenance;
CREATE POLICY event_maintenance_context ON outbox FOR SELECT TO mailcraft_event_maintenance USING(true);
CREATE POLICY event_maintenance_delete ON outbox FOR DELETE TO mailcraft_event_maintenance USING(true);
CREATE FUNCTION mailcraft_preserve_versioned_event() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.event_body IS NOT NULL AND NOT pg_has_role(current_user,'mailcraft_event_maintenance','USAGE') THEN
   RAISE EXCEPTION 'Versioned event retention requires separate maintenance authority';
  END IF;
  RETURN OLD;
 END IF;
 IF OLD.event_body IS NULL AND NEW.event_body IS NOT NULL THEN
  RAISE EXCEPTION 'Legacy event provenance cannot be inferred or upgraded';
 END IF;
 IF OLD.event_body IS NOT NULL AND (NEW.workspace_id,NEW.id,NEW.type,NEW.aggregate_id,NEW.data,NEW.recorded_at,NEW.event_schema_version,NEW.event_body,NEW.event_hash)
  IS DISTINCT FROM (OLD.workspace_id,OLD.id,OLD.type,OLD.aggregate_id,OLD.data,OLD.recorded_at,OLD.event_schema_version,OLD.event_body,OLD.event_hash) THEN
  RAISE EXCEPTION 'Versioned event content is immutable';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION mailcraft_preserve_versioned_event() FROM PUBLIC;
CREATE TRIGGER outbox_preserve_versioned_event BEFORE UPDATE OR DELETE ON outbox FOR EACH ROW EXECUTE FUNCTION mailcraft_preserve_versioned_event();
