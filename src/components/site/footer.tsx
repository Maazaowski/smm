import Link from "next/link";
import { SITE } from "@/lib/constants";

/**
 * Site footer. Server component — nothing here needs the client.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="sg-wrap sg-foot">
      <span className="sg-micro">
        {SITE.author.name} — Karachi, PK — {year}
      </span>
      <div className="sg-foot-links sg-micro">
        <Link href="/blog">Essays</Link>
        <Link href="/projects">Work</Link>
        <Link href="/about">About</Link>
        <a href={`https://github.com/${SITE.author.github}`}>GitHub</a>
        <a href={`https://www.linkedin.com/in/${SITE.author.linkedin}`}>
          LinkedIn
        </a>
        <a href="/rss.xml">RSS</a>
      </div>
    </footer>
  );
}
