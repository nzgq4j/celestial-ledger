export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
] as const;

export function normalizeLongitude(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function longitudeToZodiac(longitude: number) {
  const normalized = normalizeLongitude(longitude);
  const signIndex = Math.floor(normalized / 30);
  const within = normalized - signIndex * 30;
  const degree = Math.floor(within);
  const minute = Math.floor((within - degree) * 60 + 1e-8);
  return { sign: SIGNS[signIndex], degree, minute, signIndex, normalized };
}

export function formatDegree(longitude: number): string {
  const z = longitudeToZodiac(longitude);
  return `${z.degree}° ${String(z.minute).padStart(2, "0")}′ ${z.sign}`;
}
