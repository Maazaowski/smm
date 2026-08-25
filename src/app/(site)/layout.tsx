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
