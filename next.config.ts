import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    viewTransition: true,
  },

  /**
   * Nothing that was ever linkable is allowed to start returning 404.
   *
   * The essay and project URLs deliberately did NOT change — Giscus is keyed on
   * `pathname`, so moving /blog/[slug] would orphan every comment thread, and
   * every LinkedIn share points at the old paths. What did go is the guestbook
   * (empty, footer-only, duplicated by Giscus) and the tag pages (24 tags for
   * 6 posts, 20 of them matching exactly one).
   *
   * The prototype trees redirect temporarily rather than permanently: they are
   * still on the branch as a reference, and a 308 would be cached forever by
   * anyone who hit it once.
   */
  async redirects() {
    return [
      { source: "/guestbook", destination: "/", permanent: true },
      { source: "/tags", destination: "/blog", permanent: true },
      { source: "/tags/:tag*", destination: "/blog", permanent: true },
      { source: "/lab", destination: "/", permanent: false },
      { source: "/lab/:path*", destination: "/", permanent: false },
      { source: "/proto", destination: "/", permanent: false },
      { source: "/proto/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
