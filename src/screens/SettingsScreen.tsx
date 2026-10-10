import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import {
  LogOut, Clock, Sun, Moon, Bell, Type, Gauge, User, ChevronRight,
  AlertTriangle, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { clearLocalTimers } from '@/lib/timerEngine';

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { settings, update, toggle } = useSettings();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      const { error } = await supabase.from('timer_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        setClearStatus('Failed to clear history. Please try again.');
      } else {
        clearLocalTimers();
        setClearStatus('History cleared successfully.');
      }
    } catch {
      setClearStatus('Failed to clear history. Please try again.');
    }
    setClearingHistory(false);
    setConfirmClearHistory(false);
    setTimeout(() => setClearStatus(null), 3000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      {/* Account */}
      <Card title="Account" icon={<User className="w-4 h-4" />}>
        <div className="px-4 py-3">
          <div className="text-xs text-slate-400">Signed in as</div>
          <div className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 truncate">
            {user?.email ?? 'Unknown'}
          </div>
        </div>
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-slate-100 dark:border-slate-700/40"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </Card>

      {/* Appearance */}
      <Card title="Appearance" icon={<Sun className="w-4 h-4" />}>
        <ToggleRow
          icon={settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          label="Dark Mode"
          description="Switch between light and dark themes"
          checked={settings.theme === 'dark'}
          onChange={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        />
      </Card>

      {/* Clock */}
      <Card title="Clock" icon={<Clock className="w-4 h-4" />}>
        <ToggleRow
          icon={<Type className="w-4 h-4" />}
          label="24-Hour Format"
          description="Use 24-hour time instead of AM/PM"
          checked={settings.use24h}
          onChange={() => toggle('use24h')}
        />
        <ToggleRow
          icon={<Gauge className="w-4 h-4" />}
          label="Analog Clock"
          description="Show a traditional clock face on the home screen"
          checked={settings.analogClock}
          onChange={() => toggle('analogClock')}
        />
      </Card>

      {/* Notifications */}
      <Card title="Notifications" icon={<Bell className="w-4 h-4" />}>
        <ToggleRow
          icon={<Bell className="w-4 h-4" />}
          label="Completion Sound"
          description="Play a chime when a timer finishes"
          checked={settings.soundEnabled}
          onChange={() => toggle('soundEnabled')}
        />
      </Card>

      {/* Data Management */}
      <Card title="Data Management" icon={<Trash2 className="w-4 h-4" />}>
        <button
          onClick={() => setConfirmClearHistory(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
        >
          <Trash2 className="w-4 h-4" />
          <div className="flex-1">
            <div>Clear History</div>
            <div className="text-xs text-slate-400 mt-0.5">Remove all completed and stopped sessions from your history. Your active timers and settings will not be affected.</div>
          </div>
        </button>
      </Card>

      {clearStatus && (
        <div className="text-sm text-center text-slate-500 dark:text-slate-400 px-4 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
          {clearStatus}
        </div>
      )}

      <p className="text-xs text-center text-slate-400 pt-4">
        Chrono · Time Tracking v1.0
      </p>

      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 animate-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sign Out?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Your timer history is saved to your account and will be available when you sign back in.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmLogout(false); signOut(); }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 animate-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clear History?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              All completed and stopped session records will be permanently removed. Your active timers and settings will not be affected. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmClearHistory(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                disabled={clearingHistory}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {clearingHistory ? 'Clearing…' : 'Clear History'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1 flex items-center gap-1.5">
        {icon} {title}
      </h2>
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  icon, label, description, checked, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border-b border-slate-100 dark:border-slate-700/40 last:border-0 text-left"
    >
      <div className="text-slate-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 dark:text-white">{label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{description}</div>
      </div>
      <div
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
          checked ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}
