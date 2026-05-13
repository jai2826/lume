import { atom } from "jotai";

/**
 * Global loading state for coordinating page-level loading indicators
 * Use this when multiple features need synchronized loading feedback
 */
export const globalLoadingAtom = atom(false);
