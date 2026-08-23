"use client";

import { useCallback, useEffect, useState } from "react";

/* ─── Types mirroring the admin APIs ─────────────────────── */

type Job = {
  id: string;
  customer_phone: string;
  customer_email: string | null;
  service: string;
  description: string;
  budget_lyd: number | null;
  city: string | null;
  area: string | null;
  status: string;
  created_at: string;
  est_min: number | null;
  est_max: number | null;
};

type Tradesman = {
  id: string;
  whatsapp: string;
  email: string | null;
  full_name: string;
  trade: string;
  city: string;
  service_area: string;
  national_id: string;
  years_experience: number | null;
  previous_work: string | null;
  verified_at: string | null;
  suspended_at: string | null;
  created_at: string;
  avg_rating: number | null;
  ratings_count: number;
};

type WaitlistEntry = {
  phone: string;
  email: string | null;
  audience: string;
  added_at: string | null;
};

type Offer = {
  id: string;
  created_at: string;
  price_lyd: number;
  status: string;
  message: string | null;
  tradesman_id: string;
  tradesman_name: string | null;
  tradesman_trade: string | null;
  job_service: string | null;
  job_city: string | null;
  customer_phone: string | null;
};

type Tab = "jobs" | "tradesmen" | "waitlist" | "offers";

const KEY_STORAGE = "usta_admin_key";

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  open: "مفتوح",
  matched: "تم الاختيار",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  disputed: "متنازع عليه",
};

const offerStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  accepted: "مقبول",
  countered: "عرض مضاد",
  declined: "مرفوض",
  withdrawn: "مسحوب",
};

function offerStatusTone(
  status: string
): "emerald" | "amber" | "coral" | "grey" {
  if (status === "accepted") return "emerald";
  if (status === "pending" || status === "countered") return "amber";
  return "grey"; // declined / withdrawn / anything unknown
}

/* ─── Console ────────────────────────────────────────────── */

export function AdminConsole() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [tab, setTab] = useState<Tab>("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tradesmen, setTradesmen] = useState<Tradesman[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [dbBound, setDbBound] = useState(true);
  const [kvBound, setKvBound] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const authedFetch = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(path, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${key || sessionStorage.getItem(KEY_STORAGE) || ""}`,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
        },
      }),
    [key]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [jr, tr, wr, or] = await Promise.all([
        authedFetch("/api/admin/jobs"),
        authedFetch("/api/admin/tradesmen"),
        authedFetch("/api/admin/waitlist"),
        authedFetch("/api/admin/offers"),
      ]);
      if (jr.ok) {
        const data = (await jr.json()) as {
          jobs: Job[];
          dbBound?: boolean;
        };
        setJobs(data.jobs ?? []);
        if (data.dbBound === false) setDbBound(false);
      }
      if (tr.ok) {
        const data = (await tr.json()) as { tradesmen: Tradesman[] };
        setTradesmen(data.tradesmen ?? []);
      }
      if (wr.ok) {
        const data = (await wr.json()) as {
          entries: WaitlistEntry[];
          kvBound?: boolean;
        };
        setWaitlist(data.entries ?? []);
        if (data.kvBound === false) setKvBound(false);
      }
      if (or.ok) {
        const data = (await or.json()) as { offers: Offer[] };
        setOffers(data.offers ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  // Try a stored key on mount.
  useEffect(() => {
    const stored = sessionStorage.getItem(KEY_STORAGE);
    if (stored) {
      setKey(stored);
      void (async () => {
        const res = await fetch("/api/admin/jobs", {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (res.ok) {
          setAuthed(true);
        } else {
          sessionStorage.removeItem(KEY_STORAGE);
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (authed) void loadAll();
  }, [authed, loadAll]);

  async function signIn() {
    setChecking(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/jobs", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        sessionStorage.setItem(KEY_STORAGE, key);
        setAuthed(true);
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setAuthError(data.error ?? `فشل تسجيل الدخول (${res.status}).`);
      }
    } catch {
      setAuthError("مشكلة في الاتصال. حاول مرة ثانية.");
    } finally {
      setChecking(false);
    }
  }

  async function tradesmanAction(id: string, action: string) {
    setActionBusy(id);
    try {
      const res = await authedFetch(`/api/admin/tradesmen/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      if (res.ok) await loadAll();
    } finally {
      setActionBusy(null);
    }
  }

  /* ─── Sign-in gate ─────────────────────────────────────── */
  if (!authed) {
    return (
      <div style={{ maxWidth: "420px" }}>
        <div className="kicker" style={{ marginBottom: "12px" }}>
          مقيّد · دخول المؤسس فقط
        </div>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(32px, 4.4vw, 48px)",
            letterSpacing: "-0.025em",
            fontWeight: 400,
            margin: "0 0 12px",
            lineHeight: 1.3,
          }}
        >
          لوحة الإدارة.
        </h1>
        <p style={{ color: "var(--ink-2)", fontSize: "15px", margin: "0 0 24px" }}>
          أدخل مفتاح الأدمن المضبوط في Cloudflare Pages.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void signIn();
          }}
          style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
        >
          <label
            htmlFor="admin-key"
            style={{ position: "absolute", insetInlineStart: "-9999px" }}
          >
            مفتاح الأدمن
          </label>
          <input
            id="admin-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="مفتاح الأدمن"
            autoComplete="current-password"
            dir="ltr"
            style={{
              flex: "1 1 220px",
              padding: "14px 18px",
              borderRadius: "999px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "15px",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={checking || key.length < 4}
            style={{
              padding: "14px 24px",
              borderRadius: "999px",
              border: 0,
              background: "linear-gradient(135deg, var(--navy-2), var(--navy-1))",
              color: "var(--paper)",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: checking ? "wait" : "pointer",
            }}
          >
            {checking ? "قاعدين نتأكدو…" : "دخول"}
          </button>
        </form>
        {authError && (
          <p
            role="alert"
            className="mono"
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "var(--coral)",
              letterSpacing: "0.04em",
            }}
          >
            {authError}
          </p>
        )}
      </div>
    );
  }

  /* ─── Authed console ───────────────────────────────────── */
  const pendingVerification = tradesmen.filter(
    (t) => !t.verified_at && !t.suspended_at
  ).length;
  const openJobs = jobs.filter((j) => j.status === "open").length;

  // عروض اليوم — محسوبة محلياً من آخر 200 عرض (تواريخ D1 بتوقيت UTC).
  const today = new Date().toISOString().slice(0, 10);
  const offersToday = offers.filter((o) =>
    o.created_at.startsWith(today)
  ).length;

  // نسبة القبول = مقبول / (مقبول + مرفوض) — شرطة لما ما فيش قرارات بعد.
  const acceptedOffers = offers.filter((o) => o.status === "accepted").length;
  const declinedOffers = offers.filter((o) => o.status === "declined").length;
  const decidedOffers = acceptedOffers + declinedOffers;
  const acceptanceRate =
    decidedOffers === 0
      ? "—"
      : `${Math.round((acceptedOffers / decidedOffers) * 100)}%`;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        <h1
          className="serif"
          style={{
            fontSize: "clamp(30px, 4vw, 44px)",
            letterSpacing: "-0.025em",
            fontWeight: 400,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          عمليات.
        </h1>
        <button
          type="button"
          onClick={() => void loadAll()}
          className="mono"
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
          {loading ? "جارٍ التحديث…" : "↻ تحديث"}
        </button>
      </div>

      {(!dbBound || !kvBound) && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "14px",
            border: "1.5px dashed var(--amber)",
            background: "color-mix(in srgb, var(--amber) 8%, transparent)",
            marginBottom: "24px",
            fontSize: "13px",
            color: "var(--ink-2)",
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: "var(--ink)" }}>روابط ناقصة:</strong>{" "}
          {!dbBound && "قاعدة بيانات D1 ‏(DB) غير مربوطة — الطلبات والأسطوات ما يتحفظوش. "}
          {!kvBound && "مخزن قائمة الانتظار KV ‏(WAITLIST) غير مربوط."}
        </div>
      )}

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <Kpi label="الطلبات" value={jobs.length} />
        <Kpi label="طلبات مفتوحة" value={openJobs} accent="emerald" />
        <Kpi label="الأسطوات" value={tradesmen.length} />
        <Kpi
          label="بانتظار التوثيق"
          value={pendingVerification}
          accent={pendingVerification > 0 ? "amber" : undefined}
        />
        <Kpi label="قائمة الانتظار" value={waitlist.length} />
        <Kpi
          label="عروض اليوم"
          value={offersToday}
          accent={offersToday > 0 ? "emerald" : undefined}
        />
        <Kpi label="نسبة القبول" value={acceptanceRate} />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {(
          [
            ["jobs", `الطلبات (${jobs.length})`],
            ["tradesmen", `الأسطوات (${tradesmen.length})`],
            ["waitlist", `قائمة الانتظار (${waitlist.length})`],
            ["offers", `العروض (${offers.length})`],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "10px 18px",
              borderRadius: "999px",
              border: tab === t ? 0 : "1px solid var(--line)",
              background:
                tab === t
                  ? "linear-gradient(135deg, var(--navy-2), var(--navy-1))"
                  : "transparent",
              color: tab === t ? "var(--paper)" : "var(--ink-2)",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "jobs" && <JobsTable jobs={jobs} />}
      {tab === "tradesmen" && (
        <TradesmenTable
          tradesmen={tradesmen}
          busyId={actionBusy}
          onAction={tradesmanAction}
        />
      )}
      {tab === "waitlist" && <WaitlistTable entries={waitlist} />}
      {tab === "offers" && <OffersTable offers={offers} />}
    </div>
  );
}

/* ─── Pieces ─────────────────────────────────────────────── */

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "emerald" | "amber";
}) {
  const color =
    accent === "emerald"
      ? "var(--brand-1)"
      : accent === "amber"
        ? "var(--amber)"
        : "var(--ink)";
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: "16px",
        border: "1px solid var(--line)",
        background: "var(--paper-2)",
      }}
    >
      <div
        className="serif"
        style={{
          fontSize: "32px",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        className="mono"
        style={{
          marginTop: "6px",
          fontSize: "9px",
          letterSpacing: "0.14em",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

const tableWrap: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid var(--line)",
  borderRadius: "16px",
  background: "var(--paper)",
};
const th: React.CSSProperties = {
  textAlign: "start",
  padding: "12px 14px",
  fontSize: "9px",
  letterSpacing: "0.14em",
  color: "var(--ink-3)",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--line)",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: "13px",
  color: "var(--ink)",
  borderBottom: "1px solid var(--line)",
  verticalAlign: "top",
};

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "emerald" | "amber" | "coral" | "grey";
}) {
  const tones = {
    emerald: { bg: "rgba(16,185,129,0.12)", fg: "var(--brand-1)" },
    amber: { bg: "rgba(230,164,41,0.14)", fg: "var(--amber)" },
    coral: { bg: "rgba(242,109,91,0.14)", fg: "var(--coral)" },
    grey: { bg: "rgba(122,135,154,0.14)", fg: "var(--ink-3)" },
  } as const;
  const t = tones[tone];
  return (
    <span
      className="mono"
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        background: t.bg,
        color: t.fg,
        fontSize: "10px",
        letterSpacing: "0.08em",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 16).replace("T", " ");
}

function JobsTable({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return <Empty note="لا توجد طلبات بعد. بتظهر هنا أول ما ينشر أي حد طلب." />;
  }
  return (
    <div style={tableWrap}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "860px" }}>
        <thead className="mono">
          <tr>
            <th style={th}>التاريخ</th>
            <th style={th}>الخدمة</th>
            <th style={th}>العميل</th>
            <th style={th}>الوصف</th>
            <th style={{ ...th, textAlign: "end" }}>الميزانية</th>
            <th style={{ ...th, textAlign: "end" }}>نطاق الذكاء الاصطناعي</th>
            <th style={th}>المدينة</th>
            <th style={th}>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td style={{ ...td, whiteSpace: "nowrap" }} className="mono">
                {fmtDate(j.created_at)}
              </td>
              <td style={td}>{j.service}</td>
              <td style={td}>
                <span className="mono" dir="ltr">
                  {j.customer_phone}
                </span>
                {j.customer_email && (
                  <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                    {j.customer_email}
                  </div>
                )}
              </td>
              <td style={{ ...td, maxWidth: "320px" }}>
                {j.description.length > 120
                  ? `${j.description.slice(0, 120)}…`
                  : j.description}
              </td>
              <td style={{ ...td, textAlign: "end" }} className="serif">
                {j.budget_lyd != null ? `${j.budget_lyd} د.ل` : "—"}
              </td>
              <td style={{ ...td, textAlign: "end" }} className="serif">
                {j.est_min != null && j.est_max != null
                  ? `${j.est_min}–${j.est_max} د.ل`
                  : "—"}
              </td>
              <td style={td}>
                {j.city ?? "—"}
                {j.area && (
                  <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                    {j.area}
                  </div>
                )}
              </td>
              <td style={td}>
                <Pill
                  tone={
                    j.status === "open"
                      ? "emerald"
                      : j.status === "completed"
                        ? "grey"
                        : j.status === "disputed" || j.status === "cancelled"
                          ? "coral"
                          : "amber"
                  }
                >
                  {statusLabels[j.status] ?? j.status}
                </Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TradesmenTable({
  tradesmen,
  busyId,
  onAction,
}: {
  tradesmen: Tradesman[];
  busyId: string | null;
  onAction: (id: string, action: string) => void;
}) {
  if (tradesmen.length === 0) {
    return <Empty note="لا توجد طلبات انضمام أسطوات بعد." />;
  }
  return (
    <div style={tableWrap}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "980px" }}>
        <thead className="mono">
          <tr>
            <th style={th}>التاريخ</th>
            <th style={th}>الاسم</th>
            <th style={th}>المهنة</th>
            <th style={th}>المدينة</th>
            <th style={th}>التقييم</th>
            <th style={th}>مناطق الشغل</th>
            <th style={th}>التوثيق</th>
            <th style={th}>الحالة</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {tradesmen.map((t) => {
            const creds: string[] = [`هوية ${t.national_id}`];
            if (t.years_experience != null)
              creds.push(`خبرة ${t.years_experience} سنة`);
            const busy = busyId === t.id;
            return (
              <tr key={t.id}>
                <td style={{ ...td, whiteSpace: "nowrap" }} className="mono">
                  {fmtDate(t.created_at)}
                </td>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>
                    {t.verified_at && !t.suspended_at ? (
                      <a
                        href={`/usta/${t.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "var(--ink)",
                          textDecorationColor: "var(--brand-1)",
                          textUnderlineOffset: "3px",
                        }}
                        title="افتح البروفايل العام"
                      >
                        {t.full_name} ↗
                      </a>
                    ) : (
                      t.full_name
                    )}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: "11px", color: "var(--ink-3)" }}
                    dir="ltr"
                  >
                    {t.whatsapp}
                  </div>
                  {t.email && (
                    <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                      {t.email}
                    </div>
                  )}
                </td>
                <td style={td}>{t.trade}</td>
                <td style={td}>{t.city}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {t.avg_rating != null ? (
                    <>
                      <span
                        className="serif"
                        style={{
                          color: "var(--amber)",
                          fontSize: "15px",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ★ {t.avg_rating}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: "10px",
                          color: "var(--ink-3)",
                          marginInlineStart: "4px",
                        }}
                      >
                        ({t.ratings_count})
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ ...td, maxWidth: "160px" }}>{t.service_area}</td>
                <td style={{ ...td, maxWidth: "220px" }}>
                  <span
                    className="mono"
                    style={{ fontSize: "11px", lineHeight: 1.6 }}
                  >
                    {creds.join(" · ")}
                  </span>
                  {t.previous_work && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--ink-3)",
                        marginTop: "4px",
                      }}
                    >
                      {t.previous_work.length > 80
                        ? `${t.previous_work.slice(0, 80)}…`
                        : t.previous_work}
                    </div>
                  )}
                </td>
                <td style={td}>
                  {t.suspended_at ? (
                    <Pill tone="coral">موقوف</Pill>
                  ) : t.verified_at ? (
                    <Pill tone="emerald">موثّق</Pill>
                  ) : (
                    <Pill tone="amber">معلّق</Pill>
                  )}
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {t.suspended_at ? (
                    <ActionBtn
                      label="إلغاء الإيقاف"
                      busy={busy}
                      onClick={() => onAction(t.id, "unsuspend")}
                    />
                  ) : t.verified_at ? (
                    <ActionBtn
                      label="إيقاف"
                      tone="coral"
                      busy={busy}
                      onClick={() => onAction(t.id, "suspend")}
                    />
                  ) : (
                    <ActionBtn
                      label="✓ توثيق"
                      tone="emerald"
                      busy={busy}
                      onClick={() => onAction(t.id, "verify")}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActionBtn({
  label,
  tone,
  busy,
  onClick,
}: {
  label: string;
  tone?: "emerald" | "coral";
  busy: boolean;
  onClick: () => void;
}) {
  const bg =
    tone === "emerald"
      ? "linear-gradient(135deg, var(--brand-2), var(--brand-1))"
      : tone === "coral"
        ? "var(--coral)"
        : "var(--paper-2)";
  const fg = tone ? "white" : "var(--ink-2)";
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: "999px",
        border: tone ? 0 : "1px solid var(--line)",
        background: bg,
        color: fg,
        fontSize: "12px",
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? "…" : label}
    </button>
  );
}

function WaitlistTable({ entries }: { entries: WaitlistEntry[] }) {
  if (entries.length === 0) {
    return <Empty note="قائمة الانتظار فارغة (أو رابط KV غير مربوط)." />;
  }
  return (
    <div style={tableWrap}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "560px" }}>
        <thead className="mono">
          <tr>
            <th style={th}>رقم الهاتف</th>
            <th style={th}>البريد الإلكتروني</th>
            <th style={th}>الفئة</th>
            <th style={th}>تاريخ الإضافة</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((w) => (
            <tr key={w.phone}>
              <td style={td} className="mono" dir="ltr">
                {w.phone}
              </td>
              <td style={td}>{w.email ?? "—"}</td>
              <td style={td}>
                <Pill tone={w.audience === "tradesman" ? "amber" : "emerald"}>
                  {w.audience === "tradesman" ? "أسطى" : "زبون"}
                </Pill>
              </td>
              <td style={{ ...td, whiteSpace: "nowrap" }} className="mono">
                {fmtDate(w.added_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OffersTable({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) {
    return (
      <Empty note="لا توجد عروض بعد. بتظهر هنا أول ما يقدّم أسطى عرضاً على طلب." />
    );
  }
  return (
    <div style={tableWrap}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "860px" }}>
        <thead className="mono">
          <tr>
            <th style={th}>التاريخ</th>
            <th style={th}>الأسطى</th>
            <th style={{ ...th, textAlign: "end" }}>السعر</th>
            <th style={th}>الحالة</th>
            <th style={th}>الطلب</th>
            <th style={th}>الرسالة</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o) => (
            <tr key={o.id}>
              <td style={{ ...td, whiteSpace: "nowrap" }} className="mono">
                {fmtDate(o.created_at)}
              </td>
              <td style={td}>
                <div style={{ fontWeight: 600 }}>
                  {o.tradesman_name ?? "—"}
                </div>
                {o.tradesman_trade && (
                  <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                    {o.tradesman_trade}
                  </div>
                )}
              </td>
              <td style={{ ...td, textAlign: "end" }} className="serif">
                {o.price_lyd} د.ل
              </td>
              <td style={td}>
                <Pill tone={offerStatusTone(o.status)}>
                  {offerStatusLabels[o.status] ?? o.status}
                </Pill>
              </td>
              <td style={td}>
                {o.job_service ?? "—"}
                <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                  {o.job_city ?? "—"}
                  {o.customer_phone && (
                    <>
                      {" · "}
                      <span className="mono" dir="ltr">
                        {o.customer_phone}
                      </span>
                    </>
                  )}
                </div>
              </td>
              <td style={{ ...td, maxWidth: "260px" }}>
                {o.message
                  ? o.message.length > 80
                    ? `${o.message.slice(0, 80)}…`
                    : o.message
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ note }: { note: string }) {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        border: "1.5px dashed var(--line)",
        borderRadius: "16px",
        color: "var(--ink-3)",
        fontSize: "14px",
      }}
    >
      {note}
    </div>
  );
}
