export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  category: string;
  featured?: boolean;
  draft?: boolean;
  image?: string;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTime: string;
  wordCount: number;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

export type ReactionType = "fire" | "heart" | "mindblown" | "idea";

export interface Reactions {
  fire: number;
  heart: number;
  mindblown: number;
  idea: number;
}
