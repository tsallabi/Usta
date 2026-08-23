import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";
import { avgRatingSql, ratingsCountSql } from "@/lib/rating";

export const runtime = "edge";

type IncomingOfferRow = {
  id: string;
  price_lyd: number;
  message: string | null;
  created_at: string;
  job_id: string;
  job_service: string;
  job_description: string;
  tradesman_name: string;
  trade: string;
  city: string;
  years_experience: number | null;
  verified: number;
  accepted_count: number;
  avg_rating: number | null;
  ratings_count: number;
};

/**
 * كل العروض المعلّقة على طلبات المستخدم المفتوحة — لصندوق "عروض جديدة"
 * في صفحة الحساب.
 *
 * الترتيب بالجودة: التقييم أولاً (النجوم هي الترتيب)، ثم الموثّق،
 * ثم اللي عنده عروض مقبولة أكثر (سمعة)، ثم سنوات الخبرة، ثم الأحدث.
 *
 * خصوصية: لا يُرجع أبداً whatsapp أو أي رقم — التواصل يفتح فقط بعد القبول.
 */
export async function GET(request: Request) {
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
    const { results } = await db
      .prepare(
        `SELECT o.id, o.price_lyd, o.message, o.created_at,
                j.id AS job_id, j.service AS job_service,
                j.description AS job_description,
                t.full_name AS tradesman_name, t.trade, t.city,
                t.years_experience,
                CASE WHEN t.verified_at IS NOT NULL AND t.suspended_at IS NULL
                     THEN 1 ELSE 0 END AS verified,
                (SELECT COUNT(*) FROM offers o2
                  WHERE o2.tradesman_id = o.tradesman_id
                    AND o2.status = 'accepted') AS accepted_count,
                ${avgRatingSql("o.tradesman_id")} AS avg_rating,
                ${ratingsCountSql("o.tradesman_id")} AS ratings_count
           FROM offers o
           JOIN jobs j ON j.id = o.job_id
           JOIN tradesmen t ON t.id = o.tradesman_id
          WHERE j.customer_phone = ?1
            AND j.status = 'open'
            AND o.status = 'pending'
          ORDER BY avg_rating IS NULL, avg_rating DESC,
                   verified DESC, accepted_count DESC,
                   t.years_experience DESC, o.created_at DESC
          LIMIT 50`
      )
      .bind(phone)
      .all<IncomingOfferRow>();

    const offers = (results ?? []).map((r) => ({
      id: r.id,
      price_lyd: r.price_lyd,
      message: r.message,
      created_at: r.created_at,
      job_id: r.job_id,
      job_service: r.job_service,
      job_description:
        r.job_description.length > 80
          ? `${r.job_description.slice(0, 80)}…`
          : r.job_description,
      tradesman_name: r.tradesman_name,
      trade: r.trade,
      city: r.city,
      years_experience: r.years_experience,
      verified: r.verified === 1,
      avg_rating: r.avg_rating,
      ratings_count: r.ratings_count,
    }));

    return NextResponse.json({ ok: true, offers }, { status: 200 });
  } catch (err) {
    console.error("[me/offers] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء جلب العروض. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
