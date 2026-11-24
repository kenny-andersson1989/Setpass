import { db, uid } from '../db';
import type { ActiveWorkout, PlannedSet, Routine, Workout, WorkoutExercise, WorkoutSet } from '../types';

export const getActive = () => db.active.get('current');
export const saveActive = (w: ActiveWorkout) => db.active.put(w);

/** Läs-ändra-skriv i en transaktion, så att snabba tryck i följd inte skriver över varandra. */
export function mutateActive(fn: (w: ActiveWorkout) => ActiveWorkout) {
  return db.transaction('rw', db.active, async () => {
    const cur = await db.active.get('current');
    if (cur) await db.active.put(fn(cur));
  });
}

/** Senaste genomförda set för en övning, för "Förra"-kolumnen och förifyllning. */
export async function lastSetsFor(exerciseId: string): Promise<WorkoutSet[]> {
  const workouts = await db.workouts.orderBy('startedAt').reverse().limit(60).toArray();
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
    const sets = ex?.sets.filter((s) => s.done);
    if (sets?.length) return sets;
  }
  return [];
}

const toWorkoutSet = (s: PlannedSet): WorkoutSet => ({ ...s, uid: uid(), done: false });

export async function startWorkout(routine?: Routine, name = 'Pass') {
  const existing = await getActive();
  if (existing) return existing;
  const w: ActiveWorkout = {
    key: 'current',
    id: uid(),
    name: routine?.name ?? name,
    routineId: routine?.id,
    startedAt: Date.now(),
    exercises: (routine?.exercises ?? []).map((e) => ({
      uid: uid(), exerciseId: e.exerciseId, restSec: e.restSec, supersetId: e.supersetId, note: e.note,
      sets: e.sets.map(toWorkoutSet)
    }))
  };
  await saveActive(w);
  return w;
}

export async function newWorkoutExercise(exerciseId: string, restSec: number): Promise<WorkoutExercise> {
  const last = await lastSetsFor(exerciseId);
  const base: PlannedSet[] = last.length
    ? last.map(({ type, reps, weight, duration }) => ({ type, reps, weight, duration }))
    : [{ type: 'normal' }, { type: 'normal' }, { type: 'normal' }];
  return { uid: uid(), exerciseId, restSec, sets: base.map(toWorkoutSet) };
}

/** Sparar passet till historiken. Returnerar sparat pass (bara klara set). */
export async function finishWorkout(active: ActiveWorkout): Promise<Workout> {
  const { key: _k, restEndsAt: _r, restTotal: _t, ...rest } = active;
  void _k; void _r; void _t;
  const workout: Workout = {
    ...rest,
    endedAt: Date.now(),
    exercises: rest.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
      .filter((e) => e.sets.length)
  };
  await db.transaction('rw', db.workouts, db.active, async () => {
    await db.workouts.put(workout);
    await db.active.delete('current');
  });
  return workout;
}

export const discardWorkout = () => db.active.delete('current');

/** Gör om ett pass till schema-övningar (för "spara som schema"/"uppdatera schema"). */
export function workoutToRoutineExercises(w: Workout) {
  return w.exercises.map((e) => ({
    uid: uid(), exerciseId: e.exerciseId, restSec: e.restSec, supersetId: e.supersetId, note: e.note,
    sets: e.sets.map(({ type, reps, weight, duration }) => ({ type, reps, weight, duration }))
  }));
}

/**
 * Ska vilotimern starta efter att ett set bockats av?
 * I en superset startar vilan först efter sista övningen i gruppen.
 */
export function restAfter(exercises: WorkoutExercise[], exIndex: number): number {
  const ex = exercises[exIndex];
  if (ex.supersetId) {
    const next = exercises[exIndex + 1];
    if (next && next.supersetId === ex.supersetId) return 0;
  }
  return ex.restSec;
}
