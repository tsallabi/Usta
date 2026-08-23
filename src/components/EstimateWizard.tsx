"use client";

import { useState, type FormEvent } from "react";
import { services, type ServiceCategory } from "@/lib/services";
import { market } from "@/lib/market";

type Estimate = {
  service: string;
  min: number;
  max: number;
  currency: "LYD";
  confidence: "low" | "medium" | "high";
  sampleNote: string;
  scopeNote: string;
  source: "gemini" | "claude" | "fallback";
};

type State =
  | { step: "pick" }
  | { step: "describe"; service: ServiceCategory }
  | { step: "loading"; service: ServiceCategory; description: string }
  | {
      step: "result";
      service: ServiceCategory;
      estimate: Estimate;
      description: string;
    }
  | { step: "error"; service: ServiceCategory; message: string };

const gradientMap: Record<ServiceCategory["gradient"], string> = {
  blue: "linear-gradient(140deg, #2A4A7F, #1F3966)",
  teal: "linear-gradient(140deg, #14876C, #0B6350)",
  orange: "linear-gradient(140deg, #E67E3B, #C55A1E)",
  plum: "linear-gradient(140deg, #6B3D7D, #4B2A5B)",
  rose: "linear-gradient(140deg, #DE5F6D, #B23F4E)",
  forest: "linear-gradient(140deg, #4A7346, #2E5030)",
  slate: "linear-gradient(140deg, #4A5C6E, #2E3D4F)",
  ochre: "linear-gradient(140deg, #C99A3E, #A67824)",
  sky: "linear-gradient(140deg, #3B7EA1, #256380)",
};

const confidenceLabels: Record<Estimate["confidence"], string> = {
  low: "منخفضة · الوصف كان مختصر",
  medium: "متوسطة · نطاق عادل",
  high: "عالية · وصف واضح",
};

export function EstimateWizard() {
  const [state, setState] = useState<State>({ step: "pick" });
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(150);
  const [city, setCity] = useState("");

  function pickService(s: ServiceCategory) {
    setState({ step: "describe", service: s });
    setDescription("");
    setBudget(Math.round((s.fallbackRange.min + s.fallbackRange.max) / 2));
    setCity("");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.step !== "describe") return;
    if (description.trim().length < 10) return;

    const svc = state.service;
    setState({ step: "loading", service: svc, description });

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: svc.slug,
          description,
          budget,
          city: city.trim() || undefined,
        }),
      });
      const data = (await res.json()) as
        | ({ ok: true } & Estimate)
        | { ok: false; error: string };
      if (!("ok" in data) || !data.ok) {
        setState({
          step: "error",
          service: svc,
          message: "error" in data ? data.error : "صار خطأ ما. حاول مرة ثانية.",
        });
        return;
      }
      const { ok: _drop, ...est } = data as { ok: true } & Estimate;
      setState({ step: "result", service: svc, estimate: est, description });
    } catch {
      setState({
        step: "error",
        service: svc,
        message: "مشكلة في الاتصال. حاول بعد شوية.",
      });
    }
  }

  function reset() {
    setState({ step: "pick" });
    setDescription("");
    setBudget(150);
    setCity("");
  }

  /* ─── Step 1: pick a service ─────────────────────────── */
  if (state.step === "pick") {
    return (
      <div>
        <div className="kicker" style={{ marginBottom: "12px" }}>
          خطوة 1 من 2
        </div>
        <h2
          className="serif"
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            letterSpacing: "-0.02em",
            fontWeight: 400,
            margin: "0 0 24px",
            textWrap: "balance",
            lineHeight: 1.3,
          }}
        >
          شن المهنة اللي تحتاجها؟
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "12px",
          }}
        >
          {services.map((s) => (
            <button
              type="button"
              key={s.slug}
              onClick={() => pickService(s)}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: "18px",
                padding: "14px 12px",
                color: "white",
                background: gradientMap[s.gradient],
                border: 0,
                cursor: "pointer",
                textAlign: "start",
                fontFamily: "inherit",
                boxShadow: "0 6px 20px -8px rgba(11,31,51,0.35)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.1s ease",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.97)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              aria-label={`اختر ${s.name}`}
            >
              <IconGlyph icon={s.icon} />
              <div>
                <div
                  className="serif"
                  style={{
                    fontSize: "17px",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {s.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    opacity: 0.75,
                    marginTop: "4px",
                    lineHeight: 1.45,
                  }}
                >
                  {s.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ─── Step 2: describe ───────────────────────────────── */
  if (state.step === "describe" || state.step === "loading" || state.step === "error") {
    const svc = state.service;
    const isLoading = state.step === "loading";
    const errorMessage = state.step === "error" ? state.message : null;

    return (
      <form onSubmit={submit}>
        <button
          type="button"
          onClick={reset}
          className="mono"
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            marginBottom: "20px",
            color: "var(--ink-3)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          → الرجوع للمهن
        </button>

        <div className="kicker" style={{ marginBottom: "10px" }}>
          خطوة 2 من 2 · {svc.name}
        </div>
        <h2
          className="serif"
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            letterSpacing: "-0.02em",
            fontWeight: 400,
            margin: "0 0 20px",
            textWrap: "balance",
            lineHeight: 1.3,
          }}
        >
          صف اللي صاير.
        </h2>

        <label style={{ display: "block", marginBottom: "20px" }}>
          <span
            className="mono"
            style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            الشغل المطلوب
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="مثال: مقبسين في الكوشينة وقفوا بعد ما طاحت الكهرباء. رجّعنا القاطع وما زالوا ما يخدموش."
            rows={4}
            disabled={isLoading}
            required
            maxLength={2000}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "15px",
              lineHeight: 1.55,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
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
            gridTemplateColumns: "1fr 200px",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <label>
            <span
              className="mono"
              style={{
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              ميزانيتك (اختياري)
            </span>
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid var(--line)",
                background: "var(--paper)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  alignItems: "baseline",
                }}
              >
                <span className="mono" style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                  حتى
                </span>
                <span
                  className="serif"
                  style={{
                    fontSize: "22px",
                    letterSpacing: "-0.02em",
                    color: "var(--ink)",
                  }}
                >
                  {budget} د.ل
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={2000}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                disabled={isLoading}
                style={{
                  width: "100%",
                  accentColor: "var(--brand-2)",
                  cursor: "pointer",
                }}
                aria-label="الميزانية بالدينار الليبي"
              />
            </div>
          </label>

          <label>
            <span
              className="mono"
              style={{
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              المدينة (اختياري)
            </span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isLoading}
              style={{
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
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
              }}
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

        {errorMessage && (
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
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || description.trim().length < 10}
          style={{
            width: "100%",
            padding: "18px 24px",
            borderRadius: "16px",
            border: 0,
            background: isLoading
              ? "var(--ink-3)"
              : "linear-gradient(135deg, var(--navy-2), var(--navy-1))",
            color: "var(--paper)",
            fontSize: "16px",
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "transform 0.1s ease",
          }}
        >
          {isLoading ? (
            <>
              <Spinner />
              قاعد نحسب التقدير العادل…
            </>
          ) : (
            <>
              <SparkIcon /> اعطني التقدير الذكي
            </>
          )}
        </button>
        <p
          className="mono"
          style={{
            marginTop: "12px",
            fontSize: "10px",
            color: "var(--ink-3)",
            letterSpacing: "0.06em",
            textAlign: "center",
          }}
        >
          بدون حساب · بدون بريد · رقم وبس
        </p>
      </form>
    );
  }

  /* ─── Result ─────────────────────────────────────────── */
  const { service: svc, estimate } = state;
  const mid = Math.round((estimate.min + estimate.max) / 2);
  const postJobHref =
    `/jobs/new?service=${svc.slug}` +
    `&description=${encodeURIComponent(state.description)}` +
    `&min=${estimate.min}&max=${estimate.max}` +
    `&confidence=${estimate.confidence}&source=${estimate.source}` +
    (city.trim() ? `&city=${encodeURIComponent(city.trim())}` : "");

  return (
    <div>
      <button
        type="button"
        onClick={reset}
        className="mono"
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          marginBottom: "24px",
          color: "var(--ink-3)",
          fontSize: "11px",
          letterSpacing: "0.1em",
          cursor: "pointer",
        }}
      >
        → قدّر شغل ثاني
      </button>

      <div
        style={{
          padding: "32px 32px",
          borderRadius: "24px",
          background: "linear-gradient(135deg, #0B1F33 0%, #14314D 100%)",
          color: "#F5EFDF",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 60px -20px rgba(0,0,0,0.4)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-60px",
            left: "-60px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(52,211,153,0.35) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span
            className="mono"
            style={{
              fontSize: "11px",
              letterSpacing: "0.14em",
              color: "var(--brand-3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
            }}
          >
            <SparkIcon /> تقدير أسطى الذكي
          </span>
          <span
            className="mono"
            style={{
              fontSize: "10px",
              color: "rgba(245,239,223,0.55)",
              letterSpacing: "0.06em",
            }}
          >
            الثقة: {confidenceLabels[estimate.confidence]}
          </span>
        </div>

        <div
          className="serif"
          style={{
            position: "relative",
            fontSize: "clamp(48px, 8vw, 76px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.3,
            margin: "20px 0 12px",
          }}
        >
          {estimate.min}
          <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 12px", fontSize: "0.72em" }}>–</span>
          {estimate.max}
          <span style={{ fontSize: "0.45em", marginInlineStart: "12px" }}>د.ل</span>
        </div>
        <p
          style={{
            position: "relative",
            fontSize: "14px",
            color: "rgba(245,239,223,0.72)",
            lineHeight: 1.55,
            margin: "0 0 20px",
            maxWidth: "560px",
          }}
        >
          {estimate.sampleNote}
        </p>

        <div
          style={{
            position: "relative",
            height: "10px",
            borderRadius: "5px",
            background: "rgba(255,255,255,0.08)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: "12%",
              left: "22%",
              background: "linear-gradient(90deg, var(--brand-3), var(--brand-2))",
              borderRadius: "5px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-3px",
              bottom: "-3px",
              right: "48%",
              width: "3px",
              background: "white",
              borderRadius: "2px",
            }}
            aria-label={`نقطة الوسط تقريباً ${mid} د.ل`}
          />
        </div>

        <div
          style={{
            position: "relative",
            padding: "14px 16px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "12px",
            borderInlineStart: "3px solid var(--brand-3)",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              color: "var(--brand-3)",
              marginBottom: "4px",
              fontWeight: 600,
            }}
          >
            نطاق الشغل
          </div>
          <div style={{ fontSize: "13px", lineHeight: 1.55 }}>
            {estimate.scopeNote}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "rgba(245,239,223,0.5)",
            gap: "12px",
            flexWrap: "wrap",
          }}
          className="mono"
        >
          <span>
            {estimate.source !== "fallback"
              ? "تقدير من الذكاء الاصطناعي · مو تشخيص · مو عرض نهائي"
              : "نطاق تقريبي للسوق · مفتاح الذكاء الاصطناعي غير مفعّل"}
          </span>
          <span>{svc.name}</span>
        </div>
      </div>

      <div
        style={{
          marginTop: "28px",
          padding: "24px 26px",
          borderRadius: "18px",
          background: "var(--paper-2)",
          border: "1px solid var(--line)",
        }}
      >
        <h3
          className="serif"
          style={{
            fontSize: "20px",
            margin: "0 0 6px",
            letterSpacing: "-0.01em",
            fontWeight: 400,
            lineHeight: 1.3,
          }}
        >
          جاهز لأسطى موثوق؟
        </h3>
        <p
          style={{
            color: "var(--ink-2)",
            fontSize: "14px",
            lineHeight: 1.55,
            margin: "0 0 16px",
          }}
        >
          أسطى ينطلق في طرابلس وبنغازي ومصراتة. انشر طلبك الآن أو سجّل في قائمة
          الانتظار وبنتواصل معاك أول ما نفتح في مدينتك.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a
            href={postJobHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, var(--navy-2), var(--navy-1))",
              color: "var(--paper)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
              boxShadow: "0 8px 24px -8px rgba(11,31,51,0.45)",
            }}
          >
            انشر الطلب ←
          </a>
          <a
            href="/#waitlist"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, var(--brand-2), var(--brand-1))",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
              boxShadow: "0 8px 24px -8px var(--brand-glow)",
            }}
          >
            سجّل في قائمة الانتظار ←
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Icons ───────────────────────────────────────────── */

function IconGlyph({ icon }: { icon: ServiceCategory["icon"] }) {
  const paths: Record<ServiceCategory["icon"], JSX.Element> = {
    bolt: <path d="M13 2 L4 14 h6 l-1 8 l9 -12 h-6 l1 -8 z" fill="currentColor" />,
    wrench: (
      <path
        d="M14 3 a5 5 0 0 0 -3 8 L3 19 l2 2 l8 -8 a5 5 0 0 0 8 -3 l-3 -1 l-2 2 l-3 -3 l2 -2 z"
        fill="currentColor"
      />
    ),
    flame: (
      <path
        d="M12 3 c 1 4 5 5 5 10 a5 5 0 0 1 -10 0 c 0 -3 3 -5 3 -8 c 0 1 1 1 2 -2 z"
        fill="currentColor"
      />
    ),
    broom: (
      <path
        d="M14 3 l6 6 M13 4 L4 13 l3 3 l9 -9 z M6 15 l-3 6 l6 -3 l6 -6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    ),
    paint: (
      <>
        <rect x={3} y={3} width={14} height={6} rx={1} fill="currentColor" />
        <path
          d="M17 6 h4 v4 h-8 v3 h-2 v8 h-2 v-8 h-2 v-3 h8"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </>
    ),
    leaf: (
      <path
        d="M20 4 c -12 0 -14 8 -14 12 c 0 3 2 5 5 5 c 4 0 12 -2 12 -14 z"
        fill="currentColor"
      />
    ),
    truck: (
      <>
        <path d="M2 6 h11 v10 h-11 z M13 9 h5 l3 3 v4 h-8 z" fill="currentColor" />
        <circle cx={6} cy={18} r={2} fill="white" stroke="currentColor" strokeWidth={1.5} />
        <circle cx={17} cy={18} r={2} fill="white" stroke="currentColor" strokeWidth={1.5} />
      </>
    ),
    box: (
      <>
        <path d="M3 8 L12 3 L21 8 L21 17 L12 22 L3 17 z" fill="currentColor" opacity={0.9} />
        <path
          d="M3 8 L12 13 L21 8 M12 13 L12 22"
          fill="none"
          stroke="white"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </>
    ),
    send: (
      <path
        d="M3 11 L21 3 L14 21 L11 13 Z M11 13 L21 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    ),
  };

  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={22} height={22} viewBox="0 0 24 24" style={{ color: "white" }}>
        {paths[icon]}
      </svg>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "inline-block" }}
    >
      <path
        d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        border: "2px solid rgba(245,239,223,0.3)",
        borderTopColor: "var(--paper)",
        animation: "estimate-spin 0.8s linear infinite",
      }}
    />
  );
}
