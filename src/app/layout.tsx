import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { DomainTracker } from "@/components/DomainTracker";
import { getSiteType, getSiteName } from "@/lib/site";

const GA_ID = "G-01SJET2VQ2";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";

export async function generateMetadata(): Promise<Metadata> {
  const siteType = await getSiteType();
  const siteName = getSiteName(siteType);

  const description =
    siteType === "tint"
      ? "Free community-driven knowledge base for window tint installers. Search any vehicle, read install notes, rate difficulty, and share tips."
      : siteType === "ppf"
      ? "Free community-driven knowledge base for PPF installers. Search any vehicle, read real-world install notes, rate difficulty, and share your tips."
      : "Free community-driven knowledge base for window tint and PPF installers. Search any vehicle, read install notes, rate difficulty, and share tips.";

  const title = `${siteName} — Vehicle Install Knowledge Base`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s — ${siteName}`,
    },
    description,
    openGraph: {
      type: "website",
      siteName,
      title,
      description,
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteType = await getSiteType();
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <NavBar />
        <DomainTracker siteType={siteType} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
