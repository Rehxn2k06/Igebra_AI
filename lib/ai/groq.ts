import { createGroq } from "@ai-sdk/groq";

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Text + RAG model (large context, fast)
export const CHAT_MODEL = "llama-3.3-70b-versatile";

// Vision model for image understanding
export const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
