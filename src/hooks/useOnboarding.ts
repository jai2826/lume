"use client";

import { useConvex } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface LinkedAccounts {
  instagram: Array<{ accountName: string; _id: string }>;
  youtube: Array<{ accountName: string; _id: string }>;
  x: Array<{ accountName: string; _id: string }>;
  tiktok: Array<{ accountName: string; _id: string }>;
  snapchat: Array<{ accountName: string; _id: string }>;
}

interface UseOnboardingReturn {
  linkedAccounts: LinkedAccounts | null;
  loading: boolean;
  error: string | null;
  fetchLinkedAccounts: () => Promise<void>;
  handleSkip: () => Promise<void>;
  handleDone: () => Promise<void>;
  handleClose: () => void;
}

/**
 * Custom hook for managing onboarding state and actions
 * Fetches linked accounts from Convex and manages skip/done actions
 */
export function useOnboarding(userId: string | null): UseOnboardingReturn {
  const convex = useConvex();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccounts | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch linked accounts on mount and when userId changes
  const fetchLinkedAccounts = async () => {
    if (!userId) return;

    try {
      setError(null);
      const accounts = await convex.query(api.auth.getStudioLinkedAccounts, {
        studioId: userId as Id<"studios">,
      });

      const normalized: LinkedAccounts = {
        instagram: accounts?.instagram ?? [],
        youtube: accounts?.youtube ?? [],
        x: accounts?.x ?? [],
        tiktok: accounts?.tiktok ?? [],
        snapchat: accounts?.snapchat ?? [],
      };

      setLinkedAccounts(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch accounts";
      setError(message);
      console.error("Error fetching linked accounts:", err);
    }
  };

  useEffect(() => {
    fetchLinkedAccounts();
  }, [userId, convex]);

  // Handle skip onboarding
  const handleSkip = async () => {
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete onboarding";
      setError(message);
      console.error("Error completing onboarding:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle done (requires at least one linked account)
  const handleDone = async () => {
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    // Check if at least one account is linked
    const hasAccounts =
      linkedAccounts &&
      (linkedAccounts.instagram.length > 0 ||
        linkedAccounts.youtube.length > 0 ||
        linkedAccounts.x.length > 0 ||
        linkedAccounts.tiktok.length > 0 ||
        linkedAccounts.snapchat.length > 0);

    if (!hasAccounts) {
      setError("Please link at least one account to continue");
      return;
    }

    setLoading(true);
    try {
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete onboarding";
      setError(message);
      console.error("Error completing onboarding:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle close modal (no action needed)
  const handleClose = () => {
    // Just closes the modal, doesn't mark onboarding complete
    // This is handled in the component
  };

  return {
    linkedAccounts,
    loading,
    error,
    fetchLinkedAccounts,
    handleSkip,
    handleDone,
    handleClose,
  };
}
