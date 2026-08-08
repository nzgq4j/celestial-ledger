export function contentTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function shingles(value: string) {
  const words = contentTokens(value);
  return new Set(
    words
      .slice(0, -2)
      .map((_, index) => words.slice(index, index + 3).join(" ")),
  );
}

/** Trigram-shingle Jaccard similarity. Keep this stable: horoscopes use it. */
export function contentSimilarity(left: string, right: string) {
  const a = shingles(left);
  const b = shingles(right);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const item of a) if (b.has(item)) overlap += 1;
  return overlap / (a.size + b.size - overlap);
}

export type SimilarityMatch = {
  similarity: number;
  leftIndex: number;
  rightIndex: number;
};

export function maximumPairwiseSimilarity(values: string[]): SimilarityMatch {
  let result: SimilarityMatch = {
    similarity: 0,
    leftIndex: -1,
    rightIndex: -1,
  };
  for (let left = 0; left < values.length; left += 1)
    for (let right = left + 1; right < values.length; right += 1) {
      const similarity = contentSimilarity(values[left], values[right]);
      if (similarity > result.similarity)
        result = { similarity, leftIndex: left, rightIndex: right };
    }
  return result;
}

export function maximumReferenceSimilarity(
  value: string,
  references: string[],
) {
  return references.reduce(
    (maximum, reference) =>
      Math.max(maximum, contentSimilarity(value, reference)),
    0,
  );
}
