import Link from "next/link";
import { getProtoSnapshot } from "@/lib/proto-data";
import { PublicShell } from "@/components/proto/public-shell";

export const revalidate = 60;
export const metadata = { title: "Work" };

/**
 * The work index.
 *
 * The production version is a two-column card grid where each card carries up
 * to eleven stack pills — 43 rounded-full elements across five projects, which
 * is the densest slop signal on the site. Here the stack is one mono line, the
 * outcomes are the body, and what a visitor actually wants to know (is it live,
 * who was it for, when) sits in the margin where they can scan it.
 */
export default async function ProtoWork() {
  const { essays, work } = await getProtoSnapshot();

  return (
    <PublicShell essays={essays} work={work}>
      <section className="fn-page fn-index-head">
        <h1 className="fn-title">Work</h1>
        <p className="fn-lede">
          Products I own and systems I shipped for clients. Each one is here
          because something in it was hard.
        </p>
      </section>

      <section className="fn-page">
        <div className="fn-ledger">
          {work.map((item) => (
            <article key={item.slug} className="fn-work">
              <div className="fn-work-gutter fn-mono">
                <span>{item.year}</span>
                <span>{item.kind === "client" ? "client work" : "product"}</span>
                <span
                  className="fn-state"
                  data-state={item.status === "active" ? "live" : "idle"}
                >
                  {item.status}
                </span>
              </div>

              <div className="fn-work-main">
                <h2 className="fn-work-title">
                  <Link href={`/proto/work/${item.slug}`}>{item.title}</Link>
                </h2>
                <p className="fn-work-summary">
                  {item.summary || item.description}
                </p>

                {item.outcomes.length > 0 && (
                  <ul className="fn-work-outcomes">
                    {item.outcomes.slice(0, 3).map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                )}

                {/* One line, comma-separated. Not eleven pills. */}
                {item.stack.length > 0 && (
                  <p className="fn-work-stack fn-mono">
                    {item.stack.join("  ·  ")}
                  </p>
                )}
              </div>

              <div className="fn-work-links fn-mono">
                <Link href={`/proto/work/${item.slug}`}>case study →</Link>
                {item.links.slice(0, 1).map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
