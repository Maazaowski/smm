import Link from "next/link";
import { getProtoSnapshot } from "@/lib/proto-data";
import { getTestimonials } from "@/lib/testimonials";
import { Reveal, Counter, Marquee } from "@/components/site/chrome";
import { jsonLd, personSchema, websiteSchema } from "@/lib/structured-data";
import { Trace } from "@/components/site/assets/heroes";
import { Mechanism } from "@/components/site/assets/mechanism";

export const revalidate = 60;

export const metadata = { alternates: { canonical: "/" } };


const PHASES = [
  {
    n: "01",
    t: "Find the real constraint",
    d: "Most briefs describe a symptom. Before anything gets built I want the trace, the query plan, or the ledger — whatever the actual evidence is. The refund agent that started my last essay looked fine on the diagram and wrong in the log.",
  },
  {
    n: "02",
    t: "Build the boring version",
    d: "Then make it fast. A dictionary lookup and an if-statement beat a model call for authorization, and they cost nothing. Cleverness goes where the problem is genuinely ambiguous, not where it is merely tedious.",
  },
  {
    n: "03",
    t: "Instrument, then leave",
    d: "Log every gate that blocks and every gate that errors. The measure of the work is whether someone else can reconstruct what happened six months after I have gone.",
  },
];

const SERVICES = [
  { t: "AI agents in production", d: "Tool authorization, input screening, evals, and the failure modes nobody chooses. Deployed, not demoed." },
  { t: "Full-stack product", d: "Next.js, .NET Core, FastAPI, Postgres. End to end: architecture, build, deploy, iterate." },
  { t: "Systems that must not drift", d: "Double-entry ledgers, multi-currency, reconciliation. Where a rounding error is a legal problem." },
  { t: "Legacy migration", d: "WinForms to WPF. InstallShield to WiX. Monolith to microservices. Without stopping the business." },
  { t: "LLM pipelines & evals", d: "Prompt testing as code. Deterministic extraction. Model cost that drops to zero after the first run." },
  { t: "Technical due diligence", d: "Read the codebase, name the risk, price the fix. Written up so a non-engineer can act on it." },
];

const STACK = [
  "C#", ".NET Core 8", "TypeScript", "Next.js", "React", "Python", "FastAPI",
  "PostgreSQL", "MongoDB", "SQL Server", "Redis", "gRPC", "RabbitMQ",
  "MassTransit", "Docker", "Azure DevOps", "AWS", "GCP", "Vercel", "Avalonia XPF",
  "Claude", "LLM orchestration", "SonarQube", "WiX",
];

export default async function SignalHome() {
  const [{ essays, work, about }, references] = await Promise.all([
    getProtoSnapshot(),
    getTestimonials(),
  ]);
  const ordered = ["khataflow", "stencil", "signal", "hotplate", "raqam"]
    .map((slug) => work.find((w) => w.slug === slug))
    .filter(Boolean) as typeof work;

  return (
    <>
      <script {...jsonLd(websiteSchema(), personSchema())} />
        {/* ================================================== HERO ===== */}
        <section className="sg-wrap sg-hero">
          <h1 className="sg-wordmark" aria-label="Maaz">
            <span>MAAZ</span>
          </h1>

          <div className="sg-facts">
            <div className="sg-fact">
              <span className="sg-fact-k">Software &amp; AI engineer</span>
              <span className="sg-fact-v">Six years shipping production systems</span>
            </div>
            <div className="sg-fact">
              <span className="sg-fact-k">Independent since 2025</span>
              <span className="sg-fact-v">Previously senior at Astera Software</span>
            </div>
            <div className="sg-fact">
              <span className="sg-fact-k">Karachi, Pakistan</span>
              <span className="sg-live">Available for work</span>
            </div>
          </div>

          {/*
            The hero plate. A request moving through gates — input screening,
            retrieval, tool authorization, output filtering — where roughly one
            in five is blocked and dies where it was caught. It is the argument
            of "Your output filter is not a guardrail" as a moving picture,
            which is why it is here instead of a photograph: nobody else can
            have it, because nobody else wrote that essay.
          */}
          <Reveal delay={120}>
            <div className="sg-plate">
              <Trace />
            </div>
          </Reveal>
        </section>

        {/* ============================================== APPROACH ===== */}
        <section className="sg-wrap sg-section" id="approach">
          <div className="sg-slug">
            <span className="sg-slug-n">[01]</span>
            <span className="sg-slug-label">{"// Approach"}</span>
            <span className="sg-slug-fact">Three phases</span>
          </div>

          <Reveal className="sg-shead" as="header">
            <div>
              <span className="sg-micro sg-shead-eyebrow">How the work goes</span>
              <h2 className="sg-h2">
                I build systems that outlive my involvement
              </h2>
            </div>
            <p className="sg-lead">
              {about.bio[1]}
            </p>
          </Reveal>

          <div className="sg-phases">
            {PHASES.map((p, i) => (
              <Reveal key={p.n} className="sg-phase" delay={i * 90}>
                <span className="sg-phase-n">{p.n}</span>
                <h3 className="sg-h3">{p.t}</h3>
                <p>{p.d}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================================================== WORK ===== */}
        <section className="sg-wrap sg-section" id="work">
          <div className="sg-slug">
            <span className="sg-slug-n">[02]</span>
            <span className="sg-slug-label">{"// Work"}</span>
            <span className="sg-slug-fact">{ordered.length} shipped · 2024—2026</span>
          </div>

          <Reveal className="sg-shead" as="header">
            <div>
              <span className="sg-micro sg-shead-eyebrow">Selected</span>
              <h2 className="sg-h2">Things that are running
              </h2>
            </div>
            <p className="sg-lead">
              Products I own and systems shipped for clients. Each one is here
              because something in it was genuinely hard.
            </p>
          </Reveal>

          <div className="sg-works">
            {ordered.map((w, i) => (
              <Reveal key={w.slug} className="sg-work" as="article">
                {/*
                  The plate animates whatever made this project hard, not what
                  it looks like. Screenshots live in the case study, where
                  someone has already decided they care.
                */}
                <div className="sg-work-shot">
                  <span className="sg-work-index sg-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Mechanism slug={w.slug} />
                </div>

                <div className="sg-work-meta">
                  <h3 className="sg-h3">{w.title}</h3>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>
                    {w.summary || w.description}
                  </p>

                  {w.outcomes.length > 0 && (
                    <ul className="sg-work-out">
                      {w.outcomes.slice(0, 2).map((o) => (
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

        {/* ================================================ RECORD ===== */}
        <section className="sg-wrap sg-section" id="record">
          <div className="sg-slug">
            <span className="sg-slug-n">[03]</span>
            <span className="sg-slug-label">{"// Record"}</span>
            <span className="sg-slug-fact">Astera Software · 2020—2025</span>
          </div>

          <Reveal className="sg-shead" as="header">
            <div>
              <span className="sg-micro sg-shead-eyebrow">Measured, not claimed</span>
              <h2 className="sg-h2">Numbers with a source
              </h2>
            </div>
            <p className="sg-lead">
              Every figure below comes from a specific piece of work with a name
              attached. None of them are round, because real ones rarely are.
            </p>
          </Reveal>

          <div className="sg-record">
            <Reveal className="sg-stat">
              <Counter to={80} suffix="%" prefix="−" />
              <span className="sg-stat-k">QA blockers</span>
              <p className="sg-stat-src">
                Claude-driven PR review on installer pipelines
              </p>
            </Reveal>
            <Reveal className="sg-stat" delay={80}>
              <Counter to={10} prefix="−$" suffix="k/yr" />
              <span className="sg-stat-k">Tooling spend</span>
              <p className="sg-stat-src">InstallShield → WiX migration</p>
            </Reveal>
            <Reveal className="sg-stat" delay={160}>
              <Counter to={92} suffix="%" prefix="−" />
              <span className="sg-stat-k">Install time</span>
              <p className="sg-stat-src">
                Installation Manager, rebuilt on Builder/Factory
              </p>
            </Reveal>
            <Reveal className="sg-stat" delay={240}>
              <Counter to={67} suffix="%" prefix="−" />
              <span className="sg-stat-k">Critical vulns</span>
              <p className="sg-stat-src">SonarQube audits across 12 sprints</p>
            </Reveal>
          </div>

          <div style={{ marginTop: 44 }}>
            <Marquee items={STACK} />
          </div>
        </section>

        {/* =============================================== WRITING ===== */}
        <section className="sg-wrap sg-section" id="writing">
          <div className="sg-slug">
            <span className="sg-slug-n">[04]</span>
            <span className="sg-slug-label">{"// Writing"}</span>
            <span className="sg-slug-fact">{essays.length} essays</span>
          </div>

          <Reveal className="sg-shead" as="header">
            <div>
              <span className="sg-micro sg-shead-eyebrow">In the open</span>
              <h2 className="sg-h2">What I got wrong first
              </h2>
            </div>
            <p className="sg-lead">
              Long-form on agents, ledgers and pipelines. Written after the fact,
              with the trace included.
            </p>
          </Reveal>

          <div className="sg-essays">
            {essays.map((e, i) => (
              <Reveal key={e.slug} delay={i * 60}>
                <Link href={`/blog/${e.slug}`} className="sg-essay">
                  <span className="sg-essay-r sg-mono">{e.date}</span>
                  <div>
                    <h3 className="sg-essay-t">{e.title}</h3>
                    <p className="sg-essay-d">{e.dek}</p>
                  </div>
                  <span className="sg-essay-r sg-mono">{e.minutes} min →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============================================= STATEMENT ===== */}
        <Reveal as="section" className="sg-wrap sg-statement">
          <p className="sg-statement-q">
            The safety check that runs after the money moves is not a guardrail.
            It is a receipt.
          </p>
          <p>
            Most of what I write comes out of getting something wrong in
            production and then having to explain it. That turns out to be the
            only reliable source of anything worth saying.
          </p>
        </Reveal>

        {/* ============================================== SERVICES ===== */}
        <section className="sg-wrap sg-section" id="services">
          <div className="sg-slug">
            <span className="sg-slug-n">[05]</span>
            <span className="sg-slug-label">{"// Services"}</span>
            <span className="sg-slug-fact">Two client slots open</span>
          </div>

          <Reveal className="sg-shead" as="header">
            <div>
              <span className="sg-micro sg-shead-eyebrow">Engagements</span>
              <h2 className="sg-h2">What you can hire
              </h2>
            </div>
            <p className="sg-lead">{about.availability.message}</p>
          </Reveal>

          <div className="sg-services">
            {SERVICES.map((s, i) => (
              <Reveal key={s.t} className="sg-service" delay={(i % 3) * 80}>
                <span className="sg-micro">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="sg-h3">{s.t}</h3>
                <p>{s.d}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============================================ REFERENCES ===== */}
        {/*
          Renders whatever is published from the admin's References tab. The
          section removes itself when there is nothing to show rather than
          standing there empty — an unfilled testimonial block is worse than no
          testimonial block, which is why the reference site's marquee repeats
          the same three quotes four times to fill its loop.
        */}
        {references.length > 0 && (
          <section className="sg-wrap sg-section" id="references">
            <div className="sg-slug">
              <span className="sg-slug-n">[06]</span>
              <span className="sg-slug-label">{"// References"}</span>
              <span className="sg-slug-fact">
                {references.length} on record
              </span>
            </div>

            <Reveal className="sg-shead" as="header">
              <div>
                <span className="sg-micro sg-shead-eyebrow">Third parties</span>
                <h2 className="sg-h2">What they said afterwards</h2>
              </div>
              <p className="sg-lead">
                People who worked with me, in their words. Every one links to
                where it can be checked.
              </p>
            </Reveal>

            <div className="sg-ref-cards">
              {references.map((r, i) => (
                <Reveal key={r.id} className="sg-ref" delay={(i % 3) * 70}>
                  <blockquote>{r.quote}</blockquote>
                  <div className="sg-ref-who">
                    <span className="sg-micro" style={{ color: "var(--white)" }}>
                      {r.author}
                    </span>
                    <span className="sg-micro">
                      {r.role}, {r.company}
                    </span>
                    {r.sourceUrl && (
                      <a
                        className="sg-ref-src sg-micro"
                        href={r.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        verify ↗
                      </a>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* =============================================== CONTACT ===== */}
        <section className="sg-wrap sg-contact" id="contact">
          <div className="sg-slug">
            <span className="sg-slug-n">[07]</span>
            <span className="sg-slug-label">{"// Contact"}</span>
            <span className="sg-slug-fact">Replies within a day</span>
          </div>

          <Reveal>
            <h2 className="sg-h2">
              Got something that has to work?
            </h2>
            <p className="sg-lead" style={{ margin: "22px auto 0" }}>
              Tell me what breaks, what it costs when it breaks, and what you
              have tried. That is enough for me to say whether I can help.
            </p>
            <div className="sg-contact-actions">
              <a className="sg-cta sg-cta-lg" data-fill="true" href="mailto:m.maaz96@gmail.com">
                m.maaz96@gmail.com
              </a>
              <a
                className="sg-cta sg-cta-lg"
                href="https://www.linkedin.com/in/syed-muhammad-maaz-193292148"
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
