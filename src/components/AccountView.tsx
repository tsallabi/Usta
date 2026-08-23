"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { findService } from "@/lib/services";

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
};

type View =
  | { kind: "loading" }
  | { kind: "ready"; me: Me; jobs: Job[]; jobsError: string | null };

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

export function AccountView() {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "loading" });

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

        let jobs: Job[] = [];
        let jobsError: string | null = null;
        try {
          const jobsRes = await fetch("/api/me/jobs");
          const data = (await jobsRes.json().catch(() => ({}))) as {
            ok?: boolean;
            jobs?: Job[];
            error?: string;
          };
          if (data.ok && Array.isArray(data.jobs)) {
            jobs = data.jobs;
          } else {
            jobsError = data.error ?? "ما قدرناش نجيبو طلباتك توّا.";
          }
        } catch {
          jobsError = "مشكلة في الاتصال. حاول بعد شوية.";
        }
        if (cancelled) return;
        setView({
          kind: "ready",
          me: { name: me.name, phone: me.phone },
          jobs,
          jobsError,
        });
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  /** بعد قبول عرض — الطلب يصير "متطابق" محلياً. */
  function markMatched(jobId: string) {
    setView((v) =>
      v.kind === "ready"
        ? {
            ...v,
            jobs: v.jobs.map((j) =>
              j.id === jobId ? { ...j, status: "matched" } : j
            ),
          }
        : v
    );
  }

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

  const { me, jobs, jobsError } = view;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "48px",
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
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--brand-2)")
          }
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

      <section aria-label="طلباتك">
        <div className="kicker" style={{ marginBottom: "20px" }}>
          — طلباتك
        </div>

        {jobsError && (
          <div
            role="alert"
            className="mono"
            style={{
              fontSize: "12px",
              color: "var(--coral)",
              letterSpacing: "0.04em",
              marginBottom: "20px",
            }}
          >
            {jobsError}
          </div>
        )}

        {!jobsError && jobs.length === 0 && (
          <div
            style={{
              padding: "32px 28px",
              border: "1px dashed var(--line)",
              borderRadius: "16px",
              background: "var(--paper-2)",
              maxWidth: "560px",
            }}
          >
            <div
              className="serif"
              style={{
                fontSize: "22px",
                color: "var(--ink)",
                lineHeight: 1.35,
                marginBottom: "8px",
              }}
            >
              ما عندكش طلبات بعد.
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "var(--ink-2)",
                lineHeight: 1.55,
                margin: "0 0 18px",
              }}
            >
              ابدأ بتقدير سعر عادل من الذكاء الاصطناعي — 30 ثانية وبدون أي
              التزام.
            </p>
            <Link
              href="/estimate"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                borderRadius: "999px",
                background:
                  "linear-gradient(135deg, var(--navy-2), var(--navy-1))",
                color: "var(--paper)",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              اطلب تقدير سعر ←
            </Link>
          </div>
        )}

        <div style={{ display: "grid", gap: "16px", maxWidth: "640px" }}>
          {jobs.map((job) => {
            const service = findService(job.service);
            const description =
              job.description.length > 140
                ? `${job.description.slice(0, 140)}…`
                : job.description;
            return (
              <article
                key={job.id}
                style={{
                  padding: "20px 24px",
                  border: "1px solid var(--line)",
                  borderRadius: "16px",
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
                    marginBottom: "10px",
                  }}
                >
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
                  <span
                    className="mono"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      color: statusColor(job.status),
                      border: `1px solid ${statusColor(job.status)}`,
                      borderRadius: "999px",
                      padding: "4px 12px",
                    }}
                  >
                    {statusLabels[job.status] ?? job.status}
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
                  <span
                    className="serif"
                    style={{ fontSize: "16px", color: "var(--ink)" }}
                  >
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
                {(job.status === "open" || job.status === "matched") && (
                  <JobOffers
                    jobId={job.id}
                    count={job.offers_count ?? 0}
                    onAccepted={() => markMatched(job.id)}
                  />
                )}
              </article>
            );
          })}
        </div>
      </section>
    </>
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
  onAccepted: () => void;
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
        onAccepted();
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
  const accepted = offers?.find(
    (o) => o.status === "accepted" && o.whatsapp
  );

  return (
    <div
      style={{ marginTop: "16px", borderTop: "1px solid var(--line)", paddingTop: "14px" }}
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
        {expanded ? "إخفاء العروض" : `عرض العروض (${shownCount})`}
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
                      {busy ? "قاعد يقبل…" : "اقبل العرض"}
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
