/*
  # Add image_url to exercises table

  1. Changes
    - Add `image_url` column to the `exercises` table
    - Update existing exercises with placeholder image URLs
*/

-- Add image_url column to exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image_url text;

-- Update existing exercises with placeholder image URLs
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Bench Press';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1534368786749-b63e05c92392?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Incline Dumbbell Press';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Push-ups';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Pull-ups';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Bent Over Rows';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Lat Pulldowns';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Squats';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Lunges';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Leg Press';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Overhead Press';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Lateral Raises';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Bicep Curls';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1530822847156-e092cb0bc490?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Tricep Pushdowns';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Crunches';
UPDATE exercises SET image_url = 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?q=80&w=2940&auto=format&fit=crop' WHERE title = 'Plank';

-- Make image_url NOT NULL after updating existing records
ALTER TABLE exercises ALTER COLUMN image_url SET NOT NULL;