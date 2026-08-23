/**
 * قوالب البريد الإلكتروني لتوّا (Tawwa).
 *
 * Each template returns { subject, html, text } ready to spread into
 * sendEmail / sendEmailSafe from @/lib/email.
 *
 * ملاحظة سوق: البريد اختياري في ليبيا — هذه الرسائل تُرسل فقط لمن أدخل
 * بريده. القناة الأساسية هي الهاتف/الواتساب.
 *
 * HTML is email-safe: table layout, inline styles only, no webfonts, no
 * images, no external resources. RTL: dir="rtl" + text-align:right on
 * content cells. Palette mirrors globals.css design tokens
 * (paper #FBF7EE, ink #0B1F33, emerald #10B981, muted #7A879A).
 *
 * All user-provided strings MUST pass through escapeHtml() before being
 * interpolated into HTML. Western digits (0-9) only — never ٠-٩.
 */

export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

export type WaitlistWelcomeOptions = {
  email: string;
  audience: "homeowner" | "tradesman";
};

export type JobPostedOptions = {
  jobId: string;
  service: string;
  description: string;
  min?: number;
  max?: number;
};

export type TradesmanApplicationOptions = {
  applicationId: string;
  fullName: string;
  trade: string;
};

// ─── Palette (mirrors src/app/globals.css light tokens) ─────────────

const PAPER = "#FBF7EE";
const CARD = "#FFFFFF";
const INK = "#0B1F33";
const INK_2 = "#34455A";
const INK_3 = "#7A879A";
const LINE = "#E3DAC3";
const EMERALD = "#10B981";
const EMERALD_DEEP = "#0B7F58";

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";
const MONO = "'Courier New', Courier, monospace";

const SITE_URL = "https://usta.pages.dev";

/** Escape a user-provided string for safe interpolation into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type LayoutOptions = {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

/** Shared email shell: paper background, single 560px column, brand header, RTL. */
function renderLayout(opts: LayoutOptions): string {
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `
          <tr>
            <td align="right" style="padding: 8px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="${EMERALD}" style="border-radius: 999px; background: linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DEEP} 100%);">
                    <a href="${opts.ctaUrl}" style="display: inline-block; padding: 12px 28px; font-family: ${SANS}; font-size: 15px; font-weight: bold; color: #FFFFFF; text-decoration: none; border-radius: 999px;">${opts.ctaLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="ar-LY" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>توّا</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${PAPER};" dir="rtl">
  <!-- Preheader: hidden preview text -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${PAPER};">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" dir="rtl" style="background-color: ${PAPER};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="width: 100%; max-width: 560px;">

          <!-- Brand header -->
          <tr>
            <td align="right" style="padding: 0 4px 20px 4px; text-align: right;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="rtl">
                <tr>
                  <td width="28" height="28" bgcolor="${EMERALD}" style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DEEP} 100%); font-size: 1px; line-height: 1px;">&nbsp;</td>
                  <td style="padding-right: 10px; font-family: ${SERIF}; font-size: 19px; font-weight: bold; color: ${INK}; text-align: right;">توّا</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="${CARD}" style="background-color: ${CARD}; border: 1px solid ${LINE}; border-radius: 14px; padding: 32px 32px 24px 32px; text-align: right;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl">
                <tr>
                  <td style="padding-bottom: 16px; font-family: ${SERIF}; font-size: 24px; line-height: 34px; font-weight: bold; color: ${INK}; text-align: right;">${opts.heading}</td>
                </tr>
                <tr>
                  <td style="font-family: ${SANS}; font-size: 15px; line-height: 25px; color: ${INK_2}; text-align: right;">${opts.bodyHtml}</td>
                </tr>
                ${cta}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 8px 0 8px; font-family: ${SANS}; font-size: 12px; line-height: 20px; color: ${INK_3}; text-align: center;" align="center">
              &copy; 2026 توّا &middot; طرابلس<br>
              وصلتك هذه الرسالة لأنك سجّلت في usta.pages.dev.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Small-caps mono-ish label (letter-spacing, no webfonts). */
function kicker(label: string): string {
  return `<span style="font-family: ${SANS}; font-size: 11px; letter-spacing: 1px; color: ${INK_3};">${label}</span>`;
}

/** Reference id rendered in mono on a paper chip (ids are Latin — keep LTR). */
function refChip(id: string): string {
  return `<span dir="ltr" style="font-family: ${MONO}; font-size: 14px; color: ${INK}; background-color: ${PAPER}; border: 1px solid ${LINE}; border-radius: 6px; padding: 3px 8px;">${escapeHtml(id)}</span>`;
}

function para(inner: string): string {
  return `<p style="margin: 0 0 14px 0;">${inner}</p>`;
}

const TEXT_FOOTER = `
--
(c) 2026 توّا - طرابلس
وصلتك هذه الرسالة لأنك سجّلت في usta.pages.dev.`;

// ─── Waitlist welcome ───────────────────────────────────────────────

export function waitlistWelcomeEmail(
  opts: WaitlistWelcomeOptions
): EmailContent {
  if (opts.audience === "tradesman") {
    const subject = "توّا — تسجّلت في قائمة الأسطوات";
    const bodyHtml =
      para(
        "منوّرين. توّا مبنية عشان الأسطى يحتفظ بأكثر من تعبه — <strong>بدون عمولات على الطلب، وبدون دفع مقابل كل عرض</strong>. الزبون يشوف سعر عادل من الذكاء الاصطناعي أولاً، والأسطوات الموثوقين ياخذوا طلبات حقيقية."
      ) +
      para(
        "قبل الإطلاق نوثّق بيانات كل أسطى يدوياً — بطاقة الهوية، رقم الواتساب، والخبرة — عشان علامة التوثيق جنب اسمك تعني شيء فعلاً."
      ) +
      para(
        "بنتواصل معاك عشان تكمّل ملفك وتتوثّق قبل ما نفتح في مدينتك. ما عليك أي شيء ثاني توّا."
      ) +
      para("نتكلمو قريب،<br>فريق توّا");
    const text = `منوّرين.

توّا مبنية عشان الأسطى يحتفظ بأكثر من تعبه — بدون عمولات على الطلب،
وبدون دفع مقابل كل عرض. الزبون يشوف سعر عادل من الذكاء الاصطناعي
أولاً، والأسطوات الموثوقين ياخذوا طلبات حقيقية.

قبل الإطلاق نوثّق بيانات كل أسطى يدوياً — بطاقة الهوية، رقم الواتساب،
والخبرة — عشان علامة التوثيق جنب اسمك تعني شيء فعلاً.

بنتواصل معاك عشان تكمّل ملفك وتتوثّق قبل ما نفتح في مدينتك.
ما عليك أي شيء ثاني توّا.

نتكلمو قريب،
فريق توّا
${TEXT_FOOTER}`;
    return {
      subject,
      html: renderLayout({
        preheader: "بدون عمولات. بنتواصل معاك للتوثيق قبل الإطلاق.",
        heading: "تسجّلت في قائمة الأسطوات",
        bodyHtml,
      }),
      text,
    };
  }

  const subject = "تسجّلت في قائمة انتظار توّا";
  const bodyHtml =
    para(
      "شكراً على تسجيلك. توّا توريك <strong>سعر عادل من الذكاء الاصطناعي أولاً</strong> — قبل ما أي حد يعطيك عرض — وبعدين الأسطوات الموثوقين يقدمولك عروضهم. بدون تخمين، وبدون استغلال."
    ) +
    para(
      "بنتواصل معاك مرة وحدة، أول ما نفتح في منطقتك. في هذي الأثناء، تقدر تجرّب التقدير الذكي توّا وتشوف شن المفروض يكلف شغلك فعلاً."
    ) +
    para("نتكلمو قريب،<br>فريق توّا");
  const text = `شكراً على تسجيلك.

توّا توريك سعر عادل من الذكاء الاصطناعي أولاً — قبل ما أي حد يعطيك
عرض — وبعدين الأسطوات الموثوقين يقدمولك عروضهم. بدون تخمين، وبدون
استغلال.

بنتواصل معاك مرة وحدة، أول ما نفتح في منطقتك. في هذي الأثناء، تقدر
تجرّب التقدير الذكي توّا وتشوف شن المفروض يكلف شغلك فعلاً:

  ${SITE_URL}/estimate

نتكلمو قريب،
فريق توّا
${TEXT_FOOTER}`;
  return {
    subject,
    html: renderLayout({
      preheader:
        "سعر عادل من الذكاء الاصطناعي أولاً، وبعدين عروض من أسطوات موثوقين. بنتواصل معاك أول ما نفتح في منطقتك.",
      heading: "تسجّلت في القائمة",
      bodyHtml,
      ctaLabel: "جرّب التقدير الذكي",
      ctaUrl: `${SITE_URL}/estimate`,
    }),
    text,
  };
}

// ─── Job posted confirmation ────────────────────────────────────────

export function jobPostedEmail(opts: JobPostedOptions): EmailContent {
  const service = escapeHtml(opts.service);
  const subject = `استلمنا طلبك — ${opts.service}`;

  const hasRange =
    typeof opts.min === "number" && typeof opts.max === "number";
  const rangeHtml = hasRange
    ? para(
        `${kicker("النطاق العادل")}<br><span style="font-family: ${SERIF}; font-size: 20px; font-weight: bold; color: ${EMERALD_DEEP};">${opts.min}&ndash;${opts.max} د.ل</span>`
      )
    : "";
  const rangeText = hasRange
    ? `\nالنطاق العادل: ${opts.min}-${opts.max} د.ل\n`
    : "";

  const bodyHtml =
    para(`استلمنا طلب <strong>${service}</strong> متاعك. هذا رقم المرجع:`) +
    para(refChip(opts.jobId)) +
    para(
      `${kicker("وصفك للشغل")}<br><em style="color: ${INK_2};">&laquo;${escapeHtml(opts.description)}&raquo;</em>`
    ) +
    rangeHtml +
    para(
      "<strong>شن بيصير توّا:</strong> الأسطوات الموثوقين بيردوا عليك أول ما تفتح توّا في منطقتك. النشر مجاني في فترة الإطلاق — ما بتدفع أي شيء على هذا الطلب أبداً."
    ) +
    para("نتكلمو قريب،<br>فريق توّا");

  const text = `استلمنا طلب ${opts.service} متاعك.

رقم المرجع: ${opts.jobId}

وصفك للشغل:
«${opts.description}»
${rangeText}
شن بيصير توّا: الأسطوات الموثوقين بيردوا عليك أول ما تفتح توّا في
منطقتك. النشر مجاني في فترة الإطلاق — ما بتدفع أي شيء على هذا
الطلب أبداً.

نتكلمو قريب،
فريق توّا
${TEXT_FOOTER}`;

  return {
    subject,
    html: renderLayout({
      preheader: `طلب ${opts.service} متاعك وصل. الأسطوات الموثوقين بيردوا أول ما نفتح في منطقتك.`,
      heading: "استلمنا طلبك",
      bodyHtml,
    }),
    text,
  };
}

// ─── Tradesman application confirmation ─────────────────────────────

export function tradesmanApplicationEmail(
  opts: TradesmanApplicationOptions
): EmailContent {
  const firstName = opts.fullName.trim().split(/\s+/)[0] || "صديقنا";
  const subject = "استلمنا طلبك — التوثيق خلال 48 ساعة";

  const bodyHtml =
    para(`أهلاً ${escapeHtml(firstName)}،`) +
    para(
      `شكراً على تقديمك كـ<strong>${escapeHtml(opts.trade)}</strong>. رقم المرجع متاعك:`
    ) +
    para(refChip(opts.applicationId)) +
    para(
      "نوثّق كل طلب يدوياً — <strong>بطاقة الهوية والخبرة والأعمال السابقة</strong> — هذا اللي يخلي علامة التوثيق في توّا تسوى فعلاً. مافيش بوتات؛ إنسان حقيقي يراجع بياناتك."
    ) +
    para(
      "بنتواصل معاك على <strong>الواتساب خلال 48 ساعة</strong> بالنتيجة والخطوات الجاية."
    ) +
    para("نتكلمو قريب،<br>فريق توّا");

  const text = `أهلاً ${firstName}،

شكراً على تقديمك كـ${opts.trade}.

رقم المرجع: ${opts.applicationId}

نوثّق كل طلب يدوياً — بطاقة الهوية والخبرة والأعمال السابقة — هذا
اللي يخلي علامة التوثيق في توّا تسوى فعلاً. مافيش بوتات؛ إنسان
حقيقي يراجع بياناتك.

بنتواصل معاك على الواتساب خلال 48 ساعة بالنتيجة والخطوات الجاية.

نتكلمو قريب،
فريق توّا
${TEXT_FOOTER}`;

  return {
    subject,
    html: renderLayout({
      preheader:
        "نوثّق البيانات يدوياً. بنتواصل معاك على الواتساب خلال 48 ساعة.",
      heading: "استلمنا طلبك",
      bodyHtml,
    }),
    text,
  };
}
