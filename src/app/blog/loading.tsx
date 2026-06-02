import { PostCardSkeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12">
        <div className="h-12 w-32 rounded-lg animate-shimmer mb-4" />
        <div className="h-5 w-64 rounded-lg animate-shimmer" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
