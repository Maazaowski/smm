"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Spine } from "./spine";
import { CommandBar } from "./command-bar";
import type { ProtoEssay, ProtoWork } from "@/lib/proto-data";

/**
 * Client shell for the public prototype: the spine, the search overlay, the
 * footer, and the ⌘K binding. Kept thin so every page below it stays a server
 * component rendering real content.
 */
export function PublicShell({
  essays,
  work,
  children,
}: {
  essays: ProtoEssay[];
  work: ProtoWork[];
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      {/* A keyboard user reaches the writing in one press, not after the nav
          and every section anchor in the article. */}
      <a href="#fn-main" className="fn-skip">
        Skip to content
      </a>

      <Spine onOpenSearch={() => setSearchOpen(true)} />

      <main id="fn-main">{children}</main>

      <footer className="fn-foot">
        <div className="fn-page fn-foot-inner">
          <div>
            <p className="fn-label">Elsewhere</p>
            <div className="fn-foot-links fn-mono">
              <a href="https://github.com/Maazaowski">github</a>
              <a href="https://www.linkedin.com/in/syed-muhammad-maaz-193292148">
                linkedin
              </a>
              <a href="mailto:m.maaz96@gmail.com">email</a>
              <Link href="/proto/admin">desk</Link>
            </div>
          </div>
          <div>
            <p className="fn-label">Feed</p>
            <div className="fn-foot-links fn-mono">
              <a href="/rss.xml">rss — full text</a>
            </div>
          </div>
          <p className="fn-foot-note fn-mono">
            Syed Muhammad Maaz — Karachi, PK
            <br />
            Set in Newsreader and IBM Plex Mono.
          </p>
        </div>
      </footer>

      <CommandBar
        open={searchOpen}
        onClose={close}
        essays={essays}
        work={work}
      />
    </>
  );
}
