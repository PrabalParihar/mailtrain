ALTER TABLE public.memberships ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.memberships ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version>0);
ALTER TABLE public.memberships ADD COLUMN created_at timestamptz NOT NULL DEFAULT statement_timestamp();
ALTER TABLE public.memberships ADD COLUMN revoked_at timestamptz;
ALTER TABLE public.memberships ADD CONSTRAINT membership_tenant_identity UNIQUE(workspace_id,id);
CREATE TABLE public.membership_changes(
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),id uuid NOT NULL DEFAULT gen_random_uuid(),member_id uuid NOT NULL,subject_user_id text NOT NULL,actor_user_id text NOT NULL,
 command text NOT NULL CHECK(command IN('role','remove','transfer-owner')),previous_version integer NOT NULL,next_version integer NOT NULL CHECK(next_version=previous_version+1),
 previous_role text NOT NULL,next_role text NOT NULL,previous_status text NOT NULL,next_status text NOT NULL,
 editing_seats_before integer NOT NULL CHECK(editing_seats_before>=0),editing_seats_after integer NOT NULL CHECK(editing_seats_after>=0),
 revoked_keys integer NOT NULL DEFAULT 0 CHECK(revoked_keys>=0),cancelled_operations integer NOT NULL DEFAULT 0 CHECK(cancelled_operations>=0),cancel_requested_operations integer NOT NULL DEFAULT 0 CHECK(cancel_requested_operations>=0),
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,member_id,next_version),FOREIGN KEY(workspace_id,member_id)REFERENCES public.memberships(workspace_id,id)
);
ALTER TABLE public.membership_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_changes FORCE ROW LEVEL SECURITY;
CREATE POLICY membership_change_manager ON public.membership_changes FOR SELECT TO mailcraft_runtime USING(workspace_id::text=current_setting('app.workspace_id',true)AND EXISTS(SELECT 1 FROM public.memberships m WHERE m.workspace_id=membership_changes.workspace_id AND m.user_id=current_setting('app.user_id',true)AND m.status='active'AND m.role IN('Owner','Admin')));
GRANT SELECT ON public.membership_changes TO mailcraft_runtime;
REVOKE INSERT,UPDATE,DELETE ON public.memberships FROM mailcraft_runtime;
-- PostgreSQL row SHARE locking requires an UPDATE privilege on at least one
-- column. This grant enables locking; the trigger forbids runtime writes.
GRANT UPDATE(version)ON public.memberships TO mailcraft_runtime;
CREATE FUNCTION public.mailcraft_membership_runtime_readonly()RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
 BEGIN IF current_user='mailcraft_runtime'THEN RAISE EXCEPTION 'MEMBERSHIP_DIRECT_WRITE_DENIED';END IF;RETURN NEW;END;
$$;
CREATE TRIGGER membership_runtime_readonly BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.mailcraft_membership_runtime_readonly();
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_membership_admin')THEN CREATE ROLE mailcraft_membership_admin NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mailcraft_membership_admin'AND(rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole))THEN RAISE EXCEPTION 'Membership administrator must be restricted NOLOGIN';END IF;
END $$;
GRANT USAGE ON SCHEMA public TO mailcraft_membership_admin;
GRANT SELECT ON public.workspaces,public.memberships,public.api_keys,public.operations,public.usage_ledger,public.membership_changes TO mailcraft_membership_admin;
GRANT UPDATE(status)ON public.workspaces TO mailcraft_membership_admin;
GRANT UPDATE(role,status,version,revoked_at)ON public.memberships TO mailcraft_membership_admin;
GRANT UPDATE(revoked_at)ON public.api_keys TO mailcraft_membership_admin;
GRANT UPDATE(state,completed_at)ON public.operations TO mailcraft_membership_admin;
GRANT INSERT ON public.usage_ledger,public.membership_changes TO mailcraft_membership_admin;
CREATE POLICY membership_change_service ON public.membership_changes TO mailcraft_membership_admin USING(workspace_id::text=current_setting('app.workspace_id',true))WITH CHECK(workspace_id::text=current_setting('app.workspace_id',true));
CREATE FUNCTION public.mailcraft_change_member(w uuid,target uuid,expected integer,kind text,new_role text,owner_expected integer,ack boolean)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 DECLARE actor public.memberships%ROWTYPE;old public.memberships%ROWTYPE;changed public.memberships%ROWTYPE;owner_changed public.memberships%ROWTYPE;
 before_count integer;after_count integer;owners integer;key_count integer:=0;cancel_count integer:=0;running_count integer:=0;journal public.membership_changes%ROWTYPE;entries jsonb:='[]'::jsonb;ws_status text;
 BEGIN
 IF w::text IS DISTINCT FROM current_setting('app.workspace_id',true)OR coalesce(current_setting('app.user_id',true),'')=''THEN RAISE EXCEPTION 'RESOURCE_NOT_FOUND';END IF;
 IF current_setting('app.user_id',true)LIKE'api-key:%'THEN RAISE EXCEPTION 'SESSION_REQUIRED';END IF;
 SET LOCAL lock_timeout='2s';
 -- Exclusive workspace admission precedes membership/key/operation locks.
 SELECT status INTO ws_status FROM public.workspaces WHERE id=w FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'RESOURCE_NOT_FOUND';END IF;
 IF ws_status<>'active'THEN RAISE EXCEPTION 'WORKSPACE_LOCKED';END IF;
 SELECT * INTO actor FROM public.memberships WHERE workspace_id=w AND user_id=current_setting('app.user_id',true)AND status='active'FOR UPDATE;
 IF NOT FOUND OR actor.role NOT IN('Owner','Admin')THEN RAISE EXCEPTION 'INSUFFICIENT_SCOPE';END IF;
 SELECT * INTO old FROM public.memberships WHERE workspace_id=w AND id=target FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'RESOURCE_NOT_FOUND';END IF;
 IF old.version IS DISTINCT FROM expected THEN RAISE EXCEPTION 'MEMBERSHIP_VERSION_CONFLICT';END IF;
 IF old.version=2147483647 THEN RAISE EXCEPTION 'MEMBERSHIP_VERSION_EXHAUSTED';END IF;
 IF kind NOT IN('role','remove','transfer-owner')THEN RAISE EXCEPTION 'VALIDATION_FAILED';END IF;
 IF kind IN('remove','transfer-owner')AND ack IS DISTINCT FROM true THEN RAISE EXCEPTION 'MEMBERSHIP_ACK_REQUIRED';END IF;
 IF kind='transfer-owner'THEN
  IF actor.role<>'Owner'THEN RAISE EXCEPTION 'OWNER_REQUIRED';END IF;
  IF actor.id=old.id THEN RAISE EXCEPTION 'SELF_TRANSFER_DENIED';END IF;
  IF actor.version IS DISTINCT FROM owner_expected THEN RAISE EXCEPTION 'MEMBERSHIP_VERSION_CONFLICT';END IF;
  IF actor.version=2147483647 THEN RAISE EXCEPTION 'MEMBERSHIP_VERSION_EXHAUSTED';END IF;
 END IF;
 IF actor.role='Admin'AND(old.role IN('Owner','Billing')OR new_role='Billing')THEN RAISE EXCEPTION 'ROLE_PROTECTED';END IF;
 IF old.status<>'active'THEN RAISE EXCEPTION 'MEMBERSHIP_INACTIVE';END IF;
 SELECT count(*)INTO before_count FROM public.memberships WHERE workspace_id=w AND status='active'AND role IN('Owner','Admin','Editor');
 SELECT count(*)INTO owners FROM public.memberships WHERE workspace_id=w AND status='active'AND role='Owner';
 IF kind='transfer-owner'THEN
  IF old.role='Owner'THEN RAISE EXCEPTION 'MEMBERSHIP_UNCHANGED';END IF;
  IF old.role NOT IN('Admin','Editor')THEN RAISE EXCEPTION 'SEAT_POLICY_REQUIRED';END IF;
  UPDATE public.memberships SET role='Owner',version=version+1 WHERE workspace_id=w AND id=old.id RETURNING * INTO changed;
  UPDATE public.memberships SET role='Admin',version=version+1 WHERE workspace_id=w AND id=actor.id RETURNING * INTO owner_changed;
  after_count:=before_count;
 ELSE
  IF kind='role'THEN
   IF new_role IS NULL OR new_role NOT IN('Admin','Editor','Viewer','Billing')THEN RAISE EXCEPTION 'OWNER_TRANSFER_REQUIRED';END IF;
   IF old.role=new_role THEN RAISE EXCEPTION 'MEMBERSHIP_UNCHANGED';END IF;
   IF old.role NOT IN('Owner','Admin','Editor')AND new_role IN('Admin','Editor')THEN RAISE EXCEPTION 'SEAT_POLICY_REQUIRED';END IF;
  END IF;
  IF old.role='Owner'AND owners<=1 THEN RAISE EXCEPTION 'LAST_OWNER_REQUIRED';END IF;
  UPDATE public.memberships SET role=CASE WHEN kind='role'THEN new_role ELSE role END,status=CASE WHEN kind='remove'THEN'revoked'ELSE status END,revoked_at=CASE WHEN kind='remove'THEN clock_timestamp()ELSE revoked_at END,version=version+1 WHERE workspace_id=w AND id=old.id RETURNING * INTO changed;
  IF kind='remove'OR changed.role NOT IN('Owner','Admin')THEN
   UPDATE public.api_keys SET revoked_at=clock_timestamp()WHERE workspace_id=w AND created_by=old.user_id AND revoked_at IS NULL;
   GET DIAGNOSTICS key_count=ROW_COUNT;
  END IF;
  WITH pending AS(
   UPDATE public.operations SET state=CASE WHEN state='queued'THEN'cancelled'ELSE'cancel_requested'END,completed_at=CASE WHEN state='queued'THEN clock_timestamp()ELSE NULL END
   WHERE workspace_id=w AND created_by=old.user_id AND state IN('queued','running')AND(kind='remove'OR changed.role NOT IN('Owner','Admin','Editor')OR(old.role IN('Owner','Admin')AND changed.role NOT IN('Owner','Admin')AND created_api_key_id IS NOT NULL))RETURNING id,state
  ),released AS(
   INSERT INTO public.usage_ledger(workspace_id,operation_id,metric,kind,units)
   SELECT l.workspace_id,l.operation_id,l.metric,'release',l.units FROM public.usage_ledger l JOIN pending p ON p.id=l.operation_id AND p.state='cancelled'WHERE l.workspace_id=w AND l.kind='reserve'ON CONFLICT DO NOTHING RETURNING id
  )SELECT count(*)FILTER(WHERE state='cancelled'),count(*)FILTER(WHERE state='cancel_requested')INTO cancel_count,running_count FROM pending;
  SELECT count(*)INTO after_count FROM public.memberships WHERE workspace_id=w AND status='active'AND role IN('Owner','Admin','Editor');
 END IF;
 INSERT INTO public.membership_changes(workspace_id,member_id,subject_user_id,actor_user_id,command,previous_version,next_version,previous_role,next_role,previous_status,next_status,editing_seats_before,editing_seats_after,revoked_keys,cancelled_operations,cancel_requested_operations)
 VALUES(w,old.id,old.user_id,actor.user_id,kind,old.version,changed.version,old.role,changed.role,old.status,changed.status,before_count,after_count,key_count,cancel_count,running_count)RETURNING * INTO journal;
 entries:=entries||jsonb_build_array(to_jsonb(journal));
 IF kind='transfer-owner'THEN
  INSERT INTO public.membership_changes(workspace_id,member_id,subject_user_id,actor_user_id,command,previous_version,next_version,previous_role,next_role,previous_status,next_status,editing_seats_before,editing_seats_after)
  VALUES(w,actor.id,actor.user_id,actor.user_id,kind,actor.version,owner_changed.version,actor.role,owner_changed.role,actor.status,owner_changed.status,before_count,after_count)RETURNING * INTO journal;
  entries:=entries||jsonb_build_array(to_jsonb(journal));
 END IF;
 RETURN jsonb_build_object('member',to_jsonb(changed),'changes',entries);
 END;
$$;
GRANT CREATE ON SCHEMA public TO mailcraft_membership_admin;
ALTER FUNCTION public.mailcraft_change_member(uuid,uuid,integer,text,text,integer,boolean)OWNER TO mailcraft_membership_admin;
REVOKE CREATE ON SCHEMA public FROM mailcraft_membership_admin;
REVOKE ALL ON FUNCTION public.mailcraft_change_member(uuid,uuid,integer,text,text,integer,boolean)FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mailcraft_change_member(uuid,uuid,integer,text,text,integer,boolean)TO mailcraft_runtime;
