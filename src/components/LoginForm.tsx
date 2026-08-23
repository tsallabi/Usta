"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { market } from "@/lib/market";
import { PinEyeButton } from "./SignupForm";

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

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        message: "كلمة السر 6 خانات على الأقل.",
      });
      return;
    }
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin: pin.trim() }),
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

      <label style={{ display: "block", marginBottom: "24px" }}>
        <span className="mono" style={labelStyle}>
          كلمة السر
        </span>
        <div style={{ position: "relative" }}>
          <input
            type={showPin ? "text" : "password"}
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••"
            maxLength={64}
            autoComplete="current-password"
            dir="ltr"
            disabled={isSubmitting}
            style={{ ...fieldStyle, textAlign: "center", paddingInlineEnd: "44px" }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--brand-2)")
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
          />
          <PinEyeButton show={showPin} onToggle={() => setShowPin(!showPin)} />
        </div>
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
        {isSubmitting ? "قاعدين ندخّلوك…" : "دخول"}
      </button>

      <p
        style={{
          marginTop: "20px",
          fontSize: "13px",
          color: "var(--ink-2)",
          lineHeight: 1.55,
        }}
      >
        ما عندكش حساب؟{" "}
        <Link
          href="/signup"
          style={{ color: "var(--brand-1)", textDecoration: "none" }}
        >
          افتح واحد
        </Link>
      </p>
    </form>
  );
}
