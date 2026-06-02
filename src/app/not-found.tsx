import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
      <h1 className="font-display text-8xl text-primary mb-4">404</h1>
      <p className="text-lg text-secondary mb-8">
        This page doesn&apos;t exist. Maybe it was a draft that never shipped.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-accent-blue px-6 py-3 text-sm font-medium text-white hover:bg-accent-purple transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
