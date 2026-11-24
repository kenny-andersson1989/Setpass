import { describe, expect, it } from 'vitest';
import { e1rm, newPrs, workoutVolume, exerciseSeries } from './stats';
import type { Workout } from '../types';

const w = (id: string, t: number, sets: [number, number, boolean?][]): Workout => ({
  id, name: id, startedAt: t, endedAt: t + 1,
  exercises: [{ uid: 'a', exerciseId: 'bench', restSec: 90, sets: sets.map(([weight, reps, done = true], i) => ({ uid: String(i), type: 'normal', weight, reps, done })) }]
});

describe('stats', () => {
  it('e1rm', () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 1);
    expect(e1rm(0, 5)).toBe(0);
  });
  it('volym räknar bara klara set', () => {
    expect(workoutVolume(w('x', 0, [[100, 5], [100, 5, false]]))).toBe(500);
  });
  it('PR mot tidigare pass', () => {
    const prev = [w('a', 1, [[100, 5]])];
    expect(newPrs(w('b', 2, [[105, 3]]), prev)[0].kinds).toEqual(['weight']);
    expect(newPrs(w('b', 2, [[90, 5]]), prev)).toEqual([]);
    expect(newPrs(w('b', 2, [[100, 5]]), [])).toEqual([]);
  });
  it('serie sorteras på datum', () => {
    const s = exerciseSeries([w('b', 2, [[110, 1]]), w('a', 1, [[100, 5]])], 'bench');
    expect(s.map((p) => p.maxWeight)).toEqual([100, 110]);
  });
});
