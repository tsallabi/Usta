import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "@/components/SignupForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";
import { BrandText, LangSwitcher } from "@/components/locale";

export const metadata: Metadata = {
  title: "افتح حسابك · توّا",
  description:
    "حساب مجاني برقم هاتفك وكلمة سر تختارها — تابع طلباتك وتقديرات الأسعار في مكان واحد.",
};

export default function SignupPage() {
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
          — حساب جديد · مجاني
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
          افتح حسابك في توّا.
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
          رقم موبايلك الليبي + كلمة سر تختارها أنت — بدون بريد إلكتروني ولا
          رسائل تفعيل. تتابع طلباتك وتقديرات الأسعار كلها في مكان واحد.
        </p>

        <SignupForm />
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
