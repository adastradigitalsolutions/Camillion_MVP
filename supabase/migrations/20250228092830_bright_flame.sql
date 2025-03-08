/*
  # Create weight logs table

  1. New Tables
    - `weight_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `weight` (decimal, not null)
      - `log_date` (date, not null)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `weight_logs` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  weight decimal NOT NULL,
  log_date date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT weight_positive CHECK (weight > 0)
);

-- Create unique constraint to ensure only one weight entry per user per day
CREATE UNIQUE INDEX IF NOT EXISTS weight_logs_user_date_idx ON weight_logs (user_id, log_date);

-- Enable Row Level Security
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own weight logs"
  ON weight_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own weight logs"
  ON weight_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs"
  ON weight_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs"
  ON weight_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);