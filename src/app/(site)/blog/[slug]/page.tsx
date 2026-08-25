import Link from "next/link";
import { notFound } from "next/navigation";
import { getProtoSnapshot, toSubject } from "@/lib/proto-data";
import { renderProtoMDX } from "@/lib/proto-mdx";
import { extractHeadings } from "@/lib/toc";
import { getPostBySlug } from "@/lib/posts";
import { SITE } from "@/lib/constants";
import { articleSchema, breadcrumbSchema, jsonLd } from "@/lib/structured-data";
import { ReadingRail } from "@/components/site/reading-rail";
import { EssayEnd } from "@/components/site/essay-end";

export const revalidate = 60;


interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-render every published essay at build time; anything new renders on
 * first request and is cached from then on. Without this the route falls back
 * to on-demand rendering for every visitor, which is a database round trip per
 * page view for content that changes a few times a month.
 */
export async function generateStaticParams() {
  try {
    const { essays } = await getProtoSnapshot();
    return essays.map((e) => ({ slug: e.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { essays } = await getProtoSnapshot();
  const e = essays.find((x) => x.slug === slug);
  if (!e) return {};

  const og = new URL("/og", SITE.url);
  og.searchParams.set("title", e.title);
  og.searchParams.set("date", e.date);
  og.searchParams.set("readingTime", `${e.minutes} min read`);
  og.searchParams.set("category", e.category);

  return {
    title: e.title,
    description: e.dek,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: e.title,
      description: e.dek,
      url: `${SITE.url}/blog/${slug}`,
      images: [{ url: og.toString(), width: 1200, height: 630 }],
      publishedTime: e.date,
      authors: [SITE.author.name],
      tags: e.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: e.title,
      description: e.dek,
      images: [og.toString()],
    },
  };
}

/**
 * The reading page.
 *
 * Signal's shell, Field Notebook's reading discipline. Three things carried
 * across because they were measured and are correct regardless of which design
 * system surrounds them:
 *
 *   1. The measure is set in rem, not ch. `ch` measures the zero glyph, which
 *      is wider than average lowercase — production declares 65ch and renders
 *      78 characters per line. Set in rem and verified in the browser.
 *   2. The contents rail is the sticky element and its parent is the full
 *      grid column, so it travels the whole article instead of dying after
 *      288px.
 *   3. Section headings are headings. renderProtoMDX prepends the anchor as a
 *      margin "#" rather than wrapping the heading text, which is why every
 *      h2 on the production site renders as an underlined link.
 */
export default async function Essay({ params }: Props) {
  const { slug } = await params;
  const { essays } = await getProtoSnapshot();

  const i = essays.findIndex((e) => e.slug === slug);
  if (i === -1) notFound();

  const essay = essays[i];
  const subject = toSubject(essay.tags, essay.category);
  const body = await renderProtoMDX(essay.body);
  const headings = extractHeadings(essay.body);

  const newer = essays[i - 1] ?? null;
  const older = essays[i + 1] ?? null;

  const post = await getPostBySlug(slug).catch(() => null);
  const og = new URL("/og", SITE.url);
  og.searchParams.set("title", essay.title);
  og.searchParams.set("category", essay.category);

  return (
    <>
      {post && (
        <script
          {...jsonLd(
            articleSchema(post, og.toString()),
            breadcrumbSchema([
              { name: "Essays", path: "/blog" },
              { name: essay.title, path: `/blog/${slug}` },
            ])
          )}
        />
      )}

      <article id="sg-article" className="sg-wrap sg-read">
          <Link href="/blog" className="sg-back sg-mono">
            ← essays
          </Link>

          <header className="sg-read-head">
            <h1 className="sg-h2">{essay.title}</h1>
            <p className="sg-lead">{essay.dek}</p>
            <p className="sg-read-meta sg-mono">
              <span>{essay.date}</span>
              <span aria-hidden="true">·</span>
              <span>{subject}</span>
              <span aria-hidden="true">·</span>
              <span>{essay.minutes} min</span>
              <span aria-hidden="true">·</span>
              <span>{essay.words.toLocaleString()} words</span>
            </p>
          </header>

          <div className="sg-read-body">
            <div className="sg-prose">{body}</div>
            <div className="sg-read-rail">
              <ReadingRail headings={headings} minutes={essay.minutes} />
            </div>
          </div>

          <EssayEnd title={essay.title} slug={slug} />

          <nav className="sg-case-nav sg-read-nav" aria-label="More essays">
            {older ? (
              <Link href={`/blog/${older.slug}`}>
                <span className="sg-micro">Previous</span>
                <span className="sg-h3">{older.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link href={`/blog/${newer.slug}`} className="sg-case-next">
                <span className="sg-micro">Next</span>
                <span className="sg-h3">{newer.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>
    </>
  );
}
