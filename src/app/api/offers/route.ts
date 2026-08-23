import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { resolveSessionTradesman } from "@/lib/tradesman";

export const runtime = "edge";

type Body = {
  jobId?: string;
  price?: number;
  message?: string;
};

const PRICE_MIN = 5;
const PRICE_MAX = 100000;

/** أسطى موثّق يقدّم عرضاً على طلب مفتوح. */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "أرسل JSON فيه بيانات العرض." },
      { status: 400 }
    );
  }

  const who = await resolveSessionTradesman(request);
  if (who.kind === "no_session") {
    return NextResponse.json(
      { ok: false, error: "سجّل دخولك أولاً باش تقدّم عرضك." },
      { status: 401 }
    );
  }
  if (who.kind === "no_db") {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير مربوطة بعد." },
      { status: 503 }
    );
  }
  if (who.kind === "not_tradesman") {
    return NextResponse.json(
      { ok: false, code: "not_tradesman", error: "سجّل كأسطى أولاً." },
      { status: 403 }
    );
  }
  const { tradesman } = who;
  if (!tradesman.verified || tradesman.suspended) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_verified",
        error: "حسابك قيد التوثيق — بنتواصل معاك خلال 48 ساعة.",
      },
      { status: 403 }
    );
  }

  const jobId = (body.jobId ?? "").trim();
  if (!jobId) {
    return NextResponse.json(
      { ok: false, error: "حدّد الطلب اللي تحب تقدّم عليه." },
      { status: 400 }
    );
  }

  const price = body.price;
  if (
    typeof price !== "number" ||
    !Number.isInteger(price) ||
    price < PRICE_MIN ||
    price > PRICE_MAX
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: `أدخل سعراً صحيحاً بين ${PRICE_MIN} و${PRICE_MAX} د.ل (رقم صحيح بدون كسور).`,
      },
      { status: 400 }
    );
  }

  const message = body.message?.trim() || undefined;
  if (message !== undefined && message.length > 500) {
    return NextResponse.json(
      { ok: false, error: "الرسالة طويلة — 500 حرف كحد أقصى." },
      { status: 400 }
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
    const job = await db
      .prepare("SELECT id, status FROM jobs WHERE id = ?")
      .bind(jobId)
      .first<{ id: string; status: string }>();
    if (!job) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود." },
        { status: 404 }
      );
    }
    if (job.status !== "open") {
      return NextResponse.json(
        { ok: false, error: "هذا الطلب لم يعد مفتوحاً للعروض." },
        { status: 409 }
      );
    }

    const existing = await db
      .prepare(
        "SELECT id FROM offers WHERE job_id = ? AND tradesman_id = ?"
      )
      .bind(jobId, tradesman.id)
      .first<{ id: string }>();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "قدّمت عرضاً على هذا الطلب من قبل." },
        { status: 409 }
      );
    }

    const id = newId("off");
    await db
      .prepare(
        `INSERT INTO offers (id, job_id, tradesman_id, status, price_lyd, message)
         VALUES (?, ?, ?, 'pending', ?, ?)`
      )
      .bind(id, jobId, tradesman.id, price, message ?? null)
      .run();

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (err) {
    console.error("[offers] D1 write failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء إرسال عرضك. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
