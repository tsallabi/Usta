import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { market } from "@/lib/market";
import {
  AUTH_NOT_CONFIGURED_MESSAGE,
  buildSessionCookie,
  createSession,
  hashPin,
  isAuthConfigured,
} from "@/lib/auth";

export const runtime = "edge";

type Body = {
  fullName?: string;
  phone?: string;
  pin?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "أرسل JSON فيه بيانات الحساب." },
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
      { ok: false, error: "أدخل رقم هاتف ليبي صحيح (مثال: 091 234 5678)." },
      { status: 400 }
    );
  }
  const phone = market.phone.normalize(rawPhone);

  const pin = (body.pin ?? "").trim();
  if (pin.length < 6 || pin.length > 64) {
    return NextResponse.json(
      {
        ok: false,
        error: "اختر كلمة سر من 6 خانات على الأقل — حروف أو أرقام أو الاثنين.",
      },
      { status: 400 }
    );
  }

  if (!isAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: AUTH_NOT_CONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير مربوطة بعد." },
      { status: 503 }
    );
  }

  try {
    const existing = await db
      .prepare("SELECT id FROM users WHERE phone = ?")
      .bind(phone)
      .first<{ id: string }>();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "هذا الرقم مسجّل من قبل — سجّل دخولك." },
        { status: 409 }
      );
    }

    const pinHash = await hashPin(pin);
    await db
      .prepare(
        "INSERT INTO users (id, phone, full_name, pin_hash) VALUES (?, ?, ?, ?)"
      )
      .bind(newId("usr"), phone, fullName, pinHash)
      .run();
  } catch (err) {
    console.error("[auth/signup] D1 write failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء فتح الحساب. حاول مرة ثانية." },
      { status: 500 }
    );
  }

  const token = await createSession(phone);
  return NextResponse.json(
    { ok: true, name: fullName },
    { status: 200, headers: { "Set-Cookie": buildSessionCookie(token) } }
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "POST { fullName, phone, pin } to this endpoint." },
    { status: 405 }
  );
}
