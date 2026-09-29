"use client";

import { useCallback, useEffect, useState } from "react";
import { Tag } from "@/components/admin/admin-shell";
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
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

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
        setNotice({ tone: "bad", text: "Failed to load project." });
        return;
      }
      const data = await res.json();
      setDraft(data.project);
      setStats(data.stats);
      setEditSlug(slug);
      setShowEditor(true);
    } catch (err) {
      setNotice({ tone: "bad", text: `Error: ${String(err)}` });
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
        setNotice({ tone: "ok", text: `Saved "${draft.title}".` });
        await reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setNotice({ tone: "bad", text: `Save failed: ${data.error ?? res.statusText}` });
      }
    } catch (err) {
      setNotice({ tone: "bad", text: `Error: ${String(err)}` });
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
        setNotice({ tone: "bad", text: `Delete failed: ${data.error ?? res.statusText}` });
      }
    } catch (err) {
      setNotice({ tone: "bad", text: `Error: ${String(err)}` });
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
        setNotice({ tone: "bad", text: `Sync failed: ${data.error ?? res.statusText}` });
      }
    } catch (err) {
      setNotice({ tone: "bad", text: `Error: ${String(err)}` });
    } finally {
      setSyncing(false);
    }
  };

  // --- Full-screen editor ---

  if (showEditor) {
    return (
      <div>
        <div className="ad-bar">
          <div>
            <h1 className="ad-title">{editSlug ? "Edit project" : "New project"}</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowEditor(false)}
            className="ad-link"
          >
            ← Back to work
          </button>
        </div>

        {notice && (
          <div className="ad-notice" data-tone={notice.tone} role="status">
            <span>{notice.text}</span>
            <span className="ad-notice-actions">
              <button type="button" className="ad-link" onClick={() => setNotice(null)}>
                Dismiss
              </button>
            </span>
          </div>
        )}

        <div className="ad-editor">
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
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Slug {editSlug && <span style={{ textTransform: "none" }}>(locked)</span>}
              </label>
              <input
                value={draft.slug}
                onChange={(e) => patch({ slug: slugify(e.target.value) })}
                disabled={Boolean(editSlug)}
                placeholder="project-slug"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Summary (one line)</label>
              <input
                value={draft.summary}
                onChange={(e) => patch({ summary: e.target.value })}
                placeholder="One line — card subtitle and meta description"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Description (2–3 sentences)</label>
              <textarea
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                rows={4}
                placeholder="Shown on the card"
                className={textareaClass}
              />
            </div>

            <div className="ad-grid-2">
              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => patch({ category: e.target.value })}
                  className={selectClass}
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
                  className={selectClass}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ad-grid-2">
              <div>
                <label className={labelClass}>Kind</label>
                <select
                  value={draft.kind}
                  onChange={(e) =>
                    patch({ kind: e.target.value as ProjectInput["kind"] })
                  }
                  className={selectClass}
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
                  className={inputClass}
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
                  className={inputClass}
                />
              </div>
            )}

            <div className="ad-grid-2">
              <div>
                <label className={labelClass}>Repo owner</label>
                <input
                  value={draft.repoOwner ?? ""}
                  onChange={(e) => patch({ repoOwner: e.target.value || null })}
                  placeholder="Maazaowski"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Repo name</label>
                <input
                  value={draft.repoName ?? ""}
                  onChange={(e) => patch({ repoName: e.target.value || null })}
                  placeholder="Signal"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="ad-check">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => patch({ featured: e.target.checked })}
                />
                Featured
              </label>
              <label className="ad-check">
                <input
                  type="checkbox"
                  checked={draft.draft}
                  onChange={(e) => patch({ draft: e.target.checked })}
                />
                Draft
              </label>
              <label className="ad-check">
                Order
                <input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) =>
                    patch({ sortOrder: Number(e.target.value) || 0 })
                  }
                  className={`${inputClass} ad-mono w-20`}
                  style={{ minHeight: 32, padding: "4px 8px" }}
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
                className={inputClass}
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
                className={`${textareaClass} ad-mono`}
                style={{ minHeight: 420 }}
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.title || !draft.slug}
              className="sg-cta"
              data-fill="true"
            >
              {saving ? "Saving…" : editSlug ? "Save project" : "Create project"}
            </button>
          </div>

          {/* Preview + synced stats */}
          <div>
            <aside className="ad-panel" aria-label="Preview">
              <h2 className="ad-panel-h">Preview</h2>
              <div className="ad-panel-body">
                <p className="ad-preview-t">{draft.title || "Untitled"}</p>
                <p className="ad-preview-d">{draft.summary || "No summary yet."}</p>
                <div className="ad-preview">{draft.body || "Start writing…"}</div>
              </div>
            </aside>

            <aside className="ad-panel" aria-label="Synced from GitHub">
              <h2 className="ad-panel-h">Synced from GitHub · read-only</h2>
              <div className="ad-panel-body">
                {stats ? (
                  <>
                    {stats.visibility === "private" && (
                      <div className="ad-notice" data-tone="warn" role="note">
                        <span>
                          Private repo — repo URL, branch, topics and releases
                          are redacted at sync time. Everything below is what
                          the public page can see.
                        </span>
                      </div>
                    )}
                    <pre className="ad-preview">{JSON.stringify(stats, null, 2)}</pre>
                  </>
                ) : (
                  <p className="ad-help" style={{ margin: 0 }}>
                    No stats yet. Set a repo owner and name, save, then press
                    &ldquo;Sync now&rdquo; on the work list.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // --- List view ---

  return (
    <div>
      <div className="ad-bar">
        <div>
          <h1 className="ad-title">Things that are running</h1>
          <p>
            {rows.length} project{rows.length === 1 ? "" : "s"}. A full sync
            takes 10–30 seconds; GitHub warms its activity stats on first
            request.
          </p>
        </div>
        <div className="ad-actions">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="sg-cta"
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
          <button type="button" onClick={handleNew} className="sg-cta" data-fill="true">
            New project
          </button>
        </div>
      </div>

      {notice && (
        <div className="ad-notice" data-tone={notice.tone} role="status">
          <span>{notice.text}</span>
          <span className="ad-notice-actions">
            <button type="button" className="ad-link" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </span>
        </div>
      )}

      {tokenError && (
        <div className="ad-notice" data-tone="bad" role="alert">
          <span>
            GitHub token invalid or expired. Check{" "}
            <code className="sg-mono">GITHUB_SYNC_TOKEN</code>.
          </span>
        </div>
      )}

      {syncResults && (
        <div className="ad-notice" data-tone="info" role="status">
          <div>
            {syncResults.length === 0 ? (
              <span>No projects have a repo configured.</span>
            ) : (
              syncResults.map((r) => (
                <p key={r.slug} className="flex items-center gap-2" style={{ margin: 0 }}>
                  <span
                    className="sg-mono"
                    style={{
                      color:
                        r.status === "ok"
                          ? "var(--signal)"
                          : r.status === "partial"
                            ? "var(--warn)"
                            : "var(--bad)",
                    }}
                  >
                    {r.status === "ok" ? "✓" : r.status === "partial" ? "!" : "✗"}
                  </span>
                  <span className="sg-mono">{r.slug}</span>
                  {r.error && <span className="ad-help" style={{ margin: 0 }}>{r.error}</span>}
                </p>
              ))
            )}
          </div>
          <span className="ad-notice-actions">
            <button type="button" className="ad-link" onClick={() => setSyncResults(null)}>
              Dismiss
            </button>
          </span>
        </div>
      )}

      {loading ? (
        <div className="ad-rows" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="ad-skeleton" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="ad-empty">No projects yet.</div>
      ) : (
        <div className="ad-rows">
          {rows.map((row) => (
            <article
              key={row.slug}
              className="ad-row"
              style={{ gridTemplateColumns: "72px minmax(0, 1fr) auto" }}
            >
              <span className="ad-row-r">{row.year || "—"}</span>
              <div className="min-w-0">
                <h3 className="ad-row-t">
                  {row.title}
                  {row.featured && (
                    <span className="sg-micro" style={{ marginLeft: 8 }} title="Featured">
                      ★
                    </span>
                  )}
                </h3>
                <div className="ad-row-meta">
                  <span className="ad-row-r">
                    {row.slug} · {row.category}
                  </span>
                  <Tag>{STATUS_LABELS[row.status]}</Tag>
                  {row.draft ? <Tag tone="draft">Draft</Tag> : <Tag tone="live">Live</Tag>}
                  {row.repoOwner && row.repoName && (
                    <Tag
                      tone={
                        row.syncStatus === "error"
                          ? "bad"
                          : row.syncStatus === "partial"
                            ? "warn"
                            : undefined
                      }
                    >
                      <span title={row.syncError ?? undefined}>
                        {relative(row.syncedAt)}
                        {row.syncError && ` (${row.syncError})`}
                      </span>
                    </Tag>
                  )}
                </div>
              </div>

              <div className="ad-row-actions">
                <button type="button" onClick={() => handleEdit(row.slug)} className="ad-link">
                  Edit
                </button>
                <a
                  href={`/projects/${row.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ad-link"
                >
                  View ↗
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(row.slug)}
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
      <div className="ad-sub-head" style={{ marginBottom: 6 }}>
        <label className={labelClass}>Outcomes</label>
        <button
          type="button"
          onClick={() => onChange([...outcomes, ""])}
          className="ad-link"
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
              label="outcome"
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
      <div className="ad-sub-head" style={{ marginBottom: 6 }}>
        <label className={labelClass}>Links</label>
        <button
          type="button"
          onClick={() => onChange([...links, { label: "", href: "https://" }])}
          className="ad-link"
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
              label="link"
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
      <div className="ad-sub-head" style={{ marginBottom: 6 }}>
        <label className={labelClass}>Screenshots</label>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...gallery,
              { src: "/images/projects/", alt: "", width: 1600, height: 1000 },
            ])
          }
          className="ad-link"
        >
          + Add
        </button>
      </div>
      {gallery.length > 0 && (
        <p className="ad-help" style={{ margin: "0 0 8px" }}>
          Commit the file under <code className="sg-mono">public/</code> first;
          remote URLs are rejected.
        </p>
      )}
      <div className="space-y-3">
        {gallery.map((g, i) => (
          <div
            key={i}
            className="ad-sub space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                value={g.src}
                onChange={(e) => update(i, { src: e.target.value })}
                placeholder="/images/projects/slug/01.png"
                className={inputClass}
              />
              <RowControls
                label="screenshot"
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
                className={`${inputClass} ad-mono w-24`}
              />
              <input
                type="number"
                value={g.height}
                onChange={(e) => update(i, { height: Number(e.target.value) || 0 })}
                placeholder="Height"
                className={`${inputClass} ad-mono w-24`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
