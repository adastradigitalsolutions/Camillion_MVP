/*
  # Training Programs Schema

  1. New Tables
    - `training_programs` - Stores the main program information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `total_weeks` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `training_sessions` - Stores individual training sessions within a program
      - `id` (uuid, primary key)
      - `program_id` (uuid, references training_programs)
      - `name` (text)
      - `day_of_week` (integer)
      - `order_index` (integer)
      - `created_at` (timestamptz)
    
    - `training_exercises` - Stores exercises within a training session
      - `id` (uuid, primary key)
      - `session_id` (uuid, references training_sessions)
      - `exercise_id` (uuid, references exercises)
      - `order_index` (integer)
      - `created_at` (timestamptz)
    
    - `exercise_parameters` - Stores weekly parameters for each exercise
      - `id` (uuid, primary key)
      - `training_exercise_id` (uuid, references training_exercises)
      - `week_number` (integer)
      - `sets` (integer)
      - `reps` (text)
      - `rest_seconds` (integer)
      - `tempo` (text)
      - `weight` (decimal)
      - `notes` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
*/

-- Create training_programs table
CREATE TABLE IF NOT EXISTS training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_weeks integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT end_date_after_start_date CHECK (end_date > start_date),
  CONSTRAINT total_weeks_positive CHECK (total_weeks > 0)
);

-- Create training_sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES training_programs(id) NOT NULL,
  name text NOT NULL,
  day_of_week integer NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT day_of_week_range CHECK (day_of_week BETWEEN 0 AND 6)
);

-- Create training_exercises table
CREATE TABLE IF NOT EXISTS training_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) NOT NULL,
  exercise_id uuid REFERENCES exercises(id) NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create exercise_parameters table
CREATE TABLE IF NOT EXISTS exercise_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_exercise_id uuid REFERENCES training_exercises(id) NOT NULL,
  week_number integer NOT NULL,
  sets integer NOT NULL,
  reps text NOT NULL,
  rest_seconds integer NOT NULL,
  tempo text NOT NULL,
  weight decimal,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT week_number_positive CHECK (week_number > 0),
  CONSTRAINT sets_positive CHECK (sets > 0),
  CONSTRAINT rest_seconds_positive CHECK (rest_seconds > 0)
);

-- Enable Row Level Security
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_parameters ENABLE ROW LEVEL SECURITY;

-- Create policies for training_programs
CREATE POLICY "Users can read their own training programs"
  ON training_programs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training programs"
  ON training_programs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training programs"
  ON training_programs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for training_sessions
CREATE POLICY "Users can read their own training sessions"
  ON training_sessions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_programs
    WHERE training_programs.id = training_sessions.program_id
    AND training_programs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own training sessions"
  ON training_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_programs
    WHERE training_programs.id = training_sessions.program_id
    AND training_programs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own training sessions"
  ON training_sessions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_programs
    WHERE training_programs.id = training_sessions.program_id
    AND training_programs.user_id = auth.uid()
  ));

-- Create policies for training_exercises
CREATE POLICY "Users can read their own training exercises"
  ON training_exercises
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_sessions
    JOIN training_programs ON training_programs.id = training_sessions.program_id
    WHERE training_sessions.id = training_exercises.session_id
    AND training_programs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own training exercises"
  ON training_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_sessions
    JOIN training_programs ON training_programs.id = training_sessions.program_id
    WHERE training_sessions.id = training_exercises.session_id
    AND training_programs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own training exercises"
  ON training_exercises
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_sessions
    JOIN training_programs ON training_programs.id = training_sessions.program_id
    WHERE training_sessions.id = training_exercises.session_id
    AND training_programs.user_id = auth.uid()
  ));

-- Create policies for exercise_parameters
CREATE POLICY "Users can read their own exercise parameters"
  ON exercise_parameters
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_exercises
    JOIN training_sessions ON training_sessions.id = training_exercises.session_id
    JOIN training_programs ON training_programs.id = training_sessions.program_id
    WHERE training_exercises.id = exercise_parameters.training_exercise_id
    AND training_programs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own exercise parameters"
  ON exercise_parameters
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_exercises
    JOIN training_sessions ON training_sessions.id = training_exercises.session_id
    JOIN training_programs ON training_programs.id = training_sessions.program_id
    WHERE training_exercises.id = exercise_parameters.training_exercise_id
    AND training_programs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own exercise parameters"
  ON exercise_parameters
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_exercises
    JOIN training_sessions ON training_sessions.id = training_exercises.session_id
    JOIN training_programs ON training_programs.id = training_sessions.program_id
    WHERE training_exercises.id = exercise_parameters.training_exercise_id
    AND training_programs.user_id = auth.uid()
  ));

-- Create updated_at trigger for training_programs
CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE
  ON training_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for a demo user
DO $$
DECLARE
  demo_user_id uuid;
  program_id uuid;
  session_a_id uuid;
  session_b_id uuid;
  bench_press_id uuid;
  squat_id uuid;
  pullup_id uuid;
  training_bench_id uuid;
  training_squat_id uuid;
  training_pullup_id uuid;
BEGIN
  -- Get a demo user ID (first user in the system)
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
  
  IF demo_user_id IS NOT NULL THEN
    -- Create a training program
    INSERT INTO training_programs (user_id, name, start_date, end_date, total_weeks)
    VALUES (demo_user_id, 'Strength Building Program', CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '10 weeks', 12)
    RETURNING id INTO program_id;
    
    -- Create training sessions
    INSERT INTO training_sessions (program_id, name, day_of_week, order_index)
    VALUES (program_id, 'Training A', 1, 1) -- Monday
    RETURNING id INTO session_a_id;
    
    INSERT INTO training_sessions (program_id, name, day_of_week, order_index)
    VALUES (program_id, 'Training B', 3, 2) -- Wednesday
    RETURNING id INTO session_b_id;
    
    -- Get exercise IDs
    SELECT id INTO bench_press_id FROM exercises WHERE title = 'Bench Press' LIMIT 1;
    SELECT id INTO squat_id FROM exercises WHERE title = 'Squats' LIMIT 1;
    SELECT id INTO pullup_id FROM exercises WHERE title = 'Pull-ups' LIMIT 1;
    
    IF bench_press_id IS NOT NULL AND squat_id IS NOT NULL AND pullup_id IS NOT NULL THEN
      -- Create training exercises
      INSERT INTO training_exercises (session_id, exercise_id, order_index)
      VALUES (session_a_id, bench_press_id, 1)
      RETURNING id INTO training_bench_id;
      
      INSERT INTO training_exercises (session_id, exercise_id, order_index)
      VALUES (session_a_id, squat_id, 2)
      RETURNING id INTO training_squat_id;
      
      INSERT INTO training_exercises (session_id, exercise_id, order_index)
      VALUES (session_b_id, pullup_id, 1)
      RETURNING id INTO training_pullup_id;
      
      -- Create exercise parameters for each week
      -- Week 1
      INSERT INTO exercise_parameters (training_exercise_id, week_number, sets, reps, rest_seconds, tempo, weight, notes)
      VALUES 
        (training_bench_id, 1, 3, '8-10', 90, '2-1-2', 60, 'Focus on form'),
        (training_squat_id, 1, 3, '10-12', 120, '2-1-2', 80, 'Keep core tight'),
        (training_pullup_id, 1, 3, '6-8', 90, '2-1-2', NULL, 'Use assistance if needed');
      
      -- Week 2
      INSERT INTO exercise_parameters (training_exercise_id, week_number, sets, reps, rest_seconds, tempo, weight, notes)
      VALUES 
        (training_bench_id, 2, 4, '8-10', 90, '2-1-2', 65, 'Increase weight from last week'),
        (training_squat_id, 2, 4, '10-12', 120, '2-1-2', 85, 'Focus on depth'),
        (training_pullup_id, 2, 4, '6-8', 90, '2-1-2', NULL, 'Try to reduce assistance');
      
      -- Week 3
      INSERT INTO exercise_parameters (training_exercise_id, week_number, sets, reps, rest_seconds, tempo, weight, notes)
      VALUES 
        (training_bench_id, 3, 4, '6-8', 120, '3-1-1', 70, 'Heavier weight, fewer reps'),
        (training_squat_id, 3, 4, '8-10', 120, '3-1-1', 90, 'Increase weight'),
        (training_pullup_id, 3, 4, '5-7', 120, '3-1-1', NULL, 'Focus on full range of motion');
      
      -- Week 4
      INSERT INTO exercise_parameters (training_exercise_id, week_number, sets, reps, rest_seconds, tempo, weight, notes)
      VALUES 
        (training_bench_id, 4, 3, '12-15', 60, '1-0-1', 55, 'Deload week - lighter weight, higher reps'),
        (training_squat_id, 4, 3, '12-15', 60, '1-0-1', 70, 'Deload week - focus on recovery'),
        (training_pullup_id, 4, 3, '8-10', 60, '1-0-1', NULL, 'Deload week - use more assistance if needed');
      
      -- Weeks 5-12 (similar pattern with progressive overload)
      FOR week_num IN 5..12 LOOP
        INSERT INTO exercise_parameters (training_exercise_id, week_number, sets, reps, rest_seconds, tempo, weight, notes)
        VALUES 
          (training_bench_id, week_num, 
           CASE WHEN week_num % 4 = 0 THEN 3 ELSE 4 END, 
           CASE 
             WHEN week_num % 4 = 1 THEN '8-10'
             WHEN week_num % 4 = 2 THEN '6-8'
             WHEN week_num % 4 = 3 THEN '4-6'
             ELSE '12-15'
           END, 
           CASE WHEN week_num % 4 = 0 THEN 60 ELSE 90 + (week_num % 4) * 10 END,
           CASE 
             WHEN week_num % 4 = 0 THEN '1-0-1'
             ELSE (week_num % 4 + 1)::text || '-1-1'
           END,
           CASE 
             WHEN week_num % 4 = 0 THEN 55 + (FLOOR(week_num / 4) * 5)
             ELSE 60 + (week_num * 2)
           END,
           CASE 
             WHEN week_num % 4 = 0 THEN 'Deload week ' || FLOOR(week_num / 4)::text
             ELSE 'Progressive overload - week ' || week_num::text
           END),
          
          (training_squat_id, week_num, 
           CASE WHEN week_num % 4 = 0 THEN 3 ELSE 4 END, 
           CASE 
             WHEN week_num % 4 = 1 THEN '10-12'
             WHEN week_num % 4 = 2 THEN '8-10'
             WHEN week_num % 4 = 3 THEN '6-8'
             ELSE '12-15'
           END, 
           CASE WHEN week_num % 4 = 0 THEN 60 ELSE 120 END,
           CASE 
             WHEN week_num % 4 = 0 THEN '1-0-1'
             ELSE (week_num % 4 + 1)::text || '-1-1'
           END,
           CASE 
             WHEN week_num % 4 = 0 THEN 70 + (FLOOR(week_num / 4) * 5)
             ELSE 80 + (week_num * 2)
           END,
           CASE 
             WHEN week_num % 4 = 0 THEN 'Deload week ' || FLOOR(week_num / 4)::text
             ELSE 'Progressive overload - week ' || week_num::text
           END),
          
          (training_pullup_id, week_num, 
           CASE WHEN week_num % 4 = 0 THEN 3 ELSE 4 END, 
           CASE 
             WHEN week_num % 4 = 1 THEN '6-8'
             WHEN week_num % 4 = 2 THEN '5-7'
             WHEN week_num % 4 = 3 THEN '4-6'
             ELSE '8-10'
           END, 
           CASE WHEN week_num % 4 = 0 THEN 60 ELSE 90 + (week_num % 4) * 10 END,
           CASE 
             WHEN week_num % 4 = 0 THEN '1-0-1'
             ELSE (week_num % 4 + 1)::text || '-1-1'
           END,
           NULL,
           CASE 
             WHEN week_num % 4 = 0 THEN 'Deload week ' || FLOOR(week_num / 4)::text
             ELSE 'Progressive overload - week ' || week_num::text
           END);
      END LOOP;
    END IF;
  END IF;
END $$;