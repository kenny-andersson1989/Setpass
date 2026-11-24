import { useEffect, useRef, useState } from 'react';
import { mutateActive } from '../lib/workout';
import { beep, vibrate } from '../lib/sound';
import { fmtDuration } from '../lib/units';
import { useSettings } from '../settings';
import type { ActiveWorkout } from '../types';

export function useNow(interval = 500) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(id); }, [interval]);
  return now;
}

/** Vilotimer som ligger fast i botten. Sluttiden sparas i databasen så den överlever omladdning. */
export function RestTimer({ active }: { active: ActiveWorkout }) {
  const { t, settings } = useSettings();
  const now = useNow(250);
  const fired = useRef<number | undefined>(undefined);
  const ends = active.restEndsAt;
  const left = ends ? Math.min(active.restTotal ?? Infinity, Math.ceil((ends - now) / 1000)) : 0;

  useEffect(() => {
    if (!ends || left > 0 || fired.current === ends) return;
    fired.current = ends;
    if (settings.sound) beep();
    if (settings.vibration) vibrate([200, 100, 200]);
    void mutateActive((w) => (w.restEndsAt === ends ? { ...w, restEndsAt: undefined, restTotal: undefined } : w));
  }, [left, ends, active, settings.sound, settings.vibration]);

  if (!ends || left <= 0) return null;
  const total = active.restTotal || 1;
  const adjust = (d: number) => mutateActive((w) => w.restEndsAt ? { ...w, restEndsAt: Math.max(Date.now() + 1000, w.restEndsAt + d * 1000), restTotal: Math.max(1, (w.restTotal ?? 1) + d) } : w);

  return (
    <div className="rest-bar" role="timer">
      <div className="rest-progress" style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
      <button className="btn ghost sm" onClick={() => adjust(-15)}>−15</button>
      <div className="rest-time"><span className="muted small">{t.restTimer}</span><strong>{fmtDuration(left)}</strong></div>
      <button className="btn ghost sm" onClick={() => adjust(15)}>+15</button>
      <button className="btn primary sm" onClick={() => mutateActive((w) => ({ ...w, restEndsAt: undefined, restTotal: undefined }))}>{t.skip}</button>
    </div>
  );
}
