/**
 * مصادقة المالك — مستوى أعلى من الأدمن.
 *
 * OWNER_KEY متغيّر بيئة مشفّر في Cloudflare Pages، للمالك وحده — لا
 * يُشارك مع أي أدمن أو موظف. المسارات المحمية به:
 *   - الدخول بحساب أي مستخدم (زبون أو أسطى) للفحص والتجربة
 *   - أرقام الأرباح والاقتصاديات
 *
 * ملاحظة أمنية: المفتاح لازم يكون مختلفاً عن ADMIN_KEY — لو تطابقا،
 * نرفض التهيئة حتى ما يرث الأدمن صلاحيات المالك بالخطأ.
 */

import { NextResponse } from "next/server";
import { getEnvVar } from "@/lib/db";

export type OwnerCheck =
  | { ok: true }
  | { ok: false; response: NextResponse };

export function requireOwner(request: Request): OwnerCheck {
  const configured = getEnvVar("OWNER_KEY");
  const adminKey = getEnvVar("ADMIN_KEY");

  if (!configured || configured.length < 16) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error:
            "حساب المالك غير مفعّل — أضف OWNER_KEY (16+ حرفاً، مشفّر) في إعدادات Cloudflare Pages.",
        },
        { status: 503 }
      ),
    };
  }

  if (adminKey && timingSafeEqual(configured, adminKey)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error:
            "OWNER_KEY لازم يكون مختلفاً عن ADMIN_KEY — غيّر أحدهما في إعدادات Cloudflare.",
        },
        { status: 503 }
      ),
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || !timingSafeEqual(token, configured)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "مفتاح المالك غير صحيح." },
        { status: 401 }
      ),
    };
  }

  return { ok: true };
}

/** مقارنة ثابتة الزمن — نفس نمط src/lib/admin.ts. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let acc = 1;
    for (let i = 0; i < a.length; i++) acc |= a.charCodeAt(i);
    return acc === -1;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
