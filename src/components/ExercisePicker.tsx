import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { displayName, filterExercises, useExercises, type Filter } from '../lib/exercises';
import { muscles, equipment, categories } from '../i18n/terms';
import { useSettings } from '../settings';
import { ExerciseImage } from './ExerciseImage';
import { Icon } from './Icon';
import { Modal } from './Modal';
import type { Exercise } from '../types';

export function useFilter() {
  return useState<Filter>({ q: '', muscle: '', equipment: '', category: '' });
}

export function FilterBar({ filter, setFilter }: { filter: Filter; setFilter: (f: Filter) => void }) {
  const { t, term } = useSettings();
  return (
    <div className="filterbar">
      <div className="search">
        <Icon name="search" size={18} />
        <input type="search" placeholder={t.search} value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
      </div>
      <div className="chips">
        <select value={filter.muscle} onChange={(e) => setFilter({ ...filter, muscle: e.target.value })} className={filter.muscle ? 'on' : ''}>
          <option value="">{t.allMuscles}</option>
          {Object.keys(muscles).map((k) => <option key={k} value={k}>{term('muscle', k)}</option>)}
        </select>
        <select value={filter.equipment} onChange={(e) => setFilter({ ...filter, equipment: e.target.value })} className={filter.equipment ? 'on' : ''}>
          <option value="">{t.allEquipment}</option>
          {Object.keys(equipment).map((k) => <option key={k} value={k}>{term('equipment', k)}</option>)}
        </select>
        <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} className={filter.category ? 'on' : ''}>
          <option value="">{t.allCategories}</option>
          {Object.keys(categories).map((k) => <option key={k} value={k}>{term('category', k)}</option>)}
        </select>
      </div>
    </div>
  );
}

export function ExerciseRow({ e, onClick, selected, trailing }: { e: Exercise; onClick?: () => void; selected?: boolean; trailing?: React.ReactNode }) {
  const { settings, term, t } = useSettings();
  return (
    <button className={selected ? 'ex-row selected' : 'ex-row'} onClick={onClick}>
      <ExerciseImage exercise={e} size="thumb" animate={false} />
      <div className="ex-row-text">
        <div className="ex-row-name">{displayName(e, settings.lang)} {e.custom && <span className="badge">{t.customBadge}</span>}</div>
        <div className="muted small">{e.primaryMuscles.map((m) => term('muscle', m)).join(', ')} · {term('equipment', e.equipment)}</div>
      </div>
      {trailing ?? (selected ? <span className="check-circle on"><Icon name="check" size={16} /></span> : null)}
    </button>
  );
}

/** Lista med "visa fler"-paginering för att hålla det snabbt på mobil. */
export function ExerciseList({ items, render }: { items: Exercise[]; render: (e: Exercise) => React.ReactNode }) {
  const [limit, setLimit] = useState(60);
  const { t } = useSettings();
  return (
    <>
      <div className="muted small list-count">{items.length} {t.results}</div>
      <div className="list">{items.slice(0, limit).map(render)}</div>
      {items.length > limit && <button className="btn ghost wide" onClick={() => setLimit(limit + 100)}>…</button>}
    </>
  );
}

export function ExercisePicker({ open, onClose, onPick, multi = true }: { open: boolean; onClose: () => void; onPick: (ids: string[]) => void; multi?: boolean }) {
  const { t } = useSettings();
  const { all, ready } = useExercises();
  const [filter, setFilter] = useFilter();
  const [sel, setSel] = useState<string[]>([]);
  const items = useMemo(() => filterExercises(all, filter), [all, filter]);

  const close = () => { setSel([]); onClose(); };
  const toggle = (id: string) => {
    if (!multi) { onPick([id]); close(); return; }
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <Modal open={open} onClose={close} full>
      <div className="modal-head">
        <button className="btn ghost" onClick={close}>{t.cancel}</button>
        <strong>{t.addExercise}</strong>
        <button className="btn primary sm" disabled={!sel.length} onClick={() => { onPick(sel); close(); }}>
          {t.add}{sel.length ? ` (${sel.length})` : ''}
        </button>
      </div>
      <div className="modal-body">
        <FilterBar filter={filter} setFilter={setFilter} />
        <Link to="/exercises/custom/new" className="btn ghost wide" onClick={close}>{t.newCustomExercise}</Link>
        {!ready ? <p className="muted">{t.loading}</p> : (
          <ExerciseList items={items} render={(e) => <ExerciseRow key={e.id} e={e} selected={sel.includes(e.id)} onClick={() => toggle(e.id)} />} />
        )}
      </div>
    </Modal>
  );
}
