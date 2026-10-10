import { useEffect, useState, useMemo } from 'react';
import { ClockDisplay } from '@/components/ClockDisplay';
import { TimerCard } from '@/components/TimerCard';
import { useTimers } from '@/context/TimerContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Clock, Timer as TimerIcon, TrendingUp, Calendar, Target, Activity } from 'lucide-react';
import type { TabKey } from '@/App';
import type { TimerSession } from '@/types/timer';
import { formatDuration, isSameDay, dateKey } from '@/lib/format';
import { CATEGORIES } from '@/types/timer';

export function HomeScreen({ onNavigate }: { onNavigate: (tab: TabKey) => void }) {
  const { timers } = useTimers();
  const { user } = useAuth();
  const [history, setHistory] = useState<TimerSession[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('timer_sessions')
      .select('*')
      .order('started_at', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        if (data) setHistory(data as TimerSession[]);
        setLoadingStats(false);
      });
  }, [user, timers]);

  const activeTimers = timers.filter(
    (t) => t.status === 'running' || t.status === 'paused'
  );

  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = dateKey(now);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    let todayMs = 0;
    let weekMs = 0;
    let monthMs = 0;
    let sessionCount = 0;
    const categoryMs: Record<string, number> = {};

    for (const s of history) {
      if (s.status !== 'completed' && s.status !== 'stopped') continue;
      if (!s.started_at) continue;

      const started = new Date(s.started_at);
      const ms = s.active_ms;

      if (dateKey(started) === todayKey) todayMs += ms;
      if (started >= weekAgo) weekMs += ms;
      if (started >= monthAgo) monthMs += ms;

      sessionCount++;

      if (s.category) {
        categoryMs[s.category] = (categoryMs[s.category] ?? 0) + ms;
      }
    }

    let topCategory: string | null = null;
    let topMs = 0;
    for (const [cat, ms] of Object.entries(categoryMs)) {
      if (ms > topMs) {
        topMs = ms;
        topCategory = cat;
      }
    }

    const topCategoryLabel = topCategory
      ? CATEGORIES.find((c) => c.value === topCategory)?.label ?? null
      : null;

    return { todayMs, weekMs, monthMs, sessionCount, topCategoryLabel };
  }, [history]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700/50 p-8 shadow-sm">
        <ClockDisplay />
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Statistics
        </h2>
        {loadingStats ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Calendar className="w-4 h-4" />}
              label="Today"
              value={formatDuration(stats.todayMs)}
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="This Week"
              value={formatDuration(stats.weekMs)}
            />
            <StatCard
              icon={<Target className="w-4 h-4" />}
              label="This Month"
              value={formatDuration(stats.monthMs)}
            />
            <StatCard
              icon={<Activity className="w-4 h-4" />}
              label="Sessions"
              value={String(stats.sessionCount)}
            />
          </div>
        )}
        {stats.topCategoryLabel && !loadingStats && (
          <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Most focused on <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.topCategoryLabel}</span>
            </span>
          </div>
        )}
      </div>

      {/* Active Timers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Active Timers
          </h2>
          {activeTimers.length > 0 && (
            <span className="text-xs text-slate-400">
              {activeTimers.length} running
            </span>
          )}
        </div>

        {activeTimers.length === 0 ? (
          <button
            onClick={() => onNavigate('timers')}
            className="w-full flex flex-col items-center gap-3 py-10 bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
              <TimerIcon className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium">No active timers</div>
            <div className="text-xs">Tap to create one</div>
          </button>
        ) : (
          <div className="space-y-3">
            {activeTimers.map((t) => (
              <TimerCard key={t.id} timer={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4">
      <div className="flex items-center gap-1.5 text-slate-400 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}
