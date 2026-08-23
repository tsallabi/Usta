/**
 * إعدادات السوق — توّا (Tawwa).
 *
 * كل شيء خاص بالسوق الليبي مركزي هنا: العملة، الهاتف، المدن، الهوية.
 * التوسّع لدولة عربية ثانية = نسخة جديدة من هذا الملف (config لكل دولة).
 *
 * قاعدة ثابتة: الأرقام دائماً أرقام غربية (0-9) — أبداً أرقام شرقية (٠-٩).
 */

export const cities = [
  "طرابلس",
  "بنغازي",
  "مصراتة",
  "الزاوية",
  "زليتن",
  "الخمس",
  "غريان",
  "ترهونة",
  "سرت",
  "سبها",
  "البيضاء",
  "طبرق",
  "درنة",
  "اجدابيا",
] as const;

export type City = (typeof cities)[number];

/**
 * إحداثيات مراكز المدن — للخريطة: أسطى بدون موقع دقيق يظهر عند مركز
 * مدينته (مع إزاحة بسيطة حتى ما تتكدس الدبابيس فوق بعضها).
 */
export const cityCoords: Record<City, { lat: number; lng: number }> = {
  طرابلس: { lat: 32.8872, lng: 13.1913 },
  بنغازي: { lat: 32.1167, lng: 20.0667 },
  مصراتة: { lat: 32.3754, lng: 15.0925 },
  الزاوية: { lat: 32.7571, lng: 12.7276 },
  زليتن: { lat: 32.4674, lng: 14.5687 },
  الخمس: { lat: 32.6486, lng: 14.2619 },
  غريان: { lat: 32.1722, lng: 13.0203 },
  ترهونة: { lat: 32.4339, lng: 13.6332 },
  سرت: { lat: 31.2089, lng: 16.5887 },
  سبها: { lat: 27.0377, lng: 14.4283 },
  البيضاء: { lat: 32.7627, lng: 21.7551 },
  طبرق: { lat: 32.0836, lng: 23.9764 },
  درنة: { lat: 32.767, lng: 22.6367 },
  اجدابيا: { lat: 30.7554, lng: 20.2263 },
};

/** حدود ليبيا التقريبية — للتحقق من الإحداثيات المرسلة. */
export function isInLibya(lat: number, lng: number): boolean {
  return lat >= 19 && lat <= 34 && lng >= 9 && lng <= 26;
}

export function isCity(value: string): value is City {
  return (cities as readonly string[]).includes(value);
}

/**
 * توحيد رقم الهاتف الليبي:
 * - إزالة المسافات والشرطات والأقواس
 * - +218 أو 00218 في البداية → 0
 * - "9XXXXXXXX" (9 أرقام تبدأ بـ 9) → "09XXXXXXXX"
 *
 * الناتج الموحّد الصحيح دائماً بشكل: 09XXXXXXXX (10 أرقام).
 */
export function normalizePhone(raw: string): string {
  let value = raw.replace(/[\s\-().]/g, "");
  if (value.startsWith("+218")) {
    value = `0${value.slice(4)}`;
  } else if (value.startsWith("00218")) {
    value = `0${value.slice(5)}`;
  } else if (/^9[0-9]{8}$/.test(value)) {
    value = `0${value}`;
  }
  return value;
}

/**
 * رقم موبايل ليبي صالح؟ (يقبل +218 / 00218 / 0 / بدون بادئة)
 * صارم: 10 أرقام تبدأ بـ 091-095 فقط (المدار، ليبيانا، LTT) —
 * حتى ما يقدر أحد يسجّل برقم وهمي أو أجنبي.
 */
export function isValidPhone(raw: string): boolean {
  return /^09[1-5][0-9]{7}$/.test(normalizePhone(raw));
}

export const market = {
  code: "LY",
  name: "ليبيا",
  brand: "توّا",
  brandLatin: "Tawwa",
  currency: {
    code: "LYD",
    symbol: "د.ل",
    format: (n: number): string => `${n} د.ل`,
  },
  phone: {
    placeholder: "091 234 5678",
    pattern: /^(\+218|00218|0)?9[1-5][0-9]{7}$/,
    normalize: normalizePhone,
    isValid: isValidPhone,
  },
  cities,
  launchCities: ["طرابلس", "بنغازي", "مصراتة"] as const,
} as const;

export type Market = typeof market;
