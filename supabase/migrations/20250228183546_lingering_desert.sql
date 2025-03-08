/*
  # Create completed workouts tracking

  1. New Tables
    - `completed_workouts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (uuid, references training_sessions)
      - `completed_date` (date)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `completed_workouts` table
    - Add policies for authenticated users to manage their own data
*/

-- Create completed_workouts table
CREATE TABLE IF NOT EXISTS completed_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  session_id uuid REFERENCES training_sessions(id) NOT NULL,
  completed_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS completed_workouts_user_date_idx ON completed_workouts (user_id, completed_date);

-- Enable Row Level Security
ALTER TABLE completed_workouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own completed workouts"
  ON completed_workouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed workouts"
  ON completed_workouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed workouts"
  ON completed_workouts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed workouts"
  ON completed_workouts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);