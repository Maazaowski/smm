import Link from "next/link";
import { notFound } from "next/navigation";
import { getProtoSnapshot } from "@/lib/proto-data";
import { GALLERIES } from "@/lib/site-galleries";
import { Reveal } from "@/components/site/chrome";
import { Mechanism } from "@/components/site/assets/mechanism";
import { Gallery } from "@/components/site/gallery";
import { jsonLd, projectSchema, breadcrumbSchema } from "@/lib/structured-data";
import { getProjectBySlug } from "@/lib/projects";

export const revalidate = 60;


const ORDER = ["khataflow", "stencil", "signal", "hotplate", "raqam"];

interface Props {
  params: Promise<{ slug: string }>;
}

/** Pre-render every project at build time. See the note in blog/[slug]. */
export async function generateStaticParams() {
  try {
    const { work } = await getProtoSnapshot();
    return work.map((w) => ({ slug: w.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { work } = await getProtoSnapshot();
  const item = work.find((w) => w.slug === slug);
  return {
    title: item?.title ?? "Work",
    description: item?.summary || item?.description,
    alternates: { canonical: `/projects/${slug}` },
  };
}

/**
 * A case study.
 *
 * The mechanism plate leads, because it is the same object the index showed and
 * carrying it across gives the navigation continuity. The screenshots come
 * after the argument — by the time someone reaches them they have decided they
 * care, which is exactly the point of keeping them off the index.
 */
export default async function CaseStudy({ params }: Props) {
  const { slug } = await params;
  const { work } = await getProtoSnapshot();

  const item = work.find((w) => w.slug === slug);
  if (!item) notFound();

  const shots = GALLERIES[slug] ?? [];
  const sorted = ORDER.map((s) => work.find((w) => w.slug === s)).filter(
    Boolean
  ) as typeof work;
  const idx = sorted.findIndex((w) => w.slug === slug);
  const prev = idx > 0 ? sorted[idx - 1] : sorted[sorted.length - 1];
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : sorted[0];

  const dbProject = await getProjectBySlug(slug).catch(() => null);

  return (
    <>
      {dbProject && (
        <script
          {...jsonLd(
            projectSchema(dbProject),
            breadcrumbSchema([
              { name: "Work", path: "/projects" },
              { name: item.title, path: `/projects/${slug}` },
            ])
          )}
        />
      )}
        <article className="sg-wrap sg-case">
          <Link href="/#work" className="sg-back sg-mono">
            ← all work
          </Link>

          <header className="sg-case-head">
            <h1 className="sg-h2">{item.title}</h1>
            <p className="sg-lead">{item.summary || item.description}</p>
          </header>

          {/* The same plate the index showed, at full width. */}
          <Reveal delay={80}>
            <div className="sg-case-plate">
              <Mechanism slug={slug} />
            </div>
          </Reveal>

          <div className="sg-slug">
            <span className="sg-slug-n">[01]</span>
            <span className="sg-slug-label">{"// Spec"}</span>
            <span className="sg-slug-fact">
              {item.kind === "client" ? "Client work" : "Product"} · {item.year}
            </span>
          </div>

          <Reveal className="sg-case-spec" as="section">
            <dl>
              <div>
                <dt>Domain</dt>
                <dd>{item.category}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span
                    className="sg-live"
                    style={
                      item.status === "active" ? undefined : { color: "var(--dim)" }
                    }
                  >
                    {item.status}
                  </span>
                </dd>
              </div>
              {item.client && (
                <div>
                  <dt>Client</dt>
                  <dd>{item.client}</dd>
                </div>
              )}
              <div>
                <dt>Stack</dt>
                <dd>{item.stack.join(" · ") || "—"}</dd>
              </div>
              {item.links.length > 0 && (
                <div>
                  <dt>Live</dt>
                  <dd>
                    {item.links.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sg-case-link"
                      >
                        {l.label} ↗
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <div className="sg-case-body">
              <p>{item.description}</p>
            </div>
          </Reveal>

          {item.outcomes.length > 0 && (
            <>
              <div className="sg-slug">
                <span className="sg-slug-n">[02]</span>
                <span className="sg-slug-label">{"// What it does differently"}</span>
                <span className="sg-slug-fact">{item.outcomes.length} decisions</span>
              </div>

              <Reveal as="section">
                <ol className="sg-case-outcomes">
                  {item.outcomes.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ol>
              </Reveal>
            </>
          )}

          {shots.length > 0 && (
            <>
              <div className="sg-slug">
                <span className="sg-slug-n">[03]</span>
                <span className="sg-slug-label">{"// Screens"}</span>
                <span className="sg-slug-fact">{shots.length} shots</span>
              </div>

              <Reveal as="section">
                <Gallery shots={shots} />
              </Reveal>
            </>
          )}

          <nav className="sg-case-nav" aria-label="Other projects">
            <Link href={`/projects/${prev.slug}`}>
              <span className="sg-micro">Previous</span>
              <span className="sg-h3">{prev.title}</span>
            </Link>
            <Link href={`/projects/${next.slug}`} className="sg-case-next">
              <span className="sg-micro">Next</span>
              <span className="sg-h3">{next.title}</span>
            </Link>
          </nav>
        </article>
    </>
  );
}
