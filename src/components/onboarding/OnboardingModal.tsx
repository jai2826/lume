"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlatformCard } from "./PlatformCard";
import { toast } from "sonner"; // Assuming you use shadcn sonner

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
  const [convexUser, setConvexUser] = useState<any>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccounts>(emptyLinkedAccounts());
  useEffect(() => {
    const initUser = async () => {
      const user = await convex.query(api.auth.getUserByClerkId, { clerkId: clerkUserId });
      if (user) {
        setConvexUser(user);
        const accounts = await convex.query(api.auth.getUserLinkedAccounts, { clerkId: clerkUserId });
        setLinkedAccounts(accounts ? normalizeLinkedAccounts(accounts) : emptyLinkedAccounts());
      }
    };
    initUser();
  }, [clerkUserId, convex]);

  // 2. Handle Finalizing Onboarding
  const completeOnboarding = async () => {
    if (!convexUser) return;
    setLoading(true);
    try {
      await convex.mutation(api.auth.markOnboardingComplete, {
        userId: convexUser._id,
      });
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to save progress.");
      setLoading(false);
    }
  };

  const handleAddAccount = (platform: string) => {
    // Standard OAuth Redirect
    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${window.location.origin}/api/auth/${platform}/callback`;
    
    if (platform === "youtube") {
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/youtube.upload&response_type=code&state=${state}&access_type=offline&prompt=consent`;
    }
    // Add other platform URLs here...
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-2xl p-8 md:p-12 bg-card border-white/5 rounded-[32px]">
        <DialogHeader className="text-center space-y-4">
          <DialogTitle className="text-3xl font-bold tracking-tighter">
            Link Your Social Studio
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground">
            Connect your accounts to generate and publish content across platforms.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 my-8">
          {(["instagram", "youtube", "x", "tiktok"] as const).map((platform) => (
            <PlatformCard
              key={platform}
              platform={platform}
              isLinked={linkedAccounts[platform]?.length > 0}
              linkedAccounts={linkedAccounts[platform]}
              onAddAccount={() => handleAddAccount(platform)}
              isLoading={loading}
            />
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 pt-6 border-t border-white/5">
          <Button
            variant="ghost"
            onClick={completeOnboarding}
            disabled={loading}
            className="text-muted-foreground hover:text-white h-12 px-8"
          >
            I'll do this later
          </Button>

          <Button
            onClick={completeOnboarding}
            disabled={loading}
            className="bg-white text-black hover:bg-gray-200 font-bold h-12 px-10 rounded-full"
          >
            {loading ? "Saving..." : "Done"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}