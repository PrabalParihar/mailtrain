CREATE TABLE webhook_consumer_receipts(
 consumer_id uuid NOT NULL,event_id uuid NOT NULL,workspace_id uuid NOT NULL,body_hash text NOT NULL CHECK(body_hash~'^[0-9a-f]{64}$'),received_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(consumer_id,event_id)
);
CREATE TABLE webhook_resource_observations(
 consumer_id uuid NOT NULL,workspace_id uuid NOT NULL,resource_type text NOT NULL,resource_id uuid NOT NULL,event_type text NOT NULL,scope_id text NOT NULL,
 resource_version integer NOT NULL CHECK(resource_version>0),event_id uuid NOT NULL,recorded_at timestamptz NOT NULL,
 PRIMARY KEY(consumer_id,workspace_id,resource_type,resource_id,event_type,scope_id),FOREIGN KEY(consumer_id,event_id)REFERENCES webhook_consumer_receipts(consumer_id,event_id)
);
