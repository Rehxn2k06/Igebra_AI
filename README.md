# 🧠 Igebra AI — Multimodal RAG Chatbot

> An intelligent Ed-Tech study assistant with multimodal input (text + images), Retrieval-Augmented Generation (RAG), and interactive tool-calling capabilities.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://igebra-ai.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-orange)](https://groq.com)

---

## ✨ Features

| Feature | Details |
|---|---|
| 💬 **Multimodal Chat** | Ask questions with text AND images (paste or upload) |
| 📚 **RAG Pipeline** | Upload your notes/PDFs → get personalized, grounded answers |
| 🖼️ **Vision AI** | Analyzes diagrams, equations, graphs using Llama 4 Scout |
| 🌐 **Web Search** | Real-time DuckDuckGo search (no API key needed) |
| 🧮 **Calculator** | Evaluates math expressions with natural syntax |
| 🌤️ **Weather** | Live weather via Open-Meteo (free, no API key) |
| 📝 **Quiz Generator** | Interactive MCQ quizzes with explanations and scoring |
| ⚡ **Streaming** | Real-time streaming responses via Vercel AI SDK v6 |
| 🎨 **Generative UI** | Tool results rendered as rich React components |

---

## 🛠️ Tech Stack (100% Free)

- **Framework**: Next.js 16 (App Router)
- **AI SDK**: Vercel AI SDK v6
- **LLM**: [Groq](https://groq.com) (Llama 3.3 70B + Llama 4 Scout Vision) — **free tier**
- **RAG**: In-memory BM25 via [MiniSearch](https://github.com/lucaong/minisearch) — no vector DB needed
- **Styling**: Vanilla CSS (dark glassmorphism)
- **Deployment**: [Vercel](https://vercel.com) Hobby plan — **free**

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Rehxn2k06/Igebra_AI.git
cd Igebra_AI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
GROQ_API_KEY=your_groq_api_key_here
```

Get your free Groq API key at [console.groq.com](https://console.groq.com).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Demo Guide

### Text Chat
1. Open the chatbot
2. Type any question (e.g., *"Explain the Pythagorean theorem"*)
3. The AI will respond with markdown-formatted, educational answers

### Image Analysis
1. Click the 📷 button or **paste an image** directly into the input box
2. Type your question about the image (e.g., *"What does this diagram show?"*)
3. The vision model will analyze and explain the image

### RAG (Knowledge Base)
1. In the left sidebar, drag-and-drop or click to upload a **PDF, TXT, or MD file** (e.g., your class notes)
2. Ask a question related to the document
3. The AI will retrieve relevant chunks and answer based on your content
4. The "RAG Active" badge in the header confirms retrieval is enabled

### Tool Calling
| Example Prompt | Tool Used | Output |
|---|---|---|
| "What's the weather in Mumbai?" | 🌤️ Weather | Interactive weather card |
| "Quiz me on photosynthesis" | 📝 Quiz Generator | Interactive MCQ quiz |
| "Calculate sin(pi/4) + 2^8" | 🧮 Calculator | Instant result card |
| "Search for latest AI news" | 🌐 Web Search | Search results card |

---

## 📁 Project Structure

```
Igebra_AI/
├── app/
│   ├── layout.tsx          # Root layout + SEO metadata
│   ├── page.tsx            # Redirect to /chat
│   ├── chat/page.tsx       # Chat page
│   ├── globals.css         # Design system (dark glassmorphism)
│   └── api/
│       ├── chat/route.ts   # Streaming chat API (RAG + tools)
│       └── ingest/route.ts # Document upload + BM25 indexing
├── components/
│   ├── chat/               # Chat UI components
│   ├── rag/                # Knowledge base upload UI
│   └── tools/              # Generative UI cards (Weather, Quiz, Math, Search)
├── lib/
│   ├── ai/                 # Groq client, tools, prompts
│   └── rag/                # Chunker, vectorstore, retriever
├── .env.example            # Environment variable template
└── README.md
```

---

## 🌐 Deployment (Vercel)

1. **Fork/clone** this repository and push to your GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add the environment variable in Vercel dashboard:
   - `GROQ_API_KEY` = your key from [console.groq.com](https://console.groq.com)
4. Click **Deploy** — done!

> **Note**: The in-memory RAG store resets on each Vercel cold start. For persistent storage, you can integrate [Upstash Vector](https://upstash.com) (free tier available).

---

## 🏗️ Architecture

```
User Input (Text/Image)
        │
        ▼
   /api/chat route
        │
   ┌────▼────────────────────┐
   │ 1. RAG Retrieval         │ ← BM25 search over uploaded docs
   │ 2. Build system prompt   │ ← SYSTEM_PROMPT + retrieved context
   │ 3. Route to model:       │
   │    • Vision model for img│ ← Groq Llama 4 Scout
   │    • Chat model for text │ ← Groq Llama 3.3 70B
   │ 4. Stream with tools     │ ← Multi-step tool calling
   └────┬────────────────────┘
        │
        ▼
   Streaming Response → Generative UI Components
```

---

## 📄 License

MIT — feel free to use for educational purposes.

---

*Built with ❤️ using Groq, Vercel AI SDK, and Next.js*
