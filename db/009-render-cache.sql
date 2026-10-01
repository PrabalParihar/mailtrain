CREATE TABLE render_downloads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL REFERENCES workspaces(id),
 revision_id uuid NOT NULL,format text NOT NULL CHECK(format IN('png','pdf')),
 renderer_version text NOT NULL CHECK(length(renderer_version)<=80),artifact_hash text NOT NULL CHECK(artifact_hash ~ '^[0-9a-f]{64}$'),
 body bytea NOT NULL,body_hash text NOT NULL CHECK(body_hash ~ '^[0-9a-f]{64}$'),byte_size integer NOT NULL CHECK(byte_size>0 AND byte_size<=20971520),
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(workspace_id,id),UNIQUE(workspace_id,revision_id,format,renderer_version),
 FOREIGN KEY(workspace_id,revision_id)REFERENCES revisions(workspace_id,id),CHECK(octet_length(body)=byte_size)
);
ALTER TABLE render_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_downloads FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_render_downloads ON render_downloads USING(workspace_id::text=current_setting('app.workspace_id',true))WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
GRANT SELECT,INSERT ON render_downloads TO mailcraft_runtime;
