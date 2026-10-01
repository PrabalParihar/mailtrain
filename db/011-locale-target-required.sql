-- SQL CHECK expressions returning NULL are accepted; make locale identity explicit.
ALTER TABLE email_lineage ADD CONSTRAINT locale_target_required CHECK(kind<>'locale' OR target_locale IS NOT NULL);
