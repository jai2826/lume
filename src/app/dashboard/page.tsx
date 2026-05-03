import { Suspense } from "react";

import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";

function DashboardFallback() {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-12 sm:px-8 xl:py-14">
      <div className="h-48 w-full max-w-2xl animate-pulse rounded-2xl border border-muted-foreground/15 bg-muted/10" />
      <div className="mt-10 grid animate-pulse grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-96 rounded-2xl border border-muted-foreground/10 bg-muted/10" />
        <div className="h-96 rounded-2xl border border-muted-foreground/10 bg-muted/10" />
        <div className="h-96 rounded-2xl border border-muted-foreground/10 bg-muted/10 lg:col-span-2" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardWorkspace />
    </Suspense>
  );
}
