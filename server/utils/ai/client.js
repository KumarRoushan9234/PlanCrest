/**
 * AI Mode runs on OpenRouter (OpenAI-compatible API).
 * Both the key and the model come from the environment so the model can be
 * swapped at any time without a code change:
 *   OPENROUTER_API_KEY=...
 *   OPENROUTER_MODEL=deepseek/deepseek-v4-flash   (any OpenRouter model id)
 */
const baseUrl = () => (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");

export const isAiEnabled = () => Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL);

export const getAiModel = () => process.env.OPENROUTER_MODEL;

export class AiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Convert the tool definitions into OpenAI function-calling format. */
export const toOpenAiTools = (definitions) =>
  definitions.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }));

/**
 * Call the chat completions endpoint.
 * @returns {Promise<{message: object, finishReason: string, usage: {input:number, output:number}}>}
 */
export const createCompletion = async ({ messages, tools, json = false, maxTokens = 2000 }) => {
  if (!isAiEnabled()) throw new AiError(503, "AI Mode is not configured.");
  let response;
  try {
    response = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
        "X-Title": "PlanCrest",
      },
      body: JSON.stringify({
        model: getAiModel(),
        messages,
        max_tokens: maxTokens,
        ...(tools?.length ? { tools: toOpenAiTools(tools), tool_choice: "auto" } : {}),
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new AiError(502, "The AI service is unreachable. Please try again.");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("OpenRouter error", response.status, detail.slice(0, 300));
    if (response.status === 401 || response.status === 403) throw new AiError(503, "The AI service is misconfigured (invalid API key).");
    if (response.status === 402) throw new AiError(503, "The AI service has no credits left.");
    if (response.status === 429) throw new AiError(429, "The AI service is busy. Please try again shortly.");
    if (response.status === 400 || response.status === 404) throw new AiError(502, "The configured AI model rejected the request. Check OPENROUTER_MODEL.");
    throw new AiError(502, "The AI service is temporarily unavailable.");
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  if (!choice?.message) throw new AiError(502, "The AI service returned an empty response.");
  return {
    message: choice.message,
    finishReason: choice.finish_reason,
    usage: { input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0 },
  };
};

/** Translate errors into an HTTP status and a message safe to show users. */
export const describeAiError = (error) =>
  error instanceof AiError
    ? { status: error.status, message: error.message }
    : { status: 500, message: "Something went wrong while contacting the AI service." };
