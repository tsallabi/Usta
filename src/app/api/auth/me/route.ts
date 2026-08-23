import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionPhone } from "@/lib/auth";

export const runtime = "edge";

/**
 * من أنا؟ — يقرأ كوكي الجلسة ويُرجع الاسم والهاتف.
 * لا يرجع خطأ أبداً: بدون جلسة/سر/قاعدة بيانات → loggedIn: false.
 */
export async function GET(request: Request) {
  let phone: string | null = null;
  try {
    phone = await getSessionPhone(request);
  } catch {
    phone = null;
  }
  if (!phone) {
    return NextResponse.json({ ok: true, loggedIn: false }, { status: 200 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, loggedIn: false }, { status: 200 });
  }

  try {
    const user = await db
      .prepare("SELECT full_name FROM users WHERE phone = ?")
      .bind(phone)
      .first<{ full_name: string }>();
    if (!user) {
      return NextResponse.json({ ok: true, loggedIn: false }, { status: 200 });
    }
    return NextResponse.json(
      { ok: true, loggedIn: true, name: user.full_name, phone },
      { status: 200 }
    );
  } catch (err) {
    console.error("[auth/me] D1 read failed:", err);
    return NextResponse.json({ ok: true, loggedIn: false }, { status: 200 });
  }
}
