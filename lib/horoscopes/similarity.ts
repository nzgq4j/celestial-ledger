export function horoscopeTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function shingles(value: string) {
  const words = horoscopeTokens(value);
  return new Set(
    words
      .slice(0, -2)
      .map((_, index) => words.slice(index, index + 3).join(" ")),
  );
}

export function horoscopeSimilarity(left: string, right: string) {
  const a = shingles(left);
  const b = shingles(right);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const item of a) if (b.has(item)) overlap += 1;
  return overlap / (a.size + b.size - overlap);
}
