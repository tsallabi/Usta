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
CREATE TABLE IF NOT EXISTS estimates (
  id            TEXT PRIMARY KEY,
  service       TEXT NOT NULL,
  description   TEXT NOT NULL,
  budget_lyd    INTEGER,
  city          TEXT,
  min_lyd       INTEGER NOT NULL,
  max_lyd       INTEGER NOT NULL,
  confidence    TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  source        TEXT NOT NULL CHECK (source IN ('gemini', 'claude', 'fallback')),
  model         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_estimates_service ON estimates(service);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at);
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
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,          
  full_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,              
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
