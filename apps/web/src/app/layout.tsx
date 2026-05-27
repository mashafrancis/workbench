import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import { GeistPixelLine } from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme-provider";
import "./globals.css";

const SITE_URL = "https://getworkbench.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Workbench — The missing dashboard for BullMQ",
  description:
    "A local-first, native desktop app to inspect, debug, and replay your BullMQ queues. Discover queues automatically, watch runs in real time, and never SSH into Redis again.",
  applicationName: "Workbench",
  keywords: [
    "BullMQ dashboard",
    "BullMQ UI",
    "Redis queue dashboard",
    "bull-board alternative",
    "BullMQ monitoring",
    "Node.js job queue dashboard",
    "BullMQ FlowProducer visualisation",
    "BullMQ scheduler UI",
    "open-source BullMQ dashboard",
    "BullMQ desktop app",
  ],
  authors: [{ name: "Pontus Abrahamsson", url: "https://x.com/pontusab" }],
  creator: "Pontus Abrahamsson",
  publisher: "Workbench",
  category: "Developer Tools",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Workbench — The missing dashboard for BullMQ",
    description:
      "Native macOS app. Local-first. Inspect, debug, and replay your BullMQ queues. MIT licensed, no telemetry.",
    url: SITE_URL,
    siteName: "Workbench",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Workbench — a beautiful, open-source BullMQ dashboard for modern Node apps.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Workbench — The missing dashboard for BullMQ",
    description:
      "Native macOS app. Local-first. Inspect, debug, and replay your BullMQ queues.",
    site: "@pontusab",
    creator: "@pontusab",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/app-icon.svg", type: "image/svg+xml" },
      { url: "/app-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/app-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/app-icon.png",
  },
};

/**
 * Site-wide JSON-LD entity graph.
 *
 * We emit `Organization` + `WebSite` at the root so every page (homepage,
 * blog, per-post) carries the canonical entity definition for Workbench.
 * LLM-based search (ChatGPT, Perplexity, Claude, Gemini) reads JSON-LD
 * preferentially when deciding what to cite and how to describe a brand —
 * having the entity defined in one place keeps the description consistent
 * across every citation context.
 *
 * `@id` URLs use stable fragments (`#organization`, `#website`) so other
 * schema nodes on individual pages (Article, SoftwareApplication, FAQPage)
 * can `@id`-reference back to the canonical organisation/website nodes
 * instead of redefining them inline. This is the schema.org-recommended
 * pattern for cross-page entity reuse.
 */
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Workbench",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/app-icon.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://github.com/pontusab/workbench",
        "https://www.npmjs.com/org/getworkbench",
        "https://x.com/pontusab",
      ],
      founder: {
        "@type": "Person",
        name: "Pontus Abrahamsson",
        url: "https://x.com/pontusab",
        sameAs: ["https://x.com/pontusab", "https://github.com/pontusab"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Workbench",
      description:
        "The missing dashboard for BullMQ — a local-first native macOS app and embeddable Node.js dashboard with first-party adapters for thirteen frameworks.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelLine.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
