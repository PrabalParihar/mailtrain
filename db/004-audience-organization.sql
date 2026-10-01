ALTER TABLE contacts ADD COLUMN profile_version integer NOT NULL DEFAULT 1;
ALTER TABLE contacts ADD COLUMN preferred_locale text NOT NULL DEFAULT 'en-US';
CREATE TABLE lists(workspace_id uuid NOT NULL REFERENCES workspaces(id),id uuid NOT NULL DEFAULT gen_random_uuid(),name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),double_opt_in boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,name));
CREATE TABLE tags(workspace_id uuid NOT NULL REFERENCES workspaces(id),id uuid NOT NULL DEFAULT gen_random_uuid(),name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,name));
CREATE TABLE contact_fields(workspace_id uuid NOT NULL REFERENCES workspaces(id),key text NOT NULL CHECK(key~'^[a-z][a-z0-9_]{0,47}$'),label text NOT NULL,type text NOT NULL CHECK(type IN('string','number','boolean','date')),created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,key));
CREATE TABLE contact_lists(workspace_id uuid NOT NULL,contact_id uuid NOT NULL,list_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,contact_id,list_id),FOREIGN KEY(workspace_id,contact_id) REFERENCES contacts(workspace_id,id),FOREIGN KEY(workspace_id,list_id) REFERENCES lists(workspace_id,id));
CREATE TABLE contact_tags(workspace_id uuid NOT NULL,contact_id uuid NOT NULL,tag_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,contact_id,tag_id),FOREIGN KEY(workspace_id,contact_id) REFERENCES contacts(workspace_id,id),FOREIGN KEY(workspace_id,tag_id) REFERENCES tags(workspace_id,id));
CREATE TABLE engagement_events(workspace_id uuid NOT NULL,contact_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),event text NOT NULL CHECK(event IN('opened','clicked','delivered')),provider text NOT NULL,provider_event_id text NOT NULL,verification jsonb NOT NULL,occurred_at timestamptz NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,provider,provider_event_id),FOREIGN KEY(workspace_id,contact_id) REFERENCES contacts(workspace_id,id));
CREATE TABLE segments(workspace_id uuid NOT NULL REFERENCES workspaces(id),id uuid NOT NULL DEFAULT gen_random_uuid(),name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),current_version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,name));
CREATE TABLE segment_versions(workspace_id uuid NOT NULL,segment_id uuid NOT NULL,version integer NOT NULL,schema_version integer NOT NULL CHECK(schema_version=1),rule jsonb NOT NULL,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,segment_id,version),FOREIGN KEY(workspace_id,segment_id) REFERENCES segments(workspace_id,id));
CREATE TABLE audience_snapshots(workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),segment_id uuid NOT NULL,segment_version integer NOT NULL,evaluated_at timestamptz NOT NULL,members jsonb NOT NULL,matched_count integer NOT NULL,eligible_count integer NOT NULL,digest text NOT NULL,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,segment_id,segment_version) REFERENCES segment_versions(workspace_id,segment_id,version));
CREATE INDEX contact_tags_by_tag ON contact_tags(workspace_id,tag_id,contact_id);
CREATE INDEX contact_lists_by_list ON contact_lists(workspace_id,list_id,contact_id);
CREATE INDEX engagement_by_contact ON engagement_events(workspace_id,contact_id,event,occurred_at);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['lists','tags','contact_fields','contact_lists','contact_tags','engagement_events','segments','segment_versions','audience_snapshots'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant_context ON %I USING(workspace_id::text=current_setting(''app.workspace_id'',true)) WITH CHECK(workspace_id::text=current_setting(''app.workspace_id'',true))',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I TO mailcraft_runtime',t);
 END LOOP;
END $$;
REVOKE UPDATE,DELETE ON segment_versions,audience_snapshots,contact_fields FROM mailcraft_runtime;
-- Event provenance may only be written by the future verified webhook-ingestion boundary.
REVOKE INSERT,UPDATE,DELETE ON engagement_events FROM mailcraft_runtime;
