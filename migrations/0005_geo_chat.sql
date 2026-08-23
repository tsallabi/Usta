-- 0005 — الخريطة والدردشة:
--   1) إحداثيات الأسطى (اختيارية — من زر «حدد موقعي» في التسجيل)
--   2) جدول رسائل الدردشة داخل المنصة (خصوصية: بدون تبادل أرقام)
--
-- طريقة التطبيق: انسخ المحتوى في D1 Console (usta-db).
-- لو ظهر "duplicate column name" فالعمود مطبَّق من قبل — تجاهل وكمّل.

ALTER TABLE tradesmen ADD COLUMN lat REAL;
ALTER TABLE tradesmen ADD COLUMN lng REAL;

-- دردشة الطلب: تفتح فقط بعد قبول عرض (زبون ↔ الأسطى المقبول).
CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  job_id      TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender      TEXT NOT NULL CHECK (sender IN ('customer', 'tradesman')),
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_job ON messages(job_id, created_at);
