-- Preserve old evidence as legacy; never upgrade a report by changing its rule label.
ALTER TABLE preflights ADD COLUMN rule_set_version text NOT NULL DEFAULT 'legacy-1';
