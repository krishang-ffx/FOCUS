export type TimerStatus = 'created' | 'running' | 'paused' | 'completed' | 'stopped';

export type TimerCategory = 'study' | 'gaming' | 'break' | 'workout' | 'other';

export const CATEGORIES: { value: TimerCategory; label: string }[] = [
  { value: 'study', label: 'Study' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'break', label: 'Break' },
  { value: 'workout', label: 'Workout' },
  { value: 'other', label: 'Other' },
];

export interface TimerEvent {
  type: 'pause' | 'resume' | 'stop' | 'complete';
  at: string;
}

export interface TimerSession {
  id: string;
  user_id: string;
  name: string;
  note: string | null;
  category: TimerCategory | null;
  status: TimerStatus;
  planned_duration_ms: number;
  started_at: string | null;
  ended_at: string | null;
  expected_end_at: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  pause_count: number;
  total_paused_ms: number;
  active_ms: number;
  events: TimerEvent[];
  created_at: string;
  updated_at: string;
}

export interface TimerDraft {
  name: string;
  planned_duration_ms: number;
  note?: string;
  category?: TimerCategory;
}
