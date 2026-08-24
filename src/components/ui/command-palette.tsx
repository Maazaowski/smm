"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command } from "cmdk";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import type { Post } from "@/lib/types";

interface CommandPaletteProps {
  posts: { slug: string; title: string; description: string; tags: string[] }[];
  projects: { slug: string; title: string; description: string }[];
}

export function CommandPalette({ posts, projects }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: ["title", "description", "tags"],
        threshold: 0.4,
      }),
    [posts]
  );

  const results = search
    ? fuse.search(search).map((r) => r.item)
    : posts.slice(0, 5);

  const projectFuse = useMemo(
    () =>
      new Fuse(projects, {
        keys: ["title", "description"],
        threshold: 0.4,
      }),
    [projects]
  );

  const projectResults = search
    ? projectFuse.search(search).map((r) => r.item)
    : projects.slice(0, 3);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = (path: string) => {
    setOpen(false);
    setSearch("");
    router.push(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-overlay backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[20%] left-1/2 z-[101] w-full max-w-lg -translate-x-1/2"
          >
            <Command
              className="rounded-2xl border border-glass-border bg-surface-1 shadow-[0_16px_64px_oklch(0_0_0/0.15)] dark:shadow-[0_16px_64px_oklch(0_0_0/0.5)] overflow-hidden"
              shouldFilter={false}
            >
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search posts, navigate, or run actions..."
                className="w-full border-b border-glass-border bg-transparent px-5 py-4 text-sm text-primary placeholder:text-muted outline-none"
              />

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-muted">
                  No results found.
                </Command.Empty>

                {/* Posts */}
                <Command.Group
                  heading="Posts"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                >
                  {results.map((post) => (
                    <Command.Item
                      key={post.slug}
                      value={post.title}
                      onSelect={() => navigate(`/blog/${post.slug}`)}
                      className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-surface-2"
                    >
                      <span className="text-primary font-medium">
                        {post.title}
                      </span>
                      <span className="text-xs text-muted line-clamp-1">
                        {post.description}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Projects */}
                {projectResults.length > 0 && (
                  <Command.Group
                    heading="Projects"
                    className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {projectResults.map((project) => (
                      <Command.Item
                        key={project.slug}
                        value={`project-${project.title}`}
                        onSelect={() => navigate(`/projects/${project.slug}`)}
                        className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-surface-2"
                      >
                        <span className="text-primary font-medium">
                          {project.title}
                        </span>
                        <span className="text-xs text-muted line-clamp-1">
                          {project.description}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Navigation */}
                <Command.Group
                  heading="Navigation"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                >
                  {[
                    { label: "Home", path: "/" },
                    { label: "Blog", path: "/blog" },
                    { label: "Projects", path: "/projects" },
                    { label: "About", path: "/about" },
                  ].map((item) => (
                    <Command.Item
                      key={item.path}
                      value={item.label}
                      onSelect={() => navigate(item.path)}
                      className="rounded-lg px-3 py-2 text-sm text-secondary cursor-pointer aria-selected:bg-surface-2 aria-selected:text-primary"
                    >
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Actions */}
                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                >
                  <Command.Item
                    value="Toggle theme"
                    onSelect={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                      setOpen(false);
                    }}
                    className="rounded-lg px-3 py-2 text-sm text-secondary cursor-pointer aria-selected:bg-surface-2 aria-selected:text-primary"
                  >
                    Toggle Theme
                  </Command.Item>
                  <Command.Item
                    value="RSS Feed"
                    onSelect={() => navigate("/rss.xml")}
                    className="rounded-lg px-3 py-2 text-sm text-secondary cursor-pointer aria-selected:bg-surface-2 aria-selected:text-primary"
                  >
                    RSS Feed
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="border-t border-glass-border px-4 py-2.5 text-xs text-muted flex items-center gap-4">
                <span>
                  <kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">
                    ↑↓
                  </kbd>{" "}
                  Navigate
                </span>
                <span>
                  <kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">
                    ↵
                  </kbd>{" "}
                  Select
                </span>
                <span>
                  <kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">
                    esc
                  </kbd>{" "}
                  Close
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
