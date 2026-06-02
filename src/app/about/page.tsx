import type { Metadata } from "next";
import { GlassCard } from "@/components/ui/glass-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE.author.name} — senior software & AI engineer.`,
};

const timeline = [
  {
    period: "2024 – Present",
    role: "Senior Software Engineer",
    company: "Building the future",
    description:
      "Working on AI-powered products, building scalable systems, and sharing what I learn along the way.",
  },
];

const techStack = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "AI/ML",
  "LLMs",
  "System Design",
  "Cloud (AWS/GCP)",
  "Docker",
  "PostgreSQL",
  "Redis",
];

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
            Hey, I&apos;m <strong className="text-primary">{SITE.author.name}</strong> — a senior
            software & AI engineer passionate about building products that matter.
            I write about AI engineering, web development, career insights, and my
            reactions to tech news.
          </p>
          <p className="text-lg text-secondary leading-relaxed mt-4">
            This blog is my attempt at thinking out loud. Every post gets shared
            on LinkedIn because I believe the best networking happens through shared knowledge.
          </p>
        </header>
      </ScrollReveal>

      {/* Career Timeline */}
      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Experience
          </h2>
          <div className="relative border-l border-glass-border pl-8 space-y-8">
            {timeline.map((item, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[2.55rem] top-1 h-3 w-3 rounded-full border-2 border-accent-blue bg-bg" />
                <GlassCard className="p-6" hover={false}>
                  <p className="text-xs text-accent-blue font-medium mb-1">
                    {item.period}
                  </p>
                  <h3 className="text-lg font-semibold text-primary">
                    {item.role}
                  </h3>
                  <p className="text-sm text-secondary mt-0.5">
                    {item.company}
                  </p>
                  <p className="text-sm text-muted mt-2">
                    {item.description}
                  </p>
                </GlassCard>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Tech Stack */}
      <ScrollReveal>
        <section className="mb-16">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-glass-border bg-glass-bg px-4 py-2 text-sm text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Social Links */}
      <ScrollReveal>
        <section>
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
            Connect
          </h2>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://linkedin.com/in/${SITE.author.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-glass-border bg-glass-bg px-6 py-3 text-sm font-medium text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
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
              href={`https://twitter.com/${SITE.author.twitter?.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-glass-border bg-glass-bg px-6 py-3 text-sm font-medium text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
            >
              Twitter
            </a>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
