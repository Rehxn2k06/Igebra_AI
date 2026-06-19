import { createGroq } from "@ai-sdk/groq";

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Primary chat model — supports tool calling on Groq.
// Always used for the main chat regardless of RAG state.
export const CHAT_MODEL = "llama-3.3-70b-versatile";

// Cheap model used ONLY inside tool helpers (e.g. generateObject with mode:'json').
// Does NOT support tool calling itself — do not pass tools to this model.
export const FAST_GEN_MODEL = "llama-3.1-8b-instant";

// Vision model for image understanding.
export const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

