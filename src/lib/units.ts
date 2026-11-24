import type { Unit } from '../settings';

const LB = 2.20462;
export const toDisplay = (kg: number | undefined, unit: Unit) =>
  kg === undefined ? undefined : unit === 'kg' ? round(kg) : round(kg * LB);
export const fromDisplay = (v: number | undefined, unit: Unit) =>
  v === undefined ? undefined : unit === 'kg' ? v : v / LB;
export const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

export function fmtWeight(kg: number, unit: Unit) {
  const v = toDisplay(kg, unit)!;
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

export function fmtDuration(sec: number) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtVolume(kg: number, unit: Unit) {
  const v = toDisplay(kg, unit)!;
  return `${Math.round(v).toLocaleString()} ${unit}`;
}
