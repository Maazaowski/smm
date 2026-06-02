import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { PostCard } from "@/components/blog/post-card";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  try {
    const tags = await getAllTags();
    return tags.map(({ tag }) => ({ tag }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `Posts tagged "${tag}"`,
    description: `All blog posts tagged with "${tag}".`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);

  if (posts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <header className="mb-12">
        <Link href="/blog" className="text-sm text-accent-blue hover:text-accent-purple transition-colors">
          &larr; All posts
        </Link>
        <h1 className="font-display text-4xl text-primary mt-4 mb-2">#{tag}</h1>
        <p className="text-secondary">
          {posts.length} post{posts.length !== 1 ? "s" : ""} tagged with &ldquo;{tag}&rdquo;
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
