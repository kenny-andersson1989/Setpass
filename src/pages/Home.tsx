import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Icon } from '../components/Icon';
import { displayName, useExercises } from '../lib/exercises';
import { startWorkout } from '../lib/workout';
import { useSettings } from '../settings';
import type { Routine } from '../types';

export function RoutineCard({ r }: { r: Routine }) {
  const { t, settings } = useSettings();
  const { byId } = useExercises();
  const nav = useNavigate();
  const names = r.exercises.map((e) => displayName(byId.get(e.exerciseId), settings.lang)).join(', ');
  return (
    <div className="card routine-card">
      <Link to={`/routines/${r.id}`} className="routine-card-body">
        <strong>{r.name}</strong>
        <div className="muted small clamp2">{names || t.empty}</div>
      </Link>
      <button className="btn primary sm" onClick={async () => { await startWorkout(r); nav('/workout'); }}>
        <Icon name="play" size={14} /> {t.start}
      </button>
    </div>
  );
}

export function Home() {
  const { t } = useSettings();
  const nav = useNavigate();
  const routines = useLiveQuery(() => db.routines.orderBy('updatedAt').reverse().toArray(), []);
  const weekCount = useLiveQuery(() => db.workouts.where('startedAt').above(Date.now() - 7 * 864e5).count(), []);
  const total = useLiveQuery(() => db.workouts.count(), []);

  return (
    <div className="page">
      <header className="page-head"><h1>{t.tabTrain}</h1></header>
      <div className="stats-row">
        <div className="stat"><strong>{weekCount ?? 0}</strong><span className="muted small">{t.weekdayStreak}</span></div>
        <div className="stat"><strong>{total ?? 0}</strong><span className="muted small">{t.workoutsTotal}</span></div>
      </div>
      <h2>{t.quickStart}</h2>
      <button className="btn primary wide lg" onClick={async () => { await startWorkout(undefined, t.emptyWorkout); nav('/workout'); }}>
        <Icon name="plus" /> {t.startEmpty}
      </button>
      <div className="section-head">
        <h2>{t.myRoutines}</h2>
        <Link to="/routines/new" className="btn ghost sm"><Icon name="plus" size={16} /> {t.newRoutine}</Link>
      </div>
      {routines?.length === 0 && <p className="muted">{t.noRoutines}</p>}
      <div className="list gap">{routines?.map((r) => <RoutineCard key={r.id} r={r} />)}</div>
    </div>
  );
}
