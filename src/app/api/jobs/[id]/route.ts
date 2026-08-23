import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "edge";

// newId() produces `job_` + 21 URL-safe alphanumerics.
const JOB_ID_SHAPE = /^job_[0-9a-zA-Z]{21}$/;

type JobRow = {
  id: string;
  service: string;
  description: string;
  budget_lyd: number | null;
  city: string | null;
  area: string | null;
  status: string;
  created_at: string;
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!JOB_ID_SHAPE.test(id)) {
    return NextResponse.json(
      { ok: false, error: "هذا لا يبدو كمعرّف طلب صحيح." },
      { status: 400 }
    );
  }

  const db = getDb();
  if (!db) {
    // No binding yet — nothing was ever persisted, so the job can't exist.
    return NextResponse.json(
      { ok: false, error: "الطلب غير موجود." },
      { status: 404 }
    );
  }

  try {
    // Privacy: never select or echo customer_phone or customer_email.
    const row = await db
      .prepare(
        `SELECT id, service, description, budget_lyd, city, area, status, created_at
         FROM jobs WHERE id = ?1`
      )
      .bind(id)
      .first<JobRow>();

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        job: {
          id: row.id,
          service: row.service,
          description: row.description,
          budget: row.budget_lyd,
          city: row.city,
          area: row.area,
          status: row.status,
          createdAt: row.created_at,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[jobs] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "الطلب غير موجود." },
      { status: 404 }
    );
  }
}
