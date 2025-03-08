/*
  # Create progress photos table

  1. New Tables
    - `progress_photos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `pose` (text)
      - `photo_url` (text )
      - `check_date` (date)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `progress_photos` table
    - Add policies for authenticated users to manage their own photos
*/

-- Create progress_photos table
CREATE TABLE IF NOT EXISTS progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  pose text NOT NULL,
  photo_url text NOT NULL,
  check_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS progress_photos_user_date_idx ON progress_photos (user_id, check_date);
CREATE INDEX IF NOT EXISTS progress_photos_user_pose_idx ON progress_photos (user_id, pose);

-- Enable Row Level Security
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own progress photos"
  ON progress_photos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress photos"
  ON progress_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress photos"
  ON progress_photos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress photos"
  ON progress_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add gender column to onboarding_responses if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onboarding_responses' AND column_name = 'gender'
  ) THEN
    ALTER TABLE onboarding_responses ADD COLUMN gender text;
  END IF;
END $$;