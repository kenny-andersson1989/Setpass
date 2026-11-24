import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db, uid } from '../db';
import { ExerciseBlock, moveItem, supersetLetters, toggleSuperset } from '../components/ExerciseBlock';
import { ExercisePicker } from '../components/ExercisePicker';
import { Icon } from '../components/Icon';
import { useExercises } from '../lib/exercises';
import { startWorkout } from '../lib/workout';
import { useSettings } from '../settings';
import type { PlannedSet, Routine, RoutineExercise } from '../types';
import { RoutineCard } from './Home';

export function Routines() {
  const { t } = useSettings();
  const routines = useLiveQuery(() => db.routines.orderBy('name').toArray(), []);
  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.tabRoutines}</h1>
        <Link to="/routines/new" className="btn primary sm"><Icon name="plus" size={16} /> {t.newRoutine}</Link>
      </header>
      {routines?.length === 0 && <p className="muted">{t.noRoutines}</p>}
      <div className="list gap">{routines?.map((r) => <RoutineCard key={r.id} r={r} />)}</div>
    </div>
  );
}

export const newPlannedSet = (last?: PlannedSet): PlannedSet =>
  last ? { type: last.type === 'warmup' ? 'normal' : last.type, reps: last.reps, weight: last.weight, duration: last.duration } : { type: 'normal' };

export function RoutineEditor() {
  const { id } = useParams();
  const isNew = id === 'new';
  const nav = useNavigate();
  const { t, settings } = useSettings();
  const { byId } = useExercises();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    if (isNew) {
      setRoutine({ id: uid(), name: '', exercises: [], createdAt: Date.now(), updatedAt: Date.now() });
    } else db.routines.get(id!).then((r) => (r ? setRoutine(r) : nav('/routines', { replace: true })));
  }, [id, isNew, nav]);

  if (!routine) return <div className="page"><p className="muted">{t.loading}</p></div>;

  const set = (patch: Partial<Routine>) => { setRoutine({ ...routine, ...patch }); };
  const setExercises = (exercises: RoutineExercise[]) => set({ exercises });
  const letters = supersetLetters(routine.exercises);

  const save = async () => {
    const r = { ...routine, name: routine.name.trim() || t.newRoutine, updatedAt: Date.now() };
    await db.routines.put(r);
    return r;
  };

  return (
    <div className="page">
      <header className="page-head sticky">
        <button className="btn ghost" onClick={() => nav(-1)}><Icon name="back" /> {t.back}</button>
        <button className="btn primary sm" onClick={async () => { await save(); nav('/routines'); }}>{t.save}</button>
      </header>
      <input className="title-input" placeholder={t.routineName} value={routine.name} autoFocus={isNew}
        onChange={(e) => set({ name: e.target.value })} />

      <div className="list gap">
        {routine.exercises.map((ex, i) => (
          <ExerciseBlock key={ex.uid} item={ex} exercise={byId.get(ex.exerciseId)} newSet={newPlannedSet}
            supersetLetter={letters[i]} linkedToNext={!!ex.supersetId && routine.exercises[i + 1]?.supersetId === ex.supersetId}
            canMoveUp={i > 0} canMoveDown={i < routine.exercises.length - 1}
            onChange={(item) => setExercises(routine.exercises.map((x, j) => (j === i ? (item as RoutineExercise) : x)))}
            onRemove={() => setExercises(routine.exercises.filter((_, j) => j !== i))}
            onMove={(dir) => setExercises(moveItem(routine.exercises, i, dir))}
            onToggleSuperset={i < routine.exercises.length - 1 ? () => setExercises(toggleSuperset(routine.exercises, i, uid)) : undefined} />
        ))}
      </div>
      <button className="btn ghost wide" onClick={() => setPicker(true)}><Icon name="plus" /> {t.addExercise}</button>

      {!isNew && (
        <div className="row gap top">
          <button className="btn primary wide" onClick={async () => { const r = await save(); await startWorkout(r); nav('/workout'); }}>
            <Icon name="play" size={16} /> {t.start}
          </button>
          <button className="btn danger" onClick={async () => {
            if (confirm(t.confirmDelete)) { await db.routines.delete(routine.id); nav('/routines', { replace: true }); }
          }}><Icon name="trash" size={18} /></button>
        </div>
      )}

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={(ids) =>
        setExercises([...routine.exercises, ...ids.map((exerciseId) => ({
          uid: uid(), exerciseId, restSec: settings.defaultRest,
          sets: [{ type: 'normal' as const, reps: 10 }, { type: 'normal' as const, reps: 10 }, { type: 'normal' as const, reps: 10 }]
        }))])} />
    </div>
  );
}
