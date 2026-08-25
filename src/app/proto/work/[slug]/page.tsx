import Link from "next/link";
import { notFound } from "next/navigation";
import { getProtoSnapshot } from "@/lib/proto-data";
import { PublicShell } from "@/components/proto/public-shell";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { work } = await getProtoSnapshot();
  return { title: work.find((w) => w.slug === slug)?.title ?? "Work" };
}

export default async function ProtoWorkDetail({ params }: Props) {
  const { slug } = await params;
  const { essays, work } = await getProtoSnapshot();
  const item = work.find((w) => w.slug === slug);
  if (!item) notFound();

  const others = work.filter((w) => w.slug !== slug).slice(0, 3);

  return (
    <PublicShell essays={essays} work={work}>
      <article className="fn-page fn-article">
        <Link href="/proto/work" className="fn-back fn-mono">
          ← work
        </Link>

        <header className="fn-article-head">
          <h1 className="fn-title fn-article-title">{item.title}</h1>
          <p className="fn-lede fn-article-dek">
            {item.summary || item.description}
          </p>
          <p className="fn-article-meta fn-mono">
            <span>{item.year}</span>
            <span aria-hidden="true">·</span>
            <span>{item.kind === "client" ? "client work" : "product"}</span>
            {item.client && (
              <>
                <span aria-hidden="true">·</span>
                <span>{item.client}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span
              className="fn-state"
              data-state={item.status === "active" ? "live" : "idle"}
            >
              {item.status}
            </span>
          </p>
        </header>

        <div className="fn-work-detail">
          <div className="fn-prose">
            <p>{item.description}</p>
          </div>

          {/*
            A spec table, because for a project this is genuinely tabular data
            and reads better aligned than as prose or pills.
          */}
          <aside className="fn-spec">
            <p className="fn-label">Specification</p>
            <dl className="fn-spec-list">
              <div>
                <dt>Domain</dt>
                <dd>{item.category}</dd>
              </div>
              <div>
                <dt>Stack</dt>
                <dd>{item.stack.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{item.status}</dd>
              </div>
              {item.links.length > 0 && (
                <div>
                  <dt>Links</dt>
                  <dd>
                    {item.links.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fn-spec-link"
                      >
                        {l.label} ↗
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        </div>

        {item.outcomes.length > 0 && (
          <section className="fn-outcomes">
            <h2 className="fn-label">What it does that others don&apos;t</h2>
            <ol className="fn-outcome-list">
              {item.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ol>
          </section>
        )}

        <nav className="fn-adjacent" aria-label="Other work">
          {others.map((o) => (
            <Link key={o.slug} href={`/proto/work/${o.slug}`} className="fn-adj">
              <span className="fn-label">{o.year}</span>
              <span className="fn-adj-title">{o.title}</span>
            </Link>
          ))}
        </nav>
      </article>
    </PublicShell>
  );
}
