import { type NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs } from "ai";
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

    // Check if latest message has an image
    const lastMessage = messages[messages.length - 1];
    const hasImage = lastMessage?.content && Array.isArray(lastMessage.content) &&
      lastMessage.content.some((p: { type: string }) => p.type === "image");

    // Extract text query for RAG
    let textQuery = "";
    if (Array.isArray(lastMessage?.content)) {
      const textPart = lastMessage.content.find((p: { type: string }) => p.type === "text");
      textQuery = textPart?.text || "";
    } else if (typeof lastMessage?.content === "string") {
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

    // Choose model based on whether there's an image
    const model = hasImage ? groq(VISION_MODEL) : groq(CHAT_MODEL);

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools: allTools,
      stopWhen: stepCountIs(5),
      temperature: 0.7,
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
