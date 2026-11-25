import type { WheelGeometry } from './wheel';

const GLYPH_FONT = "'Noto Sans Symbols','Noto Sans Symbols 2',serif";
const UI_FONT = "'Work Sans',sans-serif";

/** The natal wheel as SVG with real text nodes. Font sizes match the prototype's overlay. */
export function ChartWheel({ wheel, label }: { wheel: WheelGeometry; label: string }) {
  return (
    <svg viewBox="-18 -18 436 436" role="img" aria-label={label} style={{ width: '100%', maxWidth: 460, display: 'block' }}>
      <circle cx="200" cy="200" r="196" fill="none" strokeWidth="1" style={{ stroke: 'rgb(var(--gold-rgb) / 0.25)' }} />
      {wheel.segments.map(s => <path key={s.sign} d={s.d} fill={s.fill} strokeWidth="0.8" style={{ stroke: 'rgb(var(--gold-rgb) / 0.55)' }} />)}
      <circle cx="200" cy="200" r="132" strokeWidth="0.8" style={{ fill: 'rgb(var(--navy-rgb) / 0.6)', stroke: 'rgb(var(--gold-rgb) / 0.5)' }} />
      <circle cx="200" cy="200" r="62" strokeWidth="0.8" style={{ fill: 'var(--wheel-core)', stroke: 'rgb(var(--gold-rgb) / 0.45)' }} />
      {wheel.degTicks.map((t, i) => <line key={i} {...t} strokeWidth="0.6" style={{ stroke: 'rgb(var(--gold-rgb) / 0.45)' }} />)}
      {wheel.segLines.map((l, i) => <line key={i} {...l} strokeWidth="0.8" style={{ stroke: 'rgb(var(--gold-rgb) / 0.5)' }} />)}
      {wheel.houseLines.map(h => (
        <line key={h.evidenceId} data-evidence={h.evidenceId} x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} strokeWidth={h.w} opacity={h.op} style={{ stroke: 'var(--gold)' }} />
      ))}
      {wheel.aspectLines.map(a => (
        <line key={a.evidenceId} data-evidence={a.evidenceId} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} style={{ stroke: a.stroke }} strokeWidth="1"
          strokeDasharray={a.dash === 'none' ? undefined : a.dash} opacity="0.85" />
      ))}
      {wheel.angles.map(a => (
        <g key={a.label} data-evidence={a.evidenceId}>
          <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} strokeWidth="1.6" style={{ stroke: 'var(--ink)' }} />
          <text x={a.lx} y={a.ly} fontSize="10" fontFamily={UI_FONT} fontWeight="600" textAnchor="middle" dominantBaseline="central" style={{ fill: 'var(--ink)' }}>{a.label}</text>
        </g>
      ))}
      {wheel.signGlyphs.map(g => (
        <text key={g.name} x={g.x} y={g.y} fontSize="17" fontFamily={GLYPH_FONT} textAnchor="middle" dominantBaseline="central" style={{ fill: 'var(--gold-bright)' }}>{g.glyph}</text>
      ))}
      {wheel.houseNums.map(n => (
        <text key={n.n} x={n.x} y={n.y} fontSize="9.2" fontFamily={UI_FONT} textAnchor="middle" dominantBaseline="central" style={{ fill: 'var(--dim)' }}>{n.n}</text>
      ))}
      {wheel.planets.map(p => (
        <g key={p.evidenceId} data-evidence={p.evidenceId}>
          <line x1={p.tx1} y1={p.ty1} x2={p.tx2} y2={p.ty2} strokeWidth="1.2" style={{ stroke: 'var(--gold-bright)' }} />
          <circle cx={p.ax} cy={p.ay} r="2.2" style={{ fill: 'var(--gold-bright)' }} />
          <text x={p.x} y={p.y} fontSize="18" fontFamily={GLYPH_FONT} textAnchor="middle" dominantBaseline="central" style={{ fill: 'var(--ink)' }}>{p.glyph}</text>
          <text x={p.lx} y={p.ly} fontSize="9.2" fontFamily={UI_FONT} textAnchor="middle" dominantBaseline="central" style={{ fill: 'var(--muted)' }}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}
