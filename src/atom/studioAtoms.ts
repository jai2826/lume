// src/atom/studioAtoms.ts
import { atom } from "jotai";

export type ActiveStudio = {
  studioId: string;
  slug: string;
};

// Start with undefined so we know if it hasn't hydrated yet
export const activeStudioAtom = atom<ActiveStudio | null>(null);