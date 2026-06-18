import MiniSearch from "minisearch";

export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  content: string;
  chunkIndex: number;
}

// Global in-memory store (persists for the lifetime of the server process)
let miniSearch: MiniSearch<DocumentChunk> | null = null;
const chunkStore = new Map<string, DocumentChunk>();

function getSearchIndex(): MiniSearch<DocumentChunk> {
  if (!miniSearch) {
    miniSearch = new MiniSearch<DocumentChunk>({
      fields: ["content", "docName"],
      storeFields: ["id", "docId", "docName", "content", "chunkIndex"],
      searchOptions: {
        boost: { content: 2, docName: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }
  return miniSearch;
}

export function addChunks(chunks: DocumentChunk[]): void {
  const index = getSearchIndex();
  const newChunks = chunks.filter((c) => !chunkStore.has(c.id));
  if (newChunks.length > 0) {
    index.addAll(newChunks);
    newChunks.forEach((c) => chunkStore.set(c.id, c));
  }
}

export function removeDocument(docId: string): void {
  const index = getSearchIndex();
  const toRemove = Array.from(chunkStore.values()).filter((c) => c.docId === docId);
  if (toRemove.length > 0) {
    index.removeAll(toRemove);
    toRemove.forEach((c) => chunkStore.delete(c.id));
  }
}

export function search(query: string, topK = 4): DocumentChunk[] {
  const index = getSearchIndex();
  if (chunkStore.size === 0) return [];

  const results = index.search(query).slice(0, topK);
  return results.map((r) => chunkStore.get(r.id)!).filter(Boolean);
}

export function getDocuments(): { id: string; name: string; chunkCount: number }[] {
  const docs = new Map<string, { name: string; count: number }>();
  chunkStore.forEach((chunk) => {
    if (!docs.has(chunk.docId)) {
      docs.set(chunk.docId, { name: chunk.docName, count: 0 });
    }
    docs.get(chunk.docId)!.count++;
  });
  return Array.from(docs.entries()).map(([id, { name, count }]) => ({
    id,
    name,
    chunkCount: count,
  }));
}

export function getTotalChunks(): number {
  return chunkStore.size;
}
