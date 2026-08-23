import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function SiteNav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background:
          "color-mix(in srgb, var(--paper) 90%, transparent)",
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
        </Link>

        <nav
          aria-label="القائمة الرئيسية"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <NavLink href="#how" label="كيف يخدم" />
          <NavLink href="#tradesmen" label="للأسطوات" />
          <NavLink href="/account" label="حسابي" />
          <NavLink href="/work" label="سوق الشغل" />
          <NavLink href="/ustas" label="دليل الأسطوات" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const style = {
    color: "var(--ink-2)",
    fontSize: "13px",
    textDecoration: "none",
    letterSpacing: "0.02em",
  };
  return (
    <a href={href} style={style} className="hidden-on-mobile">
      {label}
    </a>
  );
}
