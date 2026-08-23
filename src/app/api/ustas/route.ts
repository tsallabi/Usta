import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { findService } from "@/lib/services";
import { isCity } from "@/lib/market";
import { avgRatingSql, ratingsCountSql } from "@/lib/rating";

export const runtime = "edge";

/**
 * GET /api/ustas — الدليل العام للأسطوات الموثّقين.
 *
 * عام بدون تسجيل دخول، لذلك الخصوصية هنا صارمة:
 * لا whatsapp، لا national_id، لا email — أبداً.
 * التواصل يتم داخل المنصة فقط (طلب → عرض → قبول).
 *
 * Query params (اختيارية): trade (slug إنجليزي) · city (اسم عربي).
 */

type UstaRow = {
  id: string;
  full_name: string;
  trade: string;
  city: string;
  service_area: string;
  years_experience: number | null;
  created_at: string;
  accepted_count: number;
  avg_rating: number | null;
  ratings_count: number;
};

export async function GET(request: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: true, ustas: [], dbBound: false },
      { status: 200 }
    );
  }

  const url = new URL(request.url);
  const tradeParam = url.searchParams.get("trade") ?? "";
  const cityParam = url.searchParams.get("city") ?? "";

  // نتجاهل أي قيمة غير معروفة بدل ما نرفض الطلب — دليل عام، مش API صارم.
  const trade = findService(tradeParam) ? tradeParam : null;
  const city = isCity(cityParam) ? cityParam : null;

  const conditions = ["t.verified_at IS NOT NULL", "t.suspended_at IS NULL"];
  const binds: string[] = [];
  if (trade) {
    binds.push(trade);
    conditions.push(`t.trade = ?${binds.length}`);
  }
  if (city) {
    binds.push(city);
    conditions.push(`t.city = ?${binds.length}`);
  }

  try {
    // الأسطى المميز (ترقية المالك — ميغريشن 0004) يتصدّر الدليل.
    // لو العمود مش موجود بعد، نرجع للترتيب العادي بدون كسر.
    const baseSql = (featuredKey: string) =>
      `SELECT t.id, t.full_name, t.trade, t.city, t.service_area,
                t.years_experience, t.created_at,
                (SELECT COUNT(*) FROM offers o
                  WHERE o.tradesman_id = t.id AND o.status = 'accepted')
                  AS accepted_count,
                ${avgRatingSql("t.id")} AS avg_rating,
                ${ratingsCountSql("t.id")} AS ratings_count
           FROM tradesmen t
          WHERE ${conditions.join(" AND ")}
          ORDER BY ${featuredKey}avg_rating IS NULL, avg_rating DESC,
                   accepted_count DESC,
                   t.years_experience DESC,
                   t.created_at ASC
          LIMIT 100`;

    let results: UstaRow[] | undefined;
    try {
      results = (
        await db
          .prepare(baseSql("t.featured_at IS NULL, "))
          .bind(...binds)
          .all<UstaRow>()
      ).results;
    } catch {
      results = (
        await db.prepare(baseSql("")).bind(...binds).all<UstaRow>()
      ).results;
    }

    return NextResponse.json(
      { ok: true, dbBound: true, ustas: results ?? [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ustas] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "ما قدرناش نجيبو الدليل توّا. حاول بعد شوية." },
      { status: 500 }
    );
  }
}
