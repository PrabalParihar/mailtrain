ALTER TABLE revisions ADD COLUMN source_doc_version integer CHECK(source_doc_version>0);
CREATE TABLE email_lineage (
 workspace_id uuid NOT NULL REFERENCES workspaces(id),id uuid NOT NULL DEFAULT gen_random_uuid(),
 email_id uuid NOT NULL,source_revision_id uuid NOT NULL,source_doc_version integer CHECK(source_doc_version>0),
 kind text NOT NULL CHECK(kind IN('remix','locale')),target_locale text,
 created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,email_id),
 FOREIGN KEY(workspace_id,email_id)REFERENCES emails(workspace_id,id),
 FOREIGN KEY(workspace_id,source_revision_id)REFERENCES revisions(workspace_id,id),
 CHECK((kind='locale' AND target_locale IN('en-US','en-GB','fr-FR','de-DE','es-ES','it-IT','pt-BR','nl-NL','sv-SE','da-DK','no-NO','fi-FI','pl-PL','cs-CZ','tr-TR','ja-JP','ko-KR','zh-CN','zh-TW','hi-IN','ar-SA','he-IL')) OR (kind='remix' AND target_locale IS NULL))
);
ALTER TABLE email_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_lineage FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_email_lineage ON email_lineage USING(workspace_id::text=current_setting('app.workspace_id',true))WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
GRANT SELECT,INSERT ON email_lineage TO mailcraft_runtime;
