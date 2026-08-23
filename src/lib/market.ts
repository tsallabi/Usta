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
