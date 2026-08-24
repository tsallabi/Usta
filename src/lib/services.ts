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
    | "sky"
    | "walnut"
    | "iron"
    | "indigo"
    | "crimson"
    | "night"
    | "royal"
    | "grape"
    | "clay"
    | "petrol"
    | "silver"
    | "midnight";
  icon:
    | "bolt"
    | "wrench"
    | "flame"
    | "broom"
    | "paint"
    | "leaf"
    | "truck"
    | "box"
    | "send"
    | "saw"
    | "hammer"
    | "key"
    | "gear"
    | "tire"
    | "calc"
    | "book"
    | "tiles"
    | "washer"
    | "window"
    | "camera";
  fallbackRange: { min: number; max: number };
  /** سطر أجواء الخدمة تحت العنوان في خطوة الوصف — كل خدمة بلسانها. */
  describeHint: string;
  /** مثال placeholder حقيقي بلهجة ليبية يخص هذي الخدمة تحديداً. */
  placeholder: string;
  /** شريك خارجي في منظومتنا يخص هذي الخدمة (مثل أجرلي للإيجارات). */
  partner?: { label: string; url: string };
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
    description: "تسريبات، شيشمات، سخانات، ضغط الماء، مجاري",
    gradient: "teal",
    icon: "wrench",
    fallbackRange: { min: 30, max: 150 },
    describeHint: "وين التسريب أو المشكلة؟ والماء واصل وإلا مقطوع؟",
    placeholder:
      "مثال: الشيشمة متاع الكوشينة تقطر طول الليل، والماء بدا يوصل للجيران اللي تحتنا.",
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
    slug: "carpenter",
    name: "نجّار",
    description: "أبواب، كوشينات، دواليب، تصليحات خشب",
    gradient: "walnut",
    icon: "saw",
    fallbackRange: { min: 50, max: 400 },
    describeHint: "شن شغل النجارة؟ باب، كوشينة، دولاب، وإلا تصليح؟",
    placeholder:
      "مثال: باب غرفة النوم نشب وما عادش يسكّر مليح، ونبو رف جديد في الكوشينة فوق الفرن.",
  },
  {
    slug: "blacksmith",
    name: "حدّاد",
    description: "أبواب حديد، شبابيك، بوابات، سياج، لحام",
    gradient: "iron",
    icon: "hammer",
    fallbackRange: { min: 80, max: 600 },
    describeHint: "شغل جديد وإلا تصليح؟ والقياسات تقريباً شن هي؟",
    placeholder:
      "مثال: نبو باب حوش حديد بقياس 3 متر مع بوابة صغيرة للمشاة، والشباك القديم صدّى ويحتاج لحام.",
  },
  {
    slug: "mechanic",
    name: "ميكانيكي",
    description: "صيانة سيارات · فحص كمبيوتر · كهرباء سيارة",
    gradient: "crimson",
    icon: "gear",
    fallbackRange: { min: 50, max: 500 },
    describeHint: "شن نوع السيارة؟ وشن العطل اللي حاسّه فيها؟",
    placeholder:
      "مثال: كورولا 2015 تسخّن في الزحمة والمروحة ما تدورش — نبي حد يشوفها في مكانها لو أمكن.",
  },
  {
    slug: "tires",
    name: "عجلاتي",
    description: "بنشر · ميزان · تبديل عجلات — يجيك وين ما كنت",
    gradient: "night",
    icon: "tire",
    fallbackRange: { min: 20, max: 150 },
    describeHint: "وين واقف؟ وشن صار في العجلة بالضبط؟",
    placeholder:
      "مثال: بنشر في الطريق السريع جنب جسر المطار — نبي عجلاتي يجيني توّا يبدّللي العجلة.",
  },
  {
    slug: "appliance",
    name: "صيانة أجهزة",
    description: "غسالات · ثلاجات · أفران ومكانس",
    gradient: "petrol",
    icon: "washer",
    fallbackRange: { min: 40, max: 300 },
    describeHint: "شن الجهاز ونوعه؟ وشن العيب اللي بان عليه؟",
    placeholder:
      "مثال: الغسالة الأتوماتيك تعبي ماء وما تدورش — LG عمرها 4 سنين.",
  },
  {
    slug: "tiler",
    name: "بلّاط",
    description: "سيراميك · بورسلين · رخام",
    gradient: "clay",
    icon: "tiles",
    fallbackRange: { min: 300, max: 3000 },
    describeHint: "كم متر تقريباً؟ وشن نوع البلاط؟",
    placeholder:
      "مثال: نبي تبليط صالة وممر حوالي 60 متر بورسلين — البلاط موجود، نبي المصنعية بس.",
  },
  {
    slug: "aluminum",
    name: "ألمنيوم",
    description: "شبابيك · أبواب · مطابخ ألمنيوم",
    gradient: "silver",
    icon: "window",
    fallbackRange: { min: 200, max: 2500 },
    describeHint: "شن تبي تركّب؟ والقياسات لو عندك؟",
    placeholder:
      "مثال: نبي 4 شبابيك ألمنيوم بقياس 120×140 مع ناموسية، وباب لبلكونة.",
  },
  {
    slug: "cctv",
    name: "كاميرات وأمان",
    description: "كاميرات مراقبة · إنذار · إنتركم",
    gradient: "midnight",
    icon: "camera",
    fallbackRange: { min: 150, max: 1500 },
    describeHint: "كم كاميرا تقريباً؟ لحوش ولا محل؟",
    placeholder:
      "مثال: نبي 4 كاميرات لمحل مع شاشة وتسجيل، ونقدر نشوفهم من الهاتف.",
  },
  {
    slug: "accountant",
    name: "محاسب",
    description: "حسابات محلات · إقرارات · ميزانيات",
    gradient: "royal",
    icon: "calc",
    fallbackRange: { min: 100, max: 1000 },
    describeHint: "شغلك شن نوعه — محل، شركة صغيرة؟ وشن تحتاج بالضبط؟",
    placeholder:
      "مثال: عندي محل ملابس ونبي محاسب يرتبلي الدفاتر ويجهزلي حساب شهري.",
  },
  {
    slug: "tutor",
    name: "دروس ودورات",
    description: "دروس خصوصية · لغات · كمبيوتر ودورات",
    gradient: "grape",
    icon: "book",
    fallbackRange: { min: 100, max: 800 },
    describeHint: "شن المادة أو الدورة؟ ولمن — طالب وإلا موظف؟",
    placeholder:
      "مثال: نبي مدرّس رياضيات لولدي في الشهادة الإعدادية، درسين في الأسبوع في الحوش.",
  },
  {
    slug: "rentals",
    name: "إيجارات",
    description: "شقق، أحواش، محلات — من الملّاك والمندوبين مباشرة",
    gradient: "indigo",
    icon: "key",
    fallbackRange: { min: 300, max: 2500 },
    describeHint: "شن تدوّر — شقة، حوش، محل؟ وين؟ وبكم ميزانيتك الشهرية؟",
    placeholder:
      "مثال: ندوّر شقة غرفتين وصالة في تاجوراء أو عين زارة، مفروشة لو أمكن، بميزانية 1500 دينار في الشهر.",
    partner: {
      label: "شوف العقارات المعروضة توّا على أجرلي",
      url: "https://ajr.ly",
    },
  },
  {
    slug: "delivery",
    name: "توصيل",
    description: "طرود · بضائع · مشاوير أشخاص · مياه وغاز — نفس اليوم",
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
