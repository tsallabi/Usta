import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";

export const runtime = "edge";

/**
 * POST /api/me/jobs/[id]/complete — الزبون يأكّد "تم الشغل".
 *
 * الطلب لازم يكون ملك صاحب الجلسة وحالته matched (فيه أسطى مقبول) —
 * ساعتها يتحوّل completed ويفتح باب التقييم.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const phone = await getSessionPhone(request);
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "سجّل دخولك أولاً لتأكيد إتمام الشغل." },
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
    // ملكية الطلب شرط — وإلا 404 (لا نكشف وجوده).
    const job = await db
      .prepare(
        "SELECT id, status FROM jobs WHERE id = ? AND customer_phone = ?"
      )
      .bind(params.id, phone)
      .first<{ id: string; status: string }>();

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود." },
        { status: 404 }
      );
    }
    if (job.status !== "matched") {
      return NextResponse.json(
        {
          ok: false,
          error: "الطلب لازم يكون متطابق مع أسطى قبل ما تأكد إتمامه.",
        },
        { status: 409 }
      );
    }

    await db
      .prepare(
        `UPDATE jobs SET status = 'completed', updated_at = datetime('now')
          WHERE id = ? AND status = 'matched'`
      )
      .bind(job.id)
      .run();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[me/jobs/complete] D1 write failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء تأكيد الإتمام. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
