"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

const NAV = [
  { label: "essays", href: "/proto/essays" },
  { label: "work", href: "/proto/work" },
  { label: "colophon", href: "/proto/colophon" },
];

/**
 * The persistent header.
 *
 * The wordmark leads with the name and keeps the handle as a subordinate mono
 * line, rather than branding the site with a GitHub username. The current page
 * is marked with a rule under the item — a tick in the margin, not a pill.
 */
export function Spine({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Navigating closes the menu. Adjusting during render avoids the extra pass
  // where the new page is behind a menu that is still open.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <header className="fn-spine">
      <div className="fn-spine-inner">
        <Link href="/proto" className="fn-wordmark" aria-label="Maaz, home">
          <b>Maaz</b>
          <span>maazaowski</span>
        </Link>

        <nav className="fn-nav fn-nav-wide" aria-label="Sections">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-current={pathname?.startsWith(item.href) ? "true" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="fn-spine-tools">
          {/* Search is a real control at every width — not a desktop-only ⌘K. */}
          <button
            type="button"
            className="fn-tool"
            onClick={onOpenSearch}
            aria-label="Search essays and work"
          >
            <span aria-hidden="true">search</span>
            <kbd className="fn-kbd fn-kbd-wide">⌘K</kbd>
          </button>
          <ThemeSwitch />
          <button
            type="button"
            className="fn-tool fn-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="fn-mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "close" : "menu"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <MobileNav
          id="fn-mobile-nav"
          pathname={pathname ?? ""}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}

function MobileNav({
  id,
  pathname,
  onClose,
}: {
  id: string;
  pathname: string;
  onClose: () => void;
}) {
  // Escape closes it, and focus does not wander into the page behind.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div id={id} className="fn-mobile-nav">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          data-current={pathname.startsWith(item.href) ? "true" : undefined}
        >
          <span className="fn-mono">{item.label}</span>
          <span aria-hidden="true">→</span>
        </Link>
      ))}
      <Link href="/proto/admin" className="fn-mobile-admin">
        <span className="fn-mono">desk</span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

/**
 * Theme is a three-state control (auto / light / dark), because "auto" is the
 * state most visitors are actually in and the production toggle hides it.
 */
type ThemeMode = "auto" | "light" | "dark";

const themeListeners = new Set<() => void>();

function subscribeTheme(fn: () => void) {
  themeListeners.add(fn);
  return () => themeListeners.delete(fn);
}

function readTheme(): ThemeMode {
  const stored = window.localStorage.getItem("fn-theme");
  return stored === "light" || stored === "dark" ? stored : "auto";
}

function writeTheme(mode: ThemeMode) {
  const root = document.querySelector<HTMLElement>(".fn");
  if (mode === "auto") {
    root?.removeAttribute("data-fn-theme");
    window.localStorage.removeItem("fn-theme");
  } else {
    root?.setAttribute("data-fn-theme", mode);
    window.localStorage.setItem("fn-theme", mode);
  }
  themeListeners.forEach((fn) => fn());
}

function ThemeSwitch() {
  // localStorage is an external store, so it is read as one. Mirroring it into
  // state inside an effect means an extra render and a flash of the wrong
  // label; useSyncExternalStore gives the server "auto" and the client the
  // real value without either.
  const mode = useSyncExternalStore<ThemeMode>(
    subscribeTheme,
    readTheme,
    () => "auto"
  );

  const next: ThemeMode =
    mode === "auto" ? "light" : mode === "light" ? "dark" : "auto";

  return (
    <button
      type="button"
      className="fn-tool"
      onClick={() => writeTheme(next)}
      aria-label={`Theme: ${mode}. Switch to ${next}.`}
      title={`Theme: ${mode}`}
    >
      {mode}
    </button>
  );
}
