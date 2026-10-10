import { useEffect, useState } from 'react';
import { Home, Timer, History, Settings as SettingsIcon, Clock } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { TimerProvider } from '@/context/TimerContext';
import { AuthScreen } from '@/screens/AuthScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { TimersScreen } from '@/screens/TimersScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export type TabKey = 'home' | 'timers' | 'history' | 'settings';

function AppContent() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabKey>('home');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <TimerProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">Chrono</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-lg mx-auto px-4 py-4 pb-28">
          {tab === 'home' && <HomeScreen onNavigate={setTab} />}
          {tab === 'timers' && <TimersScreen />}
          {tab === 'history' && <HistoryScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="max-w-lg mx-auto px-2 py-2 flex items-center justify-around">
            <TabButton label="Home" icon={<Home className="w-5 h-5" />} active={tab === 'home'} onClick={() => setTab('home')} />
            <TabButton label="Timers" icon={<Timer className="w-5 h-5" />} active={tab === 'timers'} onClick={() => setTab('timers')} />
            <TabButton label="History" icon={<History className="w-5 h-5" />} active={tab === 'history'} onClick={() => setTab('history')} />
            <TabButton label="Settings" icon={<SettingsIcon className="w-5 h-5" />} active={tab === 'settings'} onClick={() => setTab('settings')} />
          </div>
        </nav>
      </div>
    </TimerProvider>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'text-blue-500'
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}
