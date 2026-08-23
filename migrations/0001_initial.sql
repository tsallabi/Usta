-- أسطى (Usta) — initial schema for Cloudflare D1
-- Apply once, then keep additive migrations numbered 0002, 0003, …
--
-- Usage (local):
--   npx wrangler d1 execute usta-db --local --file=migrations/0001_initial.sql
--
-- Usage (remote):
--   npx wrangler d1 execute usta-db --remote --file=migrations/0001_initial.sql
--
-- Libya reality: phone/WhatsApp is the identity, email is optional.
-- All money columns are Libyan dinar (LYD), whole numbers.

-- ─── Waitlist ──────────────────────────────────────────────────────
-- Phone-first: normalized Libyan mobile (09XXXXXXXX) is the key.
CREATE TABLE IF NOT EXISTS waitlist (
  phone       TEXT PRIMARY KEY,
  email       TEXT,
  audience    TEXT NOT NULL DEFAULT 'homeowner' CHECK (audience IN ('homeowner', 'tradesman')),
  ip          TEXT,
  ua          TEXT,
  added_at    TEXT NOT NULL DEFAULT (datetime('now')),
  invited_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_waitlist_audience ON waitlist(audience);
CREATE INDEX IF NOT EXISTS idx_waitlist_added_at ON waitlist(added_at);

-- ─── Estimates ────────────────────────────────────────────────────
-- Every AI price estimate is stored anonymously for later analytics
-- (accuracy calibration, service coverage, common failures).
-- No phone, no PII by default — Phase 2A is public and anonymous.
CREATE TABLE IF NOT EXISTS estimates (
  id            TEXT PRIMARY KEY,
  service       TEXT NOT NULL,
  description   TEXT NOT NULL,
  budget_lyd    INTEGER,
  city          TEXT,
  min_lyd       INTEGER NOT NULL,
  max_lyd       INTEGER NOT NULL,
  confidence    TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  source        TEXT NOT NULL CHECK (source IN ('claude', 'fallback')),
  model         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_estimates_service ON estimates(service);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at);

-- ─── Jobs (Phase 2B) ──────────────────────────────────────────────
-- A homeowner posts a job. It carries an estimate id when the flow started
-- from /estimate. Status transitions: draft -> open -> matched -> in_progress
-- -> completed | cancelled | disputed.
-- customer_phone is the identity; customer_email is optional.
-- city is one of the market cities; area is free text (حي/منطقة).
CREATE TABLE IF NOT EXISTS jobs (
  id             TEXT PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  service        TEXT NOT NULL,
  description    TEXT NOT NULL,
  budget_lyd     INTEGER,
  city           TEXT,
  area           TEXT,
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'open', 'matched', 'in_progress',
                                     'completed', 'cancelled', 'disputed')),
  estimate_id    TEXT REFERENCES estimates(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_phone ON jobs(customer_phone);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_service ON jobs(service);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);

-- ─── Tradesmen (Phase 2C) ─────────────────────────────────────────
-- Tradesman (أسطى) profiles with Libya-appropriate verification:
-- national id + WhatsApp + city + experience + previous work description.
-- Verification is manual (a human calls / checks) before any job is sent.
-- whatsapp is the unique identity; email is optional.
CREATE TABLE IF NOT EXISTS tradesmen (
  id                  TEXT PRIMARY KEY,
  whatsapp            TEXT UNIQUE NOT NULL,
  email               TEXT,
  full_name           TEXT NOT NULL,
  trade               TEXT NOT NULL,
  city                TEXT NOT NULL,
  service_area        TEXT NOT NULL,
  national_id         TEXT NOT NULL,
  years_experience    INTEGER,
  previous_work       TEXT,
  verified_at         TEXT,
  suspended_at        TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tradesmen_trade ON tradesmen(trade);
CREATE INDEX IF NOT EXISTS idx_tradesmen_city ON tradesmen(city);
CREATE INDEX IF NOT EXISTS idx_tradesmen_verified ON tradesmen(verified_at);

-- ─── Offers (Phase 2C) ────────────────────────────────────────────
-- A tradesman's bid on an open job.
CREATE TABLE IF NOT EXISTS offers (
  id            TEXT PRIMARY KEY,
  job_id        TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tradesman_id  TEXT NOT NULL REFERENCES tradesmen(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'countered',
                                    'declined', 'withdrawn')),
  price_lyd     INTEGER NOT NULL,
  message       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_offers_job_id ON offers(job_id);
CREATE INDEX IF NOT EXISTS idx_offers_tradesman_id ON offers(tradesman_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- ─── Ratings (Phase 2D) ───────────────────────────────────────────
-- Two-sided ratings on 4-5 dimensions each.
CREATE TABLE IF NOT EXISTS ratings (
  id                 TEXT PRIMARY KEY,
  job_id             TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  rater              TEXT NOT NULL CHECK (rater IN ('customer', 'tradesman')),
  punctuality        INTEGER CHECK (punctuality BETWEEN 1 AND 5),
  quality            INTEGER CHECK (quality BETWEEN 1 AND 5),
  price_adherence    INTEGER CHECK (price_adherence BETWEEN 1 AND 5),
  professionalism    INTEGER CHECK (professionalism BETWEEN 1 AND 5),
  communication      INTEGER CHECK (communication BETWEEN 1 AND 5),
  description_accuracy INTEGER CHECK (description_accuracy BETWEEN 1 AND 5),
  payment            INTEGER CHECK (payment BETWEEN 1 AND 5),
  access             INTEGER CHECK (access BETWEEN 1 AND 5),
  respectful         INTEGER CHECK (respectful BETWEEN 1 AND 5),
  written_review     TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ratings_job_id ON ratings(job_id);
