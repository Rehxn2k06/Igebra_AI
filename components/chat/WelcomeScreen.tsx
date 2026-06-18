"use client";

interface Props {
  onSuggestion: (text: string) => void;
}

const suggestions = [
  {
    icon: "📐",
    text: "Explain the Pythagorean theorem with examples",
  },
  {
    icon: "🧪",
    text: "How does photosynthesis work? Explain step by step",
  },
  {
    icon: "💻",
    text: "Write a Python function to find prime numbers",
  },
  {
    icon: "📝",
    text: "Quiz me on basic calculus derivatives",
  },
  {
    icon: "🌤️",
    text: "What's the weather in Mumbai right now?",
  },
  {
    icon: "🧮",
    text: "Calculate 2^10 + sin(pi/4) step by step",
  },
];

export default function WelcomeScreen({ onSuggestion }: Props) {
  return (
    <div className="welcome-screen fade-in">
      <div className="welcome-logo" aria-hidden="true">🧠</div>
      <h1 className="welcome-title">Igebra AI</h1>
      <p className="welcome-subtitle">
        Your intelligent study assistant. Ask questions about math, science,
        programming, or any subject. Upload your notes for personalized, RAG-powered answers.
      </p>

      <div className="suggestion-grid" role="list" aria-label="Conversation starters">
        {suggestions.map((s, i) => (
          <button
            key={i}
            id={`suggestion-${i}`}
            className="suggestion-card"
            onClick={() => onSuggestion(s.text)}
            role="listitem"
            aria-label={`Start conversation: ${s.text}`}
          >
            <div className="suggestion-card-icon">{s.icon}</div>
            <div className="suggestion-card-text">{s.text}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 32, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <span className="chip chip-purple">📚 Upload notes for RAG</span>
        <span className="chip chip-teal">🖼️ Paste images for vision</span>
        <span className="chip chip-green">⚡ Powered by Groq</span>
      </div>
    </div>
  );
}
