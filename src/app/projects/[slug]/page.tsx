import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllProjects, getProjectBySlug, getProjectSlugs } from "@/lib/projects";
import { renderMDX } from "@/lib/mdx";
import { extractHeadings } from "@/lib/toc";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ProjectHero } from "@/components/projects/project-hero";
import { ProjectStatStrip } from "@/components/projects/project-stat-strip";
import { ActivityHeatmap } from "@/components/projects/activity-heatmap";
import { LanguageBar } from "@/components/projects/language-bar";
import { ReleaseTimeline } from "@/components/projects/release-timeline";
import { ScreenshotGallery } from "@/components/projects/screenshot-gallery";
import { ProjectCard } from "@/components/projects/project-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SITE } from "@/lib/constants";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getProjectSlugs();
    return slugs.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const description = project.summary || project.description;

  const ogUrl = new URL("/og", SITE.url);
  ogUrl.searchParams.set("title", project.title);
  ogUrl.searchParams.set("category", project.category);
  if (project.year) ogUrl.searchParams.set("date", project.year);
  if (project.stats) {
    ogUrl.searchParams.set(
      "readingTime",
      `${project.stats.commitCount.toLocaleString()} commits`
    );
  }

  return {
    title: project.title,
    description,
    openGraph: {
      type: "article",
      title: project.title,
      description,
      url: `${SITE.url}/projects/${slug}`,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
      authors: [SITE.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: [ogUrl.toString()],
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, all] = await Promise.all([
    getProjectBySlug(slug).catch(() => null),
    getAllProjects().catch(() => []),
  ]);

  if (!project) notFound();

  const content = project.body ? await renderMDX(project.body) : null;
  const headings = extractHeadings(project.body);
  const others = all.filter((p) => p.slug !== slug).slice(0, 2);
  const { stats } = project;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <div className="relative flex gap-16">
        <article className="min-w-0 max-w-3xl">
          <ProjectHero project={project} />

          {stats && (
            <ScrollReveal className="mb-10">
              <ProjectStatStrip stats={stats} />
            </ScrollReveal>
          )}

          {stats && stats.weeks.length > 0 && (
            <ScrollReveal className="mb-6">
              <ActivityHeatmap weeks={stats.weeks} />
            </ScrollReveal>
          )}

          {stats && stats.languages.length > 0 && (
            <ScrollReveal className="mb-10">
              <LanguageBar languages={stats.languages} />
            </ScrollReveal>
          )}

          {content && <div className="prose">{content}</div>}

          {project.meta.gallery.length > 0 && (
            <ScrollReveal className="mt-16 border-t border-glass-border pt-8">
              <ScreenshotGallery images={project.meta.gallery} />
            </ScrollReveal>
          )}

          {stats && stats.releases.length > 0 && (
            <ScrollReveal className="mt-16 border-t border-glass-border pt-8">
              <ReleaseTimeline releases={stats.releases} />
            </ScrollReveal>
          )}

          {others.length > 0 && (
            <section className="mt-16 border-t border-glass-border pt-8">
              <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-muted">
                Other Projects
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {others.map((p, i) => (
                  <ProjectCard key={p.slug} project={p} index={i} />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="hidden w-56 shrink-0 xl:block">
          <TableOfContents headings={headings} />
        </aside>
      </div>
    </div>
  );
}
