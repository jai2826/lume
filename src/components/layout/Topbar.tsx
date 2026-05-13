"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Command, Plus, Search } from "lucide-react";
import {
    useParams,
    usePathname,
    useRouter,
} from "next/navigation";
import { ReactNode } from "react";

interface TopBarProps {
  right?: ReactNode; // Optional extra actions to pass in from specific pages
}

export default function TopBar({ right }: TopBarProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // Safely cast the slug from params
  const slug = params?.slug as string;

  // Generate breadcrumbs from the URL path
  const crumbs = pathname?.split("/").filter(Boolean) || [];
  // console.log(crumbs);
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-6 px-12 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <span
                key={index}
                className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "capitalize",
                    isLast && "text-foreground font-medium",
                  )}>
                  {crumb.replace(/-/g, " ")}
                </span>
                {!isLast && (
                  <span className="text-muted-foreground/40">
                    /
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-4">
          {/* Global Search Trigger (Prepped for Command Palette) */}
          <button
            className="relative hidden md:flex items-center h-11 w-80 rounded-full border border-black/5 bg-card px-4 text-base text-muted-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30 shadow-sm"
            onClick={() =>
              console.log("TODO: Open Command Palette")
            }>
            <Search className="mr-3 h-5 w-5" />
            <span className="flex-1 text-left">
              Search everything...
            </span>
            <kbd className="pointer-events-none flex h-6 items-center gap-1.5 rounded bg-muted px-2 text-xs font-medium text-muted-foreground">
              <Command className="h-4 w-4" />K
            </kbd>
          </button>

          {/* Any extra page-specific actions passed as props */}
          {right}

          {/* Primary Action */}
          <Button
            onClick={() => router.push(`/${slug}/composer`)}
            className="h-11 rounded-full bg-brand px-6 text-base text-white hover:bg-brand/90 shadow-glow transition-all">
            <Plus className="mr-2 h-5 w-5" /> New Shot
          </Button>
        </div>
      </div>
    </header>
  );
}
