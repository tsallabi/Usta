import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const runtime = "edge";

type JobRow = {
  id: string;
  customer_phone: string;
  customer_email: string | null;
  service: string;
  description: string;
  budget_lyd: number | null;
  city: string | null;
  area: string | null;
  status: string;
  estimate_id: string | null;
  created_at: string;
  est_min: number | null;
  est_max: number | null;
};

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: true, jobs: [], dbBound: false },
      { status: 200 }
    );
  }

  try {
    const { results } = await db
      .prepare(
        `SELECT j.id, j.customer_phone, j.customer_email, j.service, j.description,
                j.budget_lyd, j.city, j.area, j.status, j.estimate_id, j.created_at,
                e.min_lyd AS est_min, e.max_lyd AS est_max
           FROM jobs j
           LEFT JOIN estimates e ON e.id = j.estimate_id
          ORDER BY j.created_at DESC
          LIMIT 200`
      )
      .all<JobRow>();

    return NextResponse.json(
      { ok: true, dbBound: true, jobs: results ?? [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("[admin/jobs] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "Database read failed. Is the schema applied?" },
      { status: 500 }
    );
  }
}
