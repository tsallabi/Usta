-- 0004 — أدوات المالك: ترقية الأسطوات + سجل تسديد العمولات
--
-- طريقة التطبيق: انسخ محتوى هذا الملف في D1 Console (قاعدة usta-db).
-- ملاحظة: ALTER TABLE يفشل لو العمود موجود من قبل — لو ظهر خطأ
-- "duplicate column name: featured_at" فهذا طبيعي، تجاهله وكمّل.

-- أسطى مميز (ترقية من المالك): يظهر أولاً في الدليل وبشارة ⭐
ALTER TABLE tradesmen ADD COLUMN featured_at TEXT;

-- سجل تسديد العمولات: الأسطى يحوّل عمولته (كاش/تحويل/موبي كاش…)
-- والمالك يسجّل الدفعة هنا — المستحق = العمولة المحسوبة − المسدَّد.
CREATE TABLE IF NOT EXISTS settlements (
  id            TEXT PRIMARY KEY,
  tradesman_id  TEXT NOT NULL REFERENCES tradesmen(id) ON DELETE CASCADE,
  amount_lyd    INTEGER NOT NULL CHECK (amount_lyd > 0),
  method        TEXT NOT NULL DEFAULT 'cash',
  note          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_settlements_tradesman
  ON settlements(tradesman_id);
