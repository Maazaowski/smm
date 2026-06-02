import { getAllPosts, getAllTags } from "@/lib/posts";
import { PostCard } from "@/components/blog/post-card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description: "Stories, insights, and reactions to tech news.",
};

export default async function BlogPage() {
  const [posts, tags] = await Promise.all([
    getAllPosts().catch(() => []),
    getAllTags().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <header className="mb-12">
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">
          Blog
        </h1>
        <p className="text-lg text-secondary max-w-xl">
          Thoughts on AI, engineering, and the tech industry.
        </p>
      </header>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          {tags.map(({ tag, count }) => (
            <Link key={tag} href={`/tags/${tag}`}>
              <Badge>
                {tag} ({count})
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-center text-secondary py-16">
          No posts yet. Check back soon.
        </p>
      )}
    </div>
  );
}
