"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AboutEditor } from "@/components/admin/about-editor";
import { ProjectsEditor } from "@/components/admin/projects-editor";
import { TestimonialsEditor } from "@/components/admin/testimonials-editor";
import { useDraftGuard, type DraftStatus } from "@/hooks/use-draft-guard";

type AdminTab = "posts" | "projects" | "about" | "testimonials";

interface PostEntry {
  slug: string;
  title: string;
  date: string;
  draft: boolean;
  category: string;
  notified: boolean;
}

export function AdminPanel() {
  const [posts, setPosts] = useState<PostEntry[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [sendingSlug, setSendingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const router = useRouter();

  // Editor state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("AI Engineering");
  const [tags, setTags] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("posts");

  // Everything the editor holds. Serialized for the draft guard so an
  // accidental refresh or a stray "Back" no longer destroys unsaved writing.
  const draftValue = { title, description, category, tags, isDraft, body };
  const draft = useDraftGuard({
    key: editSlug ?? "new-post",
    value: draftValue,
    enabled: showEditor,
    onSave: () => {
      if (!saving && title && description) void handleSave();
    },
  });

  const [reloadKey, setReloadKey] = useState(0);

  /** Refetch the post list. The effect below subscribes to this. */
  const fetchPosts = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/posts");
        if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        setPosts(data.posts);
        setSubscriberCount(data.subscriberCount ?? 0);
        setLoadError(null);
      } catch (err) {
        // Previously an empty catch, which made a failed request look exactly
        // like an empty list.
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.refresh();
  };

  const handleNew = () => {
    setEditSlug(null);
    setTitle("");
    setDescription("");
    setCategory("AI Engineering");
    setTags("");
    setIsDraft(false);
    setBody("");
    setShowEditor(true);
  };

  const handleEdit = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setEditSlug(slug);
        setTitle(data.frontmatter.title);
        setDescription(data.frontmatter.description);
        setCategory(data.frontmatter.category);
        setTags(data.frontmatter.tags.join(", "));
        setIsDraft(data.frontmatter.draft || false);
        setBody(data.content);
        setShowEditor(true);
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug =
        editSlug ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const method = editSlug ? "PUT" : "POST";
      const url = editSlug
        ? `/api/admin/posts/${editSlug}`
        : "/api/admin/posts";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          description,
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          draft: isDraft,
          body,
        }),
      });

      if (res.ok) {
        draft.markSaved();
        setShowEditor(false);
        fetchPosts();
      } else {
        const data = await res.json().catch(() => ({}));
        draft.setStatus("error");
        alert(`Failed to save post: ${data.error ?? res.statusText}`);
      }
    } catch (err) {
      draft.setStatus("error");
      alert(`Error: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  // Leaving the editor with unsaved work used to discard it silently.
  const handleCloseEditor = () => {
    if (
      draft.dirty &&
      !confirm("You have unsaved changes. Leave the editor and lose them?")
    ) {
      return;
    }
    setShowEditor(false);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;

    try {
      await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
      fetchPosts();
    } catch {
      // ignore
    }
  };

  const handleNotify = async (slug: string, title: string) => {
    if (subscriberCount === 0) {
      alert("You have no subscribers yet.");
      return;
    }
    if (
      !confirm(
        `Email "${title}" to ${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }

    setSendingSlug(slug);
    try {
      const res = await fetch(`/api/admin/posts/${slug}/notify`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(`Sent to ${data.sent ?? 0} subscriber${data.sent === 1 ? "" : "s"}.`);
        setPosts((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, notified: true } : p))
        );
      } else if (data.alreadySent) {
        alert("This post was already sent to subscribers.");
        setPosts((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, notified: true } : p))
        );
      } else {
        alert(`Failed to send: ${data.error ?? res.statusText}`);
      }
    } catch (err) {
      alert(`Error: ${String(err)}`);
    } finally {
      setSendingSlug(null);
    }
  };

  if (showEditor) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl text-primary">
            {editSlug ? "Edit Post" : "New Post"}
          </h1>
          <div className="flex items-center gap-4">
            <DraftStatusIndicator status={draft.status} dirty={draft.dirty} />
            <button
              onClick={handleCloseEditor}
              className="text-sm text-secondary hover:text-primary"
            >
              &larr; Back to posts
            </button>
          </div>
        </div>

        {draft.recovered && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
            <p className="text-sm text-primary">
              Unsaved changes from{" "}
              {new Date(draft.recovered.at).toLocaleString()} were recovered
              from this browser.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const v = draft.recovered!.value;
                  setTitle(v.title);
                  setDescription(v.description);
                  setCategory(v.category);
                  setTags(v.tags);
                  setIsDraft(v.isDraft);
                  setBody(v.body);
                  draft.dismissRecovered();
                }}
                className="rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-medium text-white"
              >
                Restore them
              </button>
              <button
                onClick={draft.dismissRecovered}
                className="rounded-lg border border-glass-border px-3 py-1.5 text-xs text-secondary hover:text-primary"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className="w-full rounded-xl border border-glass-border bg-surface-1 px-4 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-accent-blue"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full rounded-xl border border-glass-border bg-surface-1 px-4 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-accent-blue"
            />
            <div className="flex gap-4">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 rounded-xl border border-glass-border bg-surface-1 px-4 py-3 text-sm text-primary outline-none focus:border-accent-blue"
              >
                {[
                  "AI Engineering",
                  "Web Development",
                  "Career",
                  "Tech News",
                  "Architecture",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-secondary">
                <input
                  type="checkbox"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                  className="rounded"
                />
                Draft
              </label>
            </div>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="w-full rounded-xl border border-glass-border bg-surface-1 px-4 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-accent-blue"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your MDX content here..."
              className="w-full h-96 rounded-xl border border-glass-border bg-surface-1 px-4 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-accent-blue font-mono resize-none"
            />
            <button
              onClick={handleSave}
              disabled={saving || !title || !description}
              className="rounded-xl bg-accent-blue px-6 py-3 text-sm font-medium text-white hover:bg-accent-purple transition-colors disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editSlug
                  ? "Update Post  ⌘S"
                  : "Create Post  ⌘S"}
            </button>
          </div>

          {/* Preview */}
          <GlassCard className="p-6 h-fit" hover={false}>
            <p className="text-xs text-muted uppercase tracking-wider mb-4">
              Preview
            </p>
            <div className="prose">
              <h1>{title || "Untitled"}</h1>
              <p className="text-secondary">{description}</p>
              <div className="text-sm text-muted whitespace-pre-wrap font-mono bg-surface-1 p-4 rounded-lg mt-4 max-h-80 overflow-y-auto">
                {body || "Start writing..."}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <h1 className="font-display text-3xl text-primary">Admin</h1>
          <div className="flex rounded-xl border border-glass-border bg-glass-bg p-1">
            <button
              onClick={() => setActiveTab("posts")}
              className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
                activeTab === "posts"
                  ? "bg-accent-blue text-white"
                  : "text-secondary hover:text-primary"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
                activeTab === "projects"
                  ? "bg-accent-blue text-white"
                  : "text-secondary hover:text-primary"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
                activeTab === "about"
                  ? "bg-accent-blue text-white"
                  : "text-secondary hover:text-primary"
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab("testimonials")}
              className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
                activeTab === "testimonials"
                  ? "bg-accent-blue text-white"
                  : "text-secondary hover:text-primary"
              }`}
            >
              References
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl border border-glass-border bg-glass-bg px-4 py-2 text-sm text-secondary hover:text-primary transition-all"
          >
            Dashboard
          </Link>
          {activeTab === "posts" && (
            <button
              onClick={handleNew}
              className="rounded-xl bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-purple transition-colors"
            >
              New Post
            </button>
          )}
          <button
            onClick={handleLogout}
            className="rounded-xl border border-glass-border bg-glass-bg px-4 py-2 text-sm text-secondary hover:text-primary transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {activeTab === "testimonials" ? (
        <TestimonialsEditor />
      ) : activeTab === "about" ? (
        <AboutEditor />
      ) : activeTab === "projects" ? (
        <ProjectsEditor />
      ) : loadError ? (
        <GlassCard className="p-8 text-center" hover={false}>
          <p className="text-error text-sm">{loadError}</p>
        </GlassCard>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <GlassCard className="p-12 text-center" hover={false}>
          <p className="text-secondary">No posts yet. Create your first one!</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <GlassCard key={post.slug} className="p-4" hover={false}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-primary">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {post.date} · {post.category}
                    </p>
                  </div>
                  {post.draft && <Badge variant="accent">Draft</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {!post.draft &&
                    (post.notified ? (
                      <span
                        className="text-xs text-teal-400 px-2 py-1"
                        title="This post was emailed to subscribers"
                      >
                        Sent ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => handleNotify(post.slug, post.title)}
                        disabled={sendingSlug === post.slug}
                        className="text-xs text-accent-blue hover:text-accent-purple transition-colors px-2 py-1 disabled:opacity-50"
                        title="Email this post to your subscribers"
                      >
                        {sendingSlug === post.slug ? "Sending..." : "Send to subscribers"}
                      </button>
                    ))}
                  <button
                    onClick={() => handleEdit(post.slug)}
                    className="text-xs text-secondary hover:text-primary transition-colors px-2 py-1"
                  >
                    Edit
                  </button>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs text-secondary hover:text-primary transition-colors px-2 py-1"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(post.slug)}
                    className="text-xs text-error hover:text-error/80 transition-colors px-2 py-1"
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

/**
 * Shows whether the editor's work is safe. "Unsaved" is the important state —
 * it is the one that used to be invisible right up until the work was gone.
 */
function DraftStatusIndicator({
  status,
  dirty,
}: {
  status: DraftStatus;
  dirty: boolean;
}) {
  if (status === "error") {
    return <span className="text-xs text-error">Save failed</span>;
  }
  if (status === "saving") {
    return <span className="text-xs text-muted">Saving…</span>;
  }
  if (dirty) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Unsaved changes — kept in this browser
      </span>
    );
  }
  if (status === "saved") {
    return <span className="text-xs text-success">Saved</span>;
  }
  return null;
}
