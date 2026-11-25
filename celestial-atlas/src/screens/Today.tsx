import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { drawCards, horoscope, recordDraw, report } from '../engine/atlas';
import { cardsIn } from '../engine/localize';
import { fill, useContent, useStrings } from '../i18n';
import { useApp } from '../state/store';
import { CardFace, MoonDisc, cardArt } from '../ui/components';
import css from './screens.module.css';
import tcss from './today.module.css';

/** Opens the Atlas Report for members; shows the paywall otherwise. */
export function useOpenReport() {
  const app = useApp();
  const s = useStrings();
  const c = useContent();
  return () => {
    if (!app.premium) return app.openPaywall();
    // The report draws on name numbers; legacy profiles may not have the full birth name yet.
    if (!app.profile?.name.trim()) { app.showToast(s.report.needsName); app.go('profile'); return; }
    const d = app.derived!;
    app.openReport(report(app.profile!, d.chart, d.nums, d.sky, cardsIn(c), app.now, c));
  };
}

export function Today() {
  const app = useApp();
  const s = useStrings();
  const c = useContent();
  const t = s.today;
  const openReport = useOpenReport();
  const p = app.profile!, { chart, nums, sky } = app.derived!, now = app.now;
  const first = p.name.split(' ')[0] || '';
  const home = horoscope(chart.sun.signIdx, 'daily', now, sky.moon.signIdx, c);
  const hour = now.getHours();
  const greeting = fill(hour < 12 ? t.morning : hour < 18 ? t.afternoon : t.evening, { name: first }).replace(/,\s*\./, '.');

  const seed = `${p.name}|${now.toDateString()}|cod`;
  const cards = cardsIn(c);
  const drawn = drawCards(cards, seed, 1);
  const cd = drawn[0];
  const draw = recordDraw(drawn, cards.length, seed, ['Card of the day']);
  const cod = {
    name: cd.card.name, orientation: cd.reversed ? s.common.reversed : s.common.upright,
    meaning: cd.reversed ? cd.card.reversed : cd.card.upright,
  };

  const big3 = [
    { label: t.sun, glyph: chart.sun.sign.glyph, name: chart.sun.sign.name, ev: chart.sun.evidenceId },
    chart.moon.uncertain
      ? { label: t.moon, glyph: '?', name: fill(t.or, { a: chart.moon.possibleSigns[0].name, b: chart.moon.possibleSigns[chart.moon.possibleSigns.length - 1].name }), ev: chart.moon.evidenceId }
      : { label: t.moon, glyph: chart.moon.sign.glyph, name: chart.moon.sign.name, ev: chart.moon.evidenceId },
    chart.rising
      ? { label: t.rising, glyph: chart.rising.sign.glyph, name: chart.rising.sign.name, ev: chart.rising.evidenceId }
      : { label: t.rising, glyph: '?', name: t.addBirthTime, ev: undefined },
  ];
  const showInsight = app.notif.enabled && !app.ui.insightDismissed;
  const pct = Math.round(sky.illum * 100);

  return (
    <div className="screen fade-up" style={{ gap: 18 }}>
      {showInsight && (
        <IonCard className={tcss.insight} role="note" aria-label={t.insightLabel}>
          <div className={tcss.insightRow}>
            <div className={tcss.insightIcon} aria-hidden="true"><div /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={tcss.insightMeta}><span>{t.insightMeta}</span><span>{t.now}</span></div>
              <div className={tcss.insightTitle}>{fill(t.insightTitle, { day: nums.personalDay, sign: sky.moon.sign.name })}</div>
              <div className={tcss.insightBody}>{c.personalDay[nums.personalDay]}</div>
            </div>
            <IonButton fill="clear" color="medium" aria-label={t.dismiss} onClick={() => app.setUi({ insightDismissed: true })}>
              <IonIcon aria-hidden="true" slot="icon-only" icon={closeOutline} />
            </IonButton>
          </div>
        </IonCard>
      )}

      <div className={css.pageHead}>
        <div className="eyebrow">{now.toLocaleDateString(c.locale, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1 className="display" style={{ fontSize: 40, lineHeight: 1.08 }}>{greeting}</h1>
      </div>

      <IonCard className={tcss.big3} aria-label={t.bigThree}>
        {big3.map(b => (
          <div key={b.label} className={tcss.big3Cell} data-evidence={b.ev}>
            <div className={tcss.big3Label}>{b.label}</div>
            <div className={`glyph ${tcss.big3Glyph}`} aria-hidden="true">{b.glyph}</div>
            <div className="serif" style={{ fontSize: 19, fontWeight: 600 }}>{b.name}</div>
          </div>
        ))}
      </IonCard>

      <div className="grid-auto">
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle className="eyebrow">{fill(t.dayKicker, { sign: chart.sun.sign.name })}</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent className="stack" style={{ gap: 12 }}>
            <p className="lead">{home.overview}</p>
            <p className="body"><strong style={{ color: 'var(--ink)' }}>{t.love} · </strong>{home.love}</p>
            <IonButton fill="clear" className="link-button" onClick={() => { app.setUi({ period: 'daily', horoSign: null }); app.go('stars', 'horoscope'); }}>
              {t.fullHoroscope} →
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard button onClick={() => app.go('stars', 'transits')} data-evidence={sky.phaseEvidenceId}>
          <IonCardContent className={tcss.row}>
            <MoonDisc size={96} illum={sky.illum} waxing={sky.waxing} label={fill(t.moonLabel, { phase: sky.phase, percent: pct })} />
            <div className="stack" style={{ gap: 6 }}>
              <div className="eyebrow">{t.moonKicker}</div>
              <div className="serif" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.1, color: 'var(--ink)' }}>{sky.phase}</div>
              <div className="small">{fill(t.moonLit, { percent: pct, sign: sky.moon.sign.name })}</div>
              <div className="body" style={{ fontSize: 14 }}>{sky.phaseText}</div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard button onClick={() => app.go('numbers', 'cycles')}>
          <IonCardHeader>
            <IonCardSubtitle className="eyebrow">{t.numbersKicker}</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent className="stack" style={{ gap: 14 }}>
            <div className={tcss.cycles}>
              {([[t.year, nums.personalYear, nums.evidenceIds.personalYear], [t.month, nums.personalMonth, nums.evidenceIds.personalMonth], [t.day, nums.personalDay, nums.evidenceIds.personalDay]] as const).map(([label, value, ev]) => (
                <div key={label} className={tcss.cycleMini} data-evidence={ev}>
                  <div className={tcss.cycleValue}>{value}</div>
                  <div className={tcss.cycleLabel}>{label}</div>
                </div>
              ))}
            </div>
            <p className="body">{c.personalDay[nums.personalDay]}</p>
          </IonCardContent>
        </IonCard>

        <IonCard data-evidence={draw.evidenceIds[0]}>
          <IonCardContent className={tcss.row} style={{ alignItems: 'flex-start' }}>
            <CardFace card={cd.card} accent="#c9a35a" panel="var(--bg-chip)" art={cardArt(cd.card)} reversed={cd.reversed} width={96} compact />
            <div className="stack" style={{ gap: 6, minWidth: 0 }}>
              <div className="eyebrow">{t.cardKicker}</div>
              <IonCardTitle className="serif" style={{ fontSize: 24 }}>{cod.name}</IonCardTitle>
              <div className="label-caps">{cod.orientation}</div>
              <p className="body" style={{ fontSize: 14 }}>{cod.meaning}</p>
              <div className={tcss.actions}>
                <IonButton fill="clear" className="link-button"
                  onClick={() => app.addJournal('Card of the day', `${cod.name} · ${cod.orientation}`, cod.meaning, { recordIds: [draw.record.id], evidence: draw.evidence })}>
                  {s.common.saveToJournal}
                </IonButton>
                <IonButton fill="clear" color="medium" className="link-button" onClick={() => app.go('tarot')}>{t.fullTarot} →</IonButton>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </div>

      <IonCard button className={tcss.reportCta} onClick={openReport}>
        <IonCardContent className={tcss.reportBody}>
          <div style={{ maxWidth: 560 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{app.premium ? t.reportKicker : t.reportLocked}</div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.15, marginBottom: 8, color: 'var(--ink)' }}>{t.reportTitle}</div>
            <div className="small">{t.reportSub}</div>
          </div>
          <span className={tcss.ctaButton}>{app.premium ? t.readReport : t.unlock}</span>
        </IonCardContent>
      </IonCard>
    </div>
  );
}
