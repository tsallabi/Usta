/**
 * مساعدات بروفايل الأسطى — مشتركة بين الدليل (client) وصفحة
 * البروفايل (server). بدون "use client" عمداً حتى تصلح للجهتين.
 *
 * تدرجات الأفاتار = نفس عائلة تدرجات الخدمات في EstimateWizard،
 * تدور بالترتيب في الدليل وتُثبَّت بالـ id في البروفايل.
 */

export const avatarGradients: string[] = [
  "linear-gradient(140deg, #2A4A7F, #1F3966)", // blue
  "linear-gradient(140deg, #14876C, #0B6350)", // teal
  "linear-gradient(140deg, #E67E3B, #C55A1E)", // orange
  "linear-gradient(140deg, #6B3D7D, #4B2A5B)", // plum
  "linear-gradient(140deg, #DE5F6D, #B23F4E)", // rose
  "linear-gradient(140deg, #4A7346, #2E5030)", // forest
  "linear-gradient(140deg, #4A5C6E, #2E3D4F)", // slate
  "linear-gradient(140deg, #C99A3E, #A67824)", // ochre
  "linear-gradient(140deg, #3B7EA1, #256380)", // sky
];

/** تدرج بالترتيب (لبطاقات الدليل). */
export function gradientByIndex(index: number): string {
  return avatarGradients[index % avatarGradients.length];
}

/** تدرج ثابت مشتق من الـ id (لصفحة البروفايل — نفس اللون في كل زيارة). */
export function gradientById(id: string): string {
  let acc = 0;
  for (let i = 0; i < id.length; i++) acc = (acc + id.charCodeAt(i)) % 9973;
  return avatarGradients[acc % avatarGradients.length];
}

/** أول حرف من أول كلمتين في الاسم — "محمد الفيتوري" ← "م ا". */
export function initialsOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "أ";
  const first = words[0].charAt(0);
  const second = words.length > 1 ? words[1].charAt(0) : "";
  return second ? `${first} ${second}` : first;
}

/** الاسم الأول فقط — للنداء الودّي في الـ CTA. */
export function firstNameOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  return words[0] ?? fullName;
}

/** سنة الانضمام من طابع created_at. */
export function joinYearOf(createdAt: string): string {
  return createdAt.slice(0, 4);
}

/** ✓ موثّق — الحبة الزمردية المشتركة بين الدليل والبروفايل. */
export function VerifiedPill({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span
      className="mono"
      style={{
        display: "inline-block",
        padding: size === "lg" ? "5px 14px" : "3px 10px",
        borderRadius: "999px",
        background: "rgba(16,185,129,0.12)",
        color: "var(--brand-1)",
        fontSize: size === "lg" ? "11px" : "10px",
        letterSpacing: "0.08em",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      ✓ موثّق
    </span>
  );
}
