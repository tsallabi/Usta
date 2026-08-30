"use client";

/**
 * أدوات اللغة في المتصفح:
 *   - getClientLocale(): يقرأ كوكي اللغة (افتراضي عربي)
 *   - BrandText: الاسم التجاري الديناميكي — توّا بالعربي، NOW بالإنجليزي
 *     (اللوجو BrandMark ثابت لا يتغير)
 *   - LangSwitcher: زر «EN / ع» — يظهر فقط لما LANGUAGE_MODE = both،
 *     ويطبّق اتجاه الصفحة (rtl/ltr) حسب اللغة، ويفرض اللغة لو مقفولة
 */

import { useEffect, useState } from "react";
import { LOCALE_COOKIE, brandNames, type Locale, type LanguageMode } from "@/lib/i18n";

export function getClientLocale(): Locale {
  if (typeof document === "undefined") return "ar";
  const match = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${LOCALE_COOKIE}=`));
  return match?.slice(LOCALE_COOKIE.length + 1) === "en" ? "en" : "ar";
}

export function setClientLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.location.reload();
}

/** hook بسيط: اللغة الحالية (تتحدد بعد التركيب — الافتراضي عربي). */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("ar");
  useEffect(() => {
    setLocale(getClientLocale());
  }, []);
  return locale;
}

/** الاسم التجاري الديناميكي — النص فقط؛ العلامة ثابتة. */
export function BrandText() {
  const locale = useLocale();
  return <>{brandNames[locale]}</>;
}

let cachedMode: LanguageMode | null = null;

export function LangSwitcher() {
  const [mode, setMode] = useState<LanguageMode | null>(cachedMode);
  const locale = useLocale();

  /* جلب وضع اللغة مرة وحدة لكل جلسة */
  useEffect(() => {
    if (cachedMode !== null) return;
    let cancelled = false;
    void fetch("/api/config")
      .then((r) => r.json() as Promise<{ languageMode?: LanguageMode }>)
      .then((d) => {
        if (cancelled) return;
        cachedMode = d.languageMode ?? "both";
        setMode(cachedMode);
      })
      .catch(() => {
        cachedMode = "both";
        if (!cancelled) setMode("both");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* فرض اللغة لو الوضع مقفول (ar أو en). ملاحظة: ما نقلبوش اتجاه
     الوثيقة كلها — الصفحات العربية تظل rtl سليمة، وكل منطقة مترجمة
     (مثل /en وسوق الشغل بالإنجليزي) تضبط dir على حاويتها بنفسها. */
  useEffect(() => {
    if ((mode === "ar" || mode === "en") && locale !== mode) {
      document.cookie = `${LOCALE_COOKIE}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
      window.location.reload();
    }
  }, [mode, locale]);

  if (mode !== "both") return null;

  const next: Locale = locale === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      onClick={() => setClientLocale(next)}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل للعربية"}
      className="mono"
      style={{
        border: "1px solid var(--line)",
        background: "transparent",
        color: "var(--ink-2)",
        borderRadius: "999px",
        padding: "8px 14px",
        fontSize: "12px",
        letterSpacing: "0.08em",
        cursor: "pointer",
      }}
    >
      {locale === "ar" ? "EN" : "ع"}
    </button>
  );
}

/** رابط يبدّل اللغة ثم ينتقل — للصفحة الرئيسية الإنجليزية/العربية. */
export function SetLocaleLink({
  locale,
  href,
  children,
  style,
}: {
  locale: Locale;
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href={href}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
        window.location.href = href;
      }}
    >
      {children}
    </a>
  );
}

/** نص ثنائي اللغة — يعرض العربي أو الإنجليزي حسب لغة الزائر. */
export function LText({ ar, en }: { ar: string; en: string }) {
  const locale = useLocale();
  return <>{locale === "en" ? en : ar}</>;
}
