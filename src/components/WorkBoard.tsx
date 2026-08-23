"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { findService } from "@/lib/services";

/* ─── Types mirroring /api/work/jobs ─────────────────────── */

type MyOffer = {
  id: string;
  price_lyd: number | null;
  status: string | null;
};

type WorkJob = {
  id: string;
  service: string;
  description: string;
  city: string | null;
  area: string | null;
  budget_lyd: number | null;
  est_min_lyd: number | null;
  est_max_lyd: number | null;
  created_at: string;
  offers_count: number;
  my_offer: MyOffer | null;
};

type TradesmanInfo = { full_name: string; trade: string; city: string };

type View =
  | { kind: "loading" }
  | { kind: "not_logged" }
  | { kind: "not_tradesman" }
  | { kind: "not_verified" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      tradesman: TradesmanInfo;
      jobs: WorkJob[];
      acceptedCount: number;
      avgRating: number | null;
      ratingsCount: number;
    };

const offerStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  accepted: "مقبول",
  countered: "عرض مضاد",
  declined: "مرفوض",
  withdrawn: "مسحوب",
};

function offerStatusColor(status: string): string {
  if (status === "accepted") return "var(--brand-1)";
  if (status === "declined" || status === "withdrawn") return "var(--coral)";
  return "var(--amber)";
}

/* ─── Board ──────────────────────────────────────────────── */

export function WorkBoard() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/work/jobs");
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        error?: string;
        tradesman?: TradesmanInfo;
        acceptedCount?: number;
        avgRating?: number | null;
        ratingsCount?: number;
        jobs?: WorkJob[];
      };
      if (res.status === 401) {
        setView({ kind: "not_logged" });
        return;
      }
      if (res.status === 403 && data.code === "not_tradesman") {
        setView({ kind: "not_tradesman" });
        return;
      }
      if (res.status === 403 && data.code === "not_verified") {
        setView({ kind: "not_verified" });
        return;
      }
      if (data.ok && data.tradesman && Array.isArray(data.jobs)) {
        setView({
          kind: "ready",
          tradesman: data.tradesman,
          jobs: data.jobs,
          acceptedCount:
            typeof data.acceptedCount === "number" ? data.acceptedCount : 0,
          avgRating: typeof data.avgRating === "number" ? data.avgRating : null,
          ratingsCount:
            typeof data.ratingsCount === "number" ? data.ratingsCount : 0,
        });
        return;
      }
      setView({
        kind: "error",
        message: data.error ?? "ما قدرناش نجيبو الطلبات توّا. حاول بعد شوية.",
      });
    } catch {
      setView({ kind: "error", message: "مشكلة في الاتصال. حاول بعد شوية." });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** بعد نجاح تقديم عرض — حدّث بطاقة الطلب محلياً. */
  function onOffered(jobId: string, offerId: string, price: number) {
    setView((v) => {
      if (v.kind !== "ready") return v;
      return {
        ...v,
        jobs: v.jobs.map((j) =>
          j.id === jobId
            ? {
                ...j,
                offers_count: j.offers_count + 1,
                my_offer: { id: offerId, price_lyd: price, status: "pending" },
              }
            : j
        ),
      };
    });
  }

  if (view.kind === "loading") {
    return (
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
        قاعدين نجيبو سوق الشغل…
      </div>
    );
  }

  if (view.kind === "not_logged") {
    return (
      <CtaCard
        title="سجّل دخولك باش تشوف الشغل."
        body="سوق الشغل للأسطوات المسجّلين — سجّل دخولك بنفس رقم واتسابك."
        href="/login"
        cta="تسجيل الدخول ←"
      />
    );
  }

  if (view.kind === "not_tradesman") {
    return (
      <CtaCard
        title="سجّل كأسطى أولاً."
        body="هذه الصفحة للأسطوات — سجّل مهنتك في دقيقتين، وبعد التوثيق تشوف الطلبات المفتوحة في مهنتك."
        href="/tradesmen/join"
        cta="انضم كأسطى ←"
      />
    );
  }

  if (view.kind === "not_verified") {
    return (
      <div
        role="status"
        style={{
          padding: "24px 28px",
          borderRadius: "16px",
          border: "1.5px dashed var(--amber)",
          background: "color-mix(in srgb, var(--amber) 8%, transparent)",
          maxWidth: "560px",
        }}
      >
        <div
          className="serif"
          style={{
            fontSize: "22px",
            color: "var(--ink)",
            lineHeight: 1.35,
            marginBottom: "8px",
          }}
        >
          حسابك قيد التوثيق.
        </div>
        <p
          style={{
            fontSize: "14px",
            color: "var(--ink-2)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          بنتواصل معاك على الواتساب خلال 48 ساعة — أول ما يتوثّق حسابك،
          الطلبات المفتوحة في مهنتك بتظهر هنا.
        </p>
      </div>
    );
  }

  if (view.kind === "error") {
    return (
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
    );
  }

  const { tradesman, jobs, acceptedCount, avgRating, ratingsCount } = view;
  const trade = findService(tradesman.trade);

  return (
    <>
      {/* ترتيبك في السوق — السمعة هي اللي تقدّم عروضك */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "14px",
          background: "var(--paper-2)",
          border: "1px solid var(--line)",
          borderInlineStart: "3px solid var(--brand-1)",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          maxWidth: "680px",
        }}
      >
        <div style={{ flex: "1 1 320px" }}>
          <div
            className="mono"
            style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--brand-1)",
              fontWeight: 600,
              marginBottom: "6px",
            }}
          >
            ترتيبك في السوق
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--ink-2)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            كل شغلة تكملها بتقييم عالي = عروضك تظهر قبل الكل لما أي زبون
            يدوّر على خدمتك. سمعتك هي رأس مالك.
          </p>
          {avgRating != null ? (
            <div
              className="serif"
              style={{
                marginTop: "8px",
                fontSize: "18px",
                color: "var(--amber)",
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              تقييمك ★{avgRating} من {ratingsCount}{" "}
              {ratingsCount === 1 ? "شغلة وحدة" : "شغلة"}
            </div>
          ) : (
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              ما عندكش تقييمات بعد — أول شغلة بتقييم عالي ترفعك فوق الكل.
            </div>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            className="serif"
            style={{
              fontSize: "28px",
              lineHeight: 1.2,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {acceptedCount}
          </div>
          <div
            className="mono"
            style={{
              fontSize: "10px",
              letterSpacing: "0.1em",
              color: "var(--ink-3)",
            }}
          >
            عروضك المقبولة
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
          }}
        >
          {trade?.name ?? tradesman.trade} · {tradesman.city} · {jobs.length}{" "}
          {jobs.length === 1 ? "طلب مفتوح" : "طلبات مفتوحة"}
        </span>
        <button
          type="button"
          onClick={() => void load()}
          className="mono"
          style={{
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--ink-2)",
            padding: "8px 16px",
            borderRadius: "999px",
            fontSize: "11px",
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          {refreshing ? "قاعدين نحدّثو…" : "↻ تحديث"}
        </button>
      </div>

      {jobs.length === 0 && (
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
          ما فيش طلبات مفتوحة في مهنتك توّا — ارجع بعدين أو اضغط تحديث.
        </div>
      )}

      <div style={{ display: "grid", gap: "16px", maxWidth: "680px" }}>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onOffered={onOffered} />
        ))}
      </div>
    </>
  );
}

/* ─── Job card + inline offer form ───────────────────────── */

function JobCard({
  job,
  onOffered,
}: {
  job: WorkJob;
  onOffered: (jobId: string, offerId: string, price: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);

  const service = findService(job.service);
  const description =
    job.description.length > 200
      ? `${job.description.slice(0, 200)}…`
      : job.description;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceNum = Number.parseInt(price, 10);
    if (!Number.isInteger(priceNum) || priceNum < 5 || priceNum > 100000) {
      setError("أدخل سعراً صحيحاً بين 5 و100000 د.ل.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          price: priceNum,
          message: message.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };
      if (data.ok && data.id) {
        setJustSent(true);
        setOpen(false);
        onOffered(job.id, data.id, priceNum);
      } else {
        setError(data.error ?? "صار خطأ أثناء إرسال عرضك. حاول مرة ثانية.");
      }
    } catch {
      setError("مشكلة في الاتصال. حاول مرة ثانية.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      style={{
        padding: "20px 24px",
        border: "1px solid var(--line)",
        borderRadius: "16px",
        background: "var(--paper-2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <span
          className="serif"
          style={{
            fontSize: "20px",
            color: "var(--ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {service?.name ?? job.service}
        </span>
        <span
          className="mono"
          style={{
            fontSize: "10px",
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
          }}
        >
          {job.created_at.slice(0, 10)}
          {job.city ? ` · ${job.city}` : ""}
          {job.area ? ` · ${job.area}` : ""}
        </span>
      </div>

      <p
        style={{
          fontSize: "14px",
          color: "var(--ink-2)",
          lineHeight: 1.55,
          margin: "0 0 14px",
        }}
      >
        {description}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <span className="serif" style={{ fontSize: "16px", color: "var(--ink)" }}>
          {typeof job.budget_lyd === "number" &&
            `الميزانية: ${job.budget_lyd} د.ل`}
          {typeof job.budget_lyd !== "number" && "الميزانية: غير محددة"}
        </span>
        <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {typeof job.est_min_lyd === "number" &&
            typeof job.est_max_lyd === "number" && (
              <span
                className="mono"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  color: "var(--brand-1)",
                  background: "rgba(16,185,129,0.12)",
                  borderRadius: "999px",
                  padding: "4px 12px",
                }}
              >
                تقدير الذكاء: {job.est_min_lyd}–{job.est_max_lyd} د.ل
              </span>
            )}
          <span
            className="mono"
            style={{
              fontSize: "10px",
              letterSpacing: "0.08em",
              color: "var(--ink-3)",
              border: "1px solid var(--line)",
              borderRadius: "999px",
              padding: "4px 12px",
            }}
          >
            {job.offers_count === 0
              ? "بدون عروض"
              : job.offers_count === 1
                ? "عرض واحد"
                : `${job.offers_count} عروض`}
          </span>
        </span>
      </div>

      {/* حالة عرضي / زر تقديم عرض */}
      {justSent ? (
        <div
          role="status"
          className="mono"
          style={{
            fontSize: "12px",
            letterSpacing: "0.06em",
            color: "var(--brand-1)",
            border: "1px solid var(--brand-1)",
            borderRadius: "12px",
            padding: "12px 16px",
          }}
        >
          تم إرسال عرضك ✓ — بنبلغك أول ما يرد الزبون.
        </div>
      ) : job.my_offer ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span className="serif" style={{ fontSize: "17px", color: "var(--ink)" }}>
            عرضك: {job.my_offer.price_lyd ?? "—"} د.ل
          </span>
          <span
            className="mono"
            style={{
              fontSize: "10px",
              letterSpacing: "0.1em",
              color: offerStatusColor(job.my_offer.status ?? "pending"),
              border: `1px solid ${offerStatusColor(job.my_offer.status ?? "pending")}`,
              borderRadius: "999px",
              padding: "4px 12px",
            }}
          >
            {offerStatusLabels[job.my_offer.status ?? "pending"] ??
              job.my_offer.status}
          </span>
        </div>
      ) : open ? (
        <form onSubmit={submit} style={{ display: "grid", gap: "10px" }}>
          <label
            htmlFor={`offer-price-${job.id}`}
            style={{ position: "absolute", insetInlineStart: "-9999px" }}
          >
            سعرك بالدينار
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              id={`offer-price-${job.id}`}
              type="number"
              inputMode="numeric"
              min={5}
              max={100000}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="سعرك — د.ل"
              required
              style={{
                flex: "1 1 140px",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid var(--line)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontSize: "15px",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <label
            htmlFor={`offer-msg-${job.id}`}
            style={{ position: "absolute", insetInlineStart: "-9999px" }}
          >
            رسالة للزبون (اختياري)
          </label>
          <textarea
            id={`offer-msg-${job.id}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="رسالة قصيرة للزبون (اختياري) — خبرتك، متى تقدر تبدأ…"
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "14px",
              fontFamily: "inherit",
              lineHeight: 1.55,
              resize: "vertical",
              outline: "none",
            }}
          />
          {error && (
            <p
              role="alert"
              className="mono"
              style={{
                fontSize: "12px",
                color: "var(--coral)",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "12px 24px",
                borderRadius: "999px",
                border: 0,
                background:
                  "linear-gradient(135deg, var(--brand-2), var(--brand-1))",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: busy ? "wait" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? "قاعدين نرسلو عرضك…" : "أرسل العرض"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              style={{
                padding: "12px 20px",
                borderRadius: "999px",
                border: "1px solid var(--line)",
                background: "transparent",
                color: "var(--ink-2)",
                fontSize: "13px",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: "12px 24px",
            borderRadius: "999px",
            border: 0,
            background: "linear-gradient(135deg, var(--navy-2), var(--navy-1))",
            color: "var(--paper)",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          قدّم عرضك
        </button>
      )}
    </article>
  );
}

/* ─── CTA card (not logged / not tradesman) ──────────────── */

function CtaCard({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div
      style={{
        padding: "32px 28px",
        border: "1px dashed var(--line)",
        borderRadius: "16px",
        background: "var(--paper-2)",
        maxWidth: "560px",
      }}
    >
      <div
        className="serif"
        style={{
          fontSize: "22px",
          color: "var(--ink)",
          lineHeight: 1.35,
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontSize: "14px",
          color: "var(--ink-2)",
          lineHeight: 1.55,
          margin: "0 0 18px",
        }}
      >
        {body}
      </p>
      <Link
        href={href}
        style={{
          display: "inline-block",
          padding: "12px 24px",
          borderRadius: "999px",
          background: "linear-gradient(135deg, var(--navy-2), var(--navy-1))",
          color: "var(--paper)",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
