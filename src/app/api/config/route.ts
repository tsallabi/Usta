import { NextResponse } from "next/server";
import { getEnvVar } from "@/lib/db";
import type { LanguageMode } from "@/lib/i18n";

export const runtime = "edge";

/**
 * GET /api/config — إعدادات عامة يقرأها المتصفح.
 *
 * languageMode من متغيّر البيئة LANGUAGE_MODE (يضبطه المالك في
 * Cloudflare): both | ar | en — الافتراضي both.
 */
export async function GET() {
  const raw = (getEnvVar("LANGUAGE_MODE") ?? "both").trim().toLowerCase();
  const languageMode: LanguageMode =
    raw === "ar" || raw === "en" ? raw : "both";
  // موقع المنصة في الفوتر — يتغير حسب الدولة عند النشر (مثلاً Dublin)
  const location = {
    ar: getEnvVar("LOCATION_AR")?.trim() || "طرابلس",
    en: getEnvVar("LOCATION_EN")?.trim() || "Tripoli, Libya",
  };
  return NextResponse.json(
    { ok: true, languageMode, location },
    {
      status: 200,
      headers: { "Cache-Control": "public, max-age=300" },
    }
  );
}
