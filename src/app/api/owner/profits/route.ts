import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner } from "@/lib/owner";

export const runtime = "edge";

/**
 * GET /api/owner/profits — اقتصاديات المنصة (للمالك فقط، ولا حتى الأدمن).
 *
 * قبل تفعيل الدفع الإلكتروني، "الأرباح" هي قيمة الشغل اللي مرّ عبر
 * المنصة (GMV) وسيناريوهات العمولة عليها:
 *   - قيمة العروض المقبولة (كل الوقت + آخر 30 يوم)
 *   - القيمة المحقّقة (طلبات مكتملة فعلاً)
 *   - تفصيل حسب الخدمة
 */

type CountRow = { n: number };
type SumRow = { total: number | null };
type ServiceRow = {
  service: string;
  jobs_count: number;
  accepted_value: number | null;
  completed_value: number | null;
};

export async function GET(request: Request) {
  const auth = requireOwner(request);
  if (!auth.ok) return auth.response;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: true, dbBound: false },
      { status: 200 }
    );
  }

  try {
    const [
      jobsTotal,
      jobsOpen,
      jobsMatched,
      jobsCompleted,
      jobs30d,
      offersTotal,
      offersAccepted,
      gmvAccepted,
      gmvAccepted30d,
      gmvRealized,
      usersTotal,
      tradesmenTotal,
      tradesmenVerified,
      services,
    ] = await Promise.all([
      db.prepare(`SELECT COUNT(*) AS n FROM jobs`).first<CountRow>(),
      db
        .prepare(`SELECT COUNT(*) AS n FROM jobs WHERE status = 'open'`)
        .first<CountRow>(),
      db
        .prepare(`SELECT COUNT(*) AS n FROM jobs WHERE status = 'matched'`)
        .first<CountRow>(),
      db
        .prepare(`SELECT COUNT(*) AS n FROM jobs WHERE status = 'completed'`)
        .first<CountRow>(),
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM jobs WHERE created_at >= datetime('now', '-30 days')`
        )
        .first<CountRow>(),
      db.prepare(`SELECT COUNT(*) AS n FROM offers`).first<CountRow>(),
      db
        .prepare(`SELECT COUNT(*) AS n FROM offers WHERE status = 'accepted'`)
        .first<CountRow>(),
      db
        .prepare(
          `SELECT SUM(price_lyd) AS total FROM offers WHERE status = 'accepted'`
        )
        .first<SumRow>(),
      db
        .prepare(
          `SELECT SUM(price_lyd) AS total FROM offers
            WHERE status = 'accepted'
              AND created_at >= datetime('now', '-30 days')`
        )
        .first<SumRow>(),
      db
        .prepare(
          `SELECT SUM(o.price_lyd) AS total
             FROM offers o
             JOIN jobs j ON j.id = o.job_id
            WHERE o.status = 'accepted' AND j.status = 'completed'`
        )
        .first<SumRow>(),
      db.prepare(`SELECT COUNT(*) AS n FROM users`).first<CountRow>(),
      db.prepare(`SELECT COUNT(*) AS n FROM tradesmen`).first<CountRow>(),
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM tradesmen WHERE verified_at IS NOT NULL AND suspended_at IS NULL`
        )
        .first<CountRow>(),
      db
        .prepare(
          `SELECT j.service,
                  COUNT(DISTINCT j.id) AS jobs_count,
                  SUM(CASE WHEN o.status = 'accepted' THEN o.price_lyd END) AS accepted_value,
                  SUM(CASE WHEN o.status = 'accepted' AND j.status = 'completed' THEN o.price_lyd END) AS completed_value
             FROM jobs j
             LEFT JOIN offers o ON o.job_id = j.id
            GROUP BY j.service
            ORDER BY jobs_count DESC`
        )
        .all<ServiceRow>(),
    ]);

    return NextResponse.json(
      {
        ok: true,
        dbBound: true,
        jobs: {
          total: jobsTotal?.n ?? 0,
          open: jobsOpen?.n ?? 0,
          matched: jobsMatched?.n ?? 0,
          completed: jobsCompleted?.n ?? 0,
          last30d: jobs30d?.n ?? 0,
        },
        offers: {
          total: offersTotal?.n ?? 0,
          accepted: offersAccepted?.n ?? 0,
        },
        gmv: {
          accepted: gmvAccepted?.total ?? 0,
          accepted30d: gmvAccepted30d?.total ?? 0,
          realized: gmvRealized?.total ?? 0,
        },
        people: {
          users: usersTotal?.n ?? 0,
          tradesmen: tradesmenTotal?.n ?? 0,
          tradesmenVerified: tradesmenVerified?.n ?? 0,
        },
        services: services.results ?? [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[owner/profits] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "فشلت قراءة قاعدة البيانات." },
      { status: 500 }
    );
  }
}
