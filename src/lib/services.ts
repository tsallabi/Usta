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
  /** الاسم بالإنجليزية — لوضع اللغة الإنجليزية (LANGUAGE_MODE). */
  nameEn: string;
  description: string;
  /** الوصف بالإنجليزية. */
  descriptionEn: string;
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
    | "midnight"
    | "wine"
    | "violet"
    | "seafoam"
    | "storm"
    | "space"
    | "aqua"
    | "denim"
    | "olive";
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
    | "camera"
    | "scissors"
    | "photo"
    | "heart"
    | "drop"
    | "dish"
    | "car"
    | "comb"
    | "pot";
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
    nameEn: "Electrician",
    description: "بريزات، قواطع، إضاءة، تمديدات، أعطال كهرباء",
    descriptionEn: "Sockets, breakers, lighting, wiring, faults",
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
    nameEn: "Plumber",
    description: "تسريبات، شيشمات، سخانات، ضغط الماء، مجاري",
    descriptionEn: "Leaks, taps, water heaters, pressure, drains",
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
    nameEn: "AC & Gas",
    description: "صيانة مكيفات، تعبئة فريون، تركيب، تمديدات غاز",
    descriptionEn: "AC service, refill, installs, gas lines",
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
    nameEn: "Cleaning",
    description: "تنظيف شامل، بعد الإخلاء، مرة وحدة أو دوري",
    descriptionEn: "Deep cleans, end of tenancy, one-off or regular",
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
    nameEn: "Painter",
    description: "داخلي وخارجي، رتوش صغيرة إلى بيوت كاملة",
    descriptionEn: "Interior & exterior, touch-ups to full homes",
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
    nameEn: "Gardening",
    description: "عشب، أشجار، تشذيب، ترتيب موسمي للحوش",
    descriptionEn: "Lawns, trees, trimming, seasonal tidy-ups",
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
    nameEn: "Removals",
    description: "نقل شقة صغيرة أو بيت كامل مع عمّال",
    descriptionEn: "Small flat or full house moves with helpers",
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
    nameEn: "Furniture assembly",
    description: "أثاث جاهز التركيب، رفوف، خزائن، تخزين",
    descriptionEn: "Flat-pack furniture, shelves, wardrobes",
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
    nameEn: "Carpenter",
    description: "أبواب، كوشينات، دواليب، تصليحات خشب",
    descriptionEn: "Doors, kitchens, wardrobes, wood repairs",
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
    nameEn: "Metalwork",
    description: "أبواب حديد، شبابيك، بوابات، سياج، لحام",
    descriptionEn: "Steel doors, windows, gates, fences, welding",
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
    nameEn: "Mechanic",
    description: "صيانة سيارات · فحص كمبيوتر · كهرباء سيارة",
    descriptionEn: "Car servicing, diagnostics, auto electrics",
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
    nameEn: "Tire service",
    description: "بنشر · ميزان · تبديل عجلات — يجيك وين ما كنت",
    descriptionEn: "Punctures, balancing, swaps — comes to you",
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
    nameEn: "Appliance repair",
    description: "غسالات · ثلاجات · أفران ومكانس",
    descriptionEn: "Washers, fridges, ovens and vacuums",
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
    nameEn: "Tiler",
    description: "سيراميك · بورسلين · رخام",
    descriptionEn: "Ceramic, porcelain, marble",
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
    nameEn: "Aluminium",
    description: "شبابيك · أبواب · مطابخ ألمنيوم",
    descriptionEn: "Windows, doors, aluminium kitchens",
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
    nameEn: "CCTV & security",
    description: "كاميرات مراقبة · إنذار · إنتركم",
    descriptionEn: "Cameras, alarms, intercoms",
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
    nameEn: "Accountant",
    description: "حسابات محلات · إقرارات · ميزانيات",
    descriptionEn: "Shop books, filings, budgets",
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
    nameEn: "Lessons & courses",
    description: "دروس خصوصية · لغات · كمبيوتر ودورات",
    descriptionEn: "Private tutoring, languages, computers",
    gradient: "grape",
    icon: "book",
    fallbackRange: { min: 100, max: 800 },
    describeHint: "شن المادة أو الدورة؟ ولمن — طالب وإلا موظف؟",
    placeholder:
      "مثال: نبي مدرّس رياضيات لولدي في الشهادة الإعدادية، درسين في الأسبوع في الحوش.",
  },
  {
    slug: "tailor",
    name: "خيّاط",
    nameEn: "Tailor",
    description: "تفصيل · تصليح ملابس · ستائر",
    descriptionEn: "Made-to-measure, alterations, curtains",
    gradient: "wine",
    icon: "scissors",
    fallbackRange: { min: 20, max: 300 },
    describeHint: "شن تبي تفصّل أو تصلّح؟ والقماش عندك؟",
    placeholder:
      "مثال: نبي تفصيل قفطان للعيد والقماش عندي، ونبي تضييق جاكيت.",
  },
  {
    slug: "photographer",
    name: "مصوّر",
    nameEn: "Photographer",
    description: "أعراس · مناسبات · منتجات",
    descriptionEn: "Weddings, events, products",
    gradient: "violet",
    icon: "photo",
    fallbackRange: { min: 150, max: 1500 },
    describeHint: "شن المناسبة؟ ووقتاش وكم ساعة تقريباً؟",
    placeholder:
      "مثال: نبي مصوّر لحفل خطوبة يوم الجمعة، تصوير 3 ساعات مع فيديو قصير.",
  },
  {
    slug: "nursing",
    name: "تمريض منزلي",
    nameEn: "Home nursing",
    description: "حقن · قياس ضغط وسكر · رعاية كبار",
    descriptionEn: "Injections, BP & sugar checks, elder care",
    gradient: "seafoam",
    icon: "heart",
    fallbackRange: { min: 30, max: 200 },
    describeHint: "شن الخدمة المطلوبة؟ ولمن — كبير في السن، مريض؟",
    placeholder:
      "مثال: نبي ممرضة تجي كل يوم صباحاً تعطي حقنة إنسولين لوالدتي وتقيس الضغط.",
  },
  {
    slug: "waterproofing",
    name: "عزل أسطح",
    nameEn: "Roof sealing",
    description: "عزل مائي وحراري · تصليح تسريبات السطح",
    descriptionEn: "Waterproofing, heat insulation, leaks",
    gradient: "storm",
    icon: "drop",
    fallbackRange: { min: 300, max: 3000 },
    describeHint: "كم متر السطح تقريباً؟ وفيه تسريب حالياً؟",
    placeholder:
      "مثال: سطح الحوش 120 متر يسرّب ماء في الشتاء — نبي عزل كامل قبل موسم المطر.",
  },
  {
    slug: "satellite",
    name: "ستلايت",
    nameEn: "Satellite TV",
    description: "تركيب دش · برمجة قنوات · تمديد",
    descriptionEn: "Dish installs, channel setup, cabling",
    gradient: "space",
    icon: "dish",
    fallbackRange: { min: 20, max: 150 },
    describeHint: "تركيب جديد وإلا صيانة؟ وكم نقطة في الحوش؟",
    placeholder:
      "مثال: نبي تركيب دش مركزي لحوش دورين مع برمجة القنوات.",
  },
  {
    slug: "carwash",
    name: "غسيل سيارات",
    nameEn: "Mobile car wash",
    description: "غسيل متنقل في مكانك · تلميع داخلي وخارجي",
    descriptionEn: "Washed at your place, inside-out detailing",
    gradient: "aqua",
    icon: "car",
    fallbackRange: { min: 20, max: 120 },
    describeHint: "شن نوع السيارة؟ غسيل عادي وإلا تفصيلي؟",
    placeholder:
      "مثال: نبي غسيل تفصيلي لسيارتين قدام الحوش — داخلي وخارجي مع تلميع.",
  },
  {
    slug: "barber",
    name: "حلاق منزلي",
    nameEn: "Home barber",
    description: "حلاقة في البيت · تجهيز مناسبات وأعراس",
    descriptionEn: "Haircuts at home, weddings and events",
    gradient: "denim",
    icon: "comb",
    fallbackRange: { min: 15, max: 100 },
    describeHint: "لمن الحلاقة؟ عادية وإلا تجهيز مناسبة؟",
    placeholder:
      "مثال: نبي حلاق يجي للحوش يوم الجمعة الصبح — حلاقة لي ولولديّ قبل العرس.",
  },
  {
    slug: "catering",
    name: "طباخة مناسبات",
    nameEn: "Event cooking",
    description: "كسكسي · رشدة · ولائم وعزومات",
    descriptionEn: "Couscous, feasts and gatherings",
    gradient: "olive",
    icon: "pot",
    fallbackRange: { min: 100, max: 1500 },
    describeHint: "كم شخص تقريباً؟ وشن الأكلات اللي تبيها؟",
    placeholder:
      "مثال: عندنا عزومة 30 شخص الخميس — نبو طباخة تجهزلنا كسكسي بالعلوش ومقبلات.",
  },
  {
    slug: "rentals",
    name: "إيجارات",
    nameEn: "Rentals",
    description: "شقق، أحواش، محلات — من الملّاك والمندوبين مباشرة",
    descriptionEn: "Flats, houses, shops — direct from owners",
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
    nameEn: "Delivery",
    description: "طرود · بضائع · مشاوير أشخاص · مياه وغاز — نفس اليوم",
    descriptionEn: "Parcels, goods, rides, water & gas — same day",
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

/** اسم الخدمة حسب اللغة — فولباك دائماً للعربي. */
export function serviceName(s: ServiceCategory, locale: "ar" | "en"): string {
  return locale === "en" ? s.nameEn || s.name : s.name;
}

/** وصف الخدمة حسب اللغة. */
export function serviceDescription(
  s: ServiceCategory,
  locale: "ar" | "en"
): string {
  return locale === "en" ? s.descriptionEn || s.description : s.description;
}
