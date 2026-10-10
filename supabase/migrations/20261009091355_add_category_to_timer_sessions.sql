/*
# Add category column to timer_sessions

## Purpose
Adds an optional category field so users can classify timers (Study, Gaming, Break, Workout, Other).
Existing rows are unaffected — the column defaults to NULL and existing timers continue to work.

## 1. Changes
### timer_sessions
- Added `category` (text, nullable) — one of: 'study', 'gaming', 'break', 'workout', 'other', or NULL
- CHECK constraint enforces valid category values

## 2. Security
- No RLS changes needed — existing policies already cover the new column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timer_sessions' AND column_name = 'category'
  ) THEN
    ALTER TABLE timer_sessions ADD COLUMN category text CHECK (category IN ('study','gaming','break','workout','other'));
  END IF;
END $$;
