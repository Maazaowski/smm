"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * The desk bar and the small shared pieces every admin section uses.
 *
 * Sections are a row of mono text, not a sidebar: five destinations do not
 * need 240px of permanent furniture. The current section is read from the URL
 * by the page and passed down, so a refresh lands where you were.
 */

import { TABS, tabHref, type AdminTab } from "@/components/admin/tabs";

export type { AdminTab } from "@/components/admin/tabs";

export function AdminHead({
  tab,
  onLogout,
}: {
  tab: AdminTab;
  onLogout: () => void;
}) {
  return (
    <header className="ad-head">
      <div className="ad-head-l">
        <Link href="/admin" className="ad-wordmark" aria-label="Desk home">
          <b>Maaz</b>
          <span className="sg-micro">/ desk</span>
        </Link>
        <Clock />
      </div>

      <nav className="ad-tabs" aria-label="Sections">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={tabHref(t.id)}
            className="ad-tab"
            data-current={tab === t.id ? "true" : undefined}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="ad-head-r">
        <a className="ad-link" href="/" target="_blank" rel="noopener noreferrer">
          view site ↗
        </a>
        <button type="button" className="sg-cta" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}

/** The site header's Karachi clock, so the desk keeps the same time. */
function Clock() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Karachi",
        }).format(new Date())
      );
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="sg-clock" suppressHydrationWarning>
      {now ? `KHI ${now}` : ""}
    </span>
  );
}

/** The slug line every section opens with: [NN] // LABEL ............ FACT */
export function SectionSlug({
  tab,
  fact,
}: {
  tab: AdminTab;
  fact?: React.ReactNode;
}) {
  const t = TABS.find((x) => x.id === tab)!;
  return (
    <div className="sg-slug">
      <span className="sg-slug-n">[{t.n}]</span>
      <span className="sg-slug-label">{`// ${t.label}`}</span>
      <span className="sg-slug-fact">{fact ?? ""}</span>
    </div>
  );
}

export type NoticeTone = "info" | "ok" | "warn" | "bad";

export interface NoticeState {
  tone: NoticeTone;
  text: React.ReactNode;
  /** Present for confirmations: the destructive verb and what it does. */
  confirm?: { label: string; onConfirm: () => void; tone?: "danger" };
}

/**
 * Inline status and confirmation, replacing alert() and confirm().
 *
 * A confirm() dialog is dismissed by muscle memory — a stray Enter on "Email
 * this to 1,284 subscribers?" sends it. A notice that stays on the page with
 * the count in it, and a button that has to be aimed at, does not.
 */
export function Notice({
  notice,
  onDismiss,
}: {
  notice: NoticeState | null;
  onDismiss: () => void;
}) {
  if (!notice) return null;
  return (
    <div
      className="ad-notice"
      data-tone={notice.tone}
      role={notice.confirm ? "alertdialog" : "status"}
      aria-live="polite"
    >
      <span>{notice.text}</span>
      <span className="ad-notice-actions">
        {notice.confirm && (
          <button
            type="button"
            className="sg-cta"
            data-tone={notice.confirm.tone}
            onClick={notice.confirm.onConfirm}
          >
            {notice.confirm.label}
          </button>
        )}
        <button type="button" className="ad-link" onClick={onDismiss}>
          {notice.confirm ? "Cancel" : "Dismiss"}
        </button>
      </span>
    </div>
  );
}

export function Tag({
  tone,
  children,
}: {
  tone?: "live" | "draft" | "warn" | "bad";
  children: React.ReactNode;
}) {
  return (
    <span className="ad-tag" data-tone={tone}>
      {children}
    </span>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="ad-rows" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ad-skeleton" />
      ))}
    </div>
  );
}
