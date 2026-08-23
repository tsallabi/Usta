/**
 * نسبة عمولة المنصة — متغيّر البيئة COMMISSION_PCT (افتراضي 10%).
 *
 * فترة الإطلاق = 0: حط COMMISSION_PCT=0 في Cloudflare وترجع كل
 * الحسابات صفراً تلقائياً. لما تقرّر النسبة الفعلية غيّر المتغيّر فقط —
 * بدون أي تعديل كود.
 */

import { getEnvVar } from "@/lib/db";

export function commissionPct(): number {
  const raw = Number.parseFloat(getEnvVar("COMMISSION_PCT") ?? "");
  if (Number.isFinite(raw) && raw >= 0 && raw <= 50) return raw;
  return 10;
}
