"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-primary">
            {editing.id ? "Edit reference" : "New reference"}
          </h2>
          <button
            onClick={() => setEditing(null)}
            className="text-sm text-secondary hover:text-primary"
          >
            &larr; Back
          </button>
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <label className="block space-y-1">
          <span className={labelClass}>Quote</span>
          <textarea
            className={`${textareaClass} h-32`}
            value={editing.quote}
            onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
            placeholder="One sentence about a specific outcome. Not a compliment."
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
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
          <span className="text-xs text-muted">
            A reference nobody can check is worth less than no reference.
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={!editing.draft}
            onChange={(e) => setEditing({ ...editing, draft: !e.target.checked })}
            className="rounded"
          />
          Publish to the site
        </label>

        <button
          onClick={save}
          disabled={saving || blockers.length > 0}
          title={blockers.length ? `Still needs ${blockers.join(", ")}` : undefined}
          className="rounded-xl bg-accent-blue px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-purple disabled:opacity-50"
        >
          {saving ? "Saving…" : editing.id ? "Update" : "Create"}
        </button>
      </div>
    );
  }

  /* ------------------------------------------------------------ list --- */

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-secondary">
          {rows.length} reference{rows.length === 1 ? "" : "s"} ·{" "}
          {rows.filter((r) => !r.draft).length} live
        </p>
        <button
          onClick={() => setEditing({ ...EMPTY, sortOrder: rows.length })}
          className="rounded-xl bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-purple"
        >
          New reference
        </button>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-shimmer rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <GlassCard className="p-10 text-center" hover={false}>
          <p className="text-secondary">
            No references yet. Ask two former colleagues and one client for a
            sentence about a specific outcome.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {rows.map((t, i) => (
            <GlassCard key={t.id} className="p-4" hover={false}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-primary">
                    &ldquo;{t.quote.slice(0, 140)}
                    {t.quote.length > 140 ? "…" : ""}&rdquo;
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {t.author} · {t.role}, {t.company}
                    {t.sourceUrl ? " · source ✓" : " · no source"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {t.draft ? (
                    <Badge variant="accent">Draft</Badge>
                  ) : (
                    <span className="px-2 py-1 text-xs text-success">Live</span>
                  )}
                  <button
                    onClick={() => reorder(i, -1)}
                    disabled={i === 0}
                    className="px-1 text-xs text-muted hover:text-primary disabled:opacity-30"
                    aria-label={`Move ${t.author} up`}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => reorder(i, 1)}
                    disabled={i === rows.length - 1}
                    className="px-1 text-xs text-muted hover:text-primary disabled:opacity-30"
                    aria-label={`Move ${t.author} down`}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => togglePublish(t)}
                    className="px-2 py-1 text-xs text-accent-blue transition-colors hover:text-accent-purple"
                  >
                    {t.draft ? "Publish" : "Unpublish"}
                  </button>
                  <button
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
                    className="px-2 py-1 text-xs text-secondary transition-colors hover:text-primary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(t)}
                    className="px-2 py-1 text-xs text-error transition-colors hover:text-error/80"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
