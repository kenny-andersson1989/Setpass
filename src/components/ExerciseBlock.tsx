import { useState } from 'react';
import { Link } from 'react-router-dom';
import { displayName, trackTypeOf } from '../lib/exercises';
import { fmtWeight, fromDisplay, toDisplay } from '../lib/units';
import { useSettings } from '../settings';
import type { Exercise, PlannedSet, SetType, WorkoutSet } from '../types';
import { ExerciseImage } from './ExerciseImage';
import { Icon } from './Icon';
import { DurationInput, fmtSec, NumInput, REST_OPTIONS } from './Inputs';
import { ActionSheet } from './Modal';

type AnySet = PlannedSet & Partial<Pick<WorkoutSet, 'done' | 'uid'>>;
export interface BlockItem<S extends AnySet> { uid: string; exerciseId: string; sets: S[]; restSec: number; supersetId?: string; note?: string }

const TYPES: SetType[] = ['normal', 'warmup', 'drop', 'failure'];

export function setLabels(sets: AnySet[]) {
  let n = 0;
  return sets.map((s) => (s.type === 'warmup' ? 'W' : s.type === 'drop' ? 'D' : s.type === 'failure' ? `${++n}F` : String(++n)));
}

interface Props<S extends AnySet> {
  exercise?: Exercise;
  item: BlockItem<S>;
  live?: boolean;
  previous?: WorkoutSet[];
  supersetLetter?: string;
  linkedToNext?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (item: BlockItem<S>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onToggleSuperset?: () => void;
  onSetDone?: (setIndex: number, done: boolean) => void;
  newSet: (last?: S) => S;
}

export function ExerciseBlock<S extends AnySet>(p: Props<S>) {
  const { t, settings } = useSettings();
  const [menu, setMenu] = useState(false);
  const [typeMenu, setTypeMenu] = useState<number | null>(null);
  const tt = trackTypeOf(p.exercise);
  const unit = settings.unit;
  const labels = setLabels(p.item.sets);

  const updateSet = (i: number, patch: Partial<PlannedSet>) =>
    p.onChange({ ...p.item, sets: p.item.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const removeSet = (i: number) => p.onChange({ ...p.item, sets: p.item.sets.filter((_, j) => j !== i) });
  const addSet = () => p.onChange({ ...p.item, sets: [...p.item.sets, p.newSet(p.item.sets[p.item.sets.length - 1])] });

  const prevText = (i: number) => {
    const s = p.previous?.[i];
    if (!s) return '—';
    if (tt === 'duration') return fmtSec(s.duration);
    if (tt === 'reps') return `${s.reps ?? 0}${s.weight ? ` +${toDisplay(s.weight, unit)}` : ''}`;
    return `${toDisplay(s.weight ?? 0, unit)} × ${s.reps ?? 0}`;
  };

  return (
    <div className={`card ex-block${p.item.supersetId ? ' in-superset' : ''}${p.linkedToNext ? ' linked' : ''}`}>
      <div className="ex-block-head">
        <Link to={`/exercises/${encodeURIComponent(p.item.exerciseId)}`} className="ex-block-title">
          <ExerciseImage exercise={p.exercise} size="thumb" animate={false} />
          <div>
            <div className="ex-block-name">{displayName(p.exercise, settings.lang)}</div>
            {p.supersetLetter && <span className="badge accent">{t.superset} {p.supersetLetter}</span>}
          </div>
        </Link>
        <button className="icon-btn" aria-label="Meny" onClick={() => setMenu(true)}><Icon name="more" /></button>
      </div>

      <input className="note-input" placeholder={t.note} value={p.item.note ?? ''} onChange={(e) => p.onChange({ ...p.item, note: e.target.value })} />

      <label className="rest-row">
        <Icon name="timer" size={16} /> {t.rest}
        <select value={p.item.restSec} onChange={(e) => p.onChange({ ...p.item, restSec: Number(e.target.value) })}>
          {REST_OPTIONS.map((s) => <option key={s} value={s}>{s ? fmtSec(s) : t.restOff}</option>)}
        </select>
      </label>

      <div className={`sets-grid ${p.live ? 'live' : 'plan'} ${tt}`}>
        <div className="sets-head">
          <span>{t.set}</span>
          {p.live && <span>{t.previous}</span>}
          {tt === 'weight_reps' && <span>{unit}</span>}
          {tt === 'reps' && <span>+{unit}</span>}
          {tt === 'duration' ? <span>{t.time}</span> : <span>{t.reps}</span>}
          <span />
        </div>
        {p.item.sets.map((s, i) => {
          const prev = p.previous?.[i];
          return (
            <div key={s.uid ?? i} className={`set-row${s.done ? ' done' : ''}`}>
              <button className={`set-type t-${s.type}`} onClick={() => setTypeMenu(i)}>{labels[i]}</button>
              {p.live && <span className="prev muted small">{prevText(i)}</span>}
              {tt !== 'duration' && (
                <NumInput ariaLabel={unit} value={toDisplay(s.weight, unit)} placeholder={prev?.weight !== undefined ? String(toDisplay(prev.weight, unit)) : tt === 'reps' ? '0' : unit}
                  onChange={(v) => updateSet(i, { weight: fromDisplay(v, unit) })} />
              )}
              {tt === 'duration'
                ? <DurationInput value={s.duration} placeholder={prev?.duration ? fmtSec(prev.duration) : undefined} onChange={(v) => updateSet(i, { duration: v })} />
                : <NumInput integer ariaLabel={t.reps} value={s.reps} placeholder={prev?.reps !== undefined ? String(prev.reps) : t.reps.toLowerCase()} onChange={(v) => updateSet(i, { reps: v })} />}
              {p.live ? (
                <button className={`check-btn${s.done ? ' on' : ''}`} aria-label={t.done} onClick={() => p.onSetDone?.(i, !s.done)}>
                  <Icon name="check" size={18} />
                </button>
              ) : (
                <button className="icon-btn subtle" aria-label={t.delete} onClick={() => removeSet(i)}><Icon name="x" size={16} /></button>
              )}
            </div>
          );
        })}
      </div>
      <button className="btn ghost wide sm" onClick={addSet}><Icon name="plus" size={16} /> {t.addSet}</button>

      <ActionSheet open={menu} onClose={() => setMenu(false)} title={displayName(p.exercise, settings.lang)} items={[
        ...(p.onToggleSuperset ? [{ label: p.linkedToNext ? t.removeSuperset : t.makeSuperset, onClick: p.onToggleSuperset }] : []),
        ...(p.canMoveUp ? [{ label: t.moveUp, onClick: () => p.onMove(-1) }] : []),
        ...(p.canMoveDown ? [{ label: t.moveDown, onClick: () => p.onMove(1) }] : []),
        { label: t.removeExercise, onClick: p.onRemove, danger: true }
      ]} />
      <ActionSheet open={typeMenu !== null} onClose={() => setTypeMenu(null)} items={[
        ...TYPES.map((ty) => ({
          label: { normal: t.setNormal, warmup: t.setWarmup, drop: t.setDrop, failure: t.setFailure }[ty],
          onClick: () => typeMenu !== null && updateSet(typeMenu, { type: ty })
        })),
        { label: t.delete, danger: true, onClick: () => typeMenu !== null && removeSet(typeMenu) }
      ]} />
    </div>
  );
}

export { fmtWeight };

/** Hjälpare för listor av block: flytta, ta bort, superset-länkning. */
export function moveItem<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function toggleSuperset<T extends { supersetId?: string }>(list: T[], i: number, newId: () => string): T[] {
  const a = list[i], b = list[i + 1];
  if (!b) return list;
  const copy = list.map((x) => ({ ...x }));
  if (a.supersetId && a.supersetId === b.supersetId) {
    // Bryt länken: allt efter i får ett nytt id (eller inget om de blir ensamma)
    const id = a.supersetId;
    const after = newId();
    for (let k = i + 1; k < copy.length && copy[k].supersetId === id; k++) copy[k].supersetId = after;
  } else {
    const id = a.supersetId ?? b.supersetId ?? newId();
    copy[i].supersetId = id;
    const oldB = b.supersetId;
    for (let k = i + 1; k < copy.length && (k === i + 1 || (oldB && copy[k].supersetId === oldB)); k++) copy[k].supersetId = id;
  }
  // Rensa grupper med bara en medlem
  const counts = new Map<string, number>();
  copy.forEach((x) => x.supersetId && counts.set(x.supersetId, (counts.get(x.supersetId) ?? 0) + 1));
  copy.forEach((x) => { if (x.supersetId && counts.get(x.supersetId)! < 2) delete x.supersetId; });
  return copy;
}

/** Bokstav (A, B, C…) per supersetgrupp. */
export function supersetLetters(list: { supersetId?: string }[]) {
  const letters = new Map<string, string>();
  return list.map((x) => {
    if (!x.supersetId) return undefined;
    if (!letters.has(x.supersetId)) letters.set(x.supersetId, String.fromCharCode(65 + letters.size));
    return letters.get(x.supersetId);
  });
}
