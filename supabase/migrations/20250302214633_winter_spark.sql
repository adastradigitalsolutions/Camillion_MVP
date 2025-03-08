/*
  # Create viewed_exercises table

  1. New Tables
    - `viewed_exercises`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `muscle_group_id` (uuid, references muscle_groups)
      - `exercise_id` (uuid, references exercises)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `viewed_exercises` table
    - Add policies for authenticated users to manage their own data
*/

-- Create viewed_exercises table to track which exercises users have viewed
CREATE TABLE IF NOT EXISTS viewed_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  muscle_group_id uuid REFERENCES muscle_groups(id) NOT NULL,
  exercise_id uuid REFERENCES exercises(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create unique constraint to ensure only one record per user per muscle group
CREATE UNIQUE INDEX IF NOT EXISTS viewed_exercises_user_muscle_idx ON viewed_exercises (user_id, muscle_group_id);

-- Enable Row Level Security
ALTER TABLE viewed_exercises ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own viewed exercises"
  ON viewed_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own viewed exercises"
  ON viewed_exercises
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own viewed exercises"
  ON viewed_exercises
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own viewed exercises"
  ON viewed_exercises
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);