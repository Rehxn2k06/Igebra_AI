"use client";

import { type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import WeatherCard from "../tools/WeatherCard";
import QuizCard from "../tools/QuizCard";
import MathCard from "../tools/MathCard";
import SearchCard from "../tools/SearchCard";

interface Props {
  message: UIMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  const renderParts = () => {
    if (!message.parts || message.parts.length === 0) {
      return null;
    }

    return message.parts.map((part, i) => {
      switch (part.type) {
        case "text":
          if (!part.text) return null;
          if (isUser) {
            return <p key={i} style={{ whiteSpace: "pre-wrap" }}>{part.text}</p>;
          }
          return (
            <ReactMarkdown
              key={i}
              remarkPlugins={[remarkGfm]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  if (match) {
                    return (
                      <SyntaxHighlighter
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        style={oneDark as any}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ borderRadius: 10, fontSize: 13, margin: "10px 0" }}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    );
                  }
                  return <code className={className} {...props}>{children}</code>;
                },
              }}
            >
              {part.text}
            </ReactMarkdown>
          );

        case "file":
          if (part.mediaType?.startsWith("image/")) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={typeof part.url === "string" ? part.url : ""}
                alt="Attached image"
                className="message-image"
              />
            );
          }
          return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        case "tool-invocation": {
          // AI SDK v6 uses DynamicToolUIPart - state/toolName/output are on the part directly
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = part as any;
          if (!p || p.state !== "result") return null;

          switch (p.toolName) {
            case "get_weather":
              return <WeatherCard key={i} result={p.output} />;
            case "generate_quiz":
              return <QuizCard key={i} result={p.output} />;
            case "calculate":
              return <MathCard key={i} result={p.output} />;
            case "web_search":
              return <SearchCard key={i} result={p.output} />;
            default:
              return null;
          }
        }

        default:
          return null;
      }
    });
  };

  return (
    <div className={`message-row ${isUser ? "user" : ""} fade-in`}>
      <div className={`message-avatar ${isUser ? "user" : "ai"}`} aria-hidden="true">
        {isUser ? "👤" : "🧠"}
      </div>
      <div>
        <div className={`message-bubble ${isUser ? "user" : "ai"}`}>
          {renderParts()}
        </div>
      </div>
    </div>
  );
}
