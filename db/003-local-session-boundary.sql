REVOKE ALL ON auth_sessions,schema_migrations FROM mailcraft_runtime;
REVOKE CREATE ON SCHEMA public FROM PUBLIC,mailcraft_runtime;
CREATE OR REPLACE FUNCTION mailcraft_local_identity(p_hash text) RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT user_id FROM auth_sessions WHERE token_hash=p_hash AND expires_at>now() $$;
REVOKE ALL ON FUNCTION mailcraft_local_identity(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_local_identity(text) TO mailcraft_runtime;
