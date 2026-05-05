"use client"

import { activeStudioIdAtom } from "@/atom/studioAtoms"
import { Button } from "@/components/ui/button"

import { useStudioNavigation } from "@/hooks/useStudioNavigation"
import { cn } from "@/lib/utils"
import { useQuery } from "convex/react"
import { useAtomValue } from "jotai"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"

export function StudioSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const studios = useQuery(api.studios.getMyStudios)
  const activeStudioId = useAtomValue(activeStudioIdAtom)
  const { useSelectStudio } = useStudioNavigation()

  const currentStudio = studios?.find((studio) => studio._id === activeStudioId)

  const handleSelectStudio = (studioId: string, slug: string) => {
    useSelectStudio(studioId, slug)
    setIsOpen(false)
  }

  if (!studios || studios.length === 0) {
    return null
  }

  // Only show dropdown if there's more than one studio
  if (studios.length === 1) {
    return (
      <Button variant="outline" size="sm" disabled>
        {studios[0].name}
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="truncate">
          {currentStudio?.name || "Select Studio"}
        </span>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
            {studios.map((studio) => (
              <button
                key={studio._id}
                onClick={() => handleSelectStudio(studio._id, studio.slug)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  studio._id === activeStudioId &&
                    "bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{studio.name}</span>
                  {studio._id === activeStudioId && (
                    <span className="text-xs opacity-70">✓</span>
                  )}
                </div>
                <span className="text-xs opacity-60">{studio.role}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
