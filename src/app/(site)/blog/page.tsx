import Link from "next/link";
import { getProtoSnapshot, toSubject } from "@/lib/proto-data";
import { Reveal } from "@/components/site/chrome";
import { jsonLd, breadcrumbSchema } from "@/lib/structured-data";

export const revalidate = 60;
export const metadata = {
  title: "Essays",
  description:
    "Long-form on agents, ledgers and pipelines, written after the fact with the trace included.",
  alternates: { canonical: "/blog" },
};


export default async function EssayIndex() {
  const { essays } = await getProtoSnapshot();

  return (
    <>
      <script
        {...jsonLd(breadcrumbSchema([{ name: "Essays", path: "/blog" }]))}
      />
        <section className="sg-wrap sg-section" style={{ paddingTop: "10rem" }}>
          <div className="sg-slug">
            <span className="sg-slug-n">[00]</span>
            <span className="sg-slug-label">{"// Essays"}</span>
            <span className="sg-slug-fact">{essays.length} written</span>
          </div>

          <Reveal className="sg-shead" as="header">
            <div>
              <span className="sg-micro sg-shead-eyebrow">In the open</span>
              <h2 className="sg-h2">What I got wrong first</h2>
            </div>
            <p className="sg-lead">
              Written after the fact, with the trace included. Most of it comes
              out of getting something wrong in production and then having to
              explain it.
            </p>
          </Reveal>

          <div className="sg-essays">
            {essays.map((e, i) => (
              <Reveal key={e.slug} delay={i * 60}>
                <Link href={`/blog/${e.slug}`} className="sg-essay">
                  <span className="sg-essay-r sg-mono">{e.date}</span>
                  <div>
                    <h3 className="sg-essay-t">{e.title}</h3>
                    <p className="sg-essay-d">{e.dek}</p>
                  </div>
                  <span className="sg-essay-r sg-mono">
                    {toSubject(e.tags, e.category)} · {e.minutes} min →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
    </>
  );
}
