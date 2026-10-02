-- Preserve available legacy bytes; this migration does not rewrite any spec or artifact.
ALTER TABLE emails ADD COLUMN raw_source_profile text;
ALTER TABLE revisions ADD COLUMN raw_source_profile text;
UPDATE emails SET raw_source_profile='legacy-stored-1' WHERE spec->>'editing_mode'='raw_html';
UPDATE revisions SET raw_source_profile='legacy-stored-1' WHERE spec->>'editing_mode'='raw_html';
ALTER TABLE emails ADD CONSTRAINT email_source_mode_profile CHECK (
 (spec->>'editing_mode'='raw_html' AND jsonb_typeof(spec->'raw_html')='string' AND raw_source_profile IS NOT NULL AND raw_source_profile IN('legacy-stored-1','exact-utf8-1')) OR
 (spec->>'editing_mode' IS DISTINCT FROM 'raw_html' AND raw_source_profile IS NULL));
ALTER TABLE revisions ADD CONSTRAINT revision_source_mode_profile CHECK (
 (spec->>'editing_mode'='raw_html' AND jsonb_typeof(spec->'raw_html')='string' AND raw_source_profile IS NOT NULL AND raw_source_profile IN('legacy-stored-1','exact-utf8-1')) OR
 (spec->>'editing_mode' IS DISTINCT FROM 'raw_html' AND raw_source_profile IS NULL));
CREATE TABLE email_source_provenance (
 workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),email_id uuid NOT NULL,
 doc_version integer NOT NULL CHECK(doc_version>0),origin text NOT NULL CHECK(origin IN('import','structured_fork','edit','restore','remix','locale')),
 source_revision_id uuid,source_revision_profile text CHECK(source_revision_profile IN('legacy-stored-1','exact-utf8-1')),
 source_sha256 text NOT NULL CHECK(source_sha256~'^[a-f0-9]{64}$'),source_bytes integer NOT NULL CHECK(source_bytes BETWEEN 0 AND 2097152),
 storage_profile text NOT NULL CHECK(storage_profile='exact-utf8-1'),actor text NOT NULL,command_id text,request_id text,created_api_key_id uuid,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,email_id,doc_version),
 FOREIGN KEY(workspace_id,email_id) REFERENCES emails(workspace_id,id),
 FOREIGN KEY(workspace_id,source_revision_id) REFERENCES revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,created_api_key_id) REFERENCES api_keys(workspace_id,id));
ALTER TABLE email_source_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_source_provenance FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_context ON email_source_provenance USING(workspace_id::text=current_setting('app.workspace_id',true)) WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
GRANT SELECT ON email_source_provenance TO mailcraft_runtime;
REVOKE INSERT,UPDATE,DELETE ON email_source_provenance FROM mailcraft_runtime;
CREATE FUNCTION mailcraft_source_profile() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_NAME='email_source_profile_direct_update' THEN RAISE EXCEPTION 'SOURCE_PROFILE_SERVER_OWNED'; END IF;
 IF NEW.spec->>'editing_mode'='raw_html' THEN
  IF jsonb_typeof(NEW.spec->'raw_html') IS DISTINCT FROM 'string' OR octet_length(NEW.spec->>'raw_html')>2097152 THEN RAISE EXCEPTION 'RAW_SOURCE_INVALID'; END IF;
  IF TG_TABLE_NAME='emails' THEN NEW.raw_source_profile:='exact-utf8-1';
  ELSE SELECT raw_source_profile INTO NEW.raw_source_profile FROM emails WHERE workspace_id=NEW.workspace_id AND id=NEW.email_id;
   IF NEW.raw_source_profile IS NULL THEN RAISE EXCEPTION 'RAW_SOURCE_PROFILE_REQUIRED'; END IF;
  END IF;
 ELSE NEW.raw_source_profile:=NULL; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER email_source_profile BEFORE INSERT OR UPDATE OF spec ON emails FOR EACH ROW EXECUTE FUNCTION mailcraft_source_profile();
CREATE TRIGGER email_source_profile_direct_update BEFORE UPDATE OF raw_source_profile ON emails FOR EACH ROW EXECUTE FUNCTION mailcraft_source_profile();
CREATE TRIGGER revision_source_profile BEFORE INSERT ON revisions FOR EACH ROW EXECUTE FUNCTION mailcraft_source_profile();
CREATE FUNCTION mailcraft_source_provenance() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source_revision uuid;historical_profile text;
BEGIN
 IF NEW.spec->>'editing_mode'='raw_html' THEN
  IF NEW.workspace_id::text IS DISTINCT FROM current_setting('app.workspace_id',true) OR coalesce(current_setting('app.user_id',true),'')='' THEN RAISE EXCEPTION 'SOURCE_CONTEXT_REQUIRED'; END IF;
  source_revision:=nullif(current_setting('app.source_revision_id',true),'')::uuid;
  IF source_revision IS NOT NULL THEN SELECT raw_source_profile INTO historical_profile FROM revisions WHERE workspace_id=NEW.workspace_id AND id=source_revision; END IF;
  INSERT INTO email_source_provenance(workspace_id,email_id,doc_version,origin,source_revision_id,source_revision_profile,source_sha256,source_bytes,storage_profile,actor,command_id,request_id,created_api_key_id)
  VALUES(NEW.workspace_id,NEW.id,NEW.doc_version,coalesce(nullif(current_setting('app.source_origin',true),''),'edit'),source_revision,historical_profile,encode(sha256(convert_to(NEW.spec->>'raw_html','UTF8')),'hex'),octet_length(NEW.spec->>'raw_html'),'exact-utf8-1',current_setting('app.user_id',true),
    nullif(current_setting('app.source_command_id',true),''),nullif(current_setting('app.source_request_id',true),''),nullif(current_setting('app.source_api_key_id',true),'')::uuid);
  -- Existing draft authorship is not the current editor's identity.
  -- Current transaction identity is authoritative for every source event.
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER email_source_provenance AFTER INSERT OR UPDATE OF spec ON emails FOR EACH ROW EXECUTE FUNCTION mailcraft_source_provenance();
REVOKE ALL ON FUNCTION mailcraft_source_profile(),mailcraft_source_provenance() FROM PUBLIC;
