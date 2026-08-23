import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";
import { sanitizeContactLeaks } from "@/lib/sanitize";

export const runtime = "edge";

const MAX_REVIEW_CHARS = 600;

type RateBody = {
  punctuality?: unknown;
  quality?: unknown;
  priceAdherence?: unknown;
  professionalism?: unknown;
  communication?: unknown;
  review?: unknown;
};

/** بُعد التقييم صحيح من 1 إلى 5 — وإلا null. */
function asDim(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5
    ? value
    : null;
}

/**
 * POST /api/me/jobs/[id]/rate — الزبون يقيّم الأسطى بعد إتمام الشغل.
 *
 * 5 أبعاد إجبارية (1..5) + مراجعة مكتوبة اختيارية (≤600 حرف، تمرّ على
 * فلتر تهريب معلومات التواصل). الأسطى المُقيَّم يُشتق من العرض المقبول —
 * وتقييم واحد فقط من الزبون لكل شغلة.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const phone = await getSessionPhone(request);
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "سجّل دخولك أولاً لتقييم الأسطى." },
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

  let body: RateBody;
  try {
    body = (await request.json()) as RateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "طلب غير صالح." },
      { status: 400 }
    );
  }

  const punctuality = asDim(body.punctuality);
  const quality = asDim(body.quality);
  const priceAdherence = asDim(body.priceAdherence);
  const professionalism = asDim(body.professionalism);
  const communication = asDim(body.communication);
  if (
    punctuality === null ||
    quality === null ||
    priceAdherence === null ||
    professionalism === null ||
    communication === null
  ) {
    return NextResponse.json(
      { ok: false, error: "قيّم البنود الخمسة كلها — كل بند من 1 إلى 5." },
      { status: 400 }
    );
  }

  let review: string | null = null;
  if (body.review !== undefined && body.review !== null) {
    if (typeof body.review !== "string") {
      return NextResponse.json(
        { ok: false, error: "طلب غير صالح." },
        { status: 400 }
      );
    }
    const trimmed = body.review.trim();
    if (trimmed.length > MAX_REVIEW_CHARS) {
      return NextResponse.json(
        { ok: false, error: "المراجعة طويلة شوية — 600 حرف كحد أقصى." },
        { status: 400 }
      );
    }
    if (trimmed.length > 0) {
      review = sanitizeContactLeaks(trimmed).clean;
    }
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
    if (job.status !== "completed") {
      return NextResponse.json(
        { ok: false, error: "أكّد إتمام الشغل أولاً قبل ما تقيّم الأسطى." },
        { status: 409 }
      );
    }

    // الأسطى المُقيَّم = صاحب العرض المقبول على الطلب.
    const accepted = await db
      .prepare(
        "SELECT tradesman_id FROM offers WHERE job_id = ? AND status = 'accepted' LIMIT 1"
      )
      .bind(job.id)
      .first<{ tradesman_id: string }>();
    if (!accepted) {
      return NextResponse.json(
        { ok: false, error: "ما فيش أسطى مرتبط بالطلب." },
        { status: 409 }
      );
    }

    // تقييم واحد فقط من الزبون لكل شغلة.
    const existing = await db
      .prepare(
        "SELECT id FROM ratings WHERE job_id = ? AND rater = 'customer' LIMIT 1"
      )
      .bind(job.id)
      .first<{ id: string }>();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "قيّمت هذا الشغل من قبل." },
        { status: 409 }
      );
    }

    await db
      .prepare(
        `INSERT INTO ratings
           (id, job_id, rater, punctuality, quality, price_adherence,
            professionalism, communication, written_review)
         VALUES (?, ?, 'customer', ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        newId("rat"),
        job.id,
        punctuality,
        quality,
        priceAdherence,
        professionalism,
        communication,
        review
      )
      .run();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[me/jobs/rate] D1 write failed:", err);
    return NextResponse.json(
      { ok: false, error: "صار خطأ أثناء حفظ تقييمك. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
