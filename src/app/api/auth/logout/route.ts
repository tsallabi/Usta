import { NextResponse } from "next/server";
import { buildClearSessionCookie } from "@/lib/auth";

export const runtime = "edge";

export async function POST() {
  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Set-Cookie": buildClearSessionCookie() } }
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "POST to this endpoint to log out." },
    { status: 405 }
  );
}
