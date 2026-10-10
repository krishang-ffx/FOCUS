/*
# Create timer_sessions table for the Clock + Timer + Time Tracking app

## Purpose
Stores every timer session the user creates. Each row records the full lifecycle of a timer:
its planned duration, start/pause/resume/stop events, activity note, and computed durations.
All data is scoped to the authenticated user so users never see another user's records.

## 1. New Tables

### timer_sessions
- `id` (uuid, PK) — unique session identifier
- `user_id` (uuid, NOT NULL, DEFAULT auth.uid()) — owner, cascades on user deletion
- `name` (text, NOT NULL) — custom timer name, e.g. "Study"
- `note` (text, nullable) — optional "What did you do?" activity entry
- `status` (text, NOT NULL, default 'created') — one of: created, running, paused, completed, stopped
- `planned_duration_ms` (bigint, NOT NULL) — user-set duration in milliseconds
- `started_at` (timestamptz, nullable) — wall-clock time the timer was first started
- `ended_at` (timestamptz, nullable) — wall-clock time the timer was completed or stopped
- `expected_end_at` (timestamptz, nullable) — started_at + planned_duration_ms
- `paused_at` (timestamptz, nullable) — timestamp of the most recent pause (null when running)
- `resumed_at` (timestamptz, nullable) — timestamp of the most recent resume (set on resume)
- `pause_count` (int, NOT NULL, default 0) — number of pauses in this session
- `total_paused_ms` (bigint, NOT NULL, default 0) — cumulative paused duration in ms
- `active_ms` (bigint, NOT NULL, default 0) — total active/running duration in ms (final on completion)
- `events` (jsonb, NOT NULL, default '[]') — array of pause/resume/stop events for timeline:
    each element: { type: 'pause'|'resume'|'stop'|'complete', at: ISO string }
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now()) — bumped on every update

## 2. Indexes
- `idx_timer_sessions_user_id` — fast per-user queries
- `idx_timer_sessions_user_status` — filtering active sessions
- `idx_timer_sessions_user_started` — history sorting by start date

## 3. Security (RLS)
- RLS enabled on timer_sessions.
- Owner-scoped CRUD: authenticated users can only SELECT, INSERT, UPDATE, DELETE rows
  where `user_id = auth.uid()`.
- `user_id` defaults to `auth.uid()` so frontend inserts that omit user_id succeed.
- No anon access — this app requires sign-in.
*/

CREATE TABLE IF NOT EXISTS timer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','running','paused','completed','stopped')),
  planned_duration_ms bigint NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  expected_end_at timestamptz,
  paused_at timestamptz,
  resumed_at timestamptz,
  pause_count int NOT NULL DEFAULT 0,
  total_paused_ms bigint NOT NULL DEFAULT 0,
  active_ms bigint NOT NULL DEFAULT 0,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_status ON timer_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_started ON timer_sessions(user_id, started_at DESC);

ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_timer_sessions" ON timer_sessions;
CREATE POLICY "select_own_timer_sessions"
  ON timer_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_timer_sessions" ON timer_sessions;
CREATE POLICY "insert_own_timer_sessions"
  ON timer_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_timer_sessions" ON timer_sessions;
CREATE POLICY "update_own_timer_sessions"
  ON timer_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_timer_sessions" ON timer_sessions;
CREATE POLICY "delete_own_timer_sessions"
  ON timer_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
