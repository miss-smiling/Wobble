/** Normalize user input for cache key comparison. */
export function normalizeInput(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Lightweight deterministic hash for cache document IDs. */
export function hashInput(text: string): string {
  const normalized = normalizeInput(text);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
