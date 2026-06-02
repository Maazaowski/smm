import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { renderMDX } from "@/lib/mdx";
import { extractHeadings } from "@/lib/toc";
import { PostHeader } from "@/components/blog/post-header";
import { ShareButtons } from "@/components/blog/share-buttons";
import { Reactions } from "@/components/blog/reactions";
import { ViewCounter } from "@/components/blog/view-counter";
import { GiscusComments } from "@/components/blog/giscus-comments";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SITE } from "@/lib/constants";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const { frontmatter } = post;
  const ogUrl = new URL("/og", SITE.url);
  ogUrl.searchParams.set("title", frontmatter.title);
  ogUrl.searchParams.set("date", frontmatter.date);
  ogUrl.searchParams.set("readingTime", post.readingTime);
  ogUrl.searchParams.set("category", frontmatter.category);

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    openGraph: {
      type: "article",
      title: frontmatter.title,
      description: frontmatter.description,
      url: `${SITE.url}/blog/${slug}`,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
      publishedTime: frontmatter.date,
      modifiedTime: frontmatter.updated,
      authors: [SITE.author.name],
      tags: frontmatter.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
      images: [ogUrl.toString()],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const content = await renderMDX(post.content);
  const headings = extractHeadings(post.content);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <div className="relative flex gap-16">
        {/* Main content */}
        <article className="min-w-0 max-w-3xl">
          <ScrollReveal>
            <PostHeader post={post} />
          </ScrollReveal>

          {/* View counter */}
          <div className="mb-8">
            <Suspense
              fallback={
                <span className="text-muted text-sm">Loading views...</span>
              }
            >
              <ViewCounter slug={slug} />
            </Suspense>
          </div>

          <ScrollReveal delay={0.15}>
            <div className="prose">{content}</div>
          </ScrollReveal>

          {/* Reactions */}
          <div className="mt-12">
            <Reactions slug={slug} />
          </div>

          {/* Share */}
          <footer className="mt-8 pt-8 border-t border-glass-border">
            <ShareButtons title={post.frontmatter.title} slug={slug} />
          </footer>

          {/* Comments */}
          <GiscusComments slug={slug} />
        </article>

        {/* Sidebar TOC */}
        <aside className="hidden xl:block w-56 shrink-0">
          <TableOfContents headings={headings} />
        </aside>
      </div>
    </div>
  );
}
