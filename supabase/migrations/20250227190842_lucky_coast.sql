/*
  # Create muscle groups and exercises tables

  1. New Tables
    - `muscle_groups`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `image_url` (text, not null)
      - `created_at` (timestamp with time zone)
    - `exercises`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `video_url` (text, not null)
      - `muscle_group_id` (uuid, foreign key to muscle_groups)
      - `created_at` (timestamp with time zone)
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read data
*/

-- Create muscle_groups table
CREATE TABLE IF NOT EXISTS muscle_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  video_url text NOT NULL,
  muscle_group_id uuid REFERENCES muscle_groups(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for muscle_groups
CREATE POLICY "Anyone can read muscle groups"
  ON muscle_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for exercises
CREATE POLICY "Anyone can read exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample data for muscle groups
INSERT INTO muscle_groups (name, image_url)
VALUES 
  ('Chest', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop'),
  ('Back', 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?q=80&w=2940&auto=format&fit=crop'),
  ('Legs', 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?q=80&w=2940&auto=format&fit=crop'),
  ('Shoulders', 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=2940&auto=format&fit=crop'),
  ('Arms', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2940&auto=format&fit=crop'),
  ('Core', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop');

-- Insert sample data for exercises
INSERT INTO exercises (title, description, video_url, muscle_group_id)
VALUES 
  ('Bench Press', 'A compound exercise that works the chest, shoulders, and triceps.', 'https://www.youtube.com/embed/rT7DgCr-3pg', (SELECT id FROM muscle_groups WHERE name = 'Chest')),
  ('Incline Dumbbell Press', 'Targets the upper chest while also engaging the shoulders and triceps.', 'https://www.youtube.com/embed/8iPEnn-ltC8', (SELECT id FROM muscle_groups WHERE name = 'Chest')),
  ('Push-ups', 'A bodyweight exercise that targets the chest, shoulders, and triceps.', 'https://www.youtube.com/embed/IODxDxX7oi4', (SELECT id FROM muscle_groups WHERE name = 'Chest')),
  
  ('Pull-ups', 'A compound exercise that targets the entire back, biceps, and core.', 'https://www.youtube.com/embed/eGo4IYlbE5g', (SELECT id FROM muscle_groups WHERE name = 'Back')),
  ('Bent Over Rows', 'A compound exercise that targets the middle back, lats, and biceps.', 'https://www.youtube.com/embed/9efgcAjQe7E', (SELECT id FROM muscle_groups WHERE name = 'Back')),
  ('Lat Pulldowns', 'An exercise that targets the latissimus dorsi and biceps.', 'https://www.youtube.com/embed/CAwf7n6Luuc', (SELECT id FROM muscle_groups WHERE name = 'Back')),
  
  ('Squats', 'The king of leg exercises, targeting quadriceps, hamstrings, and glutes.', 'https://www.youtube.com/embed/gsNoPYwWXeM', (SELECT id FROM muscle_groups WHERE name = 'Legs')),
  ('Lunges', 'A unilateral exercise that targets the quadriceps, hamstrings, and glutes.', 'https://www.youtube.com/embed/QOVaHwm-Q6U', (SELECT id FROM muscle_groups WHERE name = 'Legs')),
  ('Leg Press', 'A machine exercise that targets the quadriceps, hamstrings, and glutes.', 'https://www.youtube.com/embed/IZxyjW7MPJQ', (SELECT id FROM muscle_groups WHERE name = 'Legs')),
  
  ('Overhead Press', 'A compound exercise that targets the shoulders and triceps.', 'https://www.youtube.com/embed/2yjwXTZQDDI', (SELECT id FROM muscle_groups WHERE name = 'Shoulders')),
  ('Lateral Raises', 'An isolation exercise that targets the lateral deltoids.', 'https://www.youtube.com/embed/3VcKaXpzqRo', (SELECT id FROM muscle_groups WHERE name = 'Shoulders')),
  
  ('Bicep Curls', 'An isolation exercise that targets the biceps.', 'https://www.youtube.com/embed/ykJmrZ5v0Oo', (SELECT id FROM muscle_groups WHERE name = 'Arms')),
  ('Tricep Pushdowns', 'An isolation exercise that targets the triceps.', 'https://www.youtube.com/embed/2-LAMcpzODU', (SELECT id FROM muscle_groups WHERE name = 'Arms')),
  
  ('Crunches', 'An isolation exercise that targets the rectus abdominis.', 'https://www.youtube.com/embed/Xyd_fa5zoEU', (SELECT id FROM muscle_groups WHERE name = 'Core')),
  ('Plank', 'An isometric exercise that targets the entire core.', 'https://www.youtube.com/embed/pSHjTRCQxIw', (SELECT id FROM muscle_groups WHERE name = 'Core'));