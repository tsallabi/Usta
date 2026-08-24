"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { findService, services, type ServiceCategory } from "@/lib/services";
import { firstNameOf } from "./UstaProfile";
import { ChatPanel } from "./ChatPanel";
import { UstaMap, type MapUsta } from "./UstaMap";

/* ─── Types ──────────────────────────────────────────────── */

type Me = { name: string; phone: string };

type Job = {
  id: string;
  service: string;
  description: string;
  budget_lyd: number | null;
  city: string | null;
  area: string | null;
  status: string;
  created_at: string;
  est_min_lyd: number | null;
  est_max_lyd: number | null;
  offers_count: number;
  accepted_tradesman_id: string | null;
  accepted_tradesman_name: string | null;
  my_rating: number | null;
};

type Offer = {
  id: string;
  status: string;
  price_lyd: number;
  message: string | null;
  created_at: string;
  tradesman_name: string;
  trade: string;
  city: string;
  years_experience: number | null;
  verified: boolean;
  whatsapp: string | null;
  avg_rating: number | null;
  ratings_count: number;
};

/** عرض وارد من /api/me/offers — عبر كل الطلبات المفتوحة. */
type IncomingOffer = {
  id: string;
  price_lyd: number;
  message: string | null;
  created_at: string;
  job_id: string;
  job_service: string;
  job_description: string;
  tradesman_name: string;
  trade: string;
  city: string;
  years_experience: number | null;
  verified: boolean;
  avg_rating: number | null;
  ratings_count: number;
};

type View =
  | { kind: "loading" }
  | {
      kind: "ready";
      me: Me;
      jobs: Job[];
      jobsError: string | null;
      incoming: IncomingOffer[];
    };

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  open: "مفتوح",
  matched: "متطابق",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  disputed: "قيد المراجعة",
};

function statusColor(status: string): string {
  if (status === "open" || status === "in_progress") return "var(--brand-1)";
  if (status === "cancelled" || status === "disputed") return "var(--coral)";
  return "var(--ink-3)";
}

/* ─── بلاطات الخدمات — التوصيل أولاً دائماً ─────────────────── */

const orderedServices: ServiceCategory[] = [
  ...services.filter((s) => s.slug === "delivery"),
  ...services.filter((s) => s.slug !== "delivery"),
];

// نفس تدرّجات EstimateWizard — منسوخة محلياً حتى يبقى كل ملف client مستقل.
const gradientMap: Record<ServiceCategory["gradient"], string> = {
  blue: "linear-gradient(140deg, #2A4A7F, #1F3966)",
  teal: "linear-gradient(140deg, #14876C, #0B6350)",
  orange: "linear-gradient(140deg, #E67E3B, #C55A1E)",
  plum: "linear-gradient(140deg, #6B3D7D, #4B2A5B)",
  rose: "linear-gradient(140deg, #DE5F6D, #B23F4E)",
  forest: "linear-gradient(140deg, #4A7346, #2E5030)",
  slate: "linear-gradient(140deg, #4A5C6E, #2E3D4F)",
  ochre: "linear-gradient(140deg, #C99A3E, #A67824)",
  sky: "linear-gradient(140deg, #3B7EA1, #256380)",
  walnut: "linear-gradient(140deg, #8B5E34, #66421F)",
  iron: "linear-gradient(140deg, #3E4A52, #232D33)",
  indigo: "linear-gradient(140deg, #4B4E9E, #32356E)",
};

function iconPaths(icon: ServiceCategory["icon"]): JSX.Element {
  const paths: Record<ServiceCategory["icon"], JSX.Element> = {
    bolt: (
      <path d="M13 2 L4 14 h6 l-1 8 l9 -12 h-6 l1 -8 z" fill="currentColor" />
    ),
    wrench: (
      <path
        d="M14 3 a5 5 0 0 0 -3 8 L3 19 l2 2 l8 -8 a5 5 0 0 0 8 -3 l-3 -1 l-2 2 l-3 -3 l2 -2 z"
        fill="currentColor"
      />
    ),
    flame: (
      <path
        d="M12 3 c 1 4 5 5 5 10 a5 5 0 0 1 -10 0 c 0 -3 3 -5 3 -8 c 0 1 1 1 2 -2 z"
        fill="currentColor"
      />
    ),
    broom: (
      <path
        d="M14 3 l6 6 M13 4 L4 13 l3 3 l9 -9 z M6 15 l-3 6 l6 -3 l6 -6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    ),
    paint: (
      <>
        <rect x={3} y={3} width={14} height={6} rx={1} fill="currentColor" />
        <path
          d="M17 6 h4 v4 h-8 v3 h-2 v8 h-2 v-8 h-2 v-3 h8"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </>
    ),
    leaf: (
      <path
        d="M20 4 c -12 0 -14 8 -14 12 c 0 3 2 5 5 5 c 4 0 12 -2 12 -14 z"
        fill="currentColor"
      />
    ),
    truck: (
      <>
        <path
          d="M2 6 h11 v10 h-11 z M13 9 h5 l3 3 v4 h-8 z"
          fill="currentColor"
        />
        <circle
          cx={6}
          cy={18}
          r={2}
          fill="white"
          stroke="currentColor"
          strokeWidth={1.5}
        />
        <circle
          cx={17}
          cy={18}
          r={2}
          fill="white"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      </>
    ),
    box: (
      <>
        <path
          d="M3 8 L12 3 L21 8 L21 17 L12 22 L3 17 z"
          fill="currentColor"
          opacity={0.9}
        />
        <path
          d="M3 8 L12 13 L21 8 M12 13 L12 22"
          fill="none"
          stroke="white"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </>
    ),
    saw: (
      <path
        d="M14 2 L22 10 L12 20 L10 18 L12 16 L10 14 L12 12 L10 10 L12 8 L10 6 Z M8 14 L2 20 a1.5 1.5 0 0 0 2 2 L10 16 Z"
        fill="currentColor"
      />
    ),
    hammer: (
      <>
        <path d="M12 3 L21 12 L18 15 L9 6 Z" fill="currentColor" />
        <path d="M10 8 L3 15 L6 18 L13 11 Z" fill="currentColor" opacity={0.85} />
        <path d="M4.5 16.5 L2 19 a1.5 1.5 0 0 0 2 2 L6.5 18.5 Z" fill="currentColor" />
      </>
    ),
    key: (
      <>
        <circle
          cx={8}
          cy={12}
          r={4.5}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        />
        <path
          d="M12.5 12 H21 M18 12 v4 M15 12 v3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </>
    ),
    send: (
      <path
        d="M3 11 L21 3 L14 21 L11 13 Z M11 13 L21 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    ),
  };
  return paths[icon];
}

function ServiceGlyph({
  icon,
  size = 20,
}: {
  icon: ServiceCategory["icon"];
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color: "white" }}
      aria-hidden="true"
    >
      {iconPaths(icon)}
    </svg>
  );
}

/** رقاقة أيقونة صغيرة بتدرّج الخدمة — لبطاقات الطلبات. */
function ServiceChip({ service }: { service: ServiceCategory | undefined }) {
  if (!service) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "10px",
        background: gradientMap[service.gradient],
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 4px 12px -6px rgba(11,31,51,0.4)",
      }}
    >
      <ServiceGlyph icon={service.icon} size={16} />
    </span>
  );
}

/** شبكة بلاطات الخدمات التسع — التوصيل أولاً. كل بلاطة → /estimate?service= */
function ServiceTiles() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "10px",
      }}
    >
      {orderedServices.map((s) => (
        <Link
          key={s.slug}
          href={`/estimate?service=${s.slug}`}
          aria-label={`اطلب ${s.name}`}
          style={{
            aspectRatio: "1 / 1",
            borderRadius: "16px",
            padding: "12px",
            color: "white",
            background: gradientMap[s.gradient],
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 6px 20px -8px rgba(11,31,51,0.35)",
            transition: "transform 0.1s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <span
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ServiceGlyph icon={s.icon} size={18} />
          </span>
          <span>
            <span
              className="serif"
              style={{
                display: "block",
                fontSize: "16px",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
              }}
            >
              {s.name}
            </span>
            <span
              style={{
                display: "block",
                fontSize: "10.5px",
                opacity: 0.8,
                lineHeight: 1.45,
                marginTop: "3px",
              }}
            >
              {s.description}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─── الصفحة ─────────────────────────────────────────────── */

export function AccountView() {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "loading" });

  /** يجيب الطلبات + العروض الواردة معاً — يُستدعى عند التحميل وبعد أي قبول. */
  const loadLists = useCallback(async (): Promise<{
    jobs: Job[];
    jobsError: string | null;
    incoming: IncomingOffer[];
  }> => {
    let jobs: Job[] = [];
    let jobsError: string | null = null;
    let incoming: IncomingOffer[] = [];

    const [jobsSettled, offersSettled] = await Promise.allSettled([
      fetch("/api/me/jobs"),
      fetch("/api/me/offers"),
    ]);

    if (jobsSettled.status === "fulfilled") {
      const data = (await jobsSettled.value.json().catch(() => ({}))) as {
        ok?: boolean;
        jobs?: Job[];
        error?: string;
      };
      if (data.ok && Array.isArray(data.jobs)) {
        jobs = data.jobs;
      } else {
        jobsError = data.error ?? "ما قدرناش نجيبو طلباتك توّا.";
      }
    } else {
      jobsError = "مشكلة في الاتصال. حاول بعد شوية.";
    }

    if (offersSettled.status === "fulfilled") {
      const data = (await offersSettled.value.json().catch(() => ({}))) as {
        ok?: boolean;
        offers?: IncomingOffer[];
      };
      if (data.ok && Array.isArray(data.offers)) {
        incoming = data.offers;
      }
      // فشل العروض الواردة مش قاتل — القسم ببساطة ما يظهرش.
    }

    return { jobs, jobsError, incoming };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        const me = (await meRes.json().catch(() => ({}))) as {
          loggedIn?: boolean;
          name?: string;
          phone?: string;
        };
        if (cancelled) return;
        if (!me.loggedIn || !me.name || !me.phone) {
          router.replace("/login");
          return;
        }

        const lists = await loadLists();
        if (cancelled) return;
        setView({
          kind: "ready",
          me: { name: me.name, phone: me.phone },
          ...lists,
        });
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router, loadLists]);

  /** بعد قبول عرض من أي مكان — نعيد جلب القائمتين معاً. */
  const refresh = useCallback(async () => {
    const lists = await loadLists();
    setView((v) => (v.kind === "ready" ? { ...v, ...lists } : v));
  }, [loadLists]);

  async function onLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // still leave the page — the cookie may already be gone
    }
    router.replace("/login");
  }

  if (view.kind === "loading") {
    return (
      <div
        className="mono"
        role="status"
        aria-live="polite"
        style={{
          fontSize: "12px",
          color: "var(--ink-3)",
          letterSpacing: "0.1em",
          padding: "40px 0",
        }}
      >
        قاعدين نجيبو حسابك…
      </div>
    );
  }

  const { me, jobs, jobsError, incoming } = view;
  const openCount = jobs.filter(
    (j) => j.status === "open" || j.status === "matched" || j.status === "in_progress"
  ).length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const hasJobs = jobs.length > 0;

  return (
    <>
      {/* ─── الترويسة ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "36px",
        }}
      >
        <div>
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
            أهلاً، {me.name}.
          </h1>
          <div
            className="mono"
            dir="ltr"
            style={{
              fontSize: "12px",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
              textAlign: "end",
            }}
          >
            {me.phone}
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            padding: "10px 20px",
            borderRadius: "999px",
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--ink-2)",
            fontSize: "13px",
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "border-color 0.15s ease",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand-2)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "var(--brand-2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--line)")
          }
        >
          تسجيل خروج
        </button>
      </div>

      {jobsError && (
        <div
          role="alert"
          className="mono"
          style={{
            fontSize: "12px",
            color: "var(--coral)",
            letterSpacing: "0.04em",
            marginBottom: "24px",
          }}
        >
          {jobsError}
        </div>
      )}

      {/* ─── حالة فارغة: بيتك محتاج حاجة؟ ─── */}
      {!jobsError && !hasJobs && (
        <section aria-label="ابدأ طلبك الأول">
          <h2
            className="serif"
            style={{
              fontSize: "clamp(26px, 3.4vw, 38px)",
              letterSpacing: "-0.02em",
              fontWeight: 400,
              margin: "0 0 10px",
              lineHeight: 1.3,
              textWrap: "balance",
            }}
          >
            بيتك محتاج حاجة؟
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "var(--ink-2)",
              lineHeight: 1.6,
              margin: "0 0 24px",
              maxWidth: "540px",
            }}
          >
            اختار الخدمة، اوصف الشغل، والذكاء الاصطناعي يعطيك السعر العادل —
            والأسطوات يجوك بعروضهم.
          </p>
          <ServiceTiles />
          <div style={{ marginTop: "18px" }}>
            <Link
              href="/estimate"
              className="mono"
              style={{
                fontSize: "12px",
                color: "var(--ink-3)",
                letterSpacing: "0.08em",
                textDecoration: "none",
              }}
            >
              أو ابدأ بتقدير سعر ←
            </Link>
          </div>
        </section>
      )}

      {!jobsError && hasJobs && (
        <>
          {/* ─── شريط الأرقام ─── */}
          <div
            role="group"
            aria-label="ملخص حسابك"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px",
              marginBottom: "40px",
            }}
          >
            {[
              { n: openCount, label: "طلباتك المفتوحة", accent: "var(--ink)" },
              {
                n: incoming.length,
                label: "عروض جديدة",
                accent: incoming.length > 0 ? "var(--brand-1)" : "var(--ink)",
              },
              { n: completedCount, label: "مكتملة", accent: "var(--ink)" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "1px solid var(--line)",
                  background: "var(--paper-2)",
                }}
              >
                <div
                  className="serif"
                  style={{
                    fontSize: "30px",
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                    color: stat.accent,
                  }}
                >
                  {stat.n}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    color: "var(--ink-3)",
                    marginTop: "4px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* ─── عروض جديدة على طلباتك ─── */}
          <IncomingOffers incoming={incoming} onAccepted={refresh} />

          {/* ─── شن تحتاج اليوم؟ ─── */}
          <section aria-label="اطلب خدمة جديدة" style={{ marginBottom: "48px" }}>
            <div className="kicker" style={{ marginBottom: "8px" }}>
              — اطلب خدمة
            </div>
            <h2
              className="serif"
              style={{
                fontSize: "clamp(22px, 3vw, 30px)",
                letterSpacing: "-0.02em",
                fontWeight: 400,
                margin: "0 0 18px",
                lineHeight: 1.3,
              }}
            >
              شن تحتاج اليوم؟
            </h2>
            <ServiceTiles />
          </section>

          {/* ─── الخريطة: القريب منك يوصلك توّا (داخل الصفحة) ─── */}
          <InlineMapCard />

          {/* ─── طلباتك ─── */}
          <section aria-label="طلباتك">
            <div className="kicker" style={{ marginBottom: "20px" }}>
              — طلباتك
            </div>
            <div style={{ display: "grid", gap: "16px", maxWidth: "640px" }}>
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onAccepted={refresh} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

/* ─── 🔔 عروض جديدة على طلباتك ────────────────────────────── */

function IncomingOffers({
  incoming,
  onAccepted,
}: {
  incoming: IncomingOffer[];
  onAccepted: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // بعد القبول: بطاقة فتح الواتساب تظهر مكان بطاقة العرض نفسها.
  const [unlocked, setUnlocked] = useState<{
    offerId: string;
    name: string;
    whatsapp: string;
    service: string;
  } | null>(null);

  async function accept(o: IncomingOffer) {
    if (!window.confirm("متأكد؟ بنقبل هذا العرض ونرفض بقية العروض المعلّقة."))
      return;
    setBusyId(o.id);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${o.id}/accept`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        whatsapp?: string;
        error?: string;
      };
      if (data.ok && data.whatsapp) {
        const svc = findService(o.job_service);
        setUnlocked({
          offerId: o.id,
          name: o.tradesman_name,
          whatsapp: data.whatsapp,
          service: svc?.name ?? o.job_service,
        });
        await onAccepted();
      } else {
        setError(data.error ?? "صار خطأ أثناء قبول العرض. حاول مرة ثانية.");
      }
    } catch {
      setError("مشكلة في الاتصال. حاول مرة ثانية.");
    } finally {
      setBusyId(null);
    }
  }

  // القسم يظهر فقط لما فيه عروض معلّقة — أو بطاقة واتساب مفتوحة توّا
  // (حتى ما يختفيش الرقم أول ما آخر عرض معلّق يتقبل).
  if (incoming.length === 0 && !unlocked) return null;

  return (
    <section aria-label="عروض جديدة على طلباتك" style={{ marginBottom: "48px" }}>
      <div className="kicker" style={{ marginBottom: "8px" }}>
        — 🔔 عروض جديدة
      </div>
      <h2
        className="serif"
        style={{
          fontSize: "clamp(22px, 3vw, 30px)",
          letterSpacing: "-0.02em",
          fontWeight: 400,
          margin: "0 0 18px",
          lineHeight: 1.3,
        }}
      >
        عروض جديدة على طلباتك
      </h2>

      {error && (
        <div
          role="alert"
          className="mono"
          style={{
            fontSize: "12px",
            color: "var(--coral)",
            letterSpacing: "0.04em",
            marginBottom: "14px",
          }}
        >
          {error}
        </div>
      )}

      {unlocked && (
        <div
          role="status"
          style={{
            padding: "20px 24px",
            borderRadius: "16px",
            border: "1px solid var(--brand-1)",
            background: "rgba(16,185,129,0.08)",
            marginBottom: "14px",
            maxWidth: "640px",
          }}
        >
          <div
            className="serif"
            style={{ fontSize: "18px", color: "var(--ink)", marginBottom: "8px" }}
          >
            تم! كلم {unlocked.name} مباشرة — {unlocked.service}:
          </div>
          <div
            className="serif"
            dir="ltr"
            style={{
              fontSize: "clamp(24px, 4vw, 32px)",
              letterSpacing: "0.02em",
              color: "var(--ink)",
              textAlign: "end",
              marginBottom: "14px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {unlocked.whatsapp}
          </div>
          <a
            href={`https://wa.me/218${unlocked.whatsapp.slice(1)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, var(--brand-2), var(--brand-1))",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            افتح واتساب ←
          </a>
        </div>
      )}

      <div style={{ display: "grid", gap: "12px", maxWidth: "640px" }}>
        {incoming.map((o) => {
          const trade = findService(o.trade);
          const jobSvc = findService(o.job_service);
          const busy = busyId === o.id;
          return (
            <div
              key={o.id}
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                border: o.verified
                  ? "1px solid color-mix(in srgb, var(--brand-1) 45%, var(--line))"
                  : "1px solid var(--line)",
                background: "var(--paper-2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "15px" }}>
                    {o.tradesman_name}
                  </span>
                  {o.verified && (
                    <span
                      className="mono"
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: "rgba(16,185,129,0.12)",
                        color: "var(--brand-1)",
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        fontWeight: 700,
                      }}
                    >
                      ✓ موثّق
                    </span>
                  )}
                  <OfferRatingBadge avg={o.avg_rating} count={o.ratings_count} />
                  <span
                    className="mono"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      color: "var(--ink-3)",
                    }}
                  >
                    {trade?.name ?? o.trade} · {o.city}
                    {o.years_experience != null &&
                      ` · خبرة ${o.years_experience} سنة`}
                  </span>
                </span>
                <span
                  className="serif"
                  style={{ fontSize: "20px", color: "var(--ink)" }}
                >
                  {o.price_lyd} د.ل
                </span>
              </div>

              {o.message && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--ink-2)",
                    lineHeight: 1.55,
                    margin: "0 0 10px",
                  }}
                >
                  {o.message}
                </p>
              )}

              <div
                className="mono"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  color: "var(--ink-3)",
                  marginBottom: "12px",
                }}
              >
                على طلب: {jobSvc?.name ?? o.job_service} — {o.job_description}
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void accept(o)}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "999px",
                    border: 0,
                    background:
                      "linear-gradient(135deg, var(--brand-2), var(--brand-1))",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: busy ? "wait" : "pointer",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {busy ? "قاعدين نقبلو…" : "اقبل العرض"}
                </button>
                <a
                  href={`#job-${o.job_id}`}
                  className="mono"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "999px",
                    border: "1px solid var(--line)",
                    color: "var(--ink-2)",
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  شوف الطلب ↓
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── ★ نجوم التقييم — العنبر للتقييم فقط ─────────────────── */

const RATING_DIMS = [
  { key: "punctuality", label: "الالتزام بالوقت" },
  { key: "quality", label: "جودة الشغل" },
  { key: "priceAdherence", label: "الالتزام بالسعر" },
  { key: "professionalism", label: "التعامل" },
  { key: "communication", label: "التواصل" },
] as const;

type DimKey = (typeof RATING_DIMS)[number]["key"];

const emptyScores: Record<DimKey, number> = {
  punctuality: 0,
  quality: 0,
  priceAdherence: 0,
  professionalism: 0,
  communication: 0,
};

function Star({ filled, size = 28 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6 L14.8 8.6 L21.4 9.4 L16.5 13.9 L17.8 20.4 L12 17.1 L6.2 20.4 L7.5 13.9 L2.6 9.4 L9.2 8.6 Z"
        fill={filled ? "var(--amber)" : "none"}
        stroke={filled ? "var(--amber)" : "var(--ink-3)"}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** صف نجوم للعرض فقط — يُقرّب المتوسط لأقرب نجمة. */
function StaticStars({ avg, size = 18 }: { avg: number; size?: number }) {
  const rounded = Math.round(avg);
  return (
    <span
      style={{ display: "inline-flex", gap: "2px" }}
      role="img"
      aria-label={`التقييم ${avg} من 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= rounded} size={size} />
      ))}
    </span>
  );
}

/** شارة تقييم الأسطى في بطاقات العروض — ★ عنبري + العدد. */
function OfferRatingBadge({
  avg,
  count,
}: {
  avg: number | null;
  count: number | undefined;
}) {
  if (avg == null) return null;
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <span className="serif" style={{ color: "var(--amber)", fontSize: "14px" }}>
        ★ {avg}
      </span>
      {typeof count === "number" && count > 0 && (
        <span
          className="mono"
          style={{
            fontSize: "10px",
            color: "var(--ink-3)",
            marginInlineStart: "4px",
            letterSpacing: "0.04em",
          }}
        >
          ({count})
        </span>
      )}
    </span>
  );
}

/** صف نجوم قابل للنقر — 5 نجوم 28px، تعبئة عنبرية عند الاختيار. */
function StarPicker({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "14px", color: "var(--ink)" }}>{label}</span>
      <span
        role="radiogroup"
        aria-label={label}
        style={{ display: "inline-flex", gap: "2px" }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} من 5`}
            onClick={() => onSelect(n)}
            style={{
              background: "transparent",
              border: 0,
              padding: "2px",
              cursor: "pointer",
              lineHeight: 0,
            }}
          >
            <Star filled={n <= value} />
          </button>
        ))}
      </span>
    </div>
  );
}

/* ─── لوحة التقييم — بعد "تم الشغل" ───────────────────────── */

function RatingPanel({
  jobId,
  tradesmanName,
  onRated,
}: {
  jobId: string;
  tradesmanName: string | null;
  onRated: (avg: number) => void;
}) {
  const [scores, setScores] = useState<Record<DimKey, number>>(emptyScores);
  const [review, setReview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneAvg, setDoneAvg] = useState<number | null>(null);

  const chosen = RATING_DIMS.map((d) => scores[d.key]).filter((v) => v > 0);
  const allChosen = chosen.length === RATING_DIMS.length;
  const liveAvg =
    chosen.length > 0
      ? Math.round((chosen.reduce((a, b) => a + b, 0) / chosen.length) * 10) /
        10
      : null;

  async function submit() {
    if (!allChosen || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/jobs/${jobId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          punctuality: scores.punctuality,
          quality: scores.quality,
          priceAdherence: scores.priceAdherence,
          professionalism: scores.professionalism,
          communication: scores.communication,
          review: review.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (data.ok) {
        const sum = RATING_DIMS.reduce((a, d) => a + scores[d.key], 0);
        const avg = Math.round((sum / RATING_DIMS.length) * 10) / 10;
        setDoneAvg(avg);
        onRated(avg);
      } else {
        setError(data.error ?? "صار خطأ أثناء إرسال التقييم. حاول مرة ثانية.");
      }
    } catch {
      setError("مشكلة في الاتصال. حاول مرة ثانية.");
    } finally {
      setBusy(false);
    }
  }

  if (doneAvg != null) {
    return (
      <div
        role="status"
        style={{
          marginTop: "16px",
          padding: "18px 22px",
          borderRadius: "16px",
          border: "1px solid color-mix(in srgb, var(--amber) 50%, var(--line))",
          background: "rgba(230,164,41,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        <StaticStars avg={doneAvg} size={22} />
        <span
          className="serif"
          style={{ fontSize: "17px", color: "var(--ink)" }}
        >
          شكراً — تقييمك يساعد الكل.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "20px 22px",
        borderRadius: "16px",
        border: "1px solid color-mix(in srgb, var(--amber) 50%, var(--line))",
        background: "var(--paper)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <h3
          className="serif"
          style={{
            fontSize: "20px",
            letterSpacing: "-0.01em",
            fontWeight: 400,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          كيف كان {tradesmanName ? firstNameOf(tradesmanName) : "الأسطى"}؟
        </h3>
        <span
          className="serif"
          aria-live="polite"
          style={{
            fontSize: "26px",
            color: liveAvg != null ? "var(--amber)" : "var(--ink-3)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {liveAvg != null ? liveAvg.toFixed(1) : "—"}
        </span>
      </div>

      <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
        {RATING_DIMS.map((dim) => (
          <StarPicker
            key={dim.key}
            label={dim.label}
            value={scores[dim.key]}
            onSelect={(n) => setScores((s) => ({ ...s, [dim.key]: n }))}
          />
        ))}
      </div>

      <label
        htmlFor={`rating-review-${jobId}`}
        style={{ position: "absolute", insetInlineStart: "-9999px" }}
      >
        مراجعة مكتوبة (اختياري)
      </label>
      <textarea
        id={`rating-review-${jobId}`}
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={600}
        rows={3}
        placeholder="كلمة منك تفيد غيرك (اختياري)"
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid var(--line)",
          background: "var(--paper-2)",
          color: "var(--ink)",
          fontSize: "14px",
          fontFamily: "inherit",
          lineHeight: 1.55,
          resize: "vertical",
          outline: "none",
          marginBottom: "12px",
        }}
      />

      {error && (
        <p
          role="alert"
          className="mono"
          style={{
            fontSize: "12px",
            color: "var(--coral)",
            letterSpacing: "0.04em",
            margin: "0 0 12px",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!allChosen || busy}
        onClick={() => void submit()}
        style={{
          padding: "12px 26px",
          borderRadius: "999px",
          border: 0,
          background: "var(--amber)",
          color: "#3A2A05",
          fontSize: "14px",
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: !allChosen || busy ? "not-allowed" : "pointer",
          opacity: !allChosen || busy ? 0.5 : 1,
        }}
      >
        {busy ? "قاعدين نرسلو…" : "أرسل التقييم"}
      </button>
    </div>
  );
}

/* ─── بطاقة طلب واحدة ─────────────────────────────────────── */

function JobCard({
  job,
  onAccepted,
}: {
  job: Job;
  onAccepted: () => Promise<void>;
}) {
  // "تم الشغل" ثم التقييم — حالة محلية حتى تنقلب البطاقة فوراً بدون انتظار
  // إعادة الجلب (الخادم يرجّع نفس الحالة في التحديث الجاي).
  const [localCompleted, setLocalCompleted] = useState(false);
  const [completeBusy, setCompleteBusy] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [localRating, setLocalRating] = useState<number | null>(null);

  const service = findService(job.service);
  const description =
    job.description.length > 140
      ? `${job.description.slice(0, 140)}…`
      : job.description;
  const hasOffers = (job.offers_count ?? 0) > 0;
  const status = localCompleted ? "completed" : job.status;
  const ratedAvg = localRating ?? job.my_rating;

  async function markDone() {
    if (!window.confirm("خلص الأسطى الشغل؟ بعد التأكيد تقدر تقيّمه.")) return;
    setCompleteBusy(true);
    setCompleteError(null);
    try {
      const res = await fetch(`/api/me/jobs/${job.id}/complete`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (data.ok) {
        // البطاقة تنقلب "مكتمل" ولوحة التقييم تنفتح تلقائياً.
        setLocalCompleted(true);
        setPanelOpen(true);
      } else {
        setCompleteError(
          data.error ?? "صار خطأ أثناء تأكيد الإتمام. حاول مرة ثانية."
        );
      }
    } catch {
      setCompleteError("مشكلة في الاتصال. حاول مرة ثانية.");
    } finally {
      setCompleteBusy(false);
    }
  }

  return (
    <article
      id={`job-${job.id}`}
      style={{
        padding: "20px 24px",
        border: "1px solid var(--line)",
        borderRadius: "16px",
        background: "var(--paper-2)",
        scrollMarginTop: "90px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ServiceChip service={service} />
          <span
            className="serif"
            style={{
              fontSize: "20px",
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {service?.name ?? job.service}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {hasOffers && (
            <span
              className="mono"
              style={{
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "var(--amber)",
                background: "rgba(230,164,41,0.14)",
                borderRadius: "999px",
                padding: "4px 12px",
                fontWeight: 700,
              }}
            >
              {job.offers_count === 1 ? "عرض واحد" : `${job.offers_count} عروض`}
            </span>
          )}
          <span
            className="mono"
            style={{
              fontSize: "10px",
              letterSpacing: "0.12em",
              color: statusColor(status),
              border: `1px solid ${statusColor(status)}`,
              borderRadius: "999px",
              padding: "4px 12px",
            }}
          >
            {statusLabels[status] ?? status}
          </span>
        </span>
      </div>
      <p
        style={{
          fontSize: "14px",
          color: "var(--ink-2)",
          lineHeight: 1.55,
          margin: "0 0 14px",
        }}
      >
        {description}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "10px",
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
          }}
        >
          {job.created_at.slice(0, 10)}
          {job.city ? ` · ${job.city}` : ""}
        </span>
        <span className="serif" style={{ fontSize: "16px", color: "var(--ink)" }}>
          {typeof job.budget_lyd === "number" &&
            `ميزانيتك: ${job.budget_lyd} د.ل`}
          {typeof job.budget_lyd === "number" &&
            typeof job.est_min_lyd === "number" &&
            typeof job.est_max_lyd === "number" &&
            " · "}
          {typeof job.est_min_lyd === "number" &&
            typeof job.est_max_lyd === "number" &&
            `التقدير: ${job.est_min_lyd}–${job.est_max_lyd} د.ل`}
        </span>
      </div>
      {(status === "open" || status === "matched") && (
        <JobOffers
          jobId={job.id}
          count={job.offers_count ?? 0}
          onAccepted={onAccepted}
        />
      )}

      {/* متطابق؟ → زر "تم الشغل" يقفل الحلقة ويفتح التقييم */}
      {status === "matched" && (
        <div
          style={{
            marginTop: "16px",
            borderTop: "1px solid var(--line)",
            paddingTop: "14px",
          }}
        >
          {completeError && (
            <p
              role="alert"
              className="mono"
              style={{
                fontSize: "12px",
                color: "var(--coral)",
                letterSpacing: "0.04em",
                margin: "0 0 10px",
              }}
            >
              {completeError}
            </p>
          )}
          <button
            type="button"
            disabled={completeBusy}
            onClick={() => void markDone()}
            style={{
              padding: "12px 24px",
              borderRadius: "999px",
              border: 0,
              background:
                "linear-gradient(135deg, var(--brand-2), var(--brand-1))",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: completeBusy ? "wait" : "pointer",
              opacity: completeBusy ? 0.6 : 1,
            }}
          >
            {completeBusy ? "قاعدين نأكدو…" : "✓ تم الشغل"}
          </button>
        </div>
      )}

      {/* مكتمل: لوحة التقييم / زر قيّم / تقييمك السابق */}
      {status === "completed" &&
        (panelOpen ? (
          <RatingPanel
            jobId={job.id}
            tradesmanName={job.accepted_tradesman_name}
            onRated={setLocalRating}
          />
        ) : ratedAvg != null ? (
          <div
            style={{
              marginTop: "16px",
              borderTop: "1px solid var(--line)",
              paddingTop: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <StaticStars avg={ratedAvg} />
            <span
              className="mono"
              style={{
                fontSize: "11px",
                letterSpacing: "0.06em",
                color: "var(--amber)",
                fontWeight: 700,
              }}
            >
              قيّمته {ratedAvg}★
            </span>
          </div>
        ) : (
          <div
            style={{
              marginTop: "16px",
              borderTop: "1px solid var(--line)",
              paddingTop: "14px",
            }}
          >
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              style={{
                padding: "10px 22px",
                borderRadius: "999px",
                border: "1px solid color-mix(in srgb, var(--amber) 60%, var(--line))",
                background: "rgba(230,164,41,0.1)",
                color: "var(--amber)",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              ★ قيّم الأسطى
            </button>
          </div>
        ))}
    </article>
  );
}

/* ─── عروض الأسطوات على طلب واحد ─────────────────────────── */

const offerStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  accepted: "✓ مقبول",
  countered: "عرض مضاد",
  declined: "مرفوض",
  withdrawn: "مسحوب",
};

function offerPill(status: string): { bg: string; fg: string } {
  if (status === "accepted")
    return { bg: "rgba(16,185,129,0.12)", fg: "var(--brand-1)" };
  if (status === "declined" || status === "withdrawn")
    return { bg: "rgba(122,135,154,0.14)", fg: "var(--ink-3)" };
  return { bg: "rgba(230,164,41,0.14)", fg: "var(--amber)" };
}

function JobOffers({
  jobId,
  count,
  onAccepted,
}: {
  jobId: string;
  count: number;
  onAccepted: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/jobs/${jobId}/offers`);
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        offers?: Offer[];
        error?: string;
      };
      if (data.ok && Array.isArray(data.offers)) {
        setOffers(data.offers);
      } else {
        setError(data.error ?? "ما قدرناش نجيبو العروض توّا.");
      }
    } catch {
      setError("مشكلة في الاتصال. حاول بعد شوية.");
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && offers === null && !loading) void load();
  }

  async function accept(offerId: string) {
    if (!window.confirm("متأكد؟ بنقبل هذا العرض ونرفض بقية العروض المعلّقة."))
      return;
    setBusyId(offerId);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/accept`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        whatsapp?: string;
        error?: string;
      };
      if (data.ok && data.whatsapp) {
        const wa = data.whatsapp;
        setOffers((prev) =>
          (prev ?? []).map((o) =>
            o.id === offerId
              ? { ...o, status: "accepted", whatsapp: wa }
              : o.status === "pending"
                ? { ...o, status: "declined" }
                : o
          )
        );
        await onAccepted();
      } else {
        setError(data.error ?? "صار خطأ أثناء قبول العرض. حاول مرة ثانية.");
      }
    } catch {
      setError("مشكلة في الاتصال. حاول مرة ثانية.");
    } finally {
      setBusyId(null);
    }
  }

  const shownCount = offers !== null ? offers.length : count;
  const accepted = offers?.find((o) => o.status === "accepted" && o.whatsapp);

  return (
    <div
      style={{
        marginTop: "16px",
        borderTop: "1px solid var(--line)",
        paddingTop: "14px",
      }}
    >
      <button
        type="button"
        onClick={toggle}
        className="mono"
        aria-expanded={expanded}
        style={{
          border: "1px solid var(--line)",
          background: "transparent",
          color: "var(--ink-2)",
          padding: "8px 16px",
          borderRadius: "999px",
          fontSize: "11px",
          letterSpacing: "0.08em",
          cursor: "pointer",
        }}
      >
        {expanded ? "إخفاء العروض" : `شوف العروض (${shownCount})`}
      </button>

      {expanded && (
        <div style={{ marginTop: "14px", display: "grid", gap: "12px" }}>
          {loading && (
            <div
              className="mono"
              role="status"
              style={{
                fontSize: "12px",
                color: "var(--ink-3)",
                letterSpacing: "0.08em",
              }}
            >
              قاعدين نجيبو العروض…
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mono"
              style={{
                fontSize: "12px",
                color: "var(--coral)",
                letterSpacing: "0.04em",
              }}
            >
              {error}
            </div>
          )}

          {!loading && offers !== null && offers.length === 0 && (
            <div
              className="mono"
              style={{
                fontSize: "12px",
                color: "var(--ink-3)",
                letterSpacing: "0.08em",
              }}
            >
              ما فيش عروض بعد — أول ما يقدّم أسطى عرضه بيظهر هنا.
            </div>
          )}

          {accepted && accepted.whatsapp && (
            <div
              role="status"
              style={{
                padding: "20px 24px",
                borderRadius: "16px",
                border: "1px solid var(--brand-1)",
                background: "rgba(16,185,129,0.08)",
              }}
            >
              <div
                className="serif"
                style={{
                  fontSize: "18px",
                  color: "var(--ink)",
                  marginBottom: "8px",
                }}
              >
                تم! كلم الأسطى مباشرة:
              </div>
              <div
                className="serif"
                dir="ltr"
                style={{
                  fontSize: "clamp(24px, 4vw, 32px)",
                  letterSpacing: "0.02em",
                  color: "var(--ink)",
                  textAlign: "end",
                  marginBottom: "14px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {accepted.whatsapp}
              </div>
              <a
                href={`https://wa.me/218${accepted.whatsapp.slice(1)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  borderRadius: "999px",
                  background:
                    "linear-gradient(135deg, var(--brand-2), var(--brand-1))",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                افتح واتساب ←
              </a>
              {/* أو دردشة داخل المنصة — رقمك يظل مخفي (خصوصية كاملة) */}
              <div style={{ marginTop: "16px" }}>
                <ChatPanel
                  endpoint={`/api/me/jobs/${jobId}/chat`}
                  me="customer"
                />
              </div>
            </div>
          )}

          {offers?.map((o) => {
            const pill = offerPill(o.status);
            const trade = findService(o.trade);
            const busy = busyId === o.id;
            return (
              <div
                key={o.id}
                style={{
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border:
                    o.status === "accepted"
                      ? "1px solid var(--brand-1)"
                      : "1px solid var(--line)",
                  background: "var(--paper)",
                  opacity:
                    o.status === "declined" || o.status === "withdrawn"
                      ? 0.6
                      : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>
                      {o.tradesman_name}
                    </span>
                    {o.verified && (
                      <span
                        className="mono"
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background: "rgba(16,185,129,0.12)",
                          color: "var(--brand-1)",
                          fontSize: "10px",
                          letterSpacing: "0.08em",
                          fontWeight: 700,
                        }}
                      >
                        موثّق
                      </span>
                    )}
                    <OfferRatingBadge
                      avg={o.avg_rating}
                      count={o.ratings_count}
                    />
                    <span
                      className="mono"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        color: "var(--ink-3)",
                      }}
                    >
                      {trade?.name ?? o.trade} · {o.city}
                      {o.years_experience != null &&
                        ` · خبرة ${o.years_experience} سنة`}
                    </span>
                  </span>
                  <span
                    className="serif"
                    style={{ fontSize: "18px", color: "var(--ink)" }}
                  >
                    {o.price_lyd} د.ل
                  </span>
                </div>

                {o.message && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--ink-2)",
                      lineHeight: 1.55,
                      margin: "0 0 10px",
                    }}
                  >
                    {o.message}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: pill.bg,
                      color: pill.fg,
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                    }}
                  >
                    {offerStatusLabels[o.status] ?? o.status}
                  </span>
                  {o.status === "pending" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void accept(o.id)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "999px",
                        border: 0,
                        background:
                          "linear-gradient(135deg, var(--brand-2), var(--brand-1))",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 600,
                        fontFamily: "inherit",
                        cursor: busy ? "wait" : "pointer",
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      {busy ? "قاعدين نقبلو…" : "اقبل العرض"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ─── 🗺 خريطة داخل الحساب — بدون مغادرة الصفحة ────────────── */

function InlineMapCard() {
  const [open, setOpen] = useState(false);
  const [ustas, setUstas] = useState<MapUsta[] | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && ustas === null) {
      try {
        const res = await fetch("/api/ustas");
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          ustas?: MapUsta[];
          error?: string;
        };
        if (data.ok && Array.isArray(data.ustas)) {
          setUstas(data.ustas);
        } else {
          setMapError(data.error ?? "ما قدرناش نجيبو الأسطوات توّا.");
        }
      } catch {
        setMapError("مشكلة في الاتصال — حاول مرة ثانية.");
      }
    }
  }

  return (
    <section aria-label="خريطة الأسطوات" style={{ marginBottom: "48px" }}>
      <button
        type="button"
        onClick={() => void toggle()}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          padding: "22px 26px",
          borderRadius: open ? "18px 18px 0 0" : "18px",
          background: "linear-gradient(140deg, #3B7EA1, #256380)",
          color: "#fff",
          border: 0,
          cursor: "pointer",
          textAlign: "start",
          fontFamily: "inherit",
          boxShadow: "0 12px 32px -14px rgba(11,31,51,0.5)",
        }}
      >
        <span>
          <span
            className="serif"
            style={{ display: "block", fontSize: "22px", marginBottom: "4px" }}
          >
            🗺 شوف الأسطوات القريبين منك
          </span>
          <span style={{ display: "block", fontSize: "13.5px", opacity: 0.85 }}>
            كل أسطى دبّوس باسم مهنته — القريب منك يوصلك توّا.
          </span>
        </span>
        <span
          style={{
            padding: "10px 22px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.16)",
            border: "1px solid rgba(255,255,255,0.4)",
            fontSize: "14px",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {open ? "إخفاء الخريطة ▲" : "افتح الخريطة ▼"}
        </span>
      </button>
      {open ? (
        <div
          style={{
            border: "1px solid var(--line)",
            borderTop: "none",
            borderRadius: "0 0 18px 18px",
            padding: "16px",
            background: "var(--paper-2, transparent)",
          }}
        >
          {mapError ? (
            <p style={{ color: "var(--coral, #F26D5B)", fontSize: "14px", margin: 0 }}>
              {mapError}
            </p>
          ) : ustas === null ? (
            <p
              className="mono"
              style={{
                color: "var(--ink-3)",
                fontSize: "12px",
                letterSpacing: "0.1em",
                margin: 0,
                padding: "20px 0",
              }}
            >
              قاعدين نجيبو الأسطوات…
            </p>
          ) : (
            <UstaMap ustas={ustas} />
          )}
        </div>
      ) : null}
    </section>
  );
}
