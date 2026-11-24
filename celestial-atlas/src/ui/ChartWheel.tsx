import type { WheelGeometry } from './wheel';

const GLYPH_FONT = "'Noto Sans Symbols','Noto Sans Symbols 2',serif";
const UI_FONT = "'Work Sans',sans-serif";

/** The natal wheel as SVG with real text nodes. Font sizes match the prototype's overlay. */
export function ChartWheel({ wheel, label }: { wheel: WheelGeometry; label: string }) {
  return (
    <svg viewBox="-18 -18 436 436" role="img" aria-label={label} style={{ width: '100%', maxWidth: 460, display: 'block' }}>
      <circle cx="200" cy="200" r="196" fill="none" stroke="rgba(201,163,90,0.25)" strokeWidth="1" />
      {wheel.segments.map(s => <path key={s.sign} d={s.d} fill={s.fill} stroke="rgba(201,163,90,0.55)" strokeWidth="0.8" />)}
      <circle cx="200" cy="200" r="132" fill="rgba(10,17,40,0.6)" stroke="rgba(201,163,90,0.5)" strokeWidth="0.8" />
      <circle cx="200" cy="200" r="62" fill="#0b1430" stroke="rgba(201,163,90,0.45)" strokeWidth="0.8" />
      {wheel.degTicks.map((t, i) => <line key={i} {...t} stroke="rgba(201,163,90,0.45)" strokeWidth="0.6" />)}
      {wheel.segLines.map((l, i) => <line key={i} {...l} stroke="rgba(201,163,90,0.5)" strokeWidth="0.8" />)}
      {wheel.houseLines.map(h => (
        <line key={h.evidenceId} data-evidence={h.evidenceId} x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} stroke="#c9a35a" strokeWidth={h.w} opacity={h.op} />
      ))}
      {wheel.aspectLines.map(a => (
        <line key={a.evidenceId} data-evidence={a.evidenceId} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke={a.stroke} strokeWidth="1"
          strokeDasharray={a.dash === 'none' ? undefined : a.dash} opacity="0.85" />
      ))}
      {wheel.angles.map(a => (
        <g key={a.label} data-evidence={a.evidenceId}>
          <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="#efe6d2" strokeWidth="1.6" />
          <text x={a.lx} y={a.ly} fill="#efe6d2" fontSize="10" fontFamily={UI_FONT} fontWeight="600" textAnchor="middle" dominantBaseline="central">{a.label}</text>
        </g>
      ))}
      {wheel.signGlyphs.map(g => (
        <text key={g.name} x={g.x} y={g.y} fill="#e3c27e" fontSize="17" fontFamily={GLYPH_FONT} textAnchor="middle" dominantBaseline="central">{g.glyph}</text>
      ))}
      {wheel.houseNums.map(n => (
        <text key={n.n} x={n.x} y={n.y} fill="#8d96b3" fontSize="9.2" fontFamily={UI_FONT} textAnchor="middle" dominantBaseline="central">{n.n}</text>
      ))}
      {wheel.planets.map(p => (
        <g key={p.evidenceId} data-evidence={p.evidenceId}>
          <line x1={p.tx1} y1={p.ty1} x2={p.tx2} y2={p.ty2} stroke="#e3c27e" strokeWidth="1.2" />
          <circle cx={p.ax} cy={p.ay} r="2.2" fill="#e3c27e" />
          <text x={p.x} y={p.y} fill="#efe6d2" fontSize="18" fontFamily={GLYPH_FONT} textAnchor="middle" dominantBaseline="central">{p.glyph}</text>
          <text x={p.lx} y={p.ly} fill="#aeb6cc" fontSize="9.2" fontFamily={UI_FONT} textAnchor="middle" dominantBaseline="central">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}
