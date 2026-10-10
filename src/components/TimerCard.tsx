import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, RotateCcw, Square, Check, Pencil, Clock as ClockIcon, Trash2, X,
  MoreVertical, Copy, AlertTriangle,
} from 'lucide-react';
import type { TimerSession, TimerCategory } from '@/types/timer';
import { CATEGORIES } from '@/types/timer';
import { useTimers } from '@/context/TimerContext';
import { useSettings } from '@/context/SettingsContext';
import { formatDurationShort, formatDuration, formatTime } from '@/lib/format';

interface Props {
  timer: TimerSession;
  compact?: boolean;
}

export function TimerCard({ timer, compact = false }: Props) {
  const { start, pause, resume, stop, reset, editTimer, duplicate, remove, getRemaining } = useTimers();
  const { settings } = useSettings();
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopNote, setStopNote] = useState(timer.note ?? '');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const remaining = getRemaining(timer.id);
  const isRunning = timer.status === 'running';
  const isPaused = timer.status === 'paused';
  const isCreated = timer.status === 'created';
  const isEnded = timer.status === 'completed' || timer.status === 'stopped';
  const canEditDuration = isCreated || isPaused || isEnded;
  const canEdit = isCreated || isPaused || isEnded;

  const progress = isCreated
    ? 0
    : Math.min(1, 1 - remaining / timer.planned_duration_ms);
  const isOver = isRunning && remaining <= 0;

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDuplicate = async () => {
    setShowMenu(false);
    const newId = await duplicate(timer.id);
    if (newId) showToast(`Duplicated as "${timer.name} (Copy)"`);
  };

  const categoryLabel = timer.category
    ? CATEGORIES.find((c) => c.value === timer.category)?.label
    : null;

  return (
    <>
      <div
        className={`relative rounded-2xl border overflow-hidden transition-all ${
          isRunning
            ? 'border-blue-400/50 dark:border-blue-500/40 shadow-lg shadow-blue-500/10'
            : isPaused
            ? 'border-amber-400/50 dark:border-amber-500/40'
            : 'border-slate-200 dark:border-slate-700/60'
        } bg-white dark:bg-slate-800/60`}
      >
        {!isCreated && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-700/40">
            <div
              className={`h-full transition-all duration-500 ${
                isOver ? 'bg-red-500' : 'bg-gradient-to-r from-sky-500 to-blue-600'
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        <div className={`p-4 ${!isCreated ? 'pt-5' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  {timer.name}
                </h3>
                {categoryLabel && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {categoryLabel}
                  </span>
                )}
              </div>
              {!compact && timer.note && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {timer.note}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusBadge status={timer.status} isOver={isOver} />
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Timer options"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/60 py-1 animate-in">
                    {canEdit && (
                      <MenuItem icon={<Pencil className="w-4 h-4" />} label="Edit Timer"
                        onClick={() => { setShowMenu(false); setShowEditModal(true); }} />
                    )}
                    <MenuItem icon={<Copy className="w-4 h-4" />} label="Duplicate"
                      onClick={handleDuplicate} />
                    {!isCreated && (
                      <MenuItem icon={<RotateCcw className="w-4 h-4" />} label="Reset"
                        onClick={() => { setShowMenu(false); reset(timer.id); }} />
                    )}
                    <div className="my-1 border-t border-slate-100 dark:border-slate-700/40" />
                    <MenuItem icon={<Trash2 className="w-4 h-4" />} label="Delete" danger
                      onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center my-4">
            <div
              className={`text-4xl font-bold tabular-nums tracking-tight ${
                isOver
                  ? 'text-red-500'
                  : isEnded
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {isCreated
                ? formatDurationShort(timer.planned_duration_ms)
                : isEnded
                ? formatDurationShort(timer.active_ms)
                : formatDurationShort(remaining)}
            </div>
            {isCreated && (
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                <ClockIcon className="w-3 h-3" /> Ready to start
              </div>
            )}
            {isRunning && (
              <div className="text-xs text-blue-500 mt-1">Running</div>
            )}
            {isPaused && (
              <div className="text-xs text-amber-500 mt-1">Paused</div>
            )}
            {isEnded && (
              <div className="text-xs text-slate-400 mt-1">
                {timer.status === 'completed' ? 'Completed' : 'Stopped'} ·{' '}
                {formatDuration(timer.active_ms)} active
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 justify-center">
            {isCreated && (
              <button
                onClick={() => start(timer.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm"
              >
                <Play className="w-4 h-4" fill="currentColor" /> Start
              </button>
            )}

            {isRunning && (
              <>
                <button
                  onClick={() => pause(timer.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <Pause className="w-4 h-4" fill="currentColor" /> Pause
                </button>
                <IconButton onClick={() => setShowStopModal(true)} title="Stop">
                  <Square className="w-4 h-4" fill="currentColor" />
                </IconButton>
              </>
            )}

            {isPaused && (
              <>
                <button
                  onClick={() => resume(timer.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm"
                >
                  <Play className="w-4 h-4" fill="currentColor" /> Resume
                </button>
                <IconButton onClick={() => setShowStopModal(true)} title="Stop">
                  <Square className="w-4 h-4" fill="currentColor" />
                </IconButton>
              </>
            )}

            {isEnded && (
              <button
                onClick={() => reset(timer.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>

          {!compact && isEnded && timer.started_at && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/40 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <span className="text-slate-400">Started:</span>{' '}
                {formatTime(timer.started_at, settings.use24h)}
              </div>
              <div>
                <span className="text-slate-400">Ended:</span>{' '}
                {timer.ended_at ? formatTime(timer.ended_at, settings.use24h) : '—'}
              </div>
              <div>
                <span className="text-slate-400">Paused:</span>{' '}
                {formatDuration(timer.total_paused_ms)}
              </div>
              <div>
                <span className="text-slate-400">Pauses:</span> {timer.pause_count}
              </div>
            </div>
          )}
        </div>

        {toast && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 dark:bg-slate-700 rounded-full shadow-lg animate-in whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>

      {showStopModal && (
        <StopModal
          timerName={timer.name}
          note={stopNote}
          onNoteChange={setStopNote}
          onCancel={() => setShowStopModal(false)}
          onConfirm={() => {
            stop(timer.id, stopNote.trim() || undefined);
            setShowStopModal(false);
          }}
        />
      )}

      {showEditModal && (
        <EditModal
          timer={timer}
          canEditDuration={canEditDuration}
          onCancel={() => setShowEditModal(false)}
          onSave={async (changes) => {
            await editTimer(timer.id, changes);
            setShowEditModal(false);
            showToast('Timer updated');
          }}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirm
          timerName={timer.name}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            remove(timer.id);
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </>
  );
}

function MenuItem({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors text-left ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/40'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function IconButton({
  onClick, title, danger, children,
}: {
  onClick: () => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`px-3 py-2.5 text-sm font-medium rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform ${
        danger
          ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
          : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60'
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status, isOver }: { status: TimerSession['status']; isOver: boolean }) {
  if (status === 'created') return null;
  const config: Record<string, { label: string; className: string }> = {
    running: {
      label: isOver ? 'Overdue' : 'Running',
      className: isOver
        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    paused: {
      label: 'Paused',
      className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    },
    stopped: {
      label: 'Stopped',
      className: 'bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400',
    },
  };
  const c = config[status];
  if (!c) return null;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${c.className}`}>
      {c.label}
    </span>
  );
}

function StopModal({
  timerName, note, onNoteChange, onCancel, onConfirm,
}: {
  timerName: string;
  note: string;
  onNoteChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 animate-in">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Stop Timer</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Stopping "{timerName}". The timer will be saved to your history.
        </p>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
          What did you do? <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="e.g. Studied Physics chapter 2"
          rows={3}
          className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
        />
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Check className="w-4 h-4" /> Stop & Save
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  timer, canEditDuration, onCancel, onSave,
}: {
  timer: TimerSession;
  canEditDuration: boolean;
  onCancel: () => void;
  onSave: (changes: { name?: string; planned_duration_ms?: number; note?: string; category?: TimerCategory }) => Promise<void>;
}) {
  const [name, setName] = useState(timer.name);
  const [note, setNote] = useState(timer.note ?? '');
  const [category, setCategory] = useState<TimerCategory | ''>(timer.category ?? '');
  const [hours, setHours] = useState(Math.floor(timer.planned_duration_ms / 3600000));
  const [minutes, setMinutes] = useState(Math.floor((timer.planned_duration_ms % 3600000) / 60000));
  const [seconds, setSeconds] = useState(Math.floor((timer.planned_duration_ms % 60000) / 1000));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const changes: { name?: string; planned_duration_ms?: number; note?: string; category?: TimerCategory } = {
      name: name.trim(),
      note,
      category: (category || undefined) as TimerCategory | undefined,
    };
    if (canEditDuration) {
      changes.planned_duration_ms = (hours * 3600 + minutes * 60 + seconds) * 1000;
    }
    await onSave(changes);
    setSaving(false);
  };

  const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
  const valid = name.trim().length > 0 && (!canEditDuration || durationMs > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 animate-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Timer</h3>
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

          {canEditDuration ? (
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
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Pause or stop the timer to change its duration.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Category
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

        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!valid || saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-40 disabled:hover:scale-100"
          >
            <Check className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({
  timerName, onCancel, onConfirm,
}: {
  timerName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 animate-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Timer?</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          "{timerName}" will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Delete
          </button>
        </div>
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
