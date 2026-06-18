"use client";

interface MathResult {
  expression?: string;
  result?: string;
  error?: string;
  showSteps?: boolean;
}

export default function MathCard({ result }: { result: MathResult }) {
  if (result.error) {
    return (
      <div className="tool-card fade-in">
        <div className="tool-card-header">🧮 Calculator</div>
        <div className="tool-card-body">
          <p style={{ color: "#e57373", fontSize: 14 }}>{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-card fade-in" role="region" aria-label="Calculator result">
      <div className="tool-card-header">🧮 Calculator</div>
      <div className="tool-card-body">
        <div className="math-expression">{result.expression}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 20 }}>=</span>
          <div className="math-result">{result.result}</div>
        </div>
      </div>
    </div>
  );
}
