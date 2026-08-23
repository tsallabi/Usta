import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner } from "@/lib/owner";

export const runtime = "edge";

/**
 * GET /api/owner/accounts — كل الحسابات على المنصة (للمالك فقط).
 *
 * يرجع المستخدمين المسجّلين (زبائن) والأسطوات، مع علامة لمن يجمع
 * الصفتين (رقم المستخدم == واتساب الأسطى)، حتى يقدر المالك يدخل
 * بأي حساب ويعاينه.
 */

type UserRow = {
  id: string;
  phone: string;
  full_name: string;
  created_at: string;
  last_login_at: string | null;
  jobs_count: number;
};

type TradesmanRow = {
  id: string;
  whatsapp: string;
  full_name: string;
  trade: string;
  city: string;
  verified_at: string | null;
  suspended_at: string | null;
  featured_at: string | null;
  created_at: string;
  accepted_count: number;
};

export async function GET(request: Request) {
  const auth = requireOwner(request);
  if (!auth.ok) return auth.response;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: true, dbBound: false, users: [], tradesmen: [] },
      { status: 200 }
    );
  }

  try {
    // featured_at من ميغريشن 0004 — لو مش مطبّقة بعد نرجع بدونها.
    async function loadTradesmen() {
      const withFeatured = `SELECT t.id, t.whatsapp, t.full_name, t.trade, t.city,
                t.verified_at, t.suspended_at, t.featured_at, t.created_at,
                (SELECT COUNT(*) FROM offers o WHERE o.tradesman_id = t.id AND o.status = 'accepted') AS accepted_count
           FROM tradesmen t
          ORDER BY t.created_at DESC
          LIMIT 500`;
      try {
        return await db!.prepare(withFeatured).all<TradesmanRow>();
      } catch {
        return await db!
          .prepare(withFeatured.replace("t.featured_at,", "NULL AS featured_at,"))
          .all<TradesmanRow>();
      }
    }

    const [users, tradesmen] = await Promise.all([
      db
        .prepare(
          `SELECT u.id, u.phone, u.full_name, u.created_at, u.last_login_at,
                  (SELECT COUNT(*) FROM jobs j WHERE j.customer_phone = u.phone) AS jobs_count
             FROM users u
            ORDER BY u.created_at DESC
            LIMIT 500`
        )
        .all<UserRow>(),
      loadTradesmen(),
    ]);

    return NextResponse.json(
      {
        ok: true,
        dbBound: true,
        users: users.results ?? [],
        tradesmen: tradesmen.results ?? [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[owner/accounts] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "فشلت قراءة قاعدة البيانات." },
      { status: 500 }
    );
  }
}
