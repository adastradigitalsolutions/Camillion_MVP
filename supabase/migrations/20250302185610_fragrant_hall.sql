/*
  # Create storage bucket for progress photos

  1. New Storage Bucket
    - Creates a 'progress-photos' bucket for storing user progress photos
    - Sets appropriate security policies
  2. Security
    - Enables authenticated users to upload their own photos
    - Enables authenticated users to read their own photos
*/

-- Create the storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
CREATE POLICY "Users can upload their own progress photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own progress photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'progress-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own progress photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'progress-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own progress photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'progress-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);