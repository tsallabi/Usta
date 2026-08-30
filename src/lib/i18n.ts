/**
 * نظام اللغات — عربي/إنجليزي بتحكّم المالك.
 *
 * وضع اللغة يضبطه المالك من متغيّر البيئة LANGUAGE_MODE في Cloudflare:
 *   both (افتراضي) — اللغتان متاحتان ومبدّل اللغة ظاهر
 *   ar             — عربي فقط (المبدّل مخفي)
 *   en             — إنجليزي فقط (لنشر نسخة بلد آخر مثل أيرلندا)
 *
 * الاسم التجاري ديناميكي واللوجو ثابت:
 *   عربي: توّا · إنجليزي: NOW — نفس المعنى، نفس العلامة (السهمان).
 *
 * اختيار الزائر يُحفظ في كوكي tawwa_locale (سنة). الترجمة تُطبَّق
 * تدريجياً: الواجهات الرئيسية أولاً، والفولباك دائماً العربي.
 */

export type Locale = "ar" | "en";
export type LanguageMode = "both" | "ar" | "en";

export const LOCALE_COOKIE = "tawwa_locale";

export const brandNames: Record<Locale, string> = {
  ar: "توّا",
  en: "NOW",
};

export const brandTaglines: Record<Locale, string> = {
  ar: "سعر عادل. أسطى موثوق.",
  en: "Fair price. Trusted pros.",
};

/** نصوص الواجهة الأساسية — تكبر تدريجياً مع تعريب/ترجمة كل صفحة. */
export const strings = {
  ar: {
    myAccount: "حسابي",
    work: "سوق الشغل",
    directory: "دليل الأسطوات",
    offerServices: "قدّم خدماتك",
    how: "كيف يخدم",
    home: "الرئيسية",
    whatToday: "شن تحتاج اليوم؟",
    orderService: "— اطلب خدمة",
    nearbyTitle: "🗺 شوف الأسطوات القريبين منك",
    nearbySub: "كل أسطى دبّوس باسم مهنته — القريب منك يوصلك توّا.",
    openMap: "افتح الخريطة ▼",
    closeMap: "إخفاء الخريطة ▲",
    logout: "تسجيل خروج",
    yourJobs: "— طلباتك",
  },
  en: {
    myAccount: "My account",
    work: "Job board",
    directory: "Pros directory",
    offerServices: "Offer your services",
    how: "How it works",
    home: "Home",
    whatToday: "What do you need today?",
    orderService: "— Request a service",
    nearbyTitle: "🗺 See the pros near you",
    nearbySub: "Every pro is a pin with their trade — the nearest one reaches you NOW.",
    openMap: "Open the map ▼",
    closeMap: "Hide the map ▲",
    logout: "Log out",
    yourJobs: "— Your requests",
  },
} as const;

export type StringKey = keyof (typeof strings)["ar"];

export function t(locale: Locale, key: StringKey): string {
  return strings[locale][key] ?? strings.ar[key];
}
