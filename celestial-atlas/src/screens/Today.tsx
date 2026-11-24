import { PERSONAL_DAY, drawCards, horoscope, recordDraw, report } from '../engine/atlas';
import TAROT_CARDS from '../engine/tarotData';
import { useApp } from '../state/store';
import { CardFace, MoonDisc, cardArt } from '../ui/components';
import css from './screens.module.css';
import tcss from './today.module.css';

const GREETING = (h: number) => (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');

/** Opens the Atlas Report for members; shows the paywall otherwise. */
export function useOpenReport() {
  const app = useApp();
  return () => {
    if (!app.premium) return app.openPaywall();
    const d = app.derived!;
    app.openReport(report(app.profile!, d.chart, d.nums, d.sky, TAROT_CARDS, app.now));
  };
}

export function Today() {
  const app = useApp();
  const openReport = useOpenReport();
  const p = app.profile!, { chart, nums, sky } = app.derived!, now = app.now;
  const first = p.name.split(' ')[0];
  const home = horoscope(chart.sun.signIdx, 'daily', now, sky.moon.signIdx);

  const seed = `${p.name}|${now.toDateString()}|cod`;
  const drawn = drawCards(TAROT_CARDS, seed, 1);
  const cd = drawn[0];
  const draw = recordDraw(drawn, TAROT_CARDS.length, seed, ['Card of the day']);
  const cod = {
    name: cd.card.name, orientation: cd.reversed ? 'Reversed' : 'Upright', meaning: cd.reversed ? cd.card.reversed : cd.card.upright,
  };

  const big3 = [
    { label: 'Sun', glyph: chart.sun.sign.glyph, name: chart.sun.sign.name, ev: chart.sun.evidenceId },
    chart.moon.uncertain
      ? { label: 'Moon', glyph: '?', name: chart.moon.possibleSigns.map(s => s.name).join(' or '), ev: chart.moon.evidenceId }
      : { label: 'Moon', glyph: chart.moon.sign.glyph, name: chart.moon.sign.name, ev: chart.moon.evidenceId },
    chart.rising
      ? { label: 'Rising', glyph: chart.rising.sign.glyph, name: chart.rising.sign.name, ev: chart.rising.evidenceId }
      : { label: 'Rising', glyph: '?', name: 'Add birth time', ev: undefined },
  ];
  const showInsight = app.notif.enabled && !app.ui.insightDismissed;

  return (
    <div className="screen fade-up" style={{ gap: 22 }}>
      {showInsight && (
        <div className={tcss.insight} role="note" aria-label="Today's insight">
          <div className={tcss.insightIcon} aria-hidden="true"><div /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={tcss.insightMeta}><span>Celestial Atlas</span><span>now</span></div>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 2 }}>Personal Day {nums.personalDay} · Moon in {sky.moon.sign.name}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--ink-body)' }}>{PERSONAL_DAY[nums.personalDay]}</div>
          </div>
          <button type="button" className={tcss.dismiss} aria-label="Dismiss" onClick={() => app.setUi({ insightDismissed: true })}>×</button>
        </div>
      )}

      <div className={css.pageHead}>
        <div className="eyebrow">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1 className="display" style={{ fontSize: 44, lineHeight: 1.08 }}>{GREETING(now.getHours())}, {first}.</h1>
      </div>

      <div className={tcss.big3}>
        {big3.map(b => (
          <div key={b.label} className={tcss.big3Cell} data-evidence={b.ev}>
            <div className={tcss.big3Label}>{b.label}</div>
            <div className={`glyph ${tcss.big3Glyph}`} aria-hidden="true">{b.glyph}</div>
            <div className="serif" style={{ fontSize: 19, fontWeight: 600 }}>{b.name}</div>
          </div>
        ))}
      </div>

      <div className="grid-auto">
        <div className="panel stack" style={{ gap: 12 }}>
          <div className="eyebrow">Your day · {chart.sun.sign.name}</div>
          <p className="serif" style={{ fontSize: 22, lineHeight: 1.35, margin: 0, textWrap: 'pretty' }}>{home.overview}</p>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-lead)', margin: 0 }}>
            <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Love · </strong>{home.love}
          </p>
          <button type="button" className="btn-link" onClick={() => { app.setUi({ starsTab: 'horoscope', period: 'daily', horoSign: null }); app.go('stars'); }}>
            Full horoscope →
          </button>
        </div>

        <div className="panel" style={{ display: 'flex', gap: 22, alignItems: 'center' }} data-evidence={sky.phaseEvidenceId}>
          <MoonDisc size={96} illum={sky.illum} waxing={sky.waxing} label={`${sky.phase}, ${Math.round(sky.illum * 100)}% lit`} />
          <div className="stack" style={{ gap: 6 }}>
            <div className="eyebrow">Moon tonight</div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>{sky.phase}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{Math.round(sky.illum * 100)}% lit · in {sky.moon.sign.name}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-body)' }}>{sky.phaseText}</div>
          </div>
        </div>

        <div className="panel stack" style={{ gap: 16 }}>
          <div className="eyebrow">Your numbers today</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, textAlign: 'center' }}>
            {([['Year', nums.personalYear, nums.evidenceIds.personalYear], ['Month', nums.personalMonth, nums.evidenceIds.personalMonth], ['Day', nums.personalDay, nums.evidenceIds.personalDay]] as const).map(([label, value, ev]) => (
              <div key={label} className={tcss.cycleMini} data-evidence={ev}>
                <div className="serif" style={{ fontSize: 34, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{value}</div>
                <div className={tcss.cycleLabel}>{label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-body)', margin: 0 }}>{PERSONAL_DAY[nums.personalDay]}</p>
        </div>

        <div className="panel" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} data-evidence={draw.evidenceIds[0]}>
          <CardFace card={cd.card} accent="#c9a35a" panel="var(--bg-chip)" art={cardArt(cd.card)} reversed={cd.reversed} width={96} compact />
          <div className="stack" style={{ gap: 7, minWidth: 0 }}>
            <div className="eyebrow">Card of the day</div>
            <div className="serif" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.1 }}>{cod.name}</div>
            <div className="label-caps" style={{ fontSize: 11.5, letterSpacing: '0.08em' }}>{cod.orientation}</div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-body)', margin: 0 }}>{cod.meaning}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button type="button" className="btn-link" style={{ fontSize: 13.5, fontWeight: 400 }}
                onClick={() => app.addJournal('Card of the day', `${cod.name} · ${cod.orientation}`, cod.meaning, { recordIds: [draw.record.id], evidence: draw.evidence })}>
                Save to journal
              </button>
              <button type="button" className="btn-quiet" style={{ fontSize: 13.5 }} onClick={() => app.go('tarot')}>Full tarot reading →</button>
            </div>
          </div>
        </div>
      </div>

      <button type="button" className={tcss.reportCta} onClick={openReport}>
        <div style={{ maxWidth: 560 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>The Atlas Report {app.premium ? '' : '· Atlas+'}</div>
          <div className="serif" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.15, marginBottom: 8 }}>
            Your chart, your numbers and three cards — one complete life &amp; love reading.
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-lead)' }}>Core blueprint · emotions · love · work &amp; money · this year · growth edge</div>
        </div>
        <div className={tcss.ctaButton}>{app.premium ? 'Read my report' : 'Unlock'}</div>
      </button>
    </div>
  );
}

