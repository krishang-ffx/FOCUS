import { useEffect, useState } from 'react';
import { formatClockTime, formatDate } from '@/lib/format';
import { useSettings } from '@/context/SettingsContext';

export function ClockDisplay() {
  const { settings } = useSettings();
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="flex flex-col items-center">
      {settings.analogClock ? (
        <AnalogClock date={date} />
      ) : (
        <div className="text-center">
          <div className="text-5xl sm:text-6xl font-bold tabular-nums text-slate-900 dark:text-white tracking-tight">
            {formatClockTime(date, settings.use24h)}
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <div className="text-lg font-medium text-slate-700 dark:text-slate-200">
          {dayName}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {formatDate(date)}
        </div>
      </div>
    </div>
  );
}

function AnalogClock({ date }: { date: Date }) {
  const seconds = date.getSeconds();
  const minutes = date.getMinutes();
  const hours = date.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div className="relative w-56 h-56 sm:w-64 sm:h-64">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Face */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-300 dark:text-slate-600"
        />
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="currentColor"
          className="text-slate-50 dark:text-slate-800/50"
        />

        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + Math.cos(angle - Math.PI / 2) * 82;
          const y1 = 100 + Math.sin(angle - Math.PI / 2) * 82;
          const x2 = 100 + Math.cos(angle - Math.PI / 2) * 72;
          const y2 = 100 + Math.sin(angle - Math.PI / 2) * 72;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-slate-400 dark:text-slate-500"
            />
          );
        })}

        {/* Minute markers */}
        {Array.from({ length: 60 }).map((_, i) => {
          if (i % 5 === 0) return null;
          const angle = (i * 6 * Math.PI) / 180;
          const x1 = 100 + Math.cos(angle - Math.PI / 2) * 85;
          const y1 = 100 + Math.sin(angle - Math.PI / 2) * 85;
          const x2 = 100 + Math.cos(angle - Math.PI / 2) * 80;
          const y2 = 100 + Math.sin(angle - Math.PI / 2) * 80;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
              className="text-slate-300 dark:text-slate-600"
            />
          );
        })}

        {/* Hour hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="55"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          className="text-slate-800 dark:text-slate-200"
          style={{ transform: `rotate(${hourDeg}deg)`, transformOrigin: '100px 100px' }}
        />

        {/* Minute hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="35"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="text-slate-700 dark:text-slate-300"
          style={{ transform: `rotate(${minuteDeg}deg)`, transformOrigin: '100px 100px' }}
        />

        {/* Second hand */}
        <line
          x1="100"
          y1="110"
          x2="100"
          y2="28"
          stroke="#0ea5e9"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{
            transform: `rotate(${secondDeg}deg)`,
            transformOrigin: '100px 100px',
            transition: 'transform 0.2s cubic-bezier(0.4, 2.5, 0.6, 1)',
          }}
        />

        {/* Center dot */}
        <circle cx="100" cy="100" r="5" fill="#0ea5e9" />
        <circle cx="100" cy="100" r="2.5" fill="white" />
      </svg>
    </div>
  );
}
