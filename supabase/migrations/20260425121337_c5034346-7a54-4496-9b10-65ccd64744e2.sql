DROP POLICY IF EXISTS "Public can view incident images" ON storage.objects;

CREATE POLICY "Authenticated users can list incident images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'incident-images');