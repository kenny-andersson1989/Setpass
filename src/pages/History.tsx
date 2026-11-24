import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db, uid } from '../db';
import { setLabels } from '../components/ExerciseBlock';
import { ExerciseImage } from '../components/ExerciseImage';
import { Icon } from '../components/Icon';
import { fmtSec } from '../components/Inputs';
import { displayName, trackTypeOf, useExercises } from '../lib/exercises';
import { doneSets, newPrs, workoutVolume } from '../lib/stats';
import { fmtDuration, fmtVolume, fmtWeight } from '../lib/units';
import { workoutToRoutineExercises } from '../lib/workout';
import { useSettings } from '../settings';

export function History() {
  const { t, settings } = useSettings();
  const { byId } = useExercises();
  const workouts = useLiveQuery(() => db.workouts.orderBy('startedAt').reverse().toArray(), []);

  const grouped = useMemo(() => {
    const m = new Map<string, NonNullable<typeof workouts>>();
    for (const w of workouts ?? []) {
      const k = new Date(w.startedAt).toLocaleDateString(settings.lang, { month: 'long', year: 'numeric' });
      m.set(k, [...(m.get(k) ?? []), w]);
    }
    return [...m.entries()];
  }, [workouts, settings.lang]);

  return (
    <div className="page">
      <header className="page-head"><h1>{t.tabHistory}</h1></header>
      {workouts?.length === 0 && <p className="muted">{t.noHistory}</p>}
      {grouped.map(([month, list]) => (
        <section key={month}>
          <h2 className="cap">{month}</h2>
          <div className="list gap">
            {list.map((w) => (
              <Link key={w.id} to={`/history/${w.id}`} className="card hist-card">
                <div className="row between">
                  <strong>{w.name}</strong>
                  <span className="muted small">{new Date(w.startedAt).toLocaleDateString(settings.lang, { weekday: 'short', day: 'numeric' })}</span>
                </div>
                <div className="muted small row gap">
                  <span><Icon name="clock" size={14} /> {fmtDuration(((w.endedAt ?? w.startedAt) - w.startedAt) / 1000)}</span>
                  <span>{fmtVolume(workoutVolume(w), settings.unit)}</span>
                  <span>{doneSets(w)} {t.sets}</span>
                </div>
                <div className="small clamp2">
                  {w.exercises.map((e) => `${e.sets.length} × ${displayName(byId.get(e.exerciseId), settings.lang)}`).join(' · ')}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function WorkoutDetail() {
  const { id } = useParams();
  const { t, settings } = useSettings();
  const { byId } = useExercises();
  const nav = useNavigate();
  const w = useLiveQuery(() => db.workouts.get(id!), [id]);
  const prs = useLiveQuery(async () => {
    if (!w) return [];
    const before = await db.workouts.where('startedAt').below(w.startedAt).toArray();
    return newPrs(w, before);
  }, [w]);

  if (w === undefined) return <div className="page"><p className="muted">{t.loading}</p></div>;
  const prSet = new Set(prs?.map((p) => p.exerciseId));
  const unit = settings.unit;

  return (
    <div className="page">
      <header className="page-head sticky">
        <button className="btn ghost" onClick={() => nav(-1)}><Icon name="back" /> {t.back}</button>
        <button className="icon-btn" aria-label={t.delete} onClick={async () => {
          if (confirm(t.confirmDelete)) { await db.workouts.delete(w.id); nav('/history', { replace: true }); }
        }}><Icon name="trash" /></button>
      </header>
      <h1>{w.name}</h1>
      <p className="muted">{new Date(w.startedAt).toLocaleString(settings.lang, { dateStyle: 'full', timeStyle: 'short' })}</p>
      <div className="stats-row">
        <div className="stat"><strong>{fmtDuration(((w.endedAt ?? w.startedAt) - w.startedAt) / 1000)}</strong><span className="muted small">{t.duration}</span></div>
        <div className="stat"><strong>{fmtVolume(workoutVolume(w), unit)}</strong><span className="muted small">{t.volume}</span></div>
        <div className="stat"><strong>{doneSets(w)}</strong><span className="muted small">{t.sets}</span></div>
      </div>
      <div className="list gap">
        {w.exercises.map((e) => {
          const ex = byId.get(e.exerciseId), tt = trackTypeOf(ex), labels = setLabels(e.sets);
          return (
            <div key={e.uid} className="card">
              <Link to={`/exercises/${encodeURIComponent(e.exerciseId)}`} className="ex-block-title">
                <ExerciseImage exercise={ex} size="thumb" animate={false} />
                <strong>{displayName(ex, settings.lang)} {prSet.has(e.exerciseId) && '🏆'}</strong>
              </Link>
              {e.note && <p className="muted small">{e.note}</p>}
              <table className="hist-table"><tbody>
                {e.sets.map((s, i) => (
                  <tr key={s.uid}>
                    <td className={`set-type t-${s.type}`}>{labels[i]}</td>
                    <td>{tt === 'duration' ? fmtSec(s.duration) : tt === 'reps' ? `${s.reps ?? 0} ${t.reps.toLowerCase()}${s.weight ? ` (+${fmtWeight(s.weight, unit)})` : ''}` : `${fmtWeight(s.weight ?? 0, unit)} × ${s.reps ?? 0}`}</td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          );
        })}
      </div>
      <button className="btn ghost wide" onClick={async () => {
        const rid = uid();
        await db.routines.put({ id: rid, name: w.name, exercises: workoutToRoutineExercises(w), createdAt: Date.now(), updatedAt: Date.now() });
        nav(`/routines/${rid}`);
      }}>{t.saveAsRoutine}</button>
    </div>
  );
}
