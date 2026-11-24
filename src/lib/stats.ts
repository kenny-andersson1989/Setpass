import type { Workout, WorkoutSet } from '../types';

/** Uppskattat 1RM enligt Epley. */
export function e1rm(weight: number, reps: number) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export const setVolume = (s: WorkoutSet) => (s.done && s.weight && s.reps ? s.weight * s.reps : 0);

export function workoutVolume(w: Workout) {
  return w.exercises.reduce((sum, e) => sum + e.sets.reduce((a, s) => a + setVolume(s), 0), 0);
}

export function doneSets(w: Workout) {
  return w.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
}

export interface Records {
  maxWeight: number;
  maxE1rm: number;
  maxReps: number;
  maxVolumeSet: number;
  maxDuration: number;
}

export const emptyRecords = (): Records => ({ maxWeight: 0, maxE1rm: 0, maxReps: 0, maxVolumeSet: 0, maxDuration: 0 });

function applySet(r: Records, s: WorkoutSet) {
  if (!s.done || s.type === 'warmup') return;
  r.maxWeight = Math.max(r.maxWeight, s.weight ?? 0);
  r.maxE1rm = Math.max(r.maxE1rm, e1rm(s.weight ?? 0, s.reps ?? 0));
  r.maxReps = Math.max(r.maxReps, s.reps ?? 0);
  r.maxVolumeSet = Math.max(r.maxVolumeSet, (s.weight ?? 0) * (s.reps ?? 0));
  r.maxDuration = Math.max(r.maxDuration, s.duration ?? 0);
}

/** Rekord per övning över en lista pass. */
export function recordsByExercise(workouts: Workout[]) {
  const map = new Map<string, Records>();
  for (const w of workouts)
    for (const e of w.exercises) {
      const r = map.get(e.exerciseId) ?? emptyRecords();
      e.sets.forEach((s) => applySet(r, s));
      map.set(e.exerciseId, r);
    }
  return map;
}

export type PrKind = 'weight' | 'e1rm' | 'reps' | 'volume' | 'duration';

/** Vilka nya rekord satte `workout` jämfört med `previous` pass? */
export function newPrs(workout: Workout, previous: Workout[]) {
  const before = recordsByExercise(previous);
  const result: { exerciseId: string; kinds: PrKind[] }[] = [];
  for (const e of workout.exercises) {
    const old = before.get(e.exerciseId);
    if (!old) continue; // första gången räknas inte som PR
    const now = emptyRecords();
    e.sets.forEach((s) => applySet(now, s));
    const kinds: PrKind[] = [];
    if (now.maxWeight > old.maxWeight) kinds.push('weight');
    if (now.maxE1rm > old.maxE1rm + 0.01) kinds.push('e1rm');
    if (!now.maxWeight && now.maxReps > old.maxReps) kinds.push('reps');
    if (now.maxVolumeSet > old.maxVolumeSet) kinds.push('volume');
    if (now.maxDuration > old.maxDuration) kinds.push('duration');
    if (kinds.length) result.push({ exerciseId: e.exerciseId, kinds });
  }
  return result;
}

/** Datapunkter per pass för en övning (för grafer). */
export function exerciseSeries(workouts: Workout[], exerciseId: string) {
  return workouts
    .filter((w) => w.endedAt)
    .sort((a, b) => a.startedAt - b.startedAt)
    .flatMap((w) => {
      const sets = w.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter((s) => s.done && s.type !== 'warmup'));
      if (!sets.length) return [];
      return [{
        date: w.startedAt,
        workoutId: w.id,
        maxWeight: Math.max(...sets.map((s) => s.weight ?? 0)),
        e1rm: Math.max(...sets.map((s) => e1rm(s.weight ?? 0, s.reps ?? 0))),
        volume: sets.reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0),
        reps: Math.max(...sets.map((s) => s.reps ?? 0)),
        duration: Math.max(...sets.map((s) => s.duration ?? 0)),
        sets
      }];
    });
}
