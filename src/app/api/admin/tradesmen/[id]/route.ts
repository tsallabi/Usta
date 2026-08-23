import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const runtime = "edge";

const ID_SHAPE = /^tm_[0-9a-zA-Z]{21}$/;
const ACTIONS = ["verify", "unverify", "suspend", "unsuspend"] as const;
type Action = (typeof ACTIONS)[number];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  const id = params.id;
  if (!ID_SHAPE.test(id)) {
    return NextResponse.json(
      { ok: false, error: "Invalid tradesman id." },
      { status: 400 }
    );
  }

  let action: Action | undefined;
  try {
    const body = (await request.json()) as { action?: string };
    action = ACTIONS.find((a) => a === body.action);
  } catch {
    // fallthrough — handled below
  }
  if (!action) {
    return NextResponse.json(
      {
        ok: false,
        error: `Send { action: ${ACTIONS.map((a) => `"${a}"`).join(" | ")} }.`,
      },
      { status: 400 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Database not bound — attach the D1 binding first." },
      { status: 503 }
    );
  }

  const sqlByAction: Record<Action, string> = {
    verify: `UPDATE tradesmen SET verified_at = datetime('now') WHERE id = ?1`,
    unverify: `UPDATE tradesmen SET verified_at = NULL WHERE id = ?1`,
    suspend: `UPDATE tradesmen SET suspended_at = datetime('now') WHERE id = ?1`,
    unsuspend: `UPDATE tradesmen SET suspended_at = NULL WHERE id = ?1`,
  };

  try {
    const result = await db.prepare(sqlByAction[action]).bind(id).run();
    if (!result.meta || result.meta.changes === 0) {
      return NextResponse.json(
        { ok: false, error: "Tradesman not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, id, action }, { status: 200 });
  } catch (err) {
    console.error("[admin/tradesmen] D1 update failed:", err);
    return NextResponse.json(
      { ok: false, error: "Database update failed." },
      { status: 500 }
    );
  }
}
