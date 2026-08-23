/**
 * هوية الأسطى — توّا (Tawwa).
 *
 * نظام مصادقة واحد: المستخدم يسجّل دخوله بالهاتف + الرمز السري (جدول users).
 * المستخدم المسجّل دخوله "أسطى" إذا كان رقم جلسته يطابق صفاً في جدول
 * tradesmen على عمود whatsapp (المخزّن موحّداً بشكل 09XXXXXXXX).
 *
 * Edge-safe — نفس نمط src/lib/auth.ts.
 */

import { getSessionPhone } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { market } from "@/lib/market";

export type SessionTradesman = {
  id: string;
  full_name: string;
  trade: string;
  city: string;
  verified: boolean;
  suspended: boolean;
};

/**
 * نتيجة مفصّلة حتى تقدر مسارات الـ API تفرّق بين:
 * لا جلسة (401) · قاعدة بيانات غير مربوطة (503) · مش أسطى (403) · أسطى.
 */
export type TradesmanResolution =
  | { kind: "no_session" }
  | { kind: "no_db" }
  | { kind: "not_tradesman"; phone: string }
  | { kind: "tradesman"; phone: string; tradesman: SessionTradesman };

type TradesmanRow = {
  id: string;
  full_name: string;
  trade: string;
  city: string;
  verified_at: string | null;
  suspended_at: string | null;
};

/** يربط رقم الجلسة بصف الأسطى (whatsapp) — مع تفاصيل سبب الفشل. */
export async function resolveSessionTradesman(
  request: Request
): Promise<TradesmanResolution> {
  const sessionPhone = await getSessionPhone(request);
  if (!sessionPhone) return { kind: "no_session" };

  // whatsapp مخزّن موحّداً 09XXXXXXXX — نوحّد رقم الجلسة قبل المقارنة.
  const phone = market.phone.normalize(sessionPhone);

  const db = getDb();
  if (!db) return { kind: "no_db" };

  const row = await db
    .prepare(
      `SELECT id, full_name, trade, city, verified_at, suspended_at
         FROM tradesmen
        WHERE whatsapp = ?`
    )
    .bind(phone)
    .first<TradesmanRow>();

  if (!row) return { kind: "not_tradesman", phone };

  return {
    kind: "tradesman",
    phone,
    tradesman: {
      id: row.id,
      full_name: row.full_name,
      trade: row.trade,
      city: row.city,
      verified: row.verified_at !== null,
      suspended: row.suspended_at !== null,
    },
  };
}

/** المستخدم الحالي كأسطى — أو null (لا جلسة / لا DB / مش أسطى). */
export async function getSessionTradesman(
  request: Request
): Promise<SessionTradesman | null> {
  const res = await resolveSessionTradesman(request);
  return res.kind === "tradesman" ? res.tradesman : null;
}
