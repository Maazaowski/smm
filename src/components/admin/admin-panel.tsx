"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AboutEditor } from "@/components/admin/about-editor";
import { ProjectsEditor } from "@/components/admin/projects-editor";
import { TestimonialsEditor } from "@/components/admin/testimonials-editor";
import { AnalyticsTab, useAnalytics } from "@/components/admin/analytics";
import {
  AdminHead,
  Notice,
  SectionSlug,
  Skeleton,
  Tag,
  type AdminTab,
  type NoticeState,
} from "@/components/admin/admin-shell";
import {
  inputClass,
  labelClass,
  selectClass,
  textareaClass,
} from "@/components/admin/editor-primitives";
import { useDraftGuard, type DraftStatus } from "@/hooks/use-draft-guard";
import { CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

interface PostEntry {
  slug: string;
  title: string;
  date: string;
  draft: boolean;
  category: string;
  notified: boolean;
}

/**
 * The desk. One page, five sections, the section in the URL.
 *
 * Analytics is loaded once here and shared: the Essays list shows views per
 * row from the same payload the Analytics section charts, so the two never
 * disagree and switching between them does not refetch.
 */
export function AdminPanel({ tab }: { tab: AdminTab }) {
  const router = useRouter();
  const analytics = useAnalytics();

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.refresh();
  };

  const viewsBySlug = new Map(
    (analytics.data?.postStats ?? []).map((s) => [s.slug, s.views])
  );

  return (
    <>
      <AdminHead tab={tab} onLogout={handleLogout} />
      <main className="sg-wrap ad-main">
        {tab === "posts" && (
          <PostsSection
            views={viewsBySlug}
            viewsReady={Boolean(analytics.data)}
            onChanged={analytics.reload}
          />
        )}
        {tab === "projects" && (
          <>
            <SectionSlug tab="projects" fact="synced from GitHub nightly" />
            <ProjectsEditor />
          </>
        )}
        {tab === "about" && (
          <>
            <SectionSlug tab="about" fact="renders at /about" />
            <AboutEditor />
          </>
        )}
        {tab === "testimonials" && (
          <>
            <SectionSlug tab="testimonials" fact="drafts until published" />
            <TestimonialsEditor />
          </>
        )}
        {tab === "analytics" && (
          <AnalyticsTab
            data={analytics.data}
            error={analytics.error}
            loading={analytics.loading}
            onReload={analytics.reload}
          />
        )}
      </main>
    </>
  );
}

/* ======================================================================
   ESSAYS
   ====================================================================== */

function PostsSection({
  views,
  viewsReady,
  onChanged,
}: {
  views: Map<string, number>;
  viewsReady: boolean;
  onChanged: () => void;
}) {
  const [posts, setPosts] = useState<PostEntry[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [sendingSlug, setSendingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);

  // Editor state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [tags, setTags] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

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
        const res = await fetch("/api/admin/posts", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load essays (${res.status})`);
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

  const published = posts.filter((p) => !p.draft).length;
  const drafts = posts.length - published;

  const handleNew = () => {
    setEditSlug(null);
    setTitle("");
    setDescription("");
    setCategory(CATEGORIES[0]);
    setTags("");
    setIsDraft(false);
    setBody("");
    setNotice(null);
    setShowEditor(true);
  };

  const handleEdit = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Could not open "${slug}" (${res.status}).`);
      const data = await res.json();
      setEditSlug(slug);
      setTitle(data.frontmatter.title);
      setDescription(data.frontmatter.description);
      setCategory(data.frontmatter.category);
      setTags(data.frontmatter.tags.join(", "));
      setIsDraft(data.frontmatter.draft || false);
      setBody(data.content);
      setNotice(null);
      setShowEditor(true);
    } catch (err) {
      setNotice({ tone: "bad", text: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    draft.setStatus("saving");
    try {
      const slug = editSlug || slugify(title);
      const method = editSlug ? "PUT" : "POST";
      const url = editSlug ? `/api/admin/posts/${editSlug}` : "/api/admin/posts";

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
        setNotice({
          tone: "ok",
          text: editSlug ? `Saved "${title}".` : `Created "${title}" at /blog/${slug}.`,
        });
        fetchPosts();
        onChanged();
      } else {
        const data = await res.json().catch(() => ({}));
        draft.setStatus("error");
        setNotice({ tone: "bad", text: `Save failed: ${data.error ?? res.statusText}` });
      }
    } catch (err) {
      draft.setStatus("error");
      setNotice({ tone: "bad", text: `Save failed: ${String(err)}` });
    } finally {
      setSaving(false);
    }
  };

  // Leaving the editor with unsaved work used to discard it silently.
  const handleCloseEditor = () => {
    if (draft.dirty) {
      setNotice({
        tone: "warn",
        text: "You have unsaved changes. Leave the editor and lose them?",
        confirm: {
          label: "Leave",
          tone: "danger",
          onConfirm: () => {
            setNotice(null);
            setShowEditor(false);
          },
        },
      });
      return;
    }
    setShowEditor(false);
  };

  const askDelete = (post: PostEntry) => {
    setNotice({
      tone: "bad",
      text: (
        <>
          Delete <b>{post.title}</b>? The essay and its URL are gone for good;
          view counts and reactions stay in Redis under the old slug.
        </>
      ),
      confirm: {
        label: "Delete",
        tone: "danger",
        onConfirm: async () => {
          setNotice(null);
          try {
            const res = await fetch(`/api/admin/posts/${post.slug}`, { method: "DELETE" });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error ?? `Delete failed (${res.status})`);
            }
            setNotice({ tone: "ok", text: `Deleted "${post.title}".` });
            fetchPosts();
            onChanged();
          } catch (err) {
            setNotice({ tone: "bad", text: err instanceof Error ? err.message : String(err) });
          }
        },
      },
    });
  };

  const askNotify = (post: PostEntry) => {
    if (subscriberCount === 0) {
      setNotice({ tone: "info", text: "There are no subscribers to send to yet." });
      return;
    }
    setNotice({
      tone: "warn",
      text: (
        <>
          Email <b>{post.title}</b> to {subscriberCount.toLocaleString()} subscriber
          {subscriberCount === 1 ? "" : "s"}? Each address gets it once; this
          cannot be recalled.
        </>
      ),
      confirm: {
        label: `Send to ${subscriberCount.toLocaleString()}`,
        onConfirm: () => {
          setNotice(null);
          void sendNotify(post);
        },
      },
    });
  };

  const sendNotify = async (post: PostEntry) => {
    setSendingSlug(post.slug);
    try {
      const res = await fetch(`/api/admin/posts/${post.slug}/notify`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotice({
          tone: "ok",
          text: `Sent to ${data.sent ?? 0} subscriber${data.sent === 1 ? "" : "s"}.`,
        });
        setPosts((prev) => prev.map((p) => (p.slug === post.slug ? { ...p, notified: true } : p)));
      } else if (data.alreadySent) {
        setNotice({ tone: "info", text: "This essay was already sent to subscribers." });
        setPosts((prev) => prev.map((p) => (p.slug === post.slug ? { ...p, notified: true } : p)));
      } else {
        setNotice({ tone: "bad", text: `Send failed: ${data.error ?? res.statusText}` });
      }
    } catch (err) {
      setNotice({ tone: "bad", text: `Send failed: ${String(err)}` });
    } finally {
      setSendingSlug(null);
    }
  };

  /* ---------------------------------------------------------- editor --- */

  if (showEditor) {
    const previewSlug = editSlug ?? slugify(title);
    return (
      <>
        <SectionSlug tab="posts" fact={editSlug ? `editing /blog/${editSlug}` : "new essay"} />

        <div className="ad-bar">
          <div>
            <h1 className="ad-title">{editSlug ? "Edit essay" : "New essay"}</h1>
          </div>
          <div className="ad-actions">
            <DraftStatusIndicator status={draft.status} dirty={draft.dirty} />
            <button type="button" onClick={handleCloseEditor} className="ad-link">
              ← Back to essays
            </button>
          </div>
        </div>

        {draft.recovered && (
          <Notice
            notice={{
              tone: "warn",
              text: `Unsaved changes from ${new Date(draft.recovered.at).toLocaleString()} were recovered from this browser.`,
              confirm: {
                label: "Restore them",
                onConfirm: () => {
                  const v = draft.recovered!.value;
                  setTitle(v.title);
                  setDescription(v.description);
                  setCategory(v.category);
                  setTags(v.tags);
                  setIsDraft(v.isDraft);
                  setBody(v.body);
                  draft.dismissRecovered();
                },
              },
            }}
            onDismiss={draft.dismissRecovered}
          />
        )}

        <Notice notice={notice} onDismiss={() => setNotice(null)} />

        <div className="ad-editor">
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="post-title">
                Title
              </label>
              <input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What the essay is about, in the fewest words"
                className={inputClass}
              />
              {!editSlug && title && (
                <span className="ad-help sg-mono">/blog/{previewSlug}</span>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="post-dek">
                Dek
              </label>
              <input
                id="post-dek"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One sentence under the title. Also the meta description."
                className={inputClass}
              />
            </div>

            <div className="ad-grid-2">
              <div>
                <label className={labelClass} htmlFor="post-category">
                  Category
                </label>
                <select
                  id="post-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                <label className={labelClass} htmlFor="post-tags">
                  Tags
                </label>
                <input
                  id="post-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="agents, evals — comma-separated"
                  className={inputClass}
                />
              </div>
            </div>

            <label className="ad-check">
              <input
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
              />
              Draft — hidden from the site, the feed and subscribers
            </label>

            <div>
              <label className={labelClass} htmlFor="post-body">
                Body · MDX
              </label>
              <textarea
                id="post-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="## headings become the contents rail. ```mermaid blocks become diagrams."
                className={`${textareaClass} ad-mono`}
                style={{ minHeight: 480 }}
                spellCheck
              />
            </div>

            <div className="ad-actions">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !title || !description}
                className="sg-cta"
                data-fill="true"
              >
                {saving ? "Saving…" : editSlug ? "Save essay" : "Create essay"}
              </button>
              <span className="sg-micro">⌘S</span>
            </div>
          </div>

          <aside className="ad-panel" aria-label="Preview">
            <h2 className="ad-panel-h">Preview</h2>
            <div className="ad-panel-body">
              <p className="ad-preview-t">{title || "Untitled"}</p>
              <p className="ad-preview-d">{description || "No dek yet."}</p>
              <div className="ad-preview">{body || "Start writing…"}</div>
            </div>
          </aside>
        </div>
      </>
    );
  }

  /* ------------------------------------------------------------ list --- */

  return (
    <>
      <SectionSlug
        tab="posts"
        fact={
          loading
            ? "loading"
            : `${published} published · ${drafts} draft${drafts === 1 ? "" : "s"} · ${subscriberCount.toLocaleString()} subscriber${subscriberCount === 1 ? "" : "s"}`
        }
      />

      <div className="ad-bar">
        <div>
          <h1 className="ad-title">What I got wrong first</h1>
          <p>
            Publishing puts an essay on the site, in the feed and in the sitemap.
            Subscribers are emailed by hand, from the row, once.
          </p>
        </div>
        <div className="ad-actions">
          <button type="button" onClick={handleNew} className="sg-cta" data-fill="true">
            New essay
          </button>
        </div>
      </div>

      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      {loadError ? (
        <div className="ad-notice" data-tone="bad" role="alert">
          <span>{loadError}</span>
          <span className="ad-notice-actions">
            <button type="button" className="ad-link" onClick={fetchPosts}>
              Retry
            </button>
          </span>
        </div>
      ) : loading ? (
        <Skeleton rows={4} />
      ) : posts.length === 0 ? (
        <div className="ad-empty">No essays yet. The first one is the hardest.</div>
      ) : (
        <div className="ad-rows">
          {posts.map((post) => {
            const v = views.get(post.slug);
            return (
              <article key={post.slug} className="ad-row">
                <span className="ad-row-r">{post.date}</span>

                <div className="min-w-0">
                  <h3 className="ad-row-t">{post.title}</h3>
                  <div className="ad-row-meta">
                    <span className="ad-row-r">{post.category}</span>
                    {post.draft ? <Tag tone="draft">Draft</Tag> : <Tag tone="live">Live</Tag>}
                    {post.notified && <Tag>Sent to subscribers</Tag>}
                  </div>
                </div>

                <div className="ad-row-actions">
                  <span className="ad-fig" title="Deduplicated views, all time">
                    <span className="ad-fig-v">
                      {viewsReady ? (v ?? 0).toLocaleString() : "–"}
                    </span>
                    <span className="ad-fig-k">views</span>
                  </span>
                  {!post.draft && !post.notified && (
                    <button
                      type="button"
                      onClick={() => askNotify(post)}
                      disabled={sendingSlug === post.slug}
                      className="ad-link"
                      title="Email this essay to your subscribers"
                    >
                      {sendingSlug === post.slug ? "Sending…" : "Send"}
                    </button>
                  )}
                  <button type="button" onClick={() => handleEdit(post.slug)} className="ad-link">
                    Edit
                  </button>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ad-link"
                  >
                    View ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => askDelete(post)}
                    className="ad-link"
                    data-tone="danger"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
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
    return (
      <span className="sg-micro" style={{ color: "var(--bad)" }}>
        Save failed
      </span>
    );
  }
  if (status === "saving") {
    return <span className="sg-micro">Saving…</span>;
  }
  if (dirty) {
    return (
      <span className="sg-micro" style={{ color: "var(--warn)" }}>
        Unsaved · kept in this browser
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="sg-micro" style={{ color: "var(--signal)" }}>
        Saved
      </span>
    );
  }
  return null;
}
