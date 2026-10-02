-- Local fixture identity remains unavailable in production. Hold the exact
-- session through an admitted transaction and check its expiry after any wait.
CREATE OR REPLACE FUNCTION mailcraft_local_identity(p_hash text) RETURNS text
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor text; deadline timestamptz;
BEGIN
 SELECT user_id,expires_at INTO actor,deadline FROM public.auth_sessions
  WHERE token_hash=p_hash FOR SHARE;
 IF NOT FOUND OR deadline<=clock_timestamp()THEN RETURN NULL;END IF;
 RETURN actor;
END$$;
REVOKE ALL ON FUNCTION mailcraft_local_identity(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mailcraft_local_identity(text) TO mailcraft_runtime;
