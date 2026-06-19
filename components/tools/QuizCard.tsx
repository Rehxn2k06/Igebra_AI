"use client";

import { useState } from "react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizResult {
  topic?: string;
  difficulty?: string;
  title?: string;
  questions?: QuizQuestion[];
  error?: string;
}

export default function QuizCard({ result }: { result: QuizResult }) {
  const questions = result.questions ?? [];
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

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

  if (result.error || questions.length === 0) {
    return (
      <div className="tool-card fade-in">
        <div className="tool-card-header">📝 Quiz — {result.topic ?? "Study quiz"}</div>
        <div className="tool-card-body">
          <p style={{ color: "#e57373", fontSize: 14 }}>
            {result.error ?? "Could not generate quiz questions."}
          </p>
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
        📝 Quiz — {result.title ?? result.topic ?? "Study quiz"}
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
