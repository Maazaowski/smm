"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDesk, type DeskStatus } from "./store";
import { ConfirmDialog, RowMenu } from "./primitives";

type Filter = "all" | DeskStatus;

/**
 * The Desk index: the post list and the numbers, on one screen.
 *
 * Production splits these across /admin (list, no numbers, no search, no sort,
 * no filter) and /dashboard (numbers, five KPI tiles of which three are
 * derivable from each other, and a table that counts drafts as top posts).
 * A person managing a publication wants to see how a piece is doing in the row
 * where they can edit it.
 */
export function DeskIndex() {
  const { essays, subscribers, remove, publish, unpublish, notify, toast } =
    useDesk();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [broadcast, setBroadcast] = useState<string | null>(null);
  const router = useRouter();

  const counts = useMemo(
    () => ({
      all: essays.length,
      live: essays.filter((e) => e.status === "live").length,
      draft: essays.filter((e) => e.status === "draft").length,
      scheduled: essays.filter((e) => e.status === "scheduled").length,
    }),
    [essays]
  );

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return essays.filter((e) => {
      if (filter !== "all" && e.status !== filter) return false;
      if (!query) return true;
      return (
        e.title.toLowerCase().includes(query) ||
        e.slug.toLowerCase().includes(query)
      );
    });
  }, [essays, filter, q]);

  // Reach only counts what is actually published — the production dashboard
  // includes drafts in "Top Posts", which makes the number a lie.
  const reach = useMemo(
    () =>
      essays
        .filter((e) => e.status === "live")
        .reduce((sum, e) => sum + e.views, 0),
    [essays]
  );

  const target = essays.find((e) => e.id === broadcast) ?? null;

  return (
    <div className="fn-desk-page">
      {/* Two numbers that cannot be derived from each other, and the one
          action this screen exists for. */}
      <header className="fn-desk-head">
        <div className="fn-desk-stats">
          <div>
            <p className="fn-label">Reads, published essays</p>
            <p className="fn-stat fn-mono">{reach.toLocaleString()}</p>
          </div>
          <div>
            <p className="fn-label">Subscribers</p>
            <p className="fn-stat fn-mono">{subscribers.toLocaleString()}</p>
          </div>
        </div>

        <button
          type="button"
          className="fn-btn"
          data-variant="primary"
          onClick={() => router.push("/proto/admin/editor/new")}
        >
          Start an essay
        </button>
      </header>

      <div className="fn-filters fn-desk-filters">
        <div className="fn-filter-row" role="group" aria-label="Filter by status">
          {(["all", "live", "draft", "scheduled"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className="fn-filter"
              data-on={filter === f ? "true" : undefined}
              disabled={counts[f] === 0 && f !== "all"}
              onClick={() => setFilter(f)}
            >
              {f} <span className="fn-filter-n">{counts[f]}</span>
            </button>
          ))}
        </div>

        <input
          className="fn-field fn-filter-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="find by title or slug"
          aria-label="Find an essay"
        />
      </div>

      {shown.length === 0 ? (
        <div className="fn-empty">
          <p className="fn-empty-title">
            {essays.length === 0 ? "Nothing written yet." : "No match."}
          </p>
          <p className="fn-empty-body">
            {essays.length === 0
              ? "The first essay is the hardest one to start."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="fn-deskledger">
          <div className="fn-deskrow fn-deskrow-head" aria-hidden="true">
            <span>status</span>
            <span>essay</span>
            <span className="fn-num">reads</span>
            <span className="fn-num">email</span>
            <span />
          </div>

          {shown.map((e) => (
            <div key={e.id} className="fn-deskrow">
              <span className="fn-state" data-state={e.status === "live" ? "live" : "draft"}>
                {e.status}
              </span>

              <div className="fn-deskrow-main">
                <button
                  type="button"
                  className="fn-deskrow-title"
                  onClick={() => router.push(`/proto/admin/editor/${e.id}`)}
                >
                  {e.title || "Untitled draft"}
                </button>
                <p className="fn-deskrow-sub fn-mono">
                  /{e.slug || "no-slug-yet"} · {e.date} · {e.subject} ·{" "}
                  {e.words.toLocaleString()} words
                </p>
              </div>

              {/* data-label surfaces the column header on narrow screens,
                  where the header row is gone and a bare number is ambiguous. */}
              <span className="fn-num fn-mono fn-deskrow-n" data-label="reads">
                {e.status === "live" ? e.views.toLocaleString() : "—"}
              </span>

              <span className="fn-num fn-mono fn-deskrow-n" data-label="email">
                {e.emailedAt ? "sent" : e.status === "live" ? "not sent" : "—"}
              </span>

              {/* Destructive and irreversible actions live behind a menu, not
                  inline at the same weight as Edit. */}
              <RowMenu
                label={`Actions for ${e.title || "untitled draft"}`}
                items={[
                  {
                    label: "Edit",
                    onSelect: () => router.push(`/proto/admin/editor/${e.id}`),
                  },
                  e.status === "live"
                    ? { label: "Unpublish", onSelect: () => unpublish(e.id) }
                    : { label: "Publish", onSelect: () => publish(e.id) },
                  {
                    label: e.emailedAt ? "Already emailed" : "Email subscribers…",
                    onSelect: () =>
                      e.emailedAt
                        ? toast({
                            tone: "warn",
                            message: `Already sent on ${e.emailedAt}. Sending again would be a duplicate.`,
                          })
                        : setBroadcast(e.id),
                  },
                  {
                    label: "Delete",
                    tone: "danger",
                    onSelect: () => remove(e.id),
                  },
                ]}
              />
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title="Email this essay to every subscriber?"
        confirmWord="send"
        confirmLabel={`Send to ${subscribers.toLocaleString()}`}
        body={
          target && (
            <>
              <p>
                This cannot be recalled once it leaves. Subscribers will receive
                it within a minute.
              </p>
              <dl className="fn-confirm-spec">
                <div>
                  <dt>Subject line</dt>
                  <dd>{target.title}</dd>
                </div>
                <div>
                  <dt>Preview text</dt>
                  <dd>{target.dek.slice(0, 90)}…</dd>
                </div>
                <div>
                  <dt>Recipients</dt>
                  <dd>{subscribers.toLocaleString()} confirmed</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {target.status === "live"
                      ? "Published — the link will resolve"
                      : "DRAFT — subscribers would receive a dead link"}
                  </dd>
                </div>
              </dl>
            </>
          )
        }
        onCancel={() => setBroadcast(null)}
        onConfirm={() => {
          if (target) notify(target.id);
          setBroadcast(null);
        }}
      />
    </div>
  );
}
