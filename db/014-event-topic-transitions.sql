-- A single recipient preference save may revoke several topics at one consent version.
-- Preserve one receipt per topic/transition rather than conflating distinct scopes.
DROP INDEX outbox_versioned_transition;
CREATE UNIQUE INDEX outbox_versioned_transition ON outbox(
 workspace_id,type,aggregate_id,((event_body::jsonb->'aggregate'->>'version')::integer),
 coalesce(event_body::jsonb->'data'->>'topic_id','')
) WHERE event_body IS NOT NULL;
