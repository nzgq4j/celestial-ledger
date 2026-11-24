import { NUM, NUM_TYPES, PERSONAL_DAY, PERSONAL_YEAR, lifePathOf, numCompat } from '../engine/atlas';
import { useApp, type NumTab } from '../state/store';
import { MIN_DATE, todayISO, validDate } from '../state/validation';
import { CalcDetails, Meter, SubTabs } from '../ui/components';
import css from './screens.module.css';

const NUM_TABS = [['core', 'Core numbers'], ['cycles', 'Cycles'], ['compat', 'Compatibility']] as const;

export function Numbers() {
  const app = useApp();
  const { nums } = app.derived!;
  const now = app.now;
  const sel = app.ui.numSel;
  const nd = NUM_TYPES.find(t => t.key === sel)!, nv = nums[sel], nm = NUM[nv];
  const myLP = nums.lifePath;
  const partnerOk = validDate(app.ui.partnerDate);
  const nc = partnerOk ? (() => { const b = lifePathOf(app.ui.partnerDate), r = numCompat(myLP, b); return { a: myLP, b, ...r, who: app.ui.partnerName.trim() || 'them' }; })() : null;

  return (
    <div className="screen fade-up">
      <div className={css.pageHead}>
        <div className="eyebrow">Numerology</div>
        <h1 className="h1">Your Numbers</h1>
      </div>
      <SubTabs<NumTab> label="Numerology sections" items={NUM_TABS} value={app.ui.numTab} onChange={numTab => app.setUi({ numTab })} />

      {app.ui.numTab === 'core' && (
        <div className="stack" style={{ gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }} role="radiogroup" aria-label="Number">
            {NUM_TYPES.map(t => {
              const on = t.key === sel;
              return (
                <button key={t.key} type="button" role="radio" aria-checked={on} data-evidence={nums.evidenceIds[t.key]} onClick={() => app.setUi({ numSel: t.key })}
                  style={{ background: on ? 'rgba(201,163,90,0.14)' : 'var(--panel)', border: `1px solid ${on ? 'var(--gold)' : 'rgba(201,163,90,0.22)'}`, borderRadius: 5, padding: '18px 8px', textAlign: 'center' }}>
                  <div className="serif" style={{ fontSize: 44, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{nums[t.key]}</div>
                  <div className="label-caps" style={{ letterSpacing: '0.12em', marginTop: 8 }}>{t.label}</div>
                </button>
              );
            })}
          </div>
          <div className="panel grid-auto" style={{ gap: 28 }}>
            <div className="stack" style={{ gap: 12 }} data-evidence={nums.evidenceIds[sel]}>
              <div className="eyebrow">{nd.label} {nv}</div>
              <h2 className="display" style={{ fontSize: 34 }}>{nm.title}</h2>
              <div style={{ fontSize: 13, letterSpacing: '0.04em', color: 'var(--gold-bright)' }}>{nm.keywords}</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--muted)', margin: 0 }}>{nd.frame}</p>
              <p className="lead">{nm.core}</p>
            </div>
            <div className="stack" style={{ gap: 16 }}>
              {[{ label: 'Love', text: nm.love }, { label: 'Work', text: nm.work }, { label: 'Your challenge', text: nm.challenge }].map(a => (
                <div key={a.label} className={css.area}>
                  <div className={css.areaLabel}>{a.label}</div>
                  <div className="body">{a.text}</div>
                </div>
              ))}
              <button type="button" className="btn-outline" onClick={() => app.addJournal('Numerology', `${nd.label} ${nv} · ${nm.title}`,
                `${nd.frame}\n\n${nm.core}\n\nLove: ${nm.love}\nWork: ${nm.work}\nChallenge: ${nm.challenge}`,
                { recordIds: [nums.record.id], evidence: { [nums.evidenceIds[sel]]: nums.evidence[nums.evidenceIds[sel]] } })}>
                Save to journal
              </button>
            </div>
          </div>
          <CalcDetails records={[nums.record]} />
        </div>
      )}

      {app.ui.numTab === 'cycles' && (
        <div className="grid-auto">
          {[
            { label: 'Personal Year', value: nums.personalYear, span: `${now.getFullYear()}`, text: PERSONAL_YEAR[nums.personalYear], ev: nums.evidenceIds.personalYear },
            { label: 'Personal Month', value: nums.personalMonth, span: now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), text: `This month's theme: ${PERSONAL_DAY[nums.personalMonth]}`, ev: nums.evidenceIds.personalMonth },
            { label: 'Personal Day', value: nums.personalDay, span: 'Today', text: PERSONAL_DAY[nums.personalDay], ev: nums.evidenceIds.personalDay },
          ].map(c => (
            <div key={c.label} className="panel stack" style={{ gap: 10 }} data-evidence={c.ev}>
              <div className="eyebrow">{c.label}</div>
              <div className="serif" style={{ fontSize: 64, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{c.span}</div>
              <p className="body">{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {app.ui.numTab === 'compat' && (
        <div className="panel stack" style={{ gap: 20, maxWidth: 760 }}>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--muted)', margin: 0 }}>Compare your Life Path {myLP} with someone else's.</p>
          <div className="grid-auto" style={{ gap: 14 }}>
            <label className="field">Their name
              <input className="input" type="text" value={app.ui.partnerName} placeholder="Optional" onChange={e => app.setUi({ partnerName: e.target.value })} />
            </label>
            <label className="field">Their birth date
              <input className="input" type="date" value={app.ui.partnerDate} min={MIN_DATE} max={todayISO()} onChange={e => app.setUi({ partnerDate: e.target.value })} />
            </label>
          </div>
          {nc && (
            <div className="stack" style={{ gap: 16, paddingTop: 20, borderTop: '1px solid rgba(201,163,90,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div className="serif" style={{ fontSize: 48, fontWeight: 600, color: 'var(--gold-bright)', lineHeight: 1 }}>{nc.a} <span style={{ fontSize: 24, color: 'var(--muted)' }}>&amp;</span> {nc.b}</div>
                <div>
                  <div className="serif" style={{ fontSize: 26, fontWeight: 600 }}>{nc.band}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{nc.score}/100 · You &amp; {nc.who}</div>
                </div>
              </div>
              <Meter value={nc.score} label="Compatibility score" />
              <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0 }}>{nc.text}</p>
              <button type="button" className="btn-outline" onClick={() => app.addJournal('Compatibility', `Life Paths ${nc.a} & ${nc.b} · ${nc.band}`, nc.text)}>Save to journal</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
