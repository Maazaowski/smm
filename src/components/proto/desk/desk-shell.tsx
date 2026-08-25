"use client";

import Link from "next/link";
import { Toasts } from "./primitives";

/**
 * The Desk shell.
 *
 * Three deliberate departures from the production admin:
 *
 * 1. It does not render inside the public marketing chrome. The production
 *    admin — including the login screen — carries the site header, the aurora,
 *    the custom cursor, a newsletter signup form and a Guestbook link.
 * 2. There is no sidebar. Four destinations do not need 240px of permanent
 *    furniture; they need a row of text. The space goes to the work.
 * 3. Analytics are not a separate route. /dashboard and /admin were two halves
 *    of one job on two pages.
 */
export function DeskShell({
  section,
  children,
}: {
  section: "desk" | "editor" | "settings";
  children: React.ReactNode;
}) {
  return (
    <div className="fn-desk">
      <header className="fn-desk-bar">
        <div className="fn-desk-bar-inner">
          <Link href="/proto/admin" className="fn-wordmark">
            <b>Maaz</b>
            <span>desk</span>
          </Link>

          <nav className="fn-nav" aria-label="Desk sections">
            <Link
              href="/proto/admin"
              data-current={section === "desk" ? "true" : undefined}
            >
              essays
            </Link>
            <Link
              href="/proto/admin/settings"
              data-current={section === "settings" ? "true" : undefined}
            >
              settings
            </Link>
            <Link href="/proto" className="fn-desk-exit">
              view site ↗
            </Link>
          </nav>
        </div>
      </header>

      {children}
      <Toasts />
    </div>
  );
}
