import Link from "next/link";
import type { Metadata } from "next";
import { AdminConsole } from "@/components/AdminConsole";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "الإدارة",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
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
            aria-label="أسطى — الرئيسية"
          >
            <span className="brand-mark" aria-hidden="true" />
            <span
              className="serif"
              style={{ fontSize: "20px", letterSpacing: "-0.01em" }}
            >
              أسطى
            </span>
            <span
              className="mono"
              style={{
                fontSize: "10px",
                letterSpacing: "0.14em",
                color: "var(--ink-3)",
                marginInlineStart: "4px",
              }}
            >
              ADMIN
            </span>
          </Link>
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
        <AdminConsole />
      </main>
    </>
  );
}
