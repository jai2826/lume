import { Skeleton } from "@/components/ui/skeleton";

export default function StudioLoading() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Skeleton className="h-10 w-72 rounded-xl" />
          <Skeleton className="mt-3 h-5 w-96 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl border border-black/5 bg-card shadow-sm" />
          <Skeleton className="h-48 rounded-2xl border border-black/5 bg-card shadow-sm" />
          <Skeleton className="h-48 rounded-2xl border border-black/5 bg-card shadow-sm" />
        </div>
      </div>
    </div>
  );
}