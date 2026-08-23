import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner } from "@/lib/owner";
import {
  buildSessionCookie,
  createSession,
  isAuthConfigured,
  AUTH_NOT_CONFIGURED_MESSAGE,
} from "@/lib/auth";
import { normalizePhone, isValidPhone } from "@/lib/market";

export const runtime = "edge";

/**
 * POST /api/owner/impersonate — المالك يدخل بجلسة أي حساب (للفحص).
 *
 * يستقبل { phone }، يتأكد أن الرقم له حساب (مستخدم أو أسطى)، وينشئ
 * كوكي جلسة عادية لهذا الرقم — فيتصفح المالك المنصة بعين صاحبها:
 * /account كزبون، /work كأسطى.
 *
 * محمي بـ OWNER_KEY فقط — الأدمن العادي ما يقدرش. الكوكي نفسها كوكي
 * الجلسة القياسية، فتسجيل الخروج العادي يمسحها.
 */

type Body = { phone?: string };

export async function POST(request: Request) {
  const auth = requireOwner(request);
  if (!auth.ok) return auth.response;

  if (!isAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: AUTH_NOT_CONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "أرسل JSON فيه رقم الهاتف." },
      { status: 400 }
    );
  }

  const raw = (body.phone ?? "").trim();
  if (!raw || !isValidPhone(raw)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "أدخل رقم موبايل ليبي صحيح — يبدأ بـ 091 حتى 095 (مثال: 0912345678).",
      },
      { status: 400 }
    );
  }
  const phone = normalizePhone(raw);

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير مربوطة." },
      { status: 503 }
    );
  }

  try {
    const [user, tradesman] = await Promise.all([
      db
        .prepare(`SELECT full_name FROM users WHERE phone = ?1`)
        .bind(phone)
        .first<{ full_name: string }>(),
      db
        .prepare(
          `SELECT full_name, trade, verified_at FROM tradesmen WHERE whatsapp = ?1`
        )
        .bind(phone)
        .first<{
          full_name: string;
          trade: string;
          verified_at: string | null;
        }>(),
    ]);

    if (!user && !tradesman) {
      return NextResponse.json(
        { ok: false, error: "ما فيش حساب مسجّل بهذا الرقم." },
        { status: 404 }
      );
    }

    const token = await createSession(phone);
    const response = NextResponse.json(
      {
        ok: true,
        phone,
        name: user?.full_name ?? tradesman?.full_name ?? "",
        isCustomer: Boolean(user),
        isTradesman: Boolean(tradesman),
        tradesmanVerified: Boolean(tradesman?.verified_at),
      },
      { status: 200 }
    );
    response.headers.set("Set-Cookie", buildSessionCookie(token));
    return response;
  } catch (err) {
    console.error("[owner/impersonate] failed:", err);
    return NextResponse.json(
      { ok: false, error: "تعذّر إنشاء الجلسة — جرّب مرة ثانية." },
      { status: 500 }
    );
  }
}
