"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { market } from "@/lib/market";

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

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
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
        message: "أدخل رقم هاتف ليبي صحيح (مثال: 091 234 5678).",
      });
      return;
    }
    if (!/^[0-9]{6}$/.test(pin.trim())) {
      setStatus({
        kind: "error",
        message: "اختر رمزاً سرياً من 6 أرقام.",
      });
      return;
    }
    if (pin.trim() !== pinConfirm.trim()) {
      setStatus({
        kind: "error",
        message: "الرمزان غير متطابقين — أعد كتابة الرمز السري.",
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
          message: data.error ?? "صار خطأ ما. حاول مرة ثانية.",
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
          الاسم الكامل
        </span>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="مثال: محمد الفيتوري"
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
            رمز سري من 6 أرقام
          </span>
          <input
            type="password"
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="new-password"
            dir="ltr"
            disabled={isSubmitting}
            style={{ ...fieldStyle, textAlign: "center" }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--brand-2)")
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
          />
        </label>

        <label>
          <span className="mono" style={labelStyle}>
            تأكيد الرمز
          </span>
          <input
            type="password"
            required
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value)}
            placeholder="••••••"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="new-password"
            dir="ltr"
            disabled={isSubmitting}
            style={{ ...fieldStyle, textAlign: "center" }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--brand-2)")
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
          />
        </label>
      </div>

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
        {isSubmitting ? "قاعدين نفتحو حسابك…" : "افتح حسابك ←"}
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
