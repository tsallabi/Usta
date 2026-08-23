import { NextResponse } from "next/server";
import { getDb, getKv, getEnvVar } from "@/lib/db";

export const runtime = "edge";

/**
 * صفحة تشخيص سريعة: /api/health
 * تبيّن أي مفاتيح وربطات مرئية للتطبيق (قيم منطقية فقط — بدون أسرار).
 * تسهّل معرفة "ليش الميزة الفلانية شغّالة بالوضع التجريبي؟" بنظرة واحدة.
 */
export async function GET() {
  const geminiKey = getEnvVar("GEMINI_API_KEY");
  const anthropicKey = getEnvVar("ANTHROPIC_API_KEY");
  const adminKey = getEnvVar("ADMIN_KEY");
  const authSecret = getEnvVar("AUTH_SECRET");

  return NextResponse.json({
    ok: true,
    ai: {
      gemini: Boolean(geminiKey),
      claude: Boolean(anthropicKey),
      active: geminiKey ? "gemini" : anthropicKey ? "claude" : "fallback",
    },
    bindings: {
      db: Boolean(getDb()),
      waitlistKv: Boolean(getKv("WAITLIST")),
    },
    auth: {
      adminKey: Boolean(adminKey && adminKey.length >= 12),
      authSecret: Boolean(authSecret && authSecret.length >= 16),
    },
  });
}
