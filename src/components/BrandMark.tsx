/**
 * علامة توّا (Tawwa) — اللوجو.
 *
 * الفكرة: شيفرون مزدوج متجه يساراً (اتجاه "التقديم السريع" في واجهة
 * عربية RTL) داخل مربع زمردي متدرّج — السرعة والفورية. النقطة الكهرمانية
 * فوق = شدّة «توّا» وشرارة الطاقة. الأثر الخلفي شبه شفاف = حركة.
 *
 * تُستخدم في كل رؤوس الصفحات؛ نفس الرسمة في أيقونة المتصفح (app/icon.svg)
 * وفي صفحة الهبوط الثابتة.
 */

export function BrandMark({ size = 46 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      style={{ flexShrink: 0, display: "block" }}
    >
      <defs>
        <linearGradient id="tawwa-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#0B7F58" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="13" fill="url(#tawwa-g)" />
      {/* أثر الحركة (شيفرون خلفي باهت) */}
      <path
        d="M33 14 L23 24 L33 34"
        fill="none"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      {/* الشيفرون الأمامي */}
      <path
        d="M24 14 L14 24 L24 34"
        fill="none"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* شدّة «توّا» — شرارة كهرمانية */}
      <circle cx="37.5" cy="11" r="4" fill="#E6A429" />
    </svg>
  );
}
