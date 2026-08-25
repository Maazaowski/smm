import { getAboutContent } from "@/lib/about";
import { Reveal } from "@/components/site/chrome";
import { SITE } from "@/lib/constants";
import { jsonLd, personSchema, breadcrumbSchema } from "@/lib/structured-data";

export const revalidate = 60;

export const metadata = {
  title: "About",
  description:
    "Syed Muhammad Maaz. Freelance software and AI engineer. Six years shipping production systems.",
  alternates: { canonical: "/about" },
};

/**
 * The full record.
 *
 * The homepage carries four numbers; this is where the rest lives — the
 * timeline, education, credentials and toolkit. Read from getAboutContent(),
 * the same source the admin's About editor writes to, so this page stays
 * editable without a deploy.
 *
 * Skills are grouped prose rather than a cloud of thirty pills, and the
 * timeline is a ledger. Both are the same decisions the audit reached; the
 * shell around them is the only thing that changed.
 */
export default async function About() {
  const { content } = await getAboutContent();

  return (
    <>
      <script
        {...jsonLd(
          personSchema(),
          breadcrumbSchema([{ name: "About", path: "/about" }])
        )}
      />

      <section className="sg-wrap sg-section">
        <div className="sg-slug">
          <span className="sg-slug-n">[00]</span>
          <span className="sg-slug-label">{"// Who"}</span>
          <span className="sg-slug-fact">Karachi, PK</span>
        </div>

        <Reveal className="sg-shead" as="header">
          <div>
            <span className="sg-micro sg-shead-eyebrow">
              {SITE.author.name}
            </span>
            <h1 className="sg-h2">Six years of things that had to keep working</h1>
          </div>
          <div className="sg-about-bio">
            {content.bio.map((p, i) => (
              <p key={i} className={i === 0 ? "sg-lead" : undefined}>
                {p}
              </p>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------- NOW ---- */}
      <section className="sg-wrap sg-section">
        <div className="sg-slug">
          <span className="sg-slug-n">[01]</span>
          <span className="sg-slug-label">{"// Now"}</span>
          <span className="sg-slug-fact">{content.availability.label}</span>
        </div>
        <Reveal>
          <p className="sg-lead sg-about-now">{content.availability.message}</p>
        </Reveal>
      </section>

      {/* -------------------------------------------------- TIMELINE ---- */}
      <section className="sg-wrap sg-section">
        <div className="sg-slug">
          <span className="sg-slug-n">[02]</span>
          <span className="sg-slug-label">{"// Record"}</span>
          <span className="sg-slug-fact">{content.timeline.length} roles</span>
        </div>

        <div className="sg-record-list">
          {content.timeline.map((entry, i) => (
            <Reveal key={`${entry.company}-${entry.period}`} delay={i * 50}>
              <article className="sg-role">
                <div className="sg-role-when sg-mono">
                  <span>{entry.period}</span>
                  {entry.location && <span>{entry.location}</span>}
                </div>
                <div>
                  <h2 className="sg-h3">{entry.role}</h2>
                  <p className="sg-role-co sg-mono">{entry.company}</p>
                  <ul className="sg-work-out">
                    {entry.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------- CREDENTIALS ---- */}
      <section className="sg-wrap sg-section">
        <div className="sg-slug">
          <span className="sg-slug-n">[03]</span>
          <span className="sg-slug-label">{"// Credentials"}</span>
          <span className="sg-slug-fact">Verifiable</span>
        </div>

        <div className="sg-record-list">
          <Reveal>
            <article className="sg-role">
              <div className="sg-role-when sg-mono">
                <span>{content.education.period}</span>
                <span>{content.education.location}</span>
              </div>
              <div>
                <h2 className="sg-h3">{content.education.degree}</h2>
                <p className="sg-role-co sg-mono">
                  {content.education.institution}
                  {content.education.gpa ? ` · ${content.education.gpa}` : ""}
                </p>
              </div>
            </article>
          </Reveal>

          {content.certificates.map((c, i) => (
            <Reveal key={c.url} delay={(i + 1) * 50}>
              <a
                className="sg-role sg-role-link"
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="sg-role-when sg-mono">
                  <span>{c.issuedAt ?? ""}</span>
                  <span>certificate</span>
                </div>
                <div>
                  <h2 className="sg-h3">{c.title}</h2>
                  <p className="sg-role-co sg-mono">{c.issuer} — verify ↗</p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- TOOLKIT ---- */}
      <section className="sg-wrap sg-section">
        <div className="sg-slug">
          <span className="sg-slug-n">[04]</span>
          <span className="sg-slug-label">{"// Toolkit"}</span>
          <span className="sg-slug-fact">
            {Object.keys(content.skills).length} areas
          </span>
        </div>

        <Reveal>
          <dl className="sg-skills">
            {Object.entries(content.skills).map(([group, items]) => (
              <div key={group}>
                <dt className="sg-micro">{group}</dt>
                <dd>{items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* --------------------------------------------------- CONTACT ---- */}
      <section className="sg-wrap sg-contact" id="contact">
        <Reveal>
          <h2 className="sg-h2">Got something that has to work?</h2>
          <p className="sg-lead" style={{ margin: "22px auto 0" }}>
            Tell me what breaks, what it costs when it breaks, and what you have
            tried. That is enough for me to say whether I can help.
          </p>
          <div className="sg-contact-actions">
            <a
              className="sg-cta sg-cta-lg"
              data-fill="true"
              href={`mailto:${SITE.author.email}`}
            >
              {SITE.author.email}
            </a>
            <a
              className="sg-cta sg-cta-lg"
              href={`https://www.linkedin.com/in/${SITE.author.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
