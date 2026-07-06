import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { renderMDX } from "@/lib/mdx";
import { extractHeadings } from "@/lib/toc";
import { PostHeader } from "@/components/blog/post-header";
import { ShareButtons } from "@/components/blog/share-buttons";
import { Reactions } from "@/components/blog/reactions";
import { ViewCounter } from "@/components/blog/view-counter";
import { GiscusComments } from "@/components/blog/giscus-comments";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { FloatingActions } from "@/components/blog/floating-actions";
import { NewsletterForm } from "@/components/blog/newsletter-form";
import { PostCard } from "@/components/blog/post-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SITE } from "@/lib/constants";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Pre-render existing posts at build time; new posts render on first request
export async function generateStaticParams() {
  try {
    const posts = await getAllPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
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
  const [post, related] = await Promise.all([
    getPostBySlug(slug).catch(() => null),
    getRelatedPosts(slug).catch(() => []),
  ]);

  if (!post) notFound();

  const content = await renderMDX(post.content);
  const headings = extractHeadings(post.content);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <FloatingActions title={post.frontmatter.title} slug={slug} />
      <div className="relative flex gap-16">
        {/* Main content */}
        <article className="min-w-0 max-w-3xl">
          <PostHeader post={post} />

          <div className="mb-8">
            <Suspense fallback={<span className="text-muted text-sm">...</span>}>
              <ViewCounter slug={slug} />
            </Suspense>
          </div>

          <div className="prose">{content}</div>

          <div className="mt-12">
            <Reactions slug={slug} />
          </div>

          <footer className="mt-8 pt-8 border-t border-glass-border">
            <ShareButtons title={post.frontmatter.title} slug={slug} />
          </footer>

          <div className="mt-12">
            <NewsletterForm />
          </div>

          <GiscusComments slug={slug} />

          {/* Related Posts */}
          {related.length > 0 && (
            <section className="mt-16 pt-8 border-t border-glass-border">
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
                Related Posts
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Sidebar TOC */}
        <aside className="hidden xl:block w-56 shrink-0">
          <TableOfContents headings={headings} />
        </aside>
      </div>
    </div>
  );
}
