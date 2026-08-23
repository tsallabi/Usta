/**
 * كتالوج الخدمات المستخدم في مسار التقدير. ملف واحد حتى تبقى الفورم
 * والـ API ولوحة الأدمن متزامنة.
 *
 * الأسعار أدناه نطاقات تقريبية للسوق الليبي (طرابلس/بنغازي/مصراتة) في 2026
 * بالدينار الليبي — تُستخدم كـ fallback عندما يكون مفتاح Anthropic غير
 * مفعّل. التقدير الحقيقي يجي من Claude.
 *
 * ملاحظة: الـ slugs تبقى بالإنجليزي (ثابتة في قاعدة البيانات والروابط)؛
 * الأسماء والأوصاف فقط بالعربي.
 */

export type ServiceCategory = {
  slug: string;
  name: string;
  description: string;
  gradient:
    | "blue"
    | "teal"
    | "orange"
    | "plum"
    | "forest"
    | "rose"
    | "slate"
    | "ochre"
    | "sky";
  icon:
    | "bolt"
    | "wrench"
    | "flame"
    | "broom"
    | "paint"
    | "leaf"
    | "truck"
    | "box"
    | "send";
  fallbackRange: { min: number; max: number };
};

export const services: ServiceCategory[] = [
  {
    slug: "electrician",
    name: "كهربائي",
    description: "أفياش، قواطع، إضاءة، تمديدات، أعطال كهرباء",
    gradient: "blue",
    icon: "bolt",
    fallbackRange: { min: 30, max: 150 },
  },
  {
    slug: "plumber",
    name: "سبّاك",
    description: "تسريبات، حنفيات، سخانات، ضغط الماء، مجاري",
    gradient: "teal",
    icon: "wrench",
    fallbackRange: { min: 30, max: 150 },
  },
  {
    slug: "heating",
    name: "تكييف وغاز",
    description: "صيانة مكيفات، تعبئة فريون، تركيب، تمديدات غاز",
    gradient: "orange",
    icon: "flame",
    fallbackRange: { min: 50, max: 250 },
  },
  {
    slug: "cleaning",
    name: "تنظيف",
    description: "تنظيف شامل، بعد الإخلاء، مرة وحدة أو دوري",
    gradient: "plum",
    icon: "broom",
    fallbackRange: { min: 50, max: 300 },
  },
  {
    slug: "painter",
    name: "دهان",
    description: "داخلي وخارجي، رتوش صغيرة إلى بيوت كاملة",
    gradient: "rose",
    icon: "paint",
    fallbackRange: { min: 200, max: 1500 },
  },
  {
    slug: "gardener",
    name: "بستنة",
    description: "عشب، أشجار، تشذيب، ترتيب موسمي للحوش",
    gradient: "forest",
    icon: "leaf",
    fallbackRange: { min: 30, max: 150 },
  },
  {
    slug: "removals",
    name: "نقل أثاث",
    description: "نقل شقة صغيرة أو بيت كامل مع عمّال",
    gradient: "slate",
    icon: "truck",
    fallbackRange: { min: 100, max: 500 },
  },
  {
    slug: "assembly",
    name: "تركيب أثاث",
    description: "أثاث جاهز التركيب، رفوف، خزائن، تخزين",
    gradient: "ochre",
    icon: "box",
    fallbackRange: { min: 30, max: 120 },
  },
  {
    slug: "delivery",
    name: "توصيل",
    description: "استلام وتوصيل نفس اليوم — طرود، أثاث، أجهزة",
    gradient: "sky",
    icon: "send",
    fallbackRange: { min: 10, max: 80 },
  },
];

export function findService(slug: string): ServiceCategory | undefined {
  return services.find((s) => s.slug === slug);
}
