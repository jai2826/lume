// src/components/providers/StudioProvider.tsx
"use client";

import { useHydrateAtoms } from "jotai/utils";
import { activeStudioAtom, ActiveStudio } from "@/atom/studioAtoms";
import { ReactNode } from "react";

interface StudioProviderProps {
  initialStudio: ActiveStudio | null;
  children: ReactNode;
}

export function StudioProvider({ initialStudio, children }: StudioProviderProps) {
  // 1. Hydrate the atom with the server's data on initial load
  useHydrateAtoms(new Map([[activeStudioAtom, initialStudio]]));

  // 2. Render the rest of the application
  return <>{children}</>;
}