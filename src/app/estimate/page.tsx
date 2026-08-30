import Link from "next/link";
import type { Metadata } from "next";
import { EstimateWizard } from "@/components/EstimateWizard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";
import { BrandText, LangSwitcher } from "@/components/locale";

// This page reads searchParams (service preselect from the account tiles),
// which makes it dynamic — it must run on the edge for
// @cloudflare/next-on-pages. Same pattern as jobs/new.
export const runtime = "edge";

export const metadata: Metadata = {
  title: "جرّب الذكاء الاصطناعي · تقدير سعر عادل في 30 ثانية",
  description:
    "صف الشغل اللي تحتاجه واحصل على نطاق سعر عادل للسوق الليبي من ذكاء توّا الاصطناعي. بدون تسجيل. بدون التزام.",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function EstimatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const initialService = first(searchParams.service);
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes estimate-spin { to { transform: rotate(360deg); } }
            @media (prefers-reduced-motion) {
              @keyframes estimate-spin { to { transform: rotate(0deg); } }
            }
          `,
        }}
      />
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
          — أداة مجانية · بدون تسجيل
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
          اعرف السعر{" "}
          <em style={{ color: "var(--brand-1)", fontStyle: "italic" }}>
            العادل
          </em>{" "}
          قبل ما تتصل بأي حد.
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
          اختر المهنة، صف الشغل في جملة، والذكاء الاصطناعي يوريك النطاق المعتاد
          في السوق الليبي — مع درجة ثقة. ما يشخّصش العطل أبداً، عشان تقدر تثق
          في الرقم.
        </p>

        <EstimateWizard initialService={initialService} />
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
