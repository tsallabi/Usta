"use client";

/**
 * كونسول المالك — أعلى صلاحية في المنصة (فوق الأدمن).
 *
 * تبويبان:
 *   - الحسابات: كل الزبائن والأسطوات + زر "ادخل بحسابه" (انتحال جلسة
 *     للفحص والتجربة — يفتح المنصة بعين صاحب الحساب).
 *   - الأرباح: GMV وسيناريوهات العمولة وتفصيل الخدمات — للمالك فقط.
 *
 * المفتاح OWNER_KEY يُحفظ في sessionStorage (يُمسح بإغلاق التبويب).
 */

import { useCallback, useEffect, useState } from "react";
import { findService } from "@/lib/services";

const KEY_STORAGE = "usta_owner_key";

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
  created_at: string;
  accepted_count: number;
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

type Tab = "accounts" | "profits";

export function OwnerConsole() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [tab, setTab] = useState<Tab>("accounts");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tradesmen, setTradesmen] = useState<TradesmanRow[]>([]);
  const [profits, setProfits] = useState<Profits | null>(null);
  const [dbBound, setDbBound] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busyPhone, setBusyPhone] = useState<string | null>(null);
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
      const [accountsRes, profitsRes] = await Promise.all([
        authedFetch("/api/owner/accounts"),
        authedFetch("/api/owner/profits"),
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
      if (accounts.ok) {
        setUsers(accounts.users ?? []);
        setTradesmen(accounts.tradesmen ?? []);
        setDbBound(accounts.dbBound !== false);
      }
      if (prof.ok && prof.dbBound !== false) setProfits(prof);
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
    ? users.filter(
        (u) => u.full_name.includes(q) || u.phone.includes(q)
      )
    : users;
  const filteredTradesmen = q
    ? tradesmen.filter(
        (t) =>
          t.full_name.includes(q) ||
          t.whatsapp.includes(q) ||
          t.trade.includes(q)
      )
    : tradesmen;

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
        <div style={{ display: "flex", gap: "8px" }}>
          <TabButton
            active={tab === "accounts"}
            onClick={() => setTab("accounts")}
            label={`الحسابات (${users.length + tradesmen.length})`}
          />
          <TabButton
            active={tab === "profits"}
            onClick={() => setTab("profits")}
            label="الأرباح"
          />
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
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={th}>الاسم</th>
                    <th style={th}>المهنة</th>
                    <th style={th}>المدينة</th>
                    <th style={th}>الواتساب</th>
                    <th style={th}>الحالة</th>
                    <th style={th}>شغلات</th>
                    <th style={th}>دخول</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTradesmen.map((t) => (
                    <tr key={t.id}>
                      <td style={td}>{t.full_name}</td>
                      <td style={td}>
                        {findService(t.trade)?.name ?? t.trade}
                      </td>
                      <td style={td}>{t.city}</td>
                      <td style={{ ...td, direction: "ltr" }} className="mono">
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
                        <button
                          onClick={() => void impersonate(t.whatsapp, "/work")}
                          disabled={busyPhone !== null}
                          style={smallBtn}
                        >
                          {busyPhone === t.whatsapp ? "…" : "ادخل كأسطى ←"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <ProfitsView profits={profits} />
      )}
    </div>
  );
}

/* ─── تبويب الأرباح ───────────────────────────────────── */

function ProfitsView({ profits }: { profits: Profits | null }) {
  if (!profits) return <Empty note="ما فيش بيانات أرباح بعد." />;
  const { jobs, offers, gmv, people, services } = profits;
  const acceptRate =
    offers.total > 0 ? Math.round((offers.accepted / offers.total) * 100) : 0;

  return (
    <div>
      <Note text="قبل تفعيل الدفع الإلكتروني، الأرقام هنا هي قيمة الشغل اللي مرّ عبر المنصة (GMV) وسيناريوهات العمولة عليه — هذي الصفحة للمالك فقط." />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "32px",
        }}
      >
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

/* ─── قطع واجهة صغيرة ─────────────────────────────────── */

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
