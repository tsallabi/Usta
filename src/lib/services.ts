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
  /** سطر أجواء الخدمة تحت العنوان في خطوة الوصف — كل خدمة بلسانها. */
  describeHint: string;
  /** مثال placeholder حقيقي بلهجة ليبية يخص هذي الخدمة تحديداً. */
  placeholder: string;
};

export const services: ServiceCategory[] = [
  {
    slug: "electrician",
    name: "كهربائي",
    description: "بريزات، قواطع، إضاءة، تمديدات، أعطال كهرباء",
    gradient: "blue",
    icon: "bolt",
    fallbackRange: { min: 30, max: 150 },
    describeHint: "شن العطل؟ وين في الحوش؟ ومن وقتاش بادي؟",
    placeholder:
      "مثال: بريزتين في الكوشينة ما عادش يشتغلو من بعد ما طاحت الكهرباء. رجّعنا القاطع وما نفعش.",
  },
  {
    slug: "plumber",
    name: "سبّاك",
    description: "تسريبات، حنفيات، سخانات، ضغط الماء، مجاري",
    gradient: "teal",
    icon: "wrench",
    fallbackRange: { min: 30, max: 150 },
    describeHint: "وين التسريب أو المشكلة؟ والماء واصل وإلا مقطوع؟",
    placeholder:
      "مثال: الحنفية متاع الكوشينة تقطر طول الليل، والماء بدا يوصل للجيران اللي تحتنا.",
  },
  {
    slug: "heating",
    name: "تكييف وغاز",
    description: "صيانة مكيفات، تعبئة فريون، تركيب، تمديدات غاز",
    gradient: "orange",
    icon: "flame",
    fallbackRange: { min: 50, max: 250 },
    describeHint: "المكيف شن نوعه؟ يبرّد ضعيف وإلا واقف خالص؟",
    placeholder:
      "مثال: المكيف متاع الصالة ما عادش يبرّد كيف الأول، ويقطر ماء من الوحدة الداخلية.",
  },
  {
    slug: "cleaning",
    name: "تنظيف",
    description: "تنظيف شامل، بعد الإخلاء، مرة وحدة أو دوري",
    gradient: "plum",
    icon: "broom",
    fallbackRange: { min: 50, max: 300 },
    describeHint: "شقة وإلا حوش؟ كم غرفة؟ تنظيف عادي وإلا شامل؟",
    placeholder:
      "مثال: نبي تنظيف شامل لشقة غرفتين وصالة قبل ما نسكنو فيها — فيها غبرة صبغ من الدهان.",
  },
  {
    slug: "painter",
    name: "دهان",
    description: "داخلي وخارجي، رتوش صغيرة إلى بيوت كاملة",
    gradient: "rose",
    icon: "paint",
    fallbackRange: { min: 200, max: 1500 },
    describeHint: "كم غرفة أو جدار؟ والدهان القديم حالته كيف؟",
    placeholder:
      "مثال: نبي ندهنو صالة وممر، الجدران فيها تشققات صغيرة تحتاج معجون قبل الصبغ.",
  },
  {
    slug: "gardener",
    name: "بستنة",
    description: "عشب، أشجار، تشذيب، ترتيب موسمي للحوش",
    gradient: "forest",
    icon: "leaf",
    fallbackRange: { min: 30, max: 150 },
    describeHint: "حجم الجنينة تقريباً؟ وشن الشغل — قص، تقليم، ترتيب؟",
    placeholder:
      "مثال: جنينة الحوش صغيرة، نبو قص العشب وتقليم شجرتين زيتون وترتيب عام.",
  },
  {
    slug: "removals",
    name: "نقل أثاث",
    description: "نقل شقة صغيرة أو بيت كامل مع عمّال",
    gradient: "slate",
    icon: "truck",
    fallbackRange: { min: 100, max: 500 },
    describeHint: "من وين لوين؟ كم غرفة عفش؟ وفيه أصنصير وإلا درج؟",
    placeholder:
      "مثال: نقل عفش شقة غرفتين من قرقارش لتاجوراء — فيه غسالة وثلاجة، والشقة في الدور الثالث بدون أصنصير.",
  },
  {
    slug: "assembly",
    name: "تركيب أثاث",
    description: "أثاث جاهز التركيب، رفوف، خزائن، تخزين",
    gradient: "ochre",
    icon: "box",
    fallbackRange: { min: 30, max: 120 },
    describeHint: "شن القطعة اللي تبي تركيبها؟ وجاية مفككة في كراتين؟",
    placeholder:
      "مثال: غرفة نوم جديدة وصلت مفككة — سرير ودولاب 6 أبواب وتسريحة، نبو حد يركبها.",
  },
  {
    slug: "delivery",
    name: "توصيل",
    description: "استلام وتوصيل نفس اليوم — طرود، أثاث، أجهزة",
    gradient: "sky",
    icon: "send",
    fallbackRange: { min: 10, max: 80 },
    describeHint: "من وين نستلمو؟ لوين نوصلو؟ وشن الغرض وحجمه؟",
    placeholder:
      "مثال: نبي توصيل ثلاجة من محل في سوق الجمعة لحوشنا في عين زارة — الدور الأرضي، اليوم لو أمكن.",
  },
];

export function findService(slug: string): ServiceCategory | undefined {
  return services.find((s) => s.slug === slug);
}
