export function horoscopeUtcDateKey(dateInput = new Date()) {
  if (Number.isNaN(dateInput.getTime())) throw new RangeError("Invalid date");
  return dateInput.toISOString().slice(0, 10);
}

export function millisecondsUntilNextUtcMidnight(now = Date.now()) {
  const current = new Date(now);
  if (Number.isNaN(current.getTime())) throw new RangeError("Invalid date");
  const nextMidnight = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate() + 1,
  );
  return Math.max(0, nextMidnight - now);
}
