-- Templates pin existing immutable revisions, never a second source document.
CREATE UNIQUE INDEX revisions_template_identity ON revisions(workspace_id,id,email_id);
CREATE TABLE email_templates(
 workspace_id uuid NOT NULL REFERENCES workspaces(id),id uuid NOT NULL DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 160 AND name=btrim(name)),
 source_revision_id uuid NOT NULL,source_email_id uuid NOT NULL,source_revision_no integer NOT NULL CHECK(source_revision_no>0),
 source_doc_version integer CHECK(source_doc_version>0),source_title text NOT NULL CHECK(length(source_title) BETWEEN 1 AND 160),
 artifact_hash text NOT NULL CHECK(artifact_hash~'^[0-9a-f]{64}$'),brand_kit_version_id uuid NOT NULL,
 locale text NOT NULL,direction text NOT NULL CHECK(direction IN('ltr','rtl')),editing_mode text NOT NULL CHECK(editing_mode IN('structured','raw_html')),
 state text NOT NULL DEFAULT 'active' CHECK(state IN('active','archived')),version integer NOT NULL DEFAULT 1,
 created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),archived_at timestamptz,
 PRIMARY KEY(workspace_id,id),
 FOREIGN KEY(workspace_id,source_revision_id,source_email_id) REFERENCES revisions(workspace_id,id,email_id),
 FOREIGN KEY(workspace_id,brand_kit_version_id) REFERENCES brands(workspace_id,id),
 CHECK((state='active' AND version=1 AND archived_at IS NULL)OR(state='archived' AND version=2 AND archived_at IS NOT NULL))
);
CREATE INDEX email_templates_page ON email_templates(workspace_id,state,created_at DESC,id DESC);
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_email_templates ON email_templates USING(workspace_id::text=current_setting('app.workspace_id',true))WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
REVOKE ALL ON email_templates FROM PUBLIC,mailcraft_runtime;
GRANT SELECT,INSERT ON email_templates TO mailcraft_runtime;
GRANT UPDATE(state,version,archived_at) ON email_templates TO mailcraft_runtime;
CREATE FUNCTION mailcraft_template_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE r public.revisions%ROWTYPE; title text;
BEGIN
 IF TG_OP='DELETE' OR TG_OP='TRUNCATE' THEN RAISE EXCEPTION 'TEMPLATE_IMMUTABLE';END IF;
 IF TG_OP='INSERT' THEN
  SELECT * INTO r FROM public.revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.source_revision_id;
  IF NOT FOUND OR NEW.artifact_hash IS DISTINCT FROM r.artifact_hash THEN RAISE EXCEPTION 'TEMPLATE_SOURCE_MISMATCH';END IF;
  SELECT e.title INTO title FROM public.emails e WHERE e.workspace_id=r.workspace_id AND e.id=r.email_id;
  NEW.source_email_id:=r.email_id;NEW.source_revision_no:=r.revision_no;NEW.source_doc_version:=r.source_doc_version;NEW.source_title:=title;
  NEW.brand_kit_version_id:=(r.spec->>'brand_kit_version_id')::uuid;NEW.locale:=r.spec->>'locale';NEW.direction:=r.spec->>'direction';NEW.editing_mode:=coalesce(r.spec->>'editing_mode','structured');
  IF NEW.state<>'active' OR NEW.version<>1 OR NEW.archived_at IS NOT NULL THEN RAISE EXCEPTION 'TEMPLATE_STATE_INVALID';END IF;
 ELSE
  IF (to_jsonb(NEW)-'state'-'version'-'archived_at') IS DISTINCT FROM (to_jsonb(OLD)-'state'-'version'-'archived_at')
   OR OLD.state<>'active' OR OLD.version<>1 OR NEW.state<>'archived' OR NEW.version<>2 OR NEW.archived_at IS NULL THEN
   RAISE EXCEPTION 'TEMPLATE_IMMUTABLE';
  END IF;
 END IF;
 RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION mailcraft_template_guard() FROM PUBLIC,mailcraft_runtime;
CREATE TRIGGER template_pin_guard BEFORE INSERT OR UPDATE OR DELETE ON email_templates FOR EACH ROW EXECUTE FUNCTION mailcraft_template_guard();
CREATE TRIGGER template_no_truncate BEFORE TRUNCATE ON email_templates FOR EACH STATEMENT EXECUTE FUNCTION mailcraft_template_guard();
