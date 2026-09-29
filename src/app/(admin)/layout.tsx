import type { Metadata } from "next";
import "../(site)/signal.css";
import "./admin.css";

/**
 * The admin shell.
 *
 * Same design system as the public site — signal.css supplies the tokens, the
 * faces and the primitives, admin.css adds the back-office shapes on top — but
 * deliberately not the same chrome. No marketing header, no footer, no scroll
 * machinery, no reveal-on-scroll: an admin page is read top to bottom by one
 * person who already knows what is on it.
 *
 * The Fontshare link is duplicated from (site)/layout.tsx rather than lifted
 * to the root because the root layout is shared with the OG route and the
 * feeds, which must not pay for two display faces.
 */

export const metadata: Metadata = {
  title: "Desk",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sg sg-admin">
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap"
      />
      <div className="sg-grid" aria-hidden="true" />
      <div className="sg-body">{children}</div>
    </div>
  );
}
