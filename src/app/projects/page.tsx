import type { Metadata } from "next";
import { getAllProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/projects/project-card";
import { SITE } from "@/lib/constants";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Products I've built and client work I've shipped: web apps, AI pipelines and the odd piece of infrastructure.",
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">
          Projects
        </h1>
        <p className="text-lg text-secondary">
          Things I&apos;ve built — some my own products, some shipped for
          clients. Production web apps, AI pipelines that do real work, and the
          infrastructure underneath them. Want something like this?{" "}
          <a
            href={`mailto:${SITE.author.email}`}
            className="text-accent-blue hover:underline"
          >
            Get in touch
          </a>
          .
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-glass-border bg-glass-bg p-12 text-center backdrop-blur-[16px]">
          <p className="text-secondary">Nothing published here yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
