-- All default policy timestamps share one statement instant; clock_timestamp() per column
-- could exceed the immutable24h bound by microseconds even on a valid insert.
ALTER TABLE webhook_deliveries ALTER COLUMN created_at SET DEFAULT statement_timestamp();
ALTER TABLE webhook_deliveries ALTER COLUMN deadline SET DEFAULT statement_timestamp()+interval '24 hours';
ALTER TABLE webhook_deliveries ALTER COLUMN next_at SET DEFAULT statement_timestamp();
