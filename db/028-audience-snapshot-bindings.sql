-- Never reinterpret an older private intent field as a newly supported source pin.
DO $$BEGIN
 IF EXISTS(SELECT FROM campaigns WHERE intent ? 'audience_snapshot')
 OR EXISTS(SELECT FROM campaign_revisions WHERE intent ? 'audience_snapshot')THEN
  RAISE EXCEPTION 'AUDIENCE_SNAPSHOT_RESERVED_KEY_COLLISION';
 END IF;
END$$;

ALTER TABLE campaigns ADD COLUMN audience_snapshot_id uuid
 GENERATED ALWAYS AS ((NULLIF(intent#>>'{audience_snapshot,id}',''))::uuid) STORED;
ALTER TABLE campaign_revisions ADD COLUMN audience_snapshot_id uuid
 GENERATED ALWAYS AS ((NULLIF(intent#>>'{audience_snapshot,id}',''))::uuid) STORED;
ALTER TABLE campaigns ADD CONSTRAINT campaign_audience_snapshot_tenant_fk
 FOREIGN KEY(workspace_id,audience_snapshot_id)REFERENCES audience_snapshots(workspace_id,id);
ALTER TABLE campaign_revisions ADD CONSTRAINT campaign_history_audience_snapshot_tenant_fk
 FOREIGN KEY(workspace_id,audience_snapshot_id)REFERENCES audience_snapshots(workspace_id,id);

CREATE FUNCTION mailcraft_audience_snapshot_immutable()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);
BEGIN
 IF TG_OP='DELETE'AND(invoker='mailcraft_migration'OR EXISTS(SELECT FROM pg_roles WHERE rolname=invoker AND rolsuper))THEN RETURN OLD;END IF;
 RAISE EXCEPTION 'AUDIENCE_SNAPSHOT_IMMUTABLE';
END$$;
CREATE TRIGGER audience_snapshot_immutable BEFORE UPDATE OR DELETE ON audience_snapshots
 FOR EACH ROW EXECUTE FUNCTION mailcraft_audience_snapshot_immutable();
REVOKE ALL ON FUNCTION mailcraft_audience_snapshot_immutable()FROM PUBLIC;

-- The existing NOLOGIN/non-bypass history role must validate pins when its capture
-- trigger inserts history. Its only additional privilege is source SELECT; every
-- lookup below explicitly binds NEW.workspace_id as well as the requested ID.
GRANT SELECT ON audience_snapshots TO mailcraft_campaign_history_admin;
CREATE POLICY audience_binding_source_read ON audience_snapshots FOR SELECT
 TO mailcraft_campaign_history_admin USING(true);
CREATE FUNCTION mailcraft_campaign_audience_binding()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE source public.audience_snapshots%ROWTYPE; source_id uuid; pointer jsonb;
BEGIN
 IF NOT NEW.intent ? 'audience_snapshot'THEN
  IF TG_OP='UPDATE'AND OLD.intent ? 'audience_snapshot'THEN RAISE EXCEPTION 'AUDIENCE_SNAPSHOT_BINDING_INVALID';END IF;
  RETURN NEW;
 END IF;
 -- BEFORE triggers cannot read the not-yet-computed generated NEW column.
 IF jsonb_typeof(NEW.intent->'audience_snapshot')IS DISTINCT FROM 'object'
 OR coalesce(NEW.intent#>>'{audience_snapshot,id}','')!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'THEN
  RAISE EXCEPTION 'AUDIENCE_SNAPSHOT_BINDING_INVALID';
 END IF;
 source_id:=(NEW.intent#>>'{audience_snapshot,id}')::uuid;
 SELECT * INTO source FROM public.audience_snapshots WHERE workspace_id=NEW.workspace_id AND id=source_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'AUDIENCE_SNAPSHOT_BINDING_INVALID';END IF;
 pointer:=jsonb_build_object('id',source.id,'segment_id',source.segment_id,'segment_version',source.segment_version,
  'evaluated_at',to_char(source.evaluated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'matched_count',source.matched_count,'eligible_count',source.eligible_count,'digest',source.digest);
 IF NEW.intent->'audience_snapshot'IS DISTINCT FROM pointer OR NEW.intent->'audience'IS DISTINCT FROM source.members THEN
  RAISE EXCEPTION 'AUDIENCE_SNAPSHOT_BINDING_INVALID';
 END IF;
 RETURN NEW;
END$$;
CREATE TRIGGER campaign_audience_binding BEFORE INSERT OR UPDATE ON campaigns
 FOR EACH ROW EXECUTE FUNCTION mailcraft_campaign_audience_binding();
CREATE TRIGGER campaign_history_audience_binding BEFORE INSERT ON campaign_revisions
 FOR EACH ROW EXECUTE FUNCTION mailcraft_campaign_audience_binding();
GRANT CREATE ON SCHEMA public TO mailcraft_campaign_history_admin;
ALTER FUNCTION mailcraft_campaign_audience_binding()OWNER TO mailcraft_campaign_history_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_campaign_history_admin;
REVOKE ALL ON FUNCTION mailcraft_campaign_audience_binding()FROM PUBLIC;
