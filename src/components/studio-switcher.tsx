"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import {
  CheckIcon,
  ChevronDown,
  CirclePlusIcon,
  Loader2Icon,
} from "lucide-react";

import { activeStudioAtom } from "@/atom/studioAtoms";
import { useStudioNavigation } from "@/hooks/useStudioNavigation";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
      <Button variant="outline" size="sm" disabled className="w-40 justify-between border-black/5 bg-background">
        <span className="truncate text-muted-foreground">Loading...</span>
        <Loader2Icon className="ml-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
      </Button>
    );
  }

  const studioList = studios ?? [];
  const currentStudio = studioList.find((s) => s.slug === activeStudio?.slug);

  return (
    <Menu.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* Base UI uses the 'render' prop perfectly here */}
      <Menu.Trigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={isNavigating}
            className="w-40 justify-between border-black/5 shadow-sm hover:bg-accent transition-all"
          />
        }
      >
        <span className="truncate font-medium">
          {currentStudio?.name || "Select Studio"}
        </span>
        {isNavigating ? (
          <Loader2Icon className="ml-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 transition-transform text-muted-foreground",
              isOpen && "rotate-180"
            )}
          />
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="start" sideOffset={8}>
          <Menu.Popup className="z-50 min-w-[200px] outline-none rounded-xl border border-black/5 bg-popover p-1 text-popover-foreground shadow-soft data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            
            <div className="flex w-full items-center justify-between text-xs tracking-wider text-muted-foreground px-2 py-1.5">
              <span>WORKSPACES</span>
              <Button
                onClick={() => router.push("/joinstudio")}
                className="h-6 w-6 rounded-full hover:bg-brand-50 hover:text-brand"
                variant="ghost"
                size="icon"
              >
                <CirclePlusIcon className="h-4 w-4" />
              </Button>
            </div>

            <Menu.RadioGroup
              value={activeStudio?.studioId ?? ""}
              onValueChange={async (studioId) => {
                // Base UI provides the value as a string/number directly
                const id = studioId as string; 
                setIsOpen(false);
                const selectedStudio = studioList.find((s) => s._id === id);

                if (selectedStudio) {
                  setIsNavigating(true);
                  try {
                    await selectStudio(selectedStudio._id, selectedStudio.slug);
                  } finally {
                    setIsNavigating(false);
                  }
                }
              }}
            >
              {studioList.map((studio) => (
                <Menu.RadioItem
                  value={studio._id}
                  key={studio._id}
                  className="relative flex cursor-pointer select-none items-center justify-between rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="truncate">{studio.name}</span>
                  <Menu.ItemIndicator className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <CheckIcon className="h-4 w-4 text-brand" />
                  </Menu.ItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
            
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}