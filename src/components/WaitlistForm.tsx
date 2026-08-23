"use client";

import { useState, type FormEvent } from "react";
import { market } from "@/lib/market";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; phone: string }
  | { kind: "error"; message: string };

export function WaitlistForm({
  audience = "homeowner",
}: {
  audience?: "homeowner" | "tradesman";
}) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

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
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          email: email.trim() || undefined,
          audience,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setStatus({
          kind: "error",
          message: data.error ?? "صارت مشكلة. حاول مرة ثانية.",
        });
        return;
      }

      setStatus({ kind: "success", phone: market.phone.normalize(phone) });
      setPhone("");
      setEmail("");
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
        className="serif"
        style={{
          padding: "20px 24px",
          background:
            "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))",
          border: "1.5px solid var(--brand-2)",
          borderRadius: "16px",
          maxWidth: "480px",
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{ fontSize: "22px", color: "var(--ink)", lineHeight: 1.3 }}
        >
          تسجّلت في القائمة.
        </div>
        <div
          style={{
            marginTop: "6px",
            fontFamily:
              '"IBM Plex Sans Arabic", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
            fontSize: "13px",
            color: "var(--ink-2)",
            lineHeight: 1.5,
          }}
        >
          بنتواصل معاك على {status.phone} أول ما تفتح توّا في منطقتك. لا إزعاج،
          ولا نعطي رقمك لأي جهة. أبداً.
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        gap: "8px",
        maxWidth: "480px",
        flexWrap: "wrap",
      }}
    >
      <label
        htmlFor="waitlist-phone"
        style={{ position: "absolute", insetInlineStart: "-9999px" }}
      >
        رقم الهاتف
      </label>
      <input
        id="waitlist-phone"
        type="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={market.phone.placeholder}
        autoComplete="tel"
        dir="ltr"
        disabled={status.kind === "submitting"}
        style={{
          flex: "1 1 240px",
          minWidth: 0,
          padding: "14px 18px",
          borderRadius: "999px",
          border: "1px solid var(--line)",
          background: "var(--paper)",
          color: "var(--ink)",
          fontSize: "15px",
          fontFamily: "inherit",
          outline: "none",
          textAlign: "end",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "var(--brand-2)")
        }
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
      />
      <label
        htmlFor="waitlist-email"
        style={{ position: "absolute", insetInlineStart: "-9999px" }}
      >
        البريد الإلكتروني (اختياري)
      </label>
      <input
        id="waitlist-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="البريد الإلكتروني (اختياري)"
        autoComplete="email"
        disabled={status.kind === "submitting"}
        style={{
          flex: "1 1 240px",
          minWidth: 0,
          padding: "14px 18px",
          borderRadius: "999px",
          border: "1px solid var(--line)",
          background: "var(--paper)",
          color: "var(--ink)",
          fontSize: "15px",
          fontFamily: "inherit",
          outline: "none",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "var(--brand-2)")
        }
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
      />
      <button
        type="submit"
        disabled={status.kind === "submitting"}
        style={{
          padding: "14px 22px",
          borderRadius: "999px",
          border: 0,
          background:
            "linear-gradient(135deg, var(--navy-2), var(--navy-1))",
          color: "var(--paper)",
          fontSize: "15px",
          fontWeight: 600,
          cursor:
            status.kind === "submitting" ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          opacity: status.kind === "submitting" ? 0.7 : 1,
          transition: "transform 0.15s ease",
          whiteSpace: "nowrap",
        }}
        onMouseDown={(e) =>
          (e.currentTarget.style.transform = "scale(0.98)")
        }
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {status.kind === "submitting" ? "قاعدين نسجّلوك…" : "احجز مكانك"}
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
            marginTop: "4px",
          }}
        >
          {status.message}
        </div>
      )}
    </form>
  );
}
