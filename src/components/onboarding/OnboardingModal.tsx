"use client";

import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { useConvex } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PlatformCard } from "./PlatformCard";

interface OnboardingModalProps {
  clerkUserId: string;
}

interface LinkedAccounts {
  instagram: Array<{ accountName: string; _id: string }>;
  youtube: Array<{ accountName: string; _id: string }>;
  x: Array<{ accountName: string; _id: string }>;
  tiktok: Array<{ accountName: string; _id: string }>;
  snapchat: Array<{ accountName: string; _id: string }>;
}

const emptyLinkedAccounts = (): LinkedAccounts => ({
  instagram: [],
  youtube: [],
  x: [],
  tiktok: [],
  snapchat: [],
});

type LinkedAccountsResponse = Partial<LinkedAccounts> &
  Record<string, Array<{ accountName: string; _id: string }> | undefined>;

const normalizeLinkedAccounts = (accounts: LinkedAccountsResponse): LinkedAccounts => ({
  instagram: accounts.instagram ?? [],
  youtube: accounts.youtube ?? [],
  x: accounts.x ?? [],
  tiktok: accounts.tiktok ?? [],
  snapchat: accounts.snapchat ?? [],
});

export function OnboardingModal({ clerkUserId }: OnboardingModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convex = useConvex();
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccounts>(emptyLinkedAccounts());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // TODO: Once Convex auth middleware is set up, fetch userId from user doc
  // For now, we'll use a placeholder approach
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from Convex by clerkId
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        // TODO: Replace with proper Convex query once auth context is available
        // For MVP, we'll store userId in localStorage or sessionStorage
        const storedUserId = sessionStorage.getItem(`convex_user_${clerkUserId}`);
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error("Failed to fetch user ID:", error);
      }
    };

    fetchUserId();
  }, [clerkUserId]);

  // Fetch linked accounts when userId is available
  useEffect(() => {
    if (!userId) return;

    const fetchAccounts = async () => {
      try {
        const accounts = await convex.query(api.auth.getUserLinkedAccounts, {
          userId: userId as any, // Type will be properly typed with Convex auth
        });
        setLinkedAccounts(normalizeLinkedAccounts(accounts as LinkedAccountsResponse));
      } catch (error) {
        console.error("Failed to fetch linked accounts:", error);
      }
    };

    fetchAccounts();
  }, [userId, convex]);

  // Check for OAuth success/error in query params
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const platform = searchParams.get("platform");

    if (success && platform && userId) {
      // Try to save OAuth token from cookies to Convex
      saveOAuthTokenToConvex(platform, userId);
    } else if (error && platform) {
      setToast({
        message: `✗ Failed to link ${platform}. Please try again.`,
        type: "error",
      });

      // Clear query params
      window.history.replaceState({}, "", "/onboarding");

      // Auto-hide toast after 5 seconds
      setTimeout(() => setToast(null), 5000);
    }
  }, [searchParams, userId, convex]);

  // Function to save OAuth token from cookies to Convex
  const saveOAuthTokenToConvex = async (platform: string, userId: string) => {
    try {
      // Get account name from cookies
      const accountNameCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`oauth_account_${platform}=`));
      
      const accountName = accountNameCookie
        ? decodeURIComponent(accountNameCookie.split("=")[1])
        : `${platform} Account`;

      // Call API to save token to Convex
      const response = await fetch("/api/onboarding/save-oauth-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, accountName, userId }),
      });

      if (response.ok) {
        setToast({
          message: `✓ ${platform.charAt(0).toUpperCase() + platform.slice(1)} account linked!`,
          type: "success",
        });

        // Refetch accounts after successful save
        const accounts = await convex.query(api.auth.getUserLinkedAccounts, {
          userId: userId as any,
        });
        setLinkedAccounts(normalizeLinkedAccounts(accounts as LinkedAccountsResponse));

        // Clear query params
        window.history.replaceState({}, "", "/onboarding");

        // Auto-hide toast after 3 seconds
        setTimeout(() => setToast(null), 3000);
      } else {
        const errorData = await response.json();
        setToast({
          message: `✗ Failed to save account: ${errorData.error || "Unknown error"}`,
          type: "error",
        });

        // Clear query params
        window.history.replaceState({}, "", "/onboarding");

        // Auto-hide toast after 5 seconds
        setTimeout(() => setToast(null), 5000);
      }
    } catch (error) {
      console.error("Error saving OAuth token:", error);
      setToast({
        message: "✗ Failed to link account. Please try again.",
        type: "error",
      });

      // Clear query params
      window.history.replaceState({}, "", "/onboarding");

      // Auto-hide toast after 5 seconds
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Check if at least one account is linked
  const hasLinkedAccounts =
    linkedAccounts.instagram.length > 0 ||
    linkedAccounts.youtube.length > 0 ||
    linkedAccounts.x.length > 0 ||
    linkedAccounts.tiktok.length > 0 ||
    linkedAccounts.snapchat.length > 0;

  // Handle skip (mark onboarding complete + redirect)
  const handleSkip = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      await convex.mutation(api.auth.markOnboardingComplete, {
        userId: userId as any,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setToast({
        message: "Error completing onboarding. Please try again.",
        type: "error",
      });
      setLoading(false);
    }
  };

  // Handle done (require at least one account linked)
  const handleDone = async () => {
    if (!hasLinkedAccounts) {
      setToast({
        message: "Please link at least one account to continue.",
        type: "error",
      });
      return;
    }

    if (!userId) return;

    setLoading(true);
    try {
      await convex.mutation(api.auth.markOnboardingComplete, {
        userId: userId as any,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setToast({
        message: "Error completing onboarding. Please try again.",
        type: "error",
      });
      setLoading(false);
    }
  };

  // Handle close (backdrop or X button) - just closes modal
  const handleClose = () => {
    setIsOpen(false);
  };

  // Handle platform add button - redirect to OAuth
  const handleAddAccount = (platform: "instagram" | "youtube" | "x" | "tiktok") => {
    // TODO: Generate CSRF state token and store in session
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem(`oauth_state_${platform}`, state);

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/callback/${platform}`;

    const oauthUrls: Record<string, string> = {
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish&response_type=code&state=${state}`,
      youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/youtube&response_type=code&state=${state}`,
      x: `https://twitter.com/i/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_X_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write&response_type=code&state=${state}`,
      tiktok: `https://www.tiktok.com/v2/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user.info.basic,video.create&response_type=code&state=${state}`,
      snapchat: `https://accounts.snapchat.com/accounts/oauth2/auth?client_id=${process.env.NEXT_PUBLIC_SNAPCHAT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=snapchat+ads+api&response_type=code&state=${state}`,
    };

    window.location.href = oauthUrls[platform];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div className="relative w-full max-w-2xl bg-card rounded-xl border border-muted shadow-2xl overflow-hidden">
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X size={20} className="text-muted" />
              </motion.button>

              {/* Content */}
              <div className="p-8 md:p-12">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center mb-8"
                >
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Link Your Social Studio
                  </h1>
                  <p className="text-sm md:text-base text-muted">
                    Connect your accounts to generate and publish content across platforms
                  </p>
                </motion.div>

                {/* Platform Cards Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 gap-4 md:gap-6 mb-8"
                >
                  {(["instagram", "youtube", "x", "tiktok"] as const).map(
                    (platform, index) => (
                      <motion.div
                        key={platform}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <PlatformCard
                          platform={platform}
                          isLinked={linkedAccounts[platform].length > 0}
                          linkedAccounts={linkedAccounts[platform]}
                          onAddAccount={() => handleAddAccount(platform)}
                          isLoading={loading}
                        />
                      </motion.div>
                    )
                  )}
                </motion.div>

                {/* Toast Notification */}
                <AnimatePresence>
                  {toast && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm font-medium mb-6",
                        toast.type === "success"
                          ? "bg-green-900/30 text-green-200 border border-green-700/50"
                          : "bg-red-900/30 text-red-200 border border-red-700/50"
                      )}
                    >
                      {toast.message}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col-reverse md:flex-row justify-between gap-4 pt-6 border-t border-muted"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSkip}
                    disabled={loading}
                    className={cn(
                      "px-6 py-2 rounded-lg font-medium text-sm transition-all",
                      "border border-muted text-muted hover:text-foreground hover:border-foreground/50",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {loading ? "Loading..." : "I'll do this later"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDone}
                    disabled={loading}
                    className={cn(
                      "px-6 py-2 rounded-lg font-semibold text-sm text-black transition-all",
                      "bg-brand-accent hover:shadow-lg hover:shadow-brand-accent/30",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {loading ? "Loading..." : "Done"}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
