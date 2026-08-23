-- 0003 — السماح بمصدر 'gemini' في جدول التقديرات.
--
-- SQLite لا يسمح بتعديل قيود CHECK، فنعيد بناء الجدول. الجدول تحليلي
-- فقط (بدون بيانات شخصية) وفارغ قبل الإطلاق، فإعادة البناء آمنة.
--
-- ينفَّذ مرة واحدة في D1 Console على قاعدة سبق تطبيق 0001 عليها.
-- التنصيبات الجديدة لا تحتاجه (0001 محدَّث أصلاً).

PRAGMA defer_foreign_keys = on;

DROP TABLE IF EXISTS estimates;

CREATE TABLE estimates (
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
