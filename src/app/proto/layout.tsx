import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./proto.css";
import "./desk.css";

/**
 * Isolated shell for the redesign prototype.
 *
 * Deliberately does NOT nest the production chrome: no Header, no Footer, no
 * aurora layers, no Grain, no CursorGlow, no CustomCursor, no ReadingProgress,
 * no page-transition wrapper. Nothing under /proto can affect the live site,
 * and nothing on the live site leaks in here.
 *
 * Two families instead of the production site's three (four files): Newsreader
 * carries argument, IBM Plex Mono carries structure.
 */

const newsreader = Newsreader({
  variable: "--fn-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--fn-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Field Notebook", template: "%s · Field Notebook" },
  robots: { index: false, follow: false },
};

export default function ProtoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The pre-paint script below stamps data-fn-theme before React hydrates,
    // so the server HTML deliberately differs from the client DOM here. Same
    // reason the production root layout suppresses it on <html>.
    <div
      className={`fn ${newsreader.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      {/*
        Applies a stored theme choice before first paint. Without it the
        attribute is only set by the toggle's click handler, so the choice is
        lost on every navigation and the page flashes the system theme first.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem('fn-theme');if(t==='light'||t==='dark'){document.currentScript.parentElement.setAttribute('data-fn-theme',t)}}catch(e){}`,
        }}
      />
      {children}
    </div>
  );
}
