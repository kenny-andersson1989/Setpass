import { useEffect, useState } from 'react';

const parseNum = (s: string) => {
  const v = parseFloat(s.replace(',', '.'));
  return Number.isFinite(v) && v >= 0 ? v : undefined;
};

/** Sifferfält som klarar decimalkomma och inte hoppar medan man skriver. */
export function NumInput({ value, onChange, placeholder, integer, ariaLabel }: {
  value?: number; onChange: (v?: number) => void; placeholder?: string; integer?: boolean; ariaLabel?: string;
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  useEffect(() => {
    if (parseNum(text) !== value) setText(value === undefined ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input className="num" inputMode={integer ? 'numeric' : 'decimal'} value={text} placeholder={placeholder} aria-label={ariaLabel}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const s = e.target.value.replace(/[^\d.,]/g, '');
        setText(s);
        const v = parseNum(s);
        onChange(v === undefined ? undefined : integer ? Math.round(v) : v);
      }} />
  );
}

export const fmtSec = (s?: number) => (s === undefined ? '' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
const parseSec = (s: string) => {
  if (!s.trim()) return undefined;
  if (s.includes(':')) {
    const [m, sec] = s.split(':');
    return (parseInt(m) || 0) * 60 + (parseInt(sec) || 0);
  }
  const n = parseInt(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Tid som m:ss (eller bara sekunder). */
export function DurationInput({ value, onChange, placeholder }: { value?: number; onChange: (v?: number) => void; placeholder?: string }) {
  const [text, setText] = useState(fmtSec(value));
  useEffect(() => { if (parseSec(text) !== value) setText(fmtSec(value)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [value]);
  return (
    <input className="num" inputMode="numeric" value={text} placeholder={placeholder ?? '0:00'}
      onFocus={(e) => e.target.select()}
      onChange={(e) => { setText(e.target.value); onChange(parseSec(e.target.value)); }}
      onBlur={() => setText(fmtSec(parseSec(text)))} />
  );
}

export const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
