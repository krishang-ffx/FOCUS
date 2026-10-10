const STORAGE_KEY = 'chrono-settings';

export interface AppSettings {
  use24h: boolean;
  analogClock: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
}

const defaultSettings: AppSettings = {
  use24h: false,
  analogClock: false,
  soundEnabled: true,
  theme: 'dark',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
