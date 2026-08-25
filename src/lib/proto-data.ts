import { getAllPosts } from "./posts";
import { getAllProjects } from "./projects";
import { getAboutContent } from "./about";
import type { AboutContent } from "./about-types";

/**
 * Content snapshot for the redesign prototype.
 *
 * Reads the real database so the prototype is evaluated against real writing
 * rather than lorem, but only ever published rows — the prototype's admin
 * screens are a design artefact on an unauthenticated route, so no draft body
 * is allowed to cross into them. Nothing here writes.
 */

export interface ProtoEssay {
  slug: string;
  title: string;
  dek: string;
  date: string;
  category: string;
  tags: string[];
  minutes: number;
  words: number;
  body: string;
}

export interface ProtoWork {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  status: string;
  kind: string;
  year: string;
  client: string;
  featured: boolean;
  stack: string[];
  outcomes: string[];
  links: { label: string; href: string }[];
  body: string;
}

export interface ProtoSnapshot {
  essays: ProtoEssay[];
  work: ProtoWork[];
  about: AboutContent;
}

/**
 * The controlled vocabulary that replaces free-text tags. Five subjects, each
 * of which earns a browsable page. Existing post tags are mapped onto it, so
 * "software engineering" and "software-engineering" stop being two things.
 */
export const SUBJECTS = [
  "Agents",
  "Evals",
  "Architecture",
  "The Industry",
  "Practice",
] as const;

export type Subject = (typeof SUBJECTS)[number];

const SUBJECT_MAP: Record<string, Subject> = {
  agents: "Agents",
  "agentic-ai": "Agents",
  "ai security": "Agents",
  "prompt injection": "Agents",
  "llm evals": "Evals",
  "prompt engineering": "Evals",
  ai: "Architecture",
  "software-engineering": "Architecture",
  "software engineering": "Architecture",
  "web-development": "Architecture",
  "next-js": "Architecture",
  saas: "The Industry",
  enterprise: "The Industry",
  "build vs buy": "The Industry",
  "customer support": "The Industry",
  industry: "The Industry",
  tech: "The Industry",
  career: "Practice",
  graduates: "Practice",
  iba: "Practice",
  lums: "Practice",
  meta: "Practice",
  fast: "Practice",
};

/** Maps a post's free-text tags onto the controlled vocabulary. */
export function toSubject(tags: string[], category: string): Subject {
  for (const tag of tags) {
    const hit = SUBJECT_MAP[tag.toLowerCase().trim()];
    if (hit) return hit;
  }
  return category === "Career" ? "Practice" : "Architecture";
}

function minutesFrom(readingTime: string): number {
  const n = parseInt(readingTime, 10);
  return Number.isFinite(n) ? n : 1;
}

export async function getProtoSnapshot(): Promise<ProtoSnapshot> {
  const [posts, projects, about] = await Promise.all([
    getAllPosts().catch(() => []),
    getAllProjects().catch(() => []),
    getAboutContent(),
  ]);

  /*
   * No filtering here. The database is the source of truth for what is
   * published — the prototype used to drop "hello-world" in code, which was
   * fine for a demo and wrong for a live site: the sitemap and RSS read from
   * getAllPosts() and would have advertised a URL the essay pages 404'd on.
   * Scaffolding posts get marked draft in the admin, not hidden here.
   */
  const essays: ProtoEssay[] = posts
    .map((p) => ({
      slug: p.slug,
      title: p.frontmatter.title,
      dek: p.frontmatter.description,
      date: p.frontmatter.date,
      category: p.frontmatter.category,
      tags: p.frontmatter.tags,
      minutes: minutesFrom(p.readingTime),
      words: p.wordCount,
      body: p.content,
    }));

  const work: ProtoWork[] = projects
    .filter((p) => !p.slug.startsWith("zz-"))
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      description: p.description,
      category: p.category,
      status: p.status,
      kind: p.kind,
      year: p.year,
      client: p.client,
      featured: p.featured,
      stack: p.meta?.stack ?? [],
      outcomes: p.meta?.outcomes ?? [],
      links: p.meta?.links ?? [],
      body: "",
    }));

  return { essays, work, about: about.content };
}
