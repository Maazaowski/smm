import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CursorGlow } from "@/components/ui/cursor-glow";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { Grain } from "@/components/ui/grain";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { CommandPalette } from "@/components/ui/command-palette";
import { getAllPosts } from "@/lib/posts";
import { getAllProjects } from "@/lib/projects";
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
  // Fetch posts and projects for the command palette. Only the searchable
  // fields cross into the client component — no bodies, no GitHub stats.
  const [allPosts, allProjects] = await Promise.all([
    getAllPosts().catch(() => []),
    getAllProjects().catch(() => []),
  ]);
  const posts = allPosts.map((p) => ({
    slug: p.slug,
    title: p.frontmatter.title,
    description: p.frontmatter.description,
    tags: p.frontmatter.tags,
  }));
  const projects = allProjects.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.summary || p.description,
  }));

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {/* Ambient warm aurora — amber / terracotta / rose, drifting slowly */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="animate-aurora-a absolute top-[-25%] left-[-15%] h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle,oklch(0.78_0.14_70/0.18),transparent_70%)] dark:bg-[radial-gradient(circle,oklch(0.7_0.15_60/0.16),transparent_70%)]" />
            <div className="animate-aurora-b absolute bottom-[-20%] right-[-15%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,oklch(0.7_0.16_35/0.14),transparent_70%)] dark:bg-[radial-gradient(circle,oklch(0.62_0.16_30/0.14),transparent_70%)]" />
            <div className="animate-aurora-a absolute top-[30%] right-[10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,oklch(0.72_0.13_20/0.1),transparent_70%)]" />
          </div>

          <Grain />
          <CursorGlow />
          <CustomCursor />
          <ReadingProgress />
          <CommandPalette posts={posts} projects={projects} />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
