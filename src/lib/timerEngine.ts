import type { TimerSession, TimerStatus, TimerEvent, TimerCategory } from '@/types/timer';
import { supabase } from '@/lib/supabase';

const LOCAL_KEY = 'chrono-timers';

export function computeActiveMs(session: TimerSession, now: number = Date.now()): number {
  if (!session.started_at) return 0;

  let active = session.active_ms;

  if (session.status === 'running') {
    const refPoint = session.resumed_at ?? session.started_at;
    active += now - new Date(refPoint).getTime();
  }

  return active;
}

export function computeRemainingMs(session: TimerSession, now: number = Date.now()): number {
  if (session.status === 'completed' || session.status === 'stopped' || session.status === 'created') {
    return session.planned_duration_ms;
  }
  const active = computeActiveMs(session, now);
  return Math.max(0, session.planned_duration_ms - active);
}

export function computePausedMs(session: TimerSession, now: number = Date.now()): number {
  let paused = session.total_paused_ms;
  if (session.status === 'paused' && session.paused_at) {
    paused += now - new Date(session.paused_at).getTime();
  }
  return paused;
}

function loadLocal(): Record<string, TimerSession> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLocal(timers: Record<string, TimerSession>) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(timers));
  } catch {
    // ignore
  }
}

export function getLocalTimers(): TimerSession[] {
  return Object.values(loadLocal());
}

export function clearLocalTimers() {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    // ignore
  }
}

export async function persistSession(session: TimerSession): Promise<void> {
  const local = loadLocal();
  local[session.id] = session;
  saveLocal(local);

  try {
    await supabase.from('timer_sessions').upsert({
      id: session.id,
      name: session.name,
      note: session.note,
      category: session.category,
      status: session.status,
      planned_duration_ms: session.planned_duration_ms,
      started_at: session.started_at,
      ended_at: session.ended_at,
      expected_end_at: session.expected_end_at,
      paused_at: session.paused_at,
      resumed_at: session.resumed_at,
      pause_count: session.pause_count,
      total_paused_ms: session.total_paused_ms,
      active_ms: session.active_ms,
      events: session.events,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Network errors are non-fatal — local state is preserved
  }
}

export function removeLocalTimer(id: string) {
  const local = loadLocal();
  delete local[id];
  saveLocal(local);
}

export function makeSession(
  id: string,
  userId: string,
  name: string,
  plannedDurationMs: number,
  note?: string,
  category?: TimerCategory
): TimerSession {
  const now = new Date().toISOString();
  return {
    id,
    user_id: userId,
    name,
    note: note ?? null,
    category: category ?? null,
    status: 'created',
    planned_duration_ms: plannedDurationMs,
    started_at: null,
    ended_at: null,
    expected_end_at: null,
    paused_at: null,
    resumed_at: null,
    pause_count: 0,
    total_paused_ms: 0,
    active_ms: 0,
    events: [],
    created_at: now,
    updated_at: now,
  };
}

export function startTimer(session: TimerSession): TimerSession {
  const now = new Date();
  const nowIso = now.toISOString();
  const expectedEnd = new Date(now.getTime() + session.planned_duration_ms).toISOString();
  return {
    ...session,
    status: 'running' as TimerStatus,
    started_at: nowIso,
    resumed_at: nowIso,
    paused_at: null,
    ended_at: null,
    expected_end_at: expectedEnd,
    active_ms: 0,
    updated_at: nowIso,
  };
}

export function pauseTimer(session: TimerSession): TimerSession {
  if (session.status !== 'running' || !session.started_at) return session;
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  const refPoint = session.resumed_at ?? session.started_at;
  const addedActive = nowMs - new Date(refPoint).getTime();

  const event: TimerEvent = { type: 'pause', at: nowIso };
  return {
    ...session,
    status: 'paused' as TimerStatus,
    paused_at: nowIso,
    resumed_at: null,
    active_ms: session.active_ms + addedActive,
    pause_count: session.pause_count + 1,
    events: [...session.events, event],
    updated_at: nowIso,
  };
}

export function resumeTimer(session: TimerSession): TimerSession {
  if (session.status !== 'paused') return session;
  const now = new Date();
  const nowIso = now.toISOString();

  let addedPaused = 0;
  if (session.paused_at) {
    addedPaused = now.getTime() - new Date(session.paused_at).getTime();
  }

  const event: TimerEvent = { type: 'resume', at: nowIso };
  return {
    ...session,
    status: 'running' as TimerStatus,
    resumed_at: nowIso,
    paused_at: null,
    total_paused_ms: session.total_paused_ms + addedPaused,
    events: [...session.events, event],
    updated_at: nowIso,
  };
}

export function stopTimer(session: TimerSession, finalNote?: string): TimerSession {
  if (session.status === 'created' || session.status === 'stopped') return session;
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  let activeMs = session.active_ms;
  let totalPaused = session.total_paused_ms;

  if (session.status === 'running') {
    const refPoint = session.resumed_at ?? session.started_at!;
    activeMs += nowMs - new Date(refPoint).getTime();
  } else if (session.status === 'paused' && session.paused_at) {
    totalPaused += nowMs - new Date(session.paused_at).getTime();
  }

  const event: TimerEvent = { type: 'stop', at: nowIso };
  return {
    ...session,
    status: 'stopped' as TimerStatus,
    ended_at: nowIso,
    paused_at: null,
    resumed_at: null,
    active_ms: activeMs,
    total_paused_ms: totalPaused,
    note: finalNote ?? session.note,
    events: [...session.events, event],
    updated_at: nowIso,
  };
}

export function completeTimer(session: TimerSession): TimerSession {
  if (session.status === 'completed') return session;
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  let activeMs = session.active_ms;
  let totalPaused = session.total_paused_ms;

  if (session.status === 'running') {
    const refPoint = session.resumed_at ?? session.started_at!;
    activeMs += nowMs - new Date(refPoint).getTime();
  } else if (session.status === 'paused' && session.paused_at) {
    totalPaused += nowMs - new Date(session.paused_at).getTime();
  }

  const event: TimerEvent = { type: 'complete', at: nowIso };
  return {
    ...session,
    status: 'completed' as TimerStatus,
    ended_at: nowIso,
    paused_at: null,
    resumed_at: null,
    active_ms: activeMs,
    total_paused_ms: totalPaused,
    events: [...session.events, event],
    updated_at: nowIso,
  };
}

export function editSession(
  session: TimerSession,
  changes: { name?: string; planned_duration_ms?: number; note?: string; category?: TimerCategory }
): TimerSession {
  return {
    ...session,
    name: changes.name ?? session.name,
    planned_duration_ms: changes.planned_duration_ms ?? session.planned_duration_ms,
    note: changes.note !== undefined ? (changes.note.trim() || null) : session.note,
    category: changes.category !== undefined ? (changes.category || null) : session.category,
    updated_at: new Date().toISOString(),
  };
}

export function duplicateSession(session: TimerSession, newId: string): TimerSession {
  const now = new Date().toISOString();
  return {
    ...session,
    id: newId,
    name: `${session.name} (Copy)`,
    status: 'created' as TimerStatus,
    started_at: null,
    ended_at: null,
    expected_end_at: null,
    paused_at: null,
    resumed_at: null,
    pause_count: 0,
    total_paused_ms: 0,
    active_ms: 0,
    events: [],
    created_at: now,
    updated_at: now,
  };
}

export function resetTimer(session: TimerSession): TimerSession {
  return {
    ...session,
    status: 'created' as TimerStatus,
    started_at: null,
    ended_at: null,
    expected_end_at: null,
    paused_at: null,
    resumed_at: null,
    pause_count: 0,
    total_paused_ms: 0,
    active_ms: 0,
    events: [],
    updated_at: new Date().toISOString(),
  };
}
