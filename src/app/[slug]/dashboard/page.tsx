"use client";

import { activeStudioAtom } from "@/atom/studioAtoms";
import { Skeleton } from "@/components/ui/skeleton";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const activeStudio = useAtomValue(activeStudioAtom);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="p-12">
      {/* <DevTools /> */}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tight">
          Studio Dashboard
        </h1>
        <p className="text-lg text-muted-foreground mt-3">
          Your command center. Studio Slug:{" "}
          {activeStudio?.slug || "Select a studio"}
        </p>

        {/* Placeholder for your actual dashboard metrics/cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-64 rounded-2xl border border-black/5 bg-card shadow-sm p-8">
            <h3 className="text-xl font-semibold text-foreground">
              Recent Shots
            </h3>
          </div>
          <div className="h-64 rounded-2xl border border-black/5 bg-card shadow-sm p-8">
            <h3 className="text-xl font-semibold text-foreground">
              Engagement
            </h3>
          </div>
          <div className="h-64 rounded-2xl border border-black/5 bg-card shadow-sm p-8">
            <h3 className="text-xl font-semibold text-foreground">
              Active Platforms
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="p-12">
      <div className="mx-auto max-w-6xl space-y-12">
        <div>
          <Skeleton className="h-14 w-80 rounded-xl" />
          <Skeleton className="mt-4 h-6 w-96 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl border border-black/5 bg-card shadow-sm" />
          <Skeleton className="h-64 rounded-2xl border border-black/5 bg-card shadow-sm" />
          <Skeleton className="h-64 rounded-2xl border border-black/5 bg-card shadow-sm" />
        </div>
      </div>
    </div>
  );
}
