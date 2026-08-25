import Link from "next/link";
import { notFound } from "next/navigation";
import { getProtoSnapshot, toSubject } from "@/lib/proto-data";
import { renderProtoMDX } from "@/lib/proto-mdx";
import { extractHeadings } from "@/lib/toc";
import { PublicShell } from "@/components/proto/public-shell";
import { ReadingRail } from "@/components/proto/reading-rail";
import { EssayEnd } from "@/components/proto/essay-end";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { essays } = await getProtoSnapshot();
  const essay = essays.find((e) => e.slug === slug);
  return { title: essay?.title ?? "Essay" };
}

/**
 * The reading experience.
 *
 * The whole page is arranged around one question: is this comfortable for
 * twenty minutes? So the measure is ~63ch at 19px rather than 78ch at 16px,
 * the metadata sits in a mono line UNDER the headline instead of six tag pills
 * above it, section headings look like headings, and the article ends once.
 */
export default async function ProtoEssay({ params }: Props) {
  const { slug } = await params;
  const { essays, work } = await getProtoSnapshot();

  const index = essays.findIndex((e) => e.slug === slug);
  if (index === -1) notFound();

  const essay = essays[index];
  const subject = toSubject(essay.tags, essay.category);
  const body = await renderProtoMDX(essay.body);
  const headings = extractHeadings(essay.body);

  // Adjacent in time, and the nearest other essay on the same subject. Two
  // links chosen for a reason beats a three-card grid scored by tag overlap.
  const newer = essays[index - 1] ?? null;
  const older = essays[index + 1] ?? null;
  const alsoOn = essays.find(
    (e) => e.slug !== slug && toSubject(e.tags, e.category) === subject
  );

  return (
    <PublicShell essays={essays} work={work}>
      <article id="fn-article" className="fn-article fn-page">
        <header className="fn-article-head">
          <Link href="/proto/essays" className="fn-back fn-mono">
            ← essays
          </Link>

          <h1 className="fn-title fn-article-title">{essay.title}</h1>
          <p className="fn-lede fn-article-dek">{essay.dek}</p>

          {/* One mono line. Everything the reader needs, nothing they don't. */}
          <p className="fn-article-meta fn-mono">
            <span>{essay.date}</span>
            <span aria-hidden="true">·</span>
            <span>{subject}</span>
            <span aria-hidden="true">·</span>
            <span>{essay.minutes} min</span>
            <span aria-hidden="true">·</span>
            <span>{essay.words.toLocaleString()} words</span>
          </p>
        </header>

        <div className="fn-article-body">
          <div className="fn-prose">{body}</div>
          <ReadingRail headings={headings} minutes={essay.minutes} />
        </div>

        <EssayEnd title={essay.title} slug={essay.slug} />

        <nav className="fn-adjacent" aria-label="More essays">
          {older && (
            <Link href={`/proto/essays/${older.slug}`} className="fn-adj">
              <span className="fn-label">Previous</span>
              <span className="fn-adj-title">{older.title}</span>
            </Link>
          )}
          {alsoOn && (
            <Link href={`/proto/essays/${alsoOn.slug}`} className="fn-adj">
              <span className="fn-label">Also on {subject}</span>
              <span className="fn-adj-title">{alsoOn.title}</span>
            </Link>
          )}
          {newer && (
            <Link href={`/proto/essays/${newer.slug}`} className="fn-adj">
              <span className="fn-label">Next</span>
              <span className="fn-adj-title">{newer.title}</span>
            </Link>
          )}
        </nav>
      </article>
    </PublicShell>
  );
}
