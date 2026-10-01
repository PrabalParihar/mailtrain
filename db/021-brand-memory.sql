CREATE TABLE brand_sources(workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),brand_kit_version_id uuid NOT NULL,title text NOT NULL CHECK(length(title)BETWEEN 1 AND 160),source_ref text NOT NULL CHECK(length(source_ref)BETWEEN 1 AND 2048),content_digest text NOT NULL CHECK(content_digest~'^[a-f0-9]{64}$'),content_bytes integer NOT NULL CHECK(content_bytes BETWEEN 1 AND 65536),chunk_count integer NOT NULL CHECK(chunk_count BETWEEN 1 AND 64),allowed_usage text NOT NULL DEFAULT 'approved_context' CHECK(allowed_usage='approved_context'),embedding_model text CHECK(embedding_model IS NULL),embedding_version text CHECK(embedding_version IS NULL),created_at timestamptz NOT NULL DEFAULT statement_timestamp(),deleted_at timestamptz,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,brand_kit_version_id)REFERENCES brands(workspace_id,id));
CREATE TABLE brand_memory_chunks(workspace_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),source_id uuid NOT NULL,ordinal integer NOT NULL CHECK(ordinal BETWEEN 0 AND 63),content text NOT NULL CHECK(length(content)BETWEEN 1 AND 1500),content_digest text NOT NULL CHECK(content_digest=encode(sha256(convert_to(content,'UTF8')),'hex')),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,source_id,ordinal),FOREIGN KEY(workspace_id,source_id)REFERENCES brand_sources(workspace_id,id));
ALTER TABLE brand_sources ENABLE ROW LEVEL SECURITY;ALTER TABLE brand_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE brand_memory_chunks ENABLE ROW LEVEL SECURITY;ALTER TABLE brand_memory_chunks FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_source_tenant ON brand_sources USING(workspace_id::text=current_setting('app.workspace_id',true))WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
CREATE POLICY brand_chunk_active ON brand_memory_chunks FOR SELECT USING(workspace_id::text=current_setting('app.workspace_id',true)AND EXISTS(SELECT 1 FROM brand_sources s WHERE s.workspace_id=brand_memory_chunks.workspace_id AND s.id=source_id AND s.deleted_at IS NULL));
CREATE POLICY brand_chunk_insert ON brand_memory_chunks FOR INSERT WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true)AND EXISTS(SELECT 1 FROM brand_sources s WHERE s.workspace_id=brand_memory_chunks.workspace_id AND s.id=source_id AND s.deleted_at IS NULL AND ordinal<s.chunk_count));
GRANT SELECT,INSERT ON brand_sources,brand_memory_chunks TO mailcraft_runtime;
GRANT UPDATE(deleted_at)ON brand_sources TO mailcraft_runtime;
CREATE FUNCTION mailcraft_brand_source_guard()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
 BEGIN
 IF TG_OP='UPDATE'THEN
 IF (to_jsonb(NEW)-'deleted_at')IS DISTINCT FROM(to_jsonb(OLD)-'deleted_at')OR OLD.deleted_at IS NOT NULL OR NEW.deleted_at IS NULL THEN RAISE EXCEPTION 'BRAND_SOURCE_IMMUTABLE';END IF;
 ELSE
 PERFORM pg_advisory_xact_lock(hashtextextended('lettercape.brand.memory.'||NEW.workspace_id::text,0));
 IF NEW.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'BRAND_SOURCE_IMMUTABLE';END IF;
 IF(SELECT count(*)FROM brand_sources WHERE workspace_id=NEW.workspace_id AND deleted_at IS NULL)>=100 OR(SELECT coalesce(sum(content_bytes),0)FROM brand_sources WHERE workspace_id=NEW.workspace_id AND deleted_at IS NULL)+NEW.content_bytes>1048576 THEN RAISE EXCEPTION 'BRAND_MEMORY_CAPACITY';END IF;
 END IF;RETURN NEW;
 END;
$$;
CREATE TRIGGER brand_source_guard BEFORE INSERT OR UPDATE ON brand_sources FOR EACH ROW EXECUTE FUNCTION mailcraft_brand_source_guard();
CREATE INDEX brand_source_version ON brand_sources(workspace_id,brand_kit_version_id,created_at,id);
CREATE INDEX brand_chunk_source ON brand_memory_chunks(workspace_id,source_id,ordinal);
