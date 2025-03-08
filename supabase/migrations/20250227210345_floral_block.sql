/*
  # Add onboarding_completed flag to users

  1. Changes
    - Add `onboarding_completed` boolean column to onboarding_responses table
    - Set default value to false
    - Update existing records to have onboarding_completed = true
*/

-- Add onboarding_completed column to onboarding_responses table
ALTER TABLE onboarding_responses 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Update existing records to have onboarding_completed = true
UPDATE onboarding_responses 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL OR onboarding_completed = false;