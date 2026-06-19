import { type NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs, convertToModelMessages, pruneMessages } from "ai";
import { groq, CHAT_MODEL, VISION_MODEL } from "@/lib/ai/groq";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { allTools } from "@/lib/ai/tools";
import { retrieve, buildRagPrompt } from "@/lib/rag/retriever";
import { getTotalChunks } from "@/lib/rag/vectorstore";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    // Normalize messages to UI Message format (with parts) if they are in CoreMessage format (with content)
    const normalizedMessages = messages.map((m: any) => {
      if (m.parts) return m;
      if (m.content) {
        if (typeof m.content === "string") {
          return {
            ...m,
            parts: [{ type: "text", text: m.content }],
          };
        } else if (Array.isArray(m.content)) {
          return {
            ...m,
            parts: m.content.map((part: any) => {
              if (typeof part === "string") return { type: "text", text: part };
              if (part.type === "text") return { type: "text", text: part.text };
              if (part.type === "image") {
                return {
                  type: "file",
                  mediaType: part.mimeType || "image/png",
                  url: part.image,
                };
              }
              return part;
            }),
          };
        }
      }
      return {
        ...m,
        parts: [{ type: "text", text: "" }],
      };
    });

    // Convert messages to ModelMessage[] format for streamText
    const convertedMessages = await convertToModelMessages(normalizedMessages);

    // Map file parts to image parts for vision models
    const processedMessages = convertedMessages.map((msg: any) => {
      if (Array.isArray(msg.content)) {
        return {
          ...msg,
          content: msg.content.map((part: any) => {
            if (part.type === "file" && part.mediaType?.startsWith("image/")) {
              return {
                type: "image",
                image: part.data,
                mimeType: part.mediaType,
              };
            }
            return part;
          }),
        };
      }
      return msg;
    });

    const recentMessages =
      processedMessages.length > 12
        ? processedMessages.slice(processedMessages.length - 12)
        : processedMessages;

    const prunedMessages = pruneMessages({
      messages: recentMessages,
      toolCalls: "before-last-6-messages",
      emptyMessages: "remove",
    });

    // Check if latest message has an image
    const lastMessage = prunedMessages[prunedMessages.length - 1];
    let hasImage = false;
    let textQuery = "";

    if (lastMessage && Array.isArray(lastMessage.content)) {
      hasImage = lastMessage.content.some((p: any) => p.type === "image");
      const textPart = lastMessage.content.find(
        (p: any) => p.type === "text"
      ) as { type: "text"; text: string } | undefined;
      textQuery = textPart?.text || "";
    } else if (lastMessage && typeof lastMessage.content === "string") {
      textQuery = lastMessage.content;
    }

    // RAG retrieval
    let ragPromptAddition = "";
    const hasKnowledgeBase = getTotalChunks() > 0;

    if (hasKnowledgeBase && textQuery) {
      const context = retrieve(textQuery);
      ragPromptAddition = buildRagPrompt(context);
    }

    const systemPrompt = SYSTEM_PROMPT + ragPromptAddition;

    // Always use the tool-capable 70B model for text chat;
    // vision model only when an image is present.
    const model = hasImage ? groq(VISION_MODEL) : groq(CHAT_MODEL);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: prunedMessages,
      tools: allTools,
      stopWhen: stepCountIs(3),
      temperature: 0.4,
      onError: (err: unknown) => {
        const e = err as { error?: unknown };
        const inner = (e?.error ?? err) as Record<string, unknown>;
        const innerErr = inner as unknown as Error;
        console.error("[streamText error]", {
          name: innerErr?.name,
          message: innerErr?.message,
          status: inner?.status,
          responseBody: inner?.responseBody,
          cause: innerErr?.cause,
        });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
