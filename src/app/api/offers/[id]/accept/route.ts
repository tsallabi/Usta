import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";

export const runtime = "edge";

type AcceptRow = {
  offer_id: string;
  offer_status: string;
  job_id: string;
  job_status: string;
  customer_phone: string;
  whatsapp: string;
};

/**
 * الزبون يقبل عرضاً — لحظة فتح التواصل:
 * العرض → accepted، بقية العروض المعلّقة → declined، الطلب → matched،
 * ويُرجع رقم واتساب الأسطى.
 *
 * التحديثات الثلاثة تتنفذ بـ db.batch() — دفعة D1 ذرّية (كلها أو لا شيء).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const phone = await getSessionPhone(request);
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "سجّل دخولك أولاً لقبول العرض." },
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
    const row = await db
      .prepare(
        `SELECT o.id AS offer_id, o.status AS offer_status,
                j.id AS job_id, j.status AS job_status, j.customer_phone,
                t.whatsapp
           FROM offers o
           JOIN jobs j ON j.id = o.job_id
           JOIN tradesmen t ON t.id = o.tradesman_id
          WHERE o.id = ?`
      )
      .bind(params.id)
      .first<AcceptRow>();

    // ملكية الطلب شرط — وإلا 404 (لا نكشف وجود العرض).
    if (!row || row.customer_phone !== phone) {
      return NextResponse.json(
        { ok: false, error: "العرض غير موجود." },
        { status: 404 }
      );
    }
    if (row.offer_status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "هذا العرض لم يعد متاحاً للقبول." },
        { status: 409 }
      );
    }
    if (row.job_status !== "open") {
      return NextResponse.json(
        { ok: false, error: "هذا الطلب لم يعد مفتوحاً." },
        { status: 409 }
      );
    }

    // دفعة ذرّية: قبول + رفض البقية + مطابقة الطلب.
    await db.batch([
      db
        .prepare(
          "UPDATE offers SET status = 'accepted' WHERE id = ? AND status = 'pending'"
        )
        .bind(row.offer_id),
      db
        .prepare(
          `UPDATE offers SET status = 'declined'
            WHERE job_id = ? AND id != ? AND status = 'pending'`
        )
        .bind(row.job_id, row.offer_id),
      db
        .prepare(
          `UPDATE jobs SET status = 'matched', updated_at = datetime('now')
            WHERE id = ? AND status = 'open'`
        )
        .bind(row.job_id),
    ]);

    return NextResponse.json(
      { ok: true, whatsapp: row.whatsapp },
      { status: 200 }
    );
  } catch (err) {
    console.error("[offers/accept] D1 write failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء قبول العرض. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
