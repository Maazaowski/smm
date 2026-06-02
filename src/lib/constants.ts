export const SITE = {
  name: "maazaowski",
  title: "maazaowski",
  description:
    "Stories, insights, and tech news from a senior software & AI engineer.",
  url: "https://maazaowski.com",
  author: {
    name: "maazaowski",
    twitter: "@maazaowski",
    github: "maazaowski",
    linkedin: "maazaowski",
  },
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
] as const;

export const CATEGORIES = [
  "AI Engineering",
  "Web Development",
  "Career",
  "Tech News",
  "Architecture",
] as const;
