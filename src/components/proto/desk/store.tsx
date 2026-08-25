"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ProtoEssay, Subject } from "@/lib/proto-data";

/**
 * In-memory state for the admin prototype.
 *
 * The Desk is a design artefact on an unauthenticated route, so it never writes
 * to the database. Every action here mutates local state and returns a
 * realistic latency, which is what a prototype needs anyway: the point is to
 * evaluate the workflow, not the persistence.
 */

export type DeskStatus = "live" | "draft" | "scheduled";

export interface DeskEssay {
  id: string;
  slug: string;
  title: string;
  dek: string;
  subject: Subject;
  status: DeskStatus;
  date: string;
  minutes: number;
  words: number;
  views: number;
  body: string;
  emailedAt: string | null;
  updatedAt: number;
}

export interface Toast {
  id: number;
  tone: "ok" | "warn" | "bad";
  message: string;
  undo?: () => void;
}

interface DeskState {
  essays: DeskEssay[];
  toasts: Toast[];
  update: (id: string, patch: Partial<DeskEssay>) => void;
  create: () => DeskEssay;
  remove: (id: string) => void;
  publish: (id: string) => void;
  unpublish: (id: string) => void;
  notify: (id: string) => void;
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
  subscribers: number;
}

const DeskContext = createContext<DeskState | null>(null);

export function useDesk() {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("useDesk must be used inside DeskProvider");
  return ctx;
}

/** Deterministic pseudo view counts, so the prototype is not a wall of zeros. */
function seedViews(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return 180 + (h % 2400);
}

export function DeskProvider({
  seed,
  children,
}: {
  seed: (ProtoEssay & { subject: Subject })[];
  children: React.ReactNode;
}) {
  const [essays, setEssays] = useState<DeskEssay[]>(() =>
    seed.map((e, i) => ({
      id: e.slug,
      slug: e.slug,
      title: e.title,
      dek: e.dek,
      subject: e.subject,
      status: "live" as DeskStatus,
      date: e.date,
      minutes: e.minutes,
      words: e.words,
      views: seedViews(e.slug),
      body: e.body,
      emailedAt: i > 1 ? e.date : null,
      updatedAt: Date.now() - i * 86_400_000,
    }))
  );
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    // Toasts with an undo stay longer, because undo is the whole point.
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, t.undo ? 8000 : 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const update = useCallback((id: string, patch: Partial<DeskEssay>) => {
    setEssays((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e
      )
    );
  }, []);

  const create = useCallback((): DeskEssay => {
    const draft: DeskEssay = {
      id: `draft-${Date.now()}`,
      slug: "",
      title: "",
      dek: "",
      subject: "Architecture",
      // Drafts by default. Production defaults new posts to published, which is
      // how an unfinished piece reaches the internet by accident.
      status: "draft",
      date: new Date().toISOString().slice(0, 10),
      minutes: 0,
      words: 0,
      views: 0,
      body: "",
      emailedAt: null,
      updatedAt: Date.now(),
    };
    setEssays((prev) => [draft, ...prev]);
    return draft;
  }, []);

  const remove = useCallback(
    (id: string) => {
      // The toast is raised outside the state updater. Calling it inside would
      // be a side effect in a reducer, which React invokes twice in StrictMode
      // — two toasts for one delete, and two undo handlers racing each other.
      const gone = essays.find((e) => e.id === id);
      if (!gone) return;

      setEssays((prev) => prev.filter((e) => e.id !== id));

      // Deletion is reversible for as long as the toast is on screen. That is
      // a better guard than a confirm() dialog: it does not interrupt, and it
      // is the only one of the two that actually gets the work back.
      toast({
        tone: "warn",
        message: `Deleted “${gone.title || "Untitled"}”.`,
        undo: () =>
          setEssays((cur) =>
            cur.some((e) => e.id === id) ? cur : [gone, ...cur]
          ),
      });
    },
    [essays, toast]
  );

  const publish = useCallback(
    (id: string) => {
      update(id, { status: "live" });
      toast({ tone: "ok", message: "Published. Live on the site now." });
    },
    [update, toast]
  );

  const unpublish = useCallback(
    (id: string) => {
      update(id, { status: "draft" });
      toast({ tone: "warn", message: "Unpublished. Removed from the site and the feed." });
    },
    [update, toast]
  );

  const notify = useCallback(
    (id: string) => {
      update(id, { emailedAt: new Date().toISOString().slice(0, 10) });
      toast({ tone: "ok", message: "Queued for 1,284 subscribers. Sending in 60s." });
    },
    [update, toast]
  );

  const value = useMemo<DeskState>(
    () => ({
      essays,
      toasts,
      update,
      create,
      remove,
      publish,
      unpublish,
      notify,
      toast,
      dismiss,
      subscribers: 1284,
    }),
    [essays, toasts, update, create, remove, publish, unpublish, notify, toast, dismiss]
  );

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}
