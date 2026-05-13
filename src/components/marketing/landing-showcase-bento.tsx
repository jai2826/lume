"use client";

import { cn } from "@/lib/utils";

/**
 * Lightweight placeholder for the Landing Showcase Bento.
 * The full implementation requires platform shot components;
 * this placeholder renders safe mock panels with scaled sizes.
 */
export function LandingShowcaseBento() {
  return (
    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-8")}>
      <div className="md:col-span-2 lg:col-span-7 rounded-2xl bg-card p-6 shadow-soft">
        <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">X · thread + media</div>
        <div className="mt-4 flex items-center justify-center h-64 rounded-lg bg-muted/30">Twitter mock preview</div>
      </div>

      <div className="md:col-span-1 lg:col-span-5 rounded-2xl bg-card p-6 shadow-feather">
        <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Feed · carousel</div>
        <div className="mt-4 flex items-center justify-center h-56 rounded-lg bg-muted/30">Instagram mock preview</div>
      </div>

      <div className="lg:col-span-6 rounded-2xl bg-card p-6 shadow-feather">
        <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shorts · spine</div>
        <div className="mt-4 flex items-center justify-start h-64 rounded-lg bg-muted/30">YouTube mock preview</div>
      </div>

      <div className="lg:col-span-6 rounded-2xl bg-card p-6 shadow-feather">
        <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">TikTok · vertical</div>
        <div className="mt-4 flex items-center justify-center h-64 rounded-lg bg-muted/30">TikTok mock preview</div>
      </div>
    </div>
  );
}
