export type RegisteredDailyReadingEntitlement = {
  capability: "registered_daily_reading";
  basis: "authenticated_account";
  userId: string;
  birthProfileId: string;
};

export function resolveRegisteredDailyReadingEntitlement(input: {
  userId: string | undefined;
  birthProfile: {
    id: string;
    userId: string;
    expiresAt: string;
  } | null;
  now?: Date;
}): RegisteredDailyReadingEntitlement | null {
  if (!input.userId || !input.birthProfile) return null;
  if (input.birthProfile.userId !== input.userId) return null;
  const expiresAt = Date.parse(input.birthProfile.expiresAt);
  if (
    !Number.isFinite(expiresAt) ||
    expiresAt <= (input.now ?? new Date()).getTime()
  )
    return null;
  return {
    capability: "registered_daily_reading",
    basis: "authenticated_account",
    userId: input.userId,
    birthProfileId: input.birthProfile.id,
  };
}
