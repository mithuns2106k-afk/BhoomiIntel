const DIMENSIONS = 384;

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/*
 * Dependency-free local vectorizer.
 * It uses normalized word/character n-gram features to provide a persistent
 * vector-retrieval layer without an external vector database or paid service.
 * It is intentionally a lightweight retrieval vector, not a pretrained
 * language embedding. Claude remains responsible for grounded synthesis.
 */
export async function embedText(text) {
  const vector = new Array(DIMENSIONS).fill(0);
  const normalized = String(text || '').toLowerCase().replace(/[^a-z0-9\\s]/g, ' ');
  const words = normalized.split(/\\s+/).filter(Boolean);
  const features = [];
  words.forEach(w => {
    features.push(w);
    for (let i = 0; i < w.length - 2; i++) features.push(w.slice(i, i + 3));
  });
  for (const feature of features) vector[hash(feature) % DIMENSIONS] += 1;
  const norm = Math.sqrt(vector.reduce((s, x) => s + x * x, 0)) || 1;
  return vector.map(x => x / norm);
}

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}
