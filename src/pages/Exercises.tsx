import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db, uid } from '../db';
import { ExerciseList, ExerciseRow, FilterBar, useFilter } from '../components/ExercisePicker';
import { ExerciseImage } from '../components/ExerciseImage';
import { Icon } from '../components/Icon';
import { fmtSec } from '../components/Inputs';
import { LineChart } from '../components/LineChart';
import { Modal } from '../components/Modal';
import { displayName, filterExercises, trackTypeOf, useExercises } from '../lib/exercises';
import { exerciseSeries } from '../lib/stats';
import { fmtVolume, fmtWeight } from '../lib/units';
import { categories, equipment, muscles } from '../i18n/terms';
import { useSettings } from '../settings';
import type { Exercise, TrackType } from '../types';
import { setLabels } from '../components/ExerciseBlock';

export function Exercises() {
  const { t } = useSettings();
  const { all, ready } = useExercises();
  const [filter, setFilter] = useFilter();
  const nav = useNavigate();
  const items = useMemo(() => filterExercises(all, filter), [all, filter]);
  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.tabExercises}</h1>
        <Link to="/exercises/custom/new" className="btn ghost sm"><Icon name="plus" size={16} /> {t.customExercise}</Link>
      </header>
      <FilterBar filter={filter} setFilter={setFilter} />
      {!ready ? <p className="muted">{t.loading}</p> :
        <ExerciseList items={items} render={(e) => (
          <ExerciseRow key={e.id} e={e} onClick={() => nav(`/exercises/${encodeURIComponent(e.id)}`)}
            trailing={<span className="muted"><Icon name="chevron" size={18} /></span>} />
        )} />}
    </div>
  );
}

type Metric = 'e1rm' | 'maxWeight' | 'volume' | 'reps' | 'duration';

export function ExerciseDetail() {
  const { id } = useParams();
  const exId = decodeURIComponent(id!);
  const { t, term, settings } = useSettings();
  const { byId, ready } = useExercises();
  const nav = useNavigate();
  const e = byId.get(exId);
  const workouts = useLiveQuery(() => db.workouts.orderBy('startedAt').toArray(), []);
  const routines = useLiveQuery(() => db.routines.orderBy('name').toArray(), []);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState('');
  const tt = trackTypeOf(e);
  const [metric, setMetric] = useState<Metric>(tt === 'duration' ? 'duration' : tt === 'reps' ? 'reps' : 'e1rm');
  useEffect(() => { setMetric(tt === 'duration' ? 'duration' : tt === 'reps' ? 'reps' : 'e1rm'); }, [tt]);

  const series = useMemo(() => (workouts ? exerciseSeries(workouts, exId) : []), [workouts, exId]);
  if (!ready) return <div className="page"><p className="muted">{t.loading}</p></div>;
  if (!e) return <div className="page"><p>404</p><Link to="/exercises">{t.back}</Link></div>;

  const unit = settings.unit;
  const best = (k: Metric) => Math.max(0, ...series.map((p) => p[k]));
  const fmtMetric = (k: Metric, v: number) =>
    k === 'volume' ? fmtVolume(v, unit) : k === 'reps' ? `${v} ${t.reps.toLowerCase()}` : k === 'duration' ? fmtSec(v) : fmtWeight(v, unit);
  const dateFmt = (x: number) => new Date(x).toLocaleDateString(settings.lang, { day: 'numeric', month: 'short' });
  const metrics: { k: Metric; label: string }[] = tt === 'duration' ? [{ k: 'duration', label: t.bestDuration }]
    : tt === 'reps' ? [{ k: 'reps', label: t.bestReps }, { k: 'maxWeight', label: t.bestWeight }]
    : [{ k: 'e1rm', label: t.bestE1rm }, { k: 'maxWeight', label: t.bestWeight }, { k: 'volume', label: t.volume }, { k: 'reps', label: t.bestReps }];

  const addTo = async (routineId?: string) => {
    let r = routineId ? await db.routines.get(routineId) : undefined;
    if (!r) r = { id: uid(), name: t.newRoutine, exercises: [], createdAt: Date.now(), updatedAt: Date.now() };
    r.exercises.push({
      uid: uid(), exerciseId: e.id, restSec: settings.defaultRest,
      sets: Array.from({ length: 3 }, () => (tt === 'duration' ? { type: 'normal' as const, duration: 60 } : { type: 'normal' as const, reps: 10 }))
    });
    r.updatedAt = Date.now();
    await db.routines.put(r);
    setAddOpen(false);
    if (!routineId) nav(`/routines/${r.id}`);
    else { setToast(`${t.addedTo} ${r.name}`); setTimeout(() => setToast(''), 2200); }
  };

  return (
    <div className="page">
      <header className="page-head sticky">
        <button className="btn ghost" onClick={() => nav(-1)}><Icon name="back" /> {t.back}</button>
        {e.custom && <Link className="btn ghost sm" to={`/exercises/custom/${encodeURIComponent(e.id)}`}><Icon name="edit" size={16} /> {t.edit}</Link>}
      </header>
      <ExerciseImage exercise={e} />
      <h1 className="detail-title">{displayName(e, settings.lang)}</h1>
      {settings.lang === 'sv' && e.nameSv && <p className="muted small">{e.name}</p>}

      <button className="btn primary wide" onClick={() => setAddOpen(true)}><Icon name="plus" /> {t.addToRoutine}</button>
      {toast && <div className="toast">{toast}</div>}

      <div className="tags">
        {e.primaryMuscles.map((m) => <span key={m} className="tag accent">{term('muscle', m)}</span>)}
        {e.secondaryMuscles.map((m) => <span key={m} className="tag">{term('muscle', m)}</span>)}
        <span className="tag">{term('equipment', e.equipment)}</span>
        <span className="tag">{term('category', e.category)}</span>
        {e.level && <span className="tag">{term('level', e.level)}</span>}
      </div>

      <h2>{t.records}</h2>
      {series.length === 0 ? <p className="muted">{t.noData}</p> : (
        <>
          <div className="stats-row wrap">
            {metrics.map((m) => (
              <button key={m.k} className={metric === m.k ? 'stat sel' : 'stat'} onClick={() => setMetric(m.k)}>
                <strong>{fmtMetric(m.k, best(m.k))}</strong><span className="muted small">{m.label}</span>
              </button>
            ))}
          </div>
          <h2>{t.progress}</h2>
          <div className="card">
            <LineChart points={series.map((p) => ({ x: p.date, y: p[metric] }))} format={(v) => fmtMetric(metric, v)} dateFormat={dateFmt} />
          </div>
          <h2>{t.history}</h2>
          <div className="list gap">
            {[...series].reverse().slice(0, 20).map((p) => (
              <Link key={p.workoutId} to={`/history/${p.workoutId}`} className="card hist-mini">
                <strong className="small">{new Date(p.date).toLocaleDateString(settings.lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                <div className="small muted">
                  {setLabels(p.sets).map((l, i) => {
                    const s = p.sets[i];
                    return <span key={i} className="set-chip">{l}: {tt === 'duration' ? fmtSec(s.duration) : tt === 'reps' ? `${s.reps ?? 0}` : `${fmtWeight(s.weight ?? 0, unit)} × ${s.reps ?? 0}`}</span>;
                  })}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {e.instructions.length > 0 && <>
        <h2>{t.instructions}</h2>
        {settings.lang === 'sv' && !e.custom && t.instructionsEnglishOnly && <p className="muted small">{t.instructionsEnglishOnly}</p>}
        <ol className="instructions">{e.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </>}

      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <div className="sheet-title">{t.chooseRoutine}</div>
        <div className="sheet-actions">
          {routines?.map((r) => <button key={r.id} className="sheet-btn" onClick={() => addTo(r.id)}>{r.name}</button>)}
          <button className="sheet-btn accent" onClick={() => addTo()}>{t.createNewRoutine}</button>
        </div>
      </Modal>
    </div>
  );
}

export function CustomExerciseEditor() {
  const { id } = useParams();
  const isNew = id === 'new';
  const { t, term } = useSettings();
  const nav = useNavigate();
  const [e, setE] = useState<Exercise>({
    id: 'custom_' + uid(), name: '', category: 'strength', equipment: 'barbell', level: 'beginner',
    primaryMuscles: ['chest'], secondaryMuscles: [], instructions: [], images: [], custom: true, trackType: 'weight_reps'
  });
  useEffect(() => { if (!isNew) db.customExercises.get(decodeURIComponent(id!)).then((x) => x && setE(x)); }, [id, isNew]);

  const onImage = (file?: File) => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'), s = Math.min(1, 600 / Math.max(img.width, img.height));
      c.width = img.width * s; c.height = img.height * s;
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      setE((x) => ({ ...x, images: [...x.images, c.toDataURL('image/jpeg', 0.8)].slice(-2) }));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  const save = async () => {
    if (!e.name.trim()) return;
    await db.customExercises.put({ ...e, name: e.name.trim(), nameSv: e.name.trim() });
    nav(`/exercises/${encodeURIComponent(e.id)}`, { replace: true });
  };

  return (
    <div className="page">
      <header className="page-head sticky">
        <button className="btn ghost" onClick={() => nav(-1)}><Icon name="back" /> {t.back}</button>
        <button className="btn primary sm" disabled={!e.name.trim()} onClick={save}>{t.save}</button>
      </header>
      <h1>{isNew ? t.newCustomExercise : t.edit}</h1>
      <div className="form">
        <label>{t.exerciseName}<input value={e.name} autoFocus onChange={(ev) => setE({ ...e, name: ev.target.value })} /></label>
        <label>{t.trackType}
          <select value={e.trackType} onChange={(ev) => setE({ ...e, trackType: ev.target.value as TrackType })}>
            <option value="weight_reps">{t.trackWeightReps}</option>
            <option value="reps">{t.trackReps}</option>
            <option value="duration">{t.trackDuration}</option>
          </select>
        </label>
        <label>{t.primary}
          <select value={e.primaryMuscles[0]} onChange={(ev) => setE({ ...e, primaryMuscles: [ev.target.value] })}>
            {Object.keys(muscles).map((k) => <option key={k} value={k}>{term('muscle', k)}</option>)}
          </select>
        </label>
        <label>{t.equipment}
          <select value={e.equipment} onChange={(ev) => setE({ ...e, equipment: ev.target.value })}>
            {Object.keys(equipment).map((k) => <option key={k} value={k}>{term('equipment', k)}</option>)}
          </select>
        </label>
        <label>{t.category}
          <select value={e.category} onChange={(ev) => setE({ ...e, category: ev.target.value })}>
            {Object.keys(categories).map((k) => <option key={k} value={k}>{term('category', k)}</option>)}
          </select>
        </label>
        <label>{t.instructions}
          <textarea rows={4} value={e.instructions.join('\n')} onChange={(ev) => setE({ ...e, instructions: ev.target.value.split('\n') })} />
        </label>
        <label>{t.images}
          <input type="file" accept="image/*" onChange={(ev) => onImage(ev.target.files?.[0])} />
        </label>
        {e.images.length > 0 && <div className="row gap">
          <ExerciseImage exercise={e} size="thumb" />
          <button className="btn ghost sm" onClick={() => setE({ ...e, images: [] })}>{t.delete}</button>
        </div>}
        {!isNew && <button className="btn danger wide" onClick={async () => {
          if (confirm(t.confirmDelete)) { await db.customExercises.delete(e.id); nav('/exercises', { replace: true }); }
        }}>{t.delete}</button>}
      </div>
    </div>
  );
}
