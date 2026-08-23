import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { findService } from "@/lib/services";
import { isCity, market } from "@/lib/market";
import { sendEmailSafe } from "@/lib/email";
import { jobPostedEmail } from "@/lib/emails/templates";

export const runtime = "edge";

type EstimateBody = {
  min?: number;
  max?: number;
  confidence?: string;
  source?: string;
};

type Body = {
  phone?: string;
  email?: string;
  service?: string;
  description?: string;
  budget?: number;
  city?: string;
  area?: string;
  estimate?: EstimateBody;
};

// فحص بسيط لصيغة البريد — البريد اختياري؛ يُتحقق منه فقط عند إدخاله.
function isEmailish(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 5 &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

const CONFIDENCES = ["low", "medium", "high"] as const;
const SOURCES = ["gemini", "claude", "fallback"] as const;

type ValidEstimate = {
  min: number;
  max: number;
  confidence: (typeof CONFIDENCES)[number];
  source: (typeof SOURCES)[number];
};

// The estimates table has CHECK constraints on confidence/source, so only
// insert an estimate row when the payload fully matches the schema.
// A malformed estimate never blocks the job itself.
function validateEstimate(raw: EstimateBody | undefined): ValidEstimate | null {
  if (!raw) return null;
  if (
    typeof raw.min !== "number" ||
    typeof raw.max !== "number" ||
    !Number.isFinite(raw.min) ||
    !Number.isFinite(raw.max) ||
    raw.min < 0 ||
    raw.max < raw.min
  ) {
    return null;
  }
  const confidence = CONFIDENCES.find((c) => c === raw.confidence);
  const source = SOURCES.find((s) => s === raw.source);
  if (!confidence || !source) return null;
  return {
    min: Math.round(raw.min),
    max: Math.round(raw.max),
    confidence,
    source,
  };
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "أرسل JSON فيه رقم الهاتف والخدمة والوصف." },
      { status: 400 }
    );
  }

  const rawPhone = (body.phone ?? "").trim();
  if (!rawPhone || !market.phone.isValid(rawPhone)) {
    return NextResponse.json(
      { ok: false, error: "أدخل رقم هاتف ليبي صحيح (مثال: 091 234 5678)." },
      { status: 400 }
    );
  }
  const phone = market.phone.normalize(rawPhone);

  const email = body.email?.trim().toLowerCase() || undefined;
  if (email !== undefined && !isEmailish(email)) {
    return NextResponse.json(
      { ok: false, error: "صيغة البريد الإلكتروني غير صحيحة." },
      { status: 400 }
    );
  }

  const serviceSlug = (body.service ?? "").trim().toLowerCase();
  const service = findService(serviceSlug);
  if (!service) {
    return NextResponse.json(
      { ok: false, error: "اختر خدمة من القائمة." },
      { status: 400 }
    );
  }

  const description = (body.description ?? "").trim();
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

  const budget =
    typeof body.budget === "number" &&
    Number.isFinite(body.budget) &&
    body.budget >= 0
      ? Math.round(body.budget)
      : undefined;

  const city = body.city?.trim() || undefined;
  if (city !== undefined && !isCity(city)) {
    return NextResponse.json(
      { ok: false, error: "اختر المدينة من القائمة." },
      { status: 400 }
    );
  }
  const area = body.area?.trim().slice(0, 120) || undefined;
  const estimate = validateEstimate(body.estimate);

  const jobId = newId("job");
  const db = getDb();

  // Graceful degradation — same philosophy as the waitlist route. If the D1
  // binding isn't attached yet (local dev, brand-new deploy) we never fail
  // the user; the write is best-effort and we say so via `persisted`.
  // Confirmation email only when an email was provided — phone is the
  // identity in Libya. Fire-and-safe: an email outage never fails the post.
  const confirmation = jobPostedEmail({
    jobId,
    service: service.name,
    description,
    min: estimate?.min,
    max: estimate?.max,
  });

  if (!db) {
    console.log("[jobs] D1 not bound; job not persisted:", {
      id: jobId,
      service: service.slug,
    });
    if (email) await sendEmailSafe({ to: email, ...confirmation });
    return NextResponse.json(
      { ok: true, id: jobId, persisted: false },
      { status: 200 }
    );
  }

  try {
    let estimateId: string | null = null;
    if (estimate) {
      estimateId = newId("est");
      await db
        .prepare(
          `INSERT INTO estimates
             (id, service, description, budget_lyd, city, min_lyd, max_lyd, confidence, source)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
        )
        .bind(
          estimateId,
          service.slug,
          description,
          budget ?? null,
          city ?? null,
          estimate.min,
          estimate.max,
          estimate.confidence,
          estimate.source
        )
        .run();
    }

    await db
      .prepare(
        `INSERT INTO jobs
           (id, customer_phone, customer_email, service, description, budget_lyd, city, area, status, estimate_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'open', ?9)`
      )
      .bind(
        jobId,
        phone,
        email ?? null,
        service.slug,
        description,
        budget ?? null,
        city ?? null,
        area ?? null,
        estimateId
      )
      .run();

    if (email) await sendEmailSafe({ to: email, ...confirmation });
    return NextResponse.json(
      { ok: true, id: jobId, persisted: true },
      { status: 200 }
    );
  } catch (err) {
    console.error("[jobs] D1 write failed:", err);
    // Deliberately do not fail the user; they posted in good faith.
    if (email) await sendEmailSafe({ to: email, ...confirmation });
    return NextResponse.json(
      { ok: true, id: jobId, persisted: false },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "POST { phone, email?, service, description, budget?, city?, area?, estimate? } to this endpoint.",
    },
    { status: 405 }
  );
}
