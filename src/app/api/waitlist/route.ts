import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { market } from "@/lib/market";
import { sendEmailSafe } from "@/lib/email";
import { waitlistWelcomeEmail } from "@/lib/emails/templates";

export const runtime = "edge";

type Body = {
  phone?: string;
  email?: string;
  audience?: "homeowner" | "tradesman";
};

// فحص بسيط لصيغة البريد — البريد اختياري في السوق الليبي؛ يُتحقق منه فقط
// عندما يُدخله المستخدم.
function isEmailish(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 5 &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "أرسل JSON فيه حقل phone." },
      { status: 400 }
    );
  }

  const rawPhone = (body.phone ?? "").trim();
  const audience = body.audience === "tradesman" ? "tradesman" : "homeowner";

  if (!rawPhone || !market.phone.isValid(rawPhone)) {
    return NextResponse.json(
      { error: "أدخل رقم هاتف ليبي صحيح (مثال: 091 234 5678)." },
      { status: 400 }
    );
  }
  const phone = market.phone.normalize(rawPhone);

  const email = body.email?.trim().toLowerCase() || undefined;
  if (email !== undefined && !isEmailish(email)) {
    return NextResponse.json(
      { error: "صيغة البريد الإلكتروني غير صحيحة." },
      { status: 400 }
    );
  }

  const record = {
    phone,
    email: email ?? null,
    audience,
    ip: request.headers.get("cf-connecting-ip") ?? null,
    ua: request.headers.get("user-agent") ?? null,
    added_at: new Date().toISOString(),
  };

  // Try to persist to Cloudflare KV. If the binding isn't configured yet
  // (local dev, brand-new deploy) we still return success so the user gets
  // a working flow; the write is best-effort.
  let isNewSignup = true;
  try {
    const { env } = getRequestContext();
    const kv = (env as unknown as { WAITLIST?: KVNamespace }).WAITLIST;
    if (kv) {
      const key = `wl:${phone}`;
      const existing = await kv.get(key);
      if (!existing) {
        await kv.put(key, JSON.stringify(record), {
          metadata: {
            audience,
            added_at: record.added_at,
            email: email ?? null,
          },
        });
      } else {
        isNewSignup = false;
      }
    } else {
      // Nothing bound: log so we can spot it in Cloudflare Pages logs.
      console.log("[waitlist] KV not bound; entry not persisted:", record);
    }
  } catch (err) {
    console.error("[waitlist] KV write failed:", err);
    // Deliberately do not fail the user here; they signed up in good faith.
  }

  // Welcome email only on first signup AND only when an email was provided —
  // most Libyan users sign up with phone only.
  // Fire-and-safe: an email outage never fails the signup.
  if (isNewSignup && email) {
    await sendEmailSafe({
      to: email,
      ...waitlistWelcomeEmail({ email, audience }),
    });
  }

  return NextResponse.json({ ok: true, phone, audience }, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    { error: "أرسل POST برقم الهاتف إلى هذا المسار." },
    { status: 405 }
  );
}
