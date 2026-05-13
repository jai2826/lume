import { Skeleton } from "@/components/ui/skeleton";

export default function SetupLoading() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(250,10,97,0.12),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(250,10,97,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,1)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-35"
      />

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-soft backdrop-blur-md">
          <div className="border-b border-border/70 px-6 py-6 sm:px-8">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="mt-4 h-10 w-3/4 rounded-xl sm:h-12" />
            <Skeleton className="mt-3 h-5 w-full rounded-xl" />
            <Skeleton className="mt-2 h-5 w-4/5 rounded-xl" />
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="mb-8 flex gap-4 border-b border-border/70 pb-2">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>

            <div className="space-y-5">
              <div>
                <Skeleton className="mb-2 h-4 w-24 rounded-full" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>

              <div>
                <Skeleton className="mb-2 h-4 w-28 rounded-full" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>

              <Skeleton className="mt-4 h-11 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}