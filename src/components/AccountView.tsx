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
};

type View =
  | { kind: "loading" }
  | { kind: "ready"; me: Me; jobs: Job[]; jobsError: string | null };

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  open: "مفتوح",
  matched: "تمت المطابقة",
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
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
