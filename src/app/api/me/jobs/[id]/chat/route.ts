import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";

export const runtime = "edge";

/**
 * دردشة الطلب — جهة الزبون.
 *
 * الخصوصية أولاً: الدردشة تفتح فقط بعد قبول عرض (matched أو completed)،
 * وتخلي الزبون يتواصل مع الأسطى بدون ما يشارك رقم هاتفه أبداً —
 * مهم مثلاً لسيدة ما تحبش تعطي رقمها لأي حد.
 *
 * GET  — رسائل الطلب (زمنياً).
 * POST — { body } يرسل رسالة كـ customer.
 *
 * الجدول messages من ميغريشن 0005 — قبل تطبيقها يرجع 409 برسالة واضحة.
 */

const JOB_SHAPE = /^job_[0-9a-zA-Z]{21}$/;

async function authorize(request: Request, jobId: string) {
  const phone = await getSessionPhone(request);
  if (!phone) {
    return {
      error: NextResponse.json(
        { ok: false, error: "سجّل دخولك أولاً." },
        { status: 401 }
      ),
    };
  }
  const db = getDb();
  if (!db) {
    return {
      error: NextResponse.json(
        { ok: false, error: "قاعدة البيانات غير مربوطة." },
        { status: 503 }
      ),
    };
  }
  const job = await db
    .prepare(
      `SELECT id, status FROM jobs
        WHERE id = ?1 AND customer_phone = ?2
          AND status IN ('matched', 'in_progress', 'completed')`
    )
    .bind(jobId, phone)
    .first<{ id: string; status: string }>();
  if (!job) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "الدردشة تفتح بعد ما تقبل عرض أسطى على هذا الطلب.",
        },
        { status: 404 }
      ),
    };
  }
  return { db };
}

function tableMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("no such table");
}

const MIGRATION_NOTE =
  "الدردشة تحتاج تحديث قاعدة البيانات — طبّق migrations/0005_geo_chat.sql في D1 Console.";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!JOB_SHAPE.test(params.id)) {
    return NextResponse.json({ ok: false, error: "طلب غير موجود." }, { status: 404 });
  }
  const auth = await authorize(request, params.id);
  if ("error" in auth) return auth.error;
  try {
    const { results } = await auth.db
      .prepare(
        `SELECT id, sender, body, created_at FROM messages
          WHERE job_id = ?1 ORDER BY created_at ASC, id ASC LIMIT 500`
      )
      .bind(params.id)
      .all<{ id: string; sender: string; body: string; created_at: string }>();
    return NextResponse.json(
      { ok: true, messages: results ?? [] },
      { status: 200 }
    );
  } catch (err) {
    if (tableMissing(err)) {
      return NextResponse.json(
        { ok: false, error: MIGRATION_NOTE },
        { status: 409 }
      );
    }
    console.error("[me/chat] read failed:", err);
    return NextResponse.json(
      { ok: false, error: "فشلت قراءة الرسائل." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!JOB_SHAPE.test(params.id)) {
    return NextResponse.json({ ok: false, error: "طلب غير موجود." }, { status: 404 });
  }
  const auth = await authorize(request, params.id);
  if ("error" in auth) return auth.error;

  let text = "";
  try {
    const body = (await request.json()) as { body?: string };
    text = (body.body ?? "").trim();
  } catch {
    // handled below
  }
  if (text.length < 1 || text.length > 1000) {
    return NextResponse.json(
      { ok: false, error: "اكتب رسالة (حتى 1000 حرف)." },
      { status: 400 }
    );
  }

  try {
    const id = newId("msg");
    await auth.db
      .prepare(
        `INSERT INTO messages (id, job_id, sender, body)
         VALUES (?1, ?2, 'customer', ?3)`
      )
      .bind(id, params.id, text)
      .run();
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    if (tableMissing(err)) {
      return NextResponse.json(
        { ok: false, error: MIGRATION_NOTE },
        { status: 409 }
      );
    }
    console.error("[me/chat] write failed:", err);
    return NextResponse.json(
      { ok: false, error: "فشل إرسال الرسالة." },
      { status: 500 }
    );
  }
}
