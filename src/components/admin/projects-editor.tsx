"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  RowControls,
  inputClass,
  labelClass,
  moveItem,
  selectClass,
  textareaClass,
} from "./editor-primitives";
import { CATEGORIES } from "@/lib/constants";
import { EMPTY_PROJECT } from "@/lib/project-defaults";
import {
  KIND_LABELS,
  PROJECT_KINDS,
  PROJECT_STATUSES,
  STATUS_LABELS,
} from "@/lib/project-types";
import { slugify } from "@/lib/utils";
import type { GalleryImage, ProjectInput, ProjectLink } from "@/lib/project-types";
import type { SafeRepoStats, SyncStatus } from "@/lib/github/safe-stats";

interface AdminRow {
  slug: string;
  title: string;
  category: string;
  status: ProjectInput["status"];
  kind: ProjectInput["kind"];
  year: string;
  draft: boolean;
  featured: boolean;
  sortOrder: number;
  repoOwner: string | null;
  repoName: string | null;
  syncStatus: SyncStatus | null;
  syncError: string | null;
  syncedAt: string | null;
}

interface SyncResult {
  slug: string;
  ok: boolean;
  status: SyncStatus;
  error?: string;
}

function relative(iso: string | null): string {
  if (!iso) return "never synced";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "synced just now";
  if (mins < 60) return `synced ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `synced ${hours}h ago`;
  return `synced ${Math.floor(hours / 24)}d ago`;
}

export function ProjectsEditor() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectInput>(EMPTY_PROJECT);
  const [stats, setStats] = useState<SafeRepoStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [tokenError, setTokenError] = useState(false);

  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/admin/projects");
    if (!res.ok) return null;
    const data = await res.json();
    return data.projects as AdminRow[];
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadProjects();
      if (next) setRows(next);
    } catch {
      // ignore — the list simply keeps what it had
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await loadProjects();
        if (next && !cancelled) setRows(next);
      } catch {
        // ignore — the list simply stays empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [loadProjects]);

  const patch = (values: Partial<ProjectInput>) =>
    setDraft((prev) => ({ ...prev, ...values }));

  const patchMeta = (values: Partial<ProjectInput["meta"]>) =>
    setDraft((prev) => ({ ...prev, meta: { ...prev.meta, ...values } }));

  const handleNew = () => {
    setDraft(EMPTY_PROJECT);
    setStats(null);
    setEditSlug(null);
    setShowEditor(true);
  };

  const handleEdit = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/projects/${slug}`);
      if (!res.ok) {
        alert("Failed to load project.");
        return;
      }
      const data = await res.json();
      setDraft(data.project);
      setStats(data.stats);
      setEditSlug(slug);
      setShowEditor(true);
    } catch (err) {
      alert(`Error: ${String(err)}`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = editSlug || draft.slug || slugify(draft.title);
      const payload: ProjectInput = { ...draft, slug };

      const res = await fetch(
        editSlug ? `/api/admin/projects/${editSlug}` : "/api/admin/projects",
        {
          method: editSlug ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project: payload }),
        }
      );

      if (res.ok) {
        setShowEditor(false);
        await reload();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to save: ${data.error ?? res.statusText}`);
      }
    } catch (err) {
      alert(`Error: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/projects/${slug}`, { method: "DELETE" });
      if (res.ok) {
        await reload();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to delete: ${data.error ?? res.statusText}`);
      }
    } catch (err) {
      alert(`Error: ${String(err)}`);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResults(null);
    setTokenError(false);
    try {
      const res = await fetch("/api/admin/projects/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSyncResults(data.results ?? []);
        setTokenError(Boolean(data.tokenError));
        await reload();
      } else {
        alert(`Sync failed: ${data.error ?? res.statusText}`);
      }
    } catch (err) {
      alert(`Error: ${String(err)}`);
    } finally {
      setSyncing(false);
    }
  };

  // --- Full-screen editor ---

  if (showEditor) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-2xl text-primary">
            {editSlug ? "Edit Project" : "New Project"}
          </h2>
          <button
            onClick={() => setShowEditor(false)}
            className="text-sm text-secondary hover:text-primary"
          >
            &larr; Back to projects
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title</label>
              <input
                value={draft.title}
                onChange={(e) => {
                  const title = e.target.value;
                  patch(
                    editSlug ? { title } : { title, slug: slugify(title) }
                  );
                }}
                placeholder="Project title"
                className={`mt-1 ${inputClass}`}
              />
            </div>

            <div>
              <label className={labelClass}>
                Slug {editSlug && <span className="normal-case">(locked)</span>}
              </label>
              <input
                value={draft.slug}
                onChange={(e) => patch({ slug: slugify(e.target.value) })}
                disabled={Boolean(editSlug)}
                placeholder="project-slug"
                className={`mt-1 ${inputClass} disabled:opacity-50`}
              />
            </div>

            <div>
              <label className={labelClass}>Summary (one line)</label>
              <input
                value={draft.summary}
                onChange={(e) => patch({ summary: e.target.value })}
                placeholder="One line — card subtitle and meta description"
                className={`mt-1 ${inputClass}`}
              />
            </div>

            <div>
              <label className={labelClass}>Description (2–3 sentences)</label>
              <textarea
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                rows={4}
                placeholder="Shown on the card"
                className={`mt-1 ${textareaClass}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => patch({ category: e.target.value })}
                  className={`mt-1 ${selectClass}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    patch({ status: e.target.value as ProjectInput["status"] })
                  }
                  className={`mt-1 ${selectClass}`}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Kind</label>
                <select
                  value={draft.kind}
                  onChange={(e) =>
                    patch({ kind: e.target.value as ProjectInput["kind"] })
                  }
                  className={`mt-1 ${selectClass}`}
                >
                  {PROJECT_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Year</label>
                <input
                  value={draft.year}
                  onChange={(e) => patch({ year: e.target.value })}
                  placeholder="2026"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
            </div>

            {draft.kind === "client" && (
              <div>
                <label className={labelClass}>Client</label>
                <input
                  value={draft.client}
                  onChange={(e) => patch({ client: e.target.value })}
                  placeholder="Real name, or anonymised"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Repo owner</label>
                <input
                  value={draft.repoOwner ?? ""}
                  onChange={(e) => patch({ repoOwner: e.target.value || null })}
                  placeholder="Maazaowski"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className={labelClass}>Repo name</label>
                <input
                  value={draft.repoName ?? ""}
                  onChange={(e) => patch({ repoName: e.target.value || null })}
                  placeholder="Signal"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-secondary">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => patch({ featured: e.target.checked })}
                  className="rounded"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-secondary">
                <input
                  type="checkbox"
                  checked={draft.draft}
                  onChange={(e) => patch({ draft: e.target.checked })}
                  className="rounded"
                />
                Draft
              </label>
              <label className="flex items-center gap-2 text-sm text-secondary">
                Order
                <input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) =>
                    patch({ sortOrder: Number(e.target.value) || 0 })
                  }
                  className="w-20 rounded-lg border border-glass-border bg-surface-1 px-2 py-1 text-sm text-primary outline-none focus:border-accent-blue"
                />
              </label>
            </div>

            <div>
              <label className={labelClass}>Stack (comma-separated)</label>
              <input
                value={draft.meta.stack.join(", ")}
                onChange={(e) =>
                  patchMeta({
                    stack: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="TypeScript, Next.js, PostgreSQL"
                className={`mt-1 ${inputClass}`}
              />
            </div>

            <OutcomesEditor
              outcomes={draft.meta.outcomes}
              onChange={(outcomes) => patchMeta({ outcomes })}
            />

            <LinksEditor
              links={draft.meta.links}
              onChange={(links) => patchMeta({ links })}
            />

            <GalleryEditor
              gallery={draft.meta.gallery}
              onChange={(gallery) => patchMeta({ gallery })}
            />

            <div>
              <label className={labelClass}>Case study (MDX)</label>
              <textarea
                value={draft.body}
                onChange={(e) => patch({ body: e.target.value })}
                placeholder="Write the case study in MDX. ## headings become the table of contents."
                className={`mt-1 h-96 ${textareaClass} font-mono`}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !draft.title || !draft.slug}
              className="rounded-xl bg-accent-blue px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-purple disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editSlug
                  ? "Update Project"
                  : "Create Project"}
            </button>
          </div>

          {/* Preview + synced stats */}
          <div className="space-y-6">
            <GlassCard className="h-fit p-6" hover={false}>
              <p className={`${labelClass} mb-4 block`}>Preview</p>
              <div className="prose">
                <h1>{draft.title || "Untitled"}</h1>
                <p className="text-secondary">{draft.summary}</p>
                <div className="mt-4 max-h-80 overflow-y-auto rounded-lg bg-surface-1 p-4 font-mono text-sm whitespace-pre-wrap text-muted">
                  {draft.body || "Start writing..."}
                </div>
              </div>
            </GlassCard>

            <GlassCard className="h-fit p-6" hover={false}>
              <p className={`${labelClass} mb-4 block`}>
                Synced from GitHub (read-only)
              </p>
              {stats ? (
                <>
                  {stats.visibility === "private" && (
                    <p className="mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                      Private repo — repo URL, branch, topics and releases are
                      redacted at sync time. Everything below is what the public
                      page can see.
                    </p>
                  )}
                  <pre className="max-h-80 overflow-auto rounded-lg bg-surface-1 p-4 font-mono text-[11px] leading-relaxed text-muted">
                    {JSON.stringify(stats, null, 2)}
                  </pre>
                </>
              ) : (
                <p className="text-sm text-muted">
                  No stats yet. Set a repo owner and name, save, then press
                  &ldquo;Sync now&rdquo; on the projects list.
                </p>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  // --- List view ---

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-secondary">
          {rows.length} project{rows.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-xl border border-glass-border bg-glass-bg px-4 py-2 text-sm text-secondary transition-colors hover:text-primary disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync now"}
          </button>
          <button
            onClick={handleNew}
            className="rounded-xl bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-purple"
          >
            New Project
          </button>
        </div>
      </div>

      <p className="mb-6 text-xs text-muted">
        A full sync takes 10–30 seconds; GitHub warms its activity stats on
        first request.
      </p>

      {tokenError && (
        <div className="mb-6 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          GitHub token invalid or expired. Check{" "}
          <code className="font-mono">GITHUB_SYNC_TOKEN</code>.
        </div>
      )}

      {syncResults && (
        <div className="mb-6 space-y-1 rounded-xl border border-glass-border bg-glass-bg p-4">
          {syncResults.length === 0 ? (
            <p className="text-sm text-muted">
              No projects have a repo configured.
            </p>
          ) : (
            syncResults.map((r) => (
              <p key={r.slug} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    r.status === "ok"
                      ? "text-success"
                      : r.status === "partial"
                        ? "text-warning"
                        : "text-error"
                  }
                >
                  {r.status === "ok" ? "✓" : r.status === "partial" ? "!" : "✗"}
                </span>
                <span className="text-secondary">{r.slug}</span>
                {r.error && <span className="text-xs text-muted">{r.error}</span>}
              </p>
            ))
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-shimmer rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <GlassCard className="p-12 text-center" hover={false}>
          <p className="text-secondary">No projects yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <GlassCard key={row.slug} className="p-4" hover={false}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-primary">{row.title}</h3>
                    <span className="rounded-full border border-accent-blue/20 bg-accent-blue/10 px-2 py-0.5 text-[11px] font-medium text-accent-blue">
                      {STATUS_LABELS[row.status]}
                    </span>
                    {row.draft && (
                      <span className="rounded-full border border-glass-border bg-surface-2 px-2 py-0.5 text-[11px] text-secondary">
                        Draft
                      </span>
                    )}
                    {row.featured && (
                      <span className="text-[11px] text-muted">★</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {row.slug} &middot; {row.category}
                    {row.year && <> &middot; {row.year}</>}
                    {row.repoOwner && row.repoName && (
                      <>
                        {" "}
                        &middot;{" "}
                        <span
                          className={
                            row.syncStatus === "error"
                              ? "text-error"
                              : row.syncStatus === "partial"
                                ? "text-warning"
                                : ""
                          }
                          title={row.syncError ?? undefined}
                        >
                          {relative(row.syncedAt)}
                          {row.syncError && ` (${row.syncError})`}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <button
                    onClick={() => handleEdit(row.slug)}
                    className="text-secondary hover:text-primary"
                  >
                    Edit
                  </button>
                  <a
                    href={`/projects/${row.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:text-primary"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(row.slug)}
                    className="text-error hover:underline"
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

// --- Nested list editors ---

function OutcomesEditor({
  outcomes,
  onChange,
}: {
  outcomes: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className={labelClass}>Outcomes</label>
        <button
          type="button"
          onClick={() => onChange([...outcomes, ""])}
          className="text-xs text-accent-blue hover:underline"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {outcomes.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={o}
              onChange={(e) =>
                onChange(outcomes.map((v, j) => (j === i ? e.target.value : v)))
              }
              placeholder="Something verifiable this achieved"
              className={inputClass}
            />
            <RowControls
              index={i}
              length={outcomes.length}
              onMove={(d) => onChange(moveItem(outcomes, i, d))}
              onRemove={() => onChange(outcomes.filter((_, j) => j !== i))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function LinksEditor({
  links,
  onChange,
}: {
  links: ProjectLink[];
  onChange: (next: ProjectLink[]) => void;
}) {
  const update = (i: number, field: keyof ProjectLink, value: string) =>
    onChange(links.map((l, j) => (j === i ? { ...l, [field]: value } : l)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className={labelClass}>Links</label>
        <button
          type="button"
          onClick={() => onChange([...links, { label: "", href: "https://" }])}
          className="text-xs text-accent-blue hover:underline"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {links.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={l.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="Label"
              className={`${inputClass} w-1/3`}
            />
            <input
              value={l.href}
              onChange={(e) => update(i, "href", e.target.value)}
              placeholder="https://"
              className={inputClass}
            />
            <RowControls
              index={i}
              length={links.length}
              onMove={(d) => onChange(moveItem(links, i, d))}
              onRemove={() => onChange(links.filter((_, j) => j !== i))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryEditor({
  gallery,
  onChange,
}: {
  gallery: GalleryImage[];
  onChange: (next: GalleryImage[]) => void;
}) {
  const update = (i: number, values: Partial<GalleryImage>) =>
    onChange(gallery.map((g, j) => (j === i ? { ...g, ...values } : g)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className={labelClass}>Screenshots</label>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...gallery,
              { src: "/images/projects/", alt: "", width: 1600, height: 1000 },
            ])
          }
          className="text-xs text-accent-blue hover:underline"
        >
          + Add
        </button>
      </div>
      {gallery.length > 0 && (
        <p className="mb-2 text-xs text-muted">
          Commit the file under <code className="font-mono">public/</code> first;
          remote URLs are rejected.
        </p>
      )}
      <div className="space-y-3">
        {gallery.map((g, i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-glass-border p-3"
          >
            <div className="flex items-center gap-2">
              <input
                value={g.src}
                onChange={(e) => update(i, { src: e.target.value })}
                placeholder="/images/projects/slug/01.png"
                className={inputClass}
              />
              <RowControls
                index={i}
                length={gallery.length}
                onMove={(d) => onChange(moveItem(gallery, i, d))}
                onRemove={() => onChange(gallery.filter((_, j) => j !== i))}
              />
            </div>
            <input
              value={g.alt}
              onChange={(e) => update(i, { alt: e.target.value })}
              placeholder="Alt text — what the screenshot shows"
              className={inputClass}
            />
            <div className="flex items-center gap-2">
              <input
                value={g.caption ?? ""}
                onChange={(e) =>
                  update(i, { caption: e.target.value || undefined })
                }
                placeholder="Caption (optional)"
                className={inputClass}
              />
              <input
                type="number"
                value={g.width}
                onChange={(e) => update(i, { width: Number(e.target.value) || 0 })}
                placeholder="Width"
                className="w-24 rounded-xl border border-glass-border bg-surface-1 px-3 py-3 text-sm text-primary outline-none focus:border-accent-blue"
              />
              <input
                type="number"
                value={g.height}
                onChange={(e) => update(i, { height: Number(e.target.value) || 0 })}
                placeholder="Height"
                className="w-24 rounded-xl border border-glass-border bg-surface-1 px-3 py-3 text-sm text-primary outline-none focus:border-accent-blue"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
