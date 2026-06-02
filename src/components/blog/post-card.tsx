import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { frontmatter, slug, readingTime } = post;

  return (
    <Link href={`/blog/${slug}`}>
      <GlassCard className="p-6 h-full">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <time dateTime={frontmatter.date}>
              {formatDate(frontmatter.date)}
            </time>
            <span>&middot;</span>
            <span>{readingTime}</span>
          </div>

          <h3 className="text-lg font-semibold text-primary leading-snug">
            {frontmatter.title}
          </h3>

          <p className="text-sm text-secondary leading-relaxed line-clamp-2">
            {frontmatter.description}
          </p>

          <div className="flex flex-wrap gap-2 mt-auto pt-2">
            {frontmatter.tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
