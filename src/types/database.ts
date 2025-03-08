export interface MuscleGroup {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  video_url: string;
  image_url: string;
  muscle_group_id: string;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  log_date: string;
  created_at: string;
}

export interface TrainingProgram {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_weeks: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  program_id: string;
  name: string;
  day_of_week: number;
  order_index: number;
  created_at: string;
}

export interface TrainingExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  order_index: number;
  created_at: string;
  // Joined fields
  exercise?: Exercise;
}

export interface ExerciseParameter {
  id: string;
  training_exercise_id: string;
  week_number: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  tempo: string;
  weight: number | null;
  notes: string | null;
  created_at: string;
}

export interface CompletedWorkout {
  id: string;
  user_id: string;
  session_id: string;
  completed_date: string;
  created_at: string;
  // Joined fields
  session?: TrainingSession;
}

export interface ViewedExercise {
  id: string;
  user_id: string;
  muscle_group_id: string;
  exercise_id: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  created_at: string;
}

export interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithDetails {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  subscription?: {
    subscription_type: string;
    end_date: string;
  };
  program?: {
    name: string;
    end_date: string;
  };
}