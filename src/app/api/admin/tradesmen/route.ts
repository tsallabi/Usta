import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { avgRatingSql, ratingsCountSql } from "@/lib/rating";

export const runtime = "edge";

type TradesmanRow = {
  id: string;
  whatsapp: string;
  email: string | null;
  full_name: string;
  trade: string;
  city: string;
  service_area: string;
  national_id: string;
  years_experience: number | null;
  previous_work: string | null;
  verified_at: string | null;
  suspended_at: string | null;
  created_at: string;
  avg_rating: number | null;
  ratings_count: number;
};

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: true, tradesmen: [], dbBound: false },
      { status: 200 }
    );
  }

  try {
    const { results } = await db
      .prepare(
        `SELECT t.id, t.whatsapp, t.email, t.full_name, t.trade, t.city,
                t.service_area, t.national_id, t.years_experience,
                t.previous_work, t.verified_at, t.suspended_at, t.created_at,
                ${avgRatingSql("t.id")} AS avg_rating,
                ${ratingsCountSql("t.id")} AS ratings_count
           FROM tradesmen t
          ORDER BY t.created_at DESC
          LIMIT 500`
      )
      .all<TradesmanRow>();

    return NextResponse.json(
      { ok: true, dbBound: true, tradesmen: results ?? [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("[admin/tradesmen] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "Database read failed. Is the schema applied?" },
      { status: 500 }
    );
  }
}
