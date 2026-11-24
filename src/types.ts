export type TrackType = 'weight_reps' | 'reps' | 'duration';
export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface Exercise {
  id: string;
  name: string;
  nameSv?: string;
  category: string;
  equipment: string;
  level: string;
  force?: string;
  mechanic?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
  custom?: boolean;
  trackType?: TrackType;
}

export interface PlannedSet {
  type: SetType;
  reps?: number;
  weight?: number; // alltid kg internt
  duration?: number; // sekunder
}

export interface RoutineExercise {
  uid: string;
  exerciseId: string;
  sets: PlannedSet[];
  restSec: number;
  supersetId?: string;
  note?: string;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutSet extends PlannedSet {
  uid: string;
  done: boolean;
}

export interface WorkoutExercise {
  uid: string;
  exerciseId: string;
  sets: WorkoutSet[];
  restSec: number;
  supersetId?: string;
  note?: string;
}

export interface Workout {
  id: string;
  name: string;
  routineId?: string;
  startedAt: number;
  endedAt?: number;
  exercises: WorkoutExercise[];
  note?: string;
}

export interface ActiveWorkout extends Workout {
  key: 'current';
  restEndsAt?: number;
  restTotal?: number;
}
