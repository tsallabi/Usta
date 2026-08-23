import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const runtime = "edge";

type OfferRow = {
  id: string;
  created_at: string;
  price_lyd: number;
  status: string;
  message: string | null;
  tradesman_id: string;
  tradesman_name: string | null;
  tradesman_trade: string | null;
  job_service: string | null;
  job_city: string | null;
  customer_phone: string | null;
};

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: true, offers: [], dbBound: false },
      { status: 200 }
    );
  }

  try {
    const { results } = await db
      .prepare(
        `SELECT o.id, o.created_at, o.price_lyd, o.status, o.message,
                o.tradesman_id,
                t.full_name AS tradesman_name, t.trade AS tradesman_trade,
                j.service AS job_service, j.city AS job_city,
                j.customer_phone
           FROM offers o
           LEFT JOIN tradesmen t ON t.id = o.tradesman_id
           LEFT JOIN jobs j ON j.id = o.job_id
          ORDER BY o.created_at DESC
          LIMIT 200`
      )
      .all<OfferRow>();

    return NextResponse.json(
      { ok: true, dbBound: true, offers: results ?? [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("[admin/offers] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "Database read failed. Is the schema applied?" },
      { status: 500 }
    );
  }
}
