import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SetLocaleLink } from "@/components/locale";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "NOW — Fair price. Trusted pros.",
  description:
    "Describe the job, get a fair AI price range in 30 seconds, then hand-verified pros send you their offers. 28 services, one app.",
};

/**
 * الصفحة الرئيسية الإنجليزية — NOW.
 * كلها LTR داخلياً (dir="ltr") حتى تعرض صح مهما كان وضع اللغة العام.
 * زر «ع» يرجع للرئيسية العربية ويثبّت الكوكي.
 */

const gradients: Record<string, string> = {
  blue: "linear-gradient(140deg,#2A4A7F,#1F3966)",
  teal: "linear-gradient(140deg,#14876C,#0B6350)",
  orange: "linear-gradient(140deg,#E67E3B,#C55A1E)",
  plum: "linear-gradient(140deg,#6B3D7D,#4B2A5B)",
  rose: "linear-gradient(140deg,#DE5F6D,#B23F4E)",
  forest: "linear-gradient(140deg,#4A7346,#2E5030)",
  slate: "linear-gradient(140deg,#4A5C6E,#2E3D4F)",
  ochre: "linear-gradient(140deg,#C99A3E,#A67824)",
  sky: "linear-gradient(140deg,#3B7EA1,#256380)",
  walnut: "linear-gradient(140deg,#8B5E34,#66421F)",
  iron: "linear-gradient(140deg,#3E4A52,#232D33)",
  indigo: "linear-gradient(140deg,#4B4E9E,#32356E)",
  crimson: "linear-gradient(140deg,#A03333,#6E1F1F)",
  night: "linear-gradient(140deg,#2B2F4A,#1B1E33)",
  royal: "linear-gradient(140deg,#3E5AA8,#293D78)",
  grape: "linear-gradient(140deg,#5E3B76,#3F2752)",
  clay: "linear-gradient(140deg,#B4552D,#8A3A1B)",
  petrol: "linear-gradient(140deg,#20666E,#144750)",
  silver: "linear-gradient(140deg,#7A8691,#57626C)",
  midnight: "linear-gradient(140deg,#22364F,#152436)",
  wine: "linear-gradient(140deg,#8E3A5F,#63263F)",
  violet: "linear-gradient(140deg,#6B4AA8,#48307A)",
  seafoam: "linear-gradient(140deg,#2E8B74,#1F6152)",
  storm: "linear-gradient(140deg,#4E6E8E,#33495F)",
  space: "linear-gradient(140deg,#37456E,#232D4A)",
  aqua: "linear-gradient(140deg,#2D8FBF,#1D6486)",
  denim: "linear-gradient(140deg,#3F6C93,#2A4B68)",
  olive: "linear-gradient(140deg,#6E7A33,#4C5522)",
};

export default function EnglishHome() {
  return (
    <div dir="ltr" lang="en">
      {/* ─── Header ─── */}
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
            maxWidth: "1080px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <BrandMark />
            <span
              className="serif"
              style={{ fontSize: "28px", letterSpacing: "-0.01em" }}
            >
              NOW
            </span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <SetLocaleLink
              locale="ar"
              href="/"
              style={{
                border: "1px solid var(--line)",
                borderRadius: "999px",
                padding: "8px 14px",
                fontSize: "13px",
                color: "var(--ink-2)",
                textDecoration: "none",
              }}
            >
              ع
            </SetLocaleLink>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        style={{ maxWidth: "1080px", margin: "0 auto", padding: "64px 24px 100px" }}
      >
        {/* ─── Hero ─── */}
        <div style={{ maxWidth: "760px", marginBottom: "48px" }}>
          <div className="kicker" style={{ marginBottom: "20px" }}>
            — FAIR-PRICE SERVICES MARKETPLACE
          </div>
          <h1
            className="serif"
            style={{
              fontSize: "clamp(42px, 6vw, 76px)",
              lineHeight: 1.15,
              letterSpacing: "-0.028em",
              margin: "0 0 20px",
              textWrap: "balance",
              fontWeight: 400,
            }}
          >
            A fair price. A trusted pro.{" "}
            <em style={{ color: "var(--brand-1, #10B981)", fontStyle: "italic" }}>
              Before
            </em>{" "}
            anyone sells you anything.
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "var(--ink-2)",
              lineHeight: 1.6,
              margin: "0 0 32px",
            }}
          >
            Describe the job in a sentence — get a fair AI price range in under
            30 seconds. Then hand-verified pros send offers on your request. No
            guesswork, no overcharging, and your phone number stays private.
          </p>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <Link
              href="/estimate"
              style={{
                padding: "15px 32px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #10B981, #0B7F58)",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 10px 30px -10px rgba(11,127,88,0.5)",
              }}
            >
              ✨ Try the AI estimate
            </Link>
            <Link
              href="/ustas?view=map"
              style={{
                padding: "15px 32px",
                borderRadius: "999px",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                fontSize: "16px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              🗺 See pros near you
            </Link>
          </div>
          <p
            className="mono"
            style={{
              fontSize: "11px",
              letterSpacing: "0.08em",
              color: "var(--ink-3)",
              marginTop: "20px",
            }}
          >
            HAND-VERIFIED PROS · THE NEAREST ONE REACHES YOU NOW · YOUR NUMBER
            STAYS HIDDEN
          </p>
        </div>

        {/* ─── Why NOW ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginBottom: "72px",
          }}
        >
          {[
            {
              icon: "⚖️",
              title: "Know the fair price first",
              text: "AI gives you the typical market range before anyone quotes you — so nobody can overcharge.",
            },
            {
              icon: "🗺",
              title: "The nearest pro, on a map",
              text: "Every pro is a pin labeled with their trade. Nearby means they reach you NOW — that's the name.",
            },
            {
              icon: "🔒",
              title: "Your number stays yours",
              text: "Chat inside the app. Even after you accept an offer, you decide whether to share your phone.",
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "18px",
                padding: "26px",
                background: "var(--paper-2, transparent)",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>
                {f.icon}
              </div>
              <h3
                className="serif"
                style={{ fontSize: "21px", margin: "0 0 8px", fontWeight: 400 }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--ink-2)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {f.text}
              </p>
            </div>
          ))}
        </div>

        {/* ─── Services ─── */}
        <div className="kicker" style={{ marginBottom: "14px" }}>
          — 28 SERVICES, ONE APP
        </div>
        <h2
          className="serif"
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            margin: "0 0 28px",
            lineHeight: 1.3,
          }}
        >
          Whatever you need. NOW.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "72px",
          }}
        >
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/estimate?service=${s.slug}`}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: "18px",
                padding: "14px",
                color: "#fff",
                background: gradients[s.gradient] ?? gradients.teal,
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                boxShadow: "0 6px 20px -8px rgba(11,31,51,0.35)",
              }}
            >
              <span
                className="serif"
                style={{ fontSize: "17px", lineHeight: 1.25 }}
              >
                {s.nameEn}
              </span>
              <span
                style={{
                  fontSize: "10.5px",
                  opacity: 0.78,
                  marginTop: "4px",
                  lineHeight: 1.4,
                }}
              >
                {s.descriptionEn}
              </span>
            </Link>
          ))}
        </div>

        {/* ─── How it works ─── */}
        <div className="kicker" style={{ marginBottom: "14px" }}>
          — HOW IT WORKS
        </div>
        <h2
          className="serif"
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            margin: "0 0 28px",
            lineHeight: 1.3,
          }}
        >
          Three steps. That&rsquo;s it.
        </h2>
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 72px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            {
              n: "1",
              title: "Describe the job",
              text: "One sentence. The AI shows you the fair market range — with a confidence level.",
            },
            {
              n: "2",
              title: "Get offers",
              text: "Verified pros compete on your request. Compare prices, ratings and past work.",
            },
            {
              n: "3",
              title: "Accept & relax",
              text: "Chat in-app or on WhatsApp, get it done, pay cash on completion. Then rate them.",
            },
          ].map((s) => (
            <li
              key={s.n}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "16px",
                padding: "22px",
                background: "var(--paper-2, transparent)",
              }}
            >
              <div
                className="serif"
                style={{
                  fontSize: "30px",
                  color: "var(--brand-2, #0B7F58)",
                  marginBottom: "8px",
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                }}
              >
                {s.title}
              </div>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "var(--ink-2)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {s.text}
              </p>
            </li>
          ))}
        </ol>

        {/* ─── For pros ─── */}
        <div
          style={{
            borderRadius: "22px",
            background: "linear-gradient(140deg, #14876C, #0B6350)",
            color: "#fff",
            padding: "36px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: "560px" }}>
            <h2
              className="serif"
              style={{ fontSize: "28px", margin: "0 0 8px", fontWeight: 400 }}
            >
              Are you a pro? Your work finds you.
            </h2>
            <p style={{ fontSize: "14.5px", opacity: 0.9, margin: 0, lineHeight: 1.6 }}>
              0% commission during launch · get paid instantly on completion ·
              ready customers who already know the fair price.
            </p>
          </div>
          <Link
            href="/tradesmen/join"
            style={{
              padding: "14px 30px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Join as a pro →
          </Link>
        </div>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "24px",
          background: "var(--paper-2)",
        }}
      >
        <div
          style={{
            maxWidth: "1080px",
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
            © 2026 NOW (توّا) · Tripoli, Libya
          </span>
          <SetLocaleLink
            locale="ar"
            href="/"
            style={{
              fontSize: "11px",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
          >
            العربية ←
          </SetLocaleLink>
        </div>
      </footer>
    </div>
  );
}
