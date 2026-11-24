import { useState } from 'react';

/** Enkel, beroendefri linjegraf i SVG. */
export function LineChart({ points, format, dateFormat }: { points: { x: number; y: number }[]; format: (y: number) => string; dateFormat: (x: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length === 0) return null;
  const W = 340, H = 160, P = { l: 8, r: 8, t: 16, b: 22 };
  const ys = points.map((p) => p.y);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min = min * 0.9; max = max * 1.1 || 1; }
  const pad = (max - min) * 0.1; min -= pad; max += pad;
  const sx = (i: number) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (i / (points.length - 1)) * (W - P.l - P.r));
  const sy = (y: number) => P.t + (1 - (y - min) / (max - min)) * (H - P.t - P.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${sx(points.length - 1)},${H - P.b} L${sx(0)},${H - P.b} Z`;
  const active = hover ?? points.length - 1;

  return (
    <div className="chart">
      <div className="chart-readout">
        <strong>{format(points[active].y)}</strong> <span className="muted small">{dateFormat(points[active].x)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          let best = 0;
          points.forEach((_, i) => { if (Math.abs(sx(i) - x) < Math.abs(sx(best) - x)) best = i; });
          setHover(best);
        }}>
        <path d={area} fill="var(--accent)" opacity="0.12" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={sx(i)} cy={sy(p.y)} r={i === active ? 5 : 3} fill={i === active ? 'var(--accent)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="2" />
        ))}
        <text x={P.l} y={H - 6} className="chart-axis">{dateFormat(points[0].x)}</text>
        {points.length > 1 && <text x={W - P.r} y={H - 6} textAnchor="end" className="chart-axis">{dateFormat(points[points.length - 1].x)}</text>}
      </svg>
    </div>
  );
}
