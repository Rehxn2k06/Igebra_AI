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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const [ragActive, setRagActive] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showCitations, setShowCitations] = useState(true);

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => {
      // #region agent log
      fetch('http://127.0.0.1:7771/ingest/8f17d160-9262-4cf2-834c-5ea30679cc95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c74eb'},body:JSON.stringify({sessionId:'1c74eb',location:'ChatInterface.tsx:onError',message:'useChat stream error',data:{errorMessage:err.message},timestamp:Date.now(),hypothesisId:'F'})}).catch(()=>{});
      // #endregion
    },
    onFinish: ({ message, isError, finishReason }) => {
      // #region agent log
      fetch('http://127.0.0.1:7771/ingest/8f17d160-9262-4cf2-834c-5ea30679cc95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c74eb'},body:JSON.stringify({sessionId:'1c74eb',location:'ChatInterface.tsx:onFinish',message:'Assistant message finished',data:{isError,finishReason,partCount:message.parts?.length??0,parts:message.parts?.map((p)=>({type:p.type,state:'state' in p?p.state:undefined,toolName:p.type.startsWith('tool-')?p.type.slice(5):undefined}))},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    }
  }, [messages, scrollToBottom]);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim() && images.length === 0) return;

      const text = inputText;

      // Convert images to base64 Data URLs so they can be sent to the API
      const files = images.length > 0
        ? await Promise.all(
          images.map(
            (f) =>
              new Promise<{ type: "file"; mediaType: string; filename: string; url: string }>(
                (resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    resolve({
                      type: "file",
                      mediaType: f.type,
                      filename: f.name,
                      url: event.target?.result as string,
                    });
                  };
                  reader.onerror = (err) => reject(err);
                  reader.readAsDataURL(f);
                }
              )
          )
        )
        : undefined;

      setInputText("");
      setImages([]);
      shouldAutoScrollRef.current = true;

      await sendMessage({ text, files });
    },
    [inputText, images, sendMessage]
  );

  const handleSuggestion = useCallback(
    async (text: string) => {
      setInputText("");
      shouldAutoScrollRef.current = true;
      await sendMessage({ text });
    },
    [sendMessage]
  );

  const handleStartBlankChat = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  return (
    <>
      <div className="bg-animated" aria-hidden="true" />
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
            <button
              onClick={() => {
                setMessages([]);
                shouldAutoScrollRef.current = true;
                setInputText("");
                setImages([]);
                handleStartBlankChat();
              }}
              className="new-chat-btn"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, var(--accent-primary) 0%, #5c35cc 100%)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                marginBottom: 16,
                boxShadow: "0 4px 12px rgba(124, 77, 255, 0.2)",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(124, 77, 255, 0.35)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(124, 77, 255, 0.2)";
              }}
            >
              <span>+</span> New Chat
            </button>

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
            <WelcomeScreen
              onSuggestion={handleSuggestion}
              onStartBlankChat={handleStartBlankChat}
            />
          ) : (
            <div
              ref={messagesContainerRef}
              className="messages-container"
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
              onScroll={handleMessagesScroll}
            >
              <div className="messages-column">
                <MessageList messages={messages} isLoading={isLoading} showCitations={showCitations} />
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <InputBar
            input={inputText}
            setInput={setInputText}
            images={images}
            setImages={setImages}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            textareaRef={inputRef}
            showCitations={showCitations}
            setShowCitations={setShowCitations}
          />
        </main>
      </div>
    </>
  );
}
