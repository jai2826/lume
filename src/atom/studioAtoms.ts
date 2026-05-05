import { atomWithStorage } from "jotai/utils";

// This atom automatically syncs with localStorage under the key "active-studio-id"
export const activeStudioIdAtom = atomWithStorage<string | null>(
  "active-studio-id",
  null
);