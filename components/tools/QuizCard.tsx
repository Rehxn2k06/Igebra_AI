"use client";

import { useState, useEffect } from "react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizResult {
  topic?: string;
  difficulty?: string;
  numQuestions?: number;
  instruction?: string;
}

// This component receives the tool result and then calls the LLM-generated quiz JSON
// Since the LLM generates the quiz text, we parse it from the instruction in subsequent message
export default function QuizCard({ result }: { result: QuizResult }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!result.topic) return;
    generateQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.topic]);

  async function generateQuiz() {
    setLoading(true);
    setError("");
    try {
      const prompt = result.instruction || `Generate ${result.numQuestions || 4} multiple-choice quiz questions about "${result.topic}" at ${result.difficulty || "medium"} difficulty. Format as JSON: {"questions": [{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": 0, "explanation": "..."}]}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt + "\n\nRespond ONLY with the JSON, no markdown, no explanation.",
            },
          ],
        }),
      });

      // Read the streaming response as text and extract JSON
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      let fullText = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const chunk = decoder.decode(value);
        // Extract text from data stream format
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith('0:"')) {
            try {
              const content = JSON.parse('"' + line.slice(3, -1) + '"');
              fullText += content;
            } catch { /* skip */ }
          }
        }
      }

      // Extract JSON from the response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error("Invalid format");
      setQuestions(parsed.questions);
    } catch (err) {
      console.error("Quiz generation error:", err);
      setError("Could not generate quiz. Try again.");
    }
    setLoading(false);
  }

  const handleAnswer = (optionIdx: number) => {
    if (selected !== null) return;
    setSelected(optionIdx);
    if (optionIdx === questions[currentQ].correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
    }
  };

  if (loading) {
    return (
      <div className="tool-card fade-in">
        <div className="tool-card-header">📝 Generating Quiz...</div>
        <div className="tool-card-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 40, borderRadius: 10 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tool-card fade-in">
        <div className="tool-card-header">📝 Quiz — {result.topic}</div>
        <div className="tool-card-body">
          <p style={{ color: "#e57373", fontSize: 14 }}>{error}</p>
          <button className="quiz-next-btn" onClick={generateQuiz} style={{ marginTop: 12 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="tool-card fade-in" role="region" aria-label="Quiz results">
        <div className="tool-card-header">📝 Quiz Complete!</div>
        <div className="tool-card-body" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: pct >= 80 ? "#81c784" : pct >= 50 ? "#ffb74d" : "#e57373" }}>
            {score}/{questions.length}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
            {pct}% — {pct >= 80 ? "Excellent!" : pct >= 50 ? "Good effort!" : "Keep studying!"}
          </div>
          <button
            className="quiz-next-btn"
            style={{ marginTop: 16 }}
            onClick={() => { setCurrentQ(0); setSelected(null); setScore(0); setDone(false); }}
          >
            Retry Quiz
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  if (!q) return null;

  return (
    <div className="tool-card fade-in" role="region" aria-label={`Quiz question ${currentQ + 1} of ${questions.length}`}>
      <div className="tool-card-header">
        📝 Quiz — {result.topic}
        <span style={{ marginLeft: "auto", fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>
          {currentQ + 1}/{questions.length}
        </span>
      </div>
      <div className="tool-card-body">
        <div className="quiz-progress">
          <span className="quiz-score">Score: {score}/{currentQ}</span>
          <span className="chip chip-purple">{result.difficulty}</span>
        </div>

        <p className="quiz-question">{q.question}</p>

        <div className="quiz-options" role="radiogroup" aria-label="Answer options">
          {q.options.map((opt, i) => {
            let cls = "quiz-option";
            if (selected !== null) {
              if (i === q.correct) cls += " correct";
              else if (i === selected && selected !== q.correct) cls += " wrong";
            }
            return (
              <button
                key={i}
                id={`quiz-option-${currentQ}-${i}`}
                className={cls}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                role="radio"
                aria-checked={selected === i}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="quiz-explanation fade-in">
            💡 {q.explanation}
          </div>
        )}

        {selected !== null && (
          <div style={{ textAlign: "right", marginTop: 12 }}>
            <button className="quiz-next-btn" onClick={handleNext} id={`quiz-next-${currentQ}`}>
              {currentQ + 1 >= questions.length ? "See Results →" : "Next Question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
