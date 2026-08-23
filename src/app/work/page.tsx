import Link from "next/link";
import type { Metadata } from "next";
import { WorkBoard } from "@/components/WorkBoard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "سوق الشغل · توّا",
  description: "طلبات مفتوحة في مهنتك — قدّم عرضك والزبون يختار.",
  robots: { index: false, follow: false },
};

export default function WorkPage() {
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
              style={{ fontSize: "20px", letterSpacing: "-0.01em" }}
            >
              توّا
            </span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/account"
              style={{
                color: "var(--ink-2)",
                fontSize: "13px",
                textDecoration: "none",
                letterSpacing: "0.02em",
              }}
            >
              حسابي
            </Link>
            <ThemeToggle />
          </div>
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
          — للأسطوات الموثّقين
        </div>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(34px, 5vw, 56px)",
            lineHeight: 1.3,
            letterSpacing: "-0.028em",
            margin: "0 0 8px",
            textWrap: "balance",
            fontWeight: 400,
          }}
        >
          سوق الشغل.
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--ink-2)",
            lineHeight: 1.55,
            margin: "0 0 40px",
            maxWidth: "540px",
          }}
        >
          طلبات مفتوحة في مهنتك — قدّم عرضك والزبون يختار.
        </p>

        <WorkBoard />
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
