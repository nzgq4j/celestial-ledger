import { SIGNS, chartAspects, horoscope, signCompat, type BodyPlacement, type Chart, type Period, type PlanetPlacement } from '../engine/atlas';
import { placeLabel } from '../engine/places';
import { useApp, type StarsTab } from '../state/store';
import { ChartWheel } from '../ui/ChartWheel';
import { CalcDetails, Meter, MoonDisc, RatingBar, SubTabs } from '../ui/components';
import { ASPECT_COLOR, buildWheel, type WheelBody } from '../ui/wheel';
import css from './screens.module.css';

const STARS_TABS = [['horoscope', 'Horoscope'], ['chart', 'Birth chart'], ['transits', 'Transits & moon'], ['compat', 'Compatibility']] as const;

export function Stars() {
  const app = useApp();
  return (
    <div className="screen fade-up">
      <div className={css.pageHead}>
        <div className="eyebrow">Astrology</div>
        <h1 className="h1">The Stars</h1>
      </div>
      <SubTabs<StarsTab> label="Astrology sections" items={STARS_TABS} value={app.ui.starsTab} onChange={starsTab => app.setUi({ starsTab })} />
      {app.ui.starsTab === 'horoscope' && <HoroscopeTab />}
      {app.ui.starsTab === 'chart' && <BirthChartTab />}
      {app.ui.starsTab === 'transits' && <TransitsTab />}
      {app.ui.starsTab === 'compat' && <CompatTab />}
    </div>
  );
}

/* ---------- Horoscope ---------- */

function HoroscopeTab() {
  const app = useApp();
  const { chart, sky } = app.derived!;
  const sign = app.ui.horoSign ?? chart.sun.signIdx;
  const period = app.ui.period;
  const locked = period === 'monthly' && !app.premium;
  const h = horoscope(sign, period, app.now, sky.moon.signIdx);
  const areas = [{ label: 'Love', text: h.love }, { label: 'Work & money', text: h.work }, { label: 'Wellbeing', text: h.well }];
  const periods: [Period, string][] = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', app.premium ? 'Monthly' : 'Monthly · Atlas+']];

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className={css.row} role="radiogroup" aria-label="Period">
        {periods.map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={period === id}
            className={period === id ? `${css.pill} ${css.pillOn}` : css.pill} onClick={() => app.setUi({ period: id })}>{label}</button>
        ))}
      </div>
      <div className={css.row} style={{ gap: 6 }} role="radiogroup" aria-label="Sign">
        {SIGNS.map((s, i) => (
          <button key={s.name} type="button" role="radio" aria-checked={i === sign}
            className={i === sign ? `${css.chip} ${css.chipOn}` : css.chip} onClick={() => app.setUi({ horoSign: i })}>
            <span className="glyph" style={{ fontSize: 15 }} aria-hidden="true">{s.glyph}</span>{s.name}
          </button>
        ))}
      </div>

      {locked ? (
        <div className={`panel ${css.lock}`}>
          <h2 className={css.lockTitle}>Monthly forecasts are part of Atlas+</h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-lead)', margin: '0 auto 22px', maxWidth: 440 }}>Get the month ahead for every sign, with key dates to plan around.</p>
          <button type="button" className="btn-primary" onClick={app.openPaywall}>See Atlas+</button>
        </div>
      ) : (
        <div className="panel grid-auto" style={{ padding: 24, gap: 30 }}>
          <div className="stack" style={{ gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="glyph" style={{ fontSize: 42, color: 'var(--gold-bright)', lineHeight: 1 }} aria-hidden="true">{h.sign.glyph}</div>
              <div>
                <h2 className="display" style={{ fontSize: 30, lineHeight: 1 }}>{h.sign.name}</h2>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{h.label}</div>
              </div>
            </div>
            <p className="lead" data-evidence={period === 'daily' ? sky.moon.evidenceId : undefined}>{h.overview}</p>
            {h.extra && <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gold-bright)', margin: 0 }}>{h.extra}</p>}
          </div>
          <div className="stack" style={{ gap: 16 }}>
            {areas.map(a => (
              <div key={a.label} className={css.area}>
                <div className={css.areaLabel}>{a.label}</div>
                <div className="body">{a.text}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid rgba(201,163,90,0.18)' }}>
              {h.ratings.map(r => <RatingBar key={r.label} label={r.label} value={r.value} />)}
              <div>
                <div className="label-caps" style={{ marginBottom: 2 }}>Lucky no.</div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{h.lucky}</div>
              </div>
            </div>
            <button type="button" className="btn-outline" onClick={() => app.addJournal('Horoscope', `${h.sign.name} · ${h.label}`,
              `${h.overview}${h.extra ? '\n\n' + h.extra : ''}\n\nLove: ${h.love}\nWork & money: ${h.work}\nWellbeing: ${h.well}`,
              period === 'daily' ? { recordIds: [sky.record.id], evidence: { [sky.moon.evidenceId]: sky.evidence[sky.moon.evidenceId] } } : undefined)}>
              Save to journal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Birth chart ---------- */

const EL_NOTE: Record<string, string> = {
  Fire: 'Fire-heavy: you run on enthusiasm and action. Make sure you rest before you burn out.',
  Earth: 'Earth-heavy: practical, grounded, results-focused. Leave room for spontaneity.',
  Air: 'Air-heavy: you live in ideas and conversation. Ground plans with deadlines.',
  Water: 'Water-heavy: feeling-led and intuitive. Protect your energy around draining people.',
};

/** Bodies shown on the wheel and counted in the balance. */
export function chartBodies(chart: Chart, premium: boolean): (BodyPlacement | PlanetPlacement)[] {
  const moon = chart.moon.uncertain ? [] : [chart.moon];
  return [chart.sun, ...moon, ...(premium ? chart.planets : [])];
}

function BirthChartTab() {
  const app = useApp();
  const p = app.profile!, { chart } = app.derived!, premium = app.premium;
  const timeKnown = chart.record.timeKnown;
  const bodies = chartBodies(chart, premium);
  const aspects = chartAspects(chart, bodies);
  const wheelBodies: WheelBody[] = bodies.map(b => ({
    key: b.key, name: b.name, glyph: b.glyph, lon: b.lon, evidenceId: b.evidenceId,
    deg: b.key === 'moon' && !timeKnown ? null : b.deg,
  }));
  const wheel = buildWheel(chart, wheelBodies, aspects);

  const balSrc = [...bodies, ...(chart.rising ? [chart.rising] : [])];
  const bal = (key: 'element' | 'modality', vals: string[]) => vals.map(v => {
    const n = balSrc.filter(b => b.sign[key] === v).length;
    return { label: v, n, width: Math.round(n / balSrc.length * 100) };
  });
  const elements = bal('element', ['Fire', 'Earth', 'Air', 'Water']);
  const modalities = bal('modality', ['Cardinal', 'Fixed', 'Mutable']);
  const domEl = [...elements].sort((a, b) => b.n - a.n)[0].label;

  const [by, bm, bd] = p.date.split('-').map(Number);
  const birthStr = new Date(by, bm - 1, bd).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const angleRows = [chart.rising, chart.mc].filter(Boolean).map(a => ({
    label: a!.key === 'mc' ? 'Midheaven (MC)' : 'Ascendant (AC)', sign: `${a!.sign.name} ${a!.deg}°${String(a!.min).padStart(2, '0')}′`,
    note: a!.key === 'mc' ? 'Your public direction — career and reputation.' : 'Your approach to life and first impression.', ev: a!.evidenceId,
  }));
  const rows = [chart.sun, chart.moon, ...(chart.rising ? [chart.rising] : []), ...(premium ? chart.planets : [])];
  const wheelLabel = `Birth chart wheel showing ${bodies.map(b => `${b.name} in ${b.sign.name}`).join(', ')}${chart.rising ? `, Ascendant in ${chart.rising.sign.name}` : ''}.`;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>{birthStr}{p.timeUnknown ? ' · time unknown' : ' · ' + p.time} · {placeLabel(p.place)}</p>
      <div className="panel grid-auto" style={{ gap: 28, alignItems: 'start' }}>
        <div className="stack" style={{ gap: 12, alignItems: 'center' }}>
          <ChartWheel wheel={wheel} label={wheelLabel} />
          <p className="note" style={{ textAlign: 'center', maxWidth: 420, lineHeight: 1.5 }}>
            {chart.rising ? 'Equal houses from your Ascendant (AC, left). Inner lines show aspects — blue flows, red pushes.' : 'Add your birth time for houses and Ascendant. Wheel shown with 0° Aries at left.'}
          </p>
        </div>
        <div className="stack" style={{ gap: 22 }}>
          {angleRows.map(a => (
            <div key={a.label} data-evidence={a.ev} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--hairline-soft)' }}>
              <div>
                <div className="eyebrow" style={{ letterSpacing: '0.14em' }}>{a.label}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{a.note}</div>
              </div>
              <div className="serif" style={{ fontSize: 20, fontWeight: 600, whiteSpace: 'nowrap' }}>{a.sign}</div>
            </div>
          ))}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Element balance</div>
            <div className="stack" style={{ gap: 8 }}>
              {elements.map(b => (
                <div key={b.label} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) 20px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{b.label}</span>
                  <div style={{ height: 6, background: 'rgba(201,163,90,0.14)', borderRadius: 3 }}><div style={{ height: '100%', width: `${b.width}%`, background: 'var(--gold)', borderRadius: 3 }} /></div>
                  <span style={{ color: 'var(--muted)', textAlign: 'right' }}>{b.n}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-soft)', margin: '12px 0 0' }}>{EL_NOTE[domEl]}</p>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Modality</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
              {modalities.map(b => (
                <div key={b.label} style={{ border: '1px solid rgba(201,163,90,0.22)', borderRadius: 4, padding: '10px 6px', textAlign: 'center' }}>
                  <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{b.n}</div>
                  <div className="label-caps" style={{ letterSpacing: '0.08em', marginTop: 4 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {aspects.length > 0 && (
        <div className="panel">
          <div className="eyebrow" style={{ marginBottom: 14 }}>Aspects</div>
          <div className="grid-auto" style={{ gap: '14px 26px' }}>
            {aspects.map(a => (
              <div key={a.evidenceId} data-evidence={a.evidenceId} style={{ display: 'grid', gridTemplateColumns: '26px minmax(0,1fr)', gap: 10 }}>
                <span className="glyph" style={{ fontSize: 18, color: ASPECT_COLOR[a.def.kind], textAlign: 'center', lineHeight: 1.3 }} aria-hidden="true">{a.def.glyph}</span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>{a.aName} {a.def.name} {a.bName} <span style={{ color: 'var(--dim)', fontWeight: 400, fontSize: 12.5 }}>· {a.orb.toFixed(1)}° orb</span></div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-lead)', marginTop: 2 }}>{a.aName} and {a.bName} {a.def.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--hairline)', borderRadius: 6, background: 'var(--panel)' }}>
        {rows.map(r => {
          const moonUnsure = r.key === 'moon' && chart.moon.uncertain;
          const hideDeg = r.key === 'moon' && !timeKnown;
          const retro = 'retro' in r && r.retro;
          return (
            <div key={r.key} data-evidence={r.evidenceId} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 16, padding: '20px 22px', borderBottom: '1px solid var(--hairline-soft)' }}>
              <div className="glyph" style={{ fontSize: 24, color: 'var(--gold-bright)', textAlign: 'center', lineHeight: 1.3 }} aria-hidden="true">{r.glyph}</div>
              <div className="stack" style={{ gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>
                    {r.name} in {moonUnsure ? chart.moon.possibleSigns.map(s => s.name).join(' or ') : r.sign.name}
                  </span>
                  {!moonUnsure && <span className="glyph" style={{ color: 'var(--gold)' }} aria-hidden="true">{r.sign.glyph}</span>}
                  <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{hideDeg ? '' : `${r.deg}°`} {retro ? '℞ retrograde' : ''}</span>
                </div>
                {moonUnsure ? (
                  <div className="body" style={{ fontSize: 14.5 }}>The Moon changed sign on your birth date. Add your birth time to see which sign it was in.</div>
                ) : (
                  <div className="body" style={{ fontSize: 14.5 }}>{r.governs}, expressed through {r.sign.style}.</div>
                )}
                <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>{r.practical}</div>
              </div>
            </div>
          );
        })}
        {!premium && (
          <div style={{ padding: '26px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div>
              <div className="serif" style={{ fontSize: 21, fontWeight: 600, marginBottom: 4 }}>{chart.planets.length} more placements</div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Mercury through Pluto — how you think, love, fight, grow, build and change.</div>
            </div>
            <button type="button" className="btn-primary" onClick={app.openPaywall}>Unlock with Atlas+</button>
          </div>
        )}
      </div>
      <p className="note">Positions are calculated on-device with astronomy-engine.</p>
      <CalcDetails records={[chart.record]} />
    </div>
  );
}

/* ---------- Transits ---------- */

function TransitsTab() {
  const app = useApp();
  const { chart, sky } = app.derived!;
  const sunIdx = chart.sun.signIdx;
  const inSun = sky.planets.filter(x => x.signIdx === sunIdx).map(x => x.name);
  if (sky.moon.signIdx === sunIdx) inSun.unshift('the Moon');
  const rows = [sky.sun, sky.moon, ...sky.planets];
  return (
    <div className="grid-auto">
      <div className="panel stack" style={{ gap: 16 }} data-evidence={sky.phaseEvidenceId}>
        <div className="eyebrow">Moon phase</div>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          <MoonDisc size={120} illum={sky.illum} waxing={sky.waxing} label={`${sky.phase}, ${Math.round(sky.illum * 100)}% illuminated`} />
          <div>
            <div className="serif" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.05 }}>{sky.phase}</div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6 }}>{Math.round(sky.illum * 100)}% illuminated · Moon in {sky.moon.sign.name}</div>
          </div>
        </div>
        <p className="body">{sky.phaseText}</p>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--gold-bright)', margin: 0 }}>
          {inSun.length
            ? `${inSun.join(' and ')} ${inSun.length > 1 ? 'are' : 'is'} moving through ${chart.sun.sign.name}, your Sun sign — expect that energy to feel personal right now.`
            : `No planets are passing through ${chart.sun.sign.name} right now — a steadier stretch for you.`}
        </p>
      </div>
      <div className="panel stack" style={{ gap: 4 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>The sky right now</div>
        {rows.map(x => {
          const retro = 'retro' in x && x.retro;
          return (
            <div key={x.name} data-evidence={x.evidenceId} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(201,163,90,0.12)' }}>
              <span className="glyph" style={{ fontSize: 18, color: 'var(--gold-bright)', textAlign: 'center' }} aria-hidden="true">{x.glyph}</span>
              <span style={{ fontSize: 14.5 }}>{x.name} <span style={{ color: 'var(--muted)' }}>in {x.sign.name}</span></span>
              <span style={{ fontSize: 12.5, color: retro ? '#e3a37e' : 'var(--muted)' }}>{x.deg}° {retro ? <span aria-label="retrograde">℞</span> : ''}</span>
            </div>
          );
        })}
      </div>
      <div className="panel stack" style={{ gap: 14 }}>
        <div className="eyebrow">Retrogrades</div>
        {sky.retroNotes.map(n => (
          <div key={n.name}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{n.name} retrograde</div>
            <div className="body" style={{ fontSize: 14.5 }}>{n.text}</div>
          </div>
        ))}
        {sky.retroNotes.length === 0 && <div className="body" style={{ fontSize: 14.5 }}>No planets are retrograde right now — a good stretch for moving plans forward.</div>}
      </div>
      <CalcDetails records={[sky.record]} />
    </div>
  );
}

/* ---------- Compatibility ---------- */

function CompatTab() {
  const app = useApp();
  const { chart } = app.derived!;
  const signA = app.ui.signA ?? chart.sun.signIdx, signB = app.ui.signB;
  const sc = signCompat(signA, signB);
  return (
    <div className="panel stack" style={{ padding: 24, gap: 22, maxWidth: 760 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', gap: 14, alignItems: 'end' }}>
        <label className="field">You
          <select className="input" value={signA} onChange={e => app.setUi({ signA: +e.target.value })}>
            {SIGNS.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
          </select>
        </label>
        <div className="serif" style={{ fontSize: 26, color: 'var(--gold)', paddingBottom: 10 }} aria-hidden="true">&amp;</div>
        <label className="field">Them
          <select className="input" value={signB} onChange={e => app.setUi({ signB: +e.target.value })}>
            {SIGNS.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
          </select>
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div className="serif" style={{ fontSize: 30, fontWeight: 600 }}>{sc.band}</div>
        <div className="serif" style={{ fontSize: 34, fontWeight: 600, color: 'var(--gold-bright)' }}>{sc.score}<span style={{ fontSize: 18, color: 'var(--muted)' }}>/100</span></div>
      </div>
      <Meter value={sc.score} label="Compatibility score" />
      <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0 }}>{sc.text}</p>
      <button type="button" className="btn-outline" onClick={() => app.addJournal('Compatibility', `${SIGNS[signA].name} & ${SIGNS[signB].name} · ${sc.band}`, sc.text)}>Save to journal</button>
    </div>
  );
}
