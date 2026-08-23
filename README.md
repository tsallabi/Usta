# توّا (Tawwa)

منصة ليبية بسعر عادل للخدمات المنزلية. الزبون يصف الشغل، ياخذ تقدير سعر عادل
من الذكاء الاصطناعي بالدينار الليبي، وبعدين يختار من أسطوات موثوقين (توثيق
يدوي: بطاقة هوية + واتساب + خبرة) يقدموا عروضهم على الطلب.

**مباشر**: <https://usta.pages.dev>

## التقنيات

- **Next.js 14** (App Router, React Server Components)
- **TypeScript** (strict)
- **Tailwind CSS 3** + متغيرات CSS لرموز التصميم
- **Cloudflare Pages** (استضافة + edge عبر `@cloudflare/next-on-pages`)
- **Cloudflare KV** (قائمة الانتظار — phone-first)
- **Cloudflare D1** (الطلبات، الأسطوات، التقديرات)
- **Anthropic Claude API** (تقدير الأسعار بالذكاء الاصطناعي)
- **Resend** (بريد اختياري — يُرسل فقط لمن أدخل بريده)

## شن اللي جاهز

- ✅ صفحة هبوط عربية RTL كاملة (`/demos/index.html`)
- ✅ أداة التقدير الذكي `/estimate` — 11 مهنة، أسعار بالدينار الليبي، درجة ثقة
- ✅ نشر طلب `/jobs/new` — رقم الهاتف هو الهوية، البريد اختياري
- ✅ تسجيل الأسطوات `/tradesmen/join` — توثيق ليبي (هوية + واتساب + خبرة)
- ✅ قائمة انتظار phone-first → `/api/waitlist` → Cloudflare KV
- ✅ لوحة إدارة `/admin` (توثيق ✓ / إيقاف / إلغاء الإيقاف) بمفتاح ADMIN_KEY
- ✅ مظهر فاتح وداكن مع مبدّل ثابت
- ✅ إيميلات عربية RTL (ترحيب، تأكيد طلب، تأكيد تقديم أسطى)

## التشغيل محلياً

```bash
# 1. التثبيت
npm install

# 2. نسخ ملف البيئة
cp .env.example .env.local

# 3. تشغيل سيرفر التطوير
npm run dev
# → http://localhost:3000

# 4. فحص الأنواع + lint
npm run typecheck
npm run lint
```

## النشر على Cloudflare Pages

**إعدادات البناء**:

| الحقل | القيمة |
|---|---|
| Framework preset | Next.js |
| Build command | `npx @cloudflare/next-on-pages@1` |
| Build output directory | `.vercel/output/static` |
| Node version | `20` |
| Compatibility flags | `nodejs_compat` |

**قاعدة البيانات D1** (الطلبات والأسطوات):

1. `npx wrangler d1 create usta-db`
2. في مشروع Pages: **Settings → Functions → D1 database bindings** أضف
   `DB` → قاعدة `usta-db`.
3. طبّق المخطط:
   `npx wrangler d1 execute usta-db --remote --file=migrations/0001_initial.sql`

**KV لقائمة الانتظار**:

1. **Workers & Pages → KV → Create namespace** باسم `usta-waitlist`.
2. في مشروع Pages: **Settings → Functions → KV namespace bindings** أضف
   `WAITLIST` → الـ namespace الجديد.

**متغيرات البيئة** (Settings → Environment variables، كلها ENCRYPTED):

| المتغير | الغرض |
|---|---|
| `ANTHROPIC_API_KEY` | تقدير الأسعار بالذكاء الاصطناعي (`/api/estimate`) |
| `ADMIN_KEY` | دخول لوحة الإدارة `/admin` |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | بريد اختياري — يُرسل فقط لمن أدخل بريده |

قبل ربط أي شيء، كل المسارات تشتغل بتدهور سلس: بدون D1 → `persisted: false`،
بدون مفتاح AI → نطاق fallback، بدون Resend → تخطّي الإرسال.

## نظام التصميم

نفس نظام FairFix حرفياً — نفس الألوان والمسافات والبنية، مع خطوط عربية:

- **الأرضية**: ورق دافئ `#FBF7EE` (مش أبيض بارد)
- **الحبر**: كحلي غامق `#0B1F33`
- **اللون المميز** (زمردي `#10B981`): معناه *هذا يخدم*
- **الإشارة** (مرجاني `#F26D5B`): للطوارئ فقط
- **الانتباه** (عنبري `#E6A429`): للتقييمات
- **خط العرض**: Amiri (serif عربي)
- **خط النص**: IBM Plex Sans Arabic
- **الأرقام**: غربية (0-9) دائماً — أبداً ٠-٩
- كل الشاشات تحترم `prefers-reduced-motion`

## خارطة الطريق

- 💳 بوابات دفع محلية: سداد / موبي كاش
- 📱 تطبيق موبايل
- 🌍 توسّع عربي — كل دولة عبارة عن config في `src/lib/market.ts`
  (العملة، المدن، صيغة الهاتف، الاسم التجاري)

## الترخيص

ملكية خاصة — © 2026 توّا. جميع الحقوق محفوظة.
