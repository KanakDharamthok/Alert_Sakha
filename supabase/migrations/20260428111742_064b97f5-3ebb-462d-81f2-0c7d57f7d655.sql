
-- 1) Make incident-images bucket PRIVATE
UPDATE storage.buckets SET public = false WHERE id = 'incident-images';

-- 2) Tighten user_roles SELECT: users see only their own role; admins can see all (covered by existing ALL admin policy)
DROP POLICY IF EXISTS "Roles viewable by authenticated users" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Harden role_requests UPDATE so users cannot set themselves to approved/rejected or change requested_role/user_id
DROP POLICY IF EXISTS "Users can update their own pending role request" ON public.role_requests;

CREATE OR REPLACE FUNCTION public.protect_role_request_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to do anything
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admin owners: prevent escalation/tampering
  IF NEW.user_id <> OLD.user_id
     OR NEW.approval_status <> OLD.approval_status
     OR NEW.requested_role <> OLD.requested_role
     OR COALESCE(NEW.reviewed_by::text,'') <> COALESCE(OLD.reviewed_by::text,'')
     OR COALESCE(NEW.reviewed_at::text,'') <> COALESCE(OLD.reviewed_at::text,'')
     OR COALESCE(NEW.reviewer_notes,'') <> COALESCE(OLD.reviewer_notes,'') THEN
    RAISE EXCEPTION 'You cannot modify approval fields of a role request';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_role_request_updates ON public.role_requests;
CREATE TRIGGER trg_protect_role_request_updates
BEFORE UPDATE ON public.role_requests
FOR EACH ROW
EXECUTE FUNCTION public.protect_role_request_updates();

CREATE POLICY "Users can update their own pending role request"
ON public.role_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND approval_status = 'pending')
WITH CHECK (auth.uid() = user_id AND approval_status = 'pending');

-- 4) Revoke anon EXECUTE on SECURITY DEFINER functions so they're not callable by anonymous users
REVOKE EXECUTE ON FUNCTION public.approve_role_request(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_role_request(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.approve_role_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_role_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
