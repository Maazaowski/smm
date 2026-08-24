import { ProjectCardSkeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <div className="mb-12 max-w-2xl">
        <div className="h-12 w-48 rounded-lg animate-shimmer mb-4" aria-hidden />
        <div className="h-5 w-full rounded-lg animate-shimmer" aria-hidden />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
