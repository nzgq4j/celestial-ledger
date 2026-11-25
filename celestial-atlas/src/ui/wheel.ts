// Chart wheel geometry, ported from the prototype's buildWheel(). Pure function:
// returns SVG coordinates in a 400 x 400 viewBox. Every mark drawn from calculated
// data carries the evidence ID of the fact it shows.
import { SIGNS, type Aspect, type Chart, type Element } from '../engine/atlas';

export const EL_FILL: Record<Element, string> = {
  Fire: 'rgba(227,140,90,0.13)', Earth: 'rgba(150,185,110,0.12)', Air: 'rgba(175,195,235,0.11)', Water: 'rgba(110,150,215,0.15)',
};

export interface WheelBody {
  key: string;
  name: string;
  glyph: string;
  lon: number;
  /** Degree within the sign, or null to hide it (exact degree unknown). */
  deg: number | null;
  evidenceId: string;
}

type Pt = [number, number];

export interface WheelGeometry {
  segments: { d: string; fill: string; sign: string }[];
  signGlyphs: { x: number; y: number; glyph: string; name: string }[];
  segLines: { x1: number; y1: number; x2: number; y2: number }[];
  degTicks: { x1: number; y1: number; x2: number; y2: number }[];
  houseLines: { x1: number; y1: number; x2: number; y2: number; w: number; op: number; evidenceId: string }[];
  houseNums: { x: number; y: number; n: string }[];
  planets: { x: number; y: number; glyph: string; name: string; tx1: number; ty1: number; tx2: number; ty2: number;
    lx: number; ly: number; label: string; ax: number; ay: number; evidenceId: string }[];
  aspectLines: { x1: number; y1: number; x2: number; y2: number; stroke: string; dash: string; evidenceId: string }[];
  angles: { x1: number; y1: number; x2: number; y2: number; lx: number; ly: number; label: string; evidenceId: string }[];
  hasHouses: boolean;
}

/** Theme colours (CSS variables), applied through style props. */
export const ASPECT_COLOR = { soft: 'var(--soft-aspect)', hard: 'var(--hard-aspect)', blend: 'var(--gold-bright)' } as const;

/** `signNames` are the reader's sign names (English by default). */
export function buildWheel(chart: Chart, bodies: WheelBody[], aspects: Aspect[], signNames: readonly string[] = SIGNS.map(x => x.name)): WheelGeometry {
  const C = 200, R0 = 192, R1 = 160, R2 = 132, R3 = 62;
  const asc = chart.rising ? chart.rising.lon : 0;
  const ang = (L: number) => (180 + L - asc) * Math.PI / 180;
  const pt = (L: number, r: number): Pt => { const a = ang(L); return [+(C + r * Math.cos(a)).toFixed(2), +(C - r * Math.sin(a)).toFixed(2)]; };

  const segments: WheelGeometry['segments'] = [], signGlyphs: WheelGeometry['signGlyphs'] = [];
  const segLines: WheelGeometry['segLines'] = [], degTicks: WheelGeometry['degTicks'] = [];
  for (let i = 0; i < 12; i++) {
    const L1 = i * 30, L2 = L1 + 30, [ax, ay] = pt(L1, R0), [bx, by] = pt(L2, R0), [cx, cy] = pt(L2, R1), [dx, dy] = pt(L1, R1);
    segments.push({ d: `M${ax} ${ay} A${R0} ${R0} 0 0 0 ${bx} ${by} L${cx} ${cy} A${R1} ${R1} 0 0 1 ${dx} ${dy} Z`, fill: EL_FILL[SIGNS[i].element], sign: signNames[i] });
    const [gx, gy] = pt(L1 + 15, (R0 + R1) / 2);
    signGlyphs.push({ x: gx, y: gy, glyph: SIGNS[i].glyph, name: signNames[i] });
    const [x1, y1] = pt(L1, R0), [x2, y2] = pt(L1, R2);
    segLines.push({ x1, y1, x2, y2 });
    for (let d = 5; d < 30; d += 5) {
      const [t1x, t1y] = pt(L1 + d, R1), [t2x, t2y] = pt(L1 + d, R1 - (d % 10 === 0 ? 7 : 4));
      degTicks.push({ x1: t1x, y1: t1y, x2: t2x, y2: t2y });
    }
  }

  const houseLines: WheelGeometry['houseLines'] = [], houseNums: WheelGeometry['houseNums'] = [];
  for (const h of chart.houses) {
    const i = h.house - 1, [x1, y1] = pt(h.lon, R2), [x2, y2] = pt(h.lon, R3), [nx, ny] = pt(h.lon + 15, R3 + 12);
    houseLines.push({ x1, y1, x2, y2, w: i % 3 === 0 ? 1.4 : 0.6, op: i % 3 === 0 ? 0.8 : 0.35, evidenceId: h.evidenceId });
    houseNums.push({ x: nx, y: ny, n: String(h.house) });
  }

  // Spread glyphs that would overlap: keep at least 10° between neighbours.
  const sorted = [...bodies].sort((a, b) => a.lon - b.lon), disp: number[] = [];
  sorted.forEach((b, i) => { let d = b.lon; if (i && d - disp[i - 1] < 10) d = disp[i - 1] + 10; disp.push(d); });
  const planets = sorted.map((b, i) => {
    const [x, y] = pt(disp[i], R2 - 22), [tx1, ty1] = pt(b.lon, R1), [tx2, ty2] = pt(b.lon, R2 - 4), [lx, ly] = pt(disp[i], R2 - 44), [ax, ay] = pt(b.lon, R3);
    return { x, y, glyph: b.glyph, name: b.name, tx1, ty1, tx2, ty2, lx, ly, label: b.deg === null ? '' : `${b.deg}°`, ax, ay, evidenceId: b.evidenceId };
  });

  const byKey = new Map(bodies.map(b => [b.key, b]));
  const aspectLines: WheelGeometry['aspectLines'] = [];
  for (const a of aspects) {
    if (a.def.kind === 'blend') continue;
    const A = byKey.get(a.a), B = byKey.get(a.b);
    if (!A || !B) continue;
    const [x1, y1] = pt(A.lon, R3), [x2, y2] = pt(B.lon, R3);
    aspectLines.push({ x1, y1, x2, y2, stroke: ASPECT_COLOR[a.def.kind], dash: a.def.angle === 60 || a.def.angle === 90 ? '4 3' : 'none', evidenceId: a.evidenceId });
  }

  const angles: WheelGeometry['angles'] = [];
  if (chart.rising) {
    const [ax1, ay1] = pt(asc, R0 + 4), [ax2, ay2] = pt(asc, R3), [alx, aly] = pt(asc, R0 - 2);
    angles.push({ x1: ax1, y1: ay1, x2: ax2, y2: ay2, lx: alx - 14, ly: aly - 8, label: 'AC', evidenceId: chart.rising.evidenceId });
    if (chart.mc) {
      const [m1x, m1y] = pt(chart.mc.lon, R0 + 4), [m2x, m2y] = pt(chart.mc.lon, R3);
      angles.push({ x1: m1x, y1: m1y, x2: m2x, y2: m2y, lx: m1x + 10, ly: m1y + 4, label: 'MC', evidenceId: chart.mc.evidenceId });
    }
  }
  return { segments, signGlyphs, segLines, degTicks, houseLines, houseNums, planets, aspectLines, angles, hasHouses: chart.houses.length > 0 };
}
