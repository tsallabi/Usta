import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";

export const runtime = "edge";

type OfferRow = {
  id: string;
  status: string;
  price_lyd: number;
  message: string | null;
  created_at: string;
  tradesman_name: string;
  trade: string;
  city: string;
  years_experience: number | null;
  verified: number;
  whatsapp: string | null;
};

/**
 * عروض الأسطوات على طلب المستخدم — لصاحب الطلب فقط.
 * خصوصية: رقم واتساب الأسطى يظهر فقط للعرض المقبول (لحظة الفتح).
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const phone = await getSessionPhone(request);
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "سجّل دخولك أولاً لعرض العروض." },
      { status: 401 }
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
    // الطلب لازم يكون ملك صاحب الجلسة — وإلا 404 (لا نكشف وجوده).
    const job = await db
      .prepare(
        "SELECT id, status FROM jobs WHERE id = ? AND customer_phone = ?"
      )
      .bind(params.id, phone)
      .first<{ id: string; status: string }>();
    if (!job) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود." },
        { status: 404 }
      );
    }

    const { results } = await db
      .prepare(
        `SELECT o.id, o.status, o.price_lyd, o.message, o.created_at,
                t.full_name AS tradesman_name, t.trade, t.city,
                t.years_experience,
                CASE WHEN t.verified_at IS NOT NULL AND t.suspended_at IS NULL
                     THEN 1 ELSE 0 END AS verified,
                CASE WHEN o.status = 'accepted' THEN t.whatsapp ELSE NULL END
                  AS whatsapp
           FROM offers o
           JOIN tradesmen t ON t.id = o.tradesman_id
          WHERE o.job_id = ?
          ORDER BY o.created_at ASC`
      )
      .bind(job.id)
      .all<OfferRow>();

    const offers = (results ?? []).map((o) => ({
      id: o.id,
      status: o.status,
      price_lyd: o.price_lyd,
      message: o.message,
      created_at: o.created_at,
      tradesman_name: o.tradesman_name,
      trade: o.trade,
      city: o.city,
      years_experience: o.years_experience,
      verified: o.verified === 1,
      whatsapp: o.whatsapp,
    }));

    return NextResponse.json(
      { ok: true, jobStatus: job.status, offers },
      { status: 200 }
    );
  } catch (err) {
    console.error("[me/jobs/offers] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء جلب العروض. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
