-- أسطى (Usta) — 0002: user accounts (phone + PIN)
-- Additive migration — do NOT edit 0001. Safe to re-run (IF NOT EXISTS).
--
-- Usage (local):
--   npx wrangler d1 execute usta-db --local --file=migrations/0002_users.sql
--
-- Usage (remote):
--   npx wrangler d1 execute usta-db --remote --file=migrations/0002_users.sql
--
-- Libya reality: the phone number IS the account. No email, no SMS OTP
-- (providers barely cover Libya) — a user-chosen 6-digit PIN instead.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,          -- normalized 09XXXXXXXX
  full_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,              -- PBKDF2-SHA256, format: iterations.saltB64.hashB64
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
