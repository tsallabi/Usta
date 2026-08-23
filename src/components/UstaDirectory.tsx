"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { services, findService } from "@/lib/services";
import { cities } from "@/lib/market";
import { gradientByIndex, initialsOf, VerifiedPill } from "./UstaProfile";

/* ─── Types mirroring /api/ustas ─────────────────────────── */

type Usta = {
  id: string;
  full_name: string;
  trade: string;
  city: string;
  service_area: string;
  years_experience: number | null;
  created_at: string;
  accepted_count: number;
};

type View =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; ustas: Usta[] };

/* ─── Directory ──────────────────────────────────────────── */

export function UstaDirectory() {
  const [trade, setTrade] = useState("");
  const [city, setCity] = useState("");
  const [view, setView] = useState<View>({ kind: "loading" });

  const load = useCallback(async () => {
    setView({ kind: "loading" });
    try {
      const params = new URLSearchParams();
      if (trade) params.set("trade", trade);
      if (city) params.set("city", city);
      const qs = params.toString();
      const res = await fetch(`/api/ustas${qs ? `?${qs}` : ""}`);
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        ustas?: Usta[];
        error?: string;
      };
      if (data.ok && Array.isArray(data.ustas)) {
        setView({ kind: "ready", ustas: data.ustas });
      } else {
        setView({
          kind: "error",
          message: data.error ?? "ما قدرناش نجيبو الدليل توّا. حاول بعد شوية.",
        });
      }
    } catch {
      setView({ kind: "error", message: "مشكلة في الاتصال. حاول بعد شوية." });
    }
  }, [trade, city]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectStyle: React.CSSProperties = {
    flex: "1 1 200px",
    maxWidth: "280px",
    padding: "12px 16px",
    borderRadius: "999px",
    border: "1px solid var(--line)",
    background: "var(--paper)",
    color: "var(--ink)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "32px",
        }}
      >
        <label
          htmlFor="dir-trade"
          style={{ position: "absolute", insetInlineStart: "-9999px" }}
        >
          المهنة
        </label>
        <select
          id="dir-trade"
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          style={selectStyle}
        >
          <option value="">كل المهن</option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>

        <label
          htmlFor="dir-city"
          style={{ position: "absolute", insetInlineStart: "-9999px" }}
        >
          المدينة
        </label>
        <select
          id="dir-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={selectStyle}
        >
          <option value="">كل المدن</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {view.kind === "loading" && (
        <div
          className="mono"
          role="status"
          aria-live="polite"
          style={{
            fontSize: "12px",
            color: "var(--ink-3)",
            letterSpacing: "0.1em",
            padding: "40px 0",
          }}
        >
          قاعدين نجيبو الأسطوات…
        </div>
      )}

      {view.kind === "error" && (
        <div
          role="alert"
          className="mono"
          style={{
            fontSize: "12px",
            color: "var(--coral)",
            letterSpacing: "0.04em",
            padding: "20px 0",
          }}
        >
          {view.message}
        </div>
      )}

      {view.kind === "ready" && view.ustas.length === 0 && (
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
          ما لقيناش أسطى بالمواصفات هذي توا — جرّب مدينة ثانية.
        </div>
      )}

      {view.kind === "ready" && view.ustas.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {view.ustas.map((usta, i) => (
            <UstaCard key={usta.id} usta={usta} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Card ───────────────────────────────────────────────── */

function UstaCard({ usta, index }: { usta: Usta; index: number }) {
  const trade = findService(usta.trade);
  const years = usta.years_experience ?? 0;
  const stats = [
    years > 0 ? `خبرة ${years} سنين` : "أسطى جديد",
    usta.accepted_count === 1
      ? "شغلة وحدة مقبولة"
      : `${usta.accepted_count} شغلة مقبولة`,
  ].join(" · ");

  return (
    <Link
      href={`/usta/${usta.id}`}
      style={{
        display: "block",
        padding: "22px 22px 20px",
        border: "1px solid var(--line)",
        borderRadius: "16px",
        background: "var(--paper-2)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <span
          aria-hidden="true"
          className="serif"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: gradientByIndex(index),
            color: "rgba(255,255,255,0.92)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            letterSpacing: "-0.02em",
            flexShrink: 0,
          }}
        >
          {initialsOf(usta.full_name)}
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            className="serif"
            style={{
              fontSize: "19px",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span>{usta.full_name}</span>
            <VerifiedPill />
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "var(--ink-2)",
              marginTop: "2px",
            }}
          >
            {trade?.name ?? usta.trade} · {usta.city}
          </div>
        </div>
      </div>

      <div
        className="mono"
        style={{
          fontSize: "10px",
          letterSpacing: "0.08em",
          color: "var(--ink-3)",
          borderTop: "1px solid var(--line)",
          paddingTop: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>{stats}</span>
        <span style={{ color: "var(--brand-1)", whiteSpace: "nowrap" }}>
          البروفايل ←
        </span>
      </div>
    </Link>
  );
}
