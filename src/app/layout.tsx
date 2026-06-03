import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CursorGlow } from "@/components/ui/cursor-glow";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { CommandPalette } from "@/components/ui/command-palette";
import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.title}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch posts for command palette — cached per-request via React cache()
  const allPosts = await getAllPosts().catch(() => []);
  const posts = allPosts.map((p) => ({
    slug: p.slug,
    title: p.frontmatter.title,
    description: p.frontmatter.description,
    tags: p.frontmatter.tags,
  }));

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {/* Background gradient blobs */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none hidden dark:block">
            <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,oklch(0.45_0.15_280/0.15),transparent_70%)]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.45_0.12_230/0.1),transparent_70%)]" />
          </div>

          <CursorGlow />
          <ReadingProgress />
          <CommandPalette posts={posts} />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
