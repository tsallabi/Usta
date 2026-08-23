import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "edge";

// newId("tm") produces `tm_` + 21 URL-safe alphanumerics.
const USTA_ID_SHAPE = /^tm_[0-9a-zA-Z]{21}$/;

/**
 * GET /api/ustas/[id] — بروفايل أسطى موثّق واحد.
 *
 * عام بدون تسجيل دخول — نفس قاعدة الدليل:
 * لا whatsapp، لا national_id، لا email. التواصل داخل المنصة فقط.
 * غير موجود / غير موثّق / موقوف → 404 واحد ما يفرّقش بينهم
 * (حتى ما نأكّدوش وجود حساب غير منشور).
 */

type UstaRow = {
  id: string;
  full_name: string;
  trade: string;
  city: string;
  service_area: string;
  years_experience: number | null;
  previous_work: string | null;
  created_at: string;
  accepted_count: number;
};

function notFound(): NextResponse {
  return NextResponse.json(
    { ok: false, error: "الأسطى غير موجود." },
    { status: 404 }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!USTA_ID_SHAPE.test(id)) return notFound();

  const db = getDb();
  if (!db) return notFound();

  try {
    const row = await db
      .prepare(
        `SELECT t.id, t.full_name, t.trade, t.city, t.service_area,
                t.years_experience, t.previous_work, t.created_at,
                (SELECT COUNT(*) FROM offers o
                  WHERE o.tradesman_id = t.id AND o.status = 'accepted')
                  AS accepted_count
           FROM tradesmen t
          WHERE t.id = ?1
            AND t.verified_at IS NOT NULL
            AND t.suspended_at IS NULL`
      )
      .bind(id)
      .first<UstaRow>();

    if (!row) return notFound();

    return NextResponse.json({ ok: true, usta: row }, { status: 200 });
  } catch (err) {
    console.error("[ustas/id] D1 read failed:", err);
    return notFound();
  }
}
