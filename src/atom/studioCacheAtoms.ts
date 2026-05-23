import { atomWithStorage, createJSONStorage } from "jotai/utils";

import type { PlatformKey } from "@/lib/types";
import type { Doc } from "../../convex/_generated/dataModel";

// SSR-safe localStorage wrapper
const getLocalStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return window.localStorage;
};

export type StudioSnapshot = Pick<Doc<"studios">, "_id" | "name" | "slug"> & {
  ownerId?: string;
};

export type LinkedAccountSnapshot = {
  _id: string;
  accountName: string;
};

export type LinkedAccountsSnapshot = Record<PlatformKey, LinkedAccountSnapshot[]>;

export type StudiosCacheState = {
  data: StudioSnapshot[];
  updatedAt: number;
};

export type LinkedAccountsCacheState = Record<
  string,
  {
    data: LinkedAccountsSnapshot;
    updatedAt: number;
  }
>;

export const CACHE_TTL_MS = 5 * 60 * 1000;

export const EMPTY_LINKED_ACCOUNTS: LinkedAccountsSnapshot = {
  instagram: [],
  youtube: [],
  x: [],
  tiktok: [],
  snapchat: [],
};

// One typed storage instance per atom type — avoids the shared generic conflict
const studiosStorage = createJSONStorage<StudiosCacheState>(getLocalStorage);
const linkedAccountsStorage = createJSONStorage<LinkedAccountsCacheState>(getLocalStorage);

export const studiosCacheAtom = atomWithStorage<StudiosCacheState>(
  "lume.cachedStudios",
  { data: [], updatedAt: 0 },
  studiosStorage,
);

export const linkedAccountsCacheAtom = atomWithStorage<LinkedAccountsCacheState>(
  "lume.cachedLinkedAccounts",
  {},
  linkedAccountsStorage,
);

export function normalizeLinkedAccounts(
  accounts?: Partial<LinkedAccountsSnapshot> | null,
): LinkedAccountsSnapshot {
  return {
    instagram: accounts?.instagram ?? [],
    youtube: accounts?.youtube ?? [],
    x: accounts?.x ?? [],
    tiktok: accounts?.tiktok ?? [],
    snapchat: accounts?.snapchat ?? [],
  };
}