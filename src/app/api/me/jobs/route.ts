import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";

export const runtime = "edge";

type JobRow = {
  id: string;
  service: string;
  description: string;
  budget_lyd: number | null;
  city: string | null;
  area: string | null;
  status: string;
  estimate_id: string | null;
  created_at: string;
  updated_at: string;
  est_min_lyd: number | null;
  est_max_lyd: number | null;
  offers_count: number;
  accepted_tradesman_id: string | null;
  accepted_tradesman_name: string | null;
  my_rating: number | null;
};

/** طلبات المستخدم المسجّل دخوله — بياناته هو فقط (حسب رقم الجلسة). */
export async function GET(request: Request) {
  const phone = await getSessionPhone(request);
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "سجّل دخولك أولاً لعرض طلباتك." },
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
        `SELECT j.id, j.service, j.description, j.budget_lyd, j.city, j.area,
                j.status, j.estimate_id, j.created_at, j.updated_at,
                e.min_lyd AS est_min_lyd, e.max_lyd AS est_max_lyd,
                (SELECT COUNT(*) FROM offers o WHERE o.job_id = j.id)
                  AS offers_count,
                tm.id AS accepted_tradesman_id,
                tm.full_name AS accepted_tradesman_name,
                (SELECT ROUND(AVG((r.punctuality + r.quality +
                                   r.price_adherence + r.professionalism +
                                   r.communication) / 5.0), 1)
                   FROM ratings r
                  WHERE r.job_id = j.id AND r.rater = 'customer')
                  AS my_rating
           FROM jobs j
           LEFT JOIN estimates e ON e.id = j.estimate_id
           LEFT JOIN offers ao ON ao.job_id = j.id AND ao.status = 'accepted'
           LEFT JOIN tradesmen tm ON tm.id = ao.tradesman_id
          WHERE j.customer_phone = ?
          ORDER BY j.created_at DESC
          LIMIT 50`
      )
      .bind(phone)
      .all<JobRow>();

    return NextResponse.json(
      { ok: true, jobs: results ?? [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("[me/jobs] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء جلب طلباتك. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
