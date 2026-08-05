import type { Metadata } from "next";
import { GlassCard } from "@/components/ui/glass-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { SITE } from "@/lib/constants";
import { getAboutContent } from "@/lib/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "Syed Muhammad Maaz. Freelance Software & AI Engineer. 6+ years shipping backend systems, microservices, and AI agents.",
};

export const revalidate = 60;

export default async function AboutPage() {
  const { content } = await getAboutContent();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <ScrollReveal>
        <header className="mb-16">
          <h1 className="font-display text-4xl sm:text-5xl text-primary mb-6">
            About Me
          </h1>
          {content.bio.map((paragraph, i) => (
            <p
              key={i}
              className={`text-lg text-secondary leading-relaxed${i > 0 ? " mt-4" : ""}`}
            >
              {paragraph}
            </p>
          ))}
        </header>
      </ScrollReveal>

      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            What I Do Now
          </h2>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-success">
                {content.availability.label}
              </span>
            </div>
            <p className="text-secondary leading-relaxed">
              {content.availability.message}
            </p>
          </GlassCard>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Education
          </h2>
          <GlassCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold text-primary">
              {content.education.degree}
            </h3>
            <p className="text-sm text-secondary mt-1">
              {content.education.institution} &middot; {content.education.location}
            </p>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted">
              <span>{content.education.period}</span>
              {content.education.gpa && (
                <>
                  <span>&middot;</span>
                  <span className="text-accent-blue font-medium">
                    {content.education.gpa}
                  </span>
                </>
              )}
            </div>
          </GlassCard>
        </section>
      </ScrollReveal>

      {content.certificates.length > 0 && (
        <ScrollReveal>
          <section className="mb-16">
            <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
              Certifications
            </h2>
            <div className="space-y-4">
              {content.certificates.map((cert, i) => (
                <GlassCard key={i} className="p-6" hover={false}>
                  <h3 className="text-lg font-semibold text-primary">
                    {cert.title}
                  </h3>
                  <p className="text-sm text-secondary mt-1">
                    {cert.issuer}
                    {cert.issuedAt && (
                      <>
                        {" "}
                        &middot; {cert.issuedAt}
                      </>
                    )}
                  </p>
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-sm font-medium text-accent-blue hover:text-accent-purple transition-colors"
                  >
                    View credential &rarr;
                  </a>
                </GlassCard>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Experience
          </h2>
          <div className="relative border-l border-glass-border pl-8 space-y-8">
            {content.timeline.map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="relative">
                  <div className="absolute -left-[2.55rem] top-1 h-3 w-3 rounded-full border-2 border-accent-blue bg-bg" />
                  <GlassCard className="p-6" hover={false}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          {item.role}
                        </h3>
                        <p className="text-sm text-secondary">
                          {item.company}
                          {item.location && (
                            <span className="text-muted">
                              {" "}
                              &middot; {item.location}
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge variant="accent">{item.period}</Badge>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {item.highlights.map((h, j) => (
                        <li
                          key={j}
                          className="text-sm text-muted leading-relaxed pl-4 relative before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-accent-blue/50"
                        >
                          {h}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Skills
          </h2>
          <div className="space-y-6">
            {Object.entries(content.skills).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-medium text-secondary uppercase tracking-wider mb-2">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-glass-border bg-glass-bg px-3 py-1.5 text-sm text-secondary hover:text-primary hover:border-glass-border-hover transition-all"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section>
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Connect
          </h2>
          <p className="text-secondary mb-4">
            Got a project in mind? Want to collaborate? Or just want to talk
            tech? I&apos;m one message away.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://linkedin.com/in/${SITE.author.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-accent-blue px-6 py-3 text-sm font-medium text-white hover:bg-accent-purple transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={`https://github.com/${SITE.author.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-glass-border bg-glass-bg px-6 py-3 text-sm font-medium text-secondary hover:text-primary hover:border-glass-border-hover transition-all"
            >
              GitHub
            </a>
            <a
              href={`mailto:${SITE.author.email}`}
              className="rounded-xl border border-glass-border bg-glass-bg px-6 py-3 text-sm font-medium text-secondary hover:text-primary hover:border-glass-border-hover transition-all"
            >
              Email
            </a>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
