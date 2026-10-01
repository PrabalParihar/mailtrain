ALTER TABLE contacts ADD COLUMN preference_version integer NOT NULL DEFAULT 1;
ALTER TABLE contacts ADD COLUMN frequency text NOT NULL DEFAULT 'weekly' CHECK(frequency IN('daily','weekly','monthly'));
CREATE TABLE opt_in_requests(workspace_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(),contact_id uuid NOT NULL,topic_ids uuid[] NOT NULL,reactivate_global boolean NOT NULL DEFAULT false,expected_consent_version integer NOT NULL,expected_preference_version integer NOT NULL,status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','confirmed')),token_hash text,expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',created_at timestamptz NOT NULL DEFAULT now(),confirmed_at timestamptz,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,contact_id) REFERENCES contacts(workspace_id,id));
CREATE TABLE topic_subscriptions(workspace_id uuid NOT NULL,contact_id uuid NOT NULL,topic_id uuid NOT NULL,subscription text NOT NULL CHECK(subscription IN('pending_confirmation','subscribed','unsubscribed')),confirmed_request_id uuid,updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,contact_id,topic_id),FOREIGN KEY(workspace_id,contact_id) REFERENCES contacts(workspace_id,id),FOREIGN KEY(workspace_id,topic_id) REFERENCES lists(workspace_id,id),FOREIGN KEY(workspace_id,confirmed_request_id) REFERENCES opt_in_requests(workspace_id,id));
CREATE TABLE frequency_reservations(workspace_id uuid NOT NULL,contact_id uuid NOT NULL,delivery_id uuid NOT NULL,topic_id uuid NOT NULL,state text NOT NULL DEFAULT 'reserved' CHECK(state IN('reserved','accepted','uncertain','released','failed')),reserved_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(workspace_id,delivery_id),FOREIGN KEY(workspace_id,contact_id) REFERENCES contacts(workspace_id,id),FOREIGN KEY(workspace_id,topic_id) REFERENCES lists(workspace_id,id));
CREATE INDEX frequency_by_contact ON frequency_reservations(workspace_id,contact_id,reserved_at) WHERE state IN('reserved','accepted','uncertain');
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['opt_in_requests','topic_subscriptions','frequency_reservations'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant_context ON %I USING(workspace_id::text=current_setting(''app.workspace_id'',true)) WITH CHECK(workspace_id::text=current_setting(''app.workspace_id'',true))',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON %I TO mailcraft_runtime',t);
 END LOOP;
END $$;
