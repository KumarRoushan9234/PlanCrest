/**
 * AI Mode talks to any OpenAI compatible chat completions API.
 *
 * Providers and models come only from the environment, and are tried in order
 * until one answers:
 *
 *   LLM_FALLBACK_ORDER="openrouter,groqcloud,deepseek"
 *   OPENROUTER_API_KEY=...   OPENROUTER_MODELS="deepseek/deepseek-v4-flash,google/gemini-2.5-flash"
 *   GROQCLOUD_API_KEY=...    GROQCLOUD_MODELS="openai/gpt-oss-120b"
 *   DEEPSEEK_API_KEY=...     DEEPSEEK_MODELS="deepseek-chat"
 *
 * OPENROUTER_MODEL (single model) is still accepted for older configs.
 */

const PROVIDERS = {
  openrouter: { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", keyEnv: "OPENROUTER_API_KEY", modelsEnv: ["OPENROUTER_MODELS", "OPENROUTER_MODEL"], urlEnv: "OPENROUTER_BASE_URL" },
  groqcloud: { label: "GroqCloud", baseUrl: "https://api.groq.com/openai/v1", keyEnv: "GROQCLOUD_API_KEY", modelsEnv: ["GROQCLOUD_MODELS"], urlEnv: "GROQCLOUD_BASE_URL" },
  deepseek: { label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", keyEnv: "DEEPSEEK_API_KEY", modelsEnv: ["DEEPSEEK_MODELS"], urlEnv: "DEEPSEEK_BASE_URL" },
};

const list = (value) =>
  String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

// Placeholders such as "your_deepseek_api_key_here" count as not configured
const realKey = (key) => (key && !/^your[_-]|_here$|^changeme$/i.test(key) ? key : "");

/** The configured provider chain, in fallback order. Read on every call so a restart picks up .env changes. */
export const getProviderChain = () => {
  const order = list(process.env.LLM_FALLBACK_ORDER);
  const names = order.length ? order : Object.keys(PROVIDERS);
  return names
    .map((name) => {
      const def = PROVIDERS[name.toLowerCase()];
      if (!def) return null;
      const key = realKey(process.env[def.keyEnv]);
      const models = def.modelsEnv.map((e) => list(process.env[e])).find((m) => m.length) || [];
      if (!key || !models.length) return null;
      return { name: name.toLowerCase(), label: def.label, key, models, baseUrl: (process.env[def.urlEnv] || def.baseUrl).replace(/\/$/, "") };
    })
    .filter(Boolean);
};

export const isAiEnabled = () => getProviderChain().length > 0;

/** The first model in the chain (what normally answers). */
export const getAiModel = () => {
  const first = getProviderChain()[0];
  return first ? first.models[0] : null;
};

export class AiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Convert the tool definitions into OpenAI function calling format. */
export const toOpenAiTools = (definitions) =>
  definitions.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }));

const callOnce = async (provider, model, { messages, tools, json, maxTokens }) => {
  let response;
  try {
    response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json",
        ...(provider.name === "openrouter" ? { "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173", "X-Title": "PlanCrest" } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        ...(tools?.length ? { tools: toOpenAiTools(tools), tool_choice: "auto" } : {}),
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS) || 60_000),
    });
  } catch (error) {
    return { ok: false, reason: `unreachable (${error.name})`, skipProvider: false };
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 200);
    // A bad key fails every model of that provider, so move to the next provider
    const skipProvider = response.status === 401 || response.status === 403 || response.status === 402;
    return { ok: false, status: response.status, reason: `${response.status} ${detail}`, skipProvider };
  }

  const data = await response.json().catch(() => null);
  const choice = data?.choices?.[0];
  if (!choice?.message) return { ok: false, reason: "empty response", skipProvider: false };
  return {
    ok: true,
    message: choice.message,
    finishReason: choice.finish_reason,
    usage: { input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0 },
  };
};

/**
 * Call the chat completions endpoint, falling back through every configured
 * provider and model until one succeeds.
 * @returns {Promise<{message, finishReason, usage, provider, model}>}
 */
export const createCompletion = async ({ messages, tools, json = false, maxTokens = 2000 }) => {
  const chain = getProviderChain();
  if (!chain.length) throw new AiError(503, "AI Mode is not configured.");

  const failures = [];
  let sawRateLimit = false;
  for (const provider of chain) {
    for (const model of provider.models) {
      const result = await callOnce(provider, model, { messages, tools, json, maxTokens });
      if (result.ok) {
        if (failures.length) console.warn(`AI fallback used ${provider.name}/${model} after: ${failures.join(" | ")}`);
        return { ...result, provider: provider.name, model };
      }
      if (result.status === 429) sawRateLimit = true;
      failures.push(`${provider.name}/${model}: ${result.reason}`);
      if (result.skipProvider) break;
    }
  }

  console.error("All AI providers failed:", failures.join(" | "));
  if (sawRateLimit) throw new AiError(429, "The AI service is busy. Please try again shortly.");
  throw new AiError(502, "No AI provider could answer. Check the API keys and model names in the server settings.");
};

/** Translate errors into an HTTP status and a message safe to show users. */
export const describeAiError = (error) =>
  error instanceof AiError
    ? { status: error.status, message: error.message }
    : { status: 500, message: "Something went wrong while contacting the AI service." };
