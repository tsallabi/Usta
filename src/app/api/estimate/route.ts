import { NextResponse } from "next/server";
import { callClaude, extractJson } from "@/lib/claude";
import { callGemini } from "@/lib/gemini";
import { getEnvVar } from "@/lib/db";
import { findService } from "@/lib/services";
import { isCity } from "@/lib/market";

export const runtime = "edge";

type Body = {
  service?: string;
  description?: string;
  budget?: number;
  city?: string;
};

type ClaudeEstimate = {
  min_lyd: number;
  max_lyd: number;
  confidence: "low" | "medium" | "high";
  sample_note: string;
  scope_note: string;
};

type EstimateResponse = {
  ok: true;
  service: string;
  min: number;
  max: number;
  currency: "LYD";
  confidence: "low" | "medium" | "high";
  sampleNote: string;
  scopeNote: string;
  source: "gemini" | "claude" | "fallback";
  model?: string;
};

const SYSTEM_PROMPT = `You are Tawwa's (توّا) fair-price AI for Libya's home services market (2026). Your ONLY job is to give homeowners a fair price RANGE for a specific service they describe. Tawwa is a fair-price marketplace connecting Libyan homeowners with verified tradesmen (أسطوات) in Tripoli, Benghazi and Misrata.

STRICT RULES:
1. NEVER diagnose the fault or suggest the cause. You do not know the fault.
2. ALWAYS return a range in Libyan dinars (LYD, min and max), never a single number.
3. Base the range on TYPICAL 2026 Libyan market rates (Tripoli / Benghazi / Misrata).
4. Adjust for scope hints in the description (parts needed, out-of-hours, urgency).
5. If the description is too vague to price fairly, widen the range and mark confidence "low".
6. Emergency / out-of-hours call-outs command a premium — reflect it in the max.
7. Parts availability in Libya can affect price and timing — when the job clearly needs imported parts or appliances, mention it in scope_note.
8. Write sample_note and scope_note in Arabic (Libyan-friendly Modern Standard is fine). Use Western digits (0-9) only — never Eastern Arabic numerals.
9. sample_note and scope_note must be simple Modern Standard Arabic flavored with Libyan vocabulary (e.g. الكوشينة for kitchen, الحوش for house, بريزة for power socket, الشيشمة for tap/faucet — never حنفية) — NEVER use Gulf dialect words or phrasing.
10. Return ONLY a valid JSON object matching the schema below. No prose. No code fences. No apologies.

SCHEMA:
{
  "min_lyd": integer,          // lower bound of the fair range in LYD
  "max_lyd": integer,          // upper bound of the fair range in LYD
  "confidence": "low" | "medium" | "high",
  "sample_note": string,       // بالعربي: سطر قصير يوضح على شن مبني النطاق (مثال: "نطاق معتاد في طرابلس لأعطال بريزات الكوشينة")
  "scope_note": string         // بالعربي: سطر واحد يوضح شن داخل في السعر أو تنبيه مهم (مثال: "اليد العاملة + قطعة غيار وحدة. التمديدات الكبيرة تكلف أكثر.")
}`;

function buildUserPrompt(input: {
  serviceName: string;
  description: string;
  budgetLyd?: number;
  city?: string;
}): string {
  const parts = [
    `الخدمة: ${input.serviceName}`,
    `المدينة: ${input.city ?? "ليبيا (غير محددة)"}`,
    `الوصف: ${input.description}`,
  ];
  if (input.budgetLyd && input.budgetLyd > 0) {
    parts.push(`ميزانية الزبون التقريبية: ${input.budgetLyd} د.ل`);
  }
  parts.push("\nأرجع كائن JSON فقط.");
  return parts.join("\n");
}

function fallbackEstimate(
  serviceSlug: string,
  serviceName: string
): EstimateResponse {
  const service = findService(serviceSlug);
  const min = service?.fallbackRange.min ?? 30;
  const max = service?.fallbackRange.max ?? 250;
  return {
    ok: true,
    service: serviceName,
    min,
    max,
    currency: "LYD",
    confidence: "low",
    sampleNote:
      "نطاق تقريبي لأسعار السوق الليبي (وضع تجريبي — مفتاح الذكاء الاصطناعي غير مفعّل)",
    scopeNote:
      "هذا مؤشر تقريبي للأعطال الصغيرة فقط. أضف مفتاح GEMINI_API_KEY (مجاني من Google AI Studio) لتقديرات ذكية حقيقية.",
    source: "fallback",
  };
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "أرسل JSON فيه الخدمة والوصف." },
      { status: 400 }
    );
  }

  const serviceSlug = (body.service ?? "").trim().toLowerCase();
  const description = (body.description ?? "").trim();
  const budget =
    typeof body.budget === "number" && body.budget >= 0
      ? Math.round(body.budget)
      : undefined;
  const cityRaw = body.city?.trim() || undefined;
  const city = cityRaw && isCity(cityRaw) ? cityRaw : undefined;

  const service = findService(serviceSlug);
  if (!service) {
    return NextResponse.json(
      { ok: false, error: "اختر خدمة من القائمة." },
      { status: 400 }
    );
  }
  if (description.length < 10) {
    return NextResponse.json(
      { ok: false, error: "صف الشغل في جملة أو جملتين." },
      { status: 400 }
    );
  }
  if (description.length > 2000) {
    return NextResponse.json(
      { ok: false, error: "خلّي الوصف أقل من 2000 حرف." },
      { status: 400 }
    );
  }

  const userPrompt = buildUserPrompt({
    serviceName: service.name,
    description,
    budgetLyd: budget,
    city,
  });

  // ترتيب المزوّدين: جيميني أولاً (مفتاح مجاني من Google AI Studio —
  // الأنسب لانطلاقة السوق الليبي)، ثم Claude إن وُجد مفتاحه، ثم النطاق
  // التقريبي. أي فشل من مزوّد ينزل بهدوء للخيار التالي.
  const geminiKey = getEnvVar("GEMINI_API_KEY");
  const anthropicKey = getEnvVar("ANTHROPIC_API_KEY");

  function validate(raw: string): ClaudeEstimate | null {
    let parsed: ClaudeEstimate;
    try {
      parsed = extractJson<ClaudeEstimate>(raw);
    } catch {
      return null;
    }
    if (
      typeof parsed.min_lyd !== "number" ||
      typeof parsed.max_lyd !== "number" ||
      parsed.min_lyd < 0 ||
      parsed.max_lyd < parsed.min_lyd
    ) {
      return null;
    }
    return parsed;
  }

  function respond(
    parsed: ClaudeEstimate,
    source: "gemini" | "claude",
    model: string
  ) {
    const response: EstimateResponse = {
      ok: true,
      service: service!.name,
      min: Math.round(parsed.min_lyd),
      max: Math.round(parsed.max_lyd),
      currency: "LYD",
      confidence: parsed.confidence ?? "medium",
      sampleNote: parsed.sample_note ?? "",
      scopeNote: parsed.scope_note ?? "",
      source,
      model,
    };
    return NextResponse.json(response, { status: 200 });
  }

  if (geminiKey) {
    try {
      const gemini = await callGemini({
        apiKey: geminiKey,
        system: SYSTEM_PROMPT,
        user: userPrompt,
        maxTokens: 2048,
        temperature: 0.2,
      });
      const parsed = validate(gemini.text);
      if (parsed) return respond(parsed, "gemini", "gemini-2.5-flash");
      console.error("[estimate] Gemini returned invalid JSON:", gemini.text);
    } catch (err) {
      console.error("[estimate] Gemini error:", err);
    }
  }

  if (anthropicKey) {
    try {
      const claude = await callClaude({
        apiKey: anthropicKey,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: 400,
        temperature: 0.2,
      });
      const parsed = validate(claude.text);
      if (parsed) return respond(parsed, "claude", "claude-sonnet-5");
      console.error("[estimate] Claude returned invalid JSON:", claude.text);
    } catch (err) {
      console.error("[estimate] Claude error:", err);
    }
  }

  return NextResponse.json(fallbackEstimate(service.slug, service.name), {
    status: 200,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "POST { service, description, budget?, city? } to this endpoint.",
    },
    { status: 405 }
  );
}
