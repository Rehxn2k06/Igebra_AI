export interface ChunkOptions {
  chunkSize?: number;   // tokens (approx chars/4)
  overlap?: number;     // overlap in chars
}

const DEFAULT_CHUNK_CHARS = 1200;  // ~300 tokens
const DEFAULT_OVERLAP = 150;

export function chunkText(
  text: string,
  options: ChunkOptions = {}
): string[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_CHARS;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  // Normalize whitespace
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (normalized.length <= chunkSize) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    // Try to break at sentence boundary
    if (end < normalized.length) {
      const boundary = findSentenceBoundary(normalized, end);
      if (boundary > start + chunkSize / 2) {
        end = boundary;
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

function findSentenceBoundary(text: string, nearIndex: number): number {
  // Look backward for sentence-ending punctuation
  const lookback = Math.min(200, nearIndex);
  const segment = text.slice(nearIndex - lookback, nearIndex);

  // Find the last sentence boundary
  const matches = [...segment.matchAll(/[.!?]\s+/g)];
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    return nearIndex - lookback + last.index! + last[0].length;
  }

  // Fall back to paragraph boundary
  const paraIdx = segment.lastIndexOf("\n\n");
  if (paraIdx > 0) {
    return nearIndex - lookback + paraIdx + 2;
  }

  // Fall back to newline
  const nlIdx = segment.lastIndexOf("\n");
  if (nlIdx > 0) {
    return nearIndex - lookback + nlIdx + 1;
  }

  return nearIndex;
}
