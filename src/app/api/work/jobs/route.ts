import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { resolveSessionTradesman } from "@/lib/tradesman";

export const runtime = "edge";

type WorkJobRow = {
  id: string;
  service: string;
  description: string;
  city: string | null;
  area: string | null;
  budget_lyd: number | null;
  est_min_lyd: number | null;
  est_max_lyd: number | null;
  created_at: string;
  offers_count: number;
  my_offer_id: string | null;
  my_offer_price: number | null;
  my_offer_status: string | null;
};

/**
 * سوق الشغل — الطلبات المفتوحة في مهنة الأسطى المسجّل دخوله.
 * خصوصية: لا يُرجع أبداً customer_phone أو customer_email.
 */
export async function GET(request: Request) {
  const who = await resolveSessionTradesman(request);

  if (who.kind === "no_session") {
    return NextResponse.json(
      { ok: false, error: "سجّل دخولك أولاً باش تشوف سوق الشغل." },
      { status: 401 }
    );
  }
  if (who.kind === "no_db") {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير مربوطة بعد." },
      { status: 503 }
    );
  }
  if (who.kind === "not_tradesman") {
    return NextResponse.json(
      { ok: false, code: "not_tradesman", error: "سجّل كأسطى أولاً." },
      { status: 403 }
    );
  }

  const { tradesman } = who;
  if (!tradesman.verified || tradesman.suspended) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_verified",
        error: "حسابك قيد التوثيق — بنتواصل معاك خلال 48 ساعة.",
      },
      { status: 403 }
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
        `SELECT j.id, j.service, j.description, j.city, j.area, j.budget_lyd,
                e.min_lyd AS est_min_lyd, e.max_lyd AS est_max_lyd,
                j.created_at,
                (SELECT COUNT(*) FROM offers o WHERE o.job_id = j.id)
                  AS offers_count,
                mo.id AS my_offer_id,
                mo.price_lyd AS my_offer_price,
                mo.status AS my_offer_status
           FROM jobs j
           LEFT JOIN estimates e ON e.id = j.estimate_id
           LEFT JOIN offers mo
                  ON mo.job_id = j.id AND mo.tradesman_id = ?1
          WHERE j.status = 'open' AND j.service = ?2
          ORDER BY j.created_at DESC
          LIMIT 100`
      )
      .bind(tradesman.id, tradesman.trade)
      .all<WorkJobRow>();

    // عدد عروض الأسطى المقبولة — سمعته الحيّة على البورد.
    const acceptedRow = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM offers
          WHERE tradesman_id = ? AND status = 'accepted'`
      )
      .bind(tradesman.id)
      .first<{ n: number }>();

    // تقييم الأسطى الحيّ — النجوم هي ترتيبه في السوق.
    const ratingRow = await db
      .prepare(
        `SELECT ROUND(AVG((r.punctuality + r.quality + r.price_adherence +
                           r.professionalism + r.communication) / 5.0), 1)
                  AS avg_rating,
                COUNT(*) AS ratings_count
           FROM ratings r
           JOIN offers ao ON ao.job_id = r.job_id AND ao.status = 'accepted'
          WHERE r.rater = 'customer' AND ao.tradesman_id = ?`
      )
      .bind(tradesman.id)
      .first<{ avg_rating: number | null; ratings_count: number }>();

    // شغل الأسطى المتفق عليه — طلبات عرضه فيها مقبول (ما عادتش مفتوحة
    // لكن لازم تظل قدامه: التفاصيل + الدردشة مع الزبون).
    const active = await db
      .prepare(
        `SELECT j.id, j.service, j.description, j.city, j.area, j.status,
                j.created_at, o.price_lyd
           FROM jobs j
           JOIN offers o
             ON o.job_id = j.id AND o.tradesman_id = ?1 AND o.status = 'accepted'
          WHERE j.status IN ('matched', 'in_progress', 'completed')
          ORDER BY j.created_at DESC
          LIMIT 50`
      )
      .bind(tradesman.id)
      .all<{
        id: string;
        service: string;
        description: string;
        city: string | null;
        area: string | null;
        status: string;
        created_at: string;
        price_lyd: number;
      }>();

    const jobs = (results ?? []).map((r) => ({
      id: r.id,
      service: r.service,
      description: r.description,
      city: r.city,
      area: r.area,
      budget_lyd: r.budget_lyd,
      est_min_lyd: r.est_min_lyd,
      est_max_lyd: r.est_max_lyd,
      created_at: r.created_at,
      offers_count: r.offers_count,
      my_offer:
        r.my_offer_id !== null
          ? {
              id: r.my_offer_id,
              price_lyd: r.my_offer_price,
              status: r.my_offer_status,
            }
          : null,
    }));

    return NextResponse.json(
      {
        ok: true,
        tradesman: {
          full_name: tradesman.full_name,
          trade: tradesman.trade,
          city: tradesman.city,
        },
        acceptedCount: acceptedRow?.n ?? 0,
        avgRating: ratingRow?.avg_rating ?? null,
        ratingsCount: ratingRow?.ratings_count ?? 0,
        jobs,
        activeJobs: active.results ?? [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[work/jobs] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء جلب الطلبات. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
