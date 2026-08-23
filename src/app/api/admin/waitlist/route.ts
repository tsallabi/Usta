import { NextResponse } from "next/server";
import { getKv } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const runtime = "edge";

type WaitlistEntry = {
  phone: string;
  email: string | null;
  audience: string;
  added_at: string | null;
};

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  const kv = getKv("WAITLIST");
  if (!kv) {
    return NextResponse.json(
      { ok: true, entries: [], kvBound: false },
      { status: 200 }
    );
  }

  try {
    const entries: WaitlistEntry[] = [];
    let cursor: string | undefined;

    // Page through up to ~2000 keys — plenty for the early-access phase.
    for (let page = 0; page < 2; page++) {
      const listed = await kv.list<{
        audience?: string;
        added_at?: string;
        email?: string | null;
      }>({
        prefix: "wl:",
        limit: 1000,
        cursor,
      });
      for (const key of listed.keys) {
        entries.push({
          phone: key.name.slice(3),
          email: key.metadata?.email ?? null,
          audience: key.metadata?.audience ?? "homeowner",
          added_at: key.metadata?.added_at ?? null,
        });
      }
      if (listed.list_complete) break;
      cursor = listed.cursor;
    }

    entries.sort((a, b) => (b.added_at ?? "").localeCompare(a.added_at ?? ""));

    return NextResponse.json(
      { ok: true, kvBound: true, entries },
      { status: 200 }
    );
  } catch (err) {
    console.error("[admin/waitlist] KV list failed:", err);
    return NextResponse.json(
      { ok: false, error: "Waitlist read failed." },
      { status: 500 }
    );
  }
}
