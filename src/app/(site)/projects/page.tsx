import Link from "next/link";
import { getProtoSnapshot } from "@/lib/proto-data";
import { Reveal } from "@/components/site/chrome";
import { Mechanism } from "@/components/site/assets/mechanism";
import { jsonLd, breadcrumbSchema } from "@/lib/structured-data";

export const revalidate = 60;

export const metadata = {
  title: "Work",
  description:
    "Products I own and systems shipped for clients. Each one is here because something in it was genuinely hard.",
  alternates: { canonical: "/projects" },
};

const ORDER = ["khataflow", "stencil", "signal", "hotplate", "raqam"];

/**
 * The work index.
 *
 * Same staggered plates as the homepage's work section, but the full list and
 * with room for every outcome rather than the first two. The plate animates
 * what made each project hard; the screenshots stay in the case study.
 */
export default async function WorkIndex() {
  const { work } = await getProtoSnapshot();
  const ordered = ORDER.map((s) => work.find((w) => w.slug === s)).filter(
    Boolean
  ) as typeof work;

  return (
    <>
      <script
        {...jsonLd(breadcrumbSchema([{ name: "Work", path: "/projects" }]))}
      />

      <section className="sg-wrap sg-section" id="work">
        <div className="sg-slug">
          <span className="sg-slug-n">[00]</span>
          <span className="sg-slug-label">{"// Work"}</span>
          <span className="sg-slug-fact">{ordered.length} shipped</span>
        </div>

        <Reveal className="sg-shead" as="header">
          <div>
            <span className="sg-micro sg-shead-eyebrow">Selected</span>
            <h1 className="sg-h2">Things that are running</h1>
          </div>
          <p className="sg-lead">
            Products I own and systems shipped for clients. Each one is here
            because something in it was genuinely hard.
          </p>
        </Reveal>

        <div className="sg-works">
          {ordered.map((w, i) => (
            <Reveal key={w.slug} className="sg-work" as="article">
              <div className="sg-work-shot">
                <span className="sg-work-index sg-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Mechanism slug={w.slug} />
              </div>

              <div className="sg-work-meta">
                <h2 className="sg-h3">{w.title}</h2>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>
                  {w.summary || w.description}
                </p>

                {w.outcomes.length > 0 && (
                  <ul className="sg-work-out">
                    {w.outcomes.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                )}

                <dl className="sg-work-kv">
                  <dt>Stack</dt>
                  <dd>{w.stack.slice(0, 6).join(" · ")}</dd>
                </dl>
                <dl className="sg-work-kv">
                  <dt>Kind</dt>
                  <dd>
                    {w.kind === "client" ? "Client work" : "Product"} · {w.year}{" "}
                    · {w.status}
                  </dd>
                </dl>

                <Link className="sg-work-link" href={`/projects/${w.slug}`}>
                  Case study <span aria-hidden="true">→</span>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
