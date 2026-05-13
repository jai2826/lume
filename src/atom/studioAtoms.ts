import { atomWithStorage } from "jotai/utils";

// This atom automatically syncs with localStorage under the key "active-studio-slug"
export const activeStudioAtom = atomWithStorage<{
  studioId: string;
  slug: string;
} | null>("active-studio-slug", null);
