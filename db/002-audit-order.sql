ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS event_sequence bigserial;
CREATE UNIQUE INDEX IF NOT EXISTS audit_events_sequence ON audit_events(event_sequence);
GRANT USAGE ON SEQUENCE audit_events_event_sequence_seq TO mailcraft_runtime;
