import { useState, useRef, useEffect } from 'react';
import { Plus, Timer as TimerIcon, X, Settings2, Trash2, CheckCheck, AlertTriangle } from 'lucide-react';
import { useTimers } from '@/context/TimerContext';
import { TimerCard } from '@/components/TimerCard';
import { formatDurationShort } from '@/lib/format';
import type { TimerCategory } from '@/types/timer';
import { CATEGORIES } from '@/types/timer';

export function TimersScreen() {
  const { timers, createTimer, deleteFinished, deleteAll } = useTimers();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<TimerCategory | ''>('');
  const [creating, setCreating] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showDeleteFinished, setShowDeleteFinished] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const manageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showManage) return;
    const handler = (e: MouseEvent) => {
      if (manageRef.current && !manageRef.current.contains(e.target as Node)) {
        setShowManage(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showManage]);

  const handleCreate = async () => {
    const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    if (!name.trim() || durationMs <= 0) return;
    setCreating(true);
    await createTimer(name.trim(), durationMs, note.trim() || undefined, (category || undefined) as TimerCategory | undefined);
    setCreating(false);
    setName('');
    setHours(0);
    setMinutes(25);
    setSeconds(0);
    setNote('');
    setCategory('');
    setShowCreate(false);
  };

  const running = timers.filter((t) => t.status === 'running');
  const paused = timers.filter((t) => t.status === 'paused');
  const created = timers.filter((t) => t.status === 'created');
  const ended = timers.filter((t) => t.status === 'completed' || t.status === 'stopped');

  const finishedCount = ended.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Timers</h1>
        <div className="flex items-center gap-2">
          <div className="relative" ref={manageRef}>
            <button
              onClick={() => setShowManage(!showManage)}
              aria-label="Manage timers"
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Settings2 className="w-4 h-4" /> Manage
            </button>
            {showManage && (
              <div className="absolute right-0 top-12 z-20 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/60 py-1 animate-in">
                <ManageItem
                  icon={<CheckCheck className="w-4 h-4" />}
                  label="Delete Finished Timers"
                  sublabel={finishedCount > 0 ? `${finishedCount} timer(s)` : undefined}
                  disabled={finishedCount === 0}
                  onClick={() => { setShowManage(false); setShowDeleteFinished(true); }}
                />
                <div className="my-1 border-t border-slate-100 dark:border-slate-700/40" />
                <ManageItem
                  icon={<Trash2 className="w-4 h-4" />}
                  label="Delete All Timers"
                  sublabel={timers.length > 0 ? `${timers.length} timer(s)` : undefined}
                  disabled={timers.length === 0}
                  danger
                  onClick={() => { setShowManage(false); setShowDeleteAll(true); }}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25 hover:scale-[1.03] active:scale-[0.97] transition-transform"
          >
            <Plus className="w-4 h-4" /> New Timer
          </button>
        </div>
      </div>

      {timers.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
            <TimerIcon className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">No timers yet</p>
            <p className="text-sm text-slate-400 mt-1">Create your first timer to get started</p>
          </div>
        </div>
      )}

      {running.length > 0 && (
        <Section title="Running" count={running.length}>
          {running.map((t) => <TimerCard key={t.id} timer={t} />)}
        </Section>
      )}

      {paused.length > 0 && (
        <Section title="Paused" count={paused.length}>
          {paused.map((t) => <TimerCard key={t.id} timer={t} />)}
        </Section>
      )}

      {created.length > 0 && (
        <Section title="Ready" count={created.length}>
          {created.map((t) => <TimerCard key={t.id} timer={t} />)}
        </Section>
      )}

      {ended.length > 0 && (
        <Section title="Finished" count={ended.length}>
          {ended.map((t) => <TimerCard key={t.id} timer={t} />)}
        </Section>
      )}

      {showCreate && (
        <CreateModal
          name={name} setName={setName}
          hours={hours} setHours={setHours}
          minutes={minutes} setMinutes={setMinutes}
          seconds={seconds} setSeconds={setSeconds}
          note={note} setNote={setNote}
          category={category} setCategory={setCategory}
          creating={creating}
          onCancel={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {showDeleteFinished && (
        <ConfirmModal
          title="Delete Finished Timers?"
          message={`${finishedCount} finished timer(s) will be permanently removed. Running and paused timers will be preserved.`}
          confirmLabel="Delete Finished"
          onCancel={() => setShowDeleteFinished(false)}
          onConfirm={() => { deleteFinished(); setShowDeleteFinished(false); }}
        />
      )}

      {showDeleteAll && (
        <ConfirmModal
          title="Delete All Timers?"
          message={`All ${timers.length} timer(s) will be permanently removed, including running and paused ones. This cannot be undone. Your history and settings will not be affected.`}
          confirmLabel="Delete All"
          danger
          onCancel={() => setShowDeleteAll(false)}
          onConfirm={() => { deleteAll(); setShowDeleteAll(false); }}
        />
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
        {title} <span className="text-slate-400">({count})</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ManageItem({
  icon, label, sublabel, onClick, danger, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors text-left disabled:opacity-40 ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/40'
      }`}
    >
      {icon}
      <div className="flex-1">
        <div>{label}</div>
        {sublabel && <div className="text-xs text-slate-400">{sublabel}</div>}
      </div>
    </button>
  );
}

function ConfirmModal({
  title, message, confirmLabel, danger, onCancel, onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 animate-in">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            {danger ? <Trash2 className="w-5 h-5 text-red-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform ${
              danger ? 'bg-red-500' : 'bg-amber-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateModal({
  name, setName, hours, setHours, minutes, setMinutes, seconds, setSeconds,
  note, setNote, category, setCategory, creating, onCancel, onCreate,
}: {
  name: string;
  setName: (v: string) => void;
  hours: number;
  setHours: (v: number) => void;
  minutes: number;
  setMinutes: (v: number) => void;
  seconds: number;
  setSeconds: (v: number) => void;
  note: string;
  setNote: (v: string) => void;
  category: TimerCategory | '';
  setCategory: (v: TimerCategory | '') => void;
  creating: boolean;
  onCancel: () => void;
  onCreate: () => void;
}) {
  const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
  const valid = name.trim().length > 0 && durationMs > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 animate-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New Timer</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Timer Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Study"
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Duration
            </label>
            <div className="flex items-center gap-2">
              <DurationInput label="Hours" value={hours} onChange={setHours} max={23} />
              <span className="text-xl font-bold text-slate-300 dark:text-slate-600">:</span>
              <DurationInput label="Min" value={minutes} onChange={setMinutes} max={59} />
              <span className="text-xl font-bold text-slate-300 dark:text-slate-600">:</span>
              <DurationInput label="Sec" value={seconds} onChange={setSeconds} max={59} />
            </div>
            <div className="text-center text-sm text-slate-400 mt-2">
              {formatDurationShort(durationMs)}
            </div>
            <div className="flex gap-2 mt-2">
              {[
                { label: '5m', h: 0, m: 5, s: 0 },
                { label: '15m', h: 0, m: 15, s: 0 },
                { label: '25m', h: 0, m: 25, s: 0 },
                { label: '1h', h: 1, m: 0, s: 0 },
                { label: '2h', h: 2, m: 0, s: 0 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => { setHours(preset.h); setMinutes(preset.m); setSeconds(preset.s); }}
                  className="flex-1 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Category <span className="text-slate-400">(optional)</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TimerCategory | '')}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">No category</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Note <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Physics revision"
              rows={2}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
            />
          </div>
        </div>

        <button
          onClick={onCreate}
          disabled={!valid || creating}
          className="w-full mt-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-40 disabled:hover:scale-100"
        >
          {creating ? 'Creating…' : 'Create Timer'}
        </button>
      </div>
    </div>
  );
}

function DurationInput({
  label, value, onChange, max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex-1 text-center">
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value) || 0;
          onChange(Math.min(max, Math.max(0, v)));
        }}
        className="w-full text-center text-2xl font-bold tabular-nums bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition py-2"
      />
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
