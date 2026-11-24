import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, sv, type Strings } from './i18n/strings';
import { categories, equipment, levels, muscles } from './i18n/terms';

export type Lang = 'sv' | 'en';
export type Theme = 'system' | 'light' | 'dark';
export type Unit = 'kg' | 'lb';

export interface Settings {
  lang: Lang;
  theme: Theme;
  unit: Unit;
  defaultRest: number;
  sound: boolean;
  vibration: boolean;
}

const KEY = 'setpass.settings';
const defaults: Settings = {
  lang: typeof navigator !== 'undefined' && navigator.language?.startsWith('sv') ? 'sv' : 'en',
  theme: 'system', unit: 'kg', defaultRest: 90, sound: true, vibration: true
};

function load(): Settings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return defaults;
  }
}

interface Ctx {
  settings: Settings;
  update: (p: Partial<Settings>) => void;
  t: Strings;
  term: (kind: 'muscle' | 'equipment' | 'category' | 'level', key?: string) => string;
}

const SettingsContext = createContext<Ctx>(null!);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* privat läge */ }
    document.documentElement.lang = settings.lang;
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1115' : '#f5f6f8');
    };
    apply();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings]);

  const value = useMemo<Ctx>(() => {
    const dicts = { muscle: muscles, equipment, category: categories, level: levels };
    return {
      settings,
      update: (p) => setSettings((s) => ({ ...s, ...p })),
      t: settings.lang === 'sv' ? sv : en,
      term: (kind, key) => (key ? dicts[kind][key]?.[settings.lang] ?? key : '')
    };
  }, [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
