/*
# Add timer_id column to timer_sessions

## Purpose
Links a history session record back to its original active timer.
This allows deleting a timer from the active list while preserving
all of its completed session history rows — they remain linked via
timer_id but are no longer dependent on the active timer row existing.

## 1. Changes
### timer_sessions
- Added `timer_id` (uuid, nullable) — the ID of the active timer this
  session was generated from. Nullable so existing rows are unaffected.

## 2. Security
- No RLS changes needed — existing policies already cover the new column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timer_sessions' AND column_name = 'timer_id'
  ) THEN
    ALTER TABLE timer_sessions ADD COLUMN timer_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_timer_sessions_timer_id ON timer_sessions(timer_id);
