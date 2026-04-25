-- Create enum for emergency status
CREATE TYPE public.emergency_status AS ENUM ('active', 'in_progress', 'resolved', 'closed');

-- Create emergencies table
CREATE TABLE public.emergencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.emergency_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view all emergencies (staff/security need full visibility)
CREATE POLICY "Authenticated users can view all emergencies"
ON public.emergencies FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can create emergencies
CREATE POLICY "Authenticated users can create emergencies"
ON public.emergencies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Reporter can update their own emergency
CREATE POLICY "Users can update their own emergencies"
ON public.emergencies FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Reporter can delete their own emergency
CREATE POLICY "Users can delete their own emergencies"
ON public.emergencies FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_emergencies_updated_at
BEFORE UPDATE ON public.emergencies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();