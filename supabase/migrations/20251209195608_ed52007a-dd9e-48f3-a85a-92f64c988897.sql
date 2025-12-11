-- Create storage bucket for solicitud images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('solicitud-images', 'solicitud-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload solicitud images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'solicitud-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow public read access to solicitud images
CREATE POLICY "Solicitud images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'solicitud-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own solicitud images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'solicitud-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);