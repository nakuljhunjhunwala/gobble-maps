import type { Metadata, Viewport } from "next";
import { Albert_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { SwRegister } from "@/components/app/sw-register";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
} from "@/lib/site";
import { webSiteJsonLd } from "@/lib/seo/json-ld";

const albertSans = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Canonicals and og:url are set per page — never here (children would
// inherit "/" via Next's shallow metadata merge). Icons come from the
// app/ file conventions (favicon.ico, icon.svg, apple-icon.png).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Mumbai restaurants",
    "Mumbai cafés",
    "Mumbai nightlife",
    "Mumbai street food",
    "food map Mumbai",
    "curated food guide",
    "where to eat in Mumbai",
  ],
  category: "food",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  // title/description/images auto-fill from openGraph; only the card
  // type needs declaring.
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1D7FB8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${albertSans.variable} ${bricolageGrotesque.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: webSiteJsonLd() }}
        />
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
