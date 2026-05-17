"use client";

import { useQuery } from "convex/react";
import { useAtom } from "jotai";
import { useEffect, useCallback, useMemo } from "react";

import {
    CACHE_TTL_MS,
    EMPTY_LINKED_ACCOUNTS,
    linkedAccountsCacheAtom,
    normalizeLinkedAccounts,
    studiosCacheAtom,
    type LinkedAccountsSnapshot,
    type StudioSnapshot,
} from "@/atom/studioCacheAtoms";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

function mapStudioSnapshot(studio: {
  _id: string;
  name: string;
  slug: string;
  ownerId?: string;
}): StudioSnapshot {
  return {
    _id: studio._id,
    name: studio.name,
    slug: studio.slug,
    ownerId: studio.ownerId,
  };
}

function isFresh(updatedAt: number) {
  return updatedAt > 0 && Date.now() - updatedAt < CACHE_TTL_MS;
}

export function useCachedStudios() {
  const [cache, setCache] = useAtom(studiosCacheAtom);
  const liveStudios = useQuery(api.studios.getMyStudios);

  useEffect(() => {
    if (!liveStudios) return;

    setCache({
      data: liveStudios.map(mapStudioSnapshot),
      updatedAt: Date.now(),
    });
  }, [liveStudios, setCache]);

  const studios = liveStudios?.map(mapStudioSnapshot) ?? cache.data;

  return {
    studios,
    isLoading: liveStudios === undefined && cache.data.length === 0,
    isFresh: isFresh(cache.updatedAt),
  };
}

export function useCachedStudioLinkedAccounts(studioId?: string | null) {
  const [cache, setCache] = useAtom(linkedAccountsCacheAtom);
  const cachedEntry = studioId ? cache[studioId] : undefined;
  const liveAccounts = useQuery(
    api.auth.getStudioLinkedAccounts,
    studioId ? { studioId: studioId as Id<"studios"> } : "skip",
  );

  useEffect(() => {
    if (!studioId || !liveAccounts) return;

    setCache((current) => ({
      ...current,
      [studioId]: {
        data: normalizeLinkedAccounts(liveAccounts),
        updatedAt: Date.now(),
      },
    }));
  }, [studioId, liveAccounts, setCache]);

  const accounts = liveAccounts
    ? normalizeLinkedAccounts(liveAccounts)
    : cachedEntry?.data ?? EMPTY_LINKED_ACCOUNTS;

  return {
    accounts,
    isLoading:
      Boolean(studioId) && liveAccounts === undefined && !cachedEntry,
    isFresh: cachedEntry ? isFresh(cachedEntry.updatedAt) : false,
  };
}

export function useStudioCacheActions() {
  const [, setStudiosCache] = useAtom(studiosCacheAtom);
  const [, setLinkedAccountsCache] = useAtom(linkedAccountsCacheAtom);

  const replaceStudios = useCallback((studios: StudioSnapshot[]) => {
    setStudiosCache({ data: studios, updatedAt: Date.now() });
  }, [setStudiosCache]);

  const upsertStudio = useCallback((studio: StudioSnapshot) => {
    setStudiosCache((current) => {
      const next = current.data.filter((item) => item._id !== studio._id);
      return {
        data: [studio, ...next],
        updatedAt: Date.now(),
      };
    });
  }, [setStudiosCache]);

  const removeStudio = useCallback((studioId: string) => {
    setStudiosCache((current) => ({
      data: current.data.filter((studio) => studio._id !== studioId),
      updatedAt: Date.now(),
    }));
  }, [setStudiosCache]);

  const updateStudio = useCallback(
    (studioId: string, updates: Partial<StudioSnapshot>) => {
      setStudiosCache((current) => ({
        data: current.data.map((studio) =>
          studio._id === studioId ? { ...studio, ...updates } : studio,
        ),
        updatedAt: Date.now(),
      }));
    },
    [setStudiosCache],
  );

  const invalidateStudios = useCallback(() => {
    setStudiosCache((current) => ({
      ...current,
      updatedAt: 0,
    }));
  }, [setStudiosCache]);

  const setLinkedAccounts = useCallback(
    (studioId: string, accounts: LinkedAccountsSnapshot) => {
      setLinkedAccountsCache((current) => ({
        ...current,
        [studioId]: {
          data: accounts,
          updatedAt: Date.now(),
        },
      }));
    },
    [setLinkedAccountsCache],
  );

  const invalidateLinkedAccounts = useCallback(
    (studioId: string) => {
      setLinkedAccountsCache((current) => {
        const existing = current[studioId];
        if (!existing) return current;

        return {
          ...current,
          [studioId]: {
            ...existing,
            updatedAt: 0,
          },
        };
      });
    },
    [setLinkedAccountsCache],
  );

  return useMemo(
    () => ({
      replaceStudios,
      upsertStudio,
      removeStudio,
      updateStudio,
      invalidateStudios,
      setLinkedAccounts,
      invalidateLinkedAccounts,
    }),
    [
      replaceStudios,
      upsertStudio,
      removeStudio,
      updateStudio,
      invalidateStudios,
      setLinkedAccounts,
      invalidateLinkedAccounts,
    ],
  );
}
