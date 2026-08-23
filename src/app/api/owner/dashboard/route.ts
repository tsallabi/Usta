import { NextResponse } from "next/server";
import { getDb, getKv, getEnvVar } from "@/lib/db";
import { requireOwner } from "@/lib/owner";

export const runtime = "edge";

/**
 * GET /api/owner/dashboard — كل بيانات لوحة المالك في نداء واحد:
 * الطلبات، العروض، التقييمات، سلاسل النمو اليومية، المدن، قائمة
 * الانتظار، وصحة النظام. للمالك فقط (OWNER_KEY).
 */

type JobRow = {
  id: string;
  service: string;
  city: string | null;
  status: string;
  customer_phone: string;
  created_at: string;
  est_min: number | null;
  est_max: number | null;
  offers_count: number;
  accepted_price: number | null;
};

type OfferRow = {
  id: string;
  price_lyd: number;
  status: string;
  created_at: string;
  tradesman_name: string | null;
  trade: string | null;
  service: string | null;
  city: string | null;
};

type RatingRow = {
  id: string;
  created_at: string;
  written_review: string | null;
  punctuality: number | null;
  quality: number | null;
  price_adherence: number | null;
  professionalism: number | null;
  communication: number | null;
  service: string;
  tradesman_name: string | null;
};

type DayRow = { d: string; n: number };
type CityRow = { city: string | null; n: number };

type WaitlistEntry = {
  phone: string;
  email: string | null;
  audience: string;
  added_at: string | null;
};

export async function GET(request: Request) {
  const auth = requireOwner(request);
  if (!auth.ok) return auth.response;

  const db = getDb();
  const kv = getKv("WAITLIST");

  const health = {
    db: Boolean(db),
    waitlistKv: Boolean(kv),
    gemini: Boolean(getEnvVar("GEMINI_API_KEY")),
    claude: Boolean(getEnvVar("ANTHROPIC_API_KEY")),
    authSecret: (getEnvVar("AUTH_SECRET")?.length ?? 0) >= 16,
    adminKey: (getEnvVar("ADMIN_KEY")?.length ?? 0) >= 12,
    ownerKey: true,
    resend: Boolean(getEnvVar("RESEND_API_KEY")),
  };

  // قائمة الانتظار من KV — تدهور سلس لو غير مربوطة
  let waitlist: WaitlistEntry[] = [];
  if (kv) {
    try {
      let cursor: string | undefined;
      for (let page = 0; page < 2; page++) {
        const listed = await kv.list<{
          audience?: string;
          added_at?: string;
          email?: string | null;
        }>({ prefix: "wl:", limit: 1000, cursor });
        for (const key of listed.keys) {
          waitlist.push({
            phone: key.name.slice(3),
            email: key.metadata?.email ?? null,
            audience: key.metadata?.audience ?? "homeowner",
            added_at: key.metadata?.added_at ?? null,
          });
        }
        if (listed.list_complete) break;
        cursor = listed.cursor;
      }
      waitlist.sort((a, b) =>
        (b.added_at ?? "").localeCompare(a.added_at ?? "")
      );
      waitlist = waitlist.slice(0, 300);
    } catch (err) {
      console.error("[owner/dashboard] KV list failed:", err);
    }
  }

  if (!db) {
    return NextResponse.json(
      {
        ok: true,
        dbBound: false,
        health,
        waitlist,
        jobs: [],
        offers: [],
        ratings: [],
        growth: { jobs: [], users: [], acceptedOffers: [] },
        cities: [],
      },
      { status: 200 }
    );
  }

  try {
    const [jobs, offers, ratings, gJobs, gUsers, gAccepted, cities] =
      await Promise.all([
        db
          .prepare(
            `SELECT j.id, j.service, j.city, j.status, j.customer_phone, j.created_at,
                    e.min_lyd AS est_min, e.max_lyd AS est_max,
                    (SELECT COUNT(*) FROM offers o WHERE o.job_id = j.id) AS offers_count,
                    (SELECT o.price_lyd FROM offers o WHERE o.job_id = j.id AND o.status = 'accepted' LIMIT 1) AS accepted_price
               FROM jobs j
               LEFT JOIN estimates e ON e.id = j.estimate_id
              ORDER BY j.created_at DESC
              LIMIT 150`
          )
          .all<JobRow>(),
        db
          .prepare(
            `SELECT o.id, o.price_lyd, o.status, o.created_at,
                    t.full_name AS tradesman_name, t.trade,
                    j.service, j.city
               FROM offers o
               LEFT JOIN tradesmen t ON t.id = o.tradesman_id
               LEFT JOIN jobs j ON j.id = o.job_id
              ORDER BY o.created_at DESC
              LIMIT 150`
          )
          .all<OfferRow>(),
        db
          .prepare(
            `SELECT r.id, r.created_at, r.written_review,
                    r.punctuality, r.quality, r.price_adherence,
                    r.professionalism, r.communication,
                    j.service,
                    t.full_name AS tradesman_name
               FROM ratings r
               JOIN jobs j ON j.id = r.job_id
               LEFT JOIN offers ao ON ao.job_id = r.job_id AND ao.status = 'accepted'
               LEFT JOIN tradesmen t ON t.id = ao.tradesman_id
              WHERE r.rater = 'customer'
              ORDER BY r.created_at DESC
              LIMIT 100`
          )
          .all<RatingRow>(),
        db
          .prepare(
            `SELECT date(created_at) AS d, COUNT(*) AS n
               FROM jobs
              WHERE created_at >= datetime('now', '-14 days')
              GROUP BY d ORDER BY d`
          )
          .all<DayRow>(),
        db
          .prepare(
            `SELECT date(created_at) AS d, COUNT(*) AS n
               FROM users
              WHERE created_at >= datetime('now', '-14 days')
              GROUP BY d ORDER BY d`
          )
          .all<DayRow>(),
        db
          .prepare(
            `SELECT date(created_at) AS d, COUNT(*) AS n
               FROM offers
              WHERE status = 'accepted'
                AND created_at >= datetime('now', '-14 days')
              GROUP BY d ORDER BY d`
          )
          .all<DayRow>(),
        db
          .prepare(
            `SELECT city, COUNT(*) AS n FROM jobs GROUP BY city ORDER BY n DESC LIMIT 20`
          )
          .all<CityRow>(),
      ]);

    return NextResponse.json(
      {
        ok: true,
        dbBound: true,
        health,
        waitlist,
        jobs: jobs.results ?? [],
        offers: offers.results ?? [],
        ratings: ratings.results ?? [],
        growth: {
          jobs: gJobs.results ?? [],
          users: gUsers.results ?? [],
          acceptedOffers: gAccepted.results ?? [],
        },
        cities: cities.results ?? [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[owner/dashboard] D1 read failed:", err);
    return NextResponse.json(
      { ok: false, error: "فشلت قراءة قاعدة البيانات." },
      { status: 500 }
    );
  }
}
