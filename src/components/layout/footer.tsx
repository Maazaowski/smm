import { SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-glass-border bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a
            href={`https://linkedin.com/in/${SITE.author.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            LinkedIn
          </a>
          <a
            href={`https://github.com/${SITE.author.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            GitHub
          </a>
          <a
            href={`mailto:${SITE.author.email}`}
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
