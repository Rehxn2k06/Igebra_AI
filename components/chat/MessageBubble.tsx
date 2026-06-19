"use client";

import { getToolName, isToolUIPart, type UIMessage } from "ai";
import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import WeatherCard from "../tools/WeatherCard";
import QuizCard from "../tools/QuizCard";
import MathCard from "../tools/MathCard";
import SearchCard from "../tools/SearchCard";

interface Props {
  message: UIMessage;
  showCitations?: boolean;
}

function ToolErrorCard({ toolName, errorText }: { toolName: string; errorText: string }) {
  return (
    <div className="tool-card fade-in">
      <div className="tool-card-header">{toolName.replace(/_/g, " ")}</div>
      <div className="tool-card-body">
        <p style={{ color: "#e57373", fontSize: 14 }}>{errorText}</p>
      </div>
    </div>
  );
}

const preprocessMarkdown = (text: string) => {
  return text.replace(/\r\n/g, "\n").replace(/(?<!\n)\n(?!\n)/g, "  \n");
};

export default function MessageBubble({ message, showCitations = true }: Props) {
  const isUser = message.role === "user";

  if (!isUser && message.parts?.length) {
    // #region agent log
    fetch('http://127.0.0.1:7771/ingest/8f17d160-9262-4cf2-834c-5ea30679cc95',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c74eb'},body:JSON.stringify({sessionId:'1c74eb',location:'MessageBubble.tsx:render',message:'Rendering assistant message',data:{messageId:message.id,partCount:message.parts.length,parts:message.parts.map((p,i)=>({index:i,type:p.type,state:'state' in p?p.state:undefined,hasOutput:'output' in p&&p.output!=null,hasText:'text' in p?!!p.text:false}))},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }

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
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
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
              {preprocessMarkdown(part.text)}
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

        default:
          if (isToolUIPart(part)) {
            const toolName = getToolName(part);

            if (part.state === "output-error") {
              return (
                <ToolErrorCard
                  key={i}
                  toolName={toolName}
                  errorText={part.errorText}
                />
              );
            }

            if (part.state !== "output-available") {
              return null;
            }

            switch (toolName) {
              case "get_weather":
                return (
                  <WeatherCard
                    key={i}
                    result={part.output as ComponentProps<typeof WeatherCard>["result"]}
                  />
                );
              case "generate_quiz":
                return (
                  <QuizCard
                    key={i}
                    result={part.output as ComponentProps<typeof QuizCard>["result"]}
                  />
                );
              case "calculate":
                return (
                  <MathCard
                    key={i}
                    result={part.output as ComponentProps<typeof MathCard>["result"]}
                  />
                );
              case "web_search":
                return (
                  <SearchCard
                    key={i}
                    result={part.output as ComponentProps<typeof SearchCard>["result"]}
                    showCitations={showCitations}
                  />
                );
              default:
                return null;
            }
          }
          return null;
      }
    });
  };

  return (
    <div className={`message-row ${isUser ? "user" : ""} fade-in`}>
      <div className={`message-avatar ${isUser ? "user" : "ai"}`} aria-hidden="true">
        {isUser ? "👤" : "🧠"}
      </div>
      <div className="message-content">
        <div className={`message-bubble ${isUser ? "user" : "ai"}`}>
          {renderParts()}
        </div>
      </div>
    </div>
  );
}
