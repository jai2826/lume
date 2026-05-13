"use client";

import { useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import {
  ChevronDown,
  CirclePlusIcon,
  Loader2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [hydrated, setHydrated] = useState(false);

  const studios = useQuery(api.studios.getMyStudios);
  const activeStudio = useAtomValue(activeStudioAtom);
  const { selectStudio } = useStudioNavigation();

  // Hydration guard to prevent SSR mismatch
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Graceful loading state (No aggressive flicker redirects)
  if (!hydrated || studios === undefined) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="w-48 justify-between border-black/5 shadow-sm hover:bg-accent transition-all px-4 py-5">
        <span className="truncate text-muted-foreground text-base">
          Loading...
        </span>
        <Loader2Icon className="ml-3 h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
      </Button>
    );
  }

  const studioList = studios ?? [];
  const currentStudio = studioList.find(
    (s) => s.slug === activeStudio?.slug,
  );

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={isNavigating}
            className="w-48 justify-between border-black/5 shadow-sm hover:bg-accent transition-all px-4 py-5"
          />
        }>
        <span className="truncate font-medium text-base">
          {currentStudio?.name || "Select Studio"}
        </span>
        {isNavigating ? (
          <Loader2Icon className="ml-3 h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown
            className={cn(
              "ml-3 h-5 w-5 shrink-0 transition-transform text-muted-foreground",
              isOpen && "rotate-180",
            )}
          />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[240px] border-black/5 shadow-soft rounded-xl p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex w-full items-center justify-between text-base tracking-wide text-muted-foreground px-3 py-2">
            <span className="font-medium">Studios</span>
            <Button
              onClick={() => router.push("/joinstudio")}
              className="h-8 w-8 rounded-full hover:bg-brand-50 hover:text-brand"
              variant="ghost"
              size="icon">
              <CirclePlusIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuLabel>

          <DropdownMenuRadioGroup
            value={activeStudio?.studioId ?? ""}
            onValueChange={async (studioId) => {
              setIsOpen(false);
              const selectedStudio = studioList.find(
                (s) => s._id === studioId,
              );

              if (selectedStudio) {
                setIsNavigating(true);
                try {
                  await selectStudio(
                    selectedStudio._id,
                    selectedStudio.slug,
                  );
                } finally {
                  setIsNavigating(false);
                }
              }
            }}>
            {studioList.map((studio) => (
              <DropdownMenuRadioItem
                value={studio._id}
                key={studio._id}
                className="flex items-center justify-between gap-3 rounded-lg cursor-pointer hover:bg-accent px-3 py-3 transition-colors text-base">
                <span className="truncate">
                  {studio.name}
                </span>
                {/* {studio._id === activeStudio?.studioId && (
                  <CheckIcon className="h-5 w-5 shrink-0 text-brand" />
                )} */}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
