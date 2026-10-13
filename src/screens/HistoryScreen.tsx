import { useEffect, useState, useMemo } from 'react';
import { Search, Calendar, X, ChevronLeft, Trash2, Filter, ArrowDownUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { HistoryRecord } from '@/types/timer';
import { CATEGORIES } from '@/types/timer';
import { useSettings } from '@/context/SettingsContext';
import {
  formatDuration,
  formatTime,
  formatDate,
  formatDateTime,
  dateKey,
} from '@/lib/format';

type SortOrder = 'newest' | 'oldest';

export function HistoryScreen() {
  const { settings } = useSettings();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selected, setSelected] = useState<HistoryRecord | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timer_sessions')
      .select('*')
      .order('started_at', { ascending: false, nullsFirst: false });
    if (!error && data) {
      setRecords(data as HistoryRecord[]);
    }
    setLoading(false);
  };

  const timerNames = useMemo(() => {
    const names = new Set(records.map((r) => r.name));
    return Array.from(names).sort();
  }, [records]);

  const filtered = useMemo(() => {
    const result = records.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchNote = r.note?.toLowerCase().includes(q);
        if (!matchName && !matchNote) return false;
      }
      if (nameFilter && r.name !== nameFilter) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (dateFilter && r.started_at) {
        const rDate = dateKey(new Date(r.started_at));
        const fDate = dateKey(new Date(dateFilter));
        if (rDate !== fDate) return false;
      }
      return true;
    });

    if (sortOrder === 'oldest') {
      result.reverse();
    }

    return result;
  }, [records, search, nameFilter, dateFilter, categoryFilter, sortOrder]);

  const grouped = useMemo(() => {
    const groups: Record<string, HistoryRecord[]> = {};
    for (const r of filtered) {
      const key = r.started_at ? formatDate(r.started_at) : 'No start date';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return Object.entries(groups);
  }, [filtered]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('timer_sessions').delete().eq('id', id);
    if (!error) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSelected(null);
    }
  };

  const hasFilters = nameFilter || dateFilter || categoryFilter;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">History</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or note…"
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter + Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            hasFilters
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Filter className="w-3.5 h-3.5" /> Filters
          {hasFilters && <span className="text-xs">({[nameFilter, dateFilter, categoryFilter].filter(Boolean).length})</span>}
        </button>
        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ArrowDownUp className="w-3.5 h-3.5" /> {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
        </button>
        {hasFilters && (
          <button
            onClick={() => { setNameFilter(''); setDateFilter(''); setCategoryFilter(''); }}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Clear all
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Timer Name
            </label>
            <select
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All timers</option>
              {timerNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {records.length === 0 ? 'No history yet' : 'No matching records'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {records.length === 0
                ? 'Your completed timer sessions will appear here'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateLabel, sessions]) => (
            <div key={dateLabel}>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
                {dateLabel}
              </h2>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="w-full text-left bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 hover:border-blue-300 dark:hover:border-blue-700/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {s.name}
                        </h3>
                        {s.category && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                            {CATEGORIES.find((c) => c.value === s.category)?.label}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                          s.status === 'completed'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400'
                        }`}
                      >
                        {s.status === 'completed' ? 'Completed' : 'Stopped'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {s.started_at && (
                        <span>{formatTime(s.started_at, settings.use24h)}</span>
                      )}
                      <span>·</span>
                      <span>{formatDuration(s.active_ms)} active</span>
                      {s.total_paused_ms > 0 && (
                        <>
                          <span>·</span>
                          <span>{formatDuration(s.total_paused_ms)} paused</span>
                        </>
                      )}
                    </div>
                    {s.note && (
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-1 italic">
                        "{s.note}"
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <HistoryDetail
          session={selected}
          use24h={settings.use24h}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}
    </div>
  );
}

function HistoryDetail({
  session, use24h, onClose, onDelete,
}: {
  session: HistoryRecord;
  use24h: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const plannedMs = session.planned_duration_ms;
  const actualMs = session.active_ms;
  const diff = actualMs - plannedMs;
  const categoryLabel = session.category
    ? CATEGORIES.find((c) => c.value === session.category)?.label
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in">
        <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{session.name}</h2>
              {categoryLabel && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400">
                  {categoryLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {session.started_at ? formatDateTime(session.started_at, use24h) : 'Not started'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Planned" value={formatDuration(plannedMs)} />
            <StatCard label="Actual Active" value={formatDuration(actualMs)} highlight />
            <StatCard label="Paused" value={formatDuration(session.total_paused_ms)} />
            <StatCard label="Pauses" value={String(session.pause_count)} />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Planned vs Actual
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${diff > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{
                    width: `${Math.min(100, (actualMs / Math.max(plannedMs, 1)) * 100)}%`,
                  }}
                />
              </div>
              <span
                className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                  diff > 0 ? 'text-red-500' : 'text-green-500'
                }`}
              >
                {diff > 0 ? '+' : ''}
                {formatDuration(Math.abs(diff))}
              </span>
            </div>
          </div>

          {session.events.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Pause / Resume Timeline
              </h3>
              <div className="space-y-2">
                {session.started_at && (
                  <TimelineItem label="Started" time={formatTime(session.started_at, use24h)} color="blue" />
                )}
                {session.events.map((event, i) => (
                  <TimelineItem
                    key={i}
                    label={
                      event.type === 'pause' ? 'Paused' :
                      event.type === 'resume' ? 'Resumed' :
                      event.type === 'complete' ? 'Completed' :
                      'Stopped'
                    }
                    time={formatTime(event.at, use24h)}
                    color={
                      event.type === 'pause' ? 'amber' :
                      event.type === 'resume' ? 'blue' :
                      event.type === 'complete' ? 'green' :
                      'slate'
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {session.note && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Activity Note
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4">
                <p className="text-sm text-slate-700 dark:text-slate-200 italic">
                  "{session.note}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl p-3 ${
        highlight
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30'
          : 'bg-slate-50 dark:bg-slate-900/40'
      }`}
    >
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-bold tabular-nums mt-0.5 ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function TimelineItem({ label, time, color }: { label: string; time: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
    slate: 'bg-slate-400',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${colors[color]}`} />
      <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">{label}</span>
      <span className="text-sm text-slate-400 tabular-nums">{time}</span>
    </div>
  );
}
