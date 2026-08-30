import Link from "next/link";
import type { Metadata } from "next";
import { TradesmanForm } from "@/components/TradesmanForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";
import { BrandText, LangSwitcher } from "@/components/locale";

export const metadata: Metadata = {
  title: "انضم كأسطى",
  description:
    "سجّل مهنتك في توّا — بدون عمولات ولا مزادات. توثيق يدوي خلال 48 ساعة، وأول شهر 100% لك.",
};

const stats: { value: string; label: string }[] = [
  { value: "0 د.ل", label: "رسوم على الطلب" },
  { value: "48 ساعة", label: "للتوثيق" },
  { value: "100%", label: "من أول شهر لك" },
];

export default function TradesmanJoinPage() {
  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "color-mix(in srgb, var(--paper) 90%, transparent)",
          backdropFilter: "saturate(1.6) blur(10px)",
          WebkitBackdropFilter: "saturate(1.6) blur(10px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "inherit",
            }}
            aria-label="توّا — الرئيسية"
          >
            <BrandMark />
            <span
              className="serif"
              style={{ fontSize: "28px", letterSpacing: "-0.01em" }}
            >
              <BrandText />
            </span>
          </Link>
          <LangSwitcher />
            <ThemeToggle />
        </div>
      </header>

      <main
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "60px 24px 100px",
        }}
      >
        <div className="kicker" style={{ marginBottom: "20px" }}>
          — للأسطوات الليبيين · مجاني فترة الإطلاق
        </div>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(40px, 5.4vw, 72px)",
            lineHeight: 1.3,
            letterSpacing: "-0.028em",
            margin: "0 0 20px",
            textWrap: "balance",
            fontWeight: 400,
          }}
        >
          شغلك{" "}
          <em style={{ color: "var(--brand-1)", fontStyle: "italic" }}>
            يلقاك
          </em>
          .
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "var(--ink-2)",
            lineHeight: 1.55,
            margin: "0 0 44px",
            maxWidth: "540px",
          }}
        >
          بدون عمولات ولا مزادات — الطلبات تجيك بسعر عادل محسوب مسبقاً
          بالذكاء الاصطناعي، عشان تقضّي وقتك في شغل حقيقي، مش في مفاصلة
          وعروض على الفاضي.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            background: "var(--paper-2)",
            margin: "0 0 56px",
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "22px 12px",
                textAlign: "center",
                borderInlineStart: i === 0 ? "none" : "1px solid var(--line)",
              }}
            >
              <div
                className="serif"
                style={{
                  fontSize: "clamp(22px, 3.4vw, 32px)",
                  color: "var(--ink)",
                  lineHeight: 1.3,
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.value}
              </div>
              <div
                className="mono"
                style={{
                  marginTop: "6px",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  color: "var(--ink-3)",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <TradesmanForm />
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "24px 24px",
          background: "var(--paper-2)",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
          className="mono"
        >
          <span
            style={{
              fontSize: "11px",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
            }}
          >
            © 2026 توّا · طرابلس
          </span>
          <Link
            href="/"
            style={{
              fontSize: "11px",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
          >
            → الرئيسية
          </Link>
        </div>
      </footer>
    </>
  );
}
