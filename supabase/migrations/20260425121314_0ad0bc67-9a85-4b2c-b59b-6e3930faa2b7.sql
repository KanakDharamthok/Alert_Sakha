-- Public bucket for incident photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-images', 'incident-images', true);

-- Add image URLs column to emergencies
ALTER TABLE public.emergencies
  ADD COLUMN image_urls TEXT[] NOT NULL DEFAULT '{}';

-- Storage policies (RLS is already enabled on storage.objects)
CREATE POLICY "Public can view incident images"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-images');

CREATE POLICY "Authenticated users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'incident-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own incident images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'incident-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own incident images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'incident-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);