"use client";

import { useState } from "react";

interface MathResult {
  expression?: string;
  result?: string;
  steps?: string;
  error?: string;
  showSteps?: boolean;
}

export default function MathCard({ result }: { result: MathResult }) {
  const [stepsOpen, setStepsOpen] = useState(false);

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
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 20 }}>=</span>
          <div className="math-result">{result.result}</div>
        </div>

        {result.steps && (
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setStepsOpen((v) => !v)}
              style={{
                background: "rgba(124, 77, 255, 0.1)",
                border: "1px solid rgba(124, 77, 255, 0.25)",
                borderRadius: "var(--radius-sm)",
                color: "var(--accent-primary)",
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.2s",
              }}
            >
              {stepsOpen ? "▲" : "▼"} {stepsOpen ? "Hide" : "Show"} steps
            </button>
            {stepsOpen && (
              <pre
                style={{
                  marginTop: 10,
                  padding: "12px 14px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "inherit",
                }}
              >
                {result.steps}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
