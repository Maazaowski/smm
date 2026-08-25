import Link from "next/link";
import { getProtoSnapshot } from "@/lib/proto-data";

export const metadata = { title: "Not found" };

/**
 * 404.
 *
 * The old one had good copy and no way out — no search, no links, nothing but
 * a button back to the homepage. A 404 is usually a stale link to something
 * that still exists under a different name, so this one offers the three most
 * recent essays and the work index.
 */
export default async function NotFound() {
  const { essays } = await getProtoSnapshot().catch(() => ({ essays: [] }));

  return (
    <section className="sg-wrap sg-section">
      <div className="sg-slug">
        <span className="sg-slug-n">[404]</span>
        <span className="sg-slug-label">{"// Not found"}</span>
        <span className="sg-slug-fact">Nothing at this address</span>
      </div>

      <div className="sg-shead">
        <div>
          <span className="sg-micro sg-shead-eyebrow">Dead end</span>
          <h1 className="sg-h2">This page never shipped</h1>
        </div>
        <p className="sg-lead">
          Or it moved. Either way, here is what does exist.
        </p>
      </div>

      {essays.length > 0 && (
        <div className="sg-essays">
          {essays.slice(0, 3).map((e) => (
            <Link key={e.slug} href={`/blog/${e.slug}`} className="sg-essay">
              <span className="sg-essay-r sg-mono">{e.date}</span>
              <div>
                <h2 className="sg-essay-t">{e.title}</h2>
                <p className="sg-essay-d">{e.dek}</p>
              </div>
              <span className="sg-essay-r sg-mono">{e.minutes} min →</span>
            </Link>
          ))}
        </div>
      )}

      <div className="sg-contact-actions" style={{ justifyContent: "flex-start" }}>
        <Link className="sg-cta" href="/blog">
          All essays
        </Link>
        <Link className="sg-cta" href="/projects">
          Work
        </Link>
      </div>
    </section>
  );
}
