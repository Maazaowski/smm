import type { Metadata } from "next";
import { GlassCard } from "@/components/ui/glass-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description:
    "Syed Muhammad Maaz. Freelance Software & AI Engineer. 6+ years shipping backend systems, microservices, and AI agents.",
};

const timeline = [
  {
    period: "2025 – Present",
    role: "Freelance Software & AI Engineer",
    company: "Independent",
    location: "Pakistan",
    highlights: [
      "Building web applications and deploying AI agents for client workflows",
      "Currently onboarded with two clients on projects ranging from full-stack web apps to AI-powered automation",
      "End-to-end ownership: architecture, development, deployment, and iteration",
    ],
  },
  {
    period: "Jan 2025 – May 2025",
    role: "Senior Software Engineer",
    company: "Astera Software",
    location: "Karachi, Pakistan",
    highlights: [
      "Automated installer pipelines with Anthropic API (Claude) for PR review, reducing QA blocker issues by 80%",
      "Led backend transition from WinForms to WPF and microservices architecture using .NET Core 8",
      "Implemented gRPC services with bidirectional streaming and RabbitMQ/MassTransit message queues",
      "Migrated installer pipelines from InstallShield to WiX, saving $10,000/year",
      "Led Cross-Platform team for macOS compatibility via Avalonia XPF",
    ],
  },
  {
    period: "Jan 2023 – Jan 2025",
    role: "Software Engineer II",
    company: "Astera Software",
    highlights: [
      "Built the LLM Workbench for orchestrating AI requests and visualizations",
      "Improved software performance by 86% through backend refactoring and query optimization",
      "Established CI/CD pipelines in Azure DevOps with unit and integration test coverage",
      "Directed monthly SonarQube audits over 12 sprints, reducing critical vulnerabilities by 67%",
    ],
  },
  {
    period: "Jun 2021 – Jan 2023",
    role: "Software Engineer I",
    company: "Astera Software",
    highlights: [
      "Led Visualization department in the Data Prep team for real-time data insights",
      "Pioneered the Analytics Workbench architecture for data analysis in C# .NET",
      "Built Installation Manager using Builder/Factory/Singleton patterns, cutting install time by 92%",
      "Reduced latency by 40% through targeted C# .NET module refactoring over 6 months",
    ],
  },
  {
    period: "Jul 2020 – Jun 2021",
    role: "Associate Software Engineer",
    company: "Astera Software",
    highlights: [
      "Integrated statistical and ML models into Centerprise, boosting predictive accuracy by 20%",
      "Created diagnostic tools reducing manual troubleshooting time by 30%",
      "Designed data pipelines for model training",
    ],
  },
];

const skills = {
  Languages: ["C#", "Java", "Python", "JavaScript", "TypeScript", "PHP"],
  Frameworks: [
    ".NET Core 8",
    "ASP.NET Core",
    "Next.js",
    "React",
    "Laravel",
    "Avalonia XPF",
  ],
  Architecture: ["Microservices", "gRPC", "RabbitMQ", "REST", "Docker"],
  "Cloud & DevOps": ["Azure DevOps", "AWS", "GCP", "CI/CD", "Vercel"],
  Databases: ["PostgreSQL", "MongoDB", "SQL Server", "Redis"],
  "AI & Agents": ["Claude", "Cursor", "GPT", "LLM Orchestration", "AI Agents"],
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      {/* Bio */}
      <ScrollReveal>
        <header className="mb-16">
          <h1 className="font-display text-4xl sm:text-5xl text-primary mb-6">
            About Me
          </h1>
          <p className="text-lg text-secondary leading-relaxed">
            Hey, I&apos;m{" "}
            <strong className="text-primary">Syed Muhammad Maaz</strong>, a
            freelance software & AI engineer with 6+ years of shipping
            production systems. I go by{" "}
            <strong className="text-accent-blue">maazaowski</strong> online.
          </p>
          <p className="text-lg text-secondary leading-relaxed mt-4">
            After 5 years at{" "}
            <strong className="text-primary">Astera Software</strong> where I
            grew from associate to senior, led teams, and built everything from
            microservices to AI-powered workflows. Then I went independent. Now I
            help clients build web applications and deploy AI agents that
            actually solve problems.
          </p>
          <p className="text-lg text-secondary leading-relaxed mt-4">
            This blog is where I write about what I&apos;m building, what
            I&apos;m learning, and what I think about the tech industry. No
            fluff, no filler. Just real stories from the work.
          </p>
        </header>
      </ScrollReveal>

      {/* What I Do Now */}
      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            What I Do Now
          </h2>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-success">
                Available for projects
              </span>
            </div>
            <p className="text-secondary leading-relaxed">
              I&apos;m freelancing, currently working with two clients on
              projects ranging from web applications to deploying AI agents for
              their business workflows. If you need software built or AI
              integrated into your stack, let&apos;s talk.
            </p>
          </GlassCard>
        </section>
      </ScrollReveal>

      {/* Education */}
      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Education
          </h2>
          <GlassCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold text-primary">
              Bachelor of Science
            </h3>
            <p className="text-sm text-secondary mt-1">
              Institute of Business Administration (IBA) &middot; Karachi,
              Pakistan
            </p>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted">
              <span>2016 – 2020</span>
              <span>&middot;</span>
              <span className="text-accent-blue font-medium">
                CGPA: 3.63 / 4.00
              </span>
            </div>
          </GlassCard>
        </section>
      </ScrollReveal>

      {/* Career Timeline */}
      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Experience
          </h2>
          <div className="relative border-l border-glass-border pl-8 space-y-8">
            {timeline.map((item, i) => (
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

      {/* Skills */}
      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Skills
          </h2>
          <div className="space-y-6">
            {Object.entries(skills).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-medium text-secondary uppercase tracking-wider mb-2">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-glass-border bg-glass-bg px-3 py-1.5 text-sm text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
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

      {/* Connect */}
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
              className="rounded-xl border border-glass-border bg-glass-bg px-6 py-3 text-sm font-medium text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
            >
              GitHub
            </a>
            <a
              href={`mailto:${SITE.author.email}`}
              className="rounded-xl border border-glass-border bg-glass-bg px-6 py-3 text-sm font-medium text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
            >
              Email
            </a>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
