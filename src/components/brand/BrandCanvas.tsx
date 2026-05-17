// src/components/layout/BrandCanvas.tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BrandCanvasProps {
  children: ReactNode;
  className?: string;
}

export function BrandCanvas({
  children,
  className,
}: BrandCanvasProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-background",
        className,
      )}>
      {/* Layer 1: The Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_12%_8%,rgba(250,10,97,0.12),transparent_35%),radial-gradient(circle_at_88%_22%,rgba(250,10,97,0.08),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,1)_100%)]"
      />

      {/* Layer 2: The Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-grid opacity-35"
      />

      {/* Layer 3: Your Content */}
      <main className="relative z-10 flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
