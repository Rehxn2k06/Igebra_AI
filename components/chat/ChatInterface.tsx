"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useState, useEffect, useCallback } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import KnowledgeBase from "../rag/KnowledgeBase";
import WelcomeScreen from "./WelcomeScreen";

export default function ChatInterface() {
  const [images, setImages] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ragActive, setRagActive] = useState(false);
  const [inputText, setInputText] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim() && images.length === 0) return;

      const text = inputText;
      const files = images.length > 0
        ? images.map((f) => ({ type: "file" as const, mediaType: f.type, url: URL.createObjectURL(f) }))
        : undefined;

      setInputText("");
      setImages([]);

      await sendMessage({ text, files });
    },
    [inputText, images, sendMessage]
  );

  const handleSuggestion = useCallback(
    async (text: string) => {
      setInputText("");
      await sendMessage({ text });
    },
    [sendMessage]
  );

  return (
    <div className="bg-animated" aria-hidden="true">
      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar" role="complementary" aria-label="Knowledge base and settings">
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-icon" aria-hidden="true">🧠</div>
              <div>
                <div className="logo-text">Igebra AI</div>
                <div className="logo-badge">ED-TECH</div>
              </div>
            </div>
          </div>

          <div className="sidebar-content">
            <p className="sidebar-section-title">Knowledge Base</p>
            <KnowledgeBase onRagUpdate={setRagActive} />

            <div style={{ marginTop: 24 }}>
              <p className="sidebar-section-title">Capabilities</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 0" }}>
                {[
                  { icon: "🖼️", label: "Image Analysis", desc: "Vision AI" },
                  { icon: "📚", label: "RAG Retrieval", desc: ragActive ? "Active" : "Upload docs" },
                  { icon: "🌐", label: "Web Search", desc: "DuckDuckGo" },
                  { icon: "🧮", label: "Calculator", desc: "Math solver" },
                  { icon: "🌤️", label: "Weather", desc: "Open-Meteo" },
                  { icon: "📝", label: "Quiz Generator", desc: "Interactive" },
                ].map((cap) => (
                  <div
                    key={cap.label}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: "var(--radius-md)" }}
                  >
                    <span style={{ fontSize: 16 }}>{cap.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{cap.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{cap.desc}</div>
                    </div>
                    {cap.label === "RAG Retrieval" && ragActive && (
                      <span className="chip chip-green" style={{ marginLeft: "auto" }}>ON</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "auto", paddingTop: 24 }}>
              <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.8 }}>
                Powered by Groq · Vercel AI SDK<br />
                Llama 3.3 70B · Llama 4 Scout Vision
              </p>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-area" role="main">
          <header className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4caf50", boxShadow: "0 0 8px #4caf50" }} />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>AI Tutor Online</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {ragActive && <span className="chip chip-teal"><span>📚</span> RAG Active</span>}
              <span className="chip chip-purple"><span>⚡</span> Groq</span>
            </div>
          </header>

          {messages.length === 0 ? (
            <WelcomeScreen onSuggestion={handleSuggestion} />
          ) : (
            <div className="messages-container" role="log" aria-live="polite" aria-label="Chat messages">
              <MessageList messages={messages} isLoading={isLoading} />
              <div ref={messagesEndRef} />
            </div>
          )}

          <InputBar
            input={inputText}
            setInput={setInputText}
            images={images}
            setImages={setImages}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </main>
      </div>
    </div>
  );
}
