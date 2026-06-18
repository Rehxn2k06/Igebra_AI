import { z } from "zod";

// In AI SDK v6, tools are defined as plain objects with description, parameters, and execute
// The `tool()` helper type signature changed — we define them directly.

type ToolDef<TParams extends z.ZodType, TResult> = {
  description: string;
  parameters: TParams;
  execute: (params: z.infer<TParams>) => Promise<TResult>;
};

function defineTool<TParams extends z.ZodType, TResult>(
  def: ToolDef<TParams, TResult>
) {
  return def;
}

// ─── Web Search Tool (DuckDuckGo instant answers) ─────────────────────────────
export const webSearchTool = defineTool({
  description:
    "Search the web for current information, recent events, or topics not in the knowledge base. Use this when the student asks about something that needs up-to-date or external information.",
  parameters: z.object({
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
export const calculateTool = defineTool({
  description:
    "Evaluate mathematical expressions, solve equations, and perform calculations. Supports arithmetic, algebra, trigonometry, and basic calculus expressions.",
  parameters: z.object({
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
      const sanitized = expression
        .replace(/\^/g, "**")
        .replace(/π/g, "Math.PI")
        .replace(/\bpi\b/gi, "Math.PI")
        .replace(/\be\b/g, "Math.E");

      // eslint-disable-next-line no-new-func
      const fn = new Function(
        `const sin=Math.sin,cos=Math.cos,tan=Math.tan,asin=Math.asin,acos=Math.acos,atan=Math.atan,sqrt=Math.sqrt,abs=Math.abs,log=Math.log,log2=Math.log2,log10=Math.log10,exp=Math.exp,floor=Math.floor,ceil=Math.ceil,round=Math.round,pow=Math.pow,PI=Math.PI,E=Math.E,max=Math.max,min=Math.min; return ${sanitized};`
      );
      const result = fn();

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
export const getWeatherTool = defineTool({
  description:
    "Get current weather conditions for any city or location. Useful for geography or science lessons about weather patterns.",
  parameters: z.object({
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
export const generateQuizTool = defineTool({
  description:
    "Generate an interactive multiple-choice quiz on any educational topic. Use when a student wants to test their knowledge or practice for an exam.",
  parameters: z.object({
    topic: z
      .string()
      .describe(
        "The educational topic for the quiz (e.g., 'Photosynthesis', 'Quadratic Equations', 'Python basics')"
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
  execute: async ({ topic, difficulty = "medium", numQuestions = 4 }) => {
    return {
      topic,
      difficulty,
      numQuestions,
      instruction: `Generate exactly ${numQuestions} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty. Format your response as valid JSON with this exact structure: {"questions": [{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": 0, "explanation": "..."}]}. The "correct" field is the 0-based index of the correct option.`,
    };
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allTools: Record<string, any> = {
  web_search: webSearchTool,
  calculate: calculateTool,
  get_weather: getWeatherTool,
  generate_quiz: generateQuizTool,
};
