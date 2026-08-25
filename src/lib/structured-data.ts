import { SITE } from "./constants";
import type { Post } from "./types";
import type { Project } from "./projects";

/**
 * Schema.org payloads, emitted as <script type="application/ld+json">.
 *
 * These exist for search engines only and render nothing, so they never cost
 * UI. Keep them derived from the same data the page renders — a mismatch
 * between the visible content and the markup is worse than no markup.
 */

const personId = `${SITE.url}/about#person`;
const siteId = `${SITE.url}/#website`;

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId,
    name: SITE.author.name,
    alternateName: SITE.author.handle,
    url: SITE.url,
    email: `mailto:${SITE.author.email}`,
    jobTitle: "Software & AI Engineer",
    sameAs: [
      `https://github.com/${SITE.author.github}`,
      `https://www.linkedin.com/in/${SITE.author.linkedin}`,
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": siteId,
    url: SITE.url,
    name: SITE.title,
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": personId },
  };
}

export function articleSchema(post: Post, ogImage: string) {
  const { frontmatter } = post;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE.url}/blog/${post.slug}#article`,
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
    headline: frontmatter.title,
    description: frontmatter.description,
    image: ogImage,
    datePublished: frontmatter.date,
    dateModified: frontmatter.updated ?? frontmatter.date,
    articleSection: frontmatter.category,
    keywords: frontmatter.tags,
    wordCount: post.wordCount,
    inLanguage: "en",
    author: { "@id": personId },
    publisher: { "@id": personId },
    isPartOf: { "@id": siteId },
  };
}

export function projectSchema(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE.url}/projects/${project.slug}#project`,
    name: project.title,
    description: project.summary || project.description,
    applicationCategory: project.category,
    author: { "@id": personId },
    url: `${SITE.url}/projects/${project.slug}`,
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

/** Renders one or more schema objects into a single script tag's props. */
export function jsonLd(...schemas: object[]) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(schemas.length === 1 ? schemas[0] : schemas),
    },
  };
}
