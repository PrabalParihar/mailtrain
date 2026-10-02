-- Local private media. No public delivery grant, commercial allowance or production activation.
DO $$BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_media_admin')THEN CREATE ROLE mailcraft_media_admin NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_media_worker')THEN CREATE ROLE mailcraft_media_worker NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='mailcraft_media_scheduler')THEN CREATE ROLE mailcraft_media_scheduler NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname IN('mailcraft_media_admin','mailcraft_media_worker','mailcraft_media_scheduler')AND(rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole))THEN RAISE EXCEPTION 'MEDIA_ROLE_UNSAFE';END IF;
END$$;
CREATE TABLE asset_quotas(workspace_id uuid PRIMARY KEY REFERENCES workspaces(id),allowance bigint NOT NULL CHECK(allowance>0),reserved bigint NOT NULL DEFAULT 0 CHECK(reserved>=0),used bigint NOT NULL DEFAULT 0 CHECK(used>=0),profile text NOT NULL CHECK(profile='local-private-v1'),CHECK(reserved+used<=allowance));
CREATE TABLE assets(workspace_id uuid NOT NULL REFERENCES workspaces(id),id uuid NOT NULL DEFAULT gen_random_uuid(),state text NOT NULL DEFAULT 'quarantined' CHECK(state IN('quarantined','processing','ready_private','published','deleting','deleted')),version integer NOT NULL DEFAULT 1 CHECK(version>0),source_key text,source_sha256 text CHECK(source_sha256~'^[a-f0-9]{64}$'),source_bytes integer CHECK(source_bytes BETWEEN 1 AND 20971520),mime text CHECK(mime IN('image/png','image/jpeg','image/gif')),alt text NOT NULL DEFAULT '' CHECK(length(alt)<=1000),decorative boolean NOT NULL DEFAULT false,hidden boolean NOT NULL DEFAULT false,failure_code text,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,id));
CREATE INDEX assets_source_hash ON assets(workspace_id,source_sha256);
CREATE TABLE asset_uploads(workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),asset_id uuid,operation_id uuid NOT NULL,created_by text NOT NULL,principal jsonb NOT NULL,token_hash text NOT NULL,expected_sha256 text NOT NULL CHECK(expected_sha256~'^[a-f0-9]{64}$'),expected_bytes integer NOT NULL CHECK(expected_bytes BETWEEN 1 AND 20971520),intent jsonb NOT NULL,status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','transferring','finalized','failed','expired')),transfer_token uuid,transfer_until timestamptz,reserved_bytes bigint NOT NULL DEFAULT 62914560 CHECK(reserved_bytes>=0),expires_at timestamptz NOT NULL DEFAULT(clock_timestamp()+interval '30 minutes'),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,asset_id)REFERENCES assets(workspace_id,id),FOREIGN KEY(workspace_id,operation_id)REFERENCES operations(workspace_id,id));
CREATE TABLE asset_rights(workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),asset_id uuid NOT NULL,upload_id uuid NOT NULL,actor text NOT NULL,terms_version text NOT NULL CHECK(terms_version='local-upload-attestation-v1'),attested boolean NOT NULL CHECK(attested),source_sha256 text NOT NULL CHECK(source_sha256~'^[a-f0-9]{64}$'),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,upload_id),FOREIGN KEY(workspace_id,asset_id)REFERENCES assets(workspace_id,id),FOREIGN KEY(workspace_id,upload_id)REFERENCES asset_uploads(workspace_id,id));
CREATE TABLE media_jobs(workspace_id uuid NOT NULL,operation_id uuid NOT NULL,asset_id uuid NOT NULL,upload_id uuid NOT NULL,principal jsonb NOT NULL,selected_frame integer NOT NULL DEFAULT 0 CHECK(selected_frame BETWEEN 0 AND 199),phase text NOT NULL DEFAULT 'pending' CHECK(phase IN('pending','leased','blocked','settled')),lease_token uuid,lease_until timestamptz,attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3),deadline_at timestamptz NOT NULL DEFAULT(clock_timestamp()+interval '30 minutes'),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,operation_id),FOREIGN KEY(workspace_id,operation_id)REFERENCES operations(workspace_id,id),FOREIGN KEY(workspace_id,asset_id)REFERENCES assets(workspace_id,id),FOREIGN KEY(workspace_id,upload_id)REFERENCES asset_uploads(workspace_id,id));
CREATE UNIQUE INDEX media_one_workspace_lease ON media_jobs(workspace_id)WHERE phase='leased';
CREATE TABLE asset_scans(workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),asset_id uuid NOT NULL,operation_id uuid NOT NULL,sha256 text NOT NULL CHECK(sha256~'^[a-f0-9]{64}$'),status text NOT NULL CHECK(status IN('clean','infected','error','limit','unavailable')),engine text NOT NULL,database_sha256 text NOT NULL CHECK(database_sha256~'^[a-f0-9]{64}$'),database_built_at timestamptz NOT NULL,completed_at timestamptz NOT NULL,receipt jsonb NOT NULL CHECK(octet_length(receipt::text)<=262144),PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,asset_id)REFERENCES assets(workspace_id,id),FOREIGN KEY(workspace_id,operation_id)REFERENCES operations(workspace_id,id));
CREATE TABLE asset_variants(workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),asset_id uuid NOT NULL,object_key text NOT NULL,sha256 text NOT NULL CHECK(sha256~'^[a-f0-9]{64}$'),bytes integer NOT NULL CHECK(bytes BETWEEN 1 AND 20971520),mime text NOT NULL CHECK(mime IN('image/png','image/jpeg','image/gif')),width integer NOT NULL CHECK(width BETWEEN 1 AND 8192),height integer NOT NULL CHECK(height BETWEEN 1 AND 8192),frames integer NOT NULL CHECK(frames BETWEEN 1 AND 200),role text NOT NULL CHECK(role IN('static','animation','fallback')),selected_frame integer CHECK(selected_frame BETWEEN 0 AND 199),processing_profile text NOT NULL,storage_profile text NOT NULL CHECK(storage_profile='local-private-v1'),rights_id uuid NOT NULL,source_scan_id uuid NOT NULL,scan_id uuid NOT NULL,receipt jsonb NOT NULL CHECK(octet_length(receipt::text)<=262144),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,asset_id,id),FOREIGN KEY(workspace_id,asset_id)REFERENCES assets(workspace_id,id),FOREIGN KEY(workspace_id,rights_id)REFERENCES asset_rights(workspace_id,id),FOREIGN KEY(workspace_id,source_scan_id)REFERENCES asset_scans(workspace_id,id),FOREIGN KEY(workspace_id,scan_id)REFERENCES asset_scans(workspace_id,id));
CREATE TABLE asset_draft_references(workspace_id uuid NOT NULL,email_id uuid NOT NULL,node_id text NOT NULL,asset_id uuid NOT NULL,variant_id uuid NOT NULL,PRIMARY KEY(workspace_id,email_id,node_id),FOREIGN KEY(workspace_id,email_id)REFERENCES emails(workspace_id,id),FOREIGN KEY(workspace_id,asset_id,variant_id)REFERENCES asset_variants(workspace_id,asset_id,id));
CREATE TABLE asset_revision_references(workspace_id uuid NOT NULL,revision_id uuid NOT NULL,asset_id uuid NOT NULL,variant_id uuid NOT NULL,PRIMARY KEY(workspace_id,revision_id,variant_id),FOREIGN KEY(workspace_id,revision_id)REFERENCES revisions(workspace_id,id),FOREIGN KEY(workspace_id,asset_id,variant_id)REFERENCES asset_variants(workspace_id,asset_id,id));
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['asset_quotas','assets','asset_uploads','asset_rights','media_jobs','asset_scans','asset_variants','asset_draft_references','asset_revision_references']LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY tenant_context ON %I TO mailcraft_runtime,mailcraft_media_admin USING(workspace_id::text=current_setting(''app.workspace_id'',true)) WITH CHECK(workspace_id::text=current_setting(''app.workspace_id'',true))',t);
 END LOOP;END$$;
CREATE POLICY media_scheduler_jobs ON media_jobs TO mailcraft_media_admin USING(true);
GRANT USAGE ON SCHEMA public TO mailcraft_media_admin,mailcraft_media_worker,mailcraft_media_scheduler;
GRANT SELECT,INSERT,UPDATE,DELETE ON asset_quotas,assets,asset_uploads,media_jobs,asset_draft_references TO mailcraft_runtime;
REVOKE INSERT,UPDATE,DELETE ON assets FROM mailcraft_runtime;
REVOKE UPDATE,DELETE ON media_jobs FROM mailcraft_runtime;
GRANT UPDATE(hidden,version)ON assets TO mailcraft_runtime;
GRANT SELECT,INSERT ON asset_rights,asset_revision_references TO mailcraft_runtime;
GRANT SELECT ON asset_scans,asset_variants TO mailcraft_runtime;
GRANT SELECT,INSERT,UPDATE ON asset_quotas,assets,asset_uploads,media_jobs,asset_scans,asset_variants,operations TO mailcraft_media_admin;
GRANT SELECT ON workspaces,memberships,api_keys,auth_sessions,asset_rights TO mailcraft_media_admin;
GRANT UPDATE ON workspaces,memberships,api_keys TO mailcraft_media_admin;
CREATE POLICY media_workspace ON workspaces TO mailcraft_media_admin USING(id::text=current_setting('app.workspace_id',true));
CREATE POLICY media_membership ON memberships TO mailcraft_media_admin USING(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY media_keys ON api_keys TO mailcraft_media_admin USING(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY media_operations ON operations TO mailcraft_media_admin USING(workspace_id::text=current_setting('app.workspace_id',true))WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
CREATE FUNCTION mailcraft_media_authorized(w uuid,proof jsonb)RETURNS boolean LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE actor text:=proof->>'user';member text;role_name text;k public.api_keys;active boolean;
BEGIN
 SELECT status='active'INTO active FROM public.workspaces WHERE id=w FOR SHARE;IF active IS DISTINCT FROM true OR proof->>'workspace'IS DISTINCT FROM w::text THEN RETURN false;END IF;
 member:=CASE WHEN proof ? 'api_key'THEN proof->'api_key'->>'delegator'ELSE actor END;
 SELECT role INTO role_name FROM public.memberships WHERE workspace_id=w AND user_id=member AND status='active'FOR SHARE;
 IF role_name IS NULL OR role_name NOT IN('Owner','Admin','Editor')THEN RETURN false;END IF;
 IF proof ? 'api_key'THEN
  SELECT * INTO k FROM public.api_keys WHERE workspace_id=w AND id::text=proof->'api_key'->>'id'FOR SHARE;
  IF role_name NOT IN('Owner','Admin')OR actor IS DISTINCT FROM 'api-key:'||k.id::text OR k.created_by IS DISTINCT FROM member OR k.revoked_at IS NOT NULL OR k.expires_at<=clock_timestamp()OR NOT(k.scopes ? 'assets:write')THEN RETURN false;END IF;
 ELSIF proof ? 'local_session'THEN
  IF NOT EXISTS(SELECT FROM public.auth_sessions WHERE token_hash=proof->'local_session'->>'token_hash'AND user_id=actor AND expires_at>clock_timestamp())THEN RETURN false;END IF;
 END IF;RETURN true;
END$$;
CREATE FUNCTION mailcraft_claim_media()RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE j public.media_jobs;token uuid;src public.assets;operation_state text;
BEGIN
 PERFORM pg_advisory_xact_lock(103103031);
 -- Crashed deterministic jobs can retry only three times; leases never permit two active chains.
 FOR j IN SELECT * FROM public.media_jobs WHERE phase='leased'AND lease_until<=clock_timestamp()FOR UPDATE LOOP
  PERFORM set_config('app.workspace_id',j.workspace_id::text,true);UPDATE public.operations SET state=CASE WHEN state='running'THEN 'queued'ELSE state END WHERE workspace_id=j.workspace_id AND id=j.operation_id;
  UPDATE public.media_jobs SET phase='pending',lease_token=NULL,lease_until=NULL WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id;
 END LOOP;
 IF EXISTS(SELECT FROM public.media_jobs WHERE phase IN('leased','blocked'))THEN RETURN NULL;END IF;
 SELECT * INTO j FROM public.media_jobs WHERE phase='pending'ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1;IF NOT FOUND THEN RETURN NULL;END IF;
 PERFORM set_config('app.workspace_id',j.workspace_id::text,true);
 IF j.attempts>=3 OR j.deadline_at<=clock_timestamp()OR NOT public.mailcraft_media_authorized(j.workspace_id,j.principal)OR EXISTS(SELECT FROM public.operations WHERE workspace_id=j.workspace_id AND id=j.operation_id AND state IN('cancel_requested','cancelled'))OR EXISTS(SELECT FROM public.assets WHERE workspace_id=j.workspace_id AND id=j.asset_id AND state IN('deleting','deleted'))THEN
  UPDATE public.media_jobs SET phase='settled'WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id;
  UPDATE public.operations SET state=CASE WHEN state IN('cancel_requested','cancelled')THEN 'cancelled'ELSE 'failed'END,error='{"code":"MEDIA_AUTHORITY_OR_DEADLINE","message":"Media admission expired or authority changed."}',completed_at=clock_timestamp()WHERE workspace_id=j.workspace_id AND id=j.operation_id;
  IF NOT EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id)THEN
   UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes FROM public.asset_uploads u WHERE asset_quotas.workspace_id=j.workspace_id AND u.workspace_id=j.workspace_id AND u.id=j.upload_id;
   UPDATE public.asset_uploads SET reserved_bytes=0 WHERE workspace_id=j.workspace_id AND id=j.upload_id;
  END IF;
  UPDATE public.assets SET state=CASE WHEN state='processing'THEN 'quarantined'ELSE state END,failure_code='MEDIA_AUTHORITY_OR_DEADLINE'WHERE workspace_id=j.workspace_id AND id=j.asset_id;
  RETURN NULL;
 END IF;
 SELECT * INTO src FROM public.assets WHERE workspace_id=j.workspace_id AND id=j.asset_id FOR SHARE;
 IF src.state IN('deleting','deleted')THEN RETURN NULL;END IF;
 SELECT state INTO operation_state FROM public.operations WHERE workspace_id=j.workspace_id AND id=j.operation_id FOR UPDATE;
 IF operation_state<>'queued'OR NOT public.mailcraft_media_authorized(j.workspace_id,j.principal)THEN
  UPDATE public.media_jobs SET phase='settled'WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id;
  IF NOT EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id)THEN
   UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes FROM public.asset_uploads u WHERE asset_quotas.workspace_id=j.workspace_id AND u.workspace_id=j.workspace_id AND u.id=j.upload_id;
   UPDATE public.asset_uploads SET reserved_bytes=0 WHERE workspace_id=j.workspace_id AND id=j.upload_id;
  END IF;
  RETURN NULL;
 END IF;
 token:=gen_random_uuid();UPDATE public.media_jobs SET phase='leased',lease_token=token,lease_until=least(clock_timestamp()+interval '30 seconds',deadline_at),attempts=attempts+1 WHERE workspace_id=j.workspace_id AND operation_id=j.operation_id;
 UPDATE public.operations SET state='running',started_at=coalesce(started_at,clock_timestamp())WHERE workspace_id=j.workspace_id AND id=j.operation_id;
 UPDATE public.assets SET state=CASE WHEN state='ready_private'THEN state ELSE 'processing'END WHERE workspace_id=j.workspace_id AND id=j.asset_id;
 RETURN jsonb_build_object('workspace',j.workspace_id,'operation_id',j.operation_id,'asset_id',j.asset_id,'upload_id',j.upload_id,'principal',j.principal,'selected_frame',j.selected_frame,'token',token,'source_key',src.source_key,'source_sha256',src.source_sha256,'source_bytes',src.source_bytes);
END$$;
CREATE FUNCTION mailcraft_media_context(w uuid,op uuid,token uuid)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE j public.media_jobs;BEGIN PERFORM set_config('app.workspace_id',w::text,true);SELECT * INTO j FROM public.media_jobs WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR j.phase<>'leased'OR j.lease_token<>token OR j.lease_until<=clock_timestamp()OR j.deadline_at<=clock_timestamp()OR NOT public.mailcraft_media_authorized(w,j.principal)OR NOT EXISTS(SELECT FROM public.operations WHERE workspace_id=w AND id=op AND state='running')OR NOT EXISTS(SELECT FROM public.assets WHERE workspace_id=w AND id=j.asset_id AND state IN('processing','ready_private'))THEN RETURN NULL;END IF;
 UPDATE public.media_jobs SET lease_until=least(clock_timestamp()+interval '30 seconds',deadline_at)WHERE workspace_id=w AND operation_id=op;RETURN to_jsonb(j);END$$;
CREATE FUNCTION mailcraft_settle_media(w uuid,op uuid,token uuid,payload jsonb)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE j public.media_jobs;a public.assets;u public.asset_uploads;r uuid;item jsonb;s jsonb;sid uuid;source_scan uuid;variant_ids jsonb:='[]';total integer:=0;ok boolean;code text;v uuid;
BEGIN
 IF payload IS NULL OR jsonb_typeof(payload)<>'object'OR octet_length(payload::text)>1048576 THEN RAISE EXCEPTION 'MEDIA_RECEIPT_INVALID';END IF;
 PERFORM set_config('app.workspace_id',w::text,true);ok:=public.mailcraft_media_authorized(w,(SELECT principal FROM public.media_jobs WHERE workspace_id=w AND operation_id=op));
 SELECT * INTO j FROM public.media_jobs WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR j.phase<>'leased'OR j.lease_token<>token OR j.lease_until<=clock_timestamp()THEN RETURN false;END IF;
 SELECT * INTO a FROM public.assets WHERE workspace_id=w AND id=j.asset_id FOR UPDATE;SELECT * INTO u FROM public.asset_uploads WHERE workspace_id=w AND id=j.upload_id FOR UPDATE;
 ok:=ok AND public.mailcraft_media_authorized(w,j.principal)AND EXISTS(SELECT FROM public.operations WHERE workspace_id=w AND id=op AND state='running')AND a.state IN('processing','ready_private');
 IF payload->>'status'='success'AND ok THEN
  IF payload->>'source_sha256'IS DISTINCT FROM a.source_sha256 OR jsonb_array_length(payload->'variants')NOT BETWEEN 1 AND 2 THEN RAISE EXCEPTION 'MEDIA_RECEIPT_INVALID';END IF;
  SELECT id INTO r FROM public.asset_rights WHERE workspace_id=w AND upload_id=j.upload_id AND asset_id=a.id AND source_sha256=a.source_sha256;IF r IS NULL THEN RAISE EXCEPTION 'MEDIA_RIGHTS_REQUIRED';END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(payload->'scans')LOOP
   IF item->>'status'<>'clean'OR(item->>'database_built_at')::timestamptz<clock_timestamp()-interval '48 hours'OR(item->>'database_built_at')::timestamptz>clock_timestamp()+interval '5 minutes'OR(item->>'completed_at')::timestamptz>clock_timestamp()+interval '5 minutes'OR(item->>'completed_at')::timestamptz<clock_timestamp()-interval '10 minutes'OR item->'receipt'->>'official_database'IS DISTINCT FROM 'true'THEN RAISE EXCEPTION 'MEDIA_SCAN_NOT_CLEAN';END IF;
   sid:=gen_random_uuid();INSERT INTO public.asset_scans(workspace_id,id,asset_id,operation_id,sha256,status,engine,database_sha256,database_built_at,completed_at,receipt)VALUES(w,sid,a.id,op,item->>'sha256','clean',item->>'engine',item->>'database_sha256',(item->>'database_built_at')::timestamptz,(item->>'completed_at')::timestamptz,item->'receipt');
   IF item->>'sha256'=a.source_sha256 THEN source_scan:=sid;END IF;
  END LOOP;
  IF source_scan IS NULL THEN RAISE EXCEPTION 'MEDIA_SOURCE_SCAN_REQUIRED';END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(payload->'variants')LOOP
   SELECT id INTO sid FROM public.asset_scans WHERE workspace_id=w AND operation_id=op AND sha256=item->>'sha256'AND status='clean'LIMIT 1;IF sid IS NULL THEN RAISE EXCEPTION 'MEDIA_VARIANT_SCAN_REQUIRED';END IF;
   v:=(item->>'id')::uuid;IF item->>'object_key'IS DISTINCT FROM w::text||'_'||v::text||'_variant'THEN RAISE EXCEPTION 'MEDIA_OBJECT_KEY_INVALID';END IF;
   total:=total+(item->>'bytes')::integer;IF total>41943040 THEN RAISE EXCEPTION 'MEDIA_OUTPUT_LIMIT';END IF;
   INSERT INTO public.asset_variants(workspace_id,id,asset_id,object_key,sha256,bytes,mime,width,height,frames,role,selected_frame,processing_profile,storage_profile,rights_id,source_scan_id,scan_id,receipt)VALUES(w,v,a.id,item->>'object_key',item->>'sha256',(item->>'bytes')::integer,item->>'mime',(item->>'width')::integer,(item->>'height')::integer,(item->>'frames')::integer,item->>'role',(item->>'selected_frame')::integer,item->>'processing_profile','local-private-v1',r,source_scan,sid,item->'receipt');variant_ids:=variant_ids||jsonb_build_array(v);
  END LOOP;
  IF EXISTS(SELECT FROM public.asset_object_staging st WHERE st.workspace_id=w AND st.operation_id=op AND NOT EXISTS(SELECT FROM public.asset_variants v WHERE v.workspace_id=w AND v.object_key=st.object_key))THEN RAISE EXCEPTION 'MEDIA_STORAGE_CLEANUP_REQUIRED';END IF;
  DELETE FROM public.asset_object_staging WHERE workspace_id=w AND operation_id=op;
  UPDATE public.assets SET state='ready_private',failure_code=NULL WHERE workspace_id=w AND id=a.id;
  UPDATE public.operations SET state='succeeded',result=jsonb_build_object('asset_id',a.id,'variant_ids',variant_ids),completed_at=clock_timestamp()WHERE workspace_id=w AND id=op;
  UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes,used=used+total WHERE workspace_id=w;
 ELSE
  code:=CASE WHEN NOT ok THEN 'MEDIA_AUTHORITY_REVOKED'ELSE coalesce(payload->>'failure_code','MEDIA_UNAVAILABLE')END;
  UPDATE public.assets SET state=CASE WHEN state='ready_private'THEN state ELSE 'quarantined'END,failure_code=code WHERE workspace_id=w AND id=a.id;
  UPDATE public.operations SET state=CASE WHEN state IN('cancel_requested','cancelled')THEN 'cancelled'ELSE 'failed'END,error=jsonb_build_object('code',code,'message','Media processing ended without attaching a new variant.'),completed_at=clock_timestamp()WHERE workspace_id=w AND id=op;
  IF payload->>'failure_code'IS DISTINCT FROM 'MEDIA_REAP_UNCONFIRMED'AND NOT EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=w AND operation_id=op)THEN UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes WHERE workspace_id=w;END IF;
 END IF;
 UPDATE public.asset_uploads SET reserved_bytes=CASE WHEN payload->>'failure_code'='MEDIA_REAP_UNCONFIRMED'OR EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=w AND operation_id=op)THEN reserved_bytes ELSE 0 END WHERE workspace_id=w AND id=u.id;UPDATE public.media_jobs SET phase=CASE WHEN payload->>'failure_code'='MEDIA_REAP_UNCONFIRMED'THEN 'blocked'ELSE 'settled'END,lease_token=NULL,lease_until=NULL WHERE workspace_id=w AND operation_id=op;RETURN true;
END$$;
GRANT CREATE ON SCHEMA public TO mailcraft_media_admin;
DO $$DECLARE f record;BEGIN FOR f IN SELECT oid::regprocedure signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN('mailcraft_media_authorized','mailcraft_claim_media','mailcraft_media_context','mailcraft_settle_media')LOOP EXECUTE format('ALTER FUNCTION %s OWNER TO mailcraft_media_admin',f.signature);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.signature);END LOOP;END$$;
REVOKE CREATE ON SCHEMA public FROM mailcraft_media_admin;
GRANT EXECUTE ON FUNCTION mailcraft_claim_media()TO mailcraft_media_scheduler;
GRANT EXECUTE ON FUNCTION mailcraft_media_context(uuid,uuid,uuid),mailcraft_settle_media(uuid,uuid,uuid,jsonb)TO mailcraft_media_worker;
-- Web transfer finalization is narrow and cannot assert scan readiness.
CREATE FUNCTION mailcraft_finalize_upload(w uuid,uid uuid,transfer uuid,key_name text,actual_sha text,actual_bytes integer,actual_mime text,reuse_key text DEFAULT NULL)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE u public.asset_uploads;a public.assets;aid uuid;actor text:=current_setting('app.user_id',true);BEGIN
 IF w::text IS DISTINCT FROM current_setting('app.workspace_id',true)THEN RAISE EXCEPTION 'MEDIA_TENANT_REQUIRED';END IF;
 SELECT * INTO u FROM public.asset_uploads WHERE workspace_id=w AND id=uid FOR UPDATE;
 IF NOT FOUND OR u.created_by IS DISTINCT FROM actor OR u.transfer_token IS DISTINCT FROM transfer OR u.status<>'transferring'OR u.transfer_until<=clock_timestamp()OR NOT public.mailcraft_media_authorized(w,u.principal)OR NOT EXISTS(SELECT FROM public.operations WHERE workspace_id=w AND id=u.operation_id AND state='queued')THEN RAISE EXCEPTION 'MEDIA_TRANSFER_REVOKED';END IF;
 IF actual_sha IS DISTINCT FROM u.expected_sha256 OR actual_bytes IS DISTINCT FROM u.expected_bytes OR actual_mime IS DISTINCT FROM u.intent->>'declared_mime'OR key_name IS DISTINCT FROM w::text||'_'||uid::text||'_source'THEN RAISE EXCEPTION 'MEDIA_TRANSFER_MISMATCH';END IF;
 PERFORM pg_advisory_xact_lock(hashtext(w::text||':asset-source:'||actual_sha));
 SELECT * INTO a FROM public.assets WHERE workspace_id=w AND source_sha256=actual_sha AND state NOT IN('deleting','deleted')ORDER BY created_at,id LIMIT 1 FOR SHARE;
 IF FOUND THEN
  IF reuse_key IS DISTINCT FROM a.source_key THEN RAISE EXCEPTION 'MEDIA_DEDUPE_RECHECK_REQUIRED';END IF;
  key_name:=a.source_key;
 ELSE
  UPDATE public.asset_quotas SET reserved=reserved-actual_bytes,used=used+actual_bytes WHERE workspace_id=w;u.reserved_bytes:=u.reserved_bytes-actual_bytes;
 END IF;
 INSERT INTO public.assets(workspace_id,source_key,source_sha256,source_bytes,mime,alt,decorative,created_by)VALUES(w,key_name,actual_sha,actual_bytes,actual_mime,u.intent->>'alt',(u.intent->>'decorative')::boolean,actor)RETURNING * INTO a;
 UPDATE public.asset_uploads SET status='finalized',asset_id=a.id,transfer_token=NULL,transfer_until=NULL,reserved_bytes=u.reserved_bytes WHERE workspace_id=w AND id=uid;
 INSERT INTO public.asset_rights(workspace_id,asset_id,upload_id,actor,terms_version,attested,source_sha256)VALUES(w,a.id,uid,actor,u.intent->'rights'->>'terms_version',true,actual_sha);
 INSERT INTO public.media_jobs(workspace_id,operation_id,asset_id,upload_id,principal)VALUES(w,u.operation_id,a.id,uid,u.principal);
 DELETE FROM public.asset_object_staging WHERE workspace_id=w AND operation_id=u.operation_id AND object_key=key_name;
 RETURN jsonb_build_object('upload',jsonb_build_object('id',uid,'status','finalized'),'operation',jsonb_build_object('id',u.operation_id,'state','queued'),'asset_id',a.id,'source_key',a.source_key);
END$$;
GRANT INSERT ON asset_rights TO mailcraft_media_admin;
GRANT CREATE ON SCHEMA public TO mailcraft_media_admin;
ALTER FUNCTION mailcraft_finalize_upload(uuid,uuid,uuid,text,text,integer,text,text)OWNER TO mailcraft_media_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_media_admin;
REVOKE ALL ON FUNCTION mailcraft_finalize_upload(uuid,uuid,uuid,text,text,integer,text,text)FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_finalize_upload(uuid,uuid,uuid,text,text,integer,text,text)TO mailcraft_runtime;
-- Scheduler maintenance sees only expired incomplete admissions; no source or ready-byte access.
CREATE POLICY media_expired_uploads ON asset_uploads TO mailcraft_media_admin USING(status IN('pending','transferring')AND(expires_at<=clock_timestamp()OR transfer_until<=clock_timestamp()));
CREATE FUNCTION mailcraft_expire_media_uploads()RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE candidate record;u public.asset_uploads;count_expired integer:=0;
BEGIN
 FOR candidate IN SELECT workspace_id,id FROM public.asset_uploads WHERE status IN('pending','transferring')AND(expires_at<=clock_timestamp()OR transfer_until<=clock_timestamp())ORDER BY created_at LIMIT 100 LOOP
  PERFORM set_config('app.workspace_id',candidate.workspace_id::text,true);
  SELECT * INTO u FROM public.asset_uploads WHERE workspace_id=candidate.workspace_id AND id=candidate.id FOR UPDATE;
  IF NOT FOUND OR u.status NOT IN('pending','transferring')OR(u.expires_at>clock_timestamp()AND(u.transfer_until IS NULL OR u.transfer_until>clock_timestamp()))THEN CONTINUE;END IF;
  IF NOT EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=u.workspace_id AND operation_id=u.operation_id)THEN UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes WHERE workspace_id=u.workspace_id;END IF;
  UPDATE public.asset_uploads SET reserved_bytes=CASE WHEN EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=u.workspace_id AND operation_id=u.operation_id)THEN reserved_bytes ELSE 0 END,status='expired',transfer_token=NULL,transfer_until=NULL WHERE workspace_id=u.workspace_id AND id=u.id;
  UPDATE public.operations SET state=CASE WHEN state IN('cancelled','cancel_requested')THEN 'cancelled'ELSE 'failed'END,error='{"code":"ASSET_UPLOAD_EXPIRED","message":"Upload expired before durable transfer."}',completed_at=clock_timestamp()WHERE workspace_id=u.workspace_id AND id=u.operation_id;
  count_expired:=count_expired+1;
 END LOOP;RETURN count_expired;
END$$;
GRANT CREATE ON SCHEMA public TO mailcraft_media_admin;
ALTER FUNCTION mailcraft_expire_media_uploads()OWNER TO mailcraft_media_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_media_admin;
REVOKE ALL ON FUNCTION mailcraft_expire_media_uploads()FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_expire_media_uploads()TO mailcraft_media_scheduler;
-- A queued cancellation releases its admission atomically. Leased work retains it until confirmed reap/settlement.
CREATE FUNCTION mailcraft_media_cancel_queued()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE u public.asset_uploads;
BEGIN
 IF NEW.type NOT IN('asset.upload','asset.fallback')OR NEW.state<>'cancelled'OR OLD.state NOT IN('queued','cancel_requested')THEN RETURN NEW;END IF;
 IF NEW.workspace_id::text IS DISTINCT FROM current_setting('app.workspace_id',true)THEN RETURN NEW;END IF;
 IF EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=NEW.workspace_id AND operation_id=NEW.id AND phase='leased')THEN RETURN NEW;END IF;
 SELECT * INTO u FROM public.asset_uploads WHERE workspace_id=NEW.workspace_id AND operation_id=NEW.id FOR UPDATE;
 IF NOT FOUND OR u.reserved_bytes=0 THEN RETURN NEW;END IF;
 IF NOT EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=u.workspace_id AND operation_id=u.operation_id)THEN UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes WHERE workspace_id=u.workspace_id;END IF;
 UPDATE public.asset_uploads SET reserved_bytes=CASE WHEN EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=u.workspace_id AND operation_id=u.operation_id)THEN reserved_bytes ELSE 0 END,status=CASE WHEN status IN('pending','transferring')THEN 'expired'ELSE status END,transfer_token=NULL,transfer_until=NULL WHERE workspace_id=u.workspace_id AND id=u.id;
 RETURN NEW;
END$$;
GRANT CREATE ON SCHEMA public TO mailcraft_media_admin;
ALTER FUNCTION mailcraft_media_cancel_queued()OWNER TO mailcraft_media_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_media_admin;
REVOKE ALL ON FUNCTION mailcraft_media_cancel_queued()FROM PUBLIC;
CREATE TRIGGER media_cancel_queued AFTER UPDATE OF state ON operations FOR EACH ROW EXECUTE FUNCTION mailcraft_media_cancel_queued();
-- Planned immutable objects remain covered by the admitted reservation until attachment or confirmed cleanup.
CREATE TABLE asset_object_staging(workspace_id uuid NOT NULL,object_key text NOT NULL,operation_id uuid NOT NULL,upload_id uuid NOT NULL,bytes integer NOT NULL CHECK(bytes BETWEEN 1 AND 20971520),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,object_key),FOREIGN KEY(workspace_id,operation_id)REFERENCES operations(workspace_id,id),FOREIGN KEY(workspace_id,upload_id)REFERENCES asset_uploads(workspace_id,id));
ALTER TABLE asset_object_staging ENABLE ROW LEVEL SECURITY;ALTER TABLE asset_object_staging FORCE ROW LEVEL SECURITY;
CREATE POLICY media_staging_tenant ON asset_object_staging TO mailcraft_runtime,mailcraft_media_admin USING(workspace_id::text=current_setting('app.workspace_id',true))WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY media_staging_cleanup ON asset_object_staging TO mailcraft_media_admin USING(true);
GRANT SELECT ON asset_object_staging TO mailcraft_runtime;
GRANT SELECT,INSERT,DELETE ON asset_object_staging TO mailcraft_media_admin;
CREATE FUNCTION mailcraft_stage_media_object(w uuid,op uuid,token uuid,key_name text,byte_size integer)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE u public.asset_uploads;j public.media_jobs;invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);original_workspace text:=current_setting('app.workspace_id',true);
BEGIN
 IF invoker NOT IN('mailcraft_runtime','mailcraft_media_worker','mailcraft_media_scheduler')THEN
  IF pg_has_role(invoker,'mailcraft_runtime','USAGE')THEN invoker:='mailcraft_runtime';ELSIF pg_has_role(invoker,'mailcraft_media_worker','USAGE')THEN invoker:='mailcraft_media_worker';ELSIF pg_has_role(invoker,'mailcraft_media_scheduler','USAGE')THEN invoker:='mailcraft_media_scheduler';ELSE RETURN false;END IF;
 END IF;
 IF invoker='mailcraft_runtime'AND w::text IS DISTINCT FROM original_workspace THEN RETURN false;END IF;
 IF byte_size NOT BETWEEN 1 AND 20971520 THEN RAISE EXCEPTION 'MEDIA_STAGING_INVALID';END IF;
 PERFORM set_config('app.workspace_id',w::text,true);SELECT * INTO u FROM public.asset_uploads WHERE workspace_id=w AND operation_id=op;
 IF NOT FOUND OR u.reserved_bytes<byte_size THEN RETURN false;END IF;
 IF invoker='mailcraft_runtime'THEN
  IF token IS NOT NULL OR u.created_by IS DISTINCT FROM current_setting('app.user_id',true)OR u.status<>'transferring'OR key_name IS DISTINCT FROM w::text||'_'||u.id::text||'_source'OR NOT public.mailcraft_media_authorized(w,u.principal)THEN RETURN false;END IF;
 ELSIF invoker='mailcraft_media_worker'THEN
  SELECT * INTO j FROM public.media_jobs WHERE workspace_id=w AND operation_id=op;
  IF j.lease_token IS DISTINCT FROM token OR j.phase<>'leased'OR j.lease_until<=clock_timestamp()OR NOT public.mailcraft_media_authorized(w,j.principal)OR key_name!~('^'||w::text||'_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_variant$')THEN RETURN false;END IF;
  IF (SELECT coalesce(sum(bytes),0)FROM public.asset_object_staging WHERE workspace_id=w AND operation_id=op AND object_key LIKE '%_variant')+byte_size>41943040 THEN RETURN false;END IF;
 ELSE RETURN false;END IF;
 INSERT INTO public.asset_object_staging(workspace_id,object_key,operation_id,upload_id,bytes)VALUES(w,key_name,op,u.id,byte_size)ON CONFLICT DO NOTHING;RETURN true;
END$$;
CREATE FUNCTION mailcraft_media_object_cleanup_candidates(wanted_workspace uuid DEFAULT NULL,wanted_operation uuid DEFAULT NULL,proof_token uuid DEFAULT NULL)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE object public.asset_object_staging;o public.operations;u public.asset_uploads;result jsonb:='[]';invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);original_workspace text:=current_setting('app.workspace_id',true);
BEGIN
 IF invoker NOT IN('mailcraft_runtime','mailcraft_media_worker','mailcraft_media_scheduler')THEN
  IF pg_has_role(invoker,'mailcraft_runtime','USAGE')THEN invoker:='mailcraft_runtime';ELSIF pg_has_role(invoker,'mailcraft_media_worker','USAGE')THEN invoker:='mailcraft_media_worker';ELSIF pg_has_role(invoker,'mailcraft_media_scheduler','USAGE')THEN invoker:='mailcraft_media_scheduler';ELSE RETURN result;END IF;
 END IF;
 FOR object IN SELECT * FROM public.asset_object_staging WHERE(wanted_workspace IS NULL OR workspace_id=wanted_workspace)AND(wanted_operation IS NULL OR operation_id=wanted_operation)ORDER BY created_at LIMIT 200 LOOP
  IF invoker='mailcraft_media_worker'AND NOT EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=object.workspace_id AND operation_id=object.operation_id AND lease_token=proof_token AND phase='leased')THEN CONTINUE;END IF;
  IF invoker='mailcraft_runtime'AND(object.workspace_id::text IS DISTINCT FROM original_workspace OR wanted_operation IS NULL)THEN CONTINUE;END IF;
  PERFORM set_config('app.workspace_id',object.workspace_id::text,true);
  SELECT * INTO o FROM public.operations WHERE workspace_id=object.workspace_id AND id=object.operation_id;SELECT * INTO u FROM public.asset_uploads WHERE workspace_id=object.workspace_id AND id=object.upload_id;
  IF invoker='mailcraft_runtime'AND u.created_by IS DISTINCT FROM current_setting('app.user_id',true)THEN CONTINUE;END IF;
  IF invoker='mailcraft_media_scheduler'AND NOT(o.state IN('failed','cancelled')OR u.expires_at<=clock_timestamp()OR u.status IN('failed','expired')OR EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=object.workspace_id AND operation_id=object.operation_id AND phase='leased'AND lease_until<=clock_timestamp()))THEN CONTINUE;END IF;
  IF EXISTS(SELECT FROM public.assets WHERE workspace_id=object.workspace_id AND source_key=object.object_key)OR EXISTS(SELECT FROM public.asset_variants WHERE workspace_id=object.workspace_id AND object_key=object.object_key)THEN CONTINUE;END IF;
  result:=result||jsonb_build_array(jsonb_build_object('workspace',object.workspace_id,'operation_id',object.operation_id,'upload_id',object.upload_id,'object_key',object.object_key,'bytes',object.bytes));
 END LOOP;RETURN result;
END$$;
CREATE FUNCTION mailcraft_forget_media_object(w uuid,op uuid,key_name text,proof_token uuid DEFAULT NULL)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE u public.asset_uploads;invoker text:=coalesce(nullif(current_setting('role',true),'none'),session_user);original_workspace text:=current_setting('app.workspace_id',true);
BEGIN
 IF invoker NOT IN('mailcraft_runtime','mailcraft_media_worker','mailcraft_media_scheduler')THEN
  IF pg_has_role(invoker,'mailcraft_runtime','USAGE')THEN invoker:='mailcraft_runtime';ELSIF pg_has_role(invoker,'mailcraft_media_worker','USAGE')THEN invoker:='mailcraft_media_worker';ELSIF pg_has_role(invoker,'mailcraft_media_scheduler','USAGE')THEN invoker:='mailcraft_media_scheduler';ELSE RETURN false;END IF;
 END IF;
 IF invoker='mailcraft_media_worker'AND NOT EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=w AND operation_id=op AND lease_token=proof_token AND phase='leased')THEN RETURN false;END IF;
 IF invoker='mailcraft_runtime'AND w::text IS DISTINCT FROM original_workspace THEN RETURN false;END IF;
 PERFORM set_config('app.workspace_id',w::text,true);SELECT * INTO u FROM public.asset_uploads WHERE workspace_id=w AND operation_id=op FOR UPDATE;
 IF NOT FOUND OR(invoker='mailcraft_runtime'AND u.created_by IS DISTINCT FROM current_setting('app.user_id',true))THEN RETURN false;END IF;
 IF invoker='mailcraft_media_scheduler'AND NOT(u.expires_at<=clock_timestamp()OR u.status IN('failed','expired')OR EXISTS(SELECT FROM public.operations WHERE workspace_id=w AND id=op AND state IN('failed','cancelled'))OR EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=w AND operation_id=op AND phase='leased'AND lease_until<=clock_timestamp()))THEN RETURN false;END IF;
 IF EXISTS(SELECT FROM public.assets WHERE workspace_id=w AND source_key=key_name)OR EXISTS(SELECT FROM public.asset_variants WHERE workspace_id=w AND object_key=key_name)THEN RETURN false;END IF;
 DELETE FROM public.asset_object_staging WHERE workspace_id=w AND operation_id=op AND object_key=key_name;
 IF NOT EXISTS(SELECT FROM public.asset_object_staging WHERE workspace_id=w AND operation_id=op)AND NOT EXISTS(SELECT FROM public.media_jobs WHERE workspace_id=w AND operation_id=op AND phase IN('leased','blocked'))AND EXISTS(SELECT FROM public.operations WHERE workspace_id=w AND id=op AND state IN('failed','cancelled'))THEN
  UPDATE public.asset_quotas SET reserved=reserved-u.reserved_bytes WHERE workspace_id=w;UPDATE public.asset_uploads SET reserved_bytes=0 WHERE workspace_id=w AND id=u.id;
 END IF;RETURN true;
END$$;
GRANT SELECT ON asset_variants TO mailcraft_media_admin;
GRANT CREATE ON SCHEMA public TO mailcraft_media_admin;
DO $$DECLARE f record;BEGIN FOR f IN SELECT oid::regprocedure signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN('mailcraft_stage_media_object','mailcraft_media_object_cleanup_candidates','mailcraft_forget_media_object')LOOP EXECUTE format('ALTER FUNCTION %s OWNER TO mailcraft_media_admin',f.signature);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.signature);END LOOP;END$$;
REVOKE CREATE ON SCHEMA public FROM mailcraft_media_admin;
GRANT EXECUTE ON FUNCTION mailcraft_stage_media_object(uuid,uuid,uuid,text,integer)TO mailcraft_runtime,mailcraft_media_worker;
GRANT EXECUTE ON FUNCTION mailcraft_media_object_cleanup_candidates(uuid,uuid,uuid),mailcraft_forget_media_object(uuid,uuid,text,uuid)TO mailcraft_runtime,mailcraft_media_worker,mailcraft_media_scheduler;
