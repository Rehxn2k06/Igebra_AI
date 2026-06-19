"use client";

import { type UIMessage } from "ai";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface Props {
  messages: UIMessage[];
  isLoading: boolean;
  showCitations?: boolean;
}

export default function MessageList({ messages, isLoading, showCitations = true }: Props) {
  return (
    <>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} showCitations={showCitations} />
      ))}
      {isLoading && (
        <div className="message-row fade-in">
          <div className="message-avatar ai" aria-hidden="true">🧠</div>
          <div className="message-bubble ai">
            <TypingIndicator />
          </div>
        </div>
      )}
    </>
  );
}
