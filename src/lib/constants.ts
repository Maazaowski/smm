export const SITE = {
  name: "maazaowski",
  title: "maazaowski",
  description:
    "I build software, deploy AI agents, and write about it.",
  url: "https://maazaowski.com",
  author: {
    name: "Syed Muhammad Maaz",
    handle: "maazaowski",
    email: "m.maaz96@gmail.com",
    github: "Maazaowski",
    linkedin: "syed-muhammad-maaz-193292148",
  },
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
] as const;

export const CATEGORIES = [
  "AI Engineering",
  "Web Development",
  "Career",
  "Tech News",
  "Architecture",
] as const;
