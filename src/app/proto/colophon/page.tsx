import { getProtoSnapshot } from "@/lib/proto-data";
import { PublicShell } from "@/components/proto/public-shell";

export const revalidate = 60;
export const metadata = { title: "Colophon" };

/**
 * About, renamed and restructured.
 *
 * "About Me" is the most generic heading a personal site can carry. A colophon
 * is what a publication puts at the back: who made this, with what, and how to
 * reach them. It suits a site whose subject is how things are built.
 *
 * The content is the same résumé the production About page carries — it is
 * strong, specific and quantified. What changes is that it reads as a record
 * rather than a wall of 30 skill pills: the timeline is a ledger, and skills
 * are grouped prose instead of a pill cloud.
 */
export default async function ProtoColophon() {
  const { essays, work, about } = await getProtoSnapshot();

  return (
    <PublicShell essays={essays} work={work}>
      <section className="fn-page fn-index-head">
        <h1 className="fn-title">Colophon</h1>
        <div className="fn-colophon-bio">
          {about.bio.map((p, i) => (
            <p key={i} className={i === 0 ? "fn-lede" : undefined}>
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className="fn-page fn-block">
        <h2 className="fn-label">Now</h2>
        <div className="fn-now">
          <span className="fn-state" data-state="live">
            {about.availability.label}
          </span>
          <p>{about.availability.message}</p>
        </div>
      </section>

      <section className="fn-page fn-block">
        <h2 className="fn-label">Record</h2>
        <div className="fn-ledger">
          {about.timeline.map((entry) => (
            <div key={`${entry.company}-${entry.period}`} className="fn-row">
              <div className="fn-row-gutter">
                <span>{entry.period}</span>
                <span>{entry.location ?? ""}</span>
              </div>
              <div>
                <h3 className="fn-row-title">{entry.role}</h3>
                <p className="fn-record-company fn-mono">{entry.company}</p>
                <ul className="fn-record-points">
                  {entry.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
              <div className="fn-row-aside" />
            </div>
          ))}
        </div>
      </section>

      <section className="fn-page fn-block">
        <h2 className="fn-label">Toolkit</h2>
        <dl className="fn-skills">
          {Object.entries(about.skills).map(([group, items]) => (
            <div key={group}>
              <dt className="fn-mono">{group.toLowerCase()}</dt>
              <dd>{items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="fn-page fn-block">
        <h2 className="fn-label">Credentials</h2>
        <div className="fn-ledger">
          <div className="fn-row">
            <div className="fn-row-gutter">
              <span>{about.education.period}</span>
              <span>{about.education.location}</span>
            </div>
            <div>
              <h3 className="fn-row-title">{about.education.degree}</h3>
              <p className="fn-record-company fn-mono">
                {about.education.institution}
                {about.education.gpa ? ` · ${about.education.gpa}` : ""}
              </p>
            </div>
            <div className="fn-row-aside" />
          </div>

          {about.certificates.map((c) => (
            <a
              key={c.url}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="fn-row"
            >
              <div className="fn-row-gutter">
                <span>{c.issuedAt ?? ""}</span>
                <span>certificate</span>
              </div>
              <div>
                <h3 className="fn-row-title">{c.title}</h3>
                <p className="fn-record-company fn-mono">{c.issuer}</p>
              </div>
              <div className="fn-row-aside">verify ↗</div>
            </a>
          ))}
        </div>
      </section>

      <section className="fn-page fn-block">
        <h2 className="fn-label">This site</h2>
        <div className="fn-prose fn-colophon-tech">
          <p>
            Next.js on Vercel, Postgres on Neon, MDX rendered on the server.
            Type is Newsreader and IBM Plex Mono. Two families, four weights,
            no icon font. Written and deployed by me.
          </p>
        </div>
      </section>

      <section className="fn-page fn-block fn-contact">
        <h2 className="fn-title fn-contact-title">
          If you have a system that has to keep working, I&apos;d like to hear
          about it.
        </h2>
        <div className="fn-open-actions">
          <a className="fn-btn" data-variant="primary" href="mailto:m.maaz96@gmail.com">
            m.maaz96@gmail.com
          </a>
          <a
            className="fn-btn"
            href="https://www.linkedin.com/in/syed-muhammad-maaz-193292148"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </section>
    </PublicShell>
  );
}
