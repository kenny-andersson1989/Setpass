import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { namesSv } from '../i18n/names-sv';
import type { Exercise, TrackType } from '../types';
import type { Lang } from '../settings';

const IMG_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
export const imageUrl = (path: string) => (/^(https?:|data:|blob:)/.test(path) ? path : IMG_BASE + path);

let cache: Promise<Exercise[]> | null = null;
export function loadLibrary() {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/exercises.json`)
    .then((r) => r.json() as Promise<Exercise[]>)
    .then((list) => list.map((e) => ({ ...e, nameSv: namesSv[e.id] })));
  return cache;
}

/** Alla övningar (bibliotek + egna), som Map på id. */
export function useExercises() {
  const [library, setLibrary] = useState<Exercise[] | null>(null);
  const custom = useLiveQuery(() => db.customExercises.toArray(), []);
  useEffect(() => { loadLibrary().then(setLibrary); }, []);
  return useMemo(() => {
    const all = [...(custom ?? []), ...(library ?? [])];
    return { ready: !!library && !!custom, all, byId: new Map(all.map((e) => [e.id, e])) };
  }, [library, custom]);
}

export function trackTypeOf(e?: Exercise): TrackType {
  if (!e) return 'weight_reps';
  if (e.trackType) return e.trackType;
  if (e.category === 'cardio' || e.category === 'stretching' || e.id === 'Plank' || e.id === 'Side_Bridge') return 'duration';
  if (e.equipment === 'body only') return 'reps';
  return 'weight_reps';
}

export const displayName = (e: Exercise | undefined, lang: Lang) =>
  !e ? '?' : lang === 'sv' ? e.nameSv ?? e.name : e.name;

// Vanliga basövningar som ska hamna först i sökresultat
const POPULAR = new Set([
  'Barbell_Bench_Press_-_Medium_Grip', 'Barbell_Squat', 'Barbell_Deadlift', 'Standing_Military_Press', 'Bent_Over_Barbell_Row',
  'Pullups', 'Chin-Up', 'Dumbbell_Bench_Press', 'Incline_Dumbbell_Press', 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'Wide-Grip_Lat_Pulldown', 'Seated_Cable_Rows', 'One-Arm_Dumbbell_Row', 'Leg_Press', 'Romanian_Deadlift', 'Barbell_Hip_Thrust',
  'Dumbbell_Shoulder_Press', 'Side_Lateral_Raise', 'Barbell_Curl', 'Dumbbell_Bicep_Curl', 'Hammer_Curls', 'Triceps_Pushdown',
  'Triceps_Pushdown_-_Rope_Attachment', 'Dips_-_Triceps_Version', 'Pushups', 'Plank', 'Leg_Extensions', 'Lying_Leg_Curls',
  'Seated_Leg_Curl', 'Standing_Calf_Raises', 'Dumbbell_Lunges', 'Goblet_Squat', 'Face_Pull', 'Cable_Crossover', 'Dumbbell_Flyes',
  'Hanging_Leg_Raise', 'Crunches', 'Front_Barbell_Squat', 'Sumo_Deadlift', 'Split_Squat_with_Dumbbells', 'Running_Treadmill'
]);

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-_/]/g, ' ');

export interface Filter { q: string; muscle: string; equipment: string; category: string }

export function filterExercises(list: Exercise[], f: Filter) {
  const words = norm(f.q).split(/\s+/).filter(Boolean);
  const out = list.filter((e) => {
    if (f.muscle && !e.primaryMuscles.includes(f.muscle)) return false;
    if (f.equipment && e.equipment !== f.equipment) return false;
    if (f.category && e.category !== f.category) return false;
    if (!words.length) return true;
    const hay = norm(`${e.name} ${e.nameSv ?? ''} ${e.primaryMuscles.join(' ')}`);
    return words.every((w) => hay.includes(w));
  });
  if (words.length) {
    const q = norm(f.q);
    const score = (e: Exercise) => {
      const n = norm(e.nameSv ?? e.name), m = norm(e.name);
      return (n.startsWith(q) || m.startsWith(q) ? 0 : 1) + (POPULAR.has(e.id) ? -0.6 : 0) + (e.nameSv ? 0 : 0.5) + n.length / 1000;
    };
    out.sort((a, b) => score(a) - score(b));
  } else {
    out.sort((a, b) => Number(!!b.custom) - Number(!!a.custom) || Number(POPULAR.has(b.id)) - Number(POPULAR.has(a.id)) || Number(!!b.nameSv) - Number(!!a.nameSv) || a.name.localeCompare(b.name));
  }
  return out;
}
