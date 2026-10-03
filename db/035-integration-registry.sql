-- Durable identity only: opaque references are not qualified provider access.
DO $$BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_integration_admin')THEN
  CREATE ROLE mailcraft_integration_admin NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
 END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_integration_admin'AND(rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole))
 OR pg_has_role('mailcraft_runtime','mailcraft_integration_admin','MEMBER')THEN
  RAISE EXCEPTION 'CONNECTION_SERVICE_ROLE_UNSAFE';
 END IF;
END$$;

-- Match browser whitespace-only refusal without depending on database locale.
-- PostgreSQL text is valid Unicode; NUL and unpaired surrogates cannot be stored.
CREATE FUNCTION public.mailcraft_integration_text_valid(value text,bound integer)RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,public AS $$
 SELECT coalesce(length(value)BETWEEN 1 AND bound
 AND value!~U&'[\0001-\001F\007F-\009F]'
 AND value~U&'[^ \0009-\000D\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]',false)
$$;

CREATE TABLE public.integration_connections(
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),id uuid NOT NULL,
 provider text NOT NULL CHECK(provider IN('klaviyo','mailchimp','hubspot','brevo','omnisend')),
 external_account_id text NOT NULL CHECK(public.mailcraft_integration_text_valid(external_account_id,255)),
 auth_mode text NOT NULL CHECK(auth_mode IN('oauth','api_key')),
 region text NOT NULL CHECK(public.mailcraft_integration_text_valid(region,48)),
 credential_reference uuid NOT NULL,credential_version integer NOT NULL DEFAULT 1 CHECK(credential_version>0),
 record_version integer NOT NULL DEFAULT 1 CHECK(record_version>0),
 state text NOT NULL DEFAULT 'unverified'CHECK(state IN('unverified','revoked')),
 can_export boolean NOT NULL DEFAULT false CHECK(can_export=false),verified_at timestamptz CHECK(verified_at IS NULL),
 created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),revoked_at timestamptz,
 PRIMARY KEY(workspace_id,id),CHECK((state='revoked')=(revoked_at IS NOT NULL))
);
CREATE UNIQUE INDEX integration_active_account ON public.integration_connections(workspace_id,provider,external_account_id)WHERE state='unverified';
CREATE TABLE public.integration_connection_history(
 workspace_id uuid NOT NULL,connection_id uuid NOT NULL,record_version integer NOT NULL CHECK(record_version>0),
 event text NOT NULL CHECK(event IN('registered','rotated','revoked')),
 credential_reference uuid NOT NULL,credential_version integer NOT NULL CHECK(credential_version>0),
 actor text NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,connection_id,record_version),
 FOREIGN KEY(workspace_id,connection_id)REFERENCES public.integration_connections(workspace_id,id)
);
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections FORCE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connection_history FORCE ROW LEVEL SECURITY;
CREATE POLICY integration_service ON public.integration_connections TO mailcraft_integration_admin
 USING(workspace_id::text=current_setting('app.workspace_id',true))WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY integration_history_service ON public.integration_connection_history TO mailcraft_integration_admin
 USING(workspace_id::text=current_setting('app.workspace_id',true))WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
REVOKE ALL ON public.integration_connections,public.integration_connection_history FROM PUBLIC,mailcraft_runtime;
GRANT USAGE ON SCHEMA public TO mailcraft_integration_admin;
GRANT SELECT ON public.workspaces,public.memberships TO mailcraft_integration_admin;
-- Row locking requires UPDATE privileges; these are not runtime grants.
GRANT UPDATE(status)ON public.workspaces TO mailcraft_integration_admin;
GRANT UPDATE(role)ON public.memberships TO mailcraft_integration_admin;
GRANT SELECT,INSERT ON public.integration_connections,public.integration_connection_history TO mailcraft_integration_admin;
GRANT UPDATE(credential_reference,credential_version,record_version,state,updated_at,revoked_at)ON public.integration_connections TO mailcraft_integration_admin;

CREATE FUNCTION public.mailcraft_integration_authorize(w uuid)RETURNS text LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE actor text:=current_setting('app.user_id',true); ws_status text; member public.memberships%ROWTYPE;
BEGIN
 IF w IS NULL THEN RAISE EXCEPTION 'CONNECTION_INPUT_INVALID';END IF;
 IF w::text IS DISTINCT FROM current_setting('app.workspace_id',true)OR actor IS NULL OR actor=''OR actor LIKE 'api-key:%'THEN
  RAISE EXCEPTION 'CONNECTION_PERMISSION_DENIED';
 END IF;
 -- Serialize account admission and all registry access in this workspace.
 -- Same order as membership lifecycle: workspace, current member, connection.
 SELECT status INTO ws_status FROM public.workspaces WHERE id=w FOR UPDATE;
 IF NOT FOUND OR ws_status IS DISTINCT FROM 'active'THEN RAISE EXCEPTION 'CONNECTION_PERMISSION_DENIED';END IF;
 SELECT * INTO member FROM public.memberships WHERE workspace_id=w AND user_id=actor FOR SHARE;
 IF NOT FOUND OR member.status IS DISTINCT FROM 'active'OR member.role NOT IN('Owner','Admin')THEN
  RAISE EXCEPTION 'CONNECTION_PERMISSION_DENIED';
 END IF;
 -- Explicit fresh reads after waits, while authority rows remain locked.
 IF NOT EXISTS(SELECT FROM public.workspaces WHERE id=w AND status='active')OR
 NOT EXISTS(SELECT FROM public.memberships WHERE workspace_id=w AND user_id=actor AND status='active'AND role IN('Owner','Admin'))THEN
  RAISE EXCEPTION 'CONNECTION_PERMISSION_DENIED';
 END IF;
 RETURN actor;
END$$;

CREATE FUNCTION public.mailcraft_integration_output(c public.integration_connections)RETURNS jsonb LANGUAGE sql SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('id',c.id,'provider',c.provider,'auth_mode',c.auth_mode,'region',c.region,'state',c.state,
 'record_version',c.record_version,'credential_version',c.credential_version,'created_at',c.created_at,'updated_at',c.updated_at,'revoked_at',c.revoked_at,
 'can_export',false,'blockers',CASE WHEN c.state='revoked'THEN jsonb_build_array('CONNECTION_REVOKED')ELSE '[]'::jsonb END||
 jsonb_build_array('CONNECTION_AUTH_MODE_UNAPPROVED','ACCOUNT_ENTITLEMENT_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','MANAGEMENT_LINK_UNVERIFIED'))
$$;

CREATE FUNCTION public.mailcraft_integration_immutable()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF TG_TABLE_NAME='integration_connection_history'THEN RAISE EXCEPTION 'CONNECTION_HISTORY_IMMUTABLE';END IF;
 RAISE EXCEPTION 'CONNECTION_IMMUTABLE';
END$$;
CREATE TRIGGER integration_history_immutable BEFORE UPDATE OR DELETE ON public.integration_connection_history FOR EACH ROW EXECUTE FUNCTION public.mailcraft_integration_immutable();
CREATE TRIGGER integration_history_no_truncate BEFORE TRUNCATE ON public.integration_connection_history FOR EACH STATEMENT EXECUTE FUNCTION public.mailcraft_integration_immutable();
CREATE TRIGGER integration_no_delete BEFORE DELETE ON public.integration_connections FOR EACH ROW EXECUTE FUNCTION public.mailcraft_integration_immutable();
CREATE TRIGGER integration_no_truncate BEFORE TRUNCATE ON public.integration_connections FOR EACH STATEMENT EXECUTE FUNCTION public.mailcraft_integration_immutable();

CREATE FUNCTION public.mailcraft_integration_guard()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE actor text;
BEGIN
 IF current_user<>'mailcraft_integration_admin'THEN RAISE EXCEPTION 'CONNECTION_IMMUTABLE';END IF;
 actor:=public.mailcraft_integration_authorize(NEW.workspace_id);
 IF NEW.can_export IS DISTINCT FROM false OR NEW.verified_at IS NOT NULL THEN RAISE EXCEPTION 'CONNECTION_IMMUTABLE';END IF;
 IF TG_OP='INSERT'THEN
  IF NEW.record_version<>1 OR NEW.credential_version<>1 OR NEW.state<>'unverified'OR NEW.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'CONNECTION_INPUT_INVALID';END IF;
  NEW.created_by:=actor;NEW.created_at:=clock_timestamp();NEW.updated_at:=NEW.created_at;
 ELSE
  IF ROW(NEW.workspace_id,NEW.id,NEW.provider,NEW.external_account_id,NEW.auth_mode,NEW.region,NEW.created_by,NEW.created_at)
   IS DISTINCT FROM ROW(OLD.workspace_id,OLD.id,OLD.provider,OLD.external_account_id,OLD.auth_mode,OLD.region,OLD.created_by,OLD.created_at)THEN RAISE EXCEPTION 'CONNECTION_IMMUTABLE';END IF;
  IF OLD.state='revoked'THEN RAISE EXCEPTION 'CONNECTION_REVOKED';END IF;
  IF OLD.record_version=2147483647 OR NEW.record_version<>OLD.record_version+1 THEN RAISE EXCEPTION 'CONNECTION_VERSION_CONFLICT';END IF;
  IF NEW.state='revoked'THEN
   IF NEW.credential_reference IS DISTINCT FROM OLD.credential_reference OR NEW.credential_version<>OLD.credential_version THEN RAISE EXCEPTION 'CONNECTION_IMMUTABLE';END IF;
   NEW.revoked_at:=clock_timestamp();
  ELSIF NEW.state='unverified'THEN
   IF OLD.credential_version=2147483647 OR NEW.credential_version<>OLD.credential_version+1 OR NEW.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'CONNECTION_VERSION_CONFLICT';END IF;
   IF EXISTS(SELECT FROM public.integration_connection_history h WHERE h.workspace_id=OLD.workspace_id AND h.connection_id=OLD.id AND h.credential_reference=NEW.credential_reference)THEN RAISE EXCEPTION 'CONNECTION_CREDENTIAL_REUSED';END IF;
  ELSE RAISE EXCEPTION 'CONNECTION_INPUT_INVALID';END IF;
  NEW.updated_at:=clock_timestamp();
 END IF;
 RETURN NEW;
END$$;
CREATE TRIGGER integration_state_guard BEFORE INSERT OR UPDATE ON public.integration_connections FOR EACH ROW EXECUTE FUNCTION public.mailcraft_integration_guard();
CREATE FUNCTION public.mailcraft_integration_capture()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 INSERT INTO public.integration_connection_history(workspace_id,connection_id,record_version,event,credential_reference,credential_version,actor,recorded_at)
 VALUES(NEW.workspace_id,NEW.id,NEW.record_version,CASE WHEN TG_OP='INSERT'THEN 'registered'WHEN NEW.state='revoked'THEN 'revoked'ELSE 'rotated'END,
 NEW.credential_reference,NEW.credential_version,current_setting('app.user_id',true),NEW.updated_at);
 RETURN NEW;
END$$;
CREATE TRIGGER integration_capture AFTER INSERT OR UPDATE ON public.integration_connections FOR EACH ROW EXECUTE FUNCTION public.mailcraft_integration_capture();

CREATE FUNCTION public.mailcraft_register_integration(w uuid,id uuid,provider text,account text,mode text,region text,credential uuid)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.integration_connections%ROWTYPE; actor text;
BEGIN
 IF w IS NULL OR id IS NULL OR credential IS NULL OR provider IS NULL OR provider NOT IN('klaviyo','mailchimp','hubspot','brevo','omnisend')
 OR mode IS NULL OR mode NOT IN('oauth','api_key')OR account IS NULL OR NOT public.mailcraft_integration_text_valid(account,255)
 OR region IS NULL OR NOT public.mailcraft_integration_text_valid(region,48)THEN RAISE EXCEPTION 'CONNECTION_INPUT_INVALID';END IF;
 actor:=public.mailcraft_integration_authorize(w);
 SELECT * INTO c FROM public.integration_connections x WHERE x.workspace_id=w AND x.id=mailcraft_register_integration.id FOR UPDATE;
 IF FOUND THEN
  IF ROW(c.provider,c.external_account_id,c.auth_mode,c.region)IS DISTINCT FROM ROW(provider,account,mode,region)
  OR NOT EXISTS(SELECT FROM public.integration_connection_history h WHERE h.workspace_id=w AND h.connection_id=c.id AND h.record_version=1 AND h.event='registered'AND h.credential_reference=credential)THEN
   RAISE EXCEPTION 'CONNECTION_BINDING_CONFLICT';
  END IF;
  RETURN public.mailcraft_integration_output(c);
 END IF;
 IF EXISTS(SELECT FROM public.integration_connections x WHERE x.workspace_id=w AND x.provider=mailcraft_register_integration.provider AND x.external_account_id=account AND x.state='unverified')THEN RAISE EXCEPTION 'CONNECTION_ACCOUNT_CONFLICT';END IF;
 INSERT INTO public.integration_connections(workspace_id,id,provider,external_account_id,auth_mode,region,credential_reference,created_by)
 VALUES(w,id,provider,account,mode,region,credential,actor)RETURNING * INTO c;
 RETURN public.mailcraft_integration_output(c);
END$$;
CREATE FUNCTION public.mailcraft_read_integration(w uuid,id uuid)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.integration_connections%ROWTYPE;
BEGIN
 IF w IS NULL OR id IS NULL THEN RAISE EXCEPTION 'CONNECTION_INPUT_INVALID';END IF;
 PERFORM public.mailcraft_integration_authorize(w);
 SELECT * INTO c FROM public.integration_connections x WHERE x.workspace_id=w AND x.id=mailcraft_read_integration.id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CONNECTION_NOT_FOUND';END IF;
 RETURN public.mailcraft_integration_output(c);
END$$;
CREATE FUNCTION public.mailcraft_rotate_integration(w uuid,id uuid,expected integer,credential uuid)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.integration_connections%ROWTYPE;
BEGIN
 IF w IS NULL OR id IS NULL OR credential IS NULL OR expected IS NULL OR expected<=0 THEN RAISE EXCEPTION 'CONNECTION_INPUT_INVALID';END IF;
 PERFORM public.mailcraft_integration_authorize(w);
 SELECT * INTO c FROM public.integration_connections x WHERE x.workspace_id=w AND x.id=mailcraft_rotate_integration.id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CONNECTION_NOT_FOUND';END IF;
 IF c.state='revoked'THEN RAISE EXCEPTION 'CONNECTION_REVOKED';END IF;
 IF c.record_version<>expected OR c.record_version=2147483647 OR c.credential_version=2147483647 THEN RAISE EXCEPTION 'CONNECTION_VERSION_CONFLICT';END IF;
 IF EXISTS(SELECT FROM public.integration_connection_history h WHERE h.workspace_id=w AND h.connection_id=c.id AND h.credential_reference=credential)THEN RAISE EXCEPTION 'CONNECTION_CREDENTIAL_REUSED';END IF;
 UPDATE public.integration_connections x SET credential_reference=credential,credential_version=x.credential_version+1,record_version=x.record_version+1 WHERE x.workspace_id=w AND x.id=c.id RETURNING * INTO c;
 RETURN public.mailcraft_integration_output(c);
END$$;
CREATE FUNCTION public.mailcraft_revoke_integration(w uuid,id uuid)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.integration_connections%ROWTYPE;
BEGIN
 IF w IS NULL OR id IS NULL THEN RAISE EXCEPTION 'CONNECTION_INPUT_INVALID';END IF;
 PERFORM public.mailcraft_integration_authorize(w);
 SELECT * INTO c FROM public.integration_connections x WHERE x.workspace_id=w AND x.id=mailcraft_revoke_integration.id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CONNECTION_NOT_FOUND';END IF;
 IF c.state='revoked'THEN RETURN public.mailcraft_integration_output(c);END IF;
 IF c.record_version=2147483647 THEN RAISE EXCEPTION 'CONNECTION_VERSION_CONFLICT';END IF;
 UPDATE public.integration_connections x SET state='revoked',record_version=x.record_version+1 WHERE x.workspace_id=w AND x.id=c.id RETURNING * INTO c;
 RETURN public.mailcraft_integration_output(c);
END$$;
-- Private helpers and triggers are owned by the same restricted role. None is
-- directly callable by runtime, PUBLIC, worker, or scheduler roles.
GRANT CREATE ON SCHEMA public TO mailcraft_integration_admin;
DO $$DECLARE f record;BEGIN
 FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN(
 'mailcraft_integration_text_valid','mailcraft_integration_authorize','mailcraft_integration_output','mailcraft_integration_immutable','mailcraft_integration_guard','mailcraft_integration_capture',
 'mailcraft_register_integration','mailcraft_read_integration','mailcraft_rotate_integration','mailcraft_revoke_integration')LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO mailcraft_integration_admin',f.signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,mailcraft_runtime',f.signature);
 END LOOP;
END$$;
REVOKE CREATE ON SCHEMA public FROM mailcraft_integration_admin;
GRANT EXECUTE ON FUNCTION public.mailcraft_register_integration(uuid,uuid,text,text,text,text,uuid),public.mailcraft_read_integration(uuid,uuid),public.mailcraft_rotate_integration(uuid,uuid,integer,uuid),public.mailcraft_revoke_integration(uuid,uuid)TO mailcraft_runtime;
