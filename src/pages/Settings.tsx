import { useRef, useState } from 'react';
import { exportData, importData } from '../db';
import { fmtSec, REST_OPTIONS } from '../components/Inputs';
import { useSettings, type Lang, type Theme, type Unit } from '../settings';

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented">
      {options.map((o) => <button key={o.v} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>)}
    </div>
  );
}

export function Settings() {
  const { t, settings, update } = useSettings();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const doExport = async () => {
    const blob = new Blob([JSON.stringify(await exportData(), null, 1)], { type: 'application/json' });
    const name = `setpass-${new Date().toISOString().slice(0, 10)}.json`;
    const f = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [f] })) {
      try { await navigator.share({ files: [f] }); return; } catch { /* avbrutet */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="page">
      <header className="page-head"><h1>{t.tabSettings}</h1></header>
      <div className="card settings">
        <div className="setting"><span>{t.language}</span>
          <Segmented<Lang> value={settings.lang} onChange={(lang) => update({ lang })} options={[{ v: 'sv', label: 'Svenska' }, { v: 'en', label: 'English' }]} />
        </div>
        <div className="setting"><span>{t.theme}</span>
          <Segmented<Theme> value={settings.theme} onChange={(theme) => update({ theme })}
            options={[{ v: 'system', label: t.themeSystem }, { v: 'light', label: t.themeLight }, { v: 'dark', label: t.themeDark }]} />
        </div>
        <div className="setting"><span>{t.units}</span>
          <Segmented<Unit> value={settings.unit} onChange={(unit) => update({ unit })} options={[{ v: 'kg', label: 'kg' }, { v: 'lb', label: 'lb' }]} />
        </div>
        <label className="setting"><span>{t.defaultRest}</span>
          <select value={settings.defaultRest} onChange={(e) => update({ defaultRest: Number(e.target.value) })}>
            {REST_OPTIONS.map((s) => <option key={s} value={s}>{s ? fmtSec(s) : t.restOff}</option>)}
          </select>
        </label>
        <label className="setting"><span>{t.sound}</span>
          <input type="checkbox" className="switch" checked={settings.sound} onChange={(e) => update({ sound: e.target.checked })} />
        </label>
        <label className="setting"><span>{t.vibration}</span>
          <input type="checkbox" className="switch" checked={settings.vibration} onChange={(e) => update({ vibration: e.target.checked })} />
        </label>
      </div>

      <h2>{t.backup}</h2>
      <div className="row gap">
        <button className="btn ghost wide" onClick={doExport}>{t.exportData}</button>
        <button className="btn ghost wide" onClick={() => file.current?.click()}>{t.importData}</button>
      </div>
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try { await importData(JSON.parse(await f.text())); setMsg(t.importOk); } catch { setMsg(t.importFail); }
        e.target.value = '';
      }} />
      {msg && <p className="toast">{msg}</p>}

      <h2>{t.about}</h2>
      <p className="muted small">{t.installHint}</p>
      <p className="muted small">{t.aboutText} <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">github.com/yuhonas/free-exercise-db</a></p>
      <p className="muted small">Setpass v{__APP_VERSION__}</p>
    </div>
  );
}
