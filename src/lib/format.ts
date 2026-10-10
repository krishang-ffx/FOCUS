export function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || (h === 0 && m === 0)) parts.push(`${s}s`);
  return parts.join(' ');
}

export function formatDurationShort(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatClockTime(date: Date, use24h: boolean): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  let suffix = '';
  if (!use24h) {
    suffix = h >= 12 ? ' PM' : ' AM';
    h = h % 12;
    if (h === 0) h = 12;
  }
  const hStr = String(h).padStart(use24h ? 2 : 1, '0');
  const mStr = String(m).padStart(2, '0');
  const sStr = String(s).padStart(2, '0');
  return `${hStr}:${mStr}:${sStr}${suffix}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string, use24h: boolean): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  let h = d.getHours();
  const m = d.getMinutes();
  let suffix = '';
  if (!use24h) {
    suffix = h >= 12 ? ' PM' : ' AM';
    h = h % 12;
    if (h === 0) h = 12;
  }
  const hStr = String(h).padStart(use24h ? 2 : 1, '0');
  const mStr = String(m).padStart(2, '0');
  return `${hStr}:${mStr}${suffix}`;
}

export function formatDateTime(date: Date | string, use24h: boolean): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(d)}, ${formatTime(d, use24h)}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}
