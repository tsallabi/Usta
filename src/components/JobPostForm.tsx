"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { services } from "@/lib/services";
import { market } from "@/lib/market";

type EstimateSummary = {
  min: number;
  max: number;
  confidence: string;
  source: string;
};

type Props = {
  defaultService?: string;
  defaultDescription?: string;
  defaultBudget?: number;
  defaultCity?: string;
  estimate?: EstimateSummary;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; jobId: string }
  | { kind: "error"; message: string };

const labelStyle: CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  display: "block",
  marginBottom: "8px",
  fontWeight: 600,
};

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid var(--line)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontSize: "15px",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

export function JobPostForm({
  defaultService,
  defaultDescription,
  defaultBudget,
  defaultCity,
  estimate,
}: Props) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(
    services.some((s) => s.slug === defaultService)
      ? (defaultService as string)
      : services[0].slug
  );
  const [description, setDescription] = useState(defaultDescription ?? "");
  const [budget, setBudget] = useState(
    typeof defaultBudget === "number" && defaultBudget >= 0
      ? String(Math.round(defaultBudget))
      : ""
  );
  const [city, setCity] = useState(
    defaultCity && (market.cities as readonly string[]).includes(defaultCity)
      ? defaultCity
      : ""
  );
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // لو المستخدم مسجّل دخوله، نعبّي رقم هاتفه تلقائياً (يظل قابلاً للتعديل).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((raw) => {
        const data = raw as { loggedIn?: boolean; phone?: string };
        if (cancelled || !data.loggedIn || !data.phone) return;
        const sessionPhone = data.phone;
        setPhone((prev) => (prev ? prev : sessionPhone));
      })
      .catch(() => {
        // غير مسجّل / لا شبكة — الفورم يخدم عادي بدون تعبئة مسبقة.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!market.phone.isValid(phone)) {
      setStatus({
        kind: "error",
        message: "أدخل رقم هاتف ليبي صحيح (مثال: 091 234 5678).",
      });
      return;
    }
    if (email.trim() && !email.includes("@")) {
      setStatus({
        kind: "error",
        message: "صيغة البريد الإلكتروني غير صحيحة.",
      });
      return;
    }
    if (description.trim().length < 10) {
      setStatus({
        kind: "error",
        message: "صف الشغل في جملة أو جملتين.",
      });
      return;
    }
    setStatus({ kind: "submitting" });

    const budgetNumber = budget.trim() === "" ? undefined : Number(budget);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          email: email.trim() || undefined,
          service,
          description,
          budget:
            typeof budgetNumber === "number" &&
            Number.isFinite(budgetNumber) &&
            budgetNumber >= 0
              ? Math.round(budgetNumber)
              : undefined,
          city: city || undefined,
          area: area.trim() || undefined,
          estimate,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.id) {
        setStatus({
          kind: "error",
          message: data.error ?? "صار خطأ ما. حاول مرة ثانية.",
        });
        return;
      }

      setStatus({ kind: "success", jobId: data.id });
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
          style={{
            fontSize: "26px",
            color: "var(--ink)",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          تم نشر طلبك.
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "13px",
            color: "var(--ink-2)",
            lineHeight: 1.55,
          }}
        >
          بنتواصل معاك عبر الهاتف أول ما يقبل أسطى موثوق طلبك. رقمك يُستخدم لهذا
          الطلب فقط — لا إزعاج، ولا نعطي رقمك لأي جهة. أبداً.
        </div>
        <div
          className="mono"
          style={{
            marginTop: "14px",
            fontSize: "11px",
            color: "var(--ink-3)",
            letterSpacing: "0.06em",
          }}
        >
          REF · {status.jobId}
        </div>
      </div>
    );
  }

  const isSubmitting = status.kind === "submitting";

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: "560px" }}>
      {estimate && (
        <div
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: "999px",
            border: "1.5px solid var(--brand-2)",
            color: "var(--brand-1)",
            fontSize: "12px",
            letterSpacing: "0.06em",
            marginBottom: "24px",
          }}
        >
          تقدير الذكاء الاصطناعي: {estimate.min}–{estimate.max} د.ل
        </div>
      )}

      <label style={{ display: "block", marginBottom: "20px" }}>
        <span className="mono" style={labelStyle}>
          رقم الهاتف
        </span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={market.phone.placeholder}
          autoComplete="tel"
          dir="ltr"
          disabled={isSubmitting}
          style={{ ...fieldStyle, textAlign: "end" }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--brand-2)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
        />
      </label>

      <label style={{ display: "block", marginBottom: "20px" }}>
        <span className="mono" style={labelStyle}>
          البريد الإلكتروني (اختياري)
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          dir="ltr"
          disabled={isSubmitting}
          style={{ ...fieldStyle, textAlign: "end" }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--brand-2)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
        />
      </label>

      <label style={{ display: "block", marginBottom: "20px" }}>
        <span className="mono" style={labelStyle}>
          الخدمة
        </span>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          disabled={isSubmitting}
          style={{ ...fieldStyle, cursor: "pointer", appearance: "none" }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--brand-2)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
        >
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "block", marginBottom: "20px" }}>
        <span className="mono" style={labelStyle}>
          وصف الشغل
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="مثال: مقبسين في الكوشينة وقفوا بعد ما طاحت الكهرباء. رجّعنا القاطع وما زالوا ما يخدموش."
          rows={4}
          required
          maxLength={2000}
          disabled={isSubmitting}
          style={{
            ...fieldStyle,
            padding: "16px",
            lineHeight: 1.55,
            resize: "vertical",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--brand-2)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
        />
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <label>
          <span className="mono" style={labelStyle}>
            الميزانية بالدينار د.ل (اختياري)
          </span>
          <input
            type="number"
            min={0}
            step={10}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="150"
            disabled={isSubmitting}
            style={fieldStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--brand-2)")
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
          />
        </label>

        <label>
          <span className="mono" style={labelStyle}>
            المدينة (اختياري)
          </span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={isSubmitting}
            style={{ ...fieldStyle, cursor: "pointer", appearance: "none" }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--brand-2)")
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
          >
            <option value="">اختر المدينة…</option>
            {market.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label style={{ display: "block", marginBottom: "24px" }}>
        <span className="mono" style={labelStyle}>
          المنطقة / الحي (اختياري)
        </span>
        <input
          type="text"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="مثال: بن عاشور، قرب جامع الصحابة"
          maxLength={120}
          disabled={isSubmitting}
          style={fieldStyle}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--brand-2)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
        />
      </label>

      {status.kind === "error" && (
        <div
          role="alert"
          className="mono"
          style={{
            fontSize: "12px",
            color: "var(--coral)",
            letterSpacing: "0.04em",
            marginBottom: "16px",
          }}
        >
          {status.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: "16px 28px",
          borderRadius: "999px",
          border: 0,
          background: "linear-gradient(135deg, var(--navy-2), var(--navy-1))",
          color: "var(--paper)",
          fontSize: "15px",
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: isSubmitting ? 0.7 : 1,
          transition: "transform 0.15s ease",
          whiteSpace: "nowrap",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {isSubmitting ? "قاعدين ننشرو الطلب…" : "انشر الطلب ←"}
      </button>
      <p
        className="mono"
        style={{
          marginTop: "12px",
          fontSize: "10px",
          color: "var(--ink-3)",
          letterSpacing: "0.06em",
        }}
      >
        مجاني في فترة الإطلاق · رقمك ما ينشاركش مع أي حد
      </p>
    </form>
  );
}
