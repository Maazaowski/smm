"use client";

import { useCallback, useEffect, useState } from "react";
import { Tag } from "@/components/admin/admin-shell";
import {
  inputClass,
  textareaClass,
  labelClass,
  moveItem,
} from "@/components/admin/editor-primitives";
import type { Testimonial } from "@/lib/testimonials";

/**
 * Testimonials editor.
 *
 * New entries are drafts. That is the point: a reference is a claim made by a
 * named person at a named company, so it appears on the site when it is
 * deliberately published, not when it is typed.
 *
 * Follows projects-editor.tsx and reuses editor-primitives, so the admin keeps
 * one set of field styles rather than growing a second.
 */

type Draft = {
  id: number | null;
  quote: string;
  author: string;
  role: string;
  company: string;
  sourceUrl: string;
  draft: boolean;
  sortOrder: number;
};

const EMPTY: Draft = {
  id: null,
  quote: "",
  author: "",
  role: "",
  company: "",
  sourceUrl: "",
  draft: true,
  sortOrder: 0,
};

export function TestimonialsEditor() {
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /** Refetch. Bumping the key is what the effect below subscribes to. */
  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    // The fetch lives inside the effect and writes state from the promise
    // callback, not synchronously in the effect body. `cancelled` stops a slow
    // response from writing into an unmounted component.
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/testimonials");
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        setRows(data.testimonials ?? []);
        setError(null);
      } catch (err) {
        // Errors are surfaced, not swallowed — the old admin's empty catch
        // blocks made a failed request indistinguishable from an empty list.
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        quote: editing.quote.trim(),
        author: editing.author.trim(),
        role: editing.role.trim(),
        company: editing.company.trim(),
        sourceUrl: editing.sourceUrl.trim() || null,
        draft: editing.draft,
        sortOrder: editing.sortOrder,
      };
      const res = await fetch(
        editing.id
          ? `/api/admin/testimonials/${editing.id}`
          : "/api/admin/testimonials",
        {
          method: editing.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Save failed (${res.status})`);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: Testimonial) => {
    if (
      !confirm(
        `Delete the reference from ${t.author} at ${t.company}? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/testimonials/${t.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const togglePublish = async (t: Testimonial) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: !t.draft }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const reorder = async (index: number, direction: -1 | 1) => {
    const next = moveItem(rows, index, direction);
    if (next === rows) return;
    setRows(next);
    await Promise.all(
      next.map((t, i) =>
        fetch(`/api/admin/testimonials/${t.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i }),
        })
      )
    );
    load();
  };

  /* ---------------------------------------------------------- editor --- */

  if (editing) {
    const blockers = [
      editing.quote.trim().length < 10 && "a quote",
      !editing.author.trim() && "a name",
      !editing.role.trim() && "a role",
      !editing.company.trim() && "a company",
    ].filter(Boolean) as string[];

    return (
      <div className="space-y-4">
        <div className="ad-bar">
          <h1 className="ad-title">
            {editing.id ? "Edit reference" : "New reference"}
          </h1>
          <button type="button" onClick={() => setEditing(null)} className="ad-link">
            ← Back
          </button>
        </div>

        {error && (
          <div className="ad-notice" data-tone="bad" role="alert">
            <span>{error}</span>
          </div>
        )}

        <label className="block space-y-1">
          <span className={labelClass}>Quote</span>
          <textarea
            className={`${textareaClass} h-32`}
            value={editing.quote}
            onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
            placeholder="One sentence about a specific outcome. Not a compliment."
          />
        </label>

        <div className="ad-grid-3">
          <label className="block space-y-1">
            <span className={labelClass}>Name</span>
            <input
              className={inputClass}
              value={editing.author}
              onChange={(e) =>
                setEditing({ ...editing, author: e.target.value })
              }
            />
          </label>
          <label className="block space-y-1">
            <span className={labelClass}>Role</span>
            <input
              className={inputClass}
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className={labelClass}>Company</span>
            <input
              className={inputClass}
              value={editing.company}
              onChange={(e) =>
                setEditing({ ...editing, company: e.target.value })
              }
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className={labelClass}>Source URL (optional)</span>
          <input
            className={inputClass}
            value={editing.sourceUrl}
            onChange={(e) =>
              setEditing({ ...editing, sourceUrl: e.target.value })
            }
            placeholder="https://linkedin.com/in/... — where this can be verified"
          />
          <span className="ad-help">
            A reference nobody can check is worth less than no reference.
          </span>
        </label>

        <label className="ad-check">
          <input
            type="checkbox"
            checked={!editing.draft}
            onChange={(e) => setEditing({ ...editing, draft: !e.target.checked })}
          />
          Publish to the site
        </label>

        <button
          onClick={save}
          disabled={saving || blockers.length > 0}
          title={blockers.length ? `Still needs ${blockers.join(", ")}` : undefined}
          className="sg-cta"
          data-fill="true"
        >
          {saving ? "Saving…" : editing.id ? "Update" : "Create"}
        </button>
      </div>
    );
  }

  /* ------------------------------------------------------------ list --- */

  return (
    <div className="space-y-4">
      <div className="ad-bar">
        <div>
          <h1 className="ad-title">What they said afterwards</h1>
          <p>
            {rows.length} reference{rows.length === 1 ? "" : "s"} ·{" "}
            {rows.filter((r) => !r.draft).length} live. New entries are drafts
            until you publish them.
          </p>
        </div>
        <div className="ad-actions">
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY, sortOrder: rows.length })}
            className="sg-cta"
            data-fill="true"
          >
            New reference
          </button>
        </div>
      </div>

      {error && (
          <div className="ad-notice" data-tone="bad" role="alert">
            <span>{error}</span>
          </div>
        )}

      {loading ? (
        <div className="ad-rows" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="ad-skeleton" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="ad-empty">
          No references yet. Ask two former colleagues and one client for a
          sentence about a specific outcome.
        </div>
      ) : (
        <div className="ad-rows">
          {rows.map((t, i) => (
            <article
              key={t.id}
              className="ad-row"
              style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}
            >
                <div className="min-w-0">
                  <p className="ad-row-d" style={{ color: "var(--text)", fontSize: 14.5 }}>
                    &ldquo;{t.quote.slice(0, 140)}
                    {t.quote.length > 140 ? "…" : ""}&rdquo;
                  </p>
                  <div className="ad-row-meta">
                    <span className="ad-row-r">
                      {t.author} · {t.role}, {t.company}
                    </span>
                    {t.draft ? <Tag tone="draft">Draft</Tag> : <Tag tone="live">Live</Tag>}
                    {t.sourceUrl ? <Tag>Source ✓</Tag> : <Tag tone="warn">No source</Tag>}
                  </div>
                </div>
                <div className="ad-row-actions">
                  <button
                    type="button"
                    onClick={() => reorder(i, -1)}
                    disabled={i === 0}
                    className="ad-link"
                    aria-label={`Move ${t.author} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => reorder(i, 1)}
                    disabled={i === rows.length - 1}
                    className="ad-link"
                    aria-label={`Move ${t.author} down`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePublish(t)}
                    className="ad-link"
                    data-tone={t.draft ? "live" : undefined}
                  >
                    {t.draft ? "Publish" : "Unpublish"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        id: t.id,
                        quote: t.quote,
                        author: t.author,
                        role: t.role,
                        company: t.company,
                        sourceUrl: t.sourceUrl ?? "",
                        draft: t.draft,
                        sortOrder: t.sortOrder,
                      })
                    }
                    className="ad-link"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t)}
                    className="ad-link"
                    data-tone="danger"
                  >
                    Delete
                  </button>
                </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
