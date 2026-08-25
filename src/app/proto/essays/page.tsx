import { getProtoSnapshot, toSubject } from "@/lib/proto-data";
import { PublicShell } from "@/components/proto/public-shell";
import { EssayLedger } from "@/components/proto/essay-ledger";

export const revalidate = 60;
export const metadata = { title: "Essays" };

export default async function ProtoEssays() {
  const { essays, work } = await getProtoSnapshot();
  const entries = essays.map((e) => ({
    ...e,
    subject: toSubject(e.tags, e.category),
  }));

  return (
    <PublicShell essays={essays} work={work}>
      <section className="fn-page fn-index-head">
        <h1 className="fn-title">Essays</h1>
        <p className="fn-lede">
          What I got wrong building agents, ledgers and pipelines, and what the
          fix turned out to be.
        </p>
      </section>

      <section className="fn-page">
        <EssayLedger essays={entries} />
      </section>
    </PublicShell>
  );
}
