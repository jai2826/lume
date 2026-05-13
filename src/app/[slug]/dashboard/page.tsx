'use client';

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
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Studio Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Your command center. Studio Slug: {activeStudio?.slug || "Select a studio"}
        </p>

        {/* Placeholder for your actual dashboard metrics/cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 rounded-2xl border border-black/5 bg-card shadow-sm p-6">
             <h3 className="font-semibold text-foreground">Recent Shots</h3>
          </div>
          <div className="h-48 rounded-2xl border border-black/5 bg-card shadow-sm p-6">
             <h3 className="font-semibold text-foreground">Engagement</h3>
          </div>
          <div className="h-48 rounded-2xl border border-black/5 bg-card shadow-sm p-6">
             <h3 className="font-semibold text-foreground">Active Platforms</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardLoadingState() {
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