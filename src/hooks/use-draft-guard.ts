"use client";

import { useEffect, useRef, useState } from "react";

export type DraftStatus = "clean" | "dirty" | "saving" | "saved" | "error";

/** What the caller reports about the last save attempt. */
type SaveState = "idle" | "saving" | "saved" | "error";

interface Mirror<T> {
  value: T;
  at: number;
}

interface Options<T> {
  /**
   * Stable key for this document. Changing it switches to a different local
   * mirror — use the slug for an existing post, a constant for a new one.
   */
  key: string;
  /** Current editor state. Must be JSON-serializable. */
  value: T;
  /** Whether the document is worth mirroring at all (e.g. editor is open). */
  enabled?: boolean;
  /** Called when ⌘S / Ctrl+S is pressed. */
  onSave?: () => void;
}

interface DraftGuard<T> {
  status: DraftStatus;
  dirty: boolean;
  /**
   * A locally mirrored copy left behind by a previous session that differs
   * from what loaded, or null.
   */
  recovered: Mirror<T> | null;
  /** Stop offering the recovered copy and delete it. */
  dismissRecovered: () => void;
  /** Call after a successful save so the current value becomes the baseline. */
  markSaved: () => void;
  /** Report save progress for the status indicator. */
  setStatus: (status: Exclude<DraftStatus, "clean" | "dirty">) => void;
}

const PREFIX = "admin-draft:";
const MIRROR_DEBOUNCE_MS = 600;

function readMirror<T>(storageKey: string, baseline: string): Mirror<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Mirror<T>;
    // Only worth offering if it differs from what the server just gave us.
    if (JSON.stringify(parsed.value) === baseline) {
      window.localStorage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    clearMirror(storageKey);
    return null;
  }
}

function clearMirror(storageKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    /* nothing to clean up */
  }
}

/** State that only changes when a document is opened, not on every keystroke. */
interface DocState<T> {
  key: string | null;
  enabled: boolean;
  baseline: string;
  recovered: Mirror<T> | null;
}

/**
 * Keeps unsaved editor work alive.
 *
 * The admin editors hold everything in component-local state, so pressing
 * "back", refreshing, or closing the tab used to destroy an in-progress post
 * with no warning and no recovery. This adds the three things that prevent
 * that: a debounced local mirror, a beforeunload guard while dirty, and ⌘S.
 *
 * Deliberately local-only. Server-side autosave needs a real draft record and
 * a slug lifecycle; this removes the data-loss risk without that redesign.
 */
export function useDraftGuard<T>({
  key,
  value,
  enabled = true,
  onSave,
}: Options<T>): DraftGuard<T> {
  const storageKey = PREFIX + key;
  const serialized = JSON.stringify(value);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [doc, setDoc] = useState<DocState<T>>({
    key: null,
    enabled: false,
    baseline: serialized,
    recovered: null,
  });

  // Opening a document — a different key, or the same editor reopened — resets
  // the baseline and re-reads any mirror. This is the documented pattern for
  // adjusting state during render; the guard keeps it to once per open.
  if (doc.key !== key || (enabled && !doc.enabled)) {
    setDoc({
      key,
      enabled,
      baseline: serialized,
      recovered: enabled ? readMirror<T>(storageKey, serialized) : null,
    });
    setSaveState("idle");
  } else if (doc.enabled !== enabled) {
    setDoc({ ...doc, enabled });
  }

  const dirty = enabled && serialized !== doc.baseline;

  const status: DraftStatus =
    saveState === "saving"
      ? "saving"
      : saveState === "error"
        ? "error"
        : dirty
          ? "dirty"
          : saveState === "saved"
            ? "saved"
            : "clean";

  // Keep onSave out of the keydown effect's deps so the listener is not
  // re-registered on every keystroke.
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // --- Mirror to localStorage, debounced ------------------------------------
  useEffect(() => {
    if (!enabled || !dirty) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ value: JSON.parse(serialized), at: Date.now() })
        );
      } catch {
        // Quota or private mode — the beforeunload guard still applies.
      }
    }, MIRROR_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [serialized, dirty, enabled, storageKey]);

  // --- Warn before leaving with unsaved work --------------------------------
  useEffect(() => {
    if (!enabled || !dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Browsers show their own copy; the value only needs to be set.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, enabled]);

  // --- ⌘S / Ctrl+S ----------------------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSaveRef.current?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);

  function markSaved() {
    setDoc((d) => ({
      ...d,
      baseline: JSON.stringify(value),
      recovered: null,
    }));
    setSaveState("saved");
    clearMirror(storageKey);
  }

  function dismissRecovered() {
    setDoc((d) => ({ ...d, recovered: null }));
    clearMirror(storageKey);
  }

  function setStatus(next: Exclude<DraftStatus, "clean" | "dirty">) {
    setSaveState(next);
  }

  return {
    status,
    dirty,
    recovered: doc.recovered,
    dismissRecovered,
    markSaved,
    setStatus,
  };
}
