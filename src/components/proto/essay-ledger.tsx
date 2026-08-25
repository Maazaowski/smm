"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SUBJECTS, type ProtoEssay, type Subject } from "@/lib/proto-data";

interface Entry extends ProtoEssay {
  subject: Subject;
}

type Sort = "newest" | "longest";

/**
 * The essays index.
 *
 * Replaces the production blog index's three rows of tag pills — 24 tags for 6
 * posts, 20 of them matching a single post — with five subjects that each earn
 * a filter, plus a text filter that narrows in place. Counts are shown so a
 * subject with nothing in it is visibly empty rather than a dead end.
 */
export function EssayLedger({ essays }: { essays: Entry[] }) {
  const [subject, setSubject] = useState<Subject | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of essays) map.set(e.subject, (map.get(e.subject) ?? 0) + 1);
    return map;
  }, [essays]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = essays.filter((e) => {
      if (subject !== "all" && e.subject !== subject) return false;
      if (!query) return true;
      return (
        e.title.toLowerCase().includes(query) ||
        e.dek.toLowerCase().includes(query)
      );
    });
    return sort === "newest"
      ? list
      : [...list].sort((a, b) => b.minutes - a.minutes);
  }, [essays, subject, q, sort]);

  return (
    <>
      <div className="fn-filters">
        <div className="fn-filter-row" role="group" aria-label="Filter by subject">
          <button
            type="button"
            className="fn-filter"
            data-on={subject === "all" ? "true" : undefined}
            onClick={() => setSubject("all")}
          >
            everything <span className="fn-filter-n">{essays.length}</span>
          </button>
          {SUBJECTS.map((s) => {
            const n = counts.get(s) ?? 0;
            return (
              <button
                key={s}
                type="button"
                className="fn-filter"
                data-on={subject === s ? "true" : undefined}
                disabled={n === 0}
                onClick={() => setSubject(s)}
              >
                {s.toLowerCase()} <span className="fn-filter-n">{n}</span>
              </button>
            );
          })}
        </div>

        <div className="fn-filter-tools">
          <input
            className="fn-field fn-filter-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter by title"
            aria-label="Filter essays by title"
            type="search"
          />
          <button
            type="button"
            className="fn-filter"
            onClick={() => setSort(sort === "newest" ? "longest" : "newest")}
            aria-label={`Sorted by ${sort}. Click to change.`}
          >
            {sort}
          </button>
        </div>
      </div>

      <p className="fn-result-count fn-mono" aria-live="polite">
        {shown.length} of {essays.length}
        {subject !== "all" && ` · ${subject.toLowerCase()}`}
        {q && ` · “${q}”`}
      </p>

      {shown.length === 0 ? (
        <div className="fn-empty">
          <p className="fn-empty-title">Nothing here yet.</p>
          <p className="fn-empty-body">
            No essay matches that filter. Try{" "}
            <button
              type="button"
              className="fn-inline-btn"
              onClick={() => {
                setSubject("all");
                setQ("");
              }}
            >
              clearing it
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="fn-ledger">
          {shown.map((essay, i) => (
            <Link
              key={essay.slug}
              href={`/proto/essays/${essay.slug}`}
              className="fn-row"
            >
              <div className="fn-row-gutter">
                <span>{essay.date}</span>
                <span>{essay.subject}</span>
              </div>
              <div>
                <h2 className="fn-row-title">{essay.title}</h2>
                <p className="fn-row-dek">{essay.dek}</p>
              </div>
              <div className="fn-row-aside">
                {String(shown.length - i).padStart(2, "0")} · {essay.minutes} min
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
