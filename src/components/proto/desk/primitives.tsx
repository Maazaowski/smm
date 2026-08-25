"use client";

import { useEffect, useRef, useState } from "react";
import { useDesk } from "./store";

/**
 * Notifications, replacing alert().
 *
 * A destructive action that can be undone for eight seconds is safer than a
 * confirm() dialog that can be dismissed by muscle memory, and it does not stop
 * the person from working while they decide.
 */
export function Toasts() {
  const { toasts, dismiss } = useDesk();
  if (toasts.length === 0) return null;

  return (
    <div className="fn-toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="fn-toast" data-tone={t.tone}>
          <span className="fn-toast-msg">{t.message}</span>
          {t.undo && (
            <button
              type="button"
              className="fn-toast-undo"
              onClick={() => {
                t.undo?.();
                dismiss(t.id);
              }}
            >
              undo
            </button>
          )}
          <button
            type="button"
            className="fn-toast-x"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Confirmation for actions that cannot be undone.
 *
 * Used only where undo is genuinely impossible — the subscriber broadcast.
 * It shows the recipient count, the subject line, and requires the word to be
 * typed, because the production version is a confirm() that a stray Enter
 * dismisses into 1,284 inboxes.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmWord,
  confirmLabel,
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmWord?: string;
  confirmLabel: string;
  tone?: "danger" | "normal";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Same render-phase reset as the command bar: clear the gate when the dialog
  // opens, without an extra render pass showing the previous answer.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTyped("");
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>(
          "button, input, [href]"
        );
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLElement>("input, button")?.focus()
    );
    return () => {
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(t);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const armed = !confirmWord || typed.trim() === confirmWord;

  return (
    <>
      <div className="fn-scrim" onClick={onCancel} aria-hidden="true" />
      <div
        ref={ref}
        className="fn-dialog fn-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fn-confirm-title"
      >
        <h2 id="fn-confirm-title" className="fn-confirm-title">
          {title}
        </h2>
        <div className="fn-confirm-body">{body}</div>

        {confirmWord && (
          <label className="fn-confirm-gate">
            <span className="fn-label">
              Type <b>{confirmWord}</b> to continue
            </span>
            <input
              className="fn-field"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        )}

        <div className="fn-confirm-actions">
          <button type="button" className="fn-btn" data-variant="quiet" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="fn-btn"
            data-variant={tone === "danger" ? "danger" : "primary"}
            disabled={!armed}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

/** A menu for the row actions that must not sit inline next to "Edit". */
export function RowMenu({
  items,
  label,
}: {
  label: string;
  items: {
    label: string;
    onSelect: () => void;
    tone?: "danger";
  }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="fn-rowmenu" ref={ref}>
      <button
        type="button"
        className="fn-rowmenu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div className="fn-rowmenu-list" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              data-tone={item.tone}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
