import { atomWithStorage, createJSONStorage } from "jotai/utils";

import type { PlatformKey } from "@/lib/types";
import type { Doc } from "../../convex/_generated/dataModel";

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const memoryStorage: StorageLike = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const storage = createJSONStorage<StorageLike>(() =>
  typeof window === "undefined" ? memoryStorage : window.localStorage,
);

export type StudioSnapshot = Pick<
  Doc<"studios">,
  "_id" | "name" | "slug"
> & {
  ownerId?: string;
};

export type LinkedAccountSnapshot = {
  _id: string;
  accountName: string;
};

export type LinkedAccountsSnapshot = Record<
  PlatformKey,
  LinkedAccountSnapshot[]
>;

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

export const studiosCacheAtom = atomWithStorage<StudiosCacheState>(
  "lume.cachedStudios",
  {
    data: [],
    updatedAt: 0,
  },
  storage,
);

export const linkedAccountsCacheAtom = atomWithStorage<LinkedAccountsCacheState>(
  "lume.cachedLinkedAccounts",
  {},
  storage,
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
