"use client";

import type { NatalChart } from "@/lib/types";

const aspectDash: Record<string, string> = { Conjunction: "0", Opposition: "8 5", Trine: "2 4", Square: "12 4", Sextile: "4 4" };
const glyphs: Record<string, string> = { Sun:"☉", Moon:"☽", Mercury:"☿", Venus:"♀", Mars:"♂", Jupiter:"♃", Saturn:"♄", Uranus:"♅", Neptune:"♆", Pluto:"♇", "North Node":"☊" };

function point(longitude: number, radius: number, center = 210) {
  const angle = (longitude - 90) * Math.PI / 180;
  return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
}

export function NatalChartWheel({ chart }: { chart: NatalChart }) {
  const signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const placementMap = new Map(chart.placements.map(p => [p.name, p]));
  return <figure className="panel p-4" aria-labelledby="wheel-title">
    <h2 id="wheel-title" className="text-lg font-semibold gold mb-3">Natal Chart</h2>
    <svg viewBox="0 0 420 420" role="img" aria-describedby="wheel-desc" className="w-full max-w-[560px] mx-auto">
      <circle cx="210" cy="210" r="190" fill="#081524" stroke="#c9a75d" strokeWidth="2" />
      <circle cx="210" cy="210" r="150" fill="none" stroke="#536177" />
      <circle cx="210" cy="210" r="85" fill="none" stroke="#2b3a4e" />
      {Array.from({length:12},(_,i)=>{
        const p1=point(i*30,150), p2=point(i*30,190), label=point(i*30+15,170);
        return <g key={i}><line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#536177"/><text x={label.x} y={label.y} fill="#f2ead8" fontSize="10" textAnchor="middle" dominantBaseline="middle">{signs[i].slice(0,3)}</text></g>;
      })}
      {chart.houses.map(h=>{ const a=point(h.longitude,85), b=point(h.longitude,150); return <line key={h.house} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9a75d" strokeWidth="1.2"/>; })}
      {chart.aspects.map((a,i)=>{
        const p1=placementMap.get(a.body1), p2=placementMap.get(a.body2); if(!p1||!p2) return null;
        const q1=point(p1.longitude,82), q2=point(p2.longitude,82);
        return <line key={i} x1={q1.x} y1={q1.y} x2={q2.x} y2={q2.y} stroke="#8fa0b8" strokeWidth="1" strokeDasharray={aspectDash[a.type]} opacity=".65"/>;
      })}
      {chart.placements.map((p,i)=>{ const q=point(p.longitude,130-(i%3)*10); return <g key={p.name}><circle cx={q.x} cy={q.y} r="11" fill="#0d1a2b" stroke="#c9a75d"/><text x={q.x} y={q.y+1} fill="#f2ead8" fontSize="14" textAnchor="middle" dominantBaseline="middle">{glyphs[p.name]||p.name[0]}</text></g>; })}
    </svg>
    <figcaption id="wheel-desc" className="text-sm text-[#b9b2a3] mt-3">
      Zodiac positions: {chart.placements.map(p=>`${p.name} ${p.degree} degrees ${p.minute} minutes ${p.sign}`).join("; ")}. {chart.timeKnown ? `Twelve Placidus houses are shown. ${chart.aspects.length} major aspects use distinct line patterns.` : "Birth time is unknown; houses and angles are omitted."}
    </figcaption>
  </figure>;
}
