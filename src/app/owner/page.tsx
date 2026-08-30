import Link from "next/link";
import type { Metadata } from "next";
import { OwnerConsole } from "@/components/OwnerConsole";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";
import { BrandText, LangSwitcher } from "@/components/locale";

export const metadata: Metadata = {
  title: "المالك",
  robots: { index: false, follow: false },
};

export default function OwnerPage() {
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
            maxWidth: "1180px",
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
            <span
              className="mono"
              style={{
                fontSize: "10px",
                letterSpacing: "0.14em",
                color: "var(--amber, #E6A429)",
                marginInlineStart: "4px",
              }}
            >
              OWNER
            </span>
          </Link>
          <LangSwitcher />
            <ThemeToggle />
        </div>
      </header>

      <main
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "48px 24px 100px",
        }}
      >
        <OwnerConsole />
      </main>
    </>
  );
}
