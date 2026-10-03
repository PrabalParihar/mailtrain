-- Noncredential planning only: these rows are never invitations or access grants.
CREATE TABLE invitation_requests (
 workspace_id uuid NOT NULL REFERENCES workspaces(id),id uuid NOT NULL,
 email text NOT NULL CHECK(length(email) BETWEEN 1 AND 254),role text NOT NULL CHECK(role IN('Admin','Editor','Viewer','Billing')),
 notes text NOT NULL CHECK(length(notes)<=4000),review_due_at timestamptz,
 state text NOT NULL CHECK(state IN('draft','withdrawn')),version integer NOT NULL CHECK(version>0),
 created_by text NOT NULL,updated_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,id)
);
CREATE UNIQUE INDEX invitation_requests_open_email ON invitation_requests(workspace_id,lower(email)) WHERE state='draft';
CREATE INDEX invitation_requests_page ON invitation_requests(workspace_id,created_at DESC,id DESC);
CREATE TABLE invitation_request_history (
 workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),request_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0),command text NOT NULL CHECK(command IN('created','updated','withdrawn','reopened')),
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object'),created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,request_id,version),FOREIGN KEY(workspace_id,request_id) REFERENCES invitation_requests(workspace_id,id)
);
CREATE INDEX invitation_request_history_page ON invitation_request_history(workspace_id,request_id,created_at DESC,id DESC);
ALTER TABLE invitation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_invitation_requests ON invitation_requests USING(workspace_id::text=current_setting('app.workspace_id',true)) WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
ALTER TABLE invitation_request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_request_history FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_invitation_request_history ON invitation_request_history USING(workspace_id::text=current_setting('app.workspace_id',true)) WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
GRANT SELECT,INSERT,UPDATE ON invitation_requests TO mailcraft_runtime;
GRANT SELECT,INSERT ON invitation_request_history TO mailcraft_runtime;
