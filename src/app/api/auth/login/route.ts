import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { market } from "@/lib/market";
import {
  AUTH_NOT_CONFIGURED_MESSAGE,
  buildSessionCookie,
  createSession,
  isAuthConfigured,
  verifyPin,
} from "@/lib/auth";

export const runtime = "edge";

type Body = {
  phone?: string;
  pin?: string;
};

const WRONG_CREDENTIALS = "الرقم أو الرمز السري غير صحيح.";

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "أرسل JSON فيه رقم الهاتف والرمز السري." },
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
      { ok: false, error: WRONG_CREDENTIALS },
      { status: 401 }
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

  let name: string;
  try {
    const user = await db
      .prepare("SELECT full_name, pin_hash FROM users WHERE phone = ?")
      .bind(phone)
      .first<{ full_name: string; pin_hash: string }>();

    if (!user || !(await verifyPin(pin, user.pin_hash))) {
      return NextResponse.json(
        { ok: false, error: WRONG_CREDENTIALS },
        { status: 401 }
      );
    }
    name = user.full_name;

    await db
      .prepare(
        "UPDATE users SET last_login_at = datetime('now') WHERE phone = ?"
      )
      .bind(phone)
      .run();
  } catch (err) {
    console.error("[auth/login] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء تسجيل الدخول. حاول مرة ثانية." },
      { status: 500 }
    );
  }

  const token = await createSession(phone);
  return NextResponse.json(
    { ok: true, name },
    { status: 200, headers: { "Set-Cookie": buildSessionCookie(token) } }
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "POST { phone, pin } to this endpoint." },
    { status: 405 }
  );
}
