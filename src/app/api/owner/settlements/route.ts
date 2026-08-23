import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { requireOwner } from "@/lib/owner";
import { commissionPct } from "@/lib/commission";

export const runtime = "edge";

/**
 * مستحقات العمولة وتسديدها — للمالك فقط.
 *
 * الفكرة (نموذج ليبي واقعي قبل بوابات الدفع): الزبون يدفع للأسطى كاش،
 * والأسطى يسدّد عمولة المنصة دورياً (تحويل مصرفي / موبي كاش / سداد /
 * كاش). المالك يسجّل كل دفعة هنا.
 *
 * GET  — لكل أسطى: المحقّق (شغل مكتمل) × نسبة العمولة − المسدَّد = المستحق.
 * POST — { tradesmanId, amountLyd, method?, note? } يسجّل دفعة.
 *
 * نسبة العمولة: متغيّر البيئة COMMISSION_PCT (افتراضي 10) — src/lib/commission.
 */

type DueRow = {
  id: string;
  full_name: string;
  whatsapp: string;
  trade: string;
  realized: number | null;
};

type SettledRow = { tradesman_id: string; paid: number | null };

export async function GET(request: Request) {
  const auth = requireOwner(request);
  if (!auth.ok) return auth.response;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: true, dbBound: false, pct: commissionPct(), rows: [] },
      { status: 200 }
    );
  }

  try {
    const dues = await db
      .prepare(
        `SELECT t.id, t.full_name, t.whatsapp, t.trade,
                SUM(o.price_lyd) AS realized
           FROM tradesmen t
           JOIN offers o ON o.tradesman_id = t.id AND o.status = 'accepted'
           JOIN jobs j ON j.id = o.job_id AND j.status = 'completed'
          GROUP BY t.id
          ORDER BY realized DESC`
      )
      .all<DueRow>();

    // جدول settlements قد لا يكون مطبَّقاً بعد (ميغريشن 0004) — تدهور سلس.
    let settled: SettledRow[] = [];
    let settlementsReady = true;
    try {
      const s = await db
        .prepare(
          `SELECT tradesman_id, SUM(amount_lyd) AS paid
             FROM settlements GROUP BY tradesman_id`
        )
        .all<SettledRow>();
      settled = s.results ?? [];
    } catch {
      settlementsReady = false;
    }

    const paidMap = new Map(settled.map((s) => [s.tradesman_id, s.paid ?? 0]));
    const pct = commissionPct();
    const rows = (dues.results ?? []).map((d) => {
      const realized = d.realized ?? 0;
      const commission = Math.round((realized * pct) / 100);
      const paid = paidMap.get(d.id) ?? 0;
      return {
        tradesmanId: d.id,
        name: d.full_name,
        whatsapp: d.whatsapp,
        trade: d.trade,
        realized,
        commission,
        paid,
        due: Math.max(0, commission - paid),
      };
    });

    return NextResponse.json(
      { ok: true, dbBound: true, pct, settlementsReady, rows },
      { status: 200 }
    );
  } catch (err) {
    console.error("[owner/settlements] read failed:", err);
    return NextResponse.json(
      { ok: false, error: "فشلت قراءة المستحقات." },
      { status: 500 }
    );
  }
}

type PostBody = {
  tradesmanId?: string;
  amountLyd?: number;
  method?: string;
  note?: string;
};

const METHODS = ["cash", "bank", "mobicash", "sadad", "other"] as const;

export async function POST(request: Request) {
  const auth = requireOwner(request);
  if (!auth.ok) return auth.response;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير مربوطة." },
      { status: 503 }
    );
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "أرسل JSON فيه tradesmanId و amountLyd." },
      { status: 400 }
    );
  }

  const tradesmanId = (body.tradesmanId ?? "").trim();
  const amount = Math.round(Number(body.amountLyd));
  const method = METHODS.find((m) => m === body.method) ?? "cash";
  const note = (body.note ?? "").trim().slice(0, 300) || null;

  if (!/^tm_[0-9a-zA-Z]{21}$/.test(tradesmanId)) {
    return NextResponse.json(
      { ok: false, error: "معرّف أسطى غير صالح." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json(
      { ok: false, error: "أدخل مبلغاً صحيحاً بالدينار (1 حتى 1000000)." },
      { status: 400 }
    );
  }

  try {
    const id = newId("st");
    await db
      .prepare(
        `INSERT INTO settlements (id, tradesman_id, amount_lyd, method, note)
         VALUES (?1, ?2, ?3, ?4, ?5)`
      )
      .bind(id, tradesmanId, amount, method, note)
      .run();
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("no such table")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "جدول التسديدات غير موجود — طبّق ملف migrations/0004_owner_tools.sql في D1 Console أولاً.",
        },
        { status: 409 }
      );
    }
    console.error("[owner/settlements] insert failed:", err);
    return NextResponse.json(
      { ok: false, error: "فشل تسجيل الدفعة." },
      { status: 500 }
    );
  }
}
