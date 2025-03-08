/*
  # Create user subscriptions table

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `subscription_type` (text) - Free, Level1, Level2, Level3
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `payment_method` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_subscriptions` table
    - Add policies for authenticated users to:
      - Read their own subscription data
      - Insert their own subscription data
      - Update their own subscription data

  3. Constraints
    - Foreign key to auth.users
    - Check constraint for valid subscription types
    - End date must be after start date
*/

-- Create enum for subscription types
CREATE TYPE subscription_type AS ENUM ('Free', 'Level1', 'Level2', 'Level3');

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  subscription_type subscription_type NOT NULL DEFAULT 'Free',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  payment_method text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT end_date_after_start_date CHECK (end_date > start_date)
);

-- Enable Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE
  ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- Insert default Free subscription for existing users
DO $$
BEGIN
  INSERT INTO user_subscriptions (user_id, subscription_type)
  SELECT id, 'Free'
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM user_subscriptions);
END $$;