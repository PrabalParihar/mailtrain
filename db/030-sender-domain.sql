-- Local sender configuration is a draft, never authenticated provider evidence.
-- Reuse the restricted capture role established by 026; runtime cannot assume it.
DO $$BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_campaign_history_admin')OR EXISTS(
  SELECT FROM pg_roles WHERE rolname='mailcraft_campaign_history_admin'AND(rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole))THEN
  RAISE EXCEPTION 'SENDER_CAPTURE_ROLE_UNSAFE';
 END IF;
END$$;

CREATE FUNCTION mailcraft_sender_manager(w uuid,required_scope text)RETURNS boolean LANGUAGE sql VOLATILE SET search_path=pg_catalog,public AS $$
 SELECT w::text=current_setting('app.workspace_id',true)AND EXISTS(
  SELECT FROM public.workspaces ws JOIN public.memberships m ON m.workspace_id=ws.id
  WHERE ws.id=w AND ws.status='active'AND m.status='active'AND m.role IN('Owner','Admin')AND
  ((current_setting('app.user_id',true)NOT LIKE 'api-key:%'AND m.user_id=current_setting('app.user_id',true))OR EXISTS(
   SELECT FROM public.api_keys k WHERE k.workspace_id=w AND k.id::text=substring(current_setting('app.user_id',true)FROM 9)
   AND current_setting('app.user_id',true)LIKE 'api-key:%'AND k.created_by=m.user_id
   AND k.revoked_at IS NULL AND k.expires_at>clock_timestamp()AND k.scopes ? required_scope)))
$$;
REVOKE ALL ON FUNCTION mailcraft_sender_manager(uuid,text)FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_sender_manager(uuid,text)TO mailcraft_runtime;

CREATE FUNCTION mailcraft_sender_domain_valid(value text)RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT coalesce(length(value)BETWEEN 3 AND 253 AND value=lower(value)
 AND value~'^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
 AND value!~'^[0-9.]+$'AND value!~'\.(local|internal|localhost|home|lan)$'
 AND NOT EXISTS(SELECT FROM unnest(string_to_array(value,'.'))label WHERE length(label)>63),false)
$$;
CREATE FUNCTION mailcraft_sender_address_valid(value text)RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,public AS $$
 SELECT coalesce(length(value)BETWEEN 3 AND 254 AND value!~'[[:cntrl:]]'
 AND value~'^[A-Za-z0-9!#$%&''*+/=?^_`{|}~.-]+@[^@]+$'
 AND split_part(value,'@',1)!~'(^\.|\.$|\.\.)'
 AND public.mailcraft_sender_domain_valid(split_part(value,'@',2)),false)
$$;
CREATE FUNCTION mailcraft_sender_snapshot_valid(value jsonb)RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,public AS $$
DECLARE field text;
BEGIN
 IF jsonb_typeof(value)IS DISTINCT FROM 'object'OR NOT(value ?& ARRAY['name','provider','account_label','region','from_name','from_address','reply_to','domain'])
 OR value-ARRAY['name','provider','account_label','region','from_name','from_address','reply_to','domain']<>'{}'::jsonb THEN RETURN false;END IF;
 FOREACH field IN ARRAY ARRAY['name','account_label','region','from_name']LOOP
  IF jsonb_typeof(value->field)IS DISTINCT FROM 'string'OR length(value->>field)NOT BETWEEN 1 AND(CASE WHEN field='region'THEN 40 ELSE 100 END)
  OR btrim(value->>field)IS DISTINCT FROM value->>field OR value->>field~'[[:cntrl:]]'THEN RETURN false;END IF;
 END LOOP;
 RETURN coalesce(value->>'provider'IN('ses','resend','sendgrid','mailgun')AND jsonb_typeof(value->'provider')='string'
 AND jsonb_typeof(value->'from_address')='string'AND public.mailcraft_sender_address_valid(value->>'from_address')
 AND jsonb_typeof(value->'domain')='string'AND value->>'domain'=split_part(value->>'from_address','@',2)
 AND(value->'reply_to'='null'::jsonb OR(jsonb_typeof(value->'reply_to')='string'AND public.mailcraft_sender_address_valid(value->>'reply_to'))),false);
END$$;

CREATE FUNCTION mailcraft_sender_dns_valid(value jsonb)RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,public AS $$
DECLARE purpose text;discovery jsonb;record jsonb;count_records integer;total_bytes integer:=0;
BEGIN
 IF jsonb_typeof(value)IS DISTINCT FROM 'object'OR NOT(value ?& ARRAY['domain','observed_at','scope','spf','dmarc','provider_verified','authentication_verified','sending_enabled'])
 OR value-ARRAY['domain','observed_at','scope','spf','dmarc','provider_verified','authentication_verified','sending_enabled']<>'{}'::jsonb
 OR jsonb_typeof(value->'domain')IS DISTINCT FROM 'string'OR NOT public.mailcraft_sender_domain_valid(value->>'domain')
 OR value->'scope'IS DISTINCT FROM '"exact_domain_txt"'::jsonb
 OR value->'provider_verified'IS DISTINCT FROM 'false'::jsonb OR value->'authentication_verified'IS DISTINCT FROM 'false'::jsonb
 OR value->'sending_enabled'IS DISTINCT FROM 'false'::jsonb OR jsonb_typeof(value->'observed_at')IS DISTINCT FROM 'string'
 OR value->>'observed_at'!~'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$'THEN RETURN false;END IF;
 PERFORM(value->>'observed_at')::timestamptz;
 FOREACH purpose IN ARRAY ARRAY['spf','dmarc']LOOP
  discovery:=value->purpose;
  IF jsonb_typeof(discovery)IS DISTINCT FROM 'object'OR NOT(discovery ?& ARRAY['owner','records','status'])
  OR discovery-ARRAY['owner','records','status','error']<>'{}'::jsonb
  OR discovery->'owner'IS DISTINCT FROM to_jsonb(CASE WHEN purpose='spf'THEN value->>'domain'ELSE '_dmarc.'||(value->>'domain')END)
  OR jsonb_typeof(discovery->'records')IS DISTINCT FROM 'array'OR jsonb_typeof(discovery->'status')IS DISTINCT FROM 'string'
  OR discovery->>'status'NOT IN('missing','single_record','multiple_records','unavailable')THEN RETURN false;END IF;
  count_records:=jsonb_array_length(discovery->'records');IF count_records>40 THEN RETURN false;END IF;
  FOR record IN SELECT * FROM jsonb_array_elements(discovery->'records')LOOP
   IF jsonb_typeof(record)IS DISTINCT FROM 'string'OR length(record#>>'{}')>4096 THEN RETURN false;END IF;
   total_bytes:=total_bytes+octet_length(record#>>'{}');
   IF(purpose='spf'AND record#>>'{}'!~*'^v=spf1([[:space:]]|$)')OR(purpose='dmarc'AND record#>>'{}'!~*'^v=DMARC1(;|[[:space:]]|$)')THEN RETURN false;END IF;
  END LOOP;
  IF total_bytes>32768 OR(discovery->>'status'IN('missing','unavailable')AND count_records<>0)
  OR(discovery->>'status'='single_record'AND count_records<>1)OR(discovery->>'status'='multiple_records'AND count_records<2)THEN RETURN false;END IF;
  IF discovery ? 'error'THEN
   IF jsonb_typeof(discovery->'error')IS DISTINCT FROM 'string'OR discovery->>'error'NOT IN('not_found','timeout','reserved_domain','response_limit','resolver_unavailable')THEN RETURN false;END IF;
  END IF;
 END LOOP;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END$$;

CREATE TABLE sender_identities(
 workspace_id uuid NOT NULL REFERENCES workspaces(id),id uuid NOT NULL DEFAULT gen_random_uuid(),version integer NOT NULL DEFAULT 1 CHECK(version>0),
 name text NOT NULL,provider text NOT NULL,account_label text NOT NULL,region text NOT NULL,from_name text NOT NULL,from_address text NOT NULL,reply_to text,domain text NOT NULL,
 connection_status text NOT NULL DEFAULT 'not_connected'CHECK(connection_status='not_connected'),sending_enabled boolean NOT NULL DEFAULT false CHECK(sending_enabled=false),
 created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,id),CHECK(mailcraft_sender_snapshot_valid(jsonb_build_object('name',name,'provider',provider,'account_label',account_label,'region',region,'from_name',from_name,'from_address',from_address,'reply_to',reply_to,'domain',domain)))
);
CREATE TABLE sender_identity_versions(
 workspace_id uuid NOT NULL,sender_id uuid NOT NULL,version integer NOT NULL CHECK(version>0),snapshot jsonb NOT NULL CHECK(mailcraft_sender_snapshot_valid(snapshot)),
 created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,sender_id,version),
 FOREIGN KEY(workspace_id,sender_id)REFERENCES sender_identities(workspace_id,id)ON DELETE CASCADE
);
CREATE TABLE domain_checks(
 workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),sender_id uuid NOT NULL,sender_version integer NOT NULL CHECK(sender_version>0),
 observation jsonb NOT NULL CHECK(mailcraft_sender_dns_valid(observation)),created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,sender_id,sender_version)REFERENCES sender_identity_versions(workspace_id,sender_id,version)ON DELETE CASCADE
);
CREATE INDEX sender_list ON sender_identities(workspace_id,created_at DESC,id DESC);
CREATE INDEX sender_checks ON domain_checks(workspace_id,sender_id,created_at DESC,id DESC);
DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['sender_identities','sender_identity_versions','domain_checks']LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY sender_read ON %I FOR SELECT TO mailcraft_runtime USING(mailcraft_sender_manager(workspace_id,''sender:read'')OR mailcraft_sender_manager(workspace_id,''sender:write''))',t);
 END LOOP;
END$$;
CREATE POLICY sender_create ON sender_identities FOR INSERT TO mailcraft_runtime WITH CHECK(mailcraft_sender_manager(workspace_id,'sender:write'));
CREATE POLICY sender_update ON sender_identities FOR UPDATE TO mailcraft_runtime USING(mailcraft_sender_manager(workspace_id,'sender:write'))WITH CHECK(mailcraft_sender_manager(workspace_id,'sender:write'));
CREATE POLICY sender_check_create ON domain_checks FOR INSERT TO mailcraft_runtime WITH CHECK(mailcraft_sender_manager(workspace_id,'sender:write'));
CREATE POLICY sender_version_capture ON sender_identity_versions FOR INSERT TO mailcraft_campaign_history_admin WITH CHECK(true);
GRANT INSERT ON sender_identity_versions TO mailcraft_campaign_history_admin;
REVOKE ALL ON sender_identities,sender_identity_versions,domain_checks FROM mailcraft_runtime;
GRANT SELECT,INSERT,UPDATE ON sender_identities TO mailcraft_runtime;
GRANT SELECT ON sender_identity_versions TO mailcraft_runtime;
GRANT SELECT,INSERT ON domain_checks TO mailcraft_runtime;

CREATE FUNCTION mailcraft_sender_guard()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);actor text:=nullif(current_setting('app.user_id',true),'');material boolean;
BEGIN
 IF invoker='mailcraft_runtime'AND NOT coalesce(public.mailcraft_sender_manager(NEW.workspace_id,'sender:write'),false)THEN RAISE EXCEPTION 'SENDER_MANAGER_REQUIRED';END IF;
 IF NEW.domain IS DISTINCT FROM split_part(NEW.from_address,'@',2)THEN RAISE EXCEPTION 'SENDER_DOMAIN_DERIVED';END IF;
 IF TG_OP='INSERT'THEN
  IF NEW.version<>1 THEN RAISE EXCEPTION 'SENDER_VERSION_REQUIRED';END IF;
  IF invoker='mailcraft_runtime'AND NEW.created_by IS DISTINCT FROM actor THEN RAISE EXCEPTION 'SENDER_IDENTITY_IMMUTABLE';END IF;
  NEW.created_at:=clock_timestamp();NEW.updated_at:=NEW.created_at;
 ELSE
  IF ROW(NEW.workspace_id,NEW.id,NEW.created_by,NEW.created_at)IS DISTINCT FROM ROW(OLD.workspace_id,OLD.id,OLD.created_by,OLD.created_at)THEN RAISE EXCEPTION 'SENDER_IDENTITY_IMMUTABLE';END IF;
  material:=ROW(NEW.name,NEW.provider,NEW.account_label,NEW.region,NEW.from_name,NEW.from_address,NEW.reply_to,NEW.domain)IS DISTINCT FROM ROW(OLD.name,OLD.provider,OLD.account_label,OLD.region,OLD.from_name,OLD.from_address,OLD.reply_to,OLD.domain);
  IF(material AND(OLD.version=2147483647 OR NEW.version<>OLD.version+1))OR(NOT material AND NEW.version<>OLD.version)THEN RAISE EXCEPTION 'SENDER_VERSION_REQUIRED';END IF;
  NEW.updated_at:=CASE WHEN material THEN clock_timestamp()ELSE OLD.updated_at END;
 END IF;
 RETURN NEW;
END$$;
CREATE TRIGGER sender_guard BEFORE INSERT OR UPDATE ON sender_identities FOR EACH ROW EXECUTE FUNCTION mailcraft_sender_guard();

CREATE FUNCTION mailcraft_capture_sender()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF TG_OP='UPDATE'AND NEW.version=OLD.version THEN RETURN NEW;END IF;
 INSERT INTO public.sender_identity_versions(workspace_id,sender_id,version,snapshot,created_by)
 VALUES(NEW.workspace_id,NEW.id,NEW.version,jsonb_build_object('name',NEW.name,'provider',NEW.provider,'account_label',NEW.account_label,'region',NEW.region,'from_name',NEW.from_name,'from_address',NEW.from_address,'reply_to',NEW.reply_to,'domain',NEW.domain),
 CASE WHEN coalesce(nullif(current_setting('role',true),'none'),session_user)='mailcraft_runtime'THEN current_setting('app.user_id',true)ELSE NEW.created_by END);
 RETURN NEW;
END$$;
CREATE TRIGGER sender_capture AFTER INSERT OR UPDATE ON sender_identities FOR EACH ROW EXECUTE FUNCTION mailcraft_capture_sender();
GRANT CREATE ON SCHEMA public TO mailcraft_campaign_history_admin;
ALTER FUNCTION mailcraft_capture_sender()OWNER TO mailcraft_campaign_history_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_campaign_history_admin;

CREATE FUNCTION mailcraft_sender_check_guard()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);source public.sender_identities;
BEGIN
 IF invoker<>'mailcraft_runtime'THEN RETURN NEW;END IF;
 IF NOT coalesce(public.mailcraft_sender_manager(NEW.workspace_id,'sender:write'),false)THEN RAISE EXCEPTION 'SENDER_MANAGER_REQUIRED';END IF;
 SELECT * INTO source FROM public.sender_identities WHERE workspace_id=NEW.workspace_id AND id=NEW.sender_id FOR SHARE;
 -- Check authority again after the sender lock wait; do not attach an old observation to a new source.
 IF NOT coalesce(public.mailcraft_sender_manager(NEW.workspace_id,'sender:write'),false)THEN RAISE EXCEPTION 'SENDER_MANAGER_REQUIRED';END IF;
 IF source.id IS NULL OR source.version<>NEW.sender_version OR source.domain IS DISTINCT FROM NEW.observation->>'domain'THEN RAISE EXCEPTION 'SENDER_CHECK_SOURCE_REQUIRED';END IF;
 IF NEW.created_by IS DISTINCT FROM current_setting('app.user_id',true)THEN RAISE EXCEPTION 'SENDER_IDENTITY_IMMUTABLE';END IF;
 NEW.created_at:=clock_timestamp();RETURN NEW;
END$$;
CREATE TRIGGER sender_check_guard BEFORE INSERT ON domain_checks FOR EACH ROW EXECUTE FUNCTION mailcraft_sender_check_guard();
CREATE FUNCTION mailcraft_sender_history_immutable()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);
BEGIN
 -- Only trusted fixture/migration cleanup can delete; even it cannot rewrite captures.
 IF TG_OP='DELETE'AND(invoker='mailcraft_migration'OR EXISTS(SELECT FROM pg_roles WHERE rolname=invoker AND rolsuper))THEN RETURN OLD;END IF;
 RAISE EXCEPTION 'SENDER_HISTORY_IMMUTABLE';
END$$;
CREATE TRIGGER sender_version_immutable BEFORE UPDATE OR DELETE ON sender_identity_versions FOR EACH ROW EXECUTE FUNCTION mailcraft_sender_history_immutable();
CREATE TRIGGER sender_check_immutable BEFORE UPDATE OR DELETE ON domain_checks FOR EACH ROW EXECUTE FUNCTION mailcraft_sender_history_immutable();
REVOKE ALL ON FUNCTION mailcraft_sender_guard(),mailcraft_capture_sender(),mailcraft_sender_check_guard(),mailcraft_sender_history_immutable()FROM PUBLIC;
