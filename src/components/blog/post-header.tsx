import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostHeaderProps {
  post: Post;
}

export function PostHeader({ post }: PostHeaderProps) {
  const { frontmatter, readingTime } = post;

  return (
    <header className="mb-12">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="accent">{frontmatter.category}</Badge>
        {frontmatter.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      <h1 className="font-display text-4xl sm:text-5xl text-primary leading-tight mb-4">
        {frontmatter.title}
      </h1>

      <p className="text-lg text-secondary mb-6">
        {frontmatter.description}
      </p>

      <div className="flex items-center gap-3 text-sm text-muted">
        <time dateTime={frontmatter.date}>
          {formatDate(frontmatter.date)}
        </time>
        {frontmatter.updated && (
          <>
            <span>&middot;</span>
            <span>Updated {formatDate(frontmatter.updated)}</span>
          </>
        )}
        <span>&middot;</span>
        <span>{readingTime}</span>
      </div>

      <hr className="mt-8 border-glass-border" />
    </header>
  );
}
