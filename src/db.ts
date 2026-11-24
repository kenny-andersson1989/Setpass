import Dexie, { type EntityTable } from 'dexie';
import type { ActiveWorkout, Exercise, Routine, Workout } from './types';

export const db = new Dexie('setpass') as Dexie & {
  routines: EntityTable<Routine, 'id'>;
  workouts: EntityTable<Workout, 'id'>;
  customExercises: EntityTable<Exercise, 'id'>;
  active: EntityTable<ActiveWorkout, 'key'>;
};

db.version(1).stores({
  routines: 'id, name, updatedAt',
  workouts: 'id, startedAt, routineId',
  customExercises: 'id, name',
  active: 'key'
});

export const uid = () =>
  (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

export async function exportData() {
  const [routines, workouts, customExercises] = await Promise.all([
    db.routines.toArray(),
    db.workouts.toArray(),
    db.customExercises.toArray()
  ]);
  return { app: 'setpass', version: 1, exportedAt: new Date().toISOString(), routines, workouts, customExercises };
}

export async function importData(data: unknown) {
  const d = data as { app?: string; routines?: Routine[]; workouts?: Workout[]; customExercises?: Exercise[] };
  if (d?.app !== 'setpass') throw new Error('invalid');
  await db.transaction('rw', db.routines, db.workouts, db.customExercises, async () => {
    if (d.routines) await db.routines.bulkPut(d.routines);
    if (d.workouts) await db.workouts.bulkPut(d.workouts);
    if (d.customExercises) await db.customExercises.bulkPut(d.customExercises);
  });
}
