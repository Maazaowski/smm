import { getAllPosts, getAllTags } from "@/lib/posts";
import { BlogIndex } from "@/components/blog/blog-index";
import type { Metadata } from "next";

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

  // Strip article bodies before sending to the client filter component.
  const previews = posts.map(({ frontmatter, slug, readingTime }) => ({
    frontmatter,
    slug,
    readingTime,
  }));

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

      {previews.length > 0 ? (
        <BlogIndex posts={previews} tags={tags} />
      ) : (
        <p className="text-center text-secondary py-16">
          No posts yet. Check back soon.
        </p>
      )}
    </div>
  );
}
