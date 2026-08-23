import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { findService } from "@/lib/services";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  gradientById,
  initialsOf,
  firstNameOf,
  joinYearOf,
  VerifiedPill,
} from "@/components/UstaProfile";

export const runtime = "edge";

// newId("tm") produces `tm_` + 21 URL-safe alphanumerics.
const USTA_ID_SHAPE = /^tm_[0-9a-zA-Z]{21}$/;

type UstaRow = {
  id: string;
  full_name: string;
  trade: string;
  city: string;
  service_area: string;
  years_experience: number | null;
  previous_work: string | null;
  created_at: string;
  accepted_count: number;
};

/**
 * قراءة واحدة تتشارك بين generateMetadata والصفحة (React cache).
 * نفس قاعدة الـ API العام: موثّق وغير موقوف فقط،
 * وبدون whatsapp / national_id / email أبداً.
 */
const getUsta = cache(async (id: string): Promise<UstaRow | null> => {
  if (!USTA_ID_SHAPE.test(id)) return null;
  const db = getDb();
  if (!db) return null;
  try {
    const row = await db
      .prepare(
        `SELECT t.id, t.full_name, t.trade, t.city, t.service_area,
                t.years_experience, t.previous_work, t.created_at,
                (SELECT COUNT(*) FROM offers o
                  WHERE o.tradesman_id = t.id AND o.status = 'accepted')
                  AS accepted_count
           FROM tradesmen t
          WHERE t.id = ?1
            AND t.verified_at IS NOT NULL
            AND t.suspended_at IS NULL`
      )
      .bind(id)
      .first<UstaRow>();
    return row ?? null;
  } catch (err) {
    console.error("[usta/id page] D1 read failed:", err);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const usta = await getUsta(params.id);
  if (!usta) return { title: "الأسطى غير موجود" };
  const trade = findService(usta.trade);
  return {
    title: usta.full_name,
    description: `${usta.full_name} — ${trade?.name ?? usta.trade} موثّق في ${usta.city} على أسطى. انشر طلبك ويوصلك عرضه داخل المنصة.`,
    robots: { index: true, follow: true },
  };
}

export default async function UstaProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const usta = await getUsta(params.id);
  if (!usta) notFound();

  const trade = findService(usta.trade);
  const firstName = firstNameOf(usta.full_name);
  const stats: { value: string; label: string }[] = [
    {
      value: usta.years_experience != null ? `${usta.years_experience}` : "—",
      label: "سنوات الخبرة",
    },
    { value: `${usta.accepted_count}`, label: "شغلات مقبولة" },
    { value: joinYearOf(usta.created_at), label: "سنة الانضمام" },
  ];

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
        <div className="kicker" style={{ marginBottom: "24px" }}>
          — {trade?.name ?? usta.trade} · {usta.city}
        </div>

        {/* Profile card */}
        <section
          style={{
            padding: "32px 32px 28px",
            border: "1px solid var(--line)",
            borderRadius: "24px",
            background: "var(--paper-2)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "22px",
              flexWrap: "wrap",
              marginBottom: "28px",
            }}
          >
            <span
              aria-hidden="true"
              className="serif"
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "50%",
                background: gradientById(usta.id),
                color: "rgba(255,255,255,0.92)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                letterSpacing: "-0.02em",
                flexShrink: 0,
              }}
            >
              {initialsOf(usta.full_name)}
            </span>
            <div style={{ minWidth: 0 }}>
              <h1
                className="serif"
                style={{
                  fontSize: "36px",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  fontWeight: 400,
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span>{usta.full_name}</span>
                <VerifiedPill size="lg" />
              </h1>
              <div style={{ fontSize: "14px", color: "var(--ink-2)" }}>
                {trade?.name ?? usta.trade} · {usta.city} · مناطق الشغل:{" "}
                {usta.service_area}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              border: "1px solid var(--line)",
              borderRadius: "16px",
              background: "var(--paper)",
            }}
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  padding: "20px 12px",
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
                    fontVariantNumeric: "tabular-nums",
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
        </section>

        {/* Previous work */}
        <section
          style={{
            padding: "24px 28px",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            background: "var(--paper-2)",
            marginBottom: "24px",
          }}
        >
          <h2
            className="serif"
            style={{
              fontSize: "22px",
              letterSpacing: "-0.01em",
              fontWeight: 400,
              margin: "0 0 10px",
            }}
          >
            من أعماله السابقة
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--ink-2)",
              lineHeight: 1.65,
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {usta.previous_work?.trim()
              ? usta.previous_work
              : "الأسطى ما ضافش تفاصيل أعماله بعد."}
          </p>
        </section>

        {/* CTA — التواصل داخل المنصة فقط */}
        <section
          style={{
            padding: "32px 32px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #0B1F33 0%, #14314D 100%)",
            color: "#F5EFDF",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.4)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-60px",
              left: "-60px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(52,211,153,0.35) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <h2
            className="serif"
            style={{
              position: "relative",
              fontSize: "clamp(26px, 4vw, 34px)",
              letterSpacing: "-0.02em",
              fontWeight: 400,
              lineHeight: 1.3,
              margin: "0 0 12px",
            }}
          >
            تحب تخدم مع {firstName}؟
          </h2>
          <p
            style={{
              position: "relative",
              fontSize: "14px",
              color: "rgba(245,239,223,0.72)",
              lineHeight: 1.65,
              margin: "0 0 22px",
              maxWidth: "560px",
            }}
          >
            انشر طلبك ووصفك للشغل — يوصله إشعار ويرد عليك بعرضه داخل
            المنصة. أرقام الهواتف تظهر بس بعد قبول العرض — هكي الكل محمي.
          </p>
          <Link
            href={`/estimate?service=${encodeURIComponent(usta.trade)}`}
            style={{
              position: "relative",
              display: "inline-block",
              padding: "14px 28px",
              borderRadius: "999px",
              background:
                "linear-gradient(135deg, var(--brand-2), var(--brand-1))",
              color: "white",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            انشر طلب لخدمته ←
          </Link>
        </section>
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
            © 2026 أسطى · طرابلس
          </span>
          <Link
            href="/ustas"
            style={{
              fontSize: "11px",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
          >
            → دليل الأسطوات
          </Link>
        </div>
      </footer>
    </>
  );
}
