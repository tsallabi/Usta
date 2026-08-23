import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { callClaude, ClaudeError, extractJson } from "@/lib/claude";
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
  source: "claude" | "fallback";
  model?: string;
};

const SYSTEM_PROMPT = `You are Usta's (أسطى) fair-price AI for Libya's home services market (2026). Your ONLY job is to give homeowners a fair price RANGE for a specific service they describe. Usta is a fair-price marketplace connecting Libyan homeowners with verified tradesmen (أسطوات) in Tripoli, Benghazi and Misrata.

STRICT RULES:
1. NEVER diagnose the fault or suggest the cause. You do not know the fault.
2. ALWAYS return a range in Libyan dinars (LYD, min and max), never a single number.
3. Base the range on TYPICAL 2026 Libyan market rates (Tripoli / Benghazi / Misrata).
4. Adjust for scope hints in the description (parts needed, out-of-hours, urgency).
5. If the description is too vague to price fairly, widen the range and mark confidence "low".
6. Emergency / out-of-hours call-outs command a premium — reflect it in the max.
7. Parts availability in Libya can affect price and timing — when the job clearly needs imported parts or appliances, mention it in scope_note.
8. Write sample_note and scope_note in Arabic (Libyan-friendly Modern Standard is fine). Use Western digits (0-9) only — never Eastern Arabic numerals.
9. Return ONLY a valid JSON object matching the schema below. No prose. No code fences. No apologies.

SCHEMA:
{
  "min_lyd": integer,          // lower bound of the fair range in LYD
  "max_lyd": integer,          // upper bound of the fair range in LYD
  "confidence": "low" | "medium" | "high",
  "sample_note": string,       // بالعربي: سطر قصير يوضح على شنو مبني النطاق (مثال: "نطاق معتاد في طرابلس لأعطال أفياش الكوشينة")
  "scope_note": string         // بالعربي: سطر واحد يوضح شنو داخل في السعر أو تنبيه مهم (مثال: "اليد العاملة + قطعة غيار وحدة. التمديدات الكبيرة تكلف أكثر.")
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
      "هذا مؤشر تقريبي فقط. فعّل متغير البيئة ANTHROPIC_API_KEY للحصول على تقديرات الذكاء الاصطناعي.",
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

  let apiKey: string | undefined;
  try {
    const { env } = getRequestContext();
    apiKey = (env as unknown as { ANTHROPIC_API_KEY?: string }).ANTHROPIC_API_KEY;
  } catch {
    apiKey = process.env.ANTHROPIC_API_KEY;
  }

  if (!apiKey) {
    // Graceful demo: return a market-typical range so the UI still works
    // before the user wires their Anthropic key in Cloudflare Pages.
    return NextResponse.json(fallbackEstimate(service.slug, service.name), {
      status: 200,
    });
  }

  try {
    const claude = await callClaude({
      apiKey,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt({
            serviceName: service.name,
            description,
            budgetLyd: budget,
            city,
          }),
        },
      ],
      maxTokens: 400,
      temperature: 0.2,
    });

    let parsed: ClaudeEstimate;
    try {
      parsed = extractJson<ClaudeEstimate>(claude.text);
    } catch (err) {
      console.error("[estimate] Failed to parse Claude JSON:", err, claude.text);
      return NextResponse.json(fallbackEstimate(service.slug, service.name), {
        status: 200,
      });
    }

    if (
      typeof parsed.min_lyd !== "number" ||
      typeof parsed.max_lyd !== "number" ||
      parsed.min_lyd < 0 ||
      parsed.max_lyd < parsed.min_lyd
    ) {
      return NextResponse.json(fallbackEstimate(service.slug, service.name), {
        status: 200,
      });
    }

    const response: EstimateResponse = {
      ok: true,
      service: service.name,
      min: Math.round(parsed.min_lyd),
      max: Math.round(parsed.max_lyd),
      currency: "LYD",
      confidence: parsed.confidence ?? "medium",
      sampleNote: parsed.sample_note ?? "",
      scopeNote: parsed.scope_note ?? "",
      source: "claude",
      model: "claude-sonnet-5",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof ClaudeError) {
      console.error("[estimate] Claude error", err.status, err.detail);
      // For known rate-limit / auth errors, fall back so the UX keeps working.
      if (err.status === 401 || err.status === 429 || err.status >= 500) {
        return NextResponse.json(fallbackEstimate(service.slug, service.name), {
          status: 200,
        });
      }
    } else {
      console.error("[estimate] Unexpected error:", err);
    }
    return NextResponse.json(fallbackEstimate(service.slug, service.name), {
      status: 200,
    });
  }
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
