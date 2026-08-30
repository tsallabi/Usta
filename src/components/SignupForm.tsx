"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { market } from "@/lib/market";
import { useLocale } from "./locale";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
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

export function PinEyeButton({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "إخفاء الرمز" : "إظهار الرمز"}
      title={show ? "إخفاء الرمز" : "إظهار الرمز"}
      style={{
        position: "absolute",
        insetInlineEnd: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "transparent",
        border: 0,
        padding: "6px",
        cursor: "pointer",
        color: "var(--ink-3)",
        display: "flex",
        alignItems: "center",
      }}
    >
      {show ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

export function SignupForm() {
  const en = useLocale() === "en";
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });


  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      setStatus({
        kind: "error",
        message: "أدخل اسمك الكامل (من 2 إلى 100 حرف).",
      });
      return;
    }
    if (!market.phone.isValid(phone)) {
      setStatus({
        kind: "error",
        message:
          "أدخل رقم موبايل ليبي صحيح — يبدأ بـ 091 حتى 095 (مثال: 0912345678).",
      });
      return;
    }
    if (pin.trim().length < 6) {
      setStatus({
        kind: "error",
        message: "كلمة السر لازم تكون 6 خانات على الأقل — حروف أو أرقام.",
      });
      return;
    }
    if (pin.trim() !== pinConfirm.trim()) {
      setStatus({
        kind: "error",
        message: "الكلمتان غير متطابقتين — أعد كتابة كلمة السر.",
      });
      return;
    }
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone,
          pin: pin.trim(),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "صارت مشكلة. حاول مرة ثانية.",
        });
        return;
      }

      router.push("/account");
    } catch {
      setStatus({
        kind: "error",
        message: "مشكلة في الاتصال. حاول بعد شوية.",
      });
    }
  }

  const isSubmitting = status.kind === "submitting";

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: "560px" }}>
      <label style={{ display: "block", marginBottom: "20px" }}>
        <span className="mono" style={labelStyle}>
          {en ? "Full name" : "الاسم الكامل"}
        </span>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={en ? "e.g. Mohamed Ali" : "مثال: محمد الفيتوري"}
          autoComplete="name"
          maxLength={100}
          disabled={isSubmitting}
          style={fieldStyle}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--brand-2)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
        />
      </label>

      <label style={{ display: "block", marginBottom: "20px" }}>
        <span className="mono" style={labelStyle}>
          {en ? "Phone number" : "رقم الهاتف"}
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
            {en ? "Password" : "كلمة السر"}
          </span>
          <div style={{ position: "relative" }}>
            <input
              type={showPin ? "text" : "password"}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              maxLength={64}
              autoComplete="new-password"
              dir="ltr"
              disabled={isSubmitting}
              style={{
                ...fieldStyle,
                textAlign: "center",
                paddingInlineEnd: "44px",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--brand-2)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--line)")
              }
            />
            <PinEyeButton show={showPin} onToggle={() => setShowPin(!showPin)} />
          </div>
        </label>

        <label>
          <span className="mono" style={labelStyle}>
            {en ? "Confirm" : "التأكيد"}
          </span>
          <div style={{ position: "relative" }}>
            <input
              type={showPin ? "text" : "password"}
              required
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value)}
              placeholder="••••••"
              maxLength={64}
              autoComplete="new-password"
              dir="ltr"
              disabled={isSubmitting}
              style={{
                ...fieldStyle,
                textAlign: "center",
                paddingInlineEnd: "44px",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--brand-2)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--line)")
              }
            />
            <PinEyeButton show={showPin} onToggle={() => setShowPin(!showPin)} />
          </div>
        </label>
      </div>

      <p
        className="mono"
        style={{
          fontSize: "11px",
          color: "var(--ink-3)",
          letterSpacing: "0.04em",
          margin: "-12px 0 20px",
        }}
      >
        6 خانات على الأقل — حروف أو أرقام أو الاثنين
      </p>

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
        {isSubmitting
          ? en
            ? "Creating your account…"
            : "قاعدين نفتحو حسابك…"
          : en
            ? "Create account →"
            : "افتح حسابك ←"}
      </button>

      <p
        style={{
          marginTop: "20px",
          fontSize: "13px",
          color: "var(--ink-2)",
          lineHeight: 1.55,
        }}
      >
        عندك حساب؟{" "}
        <Link
          href="/login"
          style={{ color: "var(--brand-1)", textDecoration: "none" }}
        >
          سجّل دخولك
        </Link>
      </p>

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
