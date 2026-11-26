import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonInput, IonItem, IonLabel, IonList,
  IonRippleEffect, IonSegment, IonSegmentButton,
} from '@ionic/react';
import { NUM_TYPES, lifePathOf, numCompat } from '../engine/atlas';
import { fill, useContent, useStrings } from '../i18n';
import { useApp, type NumTab } from '../state/store';
import { MIN_DATE, todayISO, validDate } from '../state/validation';
import { CalcDetails, Meter } from '../ui/components';
import { PickerField } from '../ui/PickerField';
import css from './screens.module.css';

export function Numbers() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.numbers;
  const c = useContent();
  const typesIn = NUM_TYPES.map(t => ({ ...t, ...c.numTypes[t.key] }));
  const { nums } = app.derived!;
  const now = app.now;
  const hasName = !!app.chartProfile?.name.trim();
  const types = hasName ? typesIn : typesIn.filter(t => t.key === 'lifePath' || t.key === 'birthday');
  const sel = types.some(t => t.key === app.ui.numSel) ? app.ui.numSel : 'lifePath';
  const nd = typesIn.find(t => t.key === sel)!, nv = nums[sel], nm = c.num[nv];
  const myLP = nums.lifePath;
  const partnerOk = validDate(app.ui.partnerDate);
  const nc = partnerOk ? (() => { const b = lifePathOf(app.ui.partnerDate), r = numCompat(myLP, b, c); return { a: myLP, b, ...r, who: app.ui.partnerName.trim() || s.them }; })() : null;

  return (
    <div className="screen fade-up">
      <div className={css.pageHead}>
        <div className="eyebrow">{s.eyebrow}</div>
        <h1 className="h1">{s.title}</h1>
      </div>
      <IonSegment scrollable value={app.numTab} aria-label={s.sections} onIonChange={e => app.setNumTab(e.detail.value as NumTab)}>
        <IonSegmentButton value="core"><IonLabel>{s.core}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="cycles"><IonLabel>{s.cycles}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="compat"><IonLabel>{s.compat}</IonLabel></IonSegmentButton>
      </IonSegment>

      {app.numTab === 'core' && (
        <div className="stack" style={{ gap: 16 }}>
          <div className={css.numberGrid} role="radiogroup" aria-label={s.number}>
            {types.map(t => {
              const on = t.key === sel;
              return (
                <button key={t.key} type="button" role="radio" aria-checked={on} data-evidence={nums.evidenceIds[t.key]}
                  className={on ? `ion-activatable ${css.numberCard} ${css.numberCardOn}` : `ion-activatable ${css.numberCard}`} onClick={() => app.setUi({ numSel: t.key })}>
                  <span className={css.numberValue}>{nums[t.key]}</span>
                  <span className="label-caps" style={{ display: 'block', letterSpacing: '0.12em', marginTop: 8 }}>{t.label}</span>
                  <IonRippleEffect />
                </button>
              );
            })}
          </div>
          {!hasName && <p className="small" style={{ margin: 0 }}>{s.addName}</p>}
          <IonCard>
            <IonCardContent className="grid-auto" style={{ gap: 24 }}>
              <div className="stack" style={{ gap: 12 }} data-evidence={nums.evidenceIds[sel]}>
                <div className="eyebrow">{nd.label} {nv}</div>
                <h2 className="display" style={{ fontSize: 32 }}>{nm.title}</h2>
                <div style={{ fontSize: 13, letterSpacing: '0.04em', color: 'var(--gold-bright)' }}>{nm.keywords}</div>
                <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>{nd.frame}</p>
                <p className="lead">{nm.core}</p>
              </div>
              <div className="stack" style={{ gap: 14 }}>
                {[{ label: s.love, text: nm.love }, { label: s.work, text: nm.work }, { label: s.challenge, text: nm.challenge }].map(a => (
                  <div key={a.label} className={css.area}>
                    <div className={css.areaLabel}>{a.label}</div>
                    <div className="body">{a.text}</div>
                  </div>
                ))}
                <IonButton fill="outline" onClick={() => app.addJournal('Numerology', `${nd.label} ${nv} · ${nm.title}`,
                  `${nd.frame}\n\n${nm.core}\n\n${s.love}: ${nm.love}\n${s.work}: ${nm.work}\n${s.challenge}: ${nm.challenge}`,
                  { recordIds: [nums.record.id], evidence: { [nums.evidenceIds[sel]]: nums.evidence[nums.evidenceIds[sel]] } })}>
                  {strings.common.saveToJournal}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
          <CalcDetails records={[nums.record]} summary={strings.common.howCalculated} />
        </div>
      )}

      {app.numTab === 'cycles' && (
        <div className="grid-auto">
          {[
            { label: s.personalYear, value: nums.personalYear, span: `${now.getFullYear()}`, text: c.personalYear[nums.personalYear], ev: nums.evidenceIds.personalYear },
            { label: s.personalMonth, value: nums.personalMonth, span: now.toLocaleDateString(c.locale, { month: 'long', year: 'numeric' }), text: fill(s.monthTheme, { text: c.personalDay[nums.personalMonth] }), ev: nums.evidenceIds.personalMonth },
            { label: s.personalDay, value: nums.personalDay, span: s.today, text: c.personalDay[nums.personalDay], ev: nums.evidenceIds.personalDay },
          ].map(c => (
            <IonCard key={c.label} data-evidence={c.ev}>
              <IonCardHeader><IonCardSubtitle className="eyebrow">{c.label}</IonCardSubtitle></IonCardHeader>
              <IonCardContent className="stack" style={{ gap: 8 }}>
                <div className="serif" style={{ fontSize: 60, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{c.value}</div>
                <div className="small">{c.span}</div>
                <p className="body">{c.text}</p>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      )}

      {app.numTab === 'compat' && (
        <IonCard style={{ maxWidth: 760 }}>
          <IonCardContent className="stack" style={{ gap: 18 }}>
            <p className="small" style={{ margin: 0 }}>{fill(s.compare, { n: myLP })}</p>
            <IonList lines="none" className="field-list">
              <IonItem>
                <IonInput label={s.theirName} labelPlacement="stacked" fill="outline" placeholder={s.optional} value={app.ui.partnerName}
                  onIonInput={e => app.setUi({ partnerName: String(e.detail.value ?? '') })} />
              </IonItem>
              <IonItem>
                <PickerField kind="date" label={s.theirDate} value={app.ui.partnerDate} min={MIN_DATE} max={todayISO()}
                  onChange={partnerDate => app.setUi({ partnerDate })} />
              </IonItem>
            </IonList>
            {nc && (
              <div className="stack" style={{ gap: 14, paddingTop: 16, borderTop: '1px solid rgb(var(--gold-rgb) / 0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                  <div className="serif" style={{ fontSize: 46, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{nc.a} <span style={{ fontSize: 24, color: 'var(--muted)' }}>&amp;</span> {nc.b}</div>
                  <div>
                    <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink)' }}>{nc.band}</div>
                    <div className="small">{fill(s.youAnd, { score: nc.score, who: nc.who })}</div>
                  </div>
                </div>
                <Meter value={nc.score} label={s.score} />
                <p className="body" style={{ fontSize: 15.5, lineHeight: 1.7 }}>{nc.text}</p>
                <IonButton fill="outline" onClick={() => app.addJournal('Compatibility', fill(s.journalTitle, { a: nc.a, b: nc.b, band: nc.band }), nc.text)}>{strings.common.saveToJournal}</IonButton>
              </div>
            )}
          </IonCardContent>
        </IonCard>
      )}
    </div>
  );
}
