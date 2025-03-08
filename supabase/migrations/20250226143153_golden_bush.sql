/*
  # Create onboarding responses table

  1. New Tables
    - `onboarding_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `date_of_birth` (date)
      - `weight` (decimal)
      - `height` (decimal)
      - `job_type` (text)
      - `lifestyle` (text)
      - `training_experience_months` (integer)
      - `training_type` (text)
      - `preferred_training_days` (integer)
      - `medical_conditions` (text)
      - `medications` (text)
      - `joint_pain` (text)
      - `past_surgeries` (text)
      - `diet_description` (text)
      - `supplements` (text)
      - `food_intolerances` (text)
      - `alcohol_consumption` (text)
      - `menstrual_cycle` (text)
      - `goals` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `onboarding_responses` table
    - Add policies for:
      - Users can insert their own responses
      - Users can read only their own responses
      - Users can update their own responses
      - Users cannot delete responses

  3. Triggers
    - Add trigger to automatically update `updated_at` timestamp
*/

-- Create onboarding_responses table
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  weight decimal NOT NULL,
  height decimal NOT NULL,
  job_type text NOT NULL,
  lifestyle text NOT NULL,
  training_experience_months integer,
  training_type text,
  preferred_training_days integer NOT NULL,
  medical_conditions text,
  medications text,
  joint_pain text,
  past_surgeries text,
  diet_description text,
  supplements text,
  food_intolerances text,
  alcohol_consumption text NOT NULL,
  menstrual_cycle text,
  goals text[] NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT weight_positive CHECK (weight > 0),
  CONSTRAINT height_positive CHECK (height > 0),
  CONSTRAINT training_days_range CHECK (preferred_training_days BETWEEN 2 AND 7)
);

-- Enable Row Level Security
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own responses"
  ON onboarding_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own responses"
  ON onboarding_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON onboarding_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_onboarding_responses_updated_at
  BEFORE UPDATE
  ON onboarding_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();