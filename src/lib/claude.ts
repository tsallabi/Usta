/**
 * Minimal Anthropic Messages API client for Cloudflare Pages edge runtime.
 * Uses `fetch` directly — the official SDK isn't edge-friendly for our needs.
 */

export type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ClaudeCallOptions = {
  apiKey: string;
  model?: string;
  system: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  temperature?: number;
};

export type ClaudeResponse = {
  text: string;
  stopReason: string;
  usage: { inputTokens: number; outputTokens: number };
};

const DEFAULT_MODEL = "claude-sonnet-5";
const ANTHROPIC_VERSION = "2023-06-01";

export class ClaudeError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "ClaudeError";
  }
}

/**
 * Call Anthropic's Messages API. Returns the concatenated assistant text.
 * Throws {@link ClaudeError} on non-2xx responses.
 */
export async function callClaude(
  opts: ClaudeCallOptions
): Promise<ClaudeResponse> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.2,
      system: opts.system,
      messages: opts.messages,
    }),
  });

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text().catch(() => undefined);
    }
    throw new ClaudeError(
      `Anthropic API returned ${res.status}`,
      res.status,
      detail
    );
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  const text = data.content
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("");

  return {
    text,
    stopReason: data.stop_reason,
    usage: {
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    },
  };
}

/**
 * Pull a JSON object out of Claude's response. Tolerates fenced code blocks
 * (```json … ```) and leading/trailing prose.
 */
export function extractJson<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const source = fenced ? fenced[1] : raw;

  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in Claude response");
  }

  const candidate = source.slice(start, end + 1).trim();
  return JSON.parse(candidate) as T;
}
