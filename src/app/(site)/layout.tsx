import { Head, Progress, MotionFlag } from "@/components/site/chrome";
import { SiteFooter } from "@/components/site/footer";
import "./signal.css";
import "./case.css";
import "./read.css";

/**
 * The public shell.
 *
 * Everything every page shares: the blueprint ground, the reading-position bar,
 * the header and the footer. Pages below render only their own content.
 *
 * The Fontshare link is here rather than in the root layout so the admin does
 * not pay for the display faces it never uses. Both are self-hosted candidates
 * — see public/fonts — but the licence check happens before that switch, not
 * as a side effect of it.
 */

const NAV = [
  { label: "Essays", href: "/blog" },
  { label: "Work", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/#contact" },
];

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sg">
      {/*
        Clash Display and Satoshi, from Fontshare. This link is in the (site)
        layout rather than the root so the admin does not pay for two display
        faces it never renders.

        It is a third-party request on the critical path and should be
        self-hosted through next/font/local before this goes live — the files
        are SIL-licensed and can ship from public/fonts. Until then the link
        has to be here: without it the wordmark silently falls back to
        system-ui, which I only caught because a cached browser was hiding it.
      */}
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap"
      />

      <MotionFlag />
      <div className="sg-grid" aria-hidden="true" />
      <Progress />
      <Head nav={NAV} />
      <div className="sg-body" id="top">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
