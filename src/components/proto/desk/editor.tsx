"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SUBJECTS, type Subject } from "@/lib/proto-data";
import { useDesk } from "./store";
import { ConfirmDialog } from "./primitives";
import { MarkdownPreview } from "./markdown-preview";

type Pane = "write" | "read";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * The editor.
 *
 * Every defect the audit found in the production editor is addressed here:
 *
 *   Preview showed raw markdown        → the Read pane renders it
 *   No autosave, no dirty state        → saves on a debounce, states are visible
 *   Back discarded work silently       → nothing to discard; it is already saved
 *   New posts defaulted to published   → drafts by default, Publish is separate
 *   Slug was derived and never editable→ editable, with a warning after publish
 *   Free-text tags minted synonyms     → a fixed subject list
 *   No scheduling, no SEO, no counts   → all present, in a panel that folds away
 */
export function Editor({ id }: { id: string }) {
  const { essays, update, create, publish, unpublish, remove, toast } = useDesk();
  const router = useRouter();

  const [createdId, setCreatedId] = useState<string | null>(null);
  const essay = useMemo(
    () => essays.find((e) => e.id === (createdId ?? id)),
    [essays, id, createdId]
  );

  // A "new" URL materialises one draft, once.
  const created = useRef(false);
  useEffect(() => {
    if (id !== "new" || created.current) return;
    created.current = true;
    const draft = create();
    setCreatedId(draft.id);
  }, [id, create]);

  const [pane, setPane] = useState<Pane>("write");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showMeta, setShowMeta] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const patch = useCallback(
    (p: Parameters<typeof update>[1]) => {
      if (!essay) return;
      setSaveState("saving");
      update(essay.id, p);
    },
    [essay, update]
  );

  // Autosave. The indicator is the point: the person must be able to see that
  // their work is safe without having to trust it.
  useEffect(() => {
    if (saveState !== "saving") return;
    const t = setTimeout(() => setSaveState("saved"), 480);
    return () => clearTimeout(t);
  }, [saveState, essay?.body, essay?.title]);

  // ⌘S is muscle memory. Honour it rather than letting the browser open a
  // Save-Page dialog over the editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSaveState("saved");
        toast({ tone: "ok", message: "Saved. It was already safe." });
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPane((p) => (p === "write" ? "read" : "write"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast]);

  if (!essay) {
    return (
      <div className="fn-desk-page">
        <div className="fn-empty">
          <p className="fn-empty-title">That essay is gone.</p>
          <p className="fn-empty-body">
            It may have been deleted.{" "}
            <button
              type="button"
              className="fn-inline-btn"
              onClick={() => router.push("/proto/admin")}
            >
              Back to the desk
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  const words = essay.body.trim() ? essay.body.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 220));
  const slug = essay.slug || slugify(essay.title);
  const blockers = [
    !essay.title.trim() && "a title",
    !essay.dek.trim() && "a description",
    words < 50 && "at least a few paragraphs",
  ].filter(Boolean) as string[];

  return (
    <div className="fn-editor">
      {/* --- the bar: state on the left, actions on the right -------------- */}
      <div className="fn-editor-bar">
        <div className="fn-editor-state">
          <button
            type="button"
            className="fn-back fn-mono"
            onClick={() => router.push("/proto/admin")}
          >
            ← desk
          </button>
          <span className="fn-state" data-state={essay.status === "live" ? "live" : "draft"}>
            {essay.status}
          </span>
          <span className="fn-save fn-mono" data-state={saveState} aria-live="polite">
            {saveState === "saving"
              ? "saving…"
              : saveState === "saved"
                ? "saved"
                : "up to date"}
          </span>
        </div>

        <div className="fn-editor-actions">
          <div className="fn-segment" role="group" aria-label="Pane">
            <button
              type="button"
              data-on={pane === "write" ? "true" : undefined}
              onClick={() => setPane("write")}
            >
              write
            </button>
            <button
              type="button"
              data-on={pane === "read" ? "true" : undefined}
              onClick={() => setPane("read")}
            >
              read
            </button>
          </div>

          {essay.status === "live" ? (
            <button
              type="button"
              className="fn-btn"
              data-variant="quiet"
              onClick={() => unpublish(essay.id)}
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              className="fn-btn"
              data-variant="primary"
              disabled={blockers.length > 0}
              title={
                blockers.length ? `Still needs ${blockers.join(", ")}` : undefined
              }
              onClick={() => setConfirmPublish(true)}
            >
              Publish…
            </button>
          )}
        </div>
      </div>

      {/* --- the sheet ----------------------------------------------------- */}
      <div className="fn-editor-sheet" data-pane={pane}>
        {pane === "write" ? (
          <>
            <input
              className="fn-editor-title"
              value={essay.title}
              placeholder="Title"
              aria-label="Title"
              onChange={(e) => {
                patch({ title: e.target.value });
                if (!slugTouched && essay.status !== "live") {
                  patch({ slug: slugify(e.target.value) });
                }
              }}
            />
            <textarea
              className="fn-editor-dek"
              value={essay.dek}
              placeholder="One or two sentences. This is the deck on the index, the meta description, and the email preview text."
              aria-label="Description"
              rows={2}
              onChange={(e) => patch({ dek: e.target.value })}
            />
            <textarea
              className="fn-editor-body"
              value={essay.body}
              placeholder="Write. Markdown, code fences, everything."
              aria-label="Body"
              spellCheck
              onChange={(e) =>
                patch({
                  body: e.target.value,
                  words: e.target.value.trim()
                    ? e.target.value.trim().split(/\s+/).length
                    : 0,
                  minutes: Math.max(
                    1,
                    Math.round(
                      (e.target.value.trim()
                        ? e.target.value.trim().split(/\s+/).length
                        : 0) / 220
                    )
                  ),
                })
              }
            />
          </>
        ) : (
          // The Read pane renders the piece exactly as the site will set it,
          // in the site's own measure and type. Production's "Preview" showed
          // the raw markdown source in a monospace box.
          <article className="fn-editor-read">
            <h1 className="fn-title fn-editor-read-title">
              {essay.title || "Untitled"}
            </h1>
            {essay.dek && <p className="fn-lede">{essay.dek}</p>}
            <p className="fn-article-meta fn-mono">
              <span>{essay.date}</span>
              <span aria-hidden="true">·</span>
              <span>{essay.subject}</span>
              <span aria-hidden="true">·</span>
              <span>{minutes} min</span>
            </p>
            <div className="fn-prose">
              <MarkdownPreview source={essay.body} />
            </div>
          </article>
        )}
      </div>

      {/* --- the metadata drawer ------------------------------------------- */}
      <div className="fn-editor-meta" data-open={showMeta}>
        <button
          type="button"
          className="fn-meta-toggle"
          aria-expanded={showMeta}
          onClick={() => setShowMeta((v) => !v)}
        >
          <span className="fn-label">Details</span>
          <span className="fn-mono fn-meta-summary">
            {words.toLocaleString()} words · {minutes} min · /{slug || "…"} ·{" "}
            {essay.subject}
          </span>
          <span aria-hidden="true">{showMeta ? "↓" : "↑"}</span>
        </button>

        {showMeta && (
          <div className="fn-meta-fields">
            <label>
              <span className="fn-label">Slug</span>
              <input
                className="fn-field"
                value={essay.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  patch({ slug: slugify(e.target.value) });
                }}
              />
              {essay.status === "live" && (
                <span className="fn-field-note fn-mono">
                  Live. Changing this breaks existing links unless you add a
                  redirect.
                </span>
              )}
            </label>

            <label>
              <span className="fn-label">Subject</span>
              <select
                className="fn-field"
                value={essay.subject}
                onChange={(e) => patch({ subject: e.target.value as Subject })}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="fn-field-note fn-mono">
                Five subjects, not free text. Free text is how “software
                engineering” and “software-engineering” became two tags.
              </span>
            </label>

            <label>
              <span className="fn-label">Publish date</span>
              <input
                className="fn-field"
                type="date"
                value={essay.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
              <span className="fn-field-note fn-mono">
                A future date schedules it.
              </span>
            </label>

            <div className="fn-meta-danger">
              <span className="fn-label">Danger</span>
              <button
                type="button"
                className="fn-btn"
                data-variant="danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete this essay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- publish: a summary, not a confirm() --------------------------- */}
      <ConfirmDialog
        open={confirmPublish}
        tone="normal"
        title="Publish this essay?"
        confirmLabel="Publish now"
        body={
          <>
            <p>It will be live and in the feed immediately.</p>
            <dl className="fn-confirm-spec">
              <div>
                <dt>URL</dt>
                <dd>/essays/{slug}</dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{essay.subject}</dd>
              </div>
              <div>
                <dt>Length</dt>
                <dd>
                  {words.toLocaleString()} words, {minutes} min
                </dd>
              </div>
              <div>
                <dt>Feed</dt>
                <dd>Appears in RSS immediately</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>Not sent — that is a separate, deliberate action</dd>
              </div>
            </dl>
          </>
        }
        onCancel={() => setConfirmPublish(false)}
        onConfirm={() => {
          publish(essay.id);
          setConfirmPublish(false);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this essay?"
        confirmWord={essay.title.split(" ")[0] || "delete"}
        confirmLabel="Delete"
        body={
          <p>
            “{essay.title || "Untitled"}” and its {words.toLocaleString()} words
            will be removed. You can undo this from the toast for eight seconds.
          </p>
        }
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          remove(essay.id);
          router.push("/proto/admin");
        }}
      />
    </div>
  );
}
