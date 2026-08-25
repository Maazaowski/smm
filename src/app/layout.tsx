import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/constants";
import "./globals.css";

/**
 * Root layout.
 *
 * Document shell only: html, body, font variables, analytics. No chrome, no
 * providers, no ambient layers.
 *
 * The public site's shell lives in (site)/layout.tsx and the admin's in
 * (admin)/layout.tsx. That split is what stops the admin paying for the site's
 * chrome and vice versa — the previous arrangement put everything in the root
 * layout, which meant every route shipped the command palette's cmdk and
 * fuse.js whether it rendered them or not.
 *
 * ThemeProvider is gone with it. The site commits to one look; nothing under
 * src/app/(site) reads a theme.
 */

const jetbrains = JetBrains_Mono({
  variable: "--sg-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.author.name} — Software & AI Engineer`,
    template: `%s · Maaz`,
  },
  description: SITE.description,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.author.name,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetbrains.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
