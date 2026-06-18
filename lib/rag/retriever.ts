import { search, type DocumentChunk } from "./vectorstore";

export interface RetrievedContext {
  chunks: DocumentChunk[];
  contextString: string;
}

export function retrieve(query: string, topK = 4): RetrievedContext {
  const chunks = search(query, topK);

  if (chunks.length === 0) {
    return { chunks: [], contextString: "" };
  }

  const contextString = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.docName}]\n${c.content}`
    )
    .join("\n\n---\n\n");

  return { chunks, contextString };
}

export function buildRagPrompt(context: RetrievedContext): string {
  if (!context.contextString) return "";
  return `\n\n## Relevant Knowledge Base Context\n\nThe following content was retrieved from the student's uploaded documents to help answer this question:\n\n<context>\n${context.contextString}\n</context>\n\nPlease use this context to provide a grounded, accurate answer. Reference the source when appropriate.\n`;
}
