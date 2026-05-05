"use client";

import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { PlatformCard } from "./_components/PlatformCard"; // Make sure your path is correct

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const studios = useQuery(api.studios.getMyStudios);
  const currentStudio = studios?.[0]; 

  const linkedAccounts = useQuery(
    api.auth.getStudioLinkedAccounts, 
    currentStudio ? { studioId: currentStudio._id } : "skip"
  );

  // const completeOnboardingMutation = useMutation(api.auth.markOnboardingComplete);

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // await completeOnboardingMutation(); 
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to finish onboarding.");
      setLoading(false);
    }
  };

  const handleAddAccount = (platform: string) => {
    if (!currentStudio) return toast.error("Studio not found.");

    // Pass studioId as query parameter to OAuth auth endpoint
    const authUrl = `/api/onboarding/${platform}/auth?studioId=${currentStudio._id}`;
    window.location.href = authUrl;
  };

  if (studios === undefined) {
    return <div className="min-h-screen bg-bg flex items-center justify-center">Loading...</div>;
  }

  // Security Fallback: If they somehow got here without a studio, send them back to setup
  if (studios.length === 0) {
    router.push("/setup");
    return null;
  }

  return (
    <div className="min-h-screen bg-bg p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Connect {currentStudio!.name}</h1>
          <p className="text-muted-foreground text-lg">
            Link your accounts to automate publishing. <br/>
            <span className="text-sm text-gray-500">(You can skip this and link them later from your Dashboard Settings).</span>
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(["instagram", "youtube", "x", "tiktok", "snapchat"] as const).map((platform) => (
            <PlatformCard
              key={platform}
              platform={platform}
              isLinked={(linkedAccounts?.[platform]?.length ?? 0) > 0}
              linkedAccounts={linkedAccounts?.[platform] ?? []}
              onAddAccount={() => handleAddAccount(platform)}
              isLoading={loading || linkedAccounts === undefined}
            />
          ))}
        </section>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/5 mt-12">
          <Button
            variant="ghost"
            onClick={completeOnboarding}
            disabled={loading}
            className="text-gray-400 hover:text-white h-12 px-8"
          >
            Skip for now
          </Button>

          <Button
            onClick={completeOnboarding}
            disabled={loading}
            className="bg-white text-black hover:bg-gray-200 font-bold h-12 px-10 rounded-full"
          >
            {loading ? "Finalizing..." : "Enter Command Center"}
          </Button>
        </div>
      </div>
    </div>
  );
}