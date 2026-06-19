import { generateText, tool } from "ai";
import { z } from "zod";
import { groq, FAST_GEN_MODEL } from "./groq";

type Operator = "+" | "-" | "*" | "/" | "^";
type Token =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: Operator }
  | { type: "paren"; value: "(" | ")" };

const FUNCTIONS: Record<string, (value: number) => number> = {
  abs: Math.abs,
  acos: Math.acos,
  asin: Math.asin,
  atan: Math.atan,
  ceil: Math.ceil,
  cos: Math.cos,
  exp: Math.exp,
  floor: Math.floor,
  log: Math.log,
  log10: Math.log10,
  log2: Math.log2,
  round: Math.round,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
};

const CONSTANTS: Record<string, number> = {
  e: Math.E,
  pi: Math.PI,
};

const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct: z.number().int().min(0).max(3),
  explanation: z.string(),
});

const quizSchema = z.object({
  title: z.string(),
  questions: z.array(quizQuestionSchema).min(2).max(8),
});

class ExpressionParser {
  private readonly tokens: Token[];
  private index = 0;

  constructor(expression: string) {
    this.tokens = tokenizeExpression(expression);
  }

  parse() {
    const value = this.parseExpression();

    if (this.index < this.tokens.length) {
      throw new Error("Unexpected trailing input");
    }

    return value;
  }

  private parseExpression(): number {
    let value = this.parseTerm();

    while (true) {
      if (this.matchOperator("+")) {
        value += this.parseTerm();
      } else if (this.matchOperator("-")) {
        value -= this.parseTerm();
      } else {
        return value;
      }
    }
  }

  private parseTerm(): number {
    let value = this.parsePower();

    while (true) {
      if (this.matchOperator("*")) {
        value *= this.parsePower();
      } else if (this.matchOperator("/")) {
        const divisor = this.parsePower();
        if (divisor === 0) {
          throw new Error("Division by zero");
        }
        value /= divisor;
      } else {
        return value;
      }
    }
  }

  private parsePower(): number {
    const base = this.parseUnary();

    if (this.matchOperator("^")) {
      return Math.pow(base, this.parsePower());
    }

    return base;
  }

  private parseUnary(): number {
    if (this.matchOperator("+")) return this.parseUnary();
    if (this.matchOperator("-")) return -this.parseUnary();
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.peek();

    if (!token) {
      throw new Error("Unexpected end of expression");
    }

    if (token.type === "number") {
      this.index += 1;
      return token.value;
    }

    if (token.type === "identifier") {
      this.index += 1;
      const identifier = token.value.toLowerCase();

      if (this.matchParen("(")) {
        const fn = FUNCTIONS[identifier];
        if (!fn) {
          throw new Error(`Unsupported function: ${identifier}`);
        }
        const arg = this.parseExpression();
        this.expectParen(")");
        return fn(arg);
      }

      const constant = CONSTANTS[identifier];
      if (constant === undefined) {
        throw new Error(`Unsupported identifier: ${identifier}`);
      }
      return constant;
    }

    if (this.matchParen("(")) {
      const value = this.parseExpression();
      this.expectParen(")");
      return value;
    }

    throw new Error("Unexpected token");
  }

  private peek() {
    return this.tokens[this.index];
  }

  private matchOperator(operator: Operator) {
    const token = this.peek();
    if (token?.type === "operator" && token.value === operator) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private matchParen(paren: "(" | ")") {
    const token = this.peek();
    if (token?.type === "paren" && token.value === paren) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private expectParen(paren: ")" | "(") {
    if (!this.matchParen(paren)) {
      throw new Error(`Expected ${paren}`);
    }
  }
}

function normalizeExpression(expression: string) {
  return expression
    .trim()
    .replace(/\*\*/g, "^")
    .replace(/π/g, "pi")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[–—]/g, "-");
}

function tokenizeExpression(expression: string): Token[] {
  const tokens: Token[] = [];
  const normalized = normalizeExpression(expression);
  let index = 0;

  while (index < normalized.length) {
    const char = normalized[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let end = index + 1;
      while (end < normalized.length && /[0-9.]/.test(normalized[end])) {
        end += 1;
      }
      const value = Number(normalized.slice(index, end));
      if (!Number.isFinite(value)) {
        throw new Error("Invalid number");
      }
      tokens.push({ type: "number", value });
      index = end;
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let end = index + 1;
      while (end < normalized.length && /[a-zA-Z0-9_]/.test(normalized[end])) {
        end += 1;
      }
      tokens.push({
        type: "identifier",
        value: normalized.slice(index, end),
      });
      index = end;
      continue;
    }

    if ("+-*/^".includes(char)) {
      tokens.push({ type: "operator", value: char as Operator });
      index += 1;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      index += 1;
      continue;
    }

    throw new Error(`Unsupported character: ${char}`);
  }

  return tokens;
}

function evaluateExpression(expression: string) {
  return new ExpressionParser(expression).parse();
}

// ─── Web Search Tool (DuckDuckGo instant answers) ─────────────────────────────
export const webSearchTool = tool({
  description:
    "Search the web for current information, recent events, or topics not in the knowledge base. Use this when the student asks about something that needs up-to-date or external information.",
  inputSchema: z.object({
    query: z.string().describe("The search query to look up"),
  }),
  execute: async ({ query }) => {
    try {
      const encoded = encodeURIComponent(query);
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`
      );
      const data = await res.json();

      const results: string[] = [];

      if (data.AbstractText) {
        results.push(`**Summary:** ${data.AbstractText}`);
        if (data.AbstractURL) results.push(`**Source:** ${data.AbstractURL}`);
      }

      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const topics = data.RelatedTopics.slice(0, 4)
          .filter((t: { Text?: string }) => t.Text)
          .map(
            (t: { Text: string; FirstURL?: string }) =>
              `• ${t.Text}${t.FirstURL ? ` ([link](${t.FirstURL}))` : ""}`
          );
        if (topics.length > 0) {
          results.push("\n**Related Topics:**");
          results.push(...topics);
        }
      }

      if (results.length === 0) {
        return {
          result: `No instant answer found for "${query}". Try rephrasing or asking me directly.`,
          query,
        };
      }

      return { result: results.join("\n"), query };
    } catch {
      return {
        result: `Search failed. Please try again or ask me directly about "${query}".`,
        query,
      };
    }
  },
});

// ─── Calculator Tool ──────────────────────────────────────────────────────────
export const calculateTool = tool({
  description:
    "Evaluate mathematical expressions, solve equations, and perform calculations. Supports arithmetic, algebra, trigonometry, and basic calculus expressions.",
  inputSchema: z.object({
    expression: z
      .string()
      .describe(
        "The mathematical expression to evaluate (e.g., '2^10', 'sin(pi/4)', '(3x^2 + 2x - 1) for x=3')"
      ),
    showSteps: z
      .boolean()
      .optional()
      .describe("Whether to show step-by-step solution"),
  }),
  execute: async ({ expression, showSteps }) => {
    try {
      const result = evaluateExpression(expression);

      if (typeof result !== "number" || isNaN(result)) {
        return { error: "Could not evaluate expression", expression };
      }

      const formatted = Number.isInteger(result)
        ? result.toString()
        : result.toPrecision(10).replace(/\.?0+$/, "");

      return { expression, result: formatted, showSteps: showSteps ?? false };
    } catch {
      return {
        error: `Could not evaluate: ${expression}. Make sure the expression is valid.`,
        expression,
      };
    }
  },
});

// ─── Weather Tool (Open-Meteo — completely free, no API key) ──────────────────
export const getWeatherTool = tool({
  description:
    "Get current weather conditions for any city or location. Useful for geography or science lessons about weather patterns.",
  inputSchema: z.object({
    location: z.string().describe("City name or location (e.g., 'Mumbai', 'New York')"),
  }),
  execute: async ({ location }) => {
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        return { error: `Location "${location}" not found.` };
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
      );
      const weather = await weatherRes.json();
      const c = weather.current;

      const weatherCodes: Record<number, string> = {
        0: "Clear sky ☀️", 1: "Mainly clear 🌤️", 2: "Partly cloudy ⛅", 3: "Overcast ☁️",
        45: "Foggy 🌫️", 48: "Icy fog 🌫️", 51: "Light drizzle 🌦️", 53: "Moderate drizzle 🌦️",
        55: "Dense drizzle 🌧️", 61: "Light rain 🌧️", 63: "Moderate rain 🌧️", 65: "Heavy rain 🌧️",
        71: "Light snow 🌨️", 73: "Moderate snow 🌨️", 75: "Heavy snow ❄️",
        80: "Light showers 🌦️", 81: "Moderate showers 🌧️", 82: "Heavy showers ⛈️", 95: "Thunderstorm ⛈️",
      };

      return {
        location: `${name}, ${country}`,
        temperature: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        condition: weatherCodes[c.weather_code] || "Unknown",
        unit: "°C",
      };
    } catch {
      return { error: `Failed to fetch weather for "${location}".` };
    }
  },
});

// ─── Quiz Generator Tool ──────────────────────────────────────────────────────
export const generateQuizTool = tool({
  description:
    "Generate an interactive multiple-choice quiz from a topic or from source material provided by the user. Use when a student wants to test their knowledge or practice for an exam.",
  inputSchema: z.object({
    topic: z
      .string()
      .optional()
      .describe(
        "The educational topic for the quiz (e.g., 'Photosynthesis', 'Quadratic Equations', 'Python basics')"
      ),
    sourceMaterial: z
      .string()
      .optional()
      .describe(
        "A passage, notes excerpt, or study material the quiz should be based on"
      ),
    difficulty: z
      .enum(["easy", "medium", "hard"])
      .optional()
      .describe("Difficulty level of the quiz"),
    numQuestions: z
      .number()
      .min(2)
      .max(8)
      .optional()
      .describe("Number of questions (2-8)"),
  }),
  execute: async ({ topic, sourceMaterial, difficulty = "medium", numQuestions = 4 }) => {
    const cleanTopic = topic?.trim();
    const cleanSourceMaterial = sourceMaterial?.trim();

    if (!cleanTopic && !cleanSourceMaterial) {
      return {
        error: "No quiz topic or source material was provided.",
      };
    }

    try {
      const jsonPrompt = cleanSourceMaterial
        ? `Create a ${difficulty} multiple-choice quiz with exactly ${numQuestions} questions based only on the study material below.

Study material:
"""
${cleanSourceMaterial}
"""

Each question must have 4 options, exactly one correct answer (0-indexed), and a short explanation.

Respond ONLY with a valid JSON object — no markdown, no extra text:
{
  "title": "Quiz title here",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct."
    }
  ]
}`
        : `Create a ${difficulty} multiple-choice quiz with exactly ${numQuestions} questions about "${cleanTopic}".

Each question must have 4 options, exactly one correct answer (0-indexed), and a short explanation.

Respond ONLY with a valid JSON object — no markdown, no extra text:
{
  "title": "Quiz title here",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct."
    }
  ]
}`;

      const { text } = await generateText({
        model: groq(FAST_GEN_MODEL),
        prompt: jsonPrompt,
        temperature: 0.3,
      });

      // Extract the JSON block (model might wrap in ```json fences)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object in response");
      const parsed = quizSchema.parse(JSON.parse(jsonMatch[0]));

      return {
        topic: cleanTopic ?? "Provided material",
        difficulty,
        title: parsed.title,
        questions: parsed.questions,
      };
    } catch {
      return {
        error: "Could not generate the quiz right now.",
        topic: cleanTopic ?? "Provided material",
      };
    }
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allTools: Record<string, any> = {
  web_search: webSearchTool,
  calculate: calculateTool,
  get_weather: getWeatherTool,
  generate_quiz: generateQuizTool,
};
