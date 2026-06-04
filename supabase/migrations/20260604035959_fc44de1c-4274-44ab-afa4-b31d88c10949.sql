
-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emergency_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  sender_role TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_emergency_idx ON public.chat_messages(emergency_id, created_at);

GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read chat" ON public.chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can post as themselves" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Assistance requests table
CREATE TABLE public.assistance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emergency_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_avatar TEXT,
  location TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX assistance_requests_created_idx ON public.assistance_requests(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.assistance_requests TO authenticated;
GRANT ALL ON public.assistance_requests TO service_role;

ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;

-- Requester can see own; staff/manager/security/admin can see all
CREATE POLICY "Requesters or staff can view" ON public.assistance_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'security')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create own request" ON public.assistance_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can update status" ON public.assistance_requests
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'security')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER update_assistance_requests_updated_at
  BEFORE UPDATE ON public.assistance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.assistance_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assistance_requests;
