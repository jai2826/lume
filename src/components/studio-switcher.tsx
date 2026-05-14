"use client";

import { useQuery } from "convex/react";
import { useAtom } from "jotai";
import {
  ChevronDown,
  CirclePlusIcon,
  Loader2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { activeStudioAtom } from "@/atom/studioAtoms";
import { Button } from "@/components/ui/button";
import { useStudioNavigation } from "@/hooks/useStudioNavigation";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StudioSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // 1. Fetch from Convex and Jotai
  const studios = useQuery(api.studios.getMyStudios);
  const [activeStudio] = useAtom(activeStudioAtom); // We only need to read it here
  const { selectStudio } = useStudioNavigation();

  // 2. Graceful loading state based strictly on Convex fetching
  if (studios === undefined) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="w-full max-w-48 justify-between border-black/5 shadow-sm hover:bg-accent transition-all px-4 py-5"
      >
        <span className="truncate text-muted-foreground text-base">
          Loading...
        </span>
        <Loader2Icon className="ml-3 h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
      </Button>
    );
  }

  const studioList = studios ?? [];

  // 3. Look up the full studio object safely without URL hacks
  const currentStudio = studioList.find(
    (s) => s._id === activeStudio?.studioId
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={isNavigating}
            className="w-full max-w-48 justify-between border-black/5 shadow-sm hover:bg-accent transition-all px-4 py-5"
          >
            <span className="truncate font-medium text-base">
              {/* Fallback chain: Convex Name -> Jotai Slug -> Default */}
              {currentStudio?.name || activeStudio?.slug || "Select Studio"}
            </span>
            {isNavigating ? (
              <Loader2Icon className="shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown
                className={cn(
                  "shrink-0 transition-transform text-muted-foreground",
                  isOpen && "rotate-180"
                )}
              />
            )}
          </Button>
        }
      />

      <DropdownMenuContent
        side="inline-end"
        className="w-full border-black/5 shadow-soft rounded-xl px-2 py-2"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex gap-2 items-center justify-between text-base tracking-wide text-muted-foreground py-2">
            <span className="font-medium">Studios</span>
            <Button
              onClick={() => router.push("/joinstudio")}
              className="rounded-full hover:bg-brand-50 hover:text-brand"
              variant="outline"
              size="icon"
              nativeButton={false}
              render={<CirclePlusIcon className="h-5 w-5" />}
            />
          </DropdownMenuLabel>

          <DropdownMenuRadioGroup
            value={activeStudio?.studioId ?? ""}
            onValueChange={async (studioId) => {
              setIsOpen(false);
              const selectedStudio = studioList.find((s) => s._id === studioId);

              if (selectedStudio) {
                setIsNavigating(true);
                try {
                  // Relies on the bulletproof hook we just built
                  await selectStudio(selectedStudio._id, selectedStudio.slug);
                } finally {
                  setIsNavigating(false);
                }
              }
            }}
            className="w-full max-w-80"
          >
            {studioList.map((studio) => (
              <DropdownMenuRadioItem
                value={studio._id}
                key={studio._id}
                className="flex group/switcher w-full items-center justify-between gap-3 rounded-lg cursor-pointer hover:bg-accent pl-2 pr-10 py-3 transition-colors text-base"
              >
                <span
                  className={cn(
                    "truncate",
                    studio._id === activeStudio?.studioId
                      ? "font-semibold"
                      : "font-normal group-hover/switcher:!text-brand"
                  )}
                >
                  {studio.name}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}