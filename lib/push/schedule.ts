/**
 * Pure scheduling rules for the morning reading alert (no I/O).
 */

/** Alerts are skipped if the cron is this late, rather than sent at night. */
export const MORNING_SEND_WINDOW_MINUTES = 180;

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

/** Device-local calendar date (YYYY-MM-DD) and minutes after midnight. */
export function localClock(now: Date, timeZone: string) {
  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** "06:30" or "06:30:00" → 390. */
export function minutesFromTime(value: string) {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export type MorningAlertDevice = {
  timezone: string;
  morning_alert_enabled: boolean;
  morning_alert_local_time: string;
  last_notified_on: string | null;
};

/**
 * Returns the device-local date to record if the alert is due now, else null.
 * Due when the local time has reached the alert time (within the send
 * window) and the device has not been notified on that local date.
 */
export function morningAlertDueOn(
  device: MorningAlertDevice,
  now: Date,
): string | null {
  if (!device.morning_alert_enabled) return null;
  const alertAt = minutesFromTime(device.morning_alert_local_time);
  if (alertAt === null) return null;
  const local = localClock(now, device.timezone);
  if (device.last_notified_on && device.last_notified_on >= local.date)
    return null;
  const late = local.minutes - alertAt;
  if (late < 0 || late > MORNING_SEND_WINDOW_MINUTES) return null;
  return local.date;
}
