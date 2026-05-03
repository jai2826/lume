"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

export function ConvexPing() {
  const ping = useQuery(api.hello.ping);

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-6 py-4 text-card-foreground">
      <p className="text-sm text-muted-foreground">Convex</p>
      <p className="text-base font-medium tabular-nums">
        {ping === undefined ? "Loading…" : ping.message}
      </p>
      <Button type="button" variant="secondary" size="sm" disabled>
        shadcn Button
      </Button>
    </div>
  );
}
