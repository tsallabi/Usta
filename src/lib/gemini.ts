/**
 * عميل Google Gemini API لبيئة Cloudflare Edge — بنفس أسلوب lib/claude.ts.
 *
 * ليش جيميني؟ مفتاح مجاني بالكامل من Google AI Studio (بدون بطاقة دفع) —
 * الخيار الأنسب لانطلاقة السوق الليبي. نستخدم gemini-2.5-flash مع وضع
 * الإخراج JSON المدمج.
 */

export type GeminiCallOptions = {
  apiKey: string;
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

export type GeminiResponse = {
  text: string;
};

const DEFAULT_MODEL = "gemini-2.5-flash";

export class GeminiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function callGemini(
  opts: GeminiCallOptions
): Promise<GeminiResponse> {
  const model = opts.model ?? DEFAULT_MODEL;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": opts.apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts: [{ text: opts.user }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.2,
          maxOutputTokens: opts.maxTokens ?? 1024,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text().catch(() => undefined);
    }
    throw new GeminiError(`Gemini API returned ${res.status}`, res.status, detail);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = (data.candidates ?? [])
    .flatMap((c) => c.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");

  if (!text) {
    throw new GeminiError("Gemini returned an empty response", 502, data);
  }

  return { text };
}
