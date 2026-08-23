"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { services } from "@/lib/services";
import { market } from "@/lib/market";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; id: string }
  | { kind: "error"; message: string };

type Fields = {
  fullName: string;
  phone: string;
  email: string;
  trade: string;
  city: string;
  serviceArea: string;
  nationalId: string;
  yearsExperience: string;
  previousWork: string;
};

const emptyFields: Fields = {
  fullName: "",
  phone: "",
  email: "",
  trade: "",
  city: "",
  serviceArea: "",
  nationalId: "",
  yearsExperience: "",
  previousWork: "",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 16px",
  borderRadius: "12px",
  border: "1px solid var(--line)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontSize: "15px",
  fontFamily: "inherit",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--ink-2)",
  marginBottom: "6px",
};

type Focusable = { currentTarget: { style: CSSStyleDeclaration } };

function focusRing(e: Focusable) {
  e.currentTarget.style.borderColor = "var(--brand-2)";
}
function blurRing(e: Focusable) {
  e.currentTarget.style.borderColor = "var(--line)";
}

export function TradesmanForm() {
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function set<K extends keyof Fields>(key: K) {
    return (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => setFields((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!market.phone.isValid(fields.phone)) {
      setStatus({
        kind: "error",
        message: "أدخل رقم هاتف/واتساب ليبي صحيح (مثال: 091 234 5678).",
      });
      return;
    }
    if (fields.email.trim() && !fields.email.includes("@")) {
      setStatus({
        kind: "error",
        message: "صيغة البريد الإلكتروني غير صحيحة.",
      });
      return;
    }
    if (!fields.trade) {
      setStatus({ kind: "error", message: "اختر مهنتك من القائمة." });
      return;
    }
    if (!fields.city) {
      setStatus({ kind: "error", message: "اختر مدينتك من القائمة." });
      return;
    }
    const nationalId = fields.nationalId.trim();
    if (nationalId.length < 6 || nationalId.length > 20) {
      setStatus({
        kind: "error",
        message: "أدخل رقم بطاقة الهوية / الرقم الوطني (من 6 إلى 20 خانة).",
      });
      return;
    }
    setStatus({ kind: "submitting" });

    const yearsNumber =
      fields.yearsExperience.trim() === ""
        ? undefined
        : Number(fields.yearsExperience);

    try {
      const res = await fetch("/api/tradesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fields.fullName,
          phone: fields.phone,
          email: fields.email.trim() || undefined,
          trade: fields.trade,
          city: fields.city,
          serviceArea: fields.serviceArea,
          nationalId,
          yearsExperience:
            typeof yearsNumber === "number" && Number.isFinite(yearsNumber)
              ? yearsNumber
              : undefined,
          previousWork: fields.previousWork.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "صارت مشكلة. حاول مرة ثانية.",
        });
        return;
      }

      setStatus({ kind: "success", id: data.id ?? "" });
      setFields(emptyFields);
    } catch {
      setStatus({
        kind: "error",
        message: "مشكلة في الاتصال. حاول بعد شوية.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div
        style={{
          padding: "24px 28px",
          background:
            "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))",
          border: "1.5px solid var(--brand-2)",
          borderRadius: "16px",
          maxWidth: "560px",
        }}
        role="status"
        aria-live="polite"
      >
        <div
          className="serif"
          style={{ fontSize: "24px", color: "var(--ink)", lineHeight: 1.3 }}
        >
          استلمنا طلبك.
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "14px",
            color: "var(--ink-2)",
            lineHeight: 1.55,
          }}
        >
          بنراجع بياناتك ونتواصل معاك على الواتساب خلال 48 ساعة. التوثيق يدوي —
          إنسان حقيقي يتأكد من بياناتك قبل ما يوصلك أي طلب.
        </div>
        {status.id && (
          <div
            className="mono"
            style={{
              marginTop: "14px",
              fontSize: "11px",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
            }}
          >
            REF · {status.id}
          </div>
        )}
      </div>
    );
  }

  const busy = status.kind === "submitting";

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "36px",
        maxWidth: "560px",
      }}
    >
      {/* ─── بياناتك ─── */}
      <section>
        <div className="kicker" style={{ marginBottom: "16px" }}>
          بياناتك
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="tm-fullname" style={labelStyle}>
              الاسم الكامل
            </label>
            <input
              id="tm-fullname"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={fields.fullName}
              onChange={set("fullName")}
              autoComplete="name"
              disabled={busy}
              style={inputStyle}
              onFocus={focusRing}
              onBlur={blurRing}
            />
          </div>
          <div>
            <label htmlFor="tm-phone" style={labelStyle}>
              رقم الهاتف / واتساب
            </label>
            <input
              id="tm-phone"
              type="tel"
              required
              value={fields.phone}
              onChange={set("phone")}
              placeholder={market.phone.placeholder}
              autoComplete="tel"
              dir="ltr"
              disabled={busy}
              style={{ ...inputStyle, textAlign: "end" }}
              onFocus={focusRing}
              onBlur={blurRing}
            />
          </div>
          <div>
            <label htmlFor="tm-email" style={labelStyle}>
              البريد الإلكتروني (اختياري)
            </label>
            <input
              id="tm-email"
              type="email"
              value={fields.email}
              onChange={set("email")}
              placeholder="you@example.com"
              autoComplete="email"
              dir="ltr"
              disabled={busy}
              style={{ ...inputStyle, textAlign: "end" }}
              onFocus={focusRing}
              onBlur={blurRing}
            />
          </div>
        </div>
      </section>

      {/* ─── مهنتك ─── */}
      <section>
        <div className="kicker" style={{ marginBottom: "16px" }}>
          مهنتك
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="tm-trade" style={labelStyle}>
              المهنة
            </label>
            <select
              id="tm-trade"
              required
              value={fields.trade}
              onChange={set("trade")}
              disabled={busy}
              style={{
                ...inputStyle,
                appearance: "none",
                WebkitAppearance: "none",
                cursor: "pointer",
              }}
              onFocus={focusRing}
              onBlur={blurRing}
            >
              <option value="" disabled>
                اختر مهنتك…
              </option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tm-city" style={labelStyle}>
              المدينة
            </label>
            <select
              id="tm-city"
              required
              value={fields.city}
              onChange={set("city")}
              disabled={busy}
              style={{
                ...inputStyle,
                appearance: "none",
                WebkitAppearance: "none",
                cursor: "pointer",
              }}
              onFocus={focusRing}
              onBlur={blurRing}
            >
              <option value="" disabled>
                اختر المدينة…
              </option>
              {market.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tm-area" style={labelStyle}>
              مناطق الشغل
            </label>
            <input
              id="tm-area"
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={fields.serviceArea}
              onChange={set("serviceArea")}
              placeholder="مثال: بن عاشور، الأندلس، حي دمشق"
              disabled={busy}
              style={inputStyle}
              onFocus={focusRing}
              onBlur={blurRing}
            />
          </div>
        </div>
      </section>

      {/* ─── التوثيق ─── */}
      <section>
        <div className="kicker" style={{ marginBottom: "8px" }}>
          التوثيق
        </div>
        <div
          className="mono"
          style={{
            fontSize: "11px",
            color: "var(--ink-3)",
            letterSpacing: "0.08em",
            marginBottom: "16px",
          }}
        >
          التوثيق يدوي قبل ما تستلم أي طلب
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="tm-nationalid" style={labelStyle}>
              رقم بطاقة الهوية / الرقم الوطني
            </label>
            <input
              id="tm-nationalid"
              type="text"
              required
              minLength={6}
              maxLength={20}
              value={fields.nationalId}
              onChange={set("nationalId")}
              dir="ltr"
              disabled={busy}
              style={{ ...inputStyle, textAlign: "end" }}
              onFocus={focusRing}
              onBlur={blurRing}
            />
          </div>
          <div>
            <label htmlFor="tm-years" style={labelStyle}>
              سنوات الخبرة (اختياري)
            </label>
            <input
              id="tm-years"
              type="number"
              min={0}
              max={60}
              value={fields.yearsExperience}
              onChange={set("yearsExperience")}
              placeholder="5"
              disabled={busy}
              style={inputStyle}
              onFocus={focusRing}
              onBlur={blurRing}
            />
          </div>
          <div>
            <label htmlFor="tm-previouswork" style={labelStyle}>
              وصف أعمال سابقة (اختياري)
            </label>
            <textarea
              id="tm-previouswork"
              rows={3}
              maxLength={1000}
              value={fields.previousWork}
              onChange={set("previousWork")}
              placeholder="مثال: تمديدات كهرباء كاملة لفيلا في السراج، صيانة دورية لمحلات في السوق…"
              disabled={busy}
              style={{
                ...inputStyle,
                lineHeight: 1.55,
                resize: "vertical",
              }}
              onFocus={focusRing}
              onBlur={blurRing}
            />
          </div>
        </div>
      </section>

      <div>
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "15px 28px",
            borderRadius: "999px",
            border: 0,
            background: "linear-gradient(135deg, var(--navy-2), var(--navy-1))",
            color: "var(--paper)",
            fontSize: "15px",
            fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: busy ? 0.7 : 1,
            transition: "transform 0.15s ease",
            whiteSpace: "nowrap",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {busy ? "قاعدين نرسلو طلبك…" : "قدّم للانضمام لأسطى"}
        </button>

        {status.kind === "error" && (
          <div
            role="alert"
            className="mono"
            style={{
              fontSize: "11px",
              color: "var(--coral)",
              letterSpacing: "0.06em",
              width: "100%",
              marginTop: "12px",
            }}
          >
            {status.message}
          </div>
        )}
      </div>
    </form>
  );
}
