-- Manual review history is separate from draft saves and campaign approvals.
CREATE TABLE locale_content_reviews (
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  source_revision_id uuid NOT NULL,
  observed_source_doc_version integer NOT NULL CHECK(observed_source_doc_version>0),
  outcome text NOT NULL CHECK(outcome IN('content_reviewed','changes_requested')),
  note text NOT NULL CHECK(length(btrim(note)) BETWEEN 1 AND 4000),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(workspace_id,id),
  FOREIGN KEY(workspace_id,email_id) REFERENCES emails(workspace_id,id),
  FOREIGN KEY(workspace_id,revision_id) REFERENCES revisions(workspace_id,id),
  FOREIGN KEY(workspace_id,source_revision_id) REFERENCES revisions(workspace_id,id)
);
CREATE INDEX locale_content_reviews_page ON locale_content_reviews(workspace_id,email_id,created_at DESC,id DESC);
ALTER TABLE locale_content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE locale_content_reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_locale_content_reviews ON locale_content_reviews
  USING(workspace_id::text=current_setting('app.workspace_id',true))
  WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
GRANT SELECT,INSERT ON locale_content_reviews TO mailcraft_runtime;
