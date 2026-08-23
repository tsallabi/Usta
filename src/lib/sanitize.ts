/**
 * فلتر منع تهريب معلومات التواصل — حماية عمولة المنصة.
 *
 * الأسطى (أو الزبون) قد يحاول تمرير رقم هاتفه داخل نص العرض قبل القبول
 * باش يكمّلوا الاتفاق خارج المنصة: "0 9 1 2 3..."، "صفر تسعة واحد..."،
 * "091-234-5678"، "كلمني واتس"، إيميل، رابط تيليجرام…
 *
 * القاعدة: التواصل المباشر يفتح فقط بعد قبول العرض — قبلها تُستبدل أي
 * معلومة تواصل بعلامة [تمت إزالة معلومات التواصل].
 *
 * الفلتر تحوّطي (قد يمسك زيادة أحياناً) — أفضل من التسريب. الأرقام
 * القصيرة مثل الأسعار "5000" و"300 متر" لا تتأثر (العتبة 7 أرقام).
 */

const REPLACEMENT = "[تمت إزالة معلومات التواصل — تفتح بعد قبول العرض]";

// أرقام شرقية → غربية قبل الفحص (٠٩١٢٣٤٥٦٧٨ وأيضاً الفارسية ۰-۹)
function normalizeDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

// كلمات الأرقام بالعربي (فصحى + ليبي + إنجليزي شائع)
const DIGIT_WORDS =
  "(?:صفر|زيرو|واحد|وحدة|اثنين|اتنين|تنين|ثلاثة|تلاتة|ثلاثه|أربعة|اربعة|اربعه|خمسة|خمسه|ستة|سته|سبعة|سبعه|ثمانية|تمانية|ثمانيه|تسعة|تسعه|zero|one|two|three|four|five|six|seven|eight|nine)";

const PATTERNS: RegExp[] = [
  // 7+ أرقام مع فواصل اختيارية بينها (مسافات، شرطات، نقاط، أقواس، حروف مفردة للتمويه)
  /(?:\+?\d[\s\-._,،؛:*#/\\|()\[\]{}~'"«»]{0,3}){7,}\d?/g,
  // 6+ كلمات أرقام متتالية ("صفر تسعة واحد اثنين ...")
  new RegExp(`(?:${DIGIT_WORDS}[\\s\\-.,،]{0,3}){6,}`, "gi"),
  // إيميلات
  /[\w.+-]+@[\w-]+\.[\w.]{2,}/g,
  // روابط ومعرّفات تواصل
  /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com|t\.me|telegram\.me|fb\.com|facebook\.com|instagram\.com|m\.me)\/?\S*/gi,
  // كلمات دالة ملاصقة لأي أرقام قريبة ("واتس 091..." تمسكها الأنماط الرقمية،
  // هنا نمسك "كلمني واتساب/فايبر/تيليجرام على ..." مع معرف نصي
  /(?:واتس(?:اب)?|فايبر|تيليجرام|تلغرام|سيجنال|whatsapp|viber|telegram|signal)[\s:.\-]{0,4}@?\w{4,}/gi,
];

export type SanitizeResult = {
  clean: string;
  leaked: boolean;
};

/** ينظّف نصاً من أي معلومات تواصل — يرجع النص النظيف وهل كان فيه تسريب. */
export function sanitizeContactLeaks(raw: string): SanitizeResult {
  let text = normalizeDigits(raw);
  let leaked = false;
  for (const pattern of PATTERNS) {
    if (pattern.test(text)) {
      leaked = true;
      pattern.lastIndex = 0;
      text = text.replace(pattern, REPLACEMENT);
    }
    pattern.lastIndex = 0;
  }
  // تكرار العلامة المتلاصق → علامة واحدة
  text = text.replace(
    new RegExp(
      `(?:${REPLACEMENT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s]*){2,}`,
      "g"
    ),
    `${REPLACEMENT} `
  );
  return { clean: text.trim(), leaked };
}
