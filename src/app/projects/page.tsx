import type { Metadata } from "next";
import { PROJECTS } from "@/lib/projects";
import { ProjectCard } from "@/components/projects/project-card";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected freelance work: web apps and AI agents.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">
          Projects
        </h1>
        <p className="text-lg text-secondary">
          Selected freelance work. I build production web apps and ship AI
          agents that do real work for real clients. Want something like this?{" "}
          <a
            href={`mailto:${SITE.author.email}`}
            className="text-accent-blue hover:underline"
          >
            Get in touch
          </a>
          .
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.slug} project={project} index={i} />
        ))}
      </div>
    </div>
  );
}
