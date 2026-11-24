import { useState } from 'react';
import { billing } from '../platform/billing';
import { useApp } from '../state/store';
import { nameProblem, nameUsable } from '../state/validation';
import { CalcDetails } from '../ui/components';
import { DateTimeFields, TimeZoneCheck, draftFromProfile, draftToProfile, type Draft } from './BirthFields';
import { PlaceSearch } from './PlaceSearch';
import css from './screens.module.css';

export function Profile() {
  const app = useApp();
  const p = app.profile!;
  const [draft, setDraft] = useState<Draft>(() => draftFromProfile(p));
  const set = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));
  const nameMsg = nameProblem(draft.name);

  const saveProfile = async () => {
    const next = nameUsable(draft.name) ? draftToProfile(draft) : null;
    if (!next) { app.showToast('Add a name and birth date'); return; }
    await app.setProfile(next);
    app.showToast('Profile updated');
  };

  const confirmReset = async () => {
    if (!window.confirm('Reset the app? Your profile and journal will be deleted from this device.')) return;
    await app.resetAll();
  };

  return (
    <div className="screen fade-up" style={{ gap: 22, maxWidth: 640 }}>
      <div className={css.pageHead}>
        <div className="eyebrow">Profile</div>
        <h1 className="h1">{p.name}</h1>
      </div>

      <div className="panel stack" style={{ gap: 16 }}>
        <div className="eyebrow">Birth details</div>
        <label className="field">Full birth name
          <input className="input" type="text" value={draft.name} onChange={e => set({ name: e.target.value })} autoComplete="name" />
        </label>
        {nameMsg && <p className="error" role="alert">{nameMsg}</p>}
        <DateTimeFields draft={draft} set={set} compact />
        <label className="check">
          <input type="checkbox" checked={draft.timeUnknown} onChange={e => set({ timeUnknown: e.target.checked, disambiguation: undefined })} />
          Birth time unknown
        </label>
        <PlaceSearch value={draft.place} onChange={place => set({ place, disambiguation: undefined })} label="Change birthplace" />
        <TimeZoneCheck draft={draft} set={set} />
        <button type="button" className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={saveProfile}>Save changes</button>
        {app.derived && <CalcDetails records={[app.derived.chart.record]} />}
      </div>

      <div className="panel" style={{ padding: '8px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--hairline-soft)' }}>
          <div>
            <div id="notif-label" style={{ fontSize: 15, fontWeight: 500 }}>Daily insight notification</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Your personal day and the moon, each morning.</div>
            {app.notifBlocked && <div className="error" style={{ fontSize: 13, marginTop: 4 }}>Notifications are turned off for Celestial Atlas in Android settings.</div>}
          </div>
          <button type="button" role="switch" aria-checked={app.notif.enabled} aria-labelledby="notif-label"
            onClick={() => void app.setNotif({ ...app.notif, enabled: !app.notif.enabled })}
            style={{ width: 52, height: 44, flexShrink: 0, border: 'none', background: 'none', padding: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 1, top: 7, width: 50, height: 30, borderRadius: 15, background: app.notif.enabled ? 'var(--gold)' : 'rgba(174,182,204,0.3)' }} />
            <span style={{ position: 'absolute', top: 10, left: app.notif.enabled ? 24 : 4, width: 24, height: 24, borderRadius: '50%', background: 'var(--ink)', transition: 'left .2s ease' }} />
          </button>
        </div>
        {app.notif.enabled && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--hairline-soft)' }}>
            <label htmlFor="notif-time" style={{ fontSize: 15 }}>Notification time</label>
            <input id="notif-time" className="input" type="time" value={app.notif.time} style={{ width: 140 }}
              onChange={e => e.target.value && void app.setNotif({ ...app.notif, time: e.target.value })} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--hairline-soft)' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Membership</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{app.premium ? 'Atlas+ member' : 'Free plan'}</div>
          </div>
          <button type="button" className="btn-outline" style={{ alignSelf: 'center', fontSize: 13 }} onClick={() => void app.manageMembership()}>
            {app.premium ? (billing.isDemo ? 'Cancel trial' : 'Manage') : 'Upgrade'}
          </button>
        </div>
        <div style={{ padding: '8px 0' }}>
          <button type="button" className="btn-danger" onClick={() => void confirmReset()}>Reset app &amp; start over</button>
        </div>
      </div>

      <p className="note" style={{ lineHeight: 1.6 }}>
        Birthplaces from GeoNames (geonames.org), licensed under CC BY 4.0. Positions from astronomy-engine (MIT). Fonts under the SIL Open Font License.
      </p>
    </div>
  );
}
