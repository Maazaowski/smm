import Link from "next/link";
import { getProtoSnapshot, toSubject } from "@/lib/proto-data";
import { PublicShell } from "@/components/proto/public-shell";

export const revalidate = 60;

/**
 * The homepage answers the six questions the audit found unanswered, in the
 * order a stranger asks them, using content that already exists on the site but
 * was buried on /about: the name, what he does, the evidence, the writing.
 *
 * No hero. The first thing on the page is a sentence and three numbers.
 */
export default async function ProtoHome() {
  const { essays, work, about } = await getProtoSnapshot();
  const recent = essays.slice(0, 5);
  const shipped = work.slice(0, 4);

  return (
    <PublicShell essays={essays} work={work}>
      {/* --- the statement ------------------------------------------------ */}
      <section className="fn-page fn-open">
        <p className="fn-label fn-open-eyebrow">
          Syed Muhammad Maaz — software &amp; AI engineer — Karachi, PK
        </p>

        <h1 className="fn-title fn-open-title">
          I build systems that have to keep working after I leave the room.
        </h1>

        <div className="fn-open-body">
          <p className="fn-lede">{about.bio[1]}</p>

          {/* The evidence, in mono, because these are measurements. This is the
              material the current site hides two clicks deep on /about. */}
          <dl className="fn-proof">
            <div>
              <dt className="fn-label">QA blockers</dt>
              <dd className="fn-mono">−80%</dd>
              <p>Claude-driven PR review on installer pipelines</p>
            </div>
            <div>
              <dt className="fn-label">Tooling cost</dt>
              <dd className="fn-mono">−$10k/yr</dd>
              <p>InstallShield → WiX migration</p>
            </div>
            <div>
              <dt className="fn-label">Install time</dt>
              <dd className="fn-mono">−92%</dd>
              <p>Rebuilt Installation Manager</p>
            </div>
          </dl>
        </div>

        <div className="fn-open-actions">
          <Link className="fn-btn" data-variant="primary" href="/proto/essays">
            Read the essays
          </Link>
          <a className="fn-btn" href="mailto:m.maaz96@gmail.com">
            Start a project
          </a>
          <span className="fn-state" data-state="live">
            {about.availability.label}
          </span>
        </div>
      </section>

      {/* --- the writing --------------------------------------------------- */}
      <section className="fn-page fn-block">
        <header className="fn-block-head">
          <h2 className="fn-label">Recent essays</h2>
          <Link href="/proto/essays" className="fn-mono fn-more">
            all {essays.length} →
          </Link>
        </header>

        <div className="fn-ledger">
          {recent.map((essay, i) => (
            <Link
              key={essay.slug}
              href={`/proto/essays/${essay.slug}`}
              className="fn-row"
            >
              <div className="fn-row-gutter">
                <span>{essay.date}</span>
                <span>{toSubject(essay.tags, essay.category)}</span>
              </div>
              <div>
                <h3 className="fn-row-title">{essay.title}</h3>
                <p className="fn-row-dek">{essay.dek}</p>
              </div>
              <div className="fn-row-aside">
                {String(i + 1).padStart(2, "0")} · {essay.minutes} min
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- the work ------------------------------------------------------ */}
      <section className="fn-page fn-block">
        <header className="fn-block-head">
          <h2 className="fn-label">Shipped</h2>
          <Link href="/proto/work" className="fn-mono fn-more">
            all {work.length} →
          </Link>
        </header>

        <div className="fn-ledger">
          {shipped.map((item) => (
            <Link
              key={item.slug}
              href={`/proto/work/${item.slug}`}
              className="fn-row"
            >
              <div className="fn-row-gutter">
                <span>{item.year}</span>
                <span>{item.kind === "client" ? "client work" : "product"}</span>
              </div>
              <div>
                <h3 className="fn-row-title">{item.title}</h3>
                <p className="fn-row-dek">{item.summary || item.description}</p>
              </div>
              <div className="fn-row-aside">
                <span
                  className="fn-state"
                  data-state={item.status === "active" ? "live" : "idle"}
                >
                  {item.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
