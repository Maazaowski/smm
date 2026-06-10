import { SITE } from "@/lib/constants";
import { NewsletterForm } from "@/components/blog/newsletter-form";

export function Footer() {
  return (
    <footer className="border-t border-glass-border bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Get new posts in your inbox
          </p>
          <p className="text-sm text-muted">
            Software, AI agents, and what I learn building them.
          </p>
        </div>
        <NewsletterForm framed={false} className="w-full sm:max-w-sm" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-glass-border px-6 py-8 sm:flex-row">
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
