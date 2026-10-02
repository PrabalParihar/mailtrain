ALTER TABLE workspaces ADD COLUMN timezone_version integer NOT NULL DEFAULT 1 CHECK(timezone_version>0);
ALTER TABLE campaigns ADD COLUMN planned_at timestamptz;

-- An index of a complete, valid existing plan; it is never an accepted delivery schedule.
CREATE FUNCTION mailcraft_calendar_instant(intent jsonb) RETURNS timestamptz LANGUAGE plpgsql STABLE SET search_path=pg_catalog,public AS $$
DECLARE timing jsonb:=intent->'planned_timing'; instant timestamptz; local_minute timestamp; zone text; offset_seconds integer;
BEGIN
 IF jsonb_typeof(timing) IS DISTINCT FROM 'object' THEN RETURN NULL; END IF;
 IF (SELECT count(*) FROM jsonb_object_keys(timing))<>4 OR NOT timing ?& ARRAY['local_time','time_zone','utc_offset','utc'] THEN RETURN NULL; END IF;
 IF EXISTS(SELECT FROM jsonb_each(timing) WHERE jsonb_typeof(value)<>'string') THEN RETURN NULL; END IF;
 zone:=timing->>'time_zone';
 IF zone !~ '^[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+)*$' OR NOT EXISTS(SELECT FROM pg_timezone_names WHERE lower(name)=lower(zone)) THEN RETURN NULL; END IF;
 IF timing->>'local_time' !~ '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]$' OR timing->>'utc' !~ '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:00[.]000Z$' OR timing->>'utc_offset' !~ '^[+-](0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$' THEN RETURN NULL; END IF;
 instant:=(timing->>'utc')::timestamptz;
 local_minute:=((timing->>'local_time')||':00')::timestamp;
 offset_seconds:=(substring(timing->>'utc_offset',2,2)::integer*60+substring(timing->>'utc_offset',5,2)::integer)*60;
 IF left(timing->>'utc_offset',1)='-' THEN offset_seconds:=-offset_seconds; END IF;
 IF instant AT TIME ZONE zone IS DISTINCT FROM local_minute OR extract(epoch FROM((instant AT TIME ZONE zone)-(instant AT TIME ZONE 'UTC')))<>offset_seconds THEN RETURN NULL; END IF;
 RETURN instant;
EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow OR invalid_parameter_value THEN RETURN NULL;
END$$;
REVOKE ALL ON FUNCTION mailcraft_calendar_instant(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_calendar_instant(jsonb) TO mailcraft_runtime;
UPDATE campaigns SET planned_at=mailcraft_calendar_instant(intent);
CREATE INDEX campaigns_planned_calendar ON campaigns(workspace_id,planned_at,id) WHERE planned_at IS NOT NULL;

CREATE FUNCTION mailcraft_campaign_calendar_derived() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);
BEGIN
 IF TG_OP='UPDATE' AND invoker='mailcraft_runtime' AND NEW.intent IS NOT DISTINCT FROM OLD.intent AND NEW.planned_at IS DISTINCT FROM OLD.planned_at THEN RAISE EXCEPTION 'CALENDAR_INDEX_DERIVED'; END IF;
 NEW.planned_at:=mailcraft_calendar_instant(NEW.intent);
 RETURN NEW;
END$$;
CREATE TRIGGER campaign_calendar_derived BEFORE INSERT OR UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION mailcraft_campaign_calendar_derived();
REVOKE ALL ON FUNCTION mailcraft_campaign_calendar_derived() FROM PUBLIC;

CREATE FUNCTION mailcraft_workspace_timezone_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user); actor_role text;
BEGIN
 IF invoker<>'mailcraft_runtime' THEN RETURN NEW; END IF;
 IF NEW.timezone IS NOT DISTINCT FROM OLD.timezone THEN
  IF NEW.timezone_version IS DISTINCT FROM OLD.timezone_version THEN RAISE EXCEPTION 'WORKSPACE_TIMEZONE_VERSION_REQUIRED'; END IF;
  RETURN NEW;
 END IF;
 IF OLD.id::text IS DISTINCT FROM current_setting('app.workspace_id',true) OR OLD.status<>'active' THEN RAISE EXCEPTION 'WORKSPACE_TIMEZONE_MANAGER_REQUIRED'; END IF;
 SELECT role INTO actor_role FROM memberships WHERE workspace_id=OLD.id AND user_id=current_setting('app.user_id',true) AND status='active' FOR SHARE;
 IF actor_role IS NULL OR actor_role NOT IN('Owner','Admin') THEN RAISE EXCEPTION 'WORKSPACE_TIMEZONE_MANAGER_REQUIRED'; END IF;
 IF NEW.timezone !~ '^[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+)*$' OR NOT EXISTS(SELECT FROM pg_timezone_names WHERE lower(name)=lower(NEW.timezone)) THEN RAISE EXCEPTION 'WORKSPACE_TIMEZONE_INVALID'; END IF;
 IF OLD.timezone_version=2147483647 OR NEW.timezone_version<>OLD.timezone_version+1 THEN RAISE EXCEPTION 'WORKSPACE_TIMEZONE_VERSION_REQUIRED'; END IF;
 RETURN NEW;
END$$;
CREATE TRIGGER workspace_timezone_guard BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION mailcraft_workspace_timezone_guard();
REVOKE ALL ON FUNCTION mailcraft_workspace_timezone_guard() FROM PUBLIC;
