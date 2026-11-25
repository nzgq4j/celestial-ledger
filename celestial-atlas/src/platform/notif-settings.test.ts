import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.hoisted(() => ({
  enablePush: vi.fn(async (_opts: unknown) => 'push' as const),
  disablePush: vi.fn(async () => undefined),
}));
vi.mock('./push', () => push);

import { anyNotif, normalizeNotif, syncInsights } from './notifications';

const profile = { name: 'Amelia Rose Laurent', date: '1991-07-28' } as Parameters<typeof syncInsights>[0];

describe('notification settings', () => {
  beforeEach(() => { push.enablePush.mockClear(); push.disablePush.mockClear(); });

  it('migrates the single switch: news follows the old daily setting', () => {
    expect(normalizeNotif({ enabled: true, time: '07:15' })).toEqual({ enabled: true, time: '07:15', news: true });
    expect(normalizeNotif({ enabled: false, time: '07:15' })).toEqual({ enabled: false, time: '07:15', news: false });
    expect(normalizeNotif({ enabled: true, time: '07:15', news: false }).news).toBe(false);
  });

  it('rejects malformed saved settings', () => {
    expect(normalizeNotif({ enabled: true, time: 'soon' }).time).toBe('08:00');
    expect(normalizeNotif('nonsense')).toEqual(normalizeNotif(null));
  });

  it('turns push off only when both switches are off', async () => {
    expect(anyNotif({ enabled: false, time: '08:00', news: false })).toBe(false);
    await syncInsights(profile, { enabled: false, time: '08:00', news: false });
    expect(push.disablePush).toHaveBeenCalledOnce();
    expect(push.enablePush).not.toHaveBeenCalled();
  });

  it('registers for news alone with no daily messages', async () => {
    await syncInsights(profile, { enabled: false, time: '08:00', news: true });
    const opts = push.enablePush.mock.calls[0][0] as { insights: unknown[]; announcements: boolean };
    expect(opts.insights).toHaveLength(0);
    expect(opts.announcements).toBe(true);
  });

  it('sends 14 insights and the news choice when the daily insight is on', async () => {
    await syncInsights(profile, { enabled: true, time: '08:00', news: false });
    const opts = push.enablePush.mock.calls[0][0] as { insights: unknown[]; announcements: boolean };
    expect(opts.insights).toHaveLength(14);
    expect(opts.announcements).toBe(false);
  });
});
