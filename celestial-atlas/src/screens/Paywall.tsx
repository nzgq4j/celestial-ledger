import { useEffect, useRef, useState } from 'react';
import { billing, PLANS, type PlanId } from '../platform/billing';
import { useApp } from '../state/store';
import css from './screens.module.css';

export const PAYWALL_FEATURES = [
  'Monthly forecasts with key dates for every sign',
  'Your full birth chart — Mercury through Pluto',
  'The Atlas Report: chart, numbers and tarot in one life & love reading',
];

export function Paywall() {
  const { closePaywall, startTrial } = useApp();
  const [plan, setPlan] = useState<PlanId>('year');
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePaywall(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePaywall]);

  return (
    <div className={css.scrim} onClick={closePaywall}>
      <div className={css.sheet} role="dialog" aria-modal="true" aria-labelledby="paywall-title" onClick={e => e.stopPropagation()}>
        <button ref={closeRef} type="button" className={css.close} aria-label="Close" onClick={closePaywall}>×</button>
        <div className="eyebrow" style={{ letterSpacing: '0.22em', marginBottom: 10 }}>Atlas+</div>
        <h2 id="paywall-title" className="display" style={{ fontSize: 34, marginBottom: 20 }}>See the whole map.</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PAYWALL_FEATURES.map(f => (
            <li key={f} style={{ display: 'flex', gap: 12, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
              <span style={{ color: 'var(--gold-bright)' }} aria-hidden="true">✦</span>{f}
            </li>
          ))}
        </ul>
        <div role="radiogroup" aria-label="Plan" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {PLANS.map(p => (
            <button key={p.id} type="button" role="radio" aria-checked={plan === p.id}
              className={plan === p.id ? `${css.plan} ${css.planOn}` : css.plan} onClick={() => setPlan(p.id)}>
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{p.label}</span>
                <span className="small" style={{ fontSize: 12.5 }}>{p.note}</span>
              </span>
              <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>{p.price}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary" style={{ width: '100%', padding: 15, fontSize: 15 }} disabled={busy}
          onClick={async () => { setBusy(true); try { await startTrial(plan); } finally { setBusy(false); } }}>
          Start 7-day free trial
        </button>
        <p className="note" style={{ fontSize: 12, textAlign: 'center', marginTop: 12 }}>
          {billing.isDemo ? 'Cancel anytime. Demo only — no payment is taken.' : 'Cancel anytime.'}
        </p>
      </div>
    </div>
  );
}
