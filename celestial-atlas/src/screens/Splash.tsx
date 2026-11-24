import css from './screens.module.css';

export function Splash() {
  return (
    <div className={css.splash} role="status" aria-label="Charting your sky">
      <div className={css.astrolabe} aria-hidden="true">
        <div className={css.ringOuter}><div className={css.ringDot} /></div>
        <div className={css.ringMid}><div className={css.ringDotSmall} /></div>
        <div className={css.ringCore} />
        <div className={css.crossV} />
        <div className={css.crossH} />
        <div className={css.pulse} />
      </div>
      <div className={css.splashKicker}>Tarot · Numbers · Stars</div>
      <h1 className={css.splashTitle}>Celestial Atlas</h1>
      <p className={css.splashSub}>Charting your sky…</p>
      <div className={css.sweepTrack} aria-hidden="true"><div className={css.sweep} /></div>
    </div>
  );
}
