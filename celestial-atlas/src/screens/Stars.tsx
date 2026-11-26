import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonItem, IonLabel, IonList, IonNote,
  IonSegment, IonSegmentButton, IonSelect, IonSelectOption,
} from '@ionic/react';
import { SIGNS, chartAspects, horoscope, signCompat, signIn, type BodyPlacement, type Chart, type Period, type PlanetPlacement } from '../engine/atlas';
import { placeLabel } from '../engine/places';
import { aspectText } from '../engine/localize';
import { fill, useContent, useStrings } from '../i18n';
import { useApp, type StarsTab } from '../state/store';
import { ChartWheel } from '../ui/ChartWheel';
import { CalcDetails, Meter, MoonDisc, RatingBar } from '../ui/components';
import { ASPECT_COLOR, buildWheel, type WheelBody } from '../ui/wheel';
import css from './screens.module.css';

export function Stars() {
  const app = useApp();
  const s = useStrings().stars;
  return (
    <div className="screen fade-up">
      <div className={css.pageHead}>
        <div className="eyebrow">{s.eyebrow}</div>
        <h1 className="h1">{s.title}</h1>
      </div>
      <IonSegment scrollable value={app.starsTab} aria-label={s.sections} onIonChange={e => app.setStarsTab(e.detail.value as StarsTab)}>
        <IonSegmentButton value="horoscope"><IonLabel>{s.horoscope}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="chart"><IonLabel>{s.chart}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="transits"><IonLabel>{s.transits}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="compat"><IonLabel>{s.compat}</IonLabel></IonSegmentButton>
      </IonSegment>
      {app.starsTab === 'horoscope' && <HoroscopeTab />}
      {app.starsTab === 'chart' && <BirthChartTab />}
      {app.starsTab === 'transits' && <TransitsTab />}
      {app.starsTab === 'compat' && <CompatTab />}
    </div>
  );
}

/* ---------- Horoscope ---------- */

function HoroscopeTab() {
  const app = useApp();
  const strings = useStrings();
  const c = useContent();
  const s = strings.stars;
  const { chart, sky } = app.derived!;
  const sign = app.ui.horoSign ?? chart.sun.signIdx;
  const period = app.ui.period;
  const locked = period === 'monthly' && !app.premium;
  const h = horoscope(sign, period, app.now, sky.moon.signIdx, c);
  const areas = [{ label: s.love, text: h.love }, { label: s.workMoney, text: h.work }, { label: s.wellbeing, text: h.well }];
  const ratingLabels: Record<string, string> = { Love: s.ratingLove, Work: s.ratingWork, Energy: s.ratingEnergy };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <IonSegment value={period} aria-label={s.period} onIonChange={e => app.setUi({ period: e.detail.value as Period })}>
        <IonSegmentButton value="daily"><IonLabel>{s.daily}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="weekly"><IonLabel>{s.weekly}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="monthly"><IonLabel>{app.premium ? s.monthly : s.monthlyPlus}</IonLabel></IonSegmentButton>
      </IonSegment>
      <IonList lines="none" className="field-list">
        <IonItem>
          <IonSelect label={s.sign} labelPlacement="stacked" fill="outline" interface="action-sheet" value={sign}
            selectedText={`${signIn(sign, c).name} · ${signIn(sign, c).dates}`}
            onIonChange={e => app.setUi({ horoSign: Number(e.detail.value) })}>
            {SIGNS.map((_, i) => signIn(i, c)).map((z, i) => (
              <IonSelectOption key={z.name} value={i}>{`${z.name} · ${z.dates}`}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      </IonList>

      {locked ? (
        <IonCard className={css.lock}>
          <IonCardContent>
            <h2 className={css.lockTitle}>{s.monthlyLockedTitle}</h2>
            <p className="body" style={{ margin: '0 auto 18px', maxWidth: 440 }}>{s.monthlyLockedCopy}</p>
            <IonButton onClick={app.openPaywall}>{s.seeAtlasPlus}</IonButton>
          </IonCardContent>
        </IonCard>
      ) : (
        <IonCard>
          <IonCardContent className="grid-auto" style={{ gap: 26 }}>
            <div className="stack" style={{ gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="glyph" style={{ fontSize: 42, color: 'var(--gold-bright)', lineHeight: 1 }} aria-hidden="true">{h.sign.glyph}</div>
                <div>
                  <h2 className="display" style={{ fontSize: 30, lineHeight: 1 }}>{h.sign.name}</h2>
                  <div className="small" style={{ marginTop: 4 }}>{h.label}</div>
                </div>
              </div>
              <p className="lead" data-evidence={period === 'daily' ? sky.moon.evidenceId : undefined}>{h.overview}</p>
              {h.extra && <p className="body" style={{ color: 'var(--gold-bright)' }}>{h.extra}</p>}
            </div>
            <div className="stack" style={{ gap: 14 }}>
              {areas.map(a => (
                <div key={a.label} className={css.area}>
                  <div className={css.areaLabel}>{a.label}</div>
                  <div className="body">{a.text}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid rgb(var(--gold-rgb) / 0.18)' }}>
                {h.ratings.map(r => <RatingBar key={r.label} label={ratingLabels[r.label] ?? r.label} value={r.value} />)}
                <div>
                  <div className="label-caps" style={{ marginBottom: 2 }}>{s.lucky}</div>
                  <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{h.lucky}</div>
                </div>
              </div>
              <IonButton fill="outline" className="link-button-outline" onClick={() => app.addJournal('Horoscope', `${h.sign.name} · ${h.label}`,
                `${h.overview}${h.extra ? '\n\n' + h.extra : ''}\n\n${s.love}: ${h.love}\n${s.workMoney}: ${h.work}\n${s.wellbeing}: ${h.well}`,
                period === 'daily' ? { recordIds: [sky.record.id], evidence: { [sky.moon.evidenceId]: sky.evidence[sky.moon.evidenceId] } } : undefined)}>
                {strings.common.saveToJournal}
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      )}
    </div>
  );
}

/* ---------- Birth chart ---------- */


/** Bodies shown on the wheel and counted in the balance. */
export function chartBodies(chart: Chart, premium: boolean): (BodyPlacement | PlanetPlacement)[] {
  const moon = chart.moon.uncertain ? [] : [chart.moon];
  return [chart.sun, ...moon, ...(premium ? chart.planets : [])];
}

function BirthChartTab() {
  const app = useApp();
  const strings = useStrings();
  const c = useContent();
  const s = strings.stars;
  const p = app.chartProfile!, { chart } = app.derived!, premium = app.premium;
  const timeKnown = chart.record.timeKnown;
  const bodies = chartBodies(chart, premium);
  const aspects = chartAspects(chart, bodies);
  const wheelBodies: WheelBody[] = bodies.map(b => ({
    key: b.key, name: b.name, glyph: b.glyph, lon: b.lon, evidenceId: b.evidenceId,
    deg: b.key === 'moon' && !timeKnown ? null : b.deg,
  }));
  const wheel = buildWheel(chart, wheelBodies, aspects, c.signs.map(x => x.name));

  const balSrc = [...bodies, ...(chart.rising ? [chart.rising] : [])];
  const bal = (key: 'element' | 'modality', vals: string[]) => vals.map(v => {
    const n = balSrc.filter(b => b.sign[key] === v).length;
    return { key: v, label: (key === 'element' ? c.elements : c.modalities)[v as never] as string, n, width: Math.round(n / balSrc.length * 100) };
  });
  const elements = bal('element', ['Fire', 'Earth', 'Air', 'Water']);
  const modalities = bal('modality', ['Cardinal', 'Fixed', 'Mutable']);
  const domEl = [...elements].sort((a, b) => b.n - a.n)[0].key as keyof typeof s.elementNotes;

  const [by, bm, bd] = p.date.split('-').map(Number);
  const birthStr = new Date(by, bm - 1, bd).toLocaleDateString(c.locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const angleRows = [chart.rising, chart.mc].filter(Boolean).map(a => ({
    label: a!.key === 'mc' ? s.midheaven : s.ascendant, sign: `${a!.sign.name} ${a!.deg}°${String(a!.min).padStart(2, '0')}′`,
    note: a!.key === 'mc' ? s.mcNote : s.ascNote, ev: a!.evidenceId,
  }));
  const rows = [chart.sun, chart.moon, ...(chart.rising ? [chart.rising] : []), ...(premium ? chart.planets : [])];
  const wheelLabel = fill(s.wheelLabel, { list: [...bodies.map(b => fill(s.placementIn, { body: b.name, sign: b.sign.name })), ...(chart.rising ? [fill(s.placementIn, { body: s.ascendant, sign: chart.rising.sign.name })] : [])].join(', ') });

  return (
    <div className="stack" style={{ gap: 16 }}>
      <p className="small" style={{ margin: 0 }}>{birthStr}{p.timeUnknown ? ` · ${s.timeUnknown}` : ' · ' + p.time} · {placeLabel(p.place)}</p>
      <IonCard>
        <IonCardContent className="grid-auto" style={{ gap: 24, alignItems: 'start' }}>
          <div className="stack" style={{ gap: 12, alignItems: 'center' }}>
            <ChartWheel wheel={wheel} label={wheelLabel} />
            <p className="note" style={{ textAlign: 'center', maxWidth: 420, lineHeight: 1.5 }}>{chart.rising ? s.wheelNote : s.wheelNoteNoTime}</p>
          </div>
          <div className="stack" style={{ gap: 20 }}>
            {angleRows.length > 0 && (
              <IonList lines="full">
                {angleRows.map(a => (
                  <IonItem key={a.label} data-evidence={a.ev}>
                    <IonLabel>
                      <div className="eyebrow" style={{ letterSpacing: '0.14em' }}>{a.label}</div>
                      <p>{a.note}</p>
                    </IonLabel>
                    <IonNote slot="end" className="serif" style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)' }}>{a.sign}</IonNote>
                  </IonItem>
                ))}
              </IonList>
            )}
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>{s.elementBalance}</div>
              <div className="stack" style={{ gap: 8 }}>
                {elements.map(b => (
                  <div key={b.label} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) 20px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-soft)' }}>{b.label}</span>
                    <div style={{ height: 6, background: 'rgb(var(--gold-rgb) / 0.14)', borderRadius: 3 }}><div style={{ height: '100%', width: `${b.width}%`, background: 'var(--gold)', borderRadius: 3 }} /></div>
                    <span style={{ color: 'var(--muted)', textAlign: 'right' }}>{b.n}</span>
                  </div>
                ))}
              </div>
              <p className="body" style={{ fontSize: 14, marginTop: 12 }}>{s.elementNotes[domEl]}</p>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>{s.modality}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
                {modalities.map(b => (
                  <div key={b.label} style={{ border: '1px solid rgb(var(--gold-rgb) / 0.22)', borderRadius: 4, padding: '10px 6px', textAlign: 'center' }}>
                    <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{b.n}</div>
                    <div className="label-caps" style={{ letterSpacing: '0.08em', marginTop: 4 }}>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {aspects.length > 0 && (
        <IonCard>
          <IonCardHeader><IonCardSubtitle className="eyebrow">{s.aspects}</IonCardSubtitle></IonCardHeader>
          <IonList lines="full">
            {aspects.map(a => (
              <IonItem key={a.evidenceId} data-evidence={a.evidenceId}>
                <span slot="start" className="glyph" style={{ fontSize: 18, color: ASPECT_COLOR[a.def.kind], width: 22, textAlign: 'center' }} aria-hidden="true">{a.def.glyph}</span>
                <IonLabel className="ion-text-wrap">
                  <h3>{a.aName} {aspectText(a, c).name} {a.bName} <IonNote>· {fill(s.orb, { orb: a.orb.toFixed(1) })}</IonNote></h3>
                  <p>{fill(s.aspectLine, { a: a.aName, b: a.bName, text: aspectText(a, c).text })}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonCard>
      )}

      <IonCard>
        <IonList lines="full">
          {rows.map(r => {
            const moonUnsure = r.key === 'moon' && chart.moon.uncertain;
            const hideDeg = r.key === 'moon' && !timeKnown;
            const retro = 'retro' in r && r.retro;
            const signText = moonUnsure ? chart.moon.possibleSigns.map(x => x.name).join(' / ') : r.sign.name;
            return (
              <IonItem key={r.key} data-evidence={r.evidenceId}>
                <span slot="start" className="glyph" style={{ fontSize: 24, color: 'var(--gold-bright)', width: 30, textAlign: 'center' }} aria-hidden="true">{r.glyph}</span>
                <IonLabel className="ion-text-wrap">
                  <h2 className="serif" style={{ fontSize: 21, fontWeight: 600 }}>
                    {fill(s.placementIn, { body: r.name, sign: signText })}{' '}
                    {!moonUnsure && <span className="glyph" style={{ color: 'var(--gold)' }} aria-hidden="true">{r.sign.glyph}</span>}{' '}
                    <IonNote>{hideDeg ? '' : `${r.deg}°`} {retro ? `℞ ${s.retrograde}` : ''}</IonNote>
                  </h2>
                  <p>{moonUnsure ? s.moonChanged : fill(s.expressed, { governs: r.governs, style: r.sign.style })}</p>
                  <p>{r.practical}</p>
                </IonLabel>
              </IonItem>
            );
          })}
          {!premium && (
            <IonItem lines="none">
              <IonLabel className="ion-text-wrap">
                <h2 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{fill(s.morePlacements, { n: chart.planets.length })}</h2>
                <p>{s.morePlacementsCopy}</p>
              </IonLabel>
              <IonButton slot="end" onClick={app.openPaywall}>{s.unlock}</IonButton>
            </IonItem>
          )}
        </IonList>
      </IonCard>
      <p className="note">{s.positionsNote}</p>
      <CalcDetails records={[chart.record]} summary={strings.common.howCalculated} />
    </div>
  );
}

/* ---------- Transits ---------- */

function TransitsTab() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.stars;
  const { chart, sky } = app.derived!;
  const sunIdx = chart.sun.signIdx;
  const inSun = sky.planets.filter(x => x.signIdx === sunIdx).map(x => x.name);
  if (sky.moon.signIdx === sunIdx) inSun.unshift(s.theMoon);
  const rows = [sky.sun, sky.moon, ...sky.planets];
  const pct = Math.round(sky.illum * 100);
  return (
    <div className="grid-auto">
      <IonCard data-evidence={sky.phaseEvidenceId}>
        <IonCardHeader><IonCardSubtitle className="eyebrow">{s.moonPhase}</IonCardSubtitle></IonCardHeader>
        <IonCardContent className="stack" style={{ gap: 16 }}>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            <MoonDisc size={120} illum={sky.illum} waxing={sky.waxing} label={`${sky.phase}, ${pct}%`} />
            <div>
              <div className="serif" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.05, color: 'var(--ink)' }}>{sky.phase}</div>
              <div className="small" style={{ marginTop: 6 }}>{fill(s.illuminated, { percent: pct, sign: sky.moon.sign.name })}</div>
            </div>
          </div>
          <p className="body">{sky.phaseText}</p>
          <p className="body" style={{ color: 'var(--gold-bright)' }}>
            {inSun.length
              ? fill(s.inSun, { bodies: inSun.join(s.and), verb: inSun.length > 1 ? s.inSunMany : s.inSunOne, sign: chart.sun.sign.name })
              : fill(s.noneInSun, { sign: chart.sun.sign.name })}
          </p>
        </IonCardContent>
      </IonCard>
      <IonCard>
        <IonCardHeader><IonCardSubtitle className="eyebrow">{s.skyNow}</IonCardSubtitle></IonCardHeader>
        <IonList lines="full">
          {rows.map(x => {
            const retro = 'retro' in x && x.retro;
            return (
              <IonItem key={x.name} data-evidence={x.evidenceId}>
                <span slot="start" className="glyph" style={{ fontSize: 18, color: 'var(--gold-bright)', width: 22, textAlign: 'center' }} aria-hidden="true">{x.glyph}</span>
                <IonLabel>{x.name} <span style={{ color: 'var(--muted)' }}>· {x.sign.name}</span></IonLabel>
                <IonNote slot="end" color={retro ? 'danger' : undefined}>{x.deg}°{retro ? ` ℞` : ''}</IonNote>
              </IonItem>
            );
          })}
        </IonList>
      </IonCard>
      <IonCard>
        <IonCardHeader><IonCardSubtitle className="eyebrow">{s.retrogrades}</IonCardSubtitle></IonCardHeader>
        <IonCardContent className="stack" style={{ gap: 14 }}>
          {sky.retroNotes.map(n => (
            <div key={n.name}>
              <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>{fill(s.retrogradeTitle, { name: n.name })}</div>
              <div className="body" style={{ fontSize: 14.5 }}>{n.text}</div>
            </div>
          ))}
          {sky.retroNotes.length === 0 && <div className="body" style={{ fontSize: 14.5 }}>{s.noRetro}</div>}
        </IonCardContent>
      </IonCard>
      <CalcDetails records={[sky.record]} summary={strings.common.howCalculated} />
    </div>
  );
}

/* ---------- Compatibility ---------- */

function CompatTab() {
  const app = useApp();
  const strings = useStrings();
  const c = useContent();
  const s = strings.stars;
  const { chart } = app.derived!;
  const signA = app.ui.signA ?? chart.sun.signIdx, signB = app.ui.signB;
  const sc = signCompat(signA, signB, c);
  return (
    <IonCard style={{ maxWidth: 760 }}>
      <IonCardContent className="stack" style={{ gap: 20 }}>
        <IonList lines="full">
          <IonItem>
            <IonSelect label={s.you} labelPlacement="stacked" value={signA} interface="action-sheet" onIonChange={e => app.setUi({ signA: Number(e.detail.value) })}>
              {c.signs.map((z, i) => <IonSelectOption key={i} value={i}>{z.name}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonSelect label={s.them} labelPlacement="stacked" value={signB} interface="action-sheet" onIonChange={e => app.setUi({ signB: Number(e.detail.value) })}>
              {c.signs.map((z, i) => <IonSelectOption key={i} value={i}>{z.name}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
        </IonList>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div className="serif" style={{ fontSize: 30, fontWeight: 600, color: 'var(--ink)' }}>{sc.band}</div>
          <div className="serif" style={{ fontSize: 34, fontWeight: 600, color: 'var(--gold-bright)' }}>{sc.score}<span style={{ fontSize: 18, color: 'var(--muted)' }}>/100</span></div>
        </div>
        <Meter value={sc.score} label={s.score} />
        <p className="body" style={{ fontSize: 15.5, lineHeight: 1.7 }}>{sc.text}</p>
        <IonButton fill="outline" onClick={() => app.addJournal('Compatibility', `${c.signs[signA].name} & ${c.signs[signB].name} · ${sc.band}`, sc.text)}>{strings.common.saveToJournal}</IonButton>
      </IonCardContent>
    </IonCard>
  );
}
