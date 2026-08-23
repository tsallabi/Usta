"use client";

/**
 * كونسول المالك — أعلى صلاحية في المنصة (فوق الأدمن).
 *
 * ثمانية أقسام:
 *   نظرة عامة · الحسابات · الطلبات · العروض · التقييمات · النمو ·
 *   الأرباح · النظام
 *
 * أهم قدرتين حصريتين للمالك: الدخول بجلسة أي حساب (زر «ادخل بحسابه»)
 * وأرقام الأرباح. المفتاح OWNER_KEY يُحفظ في sessionStorage.
 */

import { useCallback, useEffect, useState } from "react";
import { findService } from "@/lib/services";

const KEY_STORAGE = "usta_owner_key";

/* ─── أنواع البيانات (مرايا للـ APIs) ─────────────────── */

type UserRow = {
  id: string;
  phone: string;
  full_name: string;
  created_at: string;
  last_login_at: string | null;
  jobs_count: number;
};

type TradesmanRow = {
  id: string;
  whatsapp: string;
  full_name: string;
  trade: string;
  city: string;
  verified_at: string | null;
  suspended_at: string | null;
  featured_at: string | null;
  created_at: string;
  accepted_count: number;
};

type DueRow = {
  tradesmanId: string;
  name: string;
  whatsapp: string;
  trade: string;
  realized: number;
  commission: number;
  paid: number;
  due: number;
};

type Profits = {
  jobs: {
    total: number;
    open: number;
    matched: number;
    completed: number;
    last30d: number;
  };
  offers: { total: number; accepted: number };
  gmv: { accepted: number; accepted30d: number; realized: number };
  people: { users: number; tradesmen: number; tradesmenVerified: number };
  services: {
    service: string;
    jobs_count: number;
    accepted_value: number | null;
    completed_value: number | null;
  }[];
};

type JobRow = {
  id: string;
  service: string;
  city: string | null;
  status: string;
  customer_phone: string;
  created_at: string;
  est_min: number | null;
  est_max: number | null;
  offers_count: number;
  accepted_price: number | null;
};

type OfferRow = {
  id: string;
  price_lyd: number;
  status: string;
  created_at: string;
  tradesman_name: string | null;
  trade: string | null;
  service: string | null;
  city: string | null;
};

type RatingRow = {
  id: string;
  created_at: string;
  written_review: string | null;
  punctuality: number | null;
  quality: number | null;
  price_adherence: number | null;
  professionalism: number | null;
  communication: number | null;
  service: string;
  tradesman_name: string | null;
};

type DayRow = { d: string; n: number };

type Dashboard = {
  commissionPct?: number;
  health: Record<string, boolean>;
  waitlist: {
    phone: string;
    email: string | null;
    audience: string;
    added_at: string | null;
  }[];
  jobs: JobRow[];
  offers: OfferRow[];
  ratings: RatingRow[];
  growth: { jobs: DayRow[]; users: DayRow[]; acceptedOffers: DayRow[] };
  cities: { city: string | null; n: number }[];
};

type Tab =
  | "overview"
  | "accounts"
  | "jobs"
  | "offers"
  | "ratings"
  | "growth"
  | "profits"
  | "system";

const jobStatusLabels: Record<string, string> = {
  draft: "مسودة",
  open: "مفتوح",
  matched: "تم الاختيار",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل ✓",
  cancelled: "ملغي",
  disputed: "متنازع",
};

const offerStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  accepted: "مقبول ✓",
  countered: "عرض مضاد",
  declined: "مرفوض",
  withdrawn: "مسحوب",
};

const healthLabels: Record<string, string> = {
  db: "قاعدة البيانات D1",
  waitlistKv: "قائمة الانتظار KV",
  gemini: "الذكاء الاصطناعي — Gemini",
  claude: "الذكاء الاصطناعي — Claude (احتياطي)",
  authSecret: "سر الجلسات AUTH_SECRET",
  adminKey: "مفتاح الأدمن ADMIN_KEY",
  ownerKey: "مفتاح المالك OWNER_KEY",
  resend: "البريد Resend (اختياري)",
};

export function OwnerConsole() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tradesmen, setTradesmen] = useState<TradesmanRow[]>([]);
  const [profits, setProfits] = useState<Profits | null>(null);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [dues, setDues] = useState<DueRow[]>([]);
  const [settlementsReady, setSettlementsReady] = useState(true);
  const [dbBound, setDbBound] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busyPhone, setBusyPhone] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
    setActionError(null);
    try {
      const [accountsRes, profitsRes, dashRes, duesRes] = await Promise.all([
        authedFetch("/api/owner/accounts"),
        authedFetch("/api/owner/profits"),
        authedFetch("/api/owner/dashboard"),
        authedFetch("/api/owner/settlements"),
      ]);
      const accounts = (await accountsRes.json()) as {
        ok: boolean;
        dbBound?: boolean;
        users?: UserRow[];
        tradesmen?: TradesmanRow[];
      };
      const prof = (await profitsRes.json()) as Profits & {
        ok: boolean;
        dbBound?: boolean;
      };
      const d = (await dashRes.json()) as Dashboard & {
        ok: boolean;
        dbBound?: boolean;
      };
      if (accounts.ok) {
        setUsers(accounts.users ?? []);
        setTradesmen(accounts.tradesmen ?? []);
        setDbBound(accounts.dbBound !== false);
      }
      if (prof.ok && prof.dbBound !== false) setProfits(prof);
      if (d.ok) setDash(d);
      const duesData = (await duesRes.json()) as {
        ok: boolean;
        rows?: DueRow[];
        settlementsReady?: boolean;
      };
      if (duesData.ok) {
        setDues(duesData.rows ?? []);
        setSettlementsReady(duesData.settlementsReady !== false);
      }
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY_STORAGE);
    if (saved) {
      setKey(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) void loadAll();
  }, [authed, loadAll]);

  async function tryLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setChecking(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/owner/profits", {
        headers: { Authorization: `Bearer ${key.trim()}` },
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (res.ok && data.ok !== false) {
        sessionStorage.setItem(KEY_STORAGE, key.trim());
        setAuthed(true);
      } else {
        setAuthError(data.error ?? "مفتاح المالك غير صحيح.");
      }
    } catch {
      setAuthError("تعذّر الاتصال — جرّب مرة ثانية.");
    } finally {
      setChecking(false);
    }
  }

  async function tradesmanAction(id: string, action: string) {
    setBusyAction(`${id}:${action}`);
    setActionError(null);
    try {
      const res = await authedFetch(`/api/owner/tradesmen/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionError(data.error ?? "فشل التحديث.");
      } else {
        await loadAll();
      }
    } catch {
      setActionError("تعذّر الاتصال — جرّب مرة ثانية.");
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteTradesman(id: string, name: string) {
    if (
      !window.confirm(
        `حذف «${name}» نهائياً؟ عروضه كلها بتنحذف معاه — القرار ما يترجعش.`
      )
    )
      return;
    setBusyAction(`${id}:delete`);
    setActionError(null);
    try {
      const res = await authedFetch(`/api/owner/tradesmen/${id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionError(data.error ?? "فشل الحذف.");
      } else {
        await loadAll();
      }
    } catch {
      setActionError("تعذّر الاتصال — جرّب مرة ثانية.");
    } finally {
      setBusyAction(null);
    }
  }

  async function recordSettlement(row: DueRow) {
    const raw = window.prompt(
      `سجّل دفعة عمولة من ${row.name}\nالمستحق عليه: ${row.due} د.ل\n\nأدخل المبلغ المستلم بالدينار:`,
      String(row.due || "")
    );
    if (!raw) return;
    const amount = Math.round(Number(raw));
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("أدخل مبلغاً صحيحاً بالدينار.");
      return;
    }
    setBusyAction(`${row.tradesmanId}:settle`);
    setActionError(null);
    try {
      const res = await authedFetch("/api/owner/settlements", {
        method: "POST",
        body: JSON.stringify({ tradesmanId: row.tradesmanId, amountLyd: amount }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionError(data.error ?? "فشل تسجيل الدفعة.");
      } else {
        await loadAll();
      }
    } catch {
      setActionError("تعذّر الاتصال — جرّب مرة ثانية.");
    } finally {
      setBusyAction(null);
    }
  }

  async function impersonate(phone: string, landing: "/account" | "/work") {
    setBusyPhone(phone);
    setActionError(null);
    try {
      const res = await authedFetch("/api/owner/impersonate", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (res.ok && data.ok) {
        window.location.href = landing;
      } else {
        setActionError(data.error ?? "تعذّر الدخول بالحساب.");
        setBusyPhone(null);
      }
    } catch {
      setActionError("تعذّر الاتصال — جرّب مرة ثانية.");
      setBusyPhone(null);
    }
  }

  /* ─── بوابة المفتاح ─────────────────────────────────── */
  if (!authed) {
    return (
      <div style={{ maxWidth: "420px" }}>
        <div className="kicker" style={{ marginBottom: "16px" }}>
          — للمالك فقط
        </div>
        <h1
          className="serif"
          style={{ fontSize: "34px", lineHeight: 1.3, margin: "0 0 12px" }}
        >
          كونسول المالك.
        </h1>
        <p
          style={{
            color: "var(--ink-2)",
            fontSize: "15px",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          مستوى أعلى من الأدمن: الدخول بأي حساب لفحصه، وأرقام الأرباح.
          المفتاح ما يتشاركش مع أي موظف.
        </p>
        <form onSubmit={tryLogin}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="مفتاح المالك"
            autoComplete="off"
            style={inputStyle}
            aria-label="مفتاح المالك"
          />
          {authError ? (
            <p style={{ color: "var(--coral, #F26D5B)", fontSize: "13px" }}>
              {authError}
            </p>
          ) : null}
          <button type="submit" disabled={checking} style={primaryBtn}>
            {checking ? "جاري التحقق…" : "دخول"}
          </button>
        </form>
      </div>
    );
  }

  /* ─── الكونسول ──────────────────────────────────────── */
  const q = search.trim();
  const filteredUsers = q
    ? users.filter((u) => u.full_name.includes(q) || u.phone.includes(q))
    : users;
  const filteredTradesmen = q
    ? tradesmen.filter(
        (t) =>
          t.full_name.includes(q) ||
          t.whatsapp.includes(q) ||
          t.trade.includes(q)
      )
    : tradesmen;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "نظرة عامة" },
    { id: "accounts", label: `الحسابات (${users.length + tradesmen.length})` },
    { id: "jobs", label: `الطلبات (${dash?.jobs.length ?? 0})` },
    { id: "offers", label: `العروض (${dash?.offers.length ?? 0})` },
    { id: "ratings", label: `التقييمات (${dash?.ratings.length ?? 0})` },
    { id: "growth", label: "النمو" },
    { id: "profits", label: "الأرباح" },
    { id: "system", label: "النظام" },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <TabButton
              key={t.id}
              active={tab === t.id}
              onClick={() => setTab(t.id)}
              label={t.label}
            />
          ))}
        </div>
        <button
          onClick={() => void loadAll()}
          disabled={loading}
          style={ghostBtn}
        >
          {loading ? "جاري التحديث…" : "↺ تحديث"}
        </button>
      </div>

      {!dbBound ? (
        <Note text="قاعدة البيانات غير مربوطة — البيانات بتظهر بعد ربط D1." />
      ) : null}
      {actionError ? <Note text={actionError} tone="coral" /> : null}

      {tab === "overview" ? (
        <OverviewView
          profits={profits}
          dash={dash}
          usersCount={users.length}
          tradesmen={tradesmen}
        />
      ) : null}

      {tab === "accounts" ? (
        <>
          <Note text="زر «ادخل بحسابه» يفتح المنصة بجلسة صاحب الحساب — تتصفح وتجرّب بعينه. للرجوع: سجّل خروج من حسابه وارجع لهذي الصفحة." />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الرقم أو المهنة…"
            style={{ ...inputStyle, marginBottom: "24px" }}
            aria-label="بحث في الحسابات"
          />

          <SectionTitle label={`الزبائن — ${filteredUsers.length}`} />
          {filteredUsers.length === 0 ? (
            <Empty note="ما فيش حسابات زبائن بعد." />
          ) : (
            <div style={{ overflowX: "auto", marginBottom: "36px" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={th}>الاسم</th>
                    <th style={th}>الهاتف</th>
                    <th style={th}>طلباته</th>
                    <th style={th}>آخر دخول</th>
                    <th style={th}>دخول</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={td}>{u.full_name}</td>
                      <td style={{ ...td, direction: "ltr" }} className="mono">
                        {u.phone}
                      </td>
                      <td style={td} className="serif">
                        {u.jobs_count}
                      </td>
                      <td style={td}>{u.last_login_at?.slice(0, 10) ?? "—"}</td>
                      <td style={td}>
                        <button
                          onClick={() => void impersonate(u.phone, "/account")}
                          disabled={busyPhone !== null}
                          style={smallBtn}
                        >
                          {busyPhone === u.phone ? "…" : "ادخل كزبون ←"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <SectionTitle label={`الأسطوات — ${filteredTradesmen.length}`} />
          {filteredTradesmen.length === 0 ? (
            <Empty note="ما فيش أسطوات مسجّلين بعد." />
          ) : (
            <div style={{ overflowX: "auto", marginBottom: "36px" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={th}>الاسم</th>
                    <th style={th}>المهنة</th>
                    <th style={th}>المدينة</th>
                    <th style={th}>الواتساب</th>
                    <th style={th}>الحالة</th>
                    <th style={th}>شغلات</th>
                    <th style={th}>إدارة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTradesmen.map((t) => {
                    const busy = busyAction?.startsWith(`${t.id}:`) ?? false;
                    return (
                      <tr key={t.id}>
                        <td style={td}>
                          {t.featured_at ? "⭐ " : ""}
                          {t.full_name}
                        </td>
                        <td style={td}>
                          {findService(t.trade)?.name ?? t.trade}
                        </td>
                        <td style={td}>{t.city}</td>
                        <td
                          style={{ ...td, direction: "ltr" }}
                          className="mono"
                        >
                          {t.whatsapp}
                        </td>
                        <td style={td}>
                          {t.suspended_at
                            ? "موقوف"
                            : t.verified_at
                              ? "موثّق ✓"
                              : "قيد المراجعة"}
                        </td>
                        <td style={td} className="serif">
                          {t.accepted_count}
                        </td>
                        <td style={td}>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              onClick={() =>
                                void impersonate(t.whatsapp, "/work")
                              }
                              disabled={busyPhone !== null || busy}
                              style={smallBtn}
                            >
                              {busyPhone === t.whatsapp ? "…" : "ادخل ←"}
                            </button>
                            {t.verified_at ? (
                              <button
                                onClick={() =>
                                  void tradesmanAction(t.id, "unverify")
                                }
                                disabled={busy}
                                style={smallBtn}
                              >
                                إلغاء التوثيق
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  void tradesmanAction(t.id, "verify")
                                }
                                disabled={busy}
                                style={smallBtn}
                              >
                                ✓ وثّق
                              </button>
                            )}
                            {t.suspended_at ? (
                              <button
                                onClick={() =>
                                  void tradesmanAction(t.id, "unsuspend")
                                }
                                disabled={busy}
                                style={smallBtn}
                              >
                                فعّل
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  void tradesmanAction(t.id, "suspend")
                                }
                                disabled={busy}
                                style={warnBtn}
                              >
                                أوقف
                              </button>
                            )}
                            {t.featured_at ? (
                              <button
                                onClick={() =>
                                  void tradesmanAction(t.id, "unfeature")
                                }
                                disabled={busy}
                                style={smallBtn}
                              >
                                إلغاء ⭐
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  void tradesmanAction(t.id, "feature")
                                }
                                disabled={busy}
                                style={smallBtn}
                              >
                                ⭐ رقّي
                              </button>
                            )}
                            <button
                              onClick={() =>
                                void deleteTradesman(t.id, t.full_name)
                              }
                              disabled={busy}
                              style={dangerBtn}
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <SectionTitle
            label={`قائمة الانتظار — ${dash?.waitlist.length ?? 0}`}
          />
          {!dash || dash.waitlist.length === 0 ? (
            <Empty note="ما فيش مسجّلين في قائمة الانتظار بعد." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={th}>الهاتف</th>
                    <th style={th}>النوع</th>
                    <th style={th}>البريد</th>
                    <th style={th}>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.waitlist.map((w) => (
                    <tr key={w.phone}>
                      <td style={{ ...td, direction: "ltr" }} className="mono">
                        {w.phone}
                      </td>
                      <td style={td}>
                        {w.audience === "tradesman" ? "أسطى" : "زبون"}
                      </td>
                      <td style={td}>{w.email ?? "—"}</td>
                      <td style={td}>{w.added_at?.slice(0, 10) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      {tab === "jobs" ? (
        <JobsView jobs={dash?.jobs ?? []} pct={dash?.commissionPct ?? 10} />
      ) : null}
      {tab === "offers" ? <OffersView offers={dash?.offers ?? []} /> : null}
      {tab === "ratings" ? (
        <RatingsView ratings={dash?.ratings ?? []} />
      ) : null}
      {tab === "growth" ? <GrowthView dash={dash} /> : null}
      {tab === "profits" ? (
        <ProfitsView
          profits={profits}
          pct={dash?.commissionPct ?? 10}
          dues={dues}
          settlementsReady={settlementsReady}
          onSettle={recordSettlement}
          busyAction={busyAction}
        />
      ) : null}
      {tab === "system" ? <SystemView dash={dash} /> : null}
    </div>
  );
}

/* ─── نظرة عامة ───────────────────────────────────────── */

function OverviewView({
  profits,
  dash,
  usersCount,
  tradesmen,
}: {
  profits: Profits | null;
  dash: Dashboard | null;
  usersCount: number;
  tradesmen: TradesmanRow[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const jobsToday = dash?.growth.jobs.find((r) => r.d === today)?.n ?? 0;
  const usersToday = dash?.growth.users.find((r) => r.d === today)?.n ?? 0;
  const pendingVerification = tradesmen.filter(
    (t) => !t.verified_at && !t.suspended_at
  ).length;
  const avgRating = averageRating(dash?.ratings ?? []);
  const acceptRate =
    profits && profits.offers.total > 0
      ? Math.round((profits.offers.accepted / profits.offers.total) * 100)
      : 0;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "12px",
        }}
      >
        <Kpi label="طلبات اليوم" value={`${jobsToday}`} accent />
        <Kpi label="زبائن جدد اليوم" value={`${usersToday}`} />
        <Kpi label="إجمالي الطلبات" value={`${profits?.jobs.total ?? 0}`} />
        <Kpi
          label="مفتوحة الآن"
          value={`${profits?.jobs.open ?? 0}`}
        />
        <Kpi label="نسبة قبول العروض" value={`${acceptRate}%`} />
        <Kpi
          label="متوسط التقييم"
          value={avgRating ? `★ ${avgRating}` : "—"}
        />
        <Kpi
          label="GMV محقّق"
          value={`${profits?.gmv.realized ?? 0} د.ل`}
          accent
        />
        <Kpi label="الزبائن" value={`${usersCount}`} />
      </div>

      {pendingVerification > 0 ? (
        <Note
          tone="coral"
          text={`⚠ ${pendingVerification} أسطى في انتظار التوثيق — راجعهم في تبويب الحسابات أو من لوحة الأدمن.`}
        />
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          marginTop: "12px",
        }}
      >
        <div>
          <SectionTitle label="آخر الطلبات" />
          {(dash?.jobs ?? []).slice(0, 6).map((j) => (
            <MiniRow
              key={j.id}
              right={`${findService(j.service)?.name ?? j.service} · ${j.city ?? "—"}`}
              left={jobStatusLabels[j.status] ?? j.status}
              sub={j.created_at.slice(0, 16).replace("T", " ")}
            />
          ))}
          {(dash?.jobs.length ?? 0) === 0 ? (
            <Empty note="ما فيش طلبات بعد." />
          ) : null}
        </div>
        <div>
          <SectionTitle label="آخر العروض" />
          {(dash?.offers ?? []).slice(0, 6).map((o) => (
            <MiniRow
              key={o.id}
              right={`${o.tradesman_name ?? "أسطى"} · ${o.price_lyd} د.ل`}
              left={offerStatusLabels[o.status] ?? o.status}
              sub={`${findService(o.service ?? "")?.name ?? o.service ?? ""} · ${o.created_at.slice(0, 16).replace("T", " ")}`}
            />
          ))}
          {(dash?.offers.length ?? 0) === 0 ? (
            <Empty note="ما فيش عروض بعد." />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─── الطلبات ─────────────────────────────────────────── */

function JobsView({ jobs, pct }: { jobs: JobRow[]; pct: number }) {
  if (jobs.length === 0) return <Empty note="ما فيش طلبات بعد." />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>الخدمة</th>
            <th style={th}>المدينة</th>
            <th style={th}>الزبون</th>
            <th style={th}>التقدير</th>
            <th style={th}>عروض</th>
            <th style={th}>سعر مقبول</th>
            <th style={th}>عمولة ({pct}%)</th>
            <th style={th}>الحالة</th>
            <th style={th}>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td style={td}>{findService(j.service)?.name ?? j.service}</td>
              <td style={td}>{j.city ?? "—"}</td>
              <td style={{ ...td, direction: "ltr" }} className="mono">
                {j.customer_phone}
              </td>
              <td style={td} className="serif">
                {j.est_min != null ? `${j.est_min}–${j.est_max} د.ل` : "—"}
              </td>
              <td style={td} className="serif">
                {j.offers_count}
              </td>
              <td style={td} className="serif">
                {j.accepted_price != null ? `${j.accepted_price} د.ل` : "—"}
              </td>
              <td
                style={{ ...td, color: "var(--brand-2, #0B7F58)" }}
                className="serif"
              >
                {j.accepted_price != null
                  ? `${Math.round((j.accepted_price * pct) / 100)} د.ل`
                  : "—"}
              </td>
              <td style={td}>{jobStatusLabels[j.status] ?? j.status}</td>
              <td style={td}>{j.created_at.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── العروض ──────────────────────────────────────────── */

function OffersView({ offers }: { offers: OfferRow[] }) {
  if (offers.length === 0) return <Empty note="ما فيش عروض بعد." />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>الأسطى</th>
            <th style={th}>المهنة</th>
            <th style={th}>الخدمة</th>
            <th style={th}>المدينة</th>
            <th style={th}>السعر</th>
            <th style={th}>الحالة</th>
            <th style={th}>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o) => (
            <tr key={o.id}>
              <td style={td}>{o.tradesman_name ?? "—"}</td>
              <td style={td}>
                {findService(o.trade ?? "")?.name ?? o.trade ?? "—"}
              </td>
              <td style={td}>
                {findService(o.service ?? "")?.name ?? o.service ?? "—"}
              </td>
              <td style={td}>{o.city ?? "—"}</td>
              <td style={td} className="serif">
                {o.price_lyd} د.ل
              </td>
              <td style={td}>{offerStatusLabels[o.status] ?? o.status}</td>
              <td style={td}>{o.created_at.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── التقييمات ───────────────────────────────────────── */

function ratingAvg(r: RatingRow): number | null {
  const dims = [
    r.punctuality,
    r.quality,
    r.price_adherence,
    r.professionalism,
    r.communication,
  ].filter((v): v is number => typeof v === "number");
  if (dims.length === 0) return null;
  return Math.round((dims.reduce((a, b) => a + b, 0) / dims.length) * 10) / 10;
}

function averageRating(ratings: RatingRow[]): number | null {
  const avgs = ratings
    .map(ratingAvg)
    .filter((v): v is number => v !== null);
  if (avgs.length === 0) return null;
  return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10;
}

function RatingsView({ ratings }: { ratings: RatingRow[] }) {
  if (ratings.length === 0)
    return <Empty note="ما فيش تقييمات بعد — بتظهر أول ما يقيّم زبون شغلة مكتملة." />;
  return (
    <div>
      <Note text="التقييمات المنخفضة (تحت ★3) إشارة مبكرة لمشكلة جودة — تواصل مع الزبون والأسطى قبل ما تكبر." />
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>الأسطى</th>
              <th style={th}>الخدمة</th>
              <th style={th}>المتوسط</th>
              <th style={th}>الالتزام</th>
              <th style={th}>الجودة</th>
              <th style={th}>السعر</th>
              <th style={th}>التعليق</th>
              <th style={th}>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map((r) => {
              const avg = ratingAvg(r);
              const low = avg !== null && avg < 3;
              return (
                <tr key={r.id}>
                  <td style={td}>{r.tradesman_name ?? "—"}</td>
                  <td style={td}>
                    {findService(r.service)?.name ?? r.service}
                  </td>
                  <td
                    style={{
                      ...td,
                      color: low ? "#B23F4E" : "#8A6210",
                      fontWeight: 700,
                    }}
                    className="serif"
                  >
                    {avg !== null ? `★ ${avg}` : "—"}
                  </td>
                  <td style={td} className="serif">
                    {r.punctuality ?? "—"}
                  </td>
                  <td style={td} className="serif">
                    {r.quality ?? "—"}
                  </td>
                  <td style={td} className="serif">
                    {r.price_adherence ?? "—"}
                  </td>
                  <td style={{ ...td, maxWidth: "260px" }}>
                    {r.written_review ?? "—"}
                  </td>
                  <td style={td}>{r.created_at.slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── النمو ───────────────────────────────────────────── */

function GrowthView({ dash }: { dash: Dashboard | null }) {
  if (!dash) return <Empty note="جاري التحميل…" />;
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "28px",
          marginBottom: "40px",
        }}
      >
        <DaySeries title="طلبات جديدة — آخر 14 يوم" rows={dash.growth.jobs} />
        <DaySeries title="زبائن جدد — آخر 14 يوم" rows={dash.growth.users} />
        <DaySeries
          title="عروض مقبولة — آخر 14 يوم"
          rows={dash.growth.acceptedOffers}
        />
      </div>

      <SectionTitle label="الطلبات حسب المدينة" />
      {dash.cities.length === 0 ? (
        <Empty note="ما فيش بيانات مدن بعد." />
      ) : (
        <div style={{ maxWidth: "560px" }}>
          {dash.cities.map((c) => {
            const max = dash.cities[0]?.n ?? 1;
            return (
              <div
                key={c.city ?? "?"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    minWidth: "90px",
                    fontSize: "13.5px",
                    color: "var(--ink-2)",
                  }}
                >
                  {c.city ?? "غير محددة"}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "10px",
                    borderRadius: "999px",
                    background: "var(--line)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(6, Math.round((c.n / max) * 100))}%`,
                      height: "100%",
                      borderRadius: "999px",
                      background: "linear-gradient(90deg, #10B981, #0B7F58)",
                    }}
                  />
                </div>
                <span className="serif" style={{ minWidth: "28px" }}>
                  {c.n}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DaySeries({ title, rows }: { title: string; rows: DayRow[] }) {
  const total = rows.reduce((a, r) => a + r.n, 0);
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "16px",
        padding: "18px 20px",
        background: "var(--paper-2, transparent)",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: "10px",
          letterSpacing: "0.12em",
          color: "var(--ink-3)",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>
      <div className="serif" style={{ fontSize: "30px", marginBottom: "14px" }}>
        {total}
      </div>
      {rows.length === 0 ? (
        <p style={{ color: "var(--ink-3)", fontSize: "13px", margin: 0 }}>
          ما فيش حركة في الفترة هذي.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "4px",
            height: "64px",
          }}
        >
          {rows.map((r) => (
            <div
              key={r.d}
              title={`${r.d}: ${r.n}`}
              style={{
                flex: 1,
                height: `${Math.max(8, Math.round((r.n / max) * 100))}%`,
                borderRadius: "4px 4px 0 0",
                background: "linear-gradient(180deg, #34D399, #0B7F58)",
                minWidth: "8px",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── الأرباح ─────────────────────────────────────────── */

function ProfitsView({
  profits,
  pct,
  dues,
  settlementsReady,
  onSettle,
  busyAction,
}: {
  profits: Profits | null;
  pct: number;
  dues: DueRow[];
  settlementsReady: boolean;
  onSettle: (row: DueRow) => void;
  busyAction: string | null;
}) {
  if (!profits) return <Empty note="ما فيش بيانات أرباح بعد." />;
  const { jobs, offers, gmv, people, services } = profits;
  const acceptRate =
    offers.total > 0 ? Math.round((offers.accepted / offers.total) * 100) : 0;
  const totalDue = dues.reduce((a, r) => a + r.due, 0);

  return (
    <div>
      <Note text="الدفع الحالي كاش من الزبون للأسطى مباشرة، والأسطى يسدّد عمولة المنصة دورياً (تحويل/موبي كاش/كاش) — سجّلها هنا. بوابة الدفع الليبية بتتوصل بنفس هذي الأرقام." />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "32px",
        }}
      >
        <Kpi label={`عمولة المنصة (${pct}%)`} value={`${Math.round((gmv.realized * pct) / 100)} د.ل`} accent />
        <Kpi label="مستحق للتحصيل" value={`${totalDue} د.ل`} />
        <Kpi label="قيمة العروض المقبولة" value={`${gmv.accepted} د.ل`} />
        <Kpi label="المحقّق (شغل مكتمل)" value={`${gmv.realized} د.ل`} accent />
        <Kpi label="آخر 30 يوم" value={`${gmv.accepted30d} د.ل`} />
        <Kpi label="نسبة قبول العروض" value={`${acceptRate}%`} />
        <Kpi label="الطلبات" value={`${jobs.total}`} />
        <Kpi label="مكتملة" value={`${jobs.completed}`} />
        <Kpi label="زبائن" value={`${people.users}`} />
        <Kpi
          label="أسطوات (موثّقين)"
          value={`${people.tradesmen} (${people.tradesmenVerified})`}
        />
      </div>

      <SectionTitle label={`المستحقات — عمولة ${pct}% على الشغل المكتمل`} />
      {!settlementsReady ? (
        <Note
          tone="coral"
          text="جدول التسديدات غير مطبَّق بعد — انسخ محتوى migrations/0004_owner_tools.sql في D1 Console حتى يشتغل زر «سجّل دفعة»."
        />
      ) : null}
      {dues.length === 0 ? (
        <Empty note="ما فيش مستحقات بعد — بتظهر أول ما يكتمل شغل بعرض مقبول." />
      ) : (
        <div style={{ overflowX: "auto", marginBottom: "36px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th}>الأسطى</th>
                <th style={th}>المهنة</th>
                <th style={th}>شغل محقّق</th>
                <th style={th}>العمولة</th>
                <th style={th}>مسدَّد</th>
                <th style={th}>المستحق</th>
                <th style={th}>تسديد</th>
              </tr>
            </thead>
            <tbody>
              {dues.map((r) => (
                <tr key={r.tradesmanId}>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{findService(r.trade)?.name ?? r.trade}</td>
                  <td style={td} className="serif">
                    {r.realized} د.ل
                  </td>
                  <td style={td} className="serif">
                    {r.commission} د.ل
                  </td>
                  <td style={td} className="serif">
                    {r.paid} د.ل
                  </td>
                  <td
                    style={{
                      ...td,
                      fontWeight: 700,
                      color: r.due > 0 ? "#B23F4E" : "var(--brand-2, #0B7F58)",
                    }}
                    className="serif"
                  >
                    {r.due} د.ل
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => onSettle(r)}
                      disabled={busyAction !== null}
                      style={smallBtn}
                    >
                      {busyAction === `${r.tradesmanId}:settle`
                        ? "…"
                        : "سجّل دفعة"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SectionTitle label="سيناريوهات العمولة" />
      <div style={{ overflowX: "auto", marginBottom: "36px" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>النسبة</th>
              <th style={th}>على المقبول ({gmv.accepted} د.ل)</th>
              <th style={th}>على المحقّق ({gmv.realized} د.ل)</th>
            </tr>
          </thead>
          <tbody>
            {[5, 10, 15].map((pct) => (
              <tr key={pct}>
                <td style={td} className="serif">
                  {pct}%
                </td>
                <td style={td} className="serif">
                  {Math.round((gmv.accepted * pct) / 100)} د.ل
                </td>
                <td style={td} className="serif">
                  {Math.round((gmv.realized * pct) / 100)} د.ل
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle label="حسب الخدمة" />
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>الخدمة</th>
              <th style={th}>طلبات</th>
              <th style={th}>قيمة مقبولة</th>
              <th style={th}>قيمة محقّقة</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.service}>
                <td style={td}>{findService(s.service)?.name ?? s.service}</td>
                <td style={td} className="serif">
                  {s.jobs_count}
                </td>
                <td style={td} className="serif">
                  {s.accepted_value ?? 0} د.ل
                </td>
                <td style={td} className="serif">
                  {s.completed_value ?? 0} د.ل
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── النظام ──────────────────────────────────────────── */

function SystemView({ dash }: { dash: Dashboard | null }) {
  if (!dash) return <Empty note="جاري التحميل…" />;
  const entries = Object.entries(dash.health);
  return (
    <div style={{ maxWidth: "620px" }}>
      <Note text="✓ خضراء = المكوّن مربوط ويخدم. ✗ حمراء = ناقص متغيّر بيئة أو ربط في Cloudflare Pages → Settings." />
      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {entries.map(([k, v], i) => (
          <div
            key={k}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom:
                i < entries.length - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <span style={{ fontSize: "14.5px", color: "var(--ink)" }}>
              {healthLabels[k] ?? k}
            </span>
            <span
              className="serif"
              style={{
                fontSize: "18px",
                color: v ? "#0B7F58" : "#B23F4E",
                fontWeight: 700,
              }}
            >
              {v ? "✓" : "✗"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── قطع واجهة صغيرة ─────────────────────────────────── */

function MiniRow({
  right,
  left,
  sub,
}: {
  right: string;
  left: string;
  sub: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "12px",
        padding: "10px 14px",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          fontSize: "14px",
          color: "var(--ink)",
        }}
      >
        <span>{right}</span>
        <span style={{ color: "var(--ink-2)", whiteSpace: "nowrap" }}>
          {left}
        </span>
      </div>
      <div
        className="mono"
        style={{ fontSize: "10.5px", color: "var(--ink-3)", marginTop: "4px" }}
      >
        {sub}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 18px",
        borderRadius: "999px",
        border: `1px solid ${active ? "var(--brand-2, #0B7F58)" : "var(--line)"}`,
        background: active ? "var(--brand-2, #0B7F58)" : "transparent",
        color: active ? "#fff" : "var(--ink-2)",
        fontSize: "13.5px",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div
      className="kicker"
      style={{ margin: "0 0 12px", color: "var(--ink-3)" }}
    >
      — {label}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "16px",
        padding: "16px 18px",
        background: accent
          ? "color-mix(in srgb, var(--brand-1, #10B981) 10%, var(--paper-2, transparent))"
          : "var(--paper-2, transparent)",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: "10px",
          letterSpacing: "0.12em",
          color: "var(--ink-3)",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        className="serif"
        style={{
          fontSize: "26px",
          color: accent ? "var(--brand-2, #0B7F58)" : "var(--ink)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Note({ text, tone }: { text: string; tone?: "coral" }) {
  return (
    <p
      style={{
        fontSize: "13.5px",
        lineHeight: 1.6,
        color: tone === "coral" ? "#B23F4E" : "var(--ink-2)",
        background:
          tone === "coral"
            ? "color-mix(in srgb, #F26D5B 10%, transparent)"
            : "color-mix(in srgb, var(--brand-1, #10B981) 8%, transparent)",
        border: "1px solid var(--line)",
        borderRadius: "12px",
        padding: "12px 16px",
        margin: "0 0 20px",
      }}
    >
      {text}
    </p>
  );
}

function Empty({ note }: { note: string }) {
  return (
    <p
      style={{
        color: "var(--ink-3)",
        fontSize: "14px",
        padding: "24px 0",
        margin: 0,
      }}
    >
      {note}
    </p>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: "12px",
  border: "1px solid var(--line)",
  background: "var(--paper-2, transparent)",
  color: "var(--ink)",
  fontSize: "15px",
  fontFamily: "inherit",
  marginBottom: "12px",
};

const primaryBtn: React.CSSProperties = {
  padding: "13px 28px",
  borderRadius: "999px",
  border: 0,
  background: "linear-gradient(135deg, #10B981, #0B7F58)",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const ghostBtn: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: "999px",
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--ink-2)",
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "inherit",
};

const warnBtn: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "999px",
  border: "1px solid #B8860B",
  background: "transparent",
  color: "#8A6210",
  fontSize: "12.5px",
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const dangerBtn: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "999px",
  border: "1px solid #B23F4E",
  background: "transparent",
  color: "#B23F4E",
  fontSize: "12.5px",
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const smallBtn: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "999px",
  border: "1px solid var(--brand-2, #0B7F58)",
  background: "transparent",
  color: "var(--brand-2, #0B7F58)",
  fontSize: "12.5px",
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const th: React.CSSProperties = {
  textAlign: "right",
  padding: "10px 12px",
  borderBottom: "2px solid var(--line)",
  color: "var(--ink-3)",
  fontSize: "12px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  textAlign: "right",
  padding: "10px 12px",
  borderBottom: "1px solid var(--line)",
  color: "var(--ink)",
  verticalAlign: "top",
};
