"use client";

interface SearchResult {
  result?: string;
  query?: string;
  error?: string;
}

export default function SearchCard({
  result,
  showCitations = true,
}: {
  result: SearchResult;
  showCitations?: boolean;
}) {
  if (result.error || !result.result || !showCitations) {
    return null; // Let the LLM handle it in text
  }

  return (
    <div className="tool-card fade-in" role="region" aria-label={`Web search results for ${result.query}`}>
      <div className="tool-card-header">
        🌐 Web Search — <span style={{ fontWeight: 400, textTransform: "none" }}>{result.query}</span>
      </div>
      <div className="tool-card-body">
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {result.result}
        </div>
      </div>
    </div>
  );
}
