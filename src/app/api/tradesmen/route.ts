import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { findService } from "@/lib/services";
import { isCity, market } from "@/lib/market";
import { sendEmailSafe } from "@/lib/email";
import { tradesmanApplicationEmail } from "@/lib/emails/templates";

export const runtime = "edge";

type Body = {
  fullName?: string;
  phone?: string; // WhatsApp — the tradesman's identity in Libya
  email?: string;
  trade?: string;
  city?: string;
  serviceArea?: string;
  nationalId?: string;
  yearsExperience?: number;
  previousWork?: string;
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

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "أرسل JSON فيه بيانات التسجيل." },
      { status: 400 }
    );
  }

  const fullName = (body.fullName ?? "").trim();
  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json(
      { ok: false, error: "أدخل اسمك الكامل (من 2 إلى 100 حرف)." },
      { status: 400 }
    );
  }

  const rawPhone = (body.phone ?? "").trim();
  if (!rawPhone || !market.phone.isValid(rawPhone)) {
    return NextResponse.json(
      {
        ok: false,
        error: "أدخل رقم هاتف/واتساب ليبي صحيح (مثال: 091 234 5678).",
      },
      { status: 400 }
    );
  }
  const whatsapp = market.phone.normalize(rawPhone);

  const email = body.email?.trim().toLowerCase() || undefined;
  if (email !== undefined && !isEmailish(email)) {
    return NextResponse.json(
      { ok: false, error: "صيغة البريد الإلكتروني غير صحيحة." },
      { status: 400 }
    );
  }

  const tradeSlug = (body.trade ?? "").trim().toLowerCase();
  const service = findService(tradeSlug);
  if (!service) {
    return NextResponse.json(
      { ok: false, error: "اختر مهنتك من القائمة." },
      { status: 400 }
    );
  }

  const city = (body.city ?? "").trim();
  if (!isCity(city)) {
    return NextResponse.json(
      { ok: false, error: "اختر المدينة من القائمة." },
      { status: 400 }
    );
  }

  const serviceArea = (body.serviceArea ?? "").trim();
  if (serviceArea.length < 2 || serviceArea.length > 120) {
    return NextResponse.json(
      {
        ok: false,
        error: "قولنا المناطق اللي تغطيها (من 2 إلى 120 حرف).",
      },
      { status: 400 }
    );
  }

  const nationalId = (body.nationalId ?? "").trim();
  if (nationalId.length < 6 || nationalId.length > 20) {
    return NextResponse.json(
      {
        ok: false,
        error: "أدخل رقم بطاقة الهوية / الرقم الوطني (من 6 إلى 20 خانة).",
      },
      { status: 400 }
    );
  }

  const yearsExperience =
    typeof body.yearsExperience === "number" &&
    Number.isFinite(body.yearsExperience) &&
    body.yearsExperience >= 0 &&
    body.yearsExperience <= 60
      ? Math.round(body.yearsExperience)
      : undefined;

  const previousWork = body.previousWork?.trim().slice(0, 1000) || undefined;

  const id = newId("tm");

  const db = getDb();
  if (!db) {
    // D1 not bound yet (local dev, brand-new deploy) — degrade gracefully,
    // same pattern as the waitlist route.
    console.log("[tradesmen] DB not bound; registration not persisted:", {
      id,
      whatsapp,
      fullName,
      trade: service.slug,
      city,
      serviceArea,
    });
    if (email) {
      await sendEmailSafe({
        to: email,
        ...tradesmanApplicationEmail({
          applicationId: id,
          fullName,
          trade: service.name,
        }),
      });
    }
    return NextResponse.json(
      { ok: true, id, persisted: false },
      { status: 200 }
    );
  }

  try {
    const existing = await db
      .prepare("SELECT id FROM tradesmen WHERE whatsapp = ?")
      .bind(whatsapp)
      .first<{ id: string }>();
    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "هذا الرقم مسجّل من قبل. بنتواصل معاك على الواتساب بخصوص التوثيق.",
        },
        { status: 409 }
      );
    }

    await db
      .prepare(
        `INSERT INTO tradesmen
           (id, whatsapp, email, full_name, trade, city, service_area,
            national_id, years_experience, previous_work)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        whatsapp,
        email ?? null,
        fullName,
        service.slug,
        city,
        serviceArea,
        nationalId,
        yearsExperience ?? null,
        previousWork ?? null
      )
      .run();
  } catch (err) {
    console.error("[tradesmen] D1 write failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء حفظ طلبك. حاول مرة ثانية." },
      { status: 500 }
    );
  }

  // Application email only when an email was provided — the WhatsApp number
  // is the primary channel in Libya.
  if (email) {
    await sendEmailSafe({
      to: email,
      ...tradesmanApplicationEmail({
        applicationId: id,
        fullName,
        trade: service.name,
      }),
    });
  }

  return NextResponse.json({ ok: true, id, persisted: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "POST { fullName, phone, email?, trade, city, serviceArea, nationalId, yearsExperience?, previousWork? } to this endpoint.",
    },
    { status: 405 }
  );
}
