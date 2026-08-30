import Link from "next/link";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";
import { BrandText, LangSwitcher, Copyright } from "@/components/locale";

export const metadata: Metadata = {
  title: "قدّم خدماتك · اشتغل مع توّا",
  description:
    "سواق، أسطى، صاحب عقار؟ أقل نسبة في السوق، فلوسك في يدك فوراً، وزبائن جاهزين. سجّل في فترة الإطلاق بصفر عمولة.",
};

/**
 * صفحة «قدّم خدماتك» — التسويق لمقدمي الخدمات: السواقين والأسطوات
 * وأصحاب العقارات. بدون ذكر أي منافس — نتكلم عن أرقامنا نحن.
 */
export default function JoinPage() {
  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "color-mix(in srgb, var(--paper) 90%, transparent)",
          backdropFilter: "saturate(1.6) blur(10px)",
          WebkitBackdropFilter: "saturate(1.6) blur(10px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "inherit",
            }}
            aria-label="توّا — الرئيسية"
          >
            <BrandMark />
            <span
              className="serif"
              style={{ fontSize: "28px", letterSpacing: "-0.01em" }}
            >
              <BrandText />
            </span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/tradesmen/join"
              style={{
                padding: "10px 22px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #10B981, #0B7F58)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              سجّل توّا
            </Link>
            <LangSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "64px 24px 100px",
        }}
      >
        {/* ─── الهيرو ─────────────────────────────────── */}
        <div style={{ maxWidth: "720px", marginBottom: "56px" }}>
          <div className="kicker" style={{ marginBottom: "20px" }}>
            — للسواقين · الأسطوات · أصحاب العقارات
          </div>
          <h1
            className="serif"
            style={{
              fontSize: "clamp(40px, 5.4vw, 68px)",
              lineHeight: 1.3,
              letterSpacing: "-0.028em",
              margin: "0 0 20px",
              textWrap: "balance",
              fontWeight: 400,
            }}
          >
            قدّم خدماتك.{" "}
            <em style={{ color: "var(--brand-1, #10B981)", fontStyle: "italic" }}>
              تعبك ليك
            </em>
            ، مش لغيرك.
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "var(--ink-2)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            توّا منصة ليبية تجيبلك الزبون الجاهز — واصف شغله، وشايف السعر
            العادل. إنت بس قدّم عرضك واشتغل. أقل نسبة في السوق، وفلوسك في يدك
            أول ما تخلص.
          </p>
        </div>

        {/* ─── الأرقام الثلاثة ─────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "64px",
          }}
        >
          <StatCard
            num="0%"
            label="عمولة طول فترة الإطلاق"
            sub="سجّل بدري واشتغل ببلاش — بدون رسوم اشتراك، بدون دفع مقابل العروض."
          />
          <StatCard
            num="فوري"
            label="فلوسك في يدك"
            sub="الزبون يدفعلك مباشرة عند الإنجاز — كاش أو كيف ما تتفقوا. بدون تجميد وبدون انتظار."
            accent
          />
          <StatCard
            num="مباشر"
            label="واتساب الزبون يوصلك"
            sub="أول ما يقبل عرضك، تتواصلوا مباشرة — بدون وسيط بيناتكم."
          />
        </div>

        {/* ─── الجمهور: ثلاث بطاقات ─────────────────────── */}
        <SectionKicker text="اختار مجالك" />
        <h2
          className="serif"
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            margin: "0 0 28px",
            lineHeight: 1.3,
          }}
        >
          شن تقدّم؟
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginBottom: "72px",
          }}
        >
          <AudienceCard
            gradient="linear-gradient(140deg, #3B7EA1, #256380)"
            title="سواق توصيل"
            lines={[
              "أقل نسبة توصيل في السوق — والباقي كله ليك",
              "طلبات واضحة: من وين، لوين، وشن الغرض — قبل ما تقبل",
              "اشتغل وقت ما تحب — بدون دوام وبدون شروط تعجيزية",
              "مشاويرك تبني تقييمك، وتقييمك يجيبلك طلبات أكثر",
            ]}
            cta="سجّل كسواق ←"
          />
          <AudienceCard
            gradient="linear-gradient(140deg, #14876C, #0B6350)"
            title="أسطى / حرفي"
            lines={[
              "زبائن جاهزين — واصفين شغلهم وشايفين السعر العادل",
              "قدّم عرضك بسعرك إنت — بدون مزايدات على حسابك",
              "التوثيق اليدوي يرفع قيمتك: ✓ جنب اسمك تعني ثقة",
              "بروفايل عام بتقييماتك يشتغللك تسويق 24 ساعة",
            ]}
            cta="سجّل كأسطى ←"
          />
          <AudienceCard
            gradient="linear-gradient(140deg, #4B4E9E, #32356E)"
            title="صاحب عقار / مندوب"
            lines={[
              "اعرض شققك ومحلاتك لناس تدوّر فعلاً — مش متفرجين",
              "الطالب يكتب ميزانيته ومنطقته — وإنت ترد بعرضك",
              "شراكة مع أجرلي — منظومة عقارية ليبية متكاملة",
              "عمولتك من الإيجار تظل ليك — نحن بس نوصّلك بالزبون",
            ]}
            cta="سجّل كمندوب ←"
          />
        </div>

        {/* ─── عروض الإطلاق ────────────────────────────── */}
        <SectionKicker text="عروض الإطلاق" />
        <h2
          className="serif"
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            margin: "0 0 28px",
            lineHeight: 1.3,
          }}
        >
          اللي يسجّل بدري، ياخذ أكثر.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginBottom: "72px",
          }}
        >
          <OfferCard
            badge="لأول 100 مسجّل"
            title="شارة «مؤسس» دائمة"
            text="تظهر على بروفايلك للأبد — علامة أنك كنت من أول الناس اللي بنوا السوق معانا، وأولوية ظهور في الدليل."
          />
          <OfferCard
            badge="طول فترة الإطلاق"
            title="صفر عمولة — نهائياً"
            text="كل دينار تكسبه ليك. بدون نسبة، بدون رسوم تسجيل، بدون اشتراك شهري. والأسعار بعد الإطلاق بتظل الأقل في السوق."
          />
          <OfferCard
            badge="دائماً"
            title="التوثيق مجاني"
            text="نوثّق هويتك وخبرتك يدوياً ببلاش — التوثيق اللي يخلي الزبون يختارك إنت مش غيرك."
          />
        </div>

        {/* ─── كيف تبدأ ────────────────────────────────── */}
        <SectionKicker text="ثلاث خطوات" />
        <h2
          className="serif"
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            margin: "0 0 28px",
            lineHeight: 1.3,
          }}
        >
          تبدأ اليوم، وتستقبل أول طلب أول ما نفتح في مدينتك.
        </h2>
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 48px",
            display: "grid",
            gap: "14px",
          }}
        >
          <Step
            n="1"
            title="سجّل بياناتك"
            text="اسمك، مهنتك (سواق، كهربائي، سبّاك، مندوب عقاري…)، مدينتك، ورقم واتسابك — دقيقتين بالكثير."
          />
          <Step
            n="2"
            title="نوثّقك يدوياً"
            text="بشر حقيقيين يراجعون هويتك وخبرتك خلال 48 ساعة — عشان علامة التوثيق تسوى فعلاً."
          />
          <Step
            n="3"
            title="استقبل الطلبات وقدّم عروضك"
            text="سوق الشغل يوريك طلبات مهنتك في مدينتك. قدّم عرضك، وأول ما يتقبل — واتساب الزبون في يدك."
          />
        </ol>

        <div
          style={{
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Link
            href="/tradesmen/join"
            style={{
              padding: "16px 36px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #10B981, #0B7F58)",
              color: "#fff",
              fontSize: "17px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 10px 30px -10px rgba(11,127,88,0.5)",
            }}
          >
            سجّل توّا — ببلاش
          </Link>
          <span style={{ color: "var(--ink-3)", fontSize: "13.5px" }}>
            بدون التزام · التسجيل دقيقتين · التوثيق خلال 48 ساعة
          </span>
        </div>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "24px",
          background: "var(--paper-2)",
        }}
      >
        <div
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
          className="mono"
        >
          <span
            style={{
              fontSize: "11px",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
            }}
          >
            <Copyright />
          </span>
          <Link
            href="/"
            style={{
              fontSize: "11px",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
          >
            → الرئيسية
          </Link>
        </div>
      </footer>
    </>
  );
}

/* ─── قطع الصفحة ─────────────────────────────────────── */

function SectionKicker({ text }: { text: string }) {
  return (
    <div className="kicker" style={{ marginBottom: "14px" }}>
      — {text}
    </div>
  );
}

function StatCard({
  num,
  label,
  sub,
  accent,
}: {
  num: string;
  label: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "18px",
        padding: "24px",
        background: accent
          ? "color-mix(in srgb, var(--brand-1, #10B981) 10%, var(--paper-2, transparent))"
          : "var(--paper-2, transparent)",
      }}
    >
      <div
        className="serif"
        style={{
          fontSize: "44px",
          lineHeight: 1,
          color: "var(--brand-2, #0B7F58)",
          marginBottom: "10px",
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <p
        style={{
          fontSize: "13.5px",
          color: "var(--ink-2)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

function AudienceCard({
  gradient,
  title,
  lines,
  cta,
}: {
  gradient: string;
  title: string;
  lines: string[];
  cta: string;
}) {
  return (
    <div
      style={{
        borderRadius: "22px",
        background: gradient,
        color: "#fff",
        padding: "28px 26px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        boxShadow: "0 14px 40px -16px rgba(11,31,51,0.5)",
      }}
    >
      <div
        className="serif"
        style={{ fontSize: "27px", letterSpacing: "-0.01em", lineHeight: 1.2 }}
      >
        {title}
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: "10px",
          flex: 1,
        }}
      >
        {lines.map((line) => (
          <li
            key={line}
            style={{
              fontSize: "14px",
              lineHeight: 1.55,
              paddingInlineStart: "22px",
              position: "relative",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                insetInlineStart: 0,
                top: "1px",
                opacity: 0.9,
              }}
            >
              ✓
            </span>
            {line}
          </li>
        ))}
      </ul>
      <Link
        href="/tradesmen/join"
        style={{
          alignSelf: "flex-start",
          padding: "10px 22px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.16)",
          border: "1px solid rgba(255,255,255,0.4)",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

function OfferCard({
  badge,
  title,
  text,
}: {
  badge: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "18px",
        padding: "24px",
        background: "var(--paper-2, transparent)",
        position: "relative",
      }}
    >
      <span
        className="mono"
        style={{
          display: "inline-block",
          fontSize: "10px",
          letterSpacing: "0.12em",
          color: "#8A6210",
          background: "color-mix(in srgb, #E6A429 18%, transparent)",
          border: "1px solid color-mix(in srgb, #E6A429 40%, transparent)",
          borderRadius: "999px",
          padding: "4px 12px",
          marginBottom: "14px",
        }}
      >
        {badge}
      </span>
      <div
        className="serif"
        style={{
          fontSize: "21px",
          color: "var(--ink)",
          marginBottom: "8px",
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontSize: "13.5px",
          color: "var(--ink-2)",
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <li
      style={{
        display: "flex",
        gap: "18px",
        alignItems: "flex-start",
        border: "1px solid var(--line)",
        borderRadius: "16px",
        padding: "18px 20px",
        background: "var(--paper-2, transparent)",
      }}
    >
      <span
        className="serif"
        style={{
          fontSize: "26px",
          color: "var(--brand-2, #0B7F58)",
          lineHeight: 1,
          minWidth: "28px",
        }}
      >
        {n}
      </span>
      <div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: "4px",
          }}
        >
          {title}
        </div>
        <p
          style={{
            fontSize: "14px",
            color: "var(--ink-2)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {text}
        </p>
      </div>
    </li>
  );
}
