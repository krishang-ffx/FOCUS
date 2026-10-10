import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { TimerSession, TimerCategory } from '@/types/timer';
import {
  getLocalTimers,
  persistSession,
  removeLocalTimer,
  makeSession,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  completeTimer,
  resetTimer,
  editSession,
  duplicateSession,
  computeRemainingMs,
} from '@/lib/timerEngine';
import { playCompletionSound } from '@/lib/sound';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase';

interface TimerContextValue {
  timers: TimerSession[];
  now: number;
  createTimer: (name: string, durationMs: number, note?: string, category?: TimerCategory) => Promise<string>;
  start: (id: string) => Promise<void>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  stop: (id: string, note?: string) => Promise<void>;
  reset: (id: string) => Promise<void>;
  editTimer: (id: string, changes: { name?: string; planned_duration_ms?: number; note?: string; category?: TimerCategory }) => Promise<void>;
  duplicate: (id: string) => Promise<string | null>;
  remove: (id: string) => Promise<void>;
  deleteFinished: () => Promise<void>;
  deleteAll: () => Promise<void>;
  getRemaining: (id: string) => number;
  refreshFromLocal: () => void;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [timers, setTimers] = useState<TimerSession[]>([]);
  const [now, setNow] = useState(Date.now());
  const timersRef = useRef<Record<string, TimerSession>>({});

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshFromLocal = useCallback(() => {
    const local = getLocalTimers();
    timersRef.current = Object.fromEntries(local.map((t) => [t.id, t]));
    setTimers(local);
  }, []);

  useEffect(() => {
    refreshFromLocal();
  }, [user, refreshFromLocal]);

  useEffect(() => {
    for (const t of timers) {
      if (t.status === 'running') {
        const remaining = computeRemainingMs(t, now);
        if (remaining <= 0) {
          const completed = completeTimer(t);
          timersRef.current[completed.id] = completed;
          persistSession(completed);
          playCompletionSound(settings.soundEnabled);
          setTimers(Object.values(timersRef.current));
        }
      }
    }
  }, [now, timers, settings.soundEnabled]);

  const updateAndPersist = useCallback(async (updated: TimerSession) => {
    timersRef.current[updated.id] = updated;
    setTimers(Object.values({ ...timersRef.current }));
    await persistSession(updated);
  }, []);

  const createTimer = useCallback(
    async (name: string, durationMs: number, note?: string, category?: TimerCategory): Promise<string> => {
      const id = crypto.randomUUID();
      const session = makeSession(id, user?.id ?? '', name, durationMs, note, category);
      timersRef.current[id] = session;
      setTimers(Object.values({ ...timersRef.current }));
      await persistSession(session);
      return id;
    },
    [user]
  );

  const start = useCallback(
    async (id: string) => {
      const t = timersRef.current[id];
      if (!t || t.status !== 'created') return;
      await updateAndPersist(startTimer(t));
    },
    [updateAndPersist]
  );

  const pause = useCallback(
    async (id: string) => {
      const t = timersRef.current[id];
      if (!t || t.status !== 'running') return;
      await updateAndPersist(pauseTimer(t));
    },
    [updateAndPersist]
  );

  const resume = useCallback(
    async (id: string) => {
      const t = timersRef.current[id];
      if (!t || t.status !== 'paused') return;
      await updateAndPersist(resumeTimer(t));
    },
    [updateAndPersist]
  );

  const stop = useCallback(
    async (id: string, note?: string) => {
      const t = timersRef.current[id];
      if (!t || t.status === 'created' || t.status === 'stopped') return;
      await updateAndPersist(stopTimer(t, note));
    },
    [updateAndPersist]
  );

  const reset = useCallback(
    async (id: string) => {
      const t = timersRef.current[id];
      if (!t) return;
      await updateAndPersist(resetTimer(t));
    },
    [updateAndPersist]
  );

  const editTimer = useCallback(
    async (id: string, changes: { name?: string; planned_duration_ms?: number; note?: string; category?: TimerCategory }) => {
      const t = timersRef.current[id];
      if (!t) return;
      await updateAndPersist(editSession(t, changes));
    },
    [updateAndPersist]
  );

  const duplicate = useCallback(
    async (id: string): Promise<string | null> => {
      const t = timersRef.current[id];
      if (!t) return null;
      const newId = crypto.randomUUID();
      const copy = duplicateSession(t, newId);
      timersRef.current[newId] = copy;
      setTimers(Object.values({ ...timersRef.current }));
      await persistSession(copy);
      return newId;
    },
    []
  );

  const remove = useCallback(
    async (id: string) => {
      delete timersRef.current[id];
      setTimers(Object.values({ ...timersRef.current }));
      removeLocalTimer(id);
      try {
        await supabase.from('timer_sessions').delete().eq('id', id);
      } catch {
        // ignore
      }
    },
    []
  );

  const deleteFinished = useCallback(async () => {
    const toDelete = Object.values(timersRef.current).filter(
      (t) => t.status === 'completed' || t.status === 'stopped'
    );
    const ids = toDelete.map((t) => t.id);
    for (const id of ids) {
      delete timersRef.current[id];
      removeLocalTimer(id);
    }
    setTimers(Object.values({ ...timersRef.current }));
    if (ids.length > 0) {
      try {
        await supabase.from('timer_sessions').delete().in('id', ids);
      } catch {
        // ignore
      }
    }
  }, []);

  const deleteAll = useCallback(async () => {
    const ids = Object.keys(timersRef.current);
    timersRef.current = {};
    setTimers([]);
    for (const id of ids) {
      removeLocalTimer(id);
    }
    if (ids.length > 0) {
      try {
        await supabase.from('timer_sessions').delete().in('id', ids);
      } catch {
        // ignore
      }
    }
  }, []);

  const getRemaining = useCallback(
    (id: string): number => {
      const t = timersRef.current[id];
      if (!t) return 0;
      return computeRemainingMs(t, now);
    },
    [now]
  );

  return (
    <TimerContext.Provider
      value={{
        timers,
        now,
        createTimer,
        start,
        pause,
        resume,
        stop,
        reset,
        editTimer,
        duplicate,
        remove,
        deleteFinished,
        deleteAll,
        getRemaining,
        refreshFromLocal,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimers(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimers must be used within TimerProvider');
  return ctx;
}
