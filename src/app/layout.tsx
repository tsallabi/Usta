import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://usta.pages.dev"
  ),
  title: {
    default: "توّا — سعر عادل. أسطى موثوق.",
    template: "%s · توّا",
  },
  description:
    "منصة ليبية تربطك بأسطوات موثوقين — تقدير سعر عادل بالذكاء الاصطناعي قبل ما تختار. كهربائي، سبّاك، تكييف، دهان وأكثر في طرابلس وبنغازي ومصراتة.",
  applicationName: "توّا",
  authors: [{ name: "توّا" }],
  keywords: [
    "كهربائي طرابلس",
    "سبّاك بنغازي",
    "صيانة منزلية ليبيا",
    "توّا ليبيا",
    "تكييف مصراتة",
    "دهان طرابلس",
    "نقل أثاث ليبيا",
    "تقدير سعر صيانة",
  ],
  openGraph: {
    type: "website",
    locale: "ar_LY",
    siteName: "توّا",
    title: "توّا — سعر عادل. أسطى موثوق.",
    description: "الرقم اللي تحب تعرفه فعلاً، قبل ما أي حد يحاول يبيعلك أي شيء.",
  },
  twitter: {
    card: "summary_large_image",
    title: "توّا",
    description:
      "منصة ليبية تربطك بأسطوات موثوقين — تقدير سعر عادل بالذكاء الاصطناعي قبل ما تختار.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7EE" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1826" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar-LY" dir="rtl" suppressHydrationWarning>
      {/* Arabic fonts are loaded via @import in globals.css — the App Router
          strips manually rendered <head> tags, so a <link> here never ships. */}
      <body>{children}</body>
    </html>
  );
}
