
-- 1. Approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. role_requests table
CREATE TABLE public.role_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  requested_role public.app_role NOT NULL,
  approval_status public.approval_status NOT NULL DEFAULT 'pending',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  hotel_name TEXT,
  employee_id TEXT,
  business_license_number TEXT,
  organization_name TEXT,
  id_proof_url TEXT,
  reviewer_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role request"
ON public.role_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all role requests"
ON public.role_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own role request"
ON public.role_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending role request"
ON public.role_requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND approval_status = 'pending')
WITH CHECK (auth.uid() = user_id AND approval_status = 'pending');

CREATE POLICY "Admins can update any role request"
ON public.role_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_role_requests_updated_at
BEFORE UPDATE ON public.role_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Update handle_new_user to always default role = 'guest' and create role_request
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requested public.app_role;
  v_name TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (NEW.id, v_name, NEW.raw_user_meta_data->>'avatar_url');

  -- Always start as guest. Never trust client-provided role.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'guest');

  -- If user requested an elevated role, capture it as a pending request.
  v_requested := NULLIF(NEW.raw_user_meta_data->>'requested_role','')::public.app_role;
  IF v_requested IS NOT NULL AND v_requested <> 'guest' AND v_requested <> 'admin' THEN
    INSERT INTO public.role_requests (
      user_id, requested_role, full_name, email,
      hotel_name, employee_id, business_license_number,
      organization_name, id_proof_url
    ) VALUES (
      NEW.id,
      v_requested,
      v_name,
      NEW.email,
      NULLIF(NEW.raw_user_meta_data->>'hotel_name',''),
      NULLIF(NEW.raw_user_meta_data->>'employee_id',''),
      NULLIF(NEW.raw_user_meta_data->>'business_license_number',''),
      NULLIF(NEW.raw_user_meta_data->>'organization_name',''),
      NULLIF(NEW.raw_user_meta_data->>'id_proof_url','')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists (recreate to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Admin helper function: approve a role request and promote the user
CREATE OR REPLACE FUNCTION public.approve_role_request(_request_id UUID, _notes TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_role public.app_role;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve role requests';
  END IF;

  SELECT user_id, requested_role INTO v_user, v_role
  FROM public.role_requests WHERE id = _request_id;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Role request not found';
  END IF;

  IF v_role = 'admin' THEN
    RAISE EXCEPTION 'Admin role cannot be assigned through requests';
  END IF;

  -- Replace existing roles with the approved one (single-role model)
  DELETE FROM public.user_roles WHERE user_id = v_user;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user, v_role);

  UPDATE public.role_requests
  SET approval_status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reviewer_notes = _notes
  WHERE id = _request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_role_request(_request_id UUID, _notes TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject role requests';
  END IF;

  UPDATE public.role_requests
  SET approval_status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reviewer_notes = _notes
  WHERE id = _request_id;
END;
$$;

-- 5. Private storage bucket for ID proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-proofs', 'id-proofs', false);

CREATE POLICY "Users can upload own id proof"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own id proof"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all id proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-proofs'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage id proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'id-proofs'
  AND public.has_role(auth.uid(), 'admin')
);
