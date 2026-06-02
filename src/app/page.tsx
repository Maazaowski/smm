import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/blog/post-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SITE } from "@/lib/constants";

export default function Home() {
  const posts = getAllPosts();
  const featured = posts.find((p) => p.frontmatter.featured);
  const latest = posts.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="py-24 sm:py-32">
        <ScrollReveal>
          <h1 className="font-display text-5xl sm:text-7xl text-primary mb-6">
            {SITE.name}
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="text-xl sm:text-2xl text-secondary max-w-2xl leading-snug font-medium">
            {SITE.description}
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <div className="flex gap-4 mt-8">
            <Link
              href="/blog"
              className="rounded-xl bg-accent-blue px-6 py-3 text-sm font-medium text-white hover:bg-accent-purple transition-colors"
            >
              Read the Blog
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-glass-border bg-glass-bg px-6 py-3 text-sm font-medium text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
            >
              About Me
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="pb-16">
          <ScrollReveal>
            <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6">
              Featured
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <Link href={`/blog/${featured.slug}`}>
              <div className="rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-[16px] p-8 hover:border-white/[0.15] transition-all group">
                <div className="flex items-center gap-2 text-xs text-muted mb-3">
                  <span className="text-accent-blue">
                    {featured.frontmatter.category}
                  </span>
                  <span>&middot;</span>
                  <span>{featured.readingTime}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-primary mb-3 group-hover:text-accent-blue transition-colors">
                  {featured.frontmatter.title}
                </h3>
                <p className="text-secondary leading-relaxed max-w-2xl">
                  {featured.frontmatter.description}
                </p>
              </div>
            </Link>
          </ScrollReveal>
        </section>
      )}

      {/* Latest Posts */}
      <section className="pb-24">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-muted uppercase tracking-wider">
              Latest Posts
            </h2>
            <Link
              href="/blog"
              className="text-sm text-accent-blue hover:text-accent-purple transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
        </ScrollReveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 0.1}>
              <PostCard post={post} />
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
}
