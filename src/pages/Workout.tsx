import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, uid } from '../db';
import { ExerciseBlock, moveItem, supersetLetters, toggleSuperset } from '../components/ExerciseBlock';
import { ExercisePicker } from '../components/ExercisePicker';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { RestTimer, useNow } from '../components/RestTimer';
import { displayName, trackTypeOf, useExercises } from '../lib/exercises';
import { unlockAudio } from '../lib/sound';
import { doneSets, newPrs, workoutVolume, type PrKind } from '../lib/stats';
import { fmtDuration, fmtVolume } from '../lib/units';
import { discardWorkout, finishWorkout, lastSetsFor, mutateActive, newWorkoutExercise, restAfter, workoutToRoutineExercises } from '../lib/workout';
import { useSettings } from '../settings';
import type { Workout as W, WorkoutExercise, WorkoutSet } from '../types';

/** Behåll den senast sparade avbockningen per set (skyddar mot gamla värden från ett snabbt tryck). */
const mergeDone = (next: WorkoutSet[], cur: WorkoutSet[]) =>
  next.map((s) => { const c = cur.find((x) => x.uid === s.uid); return c ? { ...s, done: c.done } : s; });

const newWorkoutSet = (last?: WorkoutSet): WorkoutSet => ({
  uid: uid(), done: false, type: last?.type === 'warmup' || !last ? 'normal' : last.type,
  reps: last?.reps, weight: last?.weight, duration: last?.duration
});

export function Workout() {
  const { t, settings } = useSettings();
  const nav = useNavigate();
  const active = useLiveQuery(() => db.active.get('current'), []);
  const { byId } = useExercises();
  const now = useNow(1000);
  const [picker, setPicker] = useState(false);
  const [previous, setPrevious] = useState<Record<string, WorkoutSet[]>>({});
  const [summary, setSummary] = useState<{ w: W; prs: { exerciseId: string; kinds: PrKind[] }[] } | null>(null);

  const exIds = useMemo(() => active?.exercises.map((e) => e.exerciseId).join('|') ?? '', [active]);
  useEffect(() => {
    if (!exIds) return;
    Promise.all(exIds.split('|').map(async (id) => [id, await lastSetsFor(id)] as const)).then((pairs) => setPrevious(Object.fromEntries(pairs)));
  }, [exIds]);


  if (summary) return <Summary {...summary} onClose={() => nav(`/history/${summary.w.id}`, { replace: true })} />;
  if (active === undefined) return <div className="page"><p className="muted">{t.loading}</p></div>;
  if (!active) {
    return <div className="page"><p className="muted">{t.noHistory}</p><button className="btn primary" onClick={() => nav('/')}>{t.back}</button></div>;
  }

  const setExercises = (fn: (list: WorkoutExercise[]) => WorkoutExercise[]) => mutateActive((w) => ({ ...w, exercises: fn(w.exercises) }));
  const letters = supersetLetters(active.exercises);

  const onSetDone = (exUid: string, setIndex: number, done: boolean) => {
    unlockAudio();
    void mutateActive((w) => {
      const exIndex = w.exercises.findIndex((e) => e.uid === exUid);
      if (exIndex < 0) return w;
      const ex = w.exercises[exIndex];
      const prev = previous[ex.exerciseId]?.[setIndex];
      const tt = trackTypeOf(byId.get(ex.exerciseId));
      const exercises = w.exercises.map((e, i) => i !== exIndex ? e : {
        ...e,
        sets: e.sets.map((s, j) => {
          if (j !== setIndex) return s;
          const filled = { ...s, done };
          // Tomma fält fylls med förra passets värden, som i Hevy
          if (done && prev) {
            if (filled.weight === undefined && tt !== 'duration') filled.weight = prev.weight;
            if (filled.reps === undefined && tt !== 'duration') filled.reps = prev.reps;
            if (filled.duration === undefined && tt === 'duration') filled.duration = prev.duration;
          }
          return filled;
        })
      });
      const rest = done ? restAfter(exercises, exIndex) : 0;
      return { ...w, exercises, ...(rest ? { restEndsAt: Date.now() + rest * 1000, restTotal: rest } : {}) };
    });
  };

  const finish = async () => {
    const open = active.exercises.some((e) => e.sets.some((s) => !s.done));
    if (!confirm(t.finishConfirm + (open ? `\n\n${t.unfinishedSets}` : ''))) return;
    const previousWorkouts = await db.workouts.toArray();
    const w = await finishWorkout(active);
    setSummary({ w, prs: newPrs(w, previousWorkouts) });
  };

  return (
    <div className="page workout-page">
      <header className="page-head sticky">
        <button className="btn ghost sm" onClick={() => nav('/')}><Icon name="down" /></button>
        <div className="workout-clock"><Icon name="clock" size={16} /> {fmtDuration((now - active.startedAt) / 1000)}</div>
        <button className="btn primary sm" onClick={finish}>{t.finish}</button>
      </header>
      <input className="title-input" value={active.name} aria-label={t.workoutName} onChange={(e) => { const name = e.target.value; void mutateActive((w) => ({ ...w, name })); }} />
      <div className="stats-row">
        <div className="stat"><strong>{fmtVolume(workoutVolume(active), settings.unit)}</strong><span className="muted small">{t.volume}</span></div>
        <div className="stat"><strong>{doneSets(active)}</strong><span className="muted small">{t.sets}</span></div>
      </div>

      <div className="list gap">
        {active.exercises.map((ex, i) => (
          <ExerciseBlock key={ex.uid} live item={ex} exercise={byId.get(ex.exerciseId)} previous={previous[ex.exerciseId]}
            newSet={newWorkoutSet} supersetLetter={letters[i]}
            linkedToNext={!!ex.supersetId && active.exercises[i + 1]?.supersetId === ex.supersetId}
            canMoveUp={i > 0} canMoveDown={i < active.exercises.length - 1}
            onChange={(item) => setExercises((list) => list.map((x) => (x.uid === ex.uid ? { ...(item as WorkoutExercise), sets: mergeDone(item.sets as WorkoutSet[], x.sets) } : x)))}
            onRemove={() => setExercises((list) => list.filter((x) => x.uid !== ex.uid))}
            onMove={(dir) => setExercises((list) => moveItem(list, list.findIndex((x) => x.uid === ex.uid), dir))}
            onToggleSuperset={i < active.exercises.length - 1 ? () => setExercises((list) => toggleSuperset(list, list.findIndex((x) => x.uid === ex.uid), uid)) : undefined}
            onSetDone={(si, d) => onSetDone(ex.uid, si, d)} />
        ))}
      </div>

      <button className="btn ghost wide" onClick={() => setPicker(true)}><Icon name="plus" /> {t.addExercise}</button>
      <button className="btn danger-ghost wide" onClick={async () => { if (confirm(t.discardConfirm)) { await discardWorkout(); nav('/'); } }}>{t.discard}</button>

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={async (ids) => {
        const added = await Promise.all(ids.map((id) => newWorkoutExercise(id, settings.defaultRest)));
        await setExercises((list) => [...list, ...added]);
      }} />
      <RestTimer active={active} />
    </div>
  );
}

function Summary({ w, prs, onClose }: { w: W; prs: { exerciseId: string; kinds: PrKind[] }[]; onClose: () => void }) {
  const { t, settings } = useSettings();
  const { byId } = useExercises();
  const [savedMsg, setSavedMsg] = useState('');
  const kindLabel = (k: PrKind) => ({ weight: t.prWeight, e1rm: t.prE1rm, reps: t.prReps, volume: t.prVolume, duration: t.prDuration })[k];

  const saveRoutine = async () => {
    if (w.routineId) {
      const r = await db.routines.get(w.routineId);
      if (r) await db.routines.put({ ...r, exercises: workoutToRoutineExercises(w), updatedAt: Date.now() });
    } else {
      await db.routines.put({ id: uid(), name: w.name, exercises: workoutToRoutineExercises(w), createdAt: Date.now(), updatedAt: Date.now() });
    }
    setSavedMsg('✓');
  };

  return (
    <Modal open onClose={onClose}>
      <div className="summary">
        <div className="summary-icon"><Icon name="trophy" size={40} /></div>
        <h2>{t.workoutDone}</h2>
        <div className="stats-row">
          <div className="stat"><strong>{fmtDuration(((w.endedAt ?? 0) - w.startedAt) / 1000)}</strong><span className="muted small">{t.duration}</span></div>
          <div className="stat"><strong>{fmtVolume(workoutVolume(w), settings.unit)}</strong><span className="muted small">{t.volume}</span></div>
          <div className="stat"><strong>{doneSets(w)}</strong><span className="muted small">{t.sets}</span></div>
        </div>
        {prs.length > 0 && <>
          <h3>{t.newRecords} 🏆</h3>
          <ul className="pr-list">
            {prs.map((p) => <li key={p.exerciseId}><strong>{displayName(byId.get(p.exerciseId), settings.lang)}</strong> <span className="muted small">{p.kinds.map(kindLabel).join(' · ')}</span></li>)}
          </ul>
        </>}
        {w.exercises.length > 0 && (
          <button className="btn ghost wide" disabled={!!savedMsg} onClick={saveRoutine}>
            {w.routineId ? t.updateRoutine : t.saveAsRoutine} {savedMsg}
          </button>
        )}
        <button className="btn primary wide" onClick={onClose}>{t.done}</button>
      </div>
    </Modal>
  );
}
