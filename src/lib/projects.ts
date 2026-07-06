/**
 * Curated freelance / work case studies. Edit this file to add or update
 * projects (they change rarely, so a typed data file beats a DB table here).
 * Replace the sample entries below with your real work.
 */

export interface Project {
  slug: string;
  title: string;
  client: string; // real name or anonymized ("A fintech startup")
  year: string;
  category: string; // reuses category colors (categories.ts)
  summary: string; // one line
  description: string; // 2-3 sentences
  stack: string[];
  outcomes: string[];
  links?: { label: string; href: string }[];
  featured?: boolean;
}

export const PROJECTS: Project[] = [
  {
    slug: "ai-support-agent",
    title: "Autonomous customer-support agent",
    client: "A B2B SaaS client",
    year: "2026",
    category: "AI Engineering",
    summary:
      "An LLM agent that resolves tier-1 support tickets end to end.",
    description:
      "Designed and shipped a retrieval-augmented agent that reads the product docs, drafts replies, and takes safe actions against the client's API. Built the eval harness and guardrails that made it trustworthy enough to run unattended.",
    stack: ["TypeScript", "Claude API", "RAG", "Postgres", "Vercel"],
    outcomes: [
      "Deflects a large share of tier-1 tickets",
      "Deterministic guardrails, human handoff on low confidence",
      "Full eval suite gating every prompt change",
    ],
    featured: true,
  },
  {
    slug: "invoice-extraction",
    title: "Document extraction pipeline",
    client: "A logistics company",
    year: "2026",
    category: "AI Engineering",
    summary:
      "Turns messy supplier invoices into structured, auditable data.",
    description:
      "A compiler-style pipeline where an LLM authors extraction rules from a single sample invoice, then a deterministic interpreter replays those rules on every future document. Zero model calls at runtime.",
    stack: ["Python", "Claude API", "FastAPI", "Redis"],
    outcomes: [
      "Deterministic, reproducible output per supplier",
      "Cost paid once at onboarding, not per invoice",
      "Human review only on layout changes",
    ],
    featured: true,
  },
  {
    slug: "web-app-rebuild",
    title: "Product web app rebuild",
    client: "An early-stage startup",
    year: "2025",
    category: "Web Development",
    summary:
      "Rebuilt a slow legacy dashboard into a fast, modern web app.",
    description:
      "Migrated a jQuery-era dashboard to a Next.js App Router stack with server components, streaming, and a clean design system. Focused on perceived performance and a maintainable component library.",
    stack: ["Next.js", "React", "TypeScript", "Tailwind", "Drizzle"],
    outcomes: [
      "Large drop in time-to-interactive",
      "Reusable design system for future features",
      "Type-safe data layer end to end",
    ],
  },
];
