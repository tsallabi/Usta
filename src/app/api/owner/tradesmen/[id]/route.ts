import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner } from "@/lib/owner";

export const runtime = "edge";

/**
 * إدارة الأسطوات من كونسول المالك.
 *
 * PATCH { action } — verify | unverify | suspend | unsuspend |
 *                    feature | unfeature (الترقية تحتاج ميغريشن 0004)
 * DELETE — حذف نهائي: يحذف عروض الأسطى ثم صفّه (batch ذري).
 */

const ID_SHAPE = /^tm_[0-9a-zA-Z]{21}$/;
const ACTIONS = [
  "verify",
  "unverify",
  "suspend",
  "unsuspend",
  "feature",
  "unfeature",
] as const;
type Action = (typeof ACTIONS)[number];

const sqlByAction: Record<Action, string> = {
  verify: `UPDATE tradesmen SET verified_at = datetime('now') WHERE id = ?1`,
  unverify: `UPDATE tradesmen SET verified_at = NULL WHERE id = ?1`,
  suspend: `UPDATE tradesmen SET suspended_at = datetime('now') WHERE id = ?1`,
  unsuspend: `UPDATE tradesmen SET suspended_at = NULL WHERE id = ?1`,
  feature: `UPDATE tradesmen SET featured_at = datetime('now') WHERE id = ?1`,
  unfeature: `UPDATE tradesmen SET featured_at = NULL WHERE id = ?1`,
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireOwner(request);
  if (!auth.ok) return auth.response;

  const id = params.id;
  if (!ID_SHAPE.test(id)) {
    return NextResponse.json(
      { ok: false, error: "معرّف أسطى غير صالح." },
      { status: 400 }
    );
  }

  let action: Action | undefined;
  try {
    const body = (await request.json()) as { action?: string };
    action = ACTIONS.find((a) => a === body.action);
  } catch {
    // handled below
  }
  if (!action) {
    return NextResponse.json(
      { ok: false, error: `أرسل { action: ${ACTIONS.join(" | ")} }.` },
      { status: 400 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير مربوطة." },
      { status: 503 }
    );
  }

  try {
    const result = await db.prepare(sqlByAction[action]).bind(id).run();
    if (!result.meta || result.meta.changes === 0) {
      return NextResponse.json(
        { ok: false, error: "الأسطى غير موجود." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, id, action }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("featured_at")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "خاصية الترقية تحتاج تحديث قاعدة البيانات — طبّق ملف migrations/0004_owner_tools.sql في D1 Console أولاً.",
        },
        { status: 409 }
      );
    }
    console.error("[owner/tradesmen] update failed:", err);
    return NextResponse.json(
      { ok: false, error: "فشل التحديث." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireOwner(request);
  if (!auth.ok) return auth.response;

  const id = params.id;
  if (!ID_SHAPE.test(id)) {
    return NextResponse.json(
      { ok: false, error: "معرّف أسطى غير صالح." },
      { status: 400 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير مربوطة." },
      { status: 503 }
    );
  }

  try {
    // حذف ذري: العروض أولاً ثم الصف — حتى لو FK cascade مش مفعّل في D1.
    const results = await db.batch([
      db.prepare(`DELETE FROM offers WHERE tradesman_id = ?1`).bind(id),
      db.prepare(`DELETE FROM tradesmen WHERE id = ?1`).bind(id),
    ]);
    const deleted = results[1]?.meta?.changes ?? 0;
    if (deleted === 0) {
      return NextResponse.json(
        { ok: false, error: "الأسطى غير موجود." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, id, deleted: true }, { status: 200 });
  } catch (err) {
    console.error("[owner/tradesmen] delete failed:", err);
    return NextResponse.json(
      { ok: false, error: "فشل الحذف." },
      { status: 500 }
    );
  }
}
